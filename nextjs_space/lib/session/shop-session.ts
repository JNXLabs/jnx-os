/**
 * Shop Session Management
 * 
 * Preserves the Shopify shop parameter through the multi-step SaaS installation flow:
 * /api/qryx/install?shop=xyz → /login → /products → /checkout → /oauth
 * 
 * Implementation: Encrypted JWT-based session stored in HTTP-only cookies
 * Expiry: 30 minutes (sufficient for registration + payment + OAuth)
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'jnx_shop_session';
const SESSION_DURATION = 30 * 60; // 30 minutes in seconds

/**
 * Get encryption key from environment or generate a secure default
 * IMPORTANT: Set SESSION_SECRET in .env for production
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || 'jnx-os-shop-session-secret-key-change-in-production';
  return new TextEncoder().encode(secret);
}

/**
 * Shop session payload interface
 */
interface ShopSessionPayload {
  shop: string;
  timestamp: number;
  [key: string]: any; // Index signature for JWT compatibility
}

/**
 * Set shop parameter in encrypted session
 * 
 * @param shop - Shopify shop domain (e.g., "merchant.myshopify.com")
 * @returns Promise<void>
 * 
 * @example
 * await setShopSession('merchant.myshopify.com');
 */
export async function setShopSession(shop: string): Promise<void> {
  try {
    // Create encrypted JWT
    const token = await new SignJWT({
      shop,
      timestamp: Date.now(),
    } as ShopSessionPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_DURATION}s`)
      .sign(getSecretKey());

    // Store in HTTP-only cookie
    cookies().set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    });

    console.log('[ShopSession] Set:', { shop, expiresIn: `${SESSION_DURATION}s` });
  } catch (error) {
    console.error('[ShopSession] Error setting session:', error);
    throw new Error('Failed to set shop session');
  }
}

/**
 * Retrieve shop parameter from encrypted session
 * 
 * @returns Promise<string | null> - Shop domain or null if expired/invalid
 * 
 * @example
 * const shop = await getShopSession();
 * if (!shop) {
 *   return NextResponse.json({ error: 'Shop session expired' }, { status: 400 });
 * }
 */
export async function getShopSession(): Promise<string | null> {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;

    if (!token) {
      console.log('[ShopSession] No session cookie found');
      return null;
    }

    // Verify and decrypt JWT
    const { payload } = await jwtVerify(token, getSecretKey());
    const data = payload as unknown as ShopSessionPayload;

    if (!data.shop) {
      console.warn('[ShopSession] Invalid session: missing shop');
      return null;
    }

    const age = Date.now() - data.timestamp;
    console.log('[ShopSession] Retrieved:', { shop: data.shop, ageSeconds: Math.floor(age / 1000) });

    return data.shop;
  } catch (error) {
    // Token expired or invalid
    if (error instanceof Error) {
      console.warn('[ShopSession] Session invalid:', error.message);
    }
    return null;
  }
}

/**
 * Clear shop session (e.g., after successful OAuth or error)
 * 
 * @returns void
 * 
 * @example
 * await clearShopSession(); // After OAuth callback
 */
export async function clearShopSession(): Promise<void> {
  try {
    cookies().delete(COOKIE_NAME);
    console.log('[ShopSession] Cleared');
  } catch (error) {
    console.error('[ShopSession] Error clearing session:', error);
  }
}

/**
 * Check if shop session exists and is valid
 * 
 * @returns Promise<boolean>
 * 
 * @example
 * if (!(await hasValidShopSession())) {
 *   return NextResponse.redirect('/api/qryx/install');
 * }
 */
export async function hasValidShopSession(): Promise<boolean> {
  const shop = await getShopSession();
  return shop !== null;
}
