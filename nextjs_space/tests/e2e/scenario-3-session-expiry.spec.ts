/**
 * Test Scenario 3: Shop Session Expiry
 * Based on TESTING_GUIDE_PHASE5A.md
 * 
 * Goal: Verify error handling when shop session expires
 */

import { test, expect } from '@playwright/test';
import {
  hasShopSession,
  clearShopSession,
  initiateInstall,
  loginUser,
  takeScreenshot,
} from './helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Scenario 3: Shop Session Expiry', () => {
  test.setTimeout(90000); // 1.5 minutes

  const testUser = TEST_CONFIG.testUser;
  const testShop = TEST_CONFIG.shopify.testStore;

  test('Step 1: Initiate Installation', async ({ page }) => {
    console.log('[START] Test Scenario 3: Shop Session Expiry');
    console.log('   Test Shop:', testShop);

    // Navigate to install endpoint
    await initiateInstall(page, testShop);

    // Verify shop session created
    const hasSession = await hasShopSession(page);
    expect(hasSession).toBeTruthy();
    console.log('[PASS] Shop session created');

    await takeScreenshot(page, 'scenario-3-step-1-session-created');
  });

  test('Step 2: Manually Expire Session', async ({ page }) => {
    // Initiate install
    await initiateInstall(page, testShop);
    await expect(page).toHaveURL(/\/login/);

    // Verify session exists
    let hasSession = await hasShopSession(page);
    expect(hasSession).toBeTruthy();
    console.log('[PASS] Shop session exists');

    // Clear shop session cookie (manual expiry)
    console.log('[ACTION] Manually expiring shop session...');
    await clearShopSession(page);

    // Verify session cleared
    hasSession = await hasShopSession(page);
    expect(hasSession).toBeFalsy();
    console.log('[PASS] Shop session expired');

    await takeScreenshot(page, 'scenario-3-step-2-session-expired');
  });

  test('Step 3: Attempt to Continue Without Session', async ({ page }) => {
    // Initiate install
    await initiateInstall(page, testShop);
    await expect(page).toHaveURL(/\/login/);

    // Expire session
    await clearShopSession(page);

    // Try to login
    console.log('[ACTION] Attempting to login with expired session...');
    await loginUser(page, testUser.email, testUser.password);

    // After login, try to access plan selection
    // This should fail or show an error
    await page.goto(`${TEST_CONFIG.baseURL}/products/qryx/setup`);

    // Should see error message about expired session
    // OR redirect to restart installation
    await page.waitForTimeout(2000); // Wait for any redirects

    const currentURL = page.url();
    console.log('   Current URL:', currentURL);

    // Check for error message
    const errorMessageVisible = await page.locator('text=/session expired/i').isVisible().catch(() => false);
    const restartLinkVisible = await page.locator('text=/restart installation/i').isVisible().catch(() => false);

    if (errorMessageVisible) {
      console.log('[PASS] Error message displayed: Session expired');
    }

    if (restartLinkVisible) {
      console.log('[PASS] Restart installation link present');
    }

    if (!errorMessageVisible && !restartLinkVisible) {
      console.log('[WARN] No explicit error handling detected');
      console.log('   [BUG] Session expiry error handling may be missing');
    }

    await takeScreenshot(page, 'scenario-3-step-3-error-handling');

    // At minimum, checkout should not succeed without shop
    expect(errorMessageVisible || restartLinkVisible || currentURL.includes('login')).toBeTruthy();
  });

  test('Step 4: Verify No Stripe Checkout Without Shop', async ({ page, request }) => {
    console.log('[ACTION] Verifying Stripe checkout requires shop session...');

    // Try to create checkout without shop session
    const response = await request.post(`${TEST_CONFIG.baseURL}/api/stripe/checkout`, {
      data: {
        planId: 'starter',
        shop: '', // Empty shop
      },
    });

    // Should return 400 or 401 error
    expect(response.status()).toBeGreaterThanOrEqual(400);
    console.log('[PASS] Checkout rejected without shop:', response.status());

    const responseBody = await response.json();
    console.log('   Error:', responseBody.error || responseBody.message);

    await takeScreenshot(page, 'scenario-3-step-4-checkout-rejected');
  });
});
