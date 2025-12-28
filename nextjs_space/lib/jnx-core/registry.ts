/**
 * JNX Product Registry
 * 
 * Central registry for all products using the JNX Learning Platform.
 * Products register themselves via defineProduct() and become
 * automatically discoverable by the dashboard and AI engine.
 * 
 * Thread-safe, singleton pattern.
 */

import { ProductConfig } from './types'

/**
 * Product Registry Class
 * Manages all registered products in memory
 */
class ProductRegistry {
  private products = new Map<string, ProductConfig>()
  private static instance: ProductRegistry | null = null

  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {
    // Initialize empty registry
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ProductRegistry {
    if (!ProductRegistry.instance) {
      ProductRegistry.instance = new ProductRegistry()
    }
    return ProductRegistry.instance
  }

  /**
   * Register a product
   * @param config Complete product configuration
   * @throws Error if product ID already exists
   */
  register(config: ProductConfig): void {
    if (this.products.has(config.id)) {
      console.warn(`Product '${config.id}' is already registered. Overwriting...`)
    }

    // Validate configuration
    this.validateConfig(config)

    this.products.set(config.id, config)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ JNX Product registered: ${config.name} (${config.id} v${config.version})`)
      console.log(`   Events: ${Object.keys(config.events).length}`)
      console.log(`   Protected: ${config.protected.length} paths`)
      console.log(`   Goals: ${Object.keys(config.goals).length}`)
    }
  }

  /**
   * Validate product configuration
   */
  private validateConfig(config: ProductConfig): void {
    if (!config.id || config.id.length === 0) {
      throw new Error('Product ID is required')
    }

    if (!config.name || config.name.length === 0) {
      throw new Error('Product name is required')
    }

    if (!config.version) {
      throw new Error('Product version is required')
    }

    if (Object.keys(config.events).length === 0) {
      throw new Error('At least one event type must be defined')
    }

    // Validate event schemas
    for (const [eventType, eventSchema] of Object.entries(config.events)) {
      if (!eventSchema.schema) {
        throw new Error(`Event type '${eventType}' must have a Zod schema`)
      }
    }
  }

  /**
   * Get product by ID
   */
  get(productId: string): ProductConfig | undefined {
    return this.products.get(productId)
  }

  /**
   * Get all registered products
   */
  getAll(): ProductConfig[] {
    return Array.from(this.products.values())
  }

  /**
   * Get all product IDs
   */
  getProductIds(): string[] {
    return Array.from(this.products.keys())
  }

  /**
   * Check if product is registered
   */
  has(productId: string): boolean {
    return this.products.has(productId)
  }

  /**
   * Get product count
   */
  count(): number {
    return this.products.size
  }

  /**
   * Unregister a product (useful for testing)
   */
  unregister(productId: string): boolean {
    return this.products.delete(productId)
  }

  /**
   * Clear all products (useful for testing)
   */
  clear(): void {
    this.products.clear()
  }
}

/**
 * Get singleton registry instance
 */
export const registry = ProductRegistry.getInstance()

/**
 * Define and register a new product
 * 
 * @example
 * ```typescript
 * export default defineProduct({
 *   id: 'qryx',
 *   name: 'QRYX AI Sales Assistant',
 *   version: '1.0.0',
 *   events: {
 *     'chat_message': {
 *       schema: z.object({
 *         message: z.string(),
 *         response: z.string()
 *       })
 *     }
 *   },
 *   protected: ['core/chat-engine'],
 *   optimizable: ['prompts/*'],
 *   goals: {
 *     responseTime: { target: 2000, unit: 'ms' }
 *   }
 * })
 * ```
 */
export function defineProduct(config: ProductConfig): ProductConfig {
  registry.register(config)
  return config
}

/**
 * Get product configuration by ID
 * @throws Error if product not found
 */
export function getProduct(productId: string): ProductConfig {
  const product = registry.get(productId)
  if (!product) {
    throw new Error(
      `Product '${productId}' not found. Make sure it's imported in your app. ` +
      `Available products: ${registry.getProductIds().join(', ') || 'none'}`
    )
  }
  return product
}

/**
 * Get all registered products
 */
export function getAllProducts(): ProductConfig[] {
  return registry.getAll()
}

/**
 * Check if component path is protected
 * @param productId Product ID
 * @param componentPath Path to check (e.g., 'core/chat-engine')
 * @returns true if path is protected
 */
export function isProtectedPath(
  productId: string,
  componentPath: string
): boolean {
  const product = getProduct(productId)
  
  return product.protected.some(protectedPath => {
    // Support wildcard patterns
    if (protectedPath.endsWith('/*')) {
      const prefix = protectedPath.slice(0, -2)
      return componentPath.startsWith(prefix)
    }
    
    return componentPath === protectedPath
  })
}

/**
 * Check if component path is optimizable
 */
export function isOptimizablePath(
  productId: string,
  componentPath: string
): boolean {
  const product = getProduct(productId)
  
  return product.optimizable.some(optimizablePath => {
    if (optimizablePath.endsWith('/*')) {
      const prefix = optimizablePath.slice(0, -2)
      return componentPath.startsWith(prefix)
    }
    
    return componentPath === optimizablePath
  })
}