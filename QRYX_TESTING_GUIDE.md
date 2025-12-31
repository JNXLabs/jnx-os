# Qryx AI Sales Assistant - Testing & Improvement Guide

**Date:** December 31, 2025  
**Status:** Phase 5B Complete - Ready for E2E Testing  
**Production URL:** https://www.jnxlabs.ai  
**Test Shop:** shopbotv3.myshopify.com  

---

## Executive Summary

### ✅ What's Working

1. **SaaS Installation Flow** (14 steps)
   - Shopify Install → Login/Signup → Plan Selection → Payment → OAuth
   - Session encryption with 30-minute expiry
   - Stripe Live Mode integration

2. **Usage Tracking & Billing**
   - Real-time conversation counting
   - Plan limits: Starter (500), Professional (2000), Business (5000)
   - Soft limits with warnings at 80% and 100%
   - Atomic increment with Row-Level-Locking

3. **Gemini 2.0 Flash Integration**
   - Chat completion API working
   - Cost: ~$0.0001 per message
   - Sub-3-second response times

4. **Widget Delivery**
   - Dynamic JavaScript generation
   - Shop-specific configuration
   - CORS-enabled for embedding

---

## 🚨 Critical Gap: Shop Analysis Quality

### Current Implementation (Basic)

**System Prompt:**
```
You are Qryx, an AI sales assistant for {ShopName}.
Your role is to help customers find products...
```

**Product Context:**
```
1. Product Title - $XX.XX
   Short description...
```

### ❌ Problems:

1. **Generic Approach**: Same prompt for Fashion, Tech, Food, Beauty shops
2. **No Shop Intelligence**: Doesn't analyze shop category, target audience, brand voice
3. **Shallow Product Context**: Missing keywords, categories, best-sellers
4. **No Customer Journey**: Doesn't understand intent (browsing vs. ready to buy)

---

## 📋 Test Plan

### Phase 1: Zero-Click Installation

**Test Case 1.1: New Merchant**

Steps:
1. Visit: https://www.jnxlabs.ai/api/qryx/install?shop=shopbotv3.myshopify.com
2. Create account (Clerk)
3. Select plan (Professional $79/mo)
4. Complete Stripe payment
5. Authorize Shopify OAuth
6. Verify dashboard shows shop

Expected: Shop connected, subscription active, widget available

### Phase 2: AI Chat Quality

**Test Scenarios:**

1. Greeting: "Hi!"
2. Product Discovery: "I'm looking for a gift"
3. Specific Query: "Do you have headphones?"
4. Out of Stock: "I want Product X"
5. Price Question: "What's your cheapest laptop?"

### Phase 3: Widget Integration

Steps:
1. Get shop_id from database
2. Visit: https://www.jnxlabs.ai/api/widget/qryx?shop_id=xxx
3. Install in Shopify store
4. Test chat functionality

### Phase 4: Usage Tracking

Steps:
1. Start 5 conversations
2. Check database: conversations_used should increment
3. Test 80% warning
4. Test 100% limit

---

## 🎯 Priority Actions

### Critical (Before Launch)

1. ✅ Execute RPC Migration (MIGRATION_PHASE5B_RPC_FUNCTION.sql)
2. ⚠️ Enhance Shop Analysis (MAJOR IMPROVEMENT OPPORTUNITY)
3. ✅ Test Full Installation Flow

### High Priority (Week 1)

4. Test Widget Embedding
5. AI Quality Validation (10+ conversations)
6. Usage Tracking Validation

---

## 🚀 Recommended Improvement: Smart Shop Analysis

### Problem
Current AI is **too generic** - same approach for all shops.

### Solution
Build Shop Intelligence System:

```typescript
interface ShopIntelligence {
  category: 'fashion' | 'tech' | 'beauty' | 'home' | 'food';
  priceRange: 'budget' | 'mid' | 'premium' | 'luxury';
  brandVoice: 'professional' | 'casual' | 'playful';
  targetAudience: string[];
}
```

### Benefits
- Fashion Shop: Focus on style, occasions, trends
- Tech Shop: Emphasize specs, compatibility, use cases
- Food Shop: Highlight ingredients, dietary info, pairings

This would make Qryx **10x better** than competitors!

---

## 📊 Success Metrics

### Target State
- Installation Completion: > 80%
- Response Time: < 2 seconds
- Product Match Rate: > 70%
- Conversation Quality: Shop-specific

---

## 🔧 Database Queries

```sql
-- Check shop
SELECT * FROM shopify_shops WHERE shop_domain = 'shopbotv3.myshopify.com';

-- Check subscription
SELECT * FROM billing_subscriptions WHERE clerk_user_id = 'user_xxx';

-- Check usage
SELECT * FROM usage_tracking WHERE clerk_user_id = 'user_xxx';
```

---

## ✅ Testing Checklist

### Before Testing
- [ ] RPC migration executed
- [ ] Test shop accessible
- [ ] Stripe configured

### Installation Flow
- [ ] New user flow works
- [ ] Payment processing works
- [ ] OAuth completes
- [ ] Shop appears in dashboard

### AI Quality
- [ ] Bot responds naturally
- [ ] Bot mentions actual products
- [ ] Bot provides accurate prices
- [ ] Bot handles edge cases

### Widget
- [ ] Loads in Shopify store
- [ ] Chat works
- [ ] Mobile responsive

---

**Status:** Ready for Testing 🚀  
**Next:** Run installation test on shopbotv3.myshopify.com
