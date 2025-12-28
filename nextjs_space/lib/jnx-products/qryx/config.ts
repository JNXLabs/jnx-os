/**
 * QRYX Product Configuration
 * 
 * Defines events, goals, and protected zones for the QRYX AI Sales Assistant.
 * This serves as a reference implementation for other products.
 * 
 * Integration:
 * 1. Define this config
 * 2. Import in lib/jnx-products/index.ts
 * 3. Use useProductLogger('qryx') in components
 * 4. Done! Analytics and AI analysis work automatically.
 */

import { z } from 'zod'
import { defineProduct } from '@/lib/jnx-core/registry'

/**
 * QRYX Product Definition
 */
export default defineProduct({
  id: 'qryx',
  name: 'QRYX AI Sales Assistant',
  version: '1.0.0',
  
  /**
   * Event Types with Validation Schemas
   * Each event type that Qryx can log
   */
  events: {
    /**
     * Chat Message Event
     * Logged every time a user sends a message and receives a response
     */
    'chat_message': {
      schema: z.object({
        message: z.string().min(1).max(5000),
        response: z.string().min(1).max(10000),
        intent: z.string().optional(),          // Detected user intent
        sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
        confidence: z.number().min(0).max(1).optional(),
        response_time_ms: z.number().positive().optional(),
        model_used: z.string().optional(),
      }),
      description: 'Logged when user sends a message and receives AI response'
    },

    /**
     * User Feedback Event
     * Logged when user rates a response (thumbs up/down, rating)
     */
    'user_feedback': {
      schema: z.object({
        message_id: z.string().uuid().optional(),
        rating: z.number().int().min(1).max(5),
        feedback_type: z.enum(['thumbs_up', 'thumbs_down', 'star_rating']),
        comment: z.string().max(1000).optional(),
      }),
      description: 'User feedback on AI response quality'
    },

    /**
     * Session Started Event
     * Logged when user starts a new chat session
     */
    'session_started': {
      schema: z.object({
        entry_point: z.string().optional(),     // Where did user come from?
        device_type: z.enum(['mobile', 'tablet', 'desktop']).optional(),
      }),
      description: 'New chat session initiated'
    },

    /**
     * Session Ended Event
     * Logged when user ends chat session
     */
    'session_ended': {
      schema: z.object({
        duration_ms: z.number().positive(),
        message_count: z.number().int().min(0),
        satisfaction_score: z.number().min(0).max(1).optional(),
      }),
      description: 'Chat session ended'
    },

    /**
     * Error Event
     * Logged when something goes wrong
     */
    'error_occurred': {
      schema: z.object({
        error_type: z.string(),
        error_message: z.string(),
        context: z.record(z.unknown()).optional(),
      }),
      description: 'Error occurred during chat'
    },
  },
  
  /**
   * Protected Components
   * AI must NEVER modify these automatically
   */
  protected: [
    'core/chat-engine',           // Core chat logic
    'core/authentication',        // User auth
    'api/payment/*',              // Payment processing
    'api/webhooks/*',             // External integrations
    'lib/security/*',             // Security features
  ],
  
  /**
   * Optimizable Components
   * AI CAN suggest changes to these (with human approval)
   */
  optimizable: [
    'prompts/*',                  // AI prompts and templates
    'ui/formatting',              // Response formatting
    'ui/suggestions',             // Suggested responses
    'performance/caching',        // Caching strategies
    'performance/batching',       // Request batching
  ],
  
  /**
   * Optimization Goals
   * Target metrics for AI to optimize towards
   */
  goals: {
    /**
     * Average response time (milliseconds)
     * Target: Under 2 seconds
     */
    responseTime: {
      target: 2000,
      unit: 'ms'
    },

    /**
     * User satisfaction score (1-5 stars)
     * Target: 4.5 or higher
     */
    userSatisfaction: {
      target: 4.5,
      unit: 'rating'
    },

    /**
     * Intent detection accuracy (0.0-1.0)
     * Target: 90% accuracy
     */
    intentAccuracy: {
      target: 0.9,
      unit: 'percentage'
    },

    /**
     * Sentiment detection accuracy (0.0-1.0)
     * Target: 85% accuracy
     */
    sentimentAccuracy: {
      target: 0.85,
      unit: 'percentage'
    },

    /**
     * Session engagement (messages per session)
     * Target: 8 messages average
     */
    sessionEngagement: {
      target: 8,
      unit: 'messages'
    },
  },

  /**
   * Additional Metadata
   */
  metadata: {
    category: 'ai_assistant',
    tags: ['sales', 'customer_support', 'ai', 'chatbot'],
    documentation_url: '/docs/products/qryx',
    status: 'beta',
  }
})