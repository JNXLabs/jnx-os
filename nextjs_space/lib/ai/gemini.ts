/**
 * Gemini AI Client for Qryx
 * 
 * Provides chat completion functionality using Google's Gemini 2.0 Flash model.
 * Optimized for e-commerce product recommendations and customer support.
 * 
 * Cost: ~$0.0001 per message (see QRYX_PRICING_STRATEGY.md)
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// =============================================================================
// TYPES
// =============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  conversationHistory?: ChatMessage[];
}

export interface ChatCompletionResponse {
  content: string;
  tokensUsed: number;
  responseTimeMs: number;
  finishReason: string;
}

export interface ProductContext {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  available: boolean;
  imageUrl?: string;
  productUrl?: string;
  product_type?: string;
  vendor?: string;
  tags?: string[];
}

export interface QryxChatOptions extends ChatCompletionOptions {
  shopName: string;
  products?: ProductContext[];
  customerContext?: {
    name?: string;
    email?: string;
    previousOrders?: number;
  };
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash-exp';

// Validate configuration
if (!GEMINI_API_KEY) {
  console.warn(
    '⚠️  GEMINI_API_KEY not found in environment variables. '
    + 'Gemini AI features will not work. '
    + 'Get your API key at https://aistudio.google.com/app/apikey'
  );
}

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

/**
 * Initialize Gemini client
 * Lazy initialization to avoid errors if API key is missing
 */
function initializeGemini(): GenerativeModel {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  if (!model) {
    model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }

  return model;
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Generic chat completion function
 * 
 * @param userMessage - The user's message
 * @param options - Configuration options
 * @returns Chat completion response
 */
export async function chatCompletion(
  userMessage: string,
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResponse> {
  const startTime = Date.now();

  try {
    const model = initializeGemini();

    // Build conversation history
    const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

    // Add conversation history if provided
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      for (const msg of options.conversationHistory) {
        if (msg.role === 'user') {
          history.push({
            role: 'user',
            parts: [{ text: msg.content }]
          });
        } else if (msg.role === 'assistant') {
          history.push({
            role: 'model',
            parts: [{ text: msg.content }]
          });
        }
        // Skip system messages in history (handled via systemInstruction)
      }
    }

    // Start chat session
    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 500,
      },
      ...(options.systemPrompt && {
        systemInstruction: options.systemPrompt
      })
    });

    // Send message
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const text = response.text();

    // Calculate tokens (approximate)
    const tokensUsed = estimateTokens(userMessage) + estimateTokens(text);

    // Calculate response time
    const responseTimeMs = Date.now() - startTime;

    return {
      content: text,
      tokensUsed,
      responseTimeMs,
      finishReason: 'stop'
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to generate chat completion'
    );
  }
}

/**
 * Qryx-specific chat function
 * Optimized for e-commerce product recommendations
 * 
 * @param userMessage - Customer's message
 * @param options - Qryx-specific options
 * @returns Chat completion response
 */
export async function qryxChat(
  userMessage: string,
  options: QryxChatOptions
): Promise<ChatCompletionResponse> {
  // Build system prompt with shop context
  const systemPrompt = buildQryxSystemPrompt(options);

  // Add product context to user message if products are provided
  let enhancedMessage = userMessage;
  if (options.products && options.products.length > 0) {
    const productContext = buildProductContext(options.products);
    enhancedMessage = `${userMessage}\n\nAvailable Products:\n${productContext}`;
  }

  return chatCompletion(enhancedMessage, {
    systemPrompt,
    temperature: options.temperature ?? 0.7,
    maxTokens: options.maxTokens ?? 500,
    conversationHistory: options.conversationHistory
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Build Qryx system prompt with shop context
 */
function buildQryxSystemPrompt(options: QryxChatOptions): string {
  const { shopName, customerContext } = options;

  let prompt = `You are Qryx, an AI sales assistant for ${shopName}. `;
  prompt += `Your role is to help customers find products, answer questions, and provide excellent service. `;
  prompt += `\n\nGuidelines:\n`;
  prompt += `- Be friendly, helpful, and professional\n`;
  prompt += `- Recommend products based on customer needs\n`;
  prompt += `- If a product is unavailable, suggest alternatives\n`;
  prompt += `- Keep responses concise (2-3 sentences unless more detail is requested)\n`;
  prompt += `- Use emojis sparingly to add personality\n`;
  prompt += `- Never make up product information\n`;
  prompt += `- If you don't know something, be honest and offer to help another way\n`;

  if (customerContext?.name) {
    prompt += `\n\nCustomer name: ${customerContext.name}`;
  }

  if (customerContext?.previousOrders && customerContext.previousOrders > 0) {
    prompt += `\nCustomer has ${customerContext.previousOrders} previous order(s).`;
  }

  return prompt;
}

/**
 * Build enhanced product context string for AI
 * Now includes product type, vendor, tags, and availability
 */
function buildProductContext(products: ProductContext[]): string {
  return products
    .map((p, idx) => {
      let context = `${idx + 1}. **${p.title}**`;
      
      // Price and availability
      if (p.price) {
        context += `\n   Price: ${p.currency} ${p.price.toFixed(2)}`;
      }
      
      if (!p.available) {
        context += ` ❌ OUT OF STOCK`;
      } else {
        context += ` ✅ In Stock`;
      }
      
      // Category/Type
      if (p.product_type) {
        context += `\n   Category: ${p.product_type}`;
      }
      
      // Vendor/Brand
      if (p.vendor) {
        context += `\n   Brand: ${p.vendor}`;
      }
      
      // Tags (keywords)
      if (p.tags && p.tags.length > 0) {
        context += `\n   Tags: ${p.tags.slice(0, 5).join(', ')}`;
      }
      
      // Description
      if (p.description) {
        const cleanDesc = p.description
          .replace(/<[^>]*>/g, '') // Remove HTML
          .trim();
        if (cleanDesc) {
          context += `\n   Description: ${cleanDesc.substring(0, 200)}${cleanDesc.length > 200 ? '...' : ''}`;
        }
      }
      
      // Product URL
      if (p.productUrl) {
        context += `\n   Link: ${p.productUrl}`;
      }
      
      return context;
    })
    .join('\n\n');
}

/**
 * Estimate token count (approximate)
 * Rule of thumb: 1 token ≈ 4 characters in English
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate cost for a given number of tokens
 * Based on Gemini 2.0 Flash pricing
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST_PER_MILLION = 0.075;  // $0.075 per 1M tokens
  const OUTPUT_COST_PER_MILLION = 0.30;  // $0.30 per 1M tokens

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  return inputCost + outputCost;
}

/**
 * Validate and sanitize user message
 */
export function sanitizeMessage(message: string): string {
  // Remove excessive whitespace
  let sanitized = message.trim().replace(/\s+/g, ' ');

  // Limit length (prevent abuse)
  const MAX_LENGTH = 2000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

/**
 * Extract product mentions from message
 * Simple keyword matching - can be improved with NLP
 */
export function extractProductMentions(message: string): string[] {
  // Simple implementation - looks for product-related keywords
  const keywords = ['product', 'item', 'buy', 'purchase', 'price', 'cost', 'available'];
  const mentions: string[] = [];

  const lowerMessage = message.toLowerCase();
  for (const keyword of keywords) {
    if (lowerMessage.includes(keyword)) {
      mentions.push(keyword);
    }
  }

  return mentions;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  chatCompletion,
  qryxChat,
  isGeminiConfigured,
  calculateCost,
  sanitizeMessage,
  extractProductMentions
};
