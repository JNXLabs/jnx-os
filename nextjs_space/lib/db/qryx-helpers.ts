/**
 * Qryx Database Helpers
 * 
 * CRUD operations for Qryx-specific tables
 * Integrates with JNX-OS via org_id foreign keys
 */

import { createSupabaseServerClient } from '../supabase/server';
import { redactAll } from '../privacy/redaction';
import type { ProductContext } from '../ai/gemini';

// =============================================================================
// TYPES
// =============================================================================

export interface ShopifyShop {
  id: string;
  org_id: string;
  shop_domain: string;
  shop_name: string;
  shop_email: string | null;
  shop_owner_name: string | null;
  access_token: string;
  scope: string;
  installed_at: string;
  uninstalled_at: string | null;
  plan_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  shopify_charge_id: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  shopify_plan: string | null;
  country_code: string | null;
  currency: string | null;
  timezone: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QryxChatSession {
  id: string;
  shop_id: string;
  user_id: string | null;
  session_token: string;
  customer_email: string | null;
  customer_name: string | null;
  started_at: string;
  ended_at: string | null;
  last_message_at: string | null;
  status: 'active' | 'ended' | 'abandoned';
  resulted_in_order: boolean;
  order_id: string | null;
  order_value: number | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
  updated_at: string;
}

export interface QryxChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number | null;
  response_time_ms: number | null;
  recommended_products: any | null;
  sentiment: string | null;
  sentiment_score: number | null;
  contains_pii: boolean;
  redacted_fields: any | null;
  created_at: string;
}

export interface QryxConfig {
  id: string;
  shop_id: string;
  bot_name: string;
  bot_greeting: string;
  bot_avatar_url: string | null;
  widget_position: string;
  primary_color: string;
  secondary_color: string;
  show_product_images: boolean;
  enable_order_tracking: boolean;
  enable_cart_recovery: boolean;
  max_context_messages: number;
  system_prompt: string | null;
  temperature: number;
  max_tokens: number;
  custom_prompts: any;
  ab_test_enabled: boolean;
  ab_test_variants: any;
  business_hours: any | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// SHOPIFY SHOP OPERATIONS
// =============================================================================

/**
 * Create or update Shopify shop
 * Links shop to JNX-OS organization
 */
export async function upsertShopifyShop(data: {
  org_id: string;
  shop_domain: string;
  shop_name: string;
  shop_email?: string;
  shop_owner_name?: string;
  access_token: string;
  scope: string;
  shopify_plan?: string;
  country_code?: string;
  currency?: string;
  timezone?: string;
}): Promise<ShopifyShop> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data: shop, error } = await supabase
    .from('shopify_shops')
    .upsert(
      {
        org_id: data.org_id,
        shop_domain: data.shop_domain,
        shop_name: data.shop_name,
        shop_email: data.shop_email || null,
        shop_owner_name: data.shop_owner_name || null,
        access_token: data.access_token,
        scope: data.scope,
        shopify_plan: data.shopify_plan || null,
        country_code: data.country_code || null,
        currency: data.currency || null,
        timezone: data.timezone || null,
        installed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'shop_domain',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error('[Qryx] Failed to upsert shopify shop:', error.message);
    throw new Error('Failed to save Shopify shop');
  }

  return shop as ShopifyShop;
}

/**
 * Get Shopify shop by domain
 */
export async function getShopifyShop(shop_domain: string): Promise<ShopifyShop | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }


  const { data: shop, error } = await supabase
    .from('shopify_shops')
    .select('*')
    .eq('shop_domain', shop_domain)
    .is('deleted_at', null)
    .is('uninstalled_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[Qryx] Failed to get shopify shop:', error.message);
    throw new Error('Failed to retrieve Shopify shop');
  }

  return shop as ShopifyShop;
}

/**
 * Get Shopify shop by org_id
 */
export async function getShopifyShopByOrg(org_id: string): Promise<ShopifyShop | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }


  const { data: shop, error } = await supabase
    .from('shopify_shops')
    .select('*')
    .eq('org_id', org_id)
    .is('deleted_at', null)
    .is('uninstalled_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[Qryx] Failed to get shopify shop by org:', error.message);
    throw new Error('Failed to retrieve Shopify shop');
  }

  return shop as ShopifyShop;
}

/**
 * Mark shop as uninstalled (soft delete)
 */
export async function uninstallShopifyShop(shop_domain: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }


  const { error } = await supabase
    .from('shopify_shops')
    .update({
      uninstalled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('shop_domain', shop_domain);

  if (error) {
    console.error('[Qryx] Failed to uninstall shop:', error.message);
    throw new Error('Failed to uninstall Shopify shop');
  }
}

// =============================================================================
// CHAT SESSION OPERATIONS
// =============================================================================

/**
 * Create new chat session
 */
export async function createChatSession(data: {
  shop_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
}): Promise<QryxChatSession> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }


  const { data: session, error } = await supabase
    .from('qryx_chat_sessions')
    .insert({
      shop_id: data.shop_id,
      session_token: data.session_token,
      ip_address: data.ip_address || null,
      user_agent: data.user_agent || null,
      referrer: data.referrer || null,
      status: 'active',
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[Qryx] Failed to create chat session:', error.message);
    throw new Error('Failed to create chat session');
  }

  return session as QryxChatSession;
}

/**
 * Get chat session by token
 */
