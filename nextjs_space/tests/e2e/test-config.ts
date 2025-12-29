/**
 * Test Configuration for Phase 5A E2E Tests
 * Based on TESTING_GUIDE_PHASE5A.md
 */

export const TEST_CONFIG = {
  // Base URLs
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  productionURL: 'https://www.jnxlabs.ai',
  
  // Test Shopify Store
  shopify: {
    testStore: 'shopbotv3.myshopify.com',
    newStore: 'newshop.myshopify.com',
  },
  
  // Test Clerk User Credentials
  testUser: {
    email: 'test@jnxlabs.ai',
    password: 'TestUser123!',
  },
  
  // New User for Testing
  newUser: {
    email: `newuser+test${Date.now()}@jnxlabs.ai`,
    password: 'TestUser123!',
  },
  
  // Stripe Test Cards
  stripe: {
    validCard: {
      number: '4242424242424242',
      expiry: '12/26',
      cvc: '123',
      zip: '12345',
    },
    decliningCard: {
      number: '4000000000000002',
      expiry: '12/26',
      cvc: '123',
      zip: '12345',
    },
  },
  
  // Pricing Plans
  plans: {
    starter: {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      conversations: 500,
    },
    professional: {
      id: 'professional',
      name: 'Professional',
      price: '$79',
      conversations: 2000,
    },
    business: {
      id: 'business',
      name: 'Business',
      price: '$199',
      conversations: 5000,
    },
  },
  
  // Timeouts
  timeouts: {
    shopSession: 30 * 60 * 1000, // 30 minutes
    pageLoad: 3000, // 3 seconds
    apiResponse: 1000, // 1 second
    webhookProcessing: 1000, // 1 second
    stripeCheckout: 30000, // 30 seconds
  },
};

/**
 * Helper function to generate unique email for tests
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}+${Date.now()}@jnxlabs.ai`;
}

/**
 * Helper function to wait for specific duration
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
