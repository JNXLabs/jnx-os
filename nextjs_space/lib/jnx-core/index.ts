/**
 * JNX Core - Main Export File
 * 
 * Central export point for all JNX Learning Platform core functionality.
 * 
 * Usage:
 * ```typescript
 * import { useProductLogger, getProduct } from '@/lib/jnx-core'
 * ```
 */

// Types
export type {
  ProductConfig,
  ProductEvent,
  AIInsight,
  ProtectedComponent,
  OptimizationHistory,
  AIAnalysisSession,
  ProductGoal,
  EventSchema,
  ProductAnalytics,
  EventLoggerConfig,
  ProtectionLevel,
  InsightStatus
} from './types'

// Registry
export {
  registry,
  defineProduct,
  getProduct,
  getAllProducts,
  isProtectedPath,
  isOptimizablePath
} from './registry'

// Event Logger
export {
  ProductEventLogger,
  createProductLogger
} from './event-logger'

// React Hooks
export {
  useProductLogger,
  useLogEvent,
  useSessionId
} from './hooks'