/**
 * Shop Intelligence Analyzer
 * 
 * Analyzes Shopify shops to extract intelligence for personalized AI responses.
 * Provides category detection, price positioning, brand voice, and target audience.
 * 
 * CRITICAL: This enables Qryx to provide shop-specific, context-aware recommendations
 * instead of generic responses.
 */

import type { ShopifyShop, ShopifyProduct } from '@/lib/shopify/client';

// =============================================================================
// TYPES
// =============================================================================

export interface ShopIntelligence {
  category: ShopCategory;
  priceRange: PriceRange;
  brandVoice: BrandVoice;
  targetAudience: string[];
  topCategories: string[];
  avgPrice: number;
  productCount: number;
  insights: string[];
  analyzed_at: Date;
}

export type ShopCategory = 
  | 'fashion' 
  | 'tech' 
  | 'beauty' 
  | 'home' 
  | 'food' 
  | 'jewelry'
  | 'sports'
  | 'books'
  | 'toys'
  | 'general';

export type PriceRange = 'budget' | 'mid' | 'premium' | 'luxury';

export type BrandVoice = 'professional' | 'casual' | 'playful' | 'luxury' | 'technical';

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

/**
 * Analyze a Shopify shop and extract intelligence
 * 
 * @param shop - Shopify shop details
 * @param products - Array of shop products (sample, not all)
 * @returns Shop intelligence object
 */
export async function analyzeShop(
  shop: ShopifyShop,
  products: ShopifyProduct[]
): Promise<ShopIntelligence> {
  // Detect category from products
  const category = detectCategory(products);

  // Analyze pricing
  const { priceRange, avgPrice } = analyzePricing(products);

  // Detect brand voice
  const brandVoice = detectBrandVoice(products, shop.name);

  // Identify target audience
  const targetAudience = identifyTargetAudience(products, category);

  // Extract top product categories
  const topCategories = extractTopCategories(products);

  // Generate insights
  const insights = generateInsights({
    category,
    priceRange,
    brandVoice,
    targetAudience,
    productCount: products.length,
  });

  return {
    category,
    priceRange,
    brandVoice,
    targetAudience,
    topCategories,
    avgPrice,
    productCount: products.length,
    insights,
    analyzed_at: new Date(),
  };
}

// =============================================================================
// CATEGORY DETECTION
// =============================================================================

/**
 * Detect shop category from product titles and descriptions
 */
function detectCategory(products: ShopifyProduct[]): ShopCategory {
  const categoryKeywords: Record<ShopCategory, string[]> = {
    fashion: ['dress', 'shirt', 'pants', 'jacket', 'shoes', 'clothing', 'apparel', 'wear', 'jeans', 'sweater', 'skirt', 'blouse'],
    tech: ['laptop', 'phone', 'computer', 'headphone', 'camera', 'tablet', 'monitor', 'keyboard', 'mouse', 'electronics', 'gadget', 'device'],
    beauty: ['makeup', 'skincare', 'cosmetic', 'lotion', 'serum', 'cream', 'lipstick', 'foundation', 'perfume', 'beauty', 'facial'],
    home: ['furniture', 'decor', 'lamp', 'chair', 'table', 'bed', 'sofa', 'pillow', 'curtain', 'rug', 'vase', 'home'],
    food: ['coffee', 'tea', 'snack', 'chocolate', 'organic', 'honey', 'spice', 'sauce', 'drink', 'beverage', 'food'],
    jewelry: ['necklace', 'ring', 'bracelet', 'earring', 'jewelry', 'gold', 'silver', 'diamond', 'watch', 'pendant'],
    sports: ['fitness', 'gym', 'exercise', 'yoga', 'running', 'sports', 'athletic', 'workout', 'training', 'bike'],
    books: ['book', 'novel', 'magazine', 'journal', 'diary', 'notebook', 'reading', 'publication'],
    toys: ['toy', 'game', 'puzzle', 'doll', 'action figure', 'play', 'kids', 'children'],
    general: [],
  };

  // Count keyword matches per category
  const scores: Record<ShopCategory, number> = {
    fashion: 0,
    tech: 0,
    beauty: 0,
    home: 0,
    food: 0,
    jewelry: 0,
    sports: 0,
    books: 0,
    toys: 0,
    general: 0,
  };

  products.forEach(product => {
    const text = `${product.title} ${product.body_html || ''}`.toLowerCase();
    
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          scores[category as ShopCategory]++;
        }
      });
    });
  });

  // Find category with highest score
  let maxScore = 0;
  let detectedCategory: ShopCategory = 'general';

  Object.entries(scores).forEach(([category, score]) => {
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category as ShopCategory;
    }
  });

  return maxScore > 0 ? detectedCategory : 'general';
}

// =============================================================================
// PRICING ANALYSIS
// =============================================================================

/**
 * Analyze pricing to determine price range and average
 */
function analyzePricing(products: ShopifyProduct[]): {
  priceRange: PriceRange;
  avgPrice: number;
} {
  const prices: number[] = [];

  products.forEach(product => {
    if (product.variants && product.variants.length > 0) {
      const price = parseFloat(product.variants[0].price || '0');
      if (price > 0) prices.push(price);
    }
  });

  if (prices.length === 0) {
    return { priceRange: 'mid', avgPrice: 0 };
  }

  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Determine price range based on average
  let priceRange: PriceRange;
  if (avgPrice < 20) {
    priceRange = 'budget';
  } else if (avgPrice < 100) {
    priceRange = 'mid';
  } else if (avgPrice < 500) {
    priceRange = 'premium';
  } else {
    priceRange = 'luxury';
  }

  return { priceRange, avgPrice };
}

