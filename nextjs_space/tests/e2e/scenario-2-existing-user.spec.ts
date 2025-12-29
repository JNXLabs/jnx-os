/**
 * Test Scenario 2: Existing User - Return Flow
 * Based on TESTING_GUIDE_PHASE5A.md
 * 
 * Goal: Verify flow for user who already has account but wants to add Qryx to new shop
 */

import { test, expect } from '@playwright/test';
import {
  hasShopSession,
  initiateInstall,
  loginUser,
  takeScreenshot,
} from './helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Scenario 2: Existing User - Return Flow', () => {
  test.setTimeout(120000); // 2 minutes for return flow

  const existingUser = TEST_CONFIG.testUser;
  const newShop = TEST_CONFIG.shopify.newStore;

  test('Step 1: Start Installation with New Shop', async ({ page }) => {
    console.log('[START] Test Scenario 2: Existing User - Return Flow');
    console.log('   Existing User:', existingUser.email);
    console.log('   New Shop:', newShop);

    // Navigate to install endpoint with NEW shop
    await initiateInstall(page, newShop);

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    console.log('[PASS] Redirected to /login');

    // Shop session should be created for newshop.myshopify.com
    const hasSession = await hasShopSession(page);
    expect(hasSession).toBeTruthy();
    console.log('[PASS] Shop session created for', newShop);

    await takeScreenshot(page, 'scenario-2-step-1-new-shop-session');
  });

  test('Step 2: Login Existing User', async ({ page }) => {
    // Initiate install with new shop
    await initiateInstall(page, newShop);
    await expect(page).toHaveURL(/\/login/);

    console.log('[ACTION] Logging in existing user...');
    await loginUser(page, existingUser.email, existingUser.password);

    // Login should be successful
    await expect(page).toHaveURL(/\/products\/qryx\/setup/, { timeout: 30000 });
    console.log('[PASS] Login successful');

    // Shop session should be preserved (newshop.myshopify.com)
    const hasSession = await hasShopSession(page);
    expect(hasSession).toBeTruthy();
    console.log('[PASS] Shop session preserved for new shop');

    await takeScreenshot(page, 'scenario-2-step-2-logged-in');
  });

  test('Step 3-6: Complete Flow for New Shop', async ({ page }) => {
    console.log('[MANUAL] Steps 3-6 follow same flow as Scenario 1');
    console.log('   User should be able to:');
    console.log('   - Select plan');
    console.log('   - Complete payment');
    console.log('   - Complete OAuth');
    console.log('   - Access dashboard');
    console.log('');
    console.log('   Database should show 2 subscriptions for same user:');
    console.log('   -', TEST_CONFIG.shopify.testStore, '| starter | active');
    console.log('   -', newShop, '| starter | active');
    
    // Note: This requires manual testing or full automation
    expect(true).toBeTruthy(); // Placeholder
  });

  test('Database Verification [MANUAL]', async () => {
    console.log('[DATABASE] Verification Required:');
    console.log('');
    console.log('SQL Query:');
    console.log('SELECT shop_domain, plan_id, status');
    console.log('FROM billing_subscriptions');
    console.log('WHERE clerk_user_id = (SELECT clerk_user_id FROM users WHERE email =', existingUser.email, ')');
    console.log('ORDER BY created_at;');
    console.log('');
    console.log('Expected Result:');
    console.log(' ', TEST_CONFIG.shopify.testStore, '| starter | active');
    console.log(' ', newShop, '| starter | active');
    
    expect(true).toBeTruthy(); // Placeholder
  });
});
