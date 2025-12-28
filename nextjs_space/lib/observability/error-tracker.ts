/**
 * JNX-OS Agentic LLMOps: Error Tracker
 * 
 * Global Error Handler with Health Logging
 * 
 * Features:
 * - Automatic error detection and logging
 * - Performance monitoring (>2s = warning)
 * - GDPR-compliant PII redaction
 * - Critical error alerting
 * - Function wrapper for easy integration
 */

import { createClient } from '@supabase/supabase-js'
import { redactAll } from '@/lib/privacy/redaction'

// ================================================================
// TYPES
// ================================================================

export interface HealthLogEntry {
  log_type: 'error' | 'performance' | 'warning'
  severity: 'low' | 'medium' | 'high' | 'critical'
  component: string
  error_message?: string
  stack_trace?: string
  execution_time_ms?: number
  request_path?: string
  request_method?: string
  user_agent?: string
  user_id?: string
  org_id?: string
  metadata?: Record<string, any>
}

export interface HealthLogResult {
  success: boolean
  log_id?: string
  error?: string
}

// ================================================================
// CONFIG
// ================================================================

const PERFORMANCE_THRESHOLD_MS = 2000 // 2 seconds
const CRITICAL_ERROR_KEYWORDS = [
  'database',
  'connection',
  'timeout',
  'authentication',
  'authorization',
  'security',
  'duplicate key',
  'constraint violation'
]

// ================================================================
// CORE FUNCTION: Track Health Event
// ================================================================

/**
 * Logs a health event to the database
 * 
 * @param entry - Health log entry details
 * @returns Promise<HealthLogResult>
 * 
 * @example
 * await trackHealthEvent({
 *   log_type: 'error',
 *   severity: 'critical',
 *   component: 'auth',
 *   error_message: 'Failed to authenticate user',
 *   stack_trace: error.stack
 * })
 */
export async function trackHealthEvent(
  entry: HealthLogEntry
): Promise<HealthLogResult> {
  try {
    // 1. GDPR: Redact PII before logging
    const safeEntry = {
      ...entry,
      error_message: entry.error_message 
        ? redactAll(entry.error_message) 
        : null,
      stack_trace: entry.stack_trace 
        ? redactAll(entry.stack_trace) 
        : null,
      metadata: entry.metadata 
        ? JSON.parse(redactAll(JSON.stringify(entry.metadata))) 
        : null
    }

    // 2. Create Supabase client (server-side)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 3. Insert into database
    const { data, error } = await supabase
      .from('system_health_logs')
      .insert(safeEntry)
      .select('id')
      .single()

    if (error) {
      // Fallback: Console log if DB insertion fails
      console.error('[HealthTracker] DB Insert Failed:', error)
      console.error('[HealthTracker] Entry:', safeEntry)
      return { success: false, error: error.message }
    }

    // 4. Critical Error Handling
    if (entry.severity === 'critical') {
      await handleCriticalError(entry)
    }

    return { success: true, log_id: data.id }

  } catch (error: any) {
    // Ultimate fallback: Console log
    console.error('[HealthTracker] Fatal Error:', error)
    return { success: false, error: error.message }
  }
}

// ================================================================
// CRITICAL ERROR HANDLER
// ================================================================

async function handleCriticalError(entry: HealthLogEntry) {
  console.error('=========================================')
  console.error('[CRITICAL ERROR DETECTED]')
  console.error('=========================================')
  console.error(`Component: ${entry.component}`)
  console.error(`Message: ${entry.error_message}`)
  console.error('=========================================')

  // TODO Phase 2: Send Slack/Email Alert
  // await sendSlackAlert({
  //   channel: '#jnx-critical-alerts',
  //   text: `🚨 CRITICAL ERROR in ${entry.component}`,
  //   blocks: [
  //     {
  //       type: 'section',
  //       text: {
  //         type: 'mrkdwn',
  //         text: `*Component:* ${entry.component}\n*Message:* ${entry.error_message}`
  //       }
  //     }
  //   ]
  // })
}

// ================================================================
// FUNCTION WRAPPER: withErrorTracking
// ================================================================

/**
 * Wraps a function with automatic error tracking and performance monitoring
 * 
 * @param fn - Function to wrap
 * @param component - Component name for logging
 * @returns Wrapped function with error tracking
 * 
 * @example
 * const safeFn = withErrorTracking(unsafeFn, 'auth-service')
 * await safeFn(args)
 */
export function withErrorTracking<T extends (...args: any[]) => any>(
  fn: T,
  component: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now()
    const functionName = fn.name || 'anonymous'

    try {
      // Execute function
      const result = await fn(...args)
      const executionTime = Date.now() - startTime

      // Track slow operations (>2s)
      if (executionTime > PERFORMANCE_THRESHOLD_MS) {
        await trackHealthEvent({
          log_type: 'performance',
          severity: executionTime > 5000 ? 'high' : 'medium',
          component,
          execution_time_ms: executionTime,
          metadata: {
            function: functionName,
            args_count: args.length,
            threshold_ms: PERFORMANCE_THRESHOLD_MS
          }
        })
      }

      return result

    } catch (error: any) {
      const executionTime = Date.now() - startTime

      // Determine severity
      const severity = determineSeverity(error.message)

      // Track error
      await trackHealthEvent({
        log_type: 'error',
        severity,
        component,
        error_message: error.message,
        stack_trace: error.stack,
        execution_time_ms: executionTime,
        metadata: {
          function: functionName,
          args_count: args.length
        }
      })

      // Re-throw error (don't swallow it)
      throw error
    }
  }) as T
}

// ================================================================
// SEVERITY DETERMINATION
// ================================================================

function determineSeverity(errorMessage: string): HealthLogEntry['severity'] {
  const lowerMessage = errorMessage.toLowerCase()

  // Critical: Database, Auth, Security issues
  if (CRITICAL_ERROR_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    return 'critical'
  }

  // High: Errors that affect user experience
  if (
    lowerMessage.includes('failed') ||
    lowerMessage.includes('unable') ||
    lowerMessage.includes('cannot')
  ) {
    return 'high'
  }

  // Medium: Recoverable errors
  if (
    lowerMessage.includes('warning') ||
    lowerMessage.includes('deprecated')
  ) {
    return 'medium'
  }

  // Default: Low
  return 'low'
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

/**
 * Track a performance issue
 */
export async function trackPerformance(
  component: string,
  executionTime: number,
  metadata?: Record<string, any>
) {
  return trackHealthEvent({
    log_type: 'performance',
    severity: executionTime > 5000 ? 'high' : 'medium',
    component,
    execution_time_ms: executionTime,
    metadata
  })
}

/**
 * Track an error
 */
export async function trackError(
  component: string,
  error: Error,
  severity?: HealthLogEntry['severity']
) {
  return trackHealthEvent({
    log_type: 'error',
    severity: severity || determineSeverity(error.message),
    component,
    error_message: error.message,
    stack_trace: error.stack
  })
}

/**
 * Track a warning
 */
export async function trackWarning(
  component: string,
  message: string,
  metadata?: Record<string, any>
) {
  return trackHealthEvent({
    log_type: 'warning',
    severity: 'low',
    component,
    error_message: message,
    metadata
  })
}
