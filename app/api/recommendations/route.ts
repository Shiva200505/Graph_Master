import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

// ── Maharashtra Crop Season Logic ─────────────────────────────────────────────
// Returns category weights based on current month (Indian agricultural calendar)
function getSeasonWeights(): Record<string, number> {
  const month = new Date().getMonth() + 1; // 1-12

  // Kharif: June–October (Soybean, Cotton, Rice belt)
  if (month >= 6 && month <= 10) {
    return { Fertilizer: 1.8, Seeds: 2.2, Pesticide: 1.6, Equipment: 1.0 };
  }
  // Rabi sowing: October–November (Wheat, Onion, Chickpea)
  if (month === 10 || month === 11) {
    return { Seeds: 2.5, Fertilizer: 1.9, Pesticide: 1.2, Equipment: 1.1 };
  }
  // Rabi growing: December–February (Onion care, Wheat)
  if (month >= 12 || month <= 2) {
    return { Fertilizer: 2.0, Pesticide: 1.8, Equipment: 1.4, Seeds: 1.0 };
  }
  // Pre-summer / Harvest: March–May (Irrigation focus, Grape pruning Nashik)
  if (month >= 3 && month <= 5) {
    return { Equipment: 2.2, Fertilizer: 1.5, Pesticide: 1.3, Seeds: 1.6 };
  }
  // Default
  return { Fertilizer: 1.0, Seeds: 1.0, Pesticide: 1.0, Equipment: 1.0 };
}

