/**
 * Shopify API Client for Qryx
 * 
 * Handles OAuth, API requests, and webhook verification
 * Integrates with Clerk for user/org management
 */

import '@shopify/shopify-api/adapters/node';
import { shopifyApi, Session, ApiVersion } from '@shopify/shopify-api';
import crypto from 'crypto';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || '';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const SHOPIFY_APP_URL = process.env.SHOPIFY_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES || 'read_products,read_orders,write_script_tags';

// Lazy-initialize Shopify API to avoid build errors when credentials are missing
let shopifyInstance: ReturnType<typeof shopifyApi> | null = null;

function getShopify() {
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
    // Return a safe default during build
    console.warn(
      '⚠️ Shopify API credentials not configured. '
      + 'Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET in .env'
    );
    // Return minimal mock during build
    if (process.env.NODE_ENV !== 'production' && !shopifyInstance) {
      return null;
    }
    throw new Error(
      'Shopify API credentials not configured. '
      + 'Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET in .env'
    );
  }

  if (!shopifyInstance) {
    shopifyInstance = shopifyApi({
      apiKey: SHOPIFY_API_KEY,
      apiSecretKey: SHOPIFY_API_SECRET,
      scopes: SHOPIFY_SCOPES.split(','),
      hostName: SHOPIFY_APP_URL.replace(/https?:\/\//, ''),
      hostScheme: SHOPIFY_APP_URL.startsWith('https') ? 'https' : 'http',
      apiVersion: ApiVersion.October24,
      isEmbeddedApp: false, // Qryx works as standalone app
      isCustomStoreApp: false,
    });
  }

  return shopifyInstance;
}

// Check if Shopify is configured
export function isShopifyConfigured(): boolean {
  return !!(SHOPIFY_API_KEY && SHOPIFY_API_SECRET);
}

// Export for backward compatibility - safe lazy getters
export const shopify = {
  get auth() {
    const instance = getShopify();
    if (!instance) throw new Error('Shopify not configured');
    return instance.auth;
  },
  get clients() {
    const instance = getShopify();
    if (!instance) throw new Error('Shopify not configured');
    return instance.clients;
  },
  get utils() {
    const instance = getShopify();
    if (!instance) throw new Error('Shopify not configured');
    return instance.utils;
  },
};

// =============================================================================
// TYPES
// =============================================================================

export interface ShopifyShop {
  id: string;
  name: string;
  email: string;
  domain: string;
  plan_name: string;
  country_code: string;
  currency: string;
  timezone: string;
  shop_owner?: string;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  variants: {
    id: string;
    title: string;
    price: string;
    compare_at_price?: string;
    inventory_quantity: number;
  }[];
  images?: {
    id: string;
    src: string;
  }[];
  handle: string;
}

// =============================================================================
// OAUTH FUNCTIONS
// =============================================================================

/**
 * Generate OAuth authorization URL
 * Step 1 of Shopify OAuth flow
 */
export async function getAuthorizationUrl(
  shop: string,
  state: string
): Promise<string> {
  // Simple sanitization without calling shopify API at build time
  const sanitizedShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  const redirectUri = `${SHOPIFY_APP_URL}/api/qryx/callback`;
  
  const authUrl = new URL(`https://${sanitizedShop}/admin/oauth/authorize`);
  authUrl.searchParams.set('client_id', SHOPIFY_API_KEY);
  authUrl.searchParams.set('scope', SHOPIFY_SCOPES);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('grant_options[]', 'offline'); // Offline access token

  return authUrl.toString();
}

/**
 * Validate OAuth callback and exchange code for access token
 * Step 2 of Shopify OAuth flow
 */
export async function validateOAuthCallback(
  shop: string,
  code: string,
  state: string
): Promise<{
  accessToken: string;
  scope: string;
}> {
  // Simple sanitization without calling shopify API at build time
  const sanitizedShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  
  // Exchange code for access token
  const tokenUrl = `https://${sanitizedShop}/admin/oauth/access_token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange OAuth code: ${response.statusText}`);
  }

  const data = await response.json() as {
    access_token: string;
    scope: string;
  };

  return {
    accessToken: data.access_token,
    scope: data.scope,
  };
}

/**
 * Create Shopify session object
 * Used for making authenticated API requests
 */
export function createSession(
  shop: string,
  accessToken: string
): Session {
  return new Session({
    id: `offline_${shop}`,
    shop,
    state: 'offline',
    isOnline: false,
    accessToken,
  });
}

// =============================================================================
// API REQUEST FUNCTIONS
// =============================================================================

/**
 * Fetch shop information
 */
export async function getShopInfo(
  shop: string,
  accessToken: string
): Promise<ShopifyShop> {
  const session = createSession(shop, accessToken);
  const client = new shopify.clients.Rest({ session });

  const response = await client.get({
    path: 'shop',
  });

  const shopData = response.body as { shop: ShopifyShop };
  return shopData.shop;
}

/**
 * Fetch products from Shopify store
 */
