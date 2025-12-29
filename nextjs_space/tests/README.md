# JNX-OS Phase 5A Testing Suite

**Status:** ✅ Complete  
**Framework:** Playwright  
**Coverage:** 24 tests across 5 scenarios

## Quick Start

### Run All Tests
```bash
# Install browser binaries (first time only)
npx playwright install chromium

# Run all tests
yarn playwright test

# Run with UI
yarn playwright test --ui

# Run specific scenario
yarn playwright test scenario-1
```

### Run Single Scenario
```bash
# Scenario 1: New User Complete Flow
yarn playwright test tests/e2e/scenario-1-new-user.spec.ts

# Scenario 2: Existing User Return Flow
yarn playwright test tests/e2e/scenario-2-existing-user.spec.ts

# Scenario 3: Session Expiry
yarn playwright test tests/e2e/scenario-3-session-expiry.spec.ts

# Scenario 4: Payment Failure
yarn playwright test tests/e2e/scenario-4-payment-failure.spec.ts

# Scenario 5: Webhook Retry
yarn playwright test tests/e2e/scenario-5-webhook-retry.spec.ts
```

### Debug Mode
```bash
# Run in debug mode with inspector
yarn playwright test --debug

# Run in headed mode (see browser)
yarn playwright test --headed

# Run with slowmo (slower execution)
yarn playwright test --headed --slow-mo=1000
```

## Test Structure

```
tests/
├── e2e/
│   ├── test-config.ts               # Configuration constants
│   ├── helpers.ts                   # Reusable helper functions
│   ├── scenario-1-new-user.spec.ts  # New user complete flow
│   ├── scenario-2-existing-user.spec.ts
│   ├── scenario-3-session-expiry.spec.ts
│   ├── scenario-4-payment-failure.spec.ts
│   └── scenario-5-webhook-retry.spec.ts
└── README.md                      # This file
```

## Test Scenarios

### Scenario 1: New User Complete Flow (6 tests)
Tests the complete installation flow for a brand new user:
1. Initiate installation → verify redirect and session
2. Sign up new user → verify Clerk integration
3. Select pricing plan → verify Stripe checkout
4. Complete payment → **[MANUAL]**
5. Shopify OAuth → **[MANUAL]**
6. Verify dashboard → **[MANUAL]**

### Scenario 2: Existing User Return Flow (4 tests)
Tests flow for existing user adding Qryx to a new shop:
1. Start installation with new shop
2. Login existing user
3. Complete flow for new shop → **[MANUAL]**
4. Database verification → **[MANUAL]**

### Scenario 3: Shop Session Expiry (4 tests)
Tests error handling when shop session expires:
1. Initiate installation
2. Manually expire session
3. Attempt to continue without session
4. Verify no checkout without shop

### Scenario 4: Payment Failure Handling (5 tests)
Tests graceful handling of failed payments:
1. Complete up to Stripe checkout
2. Use declining test card → **[MANUAL]**
3. Verify no database record
4. Retry with valid card → **[MANUAL]**
5. Verify API rejects invalid requests

### Scenario 5: Webhook Failure & Retry (5 tests)
Tests webhook failure handling and Stripe's retry mechanism:
1. Simulate webhook failure → **[MANUAL]**
2. Use Stripe CLI to send test webhook
3. Verify webhook event logging → **[MANUAL]**
4. Verify Stripe dashboard delivery → **[MANUAL]**
5. Verify idempotent webhook handling → **[MANUAL]**

## Test Coverage

- **Automated:** 13 tests (54%)
- **Manual:** 11 tests (46%)
- **Total:** 24 tests (100%)

### Why Manual Tests?

Some tests require manual execution because:
1. **Stripe Payments:** Requires real Stripe checkout flow or test fixtures
2. **Shopify OAuth:** Requires test store credentials or API mocking
3. **Database Queries:** Requires direct Supabase access or test API endpoints

## Configuration

### Test Environment Variables
Tests use environment variables from `.env` file:
- Clerk credentials for authentication
- Supabase credentials for database
- Stripe keys for payment testing
- Shopify credentials for OAuth

