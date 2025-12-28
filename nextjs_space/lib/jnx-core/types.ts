/**
 * JNX Learning Platform - Core Type Definitions
 * 
 * Defines types for the multi-product AI learning system.
 * All products (Qryx, Trading Bot, etc.) use these types.
 */

import { z } from 'zod'

/**
 * Protection Level for components
 * - absolute: AI can NEVER modify
 * - human_approval: Requires explicit approval
 * - monitored: Changes are logged but allowed
 */
export type ProtectionLevel = 'absolute' | 'human_approval' | 'monitored'

/**
 * Product Goal Configuration
 * Defines measurable targets for AI optimization
 */
export interface ProductGoal {
  target: number
  unit: string  // 'ms', 'percentage', 'rating', etc.
  current?: number
}

/**
 * Product Event Schema Definition
 * Each event type must have a Zod schema for validation
 */
export interface EventSchema {
  schema: z.ZodSchema<unknown>
  description?: string
}

/**
 * Complete Product Configuration
 * Used by defineProduct() to register new products
 */
export interface ProductConfig {
  id: string                                    // Unique ID: 'qryx', 'trading_bot'
  name: string                                  // Display name: 'QRYX AI Sales Assistant'
  version: string                               // Semantic version: '1.0.0'
  events: Record<string, EventSchema>           // Event types with schemas
  protected: string[]                           // Paths that AI can't modify
  optimizable: string[]                         // Paths that AI can modify
  goals: Record<string, ProductGoal>            // Optimization targets
  metadata?: Record<string, unknown>            // Additional product-specific data
}

/**
 * Product Event (stored in database)
 * Flexible JSONB structure for any product type
 */
export interface ProductEvent {
  id: string
  product_type: string
  event_type: string
  user_id?: string
  session_id?: string
  event_data: Record<string, unknown>           // Validated against schema
  metadata: Record<string, unknown>
  created_at: string
  indexed_at?: string
}

/**
 * AI Insight Status
 * Lifecycle: pending → approved/rejected → deployed → rolled_back
 */
export type InsightStatus = 'pending' | 'approved' | 'rejected' | 'deployed' | 'rolled_back'

/**
 * AI-Generated Insight
 * Optimization proposal that requires human approval
 */
export interface AIInsight {
  id: string
  product_type: string
  insight_type: 'pattern' | 'anomaly' | 'optimization' | 'improvement'
  title: string
  description: string
  confidence_score: number                      // 0.0 - 1.0
  supporting_data: Record<string, unknown>
  suggested_action?: string
  impact_estimate?: string
  status: InsightStatus
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

/**
 * Protected Component Definition
 * Defines no-go zones for AI
 */
export interface ProtectedComponent {
  id: string
  product_type: string
  component_path: string
  protection_level: ProtectionLevel
  reason: string
  created_at: string
}

/**
 * Optimization History Entry
 * Tracks deployed changes and their impact
 */
export interface OptimizationHistory {
  id: string
  insight_id: string
  deployed_at: string
  deployed_by?: string
  rollback_at?: string
  rollback_reason?: string
  success_metrics: Record<string, unknown>
  user_feedback: Record<string, unknown>
  a_b_test_config?: Record<string, unknown>
  notes?: string
}

/**
 * AI Analysis Session
 * Tracks background AI analysis jobs
 */
export interface AIAnalysisSession {
  id: string
  product_type: string
  session_type: 'pattern_detection' | 'anomaly_detection' | 'optimization_proposal'
  events_analyzed: number
  insights_generated: number
  started_at: string
  completed_at?: string
  duration_ms?: number
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  error_message?: string
  metadata: Record<string, unknown>
}

/**
 * Product Registry Entry (stored in database)
 */
export interface ProductRegistryEntry {
  id: string
  product_id: string
  product_name: string
  version: string
  status: 'active' | 'deprecated' | 'maintenance'
  config: ProductConfig
  registered_at: string
  updated_at: string
}

/**
 * Event Logger Configuration
 */
export interface EventLoggerConfig {
  enablePIIRedaction?: boolean                  // Default: true
  batchSize?: number                            // Batch events before sending
  retryAttempts?: number                        // Retry failed logs
  debugMode?: boolean                           // Log to console
}

/**
 * Analytics Time Range
 */
export interface TimeRange {
  start: Date
  end: Date
}

/**
 * Product Analytics Summary
 */
export interface ProductAnalytics {
  product_type: string
  total_events: number
  unique_users: number
  event_types: Record<string, number>           // Count per event type
  time_range: TimeRange
  goals_progress: Record<string, {
    current: number
    target: number
    percentage: number
  }>
}