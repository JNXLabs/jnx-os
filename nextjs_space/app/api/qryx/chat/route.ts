/**
 * Qryx Chat API Endpoint
 * 
 * Handles chat messages from Shopify stores
 * Integrates with Gemini AI and manages session state
 * 
 * Flow:
 * 1. Validate shop_id and session_token
 * 2. Load shop and configuration
 * 3. Get or create chat session
 * 4. Load relevant products from Shopify
 * 5. Send to Gemini AI with context
 * 6. Store message and response
 * 7. Track usage
 * 
 * PROTECTED: Do not modify without approval (core business logic)
 */

import { NextRequest, NextResponse } from 'next/server';
import { qryxChat, sanitizeMessage, ProductContext } from '@/lib/ai/gemini';
import {
  getShopifyShopById,
  getChatSession,
  createChatSession,
  addChatMessage,
  getChatMessages,
  getOrCreateQryxConfig,
  incrementConversationUsage,
} from '@/lib/db/qryx-helpers';
import { getProducts } from '@/lib/shopify/client';
import { Logger } from '@/lib/observability/logger';
import crypto from 'crypto';

const logger = new Logger('api/qryx/chat');

// =============================================================================
// TYPES
// =============================================================================

interface ChatRequest {
  shop_id: string;
  session_token?: string;
  message: string;
  customer_name?: string;
  customer_email?: string;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: ChatRequest = await request.json();
    const { shop_id, session_token, message, customer_name, customer_email } = body;

    // Validate required fields
    if (!shop_id || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: shop_id, message' },
        { status: 400 }
      );
    }

    // Sanitize message
    const sanitizedMessage = sanitizeMessage(message);
    if (!sanitizedMessage) {
      return NextResponse.json(
        { error: 'Invalid message content' },
        { status: 400 }
      );
    }

    // Get shop
    const shop = await getShopifyShopById(shop_id);
    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found or not active' },
        { status: 404 }
      );
    }

    // Get or create chat session
    let session = session_token ? await getChatSession(session_token) : null;
    
    if (!session) {
      // Create new session
      const newSessionToken = generateSessionToken();
      const ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      const user_agent = request.headers.get('user-agent');
      const referrer = request.headers.get('referer');

      session = await createChatSession({
        shop_id: shop.id,
        session_token: newSessionToken,
        ip_address: ip_address || undefined,
        user_agent: user_agent || undefined,
        referrer: referrer || undefined,
      });

      // Track new conversation
      await incrementConversationUsage(shop.id);
    }

    // Update customer info if provided
    if (customer_name || customer_email) {
      // Note: Update session with customer info would go here
      // Currently handled by updateChatSession function
    }

    // Get configuration
    const config = await getOrCreateQryxConfig(shop.id);

    // Get conversation history
    const previousMessages = await getChatMessages(session.id, config.max_context_messages);
    const conversationHistory = previousMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Load products (cache for performance)
    let products: ProductContext[] = [];
    try {
      const shopifyProducts = await getProducts(shop.shop_domain, shop.access_token, 20);
      products = shopifyProducts.map(p => ({
        id: p.id,
        title: p.title,
        description: p.body_html?.replace(/<[^>]*>/g, '').substring(0, 200),
        price: parseFloat(p.variants[0]?.price || '0'),
        currency: shop.currency || 'USD',
        available: (p.variants[0]?.inventory_quantity || 0) > 0,
        imageUrl: p.images?.[0]?.src,
        productUrl: `https://${shop.shop_domain}/products/${p.handle}`,
      }));
    } catch (error) {
      logger.error('Failed to fetch products', { shop_id: shop.id, error });
      // Continue without products - AI can still help
    }

    // Save user message
    await addChatMessage({
      session_id: session.id,
      role: 'user',
      content: sanitizedMessage,
    });

    // Get AI response
    const aiResponse = await qryxChat(sanitizedMessage, {
      shopName: shop.shop_name,
      products,
      conversationHistory,
      temperature: config.temperature,
      maxTokens: config.max_tokens,
      systemPrompt: config.system_prompt || undefined,
      customerContext: {
        name: customer_name || session.customer_name || undefined,
        email: customer_email || session.customer_email || undefined,
      },
    });

    // Save AI response
    await addChatMessage({
      session_id: session.id,
      role: 'assistant',
      content: aiResponse.content,
      tokens_used: aiResponse.tokensUsed,
      response_time_ms: aiResponse.responseTimeMs,
    });

    // Calculate total response time
    const totalResponseTime = Date.now() - startTime;

    logger.info('Chat response generated', {
      shop_id: shop.id,
      session_id: session.id,
      message_length: sanitizedMessage.length,
      response_time_ms: totalResponseTime,
      tokens_used: aiResponse.tokensUsed,
    });

    // Return response
    return NextResponse.json({
      session_token: session.session_token,
      response: aiResponse.content,
      response_time_ms: totalResponseTime,
      tokens_used: aiResponse.tokensUsed,
    });
  } catch (error) {
    logger.error('Chat endpoint error', { error });
    
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// OPTIONS HANDLER (CORS)
// =============================================================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate unique session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// =============================================================================
// ROUTE CONFIG
// =============================================================================

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