### Test Configuration
Edit `tests/e2e/test-config.ts` to modify:
- Test shop domains
- Test user credentials
- Stripe test cards
- Timeout values

## Helper Functions

Located in `tests/e2e/helpers.ts`:

- `hasShopSession(page)` - Check if shop session cookie exists
- `getShopSession(page)` - Get shop session cookie value
- `clearShopSession(page)` - Clear shop session cookie
- `initiateInstall(page, shop)` - Navigate to install endpoint
- `signUpUser(page, email, password)` - Sign up new user
- `loginUser(page, email, password)` - Login existing user
- `selectPlan(page, planId)` - Select pricing plan
- `verifyDashboard(page, shop)` - Verify dashboard loaded
- `takeScreenshot(page, name)` - Take timestamped screenshot

## Reports

### HTML Report
```bash
# Generate HTML report after test run
yarn playwright show-report
```

### JSON Report
Test results are saved to `test-results.json` after each run.

### Screenshots
Screenshots are saved to `screenshots/` directory with timestamps.

### Traces
Playwright traces are saved on test failure for debugging.

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: yarn install
      - run: npx playwright install --with-deps chromium
      - run: yarn playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Browser Binary Errors
```bash
# Error: EACCES permission denied
# Solution: Install browsers with sudo or use Docker
sudo npx playwright install chromium
```

### Test Timeouts
```bash
# Increase timeout in playwright.config.ts
timeout: 120 * 1000, // 2 minutes
```

### Clerk Authentication Issues
```bash
# Verify Clerk env vars are set
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY
```

### Shop Session Issues
```bash
# Verify SESSION_SECRET is set
echo $SESSION_SECRET
# Generate new secret if needed
openssl rand -base64 32
```

## Manual Testing Checklist

For tests marked **[MANUAL]**, follow the checklist in:
- `/PHASE5A_TEST_REPORT.md` - Section: "Manual Testing Checklist"
- `/TESTING_GUIDE_PHASE5A.md` - All 5 scenarios detailed

## Performance Metrics

Target metrics from Testing Guide:
- Install to login: < 2 seconds
- Plan selection page load: < 1 second
- Stripe checkout creation: < 3 seconds
- Webhook processing: < 1 second
- OAuth callback: < 2 seconds
- Dashboard load: < 3 seconds

## Security Tests

To add:
- [ ] CSRF protection tests
- [ ] Rate limiting tests
- [ ] Session tampering tests
- [ ] SQL injection tests
- [ ] XSS tests

## Resources

### Documentation
- **Full Test Report:** `/PHASE5A_TEST_REPORT.md`
- **Testing Summary:** `/PHASE5A_TESTING_SUMMARY.md`
- **Testing Guide:** `/TESTING_GUIDE_PHASE5A.md`

### Official Docs
- **Playwright:** https://playwright.dev
- **Stripe Testing:** https://stripe.com/docs/testing
- **Shopify Testing:** https://shopify.dev/docs/apps/tools/app-testing

## Contributing

### Adding New Tests

1. Create new spec file in `tests/e2e/`
2. Import helpers from `./helpers`
3. Use test config from `./test-config`
4. Follow existing naming conventions
5. Add documentation to this README

### Writing Good Tests

1. **Descriptive Names:** Use clear test descriptions
2. **Isolation:** Each test should be independent
3. **Cleanup:** Clean up test data after tests
4. **Screenshots:** Take screenshots on failures
5. **Logging:** Add console.log for debugging

### Code Review Checklist

- [ ] Test names are descriptive
- [ ] Tests are independent
- [ ] Error handling is present
- [ ] Screenshots on failure
- [ ] Documentation updated

## Support

- **GitHub Issues:** https://github.com/JNXLabs/jnx-os/issues
- **Email:** support@jnxlabs.ai
- **Documentation:** `/docs/` directory

---

**Version:** 1.0  
**Last Updated:** December 29, 2025  
**Maintained By:** JNXLabs QA Team
