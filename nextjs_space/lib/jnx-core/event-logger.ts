/**
 * JNX Event Logger
 * 
 * Universal event logging system for all products.
 * Features:
 * - Type-safe event logging with Zod validation
 * - Automatic PII redaction
 * - Batch processing (optional)
 * - Retry logic
 * - Session tracking
 * 
 * Usage:
 * ```typescript
 * const logger = new ProductEventLogger('qryx')
 * await logger.logEvent('chat_message', {
 *   message: 'Hello',
 *   response: 'Hi there!'
 * })
 * ```
 */

import { getProduct } from './registry'
import { EventLoggerConfig } from './types'
import { redactSensitiveFields } from '@/lib/privacy/redaction'
import { v4 as uuidv4 } from 'uuid'

/**
 * Product Event Logger Class
 * Handles event logging for a specific product
 */
export class ProductEventLogger {
  private productId: string
  private config: EventLoggerConfig
  private sessionId: string
  private eventQueue: Array<{
    eventType: string
    data: unknown
    metadata?: Record<string, unknown>
  }> = []
  private flushTimer: NodeJS.Timeout | null = null

  constructor(
    productId: string,
    config: EventLoggerConfig = {}
  ) {
    this.productId = productId
    this.config = {
      enablePIIRedaction: true,
      batchSize: 10,
      retryAttempts: 3,
      debugMode: process.env.NODE_ENV === 'development',
      ...config
    }
    this.sessionId = uuidv4()

    if (this.config.debugMode) {
      console.log(`[JNX Logger] Initialized for product: ${productId}`)
    }
  }

  /**
   * Log an event
   * @param eventType Event type (must be defined in product config)
   * @param data Event data (validated against schema)
   * @param metadata Optional metadata (device, location, etc.)
   */
  async logEvent<T = unknown>(
    eventType: string,
    data: T,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Get product config
      const product = getProduct(this.productId)

      // Validate event type exists
      const eventSchema = product.events[eventType]
      if (!eventSchema) {
        throw new Error(
          `Event type '${eventType}' not defined for product '${this.productId}'. ` +
          `Available types: ${Object.keys(product.events).join(', ')}`
        )
      }

      // Validate data against schema
      const validatedData = eventSchema.schema.parse(data)

      // PII Redaction (if enabled)
      const finalData = this.config.enablePIIRedaction
        ? this.redactData(validatedData) as Record<string, unknown>
        : validatedData

      const finalMetadata = this.config.enablePIIRedaction && metadata
        ? this.redactData(metadata) as Record<string, unknown>
        : metadata

      // Debug logging
      if (this.config.debugMode) {
        console.log(`[JNX Logger] Event logged: ${this.productId}.${eventType}`)
        console.log('Data:', finalData)
      }

      // Queue event for batch processing or send immediately
      if (this.config.batchSize && this.config.batchSize > 1) {
        await this.queueEvent(eventType, finalData, finalMetadata)
      } else {
        await this.sendEvent(eventType, finalData, finalMetadata)
      }

    } catch (error) {
      console.error(`[JNX Logger] Failed to log event:`, error)
      
      // Re-throw validation errors (developer needs to fix)
      if (error instanceof Error && error.name === 'ZodError') {
        throw error
      }
      
      // Don't throw for network errors (graceful degradation)
    }
  }

  /**
   * Queue event for batch processing
   */
  private async queueEvent(
    eventType: string,
    data: unknown,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    this.eventQueue.push({ eventType, data, metadata })

    // Flush if batch size reached
    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      await this.flush()
    } else {
      // Set timer to flush after 5 seconds
      if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => this.flush(), 5000)
      }
    }
  }

  /**
   * Flush queued events
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    if (this.eventQueue.length === 0) return

    const eventsToSend = [...this.eventQueue]
    this.eventQueue = []

    if (this.config.debugMode) {
      console.log(`[JNX Logger] Flushing ${eventsToSend.length} events`)
    }

    // Send all events in parallel
    await Promise.allSettled(
      eventsToSend.map(({ eventType, data, metadata }) =>
        this.sendEvent(eventType, data, metadata)
      )
    )
  }

  /**
   * Send event to API
   */
  private async sendEvent(
    eventType: string,
    data: unknown,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const payload = {
      product_type: this.productId,
      event_type: eventType,
      event_data: data,
      session_id: this.sessionId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }
    }

    let lastError: Error | null = null
    const maxAttempts = this.config.retryAttempts || 3

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch('/api/jnx/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API returned ${response.status}: ${errorText}`)
        }

        // Success!
        return

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < maxAttempts) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All retries failed
    console.error(
      `[JNX Logger] Failed to send event after ${maxAttempts} attempts:`,
      lastError
    )
  }

  /**
   * Redact PII from data
   */
  private redactData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data
    }

    // Use existing redaction utility
    return redactSensitiveFields(data as Record<string, unknown>)
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Reset session (useful for logout/login)
   */
  resetSession(): void {
    this.sessionId = uuidv4()
    if (this.config.debugMode) {
      console.log(`[JNX Logger] Session reset: ${this.sessionId}`)
    }
  }

  /**
   * Destroy logger (flush pending events)
   */
  async destroy(): Promise<void> {
    await this.flush()
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }
  }
}

/**
 * Create a product event logger
 * @param productId Product ID
 * @param config Optional configuration
 */
export function createProductLogger(
  productId: string,
  config?: EventLoggerConfig
): ProductEventLogger {
  return new ProductEventLogger(productId, config)
}