export async function getProducts(
  shop: string,
  accessToken: string,
  limit: number = 50
): Promise<ShopifyProduct[]> {
  const session = createSession(shop, accessToken);
  const client = new shopify.clients.Rest({ session });

  const response = await client.get({
    path: 'products',
    query: { limit: limit.toString() },
  });

  const productsData = response.body as { products: ShopifyProduct[] };
  return productsData.products;
}

/**
 * Search products by query
 */
export async function searchProducts(
  shop: string,
  accessToken: string,
  query: string
): Promise<ShopifyProduct[]> {
  const session = createSession(shop, accessToken);
  const client = new shopify.clients.Rest({ session });

  const response = await client.get({
    path: 'products',
    query: { title: query, limit: '10' },
  });

  const productsData = response.body as { products: ShopifyProduct[] };
  return productsData.products;
}

/**
 * Install Qryx chat widget as Script Tag
 * This injects the widget into the Shopify storefront
 */
export async function installChatWidget(
  shop: string,
  accessToken: string,
  shopId: string
): Promise<string> {
  const session = createSession(shop, accessToken);
  const client = new shopify.clients.Rest({ session });

  // FIXED: Use API endpoint, not static file
  const widgetUrl = `${SHOPIFY_APP_URL}/api/widget/qryx?shop_id=${shopId}`;

  const response = await client.post({
    path: 'script_tags',
    data: {
      script_tag: {
        event: 'onload',
        src: widgetUrl,
        display_scope: 'online_store',
      },
    },
  });

  const scriptTagData = response.body as { script_tag: { id: string } };
  return scriptTagData.script_tag.id;
}

/**
 * Uninstall chat widget
 */
export async function uninstallChatWidget(
  shop: string,
  accessToken: string,
  scriptTagId: string
): Promise<void> {
  const session = createSession(shop, accessToken);
  const client = new shopify.clients.Rest({ session });

  await client.delete({
    path: `script_tags/${scriptTagId}`,
  });
}

// =============================================================================
// BILLING FUNCTIONS
// =============================================================================

/**
 * Create recurring charge (subscription)
 */
export async function createRecurringCharge(
  shop: string,
  accessToken: string,
  plan: {
    name: string;
    price: number;
    trialDays?: number;
  }
): Promise<{
  chargeId: string;
  confirmationUrl: string;
}> {
  const session = createSession(shop, accessToken);
  const client = new shopify.clients.Rest({ session });

  const response = await client.post({
    path: 'recurring_application_charges',
    data: {
      recurring_application_charge: {
        name: plan.name,
        price: plan.price,
        return_url: `${SHOPIFY_APP_URL}/app/qryx/billing/confirm`,
        trial_days: plan.trialDays || 0,
        test: process.env.NODE_ENV !== 'production', // Test mode in dev
      },
    },
  });

  const chargeData = response.body as {
    recurring_application_charge: {
      id: string;
      confirmation_url: string;
    };
  };

  return {
    chargeId: chargeData.recurring_application_charge.id,
    confirmationUrl: chargeData.recurring_application_charge.confirmation_url,
  };
}

/**
 * Activate recurring charge after merchant approval
 */
export async function activateRecurringCharge(
  shop: string,
  accessToken: string,
  chargeId: string
): Promise<void> {
  const session = createSession(shop, accessToken);
  const client = new shopify.clients.Rest({ session });

  await client.post({
    path: `recurring_application_charges/${chargeId}/activate`,
    data: {},
  });
}

/**
 * Create usage charge (for overage billing)
 */
export async function createUsageCharge(
  shop: string,
  accessToken: string,
  chargeId: string,
  amount: number,
  description: string
): Promise<void> {
  const session = createSession(shop, accessToken);
  const client = new shopify.clients.Rest({ session });

  await client.post({
    path: `recurring_application_charges/${chargeId}/usage_charges`,
    data: {
      usage_charge: {
        description,
        price: amount,
      },
    },
  });
}

// =============================================================================
// WEBHOOK FUNCTIONS
// =============================================================================

/**
 * Verify Shopify webhook signature
 */
export function verifyWebhook(
  body: string,
  hmacHeader: string
): boolean {
  const hash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  return hash === hmacHeader;
}

/**
 * Register webhook
 */
export async function registerWebhook(
  shop: string,
  accessToken: string,
  topic: string,
  address: string
): Promise<string> {
  const session = createSession(shop, accessToken);
  const client = new shopify.clients.Rest({ session });

  const response = await client.post({
    path: 'webhooks',
    data: {
      webhook: {
        topic,
        address,
        format: 'json',
      },
    },
  });

  const webhookData = response.body as { webhook: { id: string } };
  return webhookData.webhook.id;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validate shop domain format
 */
export function isValidShopDomain(shop: string): boolean {
  // Simple sanitization without calling shopify API at build time
  const shopDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  return !!shopDomain && shopDomain.endsWith('.myshopify.com');
}

/**
 * Generate nonce for OAuth state
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  shopify,
  getAuthorizationUrl,
  validateOAuthCallback,
  getShopInfo,
  getProducts,
  searchProducts,
  installChatWidget,
  uninstallChatWidget,
  createRecurringCharge,
  activateRecurringCharge,
  createUsageCharge,
  verifyWebhook,
  registerWebhook,
  isValidShopDomain,
  generateNonce,
  isShopifyConfigured,
};
