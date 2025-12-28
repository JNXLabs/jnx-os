/**
 * JNX Products Registry
 * 
 * Central import file for all registered products.
 * Import this file in your app layout to auto-register all products.
 * 
 * Usage:
 * ```typescript
 * // In app/layout.tsx or _app.tsx
 * import '@/lib/jnx-products'
 * ```
 * 
 * Adding a new product:
 * 1. Create folder: lib/jnx-products/your-product/
 * 2. Create config: lib/jnx-products/your-product/config.ts
 * 3. Import here: import './your-product/config'
 * 4. Done! Product is auto-registered.
 */

// Import all product configurations
// Products self-register via defineProduct()
import './qryx/config'

// Future products:
// import './trading-bot/config'
// import './analytics-dashboard/config'
// import './data-pipeline/config'

// Export registry utilities for convenience
export { 
  registry,
  defineProduct,
  getProduct,
  getAllProducts,
  isProtectedPath,
  isOptimizablePath
} from '@/lib/jnx-core/registry'

export { 
  ProductEventLogger,
  createProductLogger 
} from '@/lib/jnx-core/event-logger'

export {
  useProductLogger,
  useLogEvent,
  useSessionId
} from '@/lib/jnx-core/hooks'

export type {
  ProductConfig,
  ProductEvent,
  AIInsight,
  ProductGoal,
  EventSchema
} from '@/lib/jnx-core/types'