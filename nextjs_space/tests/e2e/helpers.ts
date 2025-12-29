/**
 * Test Helper Functions for Phase 5A E2E Tests
 */

import { Page, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

/**
 * Helper: Check if shop session cookie exists
 */
export async function hasShopSession(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some(cookie => cookie.name === 'shop_session');
}

/**
 * Helper: Get shop session cookie value
 */
export async function getShopSession(page: Page): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  const shopSessionCookie = cookies.find(cookie => cookie.name === 'shop_session');
  return shopSessionCookie?.value;
}

/**
 * Helper: Clear shop session cookie
 */
export async function clearShopSession(page: Page): Promise<void> {
  await page.context().clearCookies({ name: 'shop_session' });
}

/**
 * Helper: Navigate to install endpoint
 */
export async function initiateInstall(
  page: Page,
  shop: string = TEST_CONFIG.shopify.testStore
): Promise<void> {
  await page.goto(`${TEST_CONFIG.baseURL}/api/qryx/install?shop=${shop}`);
}

/**
 * Helper: Sign up new user
 */
export async function signUpUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Wait for Clerk signup form to load
  await page.waitForSelector('input[name="emailAddress"], input[type="email"]', {
    timeout: 10000,
  });

  // Fill signup form
  const emailInput = page.locator('input[name="emailAddress"], input[type="email"]').first();
  await emailInput.fill(email);

  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill(password);

  // Submit form
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to complete
  await page.waitForURL('**/products/qryx/setup', { timeout: 30000 });
}

/**
 * Helper: Login existing user
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Wait for Clerk login form to load
  await page.waitForSelector('input[name="identifier"], input[type="email"]', {
    timeout: 10000,
  });

  // Fill login form
  const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
  await emailInput.fill(email);

  // Click continue or look for password field
  const continueButton = page.locator('button:has-text("Continue"), button[type="submit"]').first();
  await continueButton.click();

  // Wait for password field
  await page.waitForSelector('input[name="password"], input[type="password"]', {
    timeout: 5000,
  });

  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill(password);

  // Submit form
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to complete
  await page.waitForURL('**/products/qryx/setup', { timeout: 30000 });
}

/**
 * Helper: Select pricing plan
 */
export async function selectPlan(
  page: Page,
  planId: 'starter' | 'professional' | 'business' = 'starter'
): Promise<void> {
  // Wait for plan selection page
  await page.waitForURL('**/products/qryx/setup');

  // Find and click the "Get Started" button for the selected plan
  const plan = TEST_CONFIG.plans[planId];
  
  // Look for plan card containing the plan name and price
  const planCard = page.locator(`text=${plan.name}`).locator('..');
  const getStartedButton = planCard.locator('button:has-text("Get Started")').first();
  
  await getStartedButton.click();

  // Wait for Stripe checkout redirect
  await page.waitForURL('**/checkout.stripe.com/**', { timeout: 30000 });
}

/**
 * Helper: Fill Stripe checkout form
 */
export async function fillStripeCheckout(
  page: Page,
  card: { number: string; expiry: string; cvc: string; zip: string },
  email: string
): Promise<void> {
  // Wait for Stripe checkout to load
  await page.waitForSelector('iframe', { timeout: 30000 });

  // Note: Stripe uses iframes, which makes testing complex
  // For actual testing, you'd need to use Stripe's test mode
  // and potentially use their test helpers or API
  
  console.log('⚠️  Stripe checkout form detected - manual testing required');
  console.log('   Card:', card.number);
  console.log('   Email:', email);
}

/**
 * Helper: Verify dashboard loaded
 */
export async function verifyDashboard(
  page: Page,
  shop: string
): Promise<void> {
  // Wait for dashboard to load
  await page.waitForURL('**/app/products/qryx', { timeout: 30000 });

  // Verify shop domain is displayed
  await expect(page.locator(`text=${shop}`)).toBeVisible();

  // Verify plan information is visible
  await expect(page.locator('text=/Starter|Professional|Business/i')).toBeVisible();

  // Verify status is Active
  await expect(page.locator('text=/Active/i')).toBeVisible();
}

/**
 * Helper: Check API health
 */
export async function checkAPIHealth(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get(`${TEST_CONFIG.baseURL}/api/system/health`);
    return response.ok();
  } catch {
    return false;
  }
}

/**
 * Helper: Database query helper (for verification)
 */
export async function queryDatabase(query: string): Promise<any> {
  // This would require direct database access
  // For now, we'll use API endpoints to verify data
  console.log('⚠️  Database query:', query);
  return null;
}

/**
 * Helper: Take screenshot with timestamp
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  await page.screenshot({
    path: `screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}
