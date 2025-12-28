/**
 * JNX Events API Endpoint
 * 
 * Universal endpoint for logging events from all products.
 * Features:
 * - Authentication required (Clerk)
 * - Product validation
 * - Event schema validation
 * - Automatic PII redaction
 * - GDPR compliant
 * 
 * POST /api/jnx/events
 * Body: {
 *   product_type: string,
 *   event_type: string,
 *   event_data: object,
 *   session_id?: string,
 *   metadata?: object
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getProduct } from '@/lib/jnx-core/registry'
import { redactSensitiveFields } from '@/lib/privacy/redaction'
import { logger } from '@/lib/observability/logger'

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'

/**
 * POST - Log product event
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const clerkUser = await currentUser()
    if (!clerkUser) {
      logger.warn('Unauthorized event logging attempt')
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    let body: {
      product_type: string
      event_type: string
      event_data: Record<string, unknown>
      session_id?: string
      metadata?: Record<string, unknown>
    }

    try {
      body = await request.json()
    } catch (error) {
      logger.error('Invalid JSON in request body', { error })
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { product_type, event_type, event_data, session_id, metadata } = body

    // 3. Validate required fields
    if (!product_type || typeof product_type !== 'string') {
      return NextResponse.json(
        { error: 'product_type is required and must be a string' },
        { status: 400 }
      )
    }

    if (!event_type || typeof event_type !== 'string') {
      return NextResponse.json(
        { error: 'event_type is required and must be a string' },
        { status: 400 }
      )
    }

    if (!event_data || typeof event_data !== 'object') {
      return NextResponse.json(
        { error: 'event_data is required and must be an object' },
        { status: 400 }
      )
    }

    // 4. Validate product exists
    let product
    try {
      product = getProduct(product_type)
    } catch (error) {
      logger.error('Product not found', { product_type, error })
      return NextResponse.json(
        { 
          error: `Product '${product_type}' not registered`,
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      )
    }

    // 5. Validate event type exists
    const eventSchema = product.events[event_type]
    if (!eventSchema) {
      logger.error('Event type not found', { product_type, event_type })
      return NextResponse.json(
        { 
          error: `Event type '${event_type}' not defined for product '${product_type}'`,
          available_types: Object.keys(product.events)
        },
        { status: 400 }
      )
    }

    // 6. Validate event data against schema
    let validatedData: unknown
    try {
      validatedData = eventSchema.schema.parse(event_data)
    } catch (error) {
      logger.error('Event data validation failed', { 
        product_type, 
        event_type, 
        error 
      })
      return NextResponse.json(
        { 
          error: 'Event data validation failed',
          details: error instanceof Error ? error.message : 'Unknown validation error'
        },
        { status: 400 }
      )
    }

    // 7. PII Redaction (server-side safety net)
    const redactedData = redactSensitiveFields(validatedData as Record<string, unknown>)
    const redactedMetadata = metadata ? redactSensitiveFields(metadata) : {}

    // 8. Get user's database record
    const supabase = await createSupabaseServerClient()
    if (!supabase) {
      logger.error('Failed to create Supabase client')
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    
    const { data: jnxUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUser.id)
      .single()

    if (userError || !jnxUser) {
      logger.error('Failed to fetch user from database', { 
        clerk_user_id: clerkUser.id,
        error: userError 
      })
      // Don't block event logging if user not found (graceful degradation)
      // This can happen during webhook delays
    }

    // 9. Insert event into database
    const { error: insertError } = await supabase
      .from('product_events')
      .insert({
        product_type,
        event_type,
        user_id: jnxUser?.id || null,
        session_id: session_id || null,
        event_data: redactedData,
        metadata: {
          ...redactedMetadata,
          clerk_user_id: clerkUser.id,
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString()
      })

    if (insertError) {
      logger.error('Failed to insert event', { 
        product_type,
        event_type,
        error: insertError 
      })
      return NextResponse.json(
        { error: 'Failed to log event. Please try again.' },
        { status: 500 }
      )
    }

    // 10. Success!
    logger.info('Event logged successfully', {
      product_type,
      event_type,
      user_id: jnxUser?.id,
      session_id
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Event logged successfully'
      },
      { status: 200 }
    )

  } catch (error) {
    logger.error('Unexpected error in event logging', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get events (for analytics dashboard)
 * Optional: Implement later in Phase 3
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const product_type = searchParams.get('product_type')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query
    const supabase = await createSupabaseServerClient()
    if (!supabase) {
      logger.error('Failed to create Supabase client')
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    
    let query = supabase
      .from('product_events')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by product type if provided
    if (product_type) {
      query = query.eq('product_type', product_type)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Failed to fetch events', { error })
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        events: data,
        count: data.length,
        limit,
        offset
      },
      { status: 200 }
    )

  } catch (error) {
    logger.error('Unexpected error fetching events', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}