export async function getChatSession(session_token: string): Promise<QryxChatSession | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }


  const { data: session, error } = await supabase
    .from('qryx_chat_sessions')
    .select('*')
    .eq('session_token', session_token)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[Qryx] Failed to get chat session:', error.message);
    throw new Error('Failed to retrieve chat session');
  }

  return session as QryxChatSession;
}

/**
 * Update chat session
 */
export async function updateChatSession(
  session_id: string,
  updates: Partial<QryxChatSession>
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }


  const { error } = await supabase
    .from('qryx_chat_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session_id);

  if (error) {
    console.error('[Qryx] Failed to update chat session:', error.message);
    throw new Error('Failed to update chat session');
  }
}

// =============================================================================
// CHAT MESSAGE OPERATIONS
// =============================================================================

/**
 * Add message to chat session
 */
export async function addChatMessage(data: {
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  response_time_ms?: number;
  recommended_products?: ProductContext[];
}): Promise<QryxChatMessage> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }


  const { data: message, error } = await supabase
    .from('qryx_chat_messages')
    .insert({
      session_id: data.session_id,
      role: data.role,
      content: data.content,
      tokens_used: data.tokens_used || null,
      response_time_ms: data.response_time_ms || null,
      recommended_products: data.recommended_products || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[Qryx] Failed to add chat message:', error.message);
    throw new Error('Failed to save chat message');
  }

  // Update session's last_message_at
  await supabase
    .from('qryx_chat_sessions')
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.session_id);

  return message as QryxChatMessage;
}

/**
 * Get messages for a session
 */
export async function getChatMessages(session_id: string, limit: number = 50): Promise<QryxChatMessage[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }


  const { data: messages, error } = await supabase
    .from('qryx_chat_messages')
    .select('*')
    .eq('session_id', session_id)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[Qryx] Failed to get chat messages:', error.message);
    throw new Error('Failed to retrieve chat messages');
  }

  return messages as QryxChatMessage[];
}

// =============================================================================
// CONFIGURATION OPERATIONS
// =============================================================================

/**
 * Get or create Qryx config for shop
 */
export async function getOrCreateQryxConfig(shop_id: string): Promise<QryxConfig> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }


  // Try to get existing config
  const { data: existing, error: getError } = await supabase
    .from('qryx_config')
    .select('*')
    .eq('shop_id', shop_id)
    .single();

  if (existing) {
    return existing as QryxConfig;
  }

  // Create default config if not exists
  const { data: config, error: createError } = await supabase
    .from('qryx_config')
    .insert({
      shop_id,
      bot_name: 'Qryx',
      bot_greeting: 'Hi! How can I help you today?',
      widget_position: 'bottom-right',
      primary_color: '#06b6d4',
      secondary_color: '#0891b2',
      show_product_images: true,
      enable_order_tracking: true,
      enable_cart_recovery: false,
      max_context_messages: 10,
      temperature: 0.7,
      max_tokens: 500,
      custom_prompts: [],
      ab_test_enabled: false,
      ab_test_variants: [],
    })
    .select()
    .single();

  if (createError) {
    console.error('[Qryx] Failed to create config:', createError.message);
    throw new Error('Failed to create Qryx configuration');
  }

  return config as QryxConfig;
}

/**
 * Update Qryx config
 */
export async function updateQryxConfig(
  shop_id: string,
  updates: Partial<QryxConfig>
): Promise<QryxConfig> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }


  const { data: config, error } = await supabase
    .from('qryx_config')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('shop_id', shop_id)
    .select()
    .single();

  if (error) {
    console.error('[Qryx] Failed to update config:', error.message);
    throw new Error('Failed to update Qryx configuration');
  }

  return config as QryxConfig;
}

// =============================================================================
// USAGE TRACKING OPERATIONS
// =============================================================================

/**
 * Increment conversation usage
 */
export async function incrementConversationUsage(shop_id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }


  // Get current billing period
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get or create usage record
  const { data: existing } = await supabase
    .from('conversation_usage')
    .select('*')
    .eq('shop_id', shop_id)
    .eq('billing_period_start', periodStart.toISOString().split('T')[0])
    .single();

  if (existing) {
    // Increment existing
    await supabase
      .from('conversation_usage')
      .update({
        conversations_used: existing.conversations_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Create new
    const shop = await supabase
      .from('shopify_shops')
      .select('plan_tier')
      .eq('id', shop_id)
      .single();

    const conversationsIncluded = getConversationsForPlan(shop.data?.plan_tier || 'trial');

    await supabase.from('conversation_usage').insert({
      shop_id,
      billing_period_start: periodStart.toISOString().split('T')[0],
      billing_period_end: periodEnd.toISOString().split('T')[0],
      conversations_included: conversationsIncluded,
      conversations_used: 1,
    });
  }
}

/**
 * Get conversations included in plan
 */
function getConversationsForPlan(plan_tier: string): number {
  const plans: Record<string, number> = {
    trial: 50,
    basic: 500,
    pro: 2000,
    business: 5000,
    enterprise: 15000,
  };
  return plans[plan_tier] || 50;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  upsertShopifyShop,
  getShopifyShop,
  getShopifyShopByOrg,
  uninstallShopifyShop,
  createChatSession,
  getChatSession,
  updateChatSession,
  addChatMessage,
  getChatMessages,
  getOrCreateQryxConfig,
  updateQryxConfig,
  incrementConversationUsage,
};
