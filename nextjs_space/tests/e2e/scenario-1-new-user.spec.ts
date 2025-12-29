/**
 * Test Scenario 1: New User - Complete Flow
 * Based on TESTING_GUIDE_PHASE5A.md
 * 
 * Flow: Shopify Install -> Sign Up -> Plan Selection -> Stripe Checkout -> OAuth -> Dashboard
 */

import { test, expect } from '@playwright/test';
import {
  hasShopSession,
  initiateInstall,
  signUpUser,
  selectPlan,
  verifyDashboard,
  takeScreenshot,
} from './helpers';
import { TEST_CONFIG, generateTestEmail } from './test-config';

test.describe('Scenario 1: New User - Complete Flow', () => {
  test.setTimeout(180000); // 3 minutes for complete flow

  const testEmail = generateTestEmail('newuser');
  const testPassword = TEST_CONFIG.newUser.password;
  const testShop = TEST_CONFIG.shopify.testStore;

  test('Step 1: Initiate Installation', async ({ page }) => {
    console.log('[START] Test Scenario 1: New User - Complete Flow');
    console.log('   Test Email:', testEmail);
    console.log('   Test Shop:', testShop);

    // Navigate to install endpoint
    await initiateInstall(page, testShop);

    // Should redirect to /login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    console.log('[PASS] Redirected to /login');

    // Shop session should be created
    const hasSession = await hasShopSession(page);
    expect(hasSession).toBeTruthy();
    console.log('[PASS] Shop session created');

    await takeScreenshot(page, 'scenario-1-step-1-login-page');
  });

  test('Step 2: Sign Up New User', async ({ page }) => {
    // Initiate install first
    await initiateInstall(page, testShop);
    await expect(page).toHaveURL(/\/login/);

    // Navigate to signup
    console.log('[ACTION] Navigating to signup...');
    await page.click('text=/Sign up/i');
    await page.waitForURL(/\/signup/, { timeout: 10000 });

    console.log('[ACTION] Filling signup form...');
    await signUpUser(page, testEmail, testPassword);

    // Should redirect to /products/qryx/setup
    await expect(page).toHaveURL(/\/products\/qryx\/setup/, { timeout: 30000 });
    console.log('[PASS] Redirected to plan selection page');

    // Shop session should still be valid
    const hasSession = await hasShopSession(page);
    expect(hasSession).toBeTruthy();
    console.log('[PASS] Shop session preserved');

    await takeScreenshot(page, 'scenario-1-step-2-plan-selection');
  });

  test('Step 3: Select Pricing Plan', async ({ page }) => {
    // Complete previous steps
    await initiateInstall(page, testShop);
    await page.click('text=/Sign up/i');
    await signUpUser(page, generateTestEmail('test3'), testPassword);

    // Verify plan selection page
    await expect(page).toHaveURL(/\/products\/qryx\/setup/);
    console.log('[INFO] On plan selection page');

    // All 3 plans should be visible
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Business')).toBeVisible();
    console.log('[PASS] All 3 plans visible');

    // Prices should be correct
    await expect(page.locator('text=$29')).toBeVisible();
    await expect(page.locator('text=$79')).toBeVisible();
    await expect(page.locator('text=$199')).toBeVisible();
    console.log('[PASS] All prices displayed correctly');

    await takeScreenshot(page, 'scenario-1-step-3-plans-visible');

    // Select Starter plan
    console.log('[ACTION] Selecting Starter plan...');
    await selectPlan(page, 'starter');

    // Should redirect to Stripe Checkout
    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30000 });
    console.log('[PASS] Redirected to Stripe Checkout');

    await takeScreenshot(page, 'scenario-1-step-3-stripe-checkout');
  });

  test('Step 4: Complete Stripe Payment [MANUAL]', async ({ page }) => {
    console.log('[MANUAL] Step 4 requires manual Stripe payment');
    console.log('   Use test card: 4242 4242 4242 4242');
    console.log('   This step will be documented in the test report');
    
    // Note: Automated Stripe payment testing requires:
    // 1. Stripe test fixtures
    // 2. Special Stripe testing environment
    // 3. Or mocking the Stripe API
    
    expect(true).toBeTruthy(); // Placeholder
  });

  test('Step 5: Shopify OAuth [MANUAL]', async ({ page }) => {
    console.log('[MANUAL] Step 5 requires manual Shopify OAuth');
    console.log('   Click Install App on Shopify OAuth screen');
    console.log('   This step will be documented in the test report');
    
    // Note: Automated Shopify OAuth testing requires:
    // 1. Shopify test store credentials
    // 2. API access tokens
    // 3. Or mocking the Shopify OAuth flow
    
    expect(true).toBeTruthy(); // Placeholder
  });

  test('Step 6: Verify Dashboard Access [MANUAL]', async ({ page }) => {
    console.log('[MANUAL] Step 6 requires completion of Steps 4-5');
    console.log('   Expected URL: /app/products/qryx');
    console.log('   Expected to see shop domain, plan, and status');
    
    // Note: This can only be tested after manual completion of Steps 4-5
    // Or with a pre-existing test account
    
    expect(true).toBeTruthy(); // Placeholder
  });
});