// ── Recommendation Engine ─────────────────────────────────────────────────────
async function getRecommendations(params: {
  userId?: string | null;
  sessionId?: string | null;
  lat?: number | null;
  lng?: number | null;
  productId?: string | null;
  dealerId?: string | null;
  limit: number;
  pool: Pool;
}): Promise<{ products: Record<string, unknown>[]; strategy: string }> {
  const { userId, sessionId, lat, lng, productId, dealerId, limit, pool } = params;
  const seasonWeights = getSeasonWeights();

  // ── STRATEGY 1: Collaborative Filtering for Known Users ──────────────────
  // "Farmers with similar purchase patterns also bought..."
  if (userId) {
    const result = await pool.query<{
      id: string; name: string; category: string; base_price: string;
      image_url: string | null; score: number;
    }>(
      `WITH user_purchases AS (
        -- Products this user has already bought
        SELECT DISTINCT oi.product_id
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = $1::uuid
          AND o.status NOT IN ('cancelled', 'pending_payment')
      ),
      similar_users AS (
        -- Users who bought at least 2 of the same products as this user
        SELECT DISTINCT o.user_id, COUNT(*) as overlap
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE oi.product_id IN (SELECT product_id FROM user_purchases)
          AND o.user_id != $1::uuid
          AND o.user_id IS NOT NULL
          AND o.status NOT IN ('cancelled', 'pending_payment')
        GROUP BY o.user_id
        HAVING COUNT(*) >= 2
        ORDER BY overlap DESC
        LIMIT 50
      ),
      candidate_products AS (
        -- Products similar users bought that THIS user hasn't bought yet
        SELECT 
          oi.product_id,
          COUNT(DISTINCT o.user_id) as buyer_count,
          SUM(oi.quantity) as total_qty
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id IN (SELECT user_id FROM similar_users)
          AND oi.product_id NOT IN (SELECT product_id FROM user_purchases)
          AND o.status NOT IN ('cancelled', 'pending_payment')
        GROUP BY oi.product_id
      )
      SELECT 
        p.id, p.name, p.category, p.base_price, p.image_url,
        (cp.buyer_count * 3.0 + cp.total_qty * 0.5) as score
      FROM candidate_products cp
      JOIN products p ON p.id = cp.product_id
      WHERE p.is_active = true
      ORDER BY score DESC
      LIMIT $2`,
      [userId, limit * 2]
    );

    if (result.rows.length >= Math.floor(limit / 2)) {
      // Apply season weighting
      const weighted = result.rows.map(r => ({
        ...r,
        score: r.score * (seasonWeights[r.category ?? 'Fertilizer'] ?? 1.0),
      })).sort((a, b) => (b.score as number) - (a.score as number)).slice(0, limit);

      return { products: weighted as Record<string, unknown>[], strategy: 'collaborative_filtering' };
    }
  }

  // ── STRATEGY 2: Location-Based Popularity ────────────────────────────────
  // "Trending in your area" — orders from nearby farmers (50km radius)
  if (lat && lng) {
    const result = await pool.query<{
      id: string; name: string; category: string; base_price: string;
      image_url: string | null; nearby_orders: number;
    }>(
      `SELECT 
        p.id, p.name, p.category, p.base_price, p.image_url,
        COUNT(DISTINCT oi.order_id)::int as nearby_orders
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      JOIN dealers d ON d.id = o.dealer_id
      WHERE o.status NOT IN ('cancelled', 'pending_payment')
        AND p.is_active = true
        AND ST_DWithin(
          d.location::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          50000  -- 50km radius
        )
        AND o.created_at >= NOW() - INTERVAL '90 days'
      GROUP BY p.id, p.name, p.category, p.base_price, p.image_url
      HAVING COUNT(DISTINCT oi.order_id) >= 1
      ORDER BY nearby_orders DESC
      LIMIT $3`,
      [lat, lng, limit * 2]
    );

    if (result.rows.length >= Math.floor(limit / 2)) {
      const weighted = result.rows.map(r => ({
        ...r,
        score: r.nearby_orders * (seasonWeights[r.category ?? 'Fertilizer'] ?? 1.0),
      })).sort((a, b) => (b.score as number) - (a.score as number)).slice(0, limit);

      return { products: weighted as Record<string, unknown>[], strategy: 'location_based' };
    }
  }

  // ── STRATEGY 3: Frequently Bought Together ────────────────────────────────
  // Uses pre-computed product_associations table
  // Triggered when a specific productId is provided (product detail page)
  if (productId) {
    const result = await pool.query<{
      id: string; name: string; category: string; base_price: string;
      image_url: string | null; lift: number;
    }>(
      `SELECT 
        p.id, p.name, p.category, p.base_price, p.image_url,
        pa.lift
      FROM product_associations pa
      JOIN products p ON p.id = pa.product_b
      WHERE pa.product_a = $1::uuid
        AND pa.lift > 1.0
        AND p.is_active = true
      ORDER BY pa.lift DESC
      LIMIT $2`,
      [productId, limit]
    );

    if (result.rows.length > 0) {
      return { products: result.rows as Record<string, unknown>[], strategy: 'frequently_bought_together' };
    }
  }

  // ── STRATEGY 4: Implicit Signal Based (Anonymous + Session) ──────────────
  // Use cart_add and view events from this session to recommend
  if (sessionId) {
    const result = await pool.query<{
      id: string; name: string; category: string; base_price: string;
      image_url: string | null; signal_score: number;
    }>(
      `WITH session_viewed AS (
        SELECT DISTINCT product_id
        FROM recommendation_events
        WHERE session_id = $1
          AND event_type IN ('view', 'cart_add')
          AND created_at >= NOW() - INTERVAL '7 days'
      ),
      session_categories AS (
        SELECT p.category, COUNT(*) as interest_count
        FROM session_viewed sv
        JOIN products p ON p.id = sv.product_id
        GROUP BY p.category
      )
      SELECT 
        p.id, p.name, p.category, p.base_price, p.image_url,
        (sc.interest_count * 2.0) as signal_score
      FROM products p
      JOIN session_categories sc ON sc.category = p.category
      WHERE p.id NOT IN (SELECT product_id FROM session_viewed)
        AND p.is_active = true
      ORDER BY signal_score DESC, p.name
      LIMIT $2`,
      [sessionId, limit]
    );

    if (result.rows.length > 0) {
      const weighted = result.rows.map(r => ({
        ...r,
        score: r.signal_score * (seasonWeights[r.category ?? 'Fertilizer'] ?? 1.0),
      })).sort((a, b) => (b.score as number) - (a.score as number));
      return { products: weighted as Record<string, unknown>[], strategy: 'session_interest' };
    }
  }

  // ── STRATEGY 5: Season-Weighted Popularity Fallback ───────────────────────
  // Last resort — but still smarter than pure order count because of season weights
  const result = await pool.query<{
    id: string; name: string; category: string; base_price: string;
    image_url: string | null; order_count: number;
  }>(
    `SELECT 
      p.id, p.name, p.category, p.base_price, p.image_url,
      COUNT(DISTINCT oi.order_id)::int as order_count
    FROM products p
    JOIN order_items oi ON oi.product_id = p.id
    JOIN orders o ON o.id = oi.order_id
    WHERE p.is_active = true
      AND o.status NOT IN ('cancelled', 'pending_payment')
      AND o.created_at >= NOW() - INTERVAL '60 days'
      ${productId ? `AND p.id != '${productId}'::uuid` : ''}
    GROUP BY p.id, p.name, p.category, p.base_price, p.image_url
    ORDER BY order_count DESC
    LIMIT $1`,
    [limit * 3]
  );

  // Apply season weighting to make fallback smarter
  const weighted = result.rows.map(r => ({
    ...r,
    score: r.order_count * (seasonWeights[r.category ?? 'Fertilizer'] ?? 1.0),
  })).sort((a, b) => (b.score as number) - (a.score as number)).slice(0, limit);

  return { products: weighted as Record<string, unknown>[], strategy: 'season_weighted_popularity' };
}

function getCurrentSeasonName(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 9) return 'kharif';
  if (month >= 10 && month <= 11) return 'rabi_sowing';
  if (month >= 12 || month <= 2) return 'rabi_growing';
  if (month >= 3 && month <= 5) return 'summer';
  return 'transition';
}

// ── Main Handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
  const productId = searchParams.get('productId') || null;
  const dealerId = searchParams.get('dealerId') || null;
  const userId = searchParams.get('userId') || null;
  const sessionId = searchParams.get('sessionId') || null;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '4', 10), 8);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { products, strategy } = await getRecommendations({
      userId, sessionId, lat, lng, productId, dealerId, limit, pool,
    });

    // Normalize output format
    const recommendations = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: parseFloat(p.base_price as string),
      imageUrl: (p.image_url as string | null) || null,
      score: parseFloat(
        String(p.score ?? p.lift ?? p.nearby_orders ?? p.order_count ?? 0)
      ),
    }));

    // Add Cache-Control: 5 minutes
    return new NextResponse(
      JSON.stringify({
        source: strategy,
        recommendations,
        season: getCurrentSeasonName(),
        meta: {
          strategy,
          count: recommendations.length,
          hasLocation: !!(lat && lng),
          hasUserHistory: !!userId,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('[recommendations]', err);
    return NextResponse.json({ source: 'error', recommendations: [] }, { status: 500 });
  } finally {
    await pool.end();
  }
}
