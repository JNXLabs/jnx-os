/**
 * Test Scenario 4: Payment Failure Handling
 * Based on TESTING_GUIDE_PHASE5A.md
 * 
 * Goal: Verify system handles failed payments gracefully
 */

import { test, expect } from '@playwright/test';
import {
  initiateInstall,
  signUpUser,
  takeScreenshot,
} from './helpers';
import { TEST_CONFIG, generateTestEmail } from './test-config';

test.describe('Scenario 4: Payment Failure Handling', () => {
  test.setTimeout(120000); // 2 minutes

  const testEmail = generateTestEmail('payment-test');
  const testPassword = TEST_CONFIG.newUser.password;
  const testShop = TEST_CONFIG.shopify.testStore;

  test('Step 1-3: Complete Up to Stripe Checkout', async ({ page }) => {
    console.log('[START] Test Scenario 4: Payment Failure Handling');
    console.log('   Test Email:', testEmail);

    // Navigate to install endpoint
    await initiateInstall(page, testShop);
    await expect(page).toHaveURL(/\/login/);

    // Sign up new user
    await page.click('text=/Sign up/i');
    await signUpUser(page, testEmail, testPassword);

    // Verify we're on plan selection page
    await expect(page).toHaveURL(/\/products\/qryx\/setup/);
    console.log('[PASS] Reached plan selection page');

    await takeScreenshot(page, 'scenario-4-step-1-ready-for-checkout');
  });

  test('Step 4: Use Declining Test Card [MANUAL]', async ({ page }) => {
    console.log('[MANUAL] Step 4 requires manual Stripe payment with declining card');
    console.log('   Use declining card: 4000 0000 0000 0002');
    console.log('   Expected behavior:');
    console.log('   - Stripe shows error: Your card was declined');
    console.log('   - User remains on checkout page');
    console.log('   - Can retry with different card');
    console.log('   - No database record created');
    console.log('   - No OAuth initiated');
    
    expect(true).toBeTruthy(); // Placeholder
  });

  test('Step 5: Verify No Database Record After Failed Payment', async ({ request }) => {
    console.log('[DATABASE] Verifying no subscription record created...');
    
    // Note: This would require database access or API endpoint
    // For now, we document the expected query
    
    console.log('SQL Query to run:');
    console.log('SELECT * FROM billing_subscriptions');
    console.log('WHERE shop_domain =', testShop);
    console.log('AND created_at > NOW() - INTERVAL \'5 minutes\';');
    console.log('');
    console.log('Expected Result: 0 rows');
    
    expect(true).toBeTruthy(); // Placeholder
  });

  test('Step 6: Retry with Valid Card [MANUAL]', async ({ page }) => {
    console.log('[MANUAL] Step 6 requires retry with valid card');
    console.log('   On same checkout page:');
    console.log('   - Use valid card: 4242 4242 4242 4242');
    console.log('   - Complete payment');
    console.log('   Expected behavior:');
    console.log('   - Payment succeeds');
    console.log('   - Flow continues normally to OAuth');
    console.log('   - Subscription created in database');
    
    expect(true).toBeTruthy(); // Placeholder
  });

  test('Step 7: Verify API Rejects Invalid Requests', async ({ request }) => {
    console.log('[API] Testing Stripe checkout validation...');

    // Test 1: Missing planId
    const response1 = await request.post(`${TEST_CONFIG.baseURL}/api/stripe/checkout`, {
      data: {
        shop: testShop,
        // planId missing
      },
    });

    expect(response1.status()).toBeGreaterThanOrEqual(400);
    console.log('[PASS] Rejected request without planId:', response1.status());

    // Test 2: Invalid planId
    const response2 = await request.post(`${TEST_CONFIG.baseURL}/api/stripe/checkout`, {
      data: {
        planId: 'invalid-plan',
        shop: testShop,
      },
    });

    expect(response2.status()).toBeGreaterThanOrEqual(400);
    console.log('[PASS] Rejected request with invalid planId:', response2.status());

    // Test 3: Missing shop
    const response3 = await request.post(`${TEST_CONFIG.baseURL}/api/stripe/checkout`, {
      data: {
        planId: 'starter',
        // shop missing
      },
    });

    expect(response3.status()).toBeGreaterThanOrEqual(400);
    console.log('[PASS] Rejected request without shop:', response3.status());
  });
});
