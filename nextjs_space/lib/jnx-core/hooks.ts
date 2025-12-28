/**
 * JNX Learning Platform - React Hooks
 * 
 * Provides React hooks for easy integration with the JNX Learning Platform.
 * 
 * @example
 * ```typescript
 * function QryxChat() {
 *   const logger = useProductLogger('qryx')
 *   
 *   const handleMessage = async (msg: string) => {
 *     const response = await getChatResponse(msg)
 *     await logger.logEvent('chat_message', {
 *       message: msg,
 *       response
 *     })
 *   }
 * }
 * ```
 */

'use client'

import { useMemo, useEffect, useRef } from 'react'
import { ProductEventLogger } from './event-logger'
import { EventLoggerConfig } from './types'

/**
 * React Hook: Product Event Logger
 * 
 * Creates a persistent event logger for a product.
 * Logger is memoized and destroyed on unmount.
 * 
 * @param productId Product ID (e.g., 'qryx')
 * @param config Optional logger configuration
 * @returns ProductEventLogger instance
 */
export function useProductLogger(
  productId: string,
  config?: EventLoggerConfig
): ProductEventLogger {
  const loggerRef = useRef<ProductEventLogger | null>(null)

  // Create logger once
  if (!loggerRef.current) {
    loggerRef.current = new ProductEventLogger(productId, config)
  }

  // Cleanup on unmount
  useEffect(() => {
    const logger = loggerRef.current
    return () => {
      if (logger) {
        logger.destroy().catch(console.error)
      }
    }
  }, [])

  return loggerRef.current
}

/**
 * React Hook: Log Event
 * 
 * Simplified hook that returns a logging function.
 * 
 * @param productId Product ID
 * @returns Function to log events
 * 
 * @example
 * ```typescript
 * const logEvent = useLogEvent('qryx')
 * await logEvent('chat_message', { message: 'Hello' })
 * ```
 */
export function useLogEvent(productId: string) {
  const logger = useProductLogger(productId)
  
  return useMemo(
    () => async <T = unknown>(
      eventType: string,
      data: T,
      metadata?: Record<string, unknown>
    ) => {
      await logger.logEvent(eventType, data, metadata)
    },
    [logger]
  )
}

/**
 * React Hook: Session ID
 * 
 * Gets the current session ID for the logger.
 * 
 * @param productId Product ID
 * @returns Current session ID
 */
export function useSessionId(productId: string): string {
  const logger = useProductLogger(productId)
  return logger.getSessionId()
}