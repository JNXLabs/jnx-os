/**
 * Qryx Configuration API
 * 
 * GET: Retrieve configuration for a shop
 * PUT: Update configuration
 * 
 * PROTECTED: Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import {
  getShopifyShopById,
  getShopifyShopByOrg,
  getOrCreateQryxConfig,
  updateQryxConfig,
} from '@/lib/db/qryx-helpers';
import { upsertUser } from '@/lib/db/helpers';
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/qryx/config');

// =============================================================================
// GET CONFIGURATION
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sync user to database
    const jnxUser = await upsertUser(clerkUser.id, {
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
    });

    if (!jnxUser?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    // Get shop
    const { searchParams } = new URL(request.url);
    const shop_id = searchParams.get('shop_id');

    let shop;
    if (shop_id) {
      shop = await getShopifyShopById(shop_id);
    } else {
      shop = await getShopifyShopByOrg(jnxUser.org_id);
    }

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Verify ownership
    if (shop.org_id !== jnxUser.org_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get configuration
    const config = await getOrCreateQryxConfig(shop.id);

    return NextResponse.json({ config });
  } catch (error) {
    logger.error('Failed to get config', { error });
    return NextResponse.json(
      { error: 'Failed to retrieve configuration' },
      { status: 500 }
    );
  }
}

// =============================================================================
// UPDATE CONFIGURATION
// =============================================================================

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sync user to database
    const jnxUser = await upsertUser(clerkUser.id, {
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
    });

    if (!jnxUser?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    // Parse request
    const body = await request.json();
    const { shop_id, updates } = body;

    if (!shop_id || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get shop
    const shop = await getShopifyShopById(shop_id);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Verify ownership
    if (shop.org_id !== jnxUser.org_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update configuration
    const config = await updateQryxConfig(shop.id, updates);

    logger.info('Config updated', { shop_id: shop.id });

    return NextResponse.json({ config });
  } catch (error) {
    logger.error('Failed to update config', { error });
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

// =============================================================================
// ROUTE CONFIG
// =============================================================================

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