// =============================================================================
// BRAND VOICE DETECTION
// =============================================================================

/**
 * Detect brand voice from product descriptions and shop name
 */
function detectBrandVoice(products: ShopifyProduct[], shopName: string): BrandVoice {
  const allText = products
    .map(p => `${p.title} ${p.body_html || ''}`)
    .join(' ')
    .toLowerCase();

  // Voice indicators
  const voiceIndicators = {
    luxury: ['premium', 'exclusive', 'luxury', 'elegant', 'sophisticated', 'handcrafted', 'artisan'],
    technical: ['specs', 'performance', 'processor', 'memory', 'features', 'specifications', 'powered'],
    playful: ['fun', 'awesome', 'cool', 'amazing', 'love', '!', 'emoji', 'cute', 'adorable'],
    casual: ['everyday', 'simple', 'easy', 'comfortable', 'relaxed', 'chill', 'basic'],
    professional: ['quality', 'reliable', 'trusted', 'professional', 'certified', 'guarantee'],
  };

  const scores: Record<BrandVoice, number> = {
    luxury: 0,
    technical: 0,
    playful: 0,
    casual: 0,
    professional: 0,
  };

  Object.entries(voiceIndicators).forEach(([voice, keywords]) => {
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = allText.match(regex);
      scores[voice as BrandVoice] += matches ? matches.length : 0;
    });
  });

  // Find dominant voice
  let maxScore = 0;
  let dominantVoice: BrandVoice = 'professional';

  Object.entries(scores).forEach(([voice, score]) => {
    if (score > maxScore) {
      maxScore = score;
      dominantVoice = voice as BrandVoice;
    }
  });

  return dominantVoice;
}

// =============================================================================
// TARGET AUDIENCE IDENTIFICATION
// =============================================================================

/**
 * Identify target audience from products and category
 */
function identifyTargetAudience(
  products: ShopifyProduct[],
  category: ShopCategory
): string[] {
  const audience: Set<string> = new Set();

  const allText = products
    .map(p => `${p.title} ${p.body_html || ''}`)
    .join(' ')
    .toLowerCase();

  // Gender indicators
  if (allText.includes('women') || allText.includes('ladies') || allText.includes('her')) {
    audience.add('women');
  }
  if (allText.includes('men') || allText.includes('guys') || allText.includes('him')) {
    audience.add('men');
  }
  if (allText.includes('unisex') || allText.includes('everyone')) {
    audience.add('unisex');
  }

  // Age indicators
  if (allText.includes('kids') || allText.includes('children') || allText.includes('baby')) {
    audience.add('children');
  }
  if (allText.includes('teen') || allText.includes('youth')) {
    audience.add('teens');
  }

  // Lifestyle indicators
  if (allText.includes('professional') || allText.includes('business') || allText.includes('office')) {
    audience.add('professionals');
  }
  if (allText.includes('active') || allText.includes('fitness') || allText.includes('athlete')) {
    audience.add('active lifestyle');
  }
  if (allText.includes('eco') || allText.includes('sustainable') || allText.includes('organic')) {
    audience.add('eco-conscious');
  }

  // Category-based defaults
  if (audience.size === 0) {
    switch (category) {
      case 'fashion':
        audience.add('style-conscious shoppers');
        break;
      case 'tech':
        audience.add('tech enthusiasts');
        break;
      case 'beauty':
        audience.add('beauty enthusiasts');
        break;
      case 'home':
        audience.add('homeowners');
        break;
      default:
        audience.add('general consumers');
    }
  }

  return Array.from(audience);
}

// =============================================================================
// CATEGORY EXTRACTION
// =============================================================================

/**
 * Extract top product categories/types
 */
function extractTopCategories(products: ShopifyProduct[]): string[] {
  const categoryCount: Record<string, number> = {};

  products.forEach(product => {
    if (product.product_type) {
      const type = product.product_type.toLowerCase();
      categoryCount[type] = (categoryCount[type] || 0) + 1;
    }
  });

  // Sort by count and take top 5
  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category]) => category);

  return topCategories;
}

// =============================================================================
// INSIGHTS GENERATION
// =============================================================================

/**
 * Generate actionable insights for the AI
 */
function generateInsights(data: {
  category: ShopCategory;
  priceRange: PriceRange;
  brandVoice: BrandVoice;
  targetAudience: string[];
  productCount: number;
}): string[] {
  const insights: string[] = [];

  // Category insight
  insights.push(`This is a ${data.category} shop focusing on ${data.category} products.`);

  // Pricing insight
  const priceDescriptions: Record<PriceRange, string> = {
    budget: 'budget-friendly, affordable options',
    mid: 'mid-range, value-focused products',
    premium: 'premium, high-quality items',
    luxury: 'luxury, exclusive products',
  };
  insights.push(`Price positioning: ${priceDescriptions[data.priceRange]}.`);

  // Audience insight
  if (data.targetAudience.length > 0) {
    insights.push(`Target audience: ${data.targetAudience.join(', ')}.`);
  }

  // Voice insight
  const voiceDescriptions: Record<BrandVoice, string> = {
    professional: 'Use a professional, trustworthy tone',
    casual: 'Use a friendly, conversational tone',
    playful: 'Use an enthusiastic, fun tone with personality',
    luxury: 'Use an elegant, sophisticated tone',
    technical: 'Use precise, spec-focused language',
  };
  insights.push(voiceDescriptions[data.brandVoice] + '.');

  return insights;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  analyzeShop,
};
