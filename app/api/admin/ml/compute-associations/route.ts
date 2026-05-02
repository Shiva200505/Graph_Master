import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/ml/compute-associations
 * Recomputes the product_associations table using Apriori-style association rules.
 * Run this:
 *   - On a cron schedule (daily, e.g., at 2 AM)
 *   - After a significant batch of new orders
 *   - Manually from admin panel
 *
 * Association rule: If a farmer buys Product A, what is the probability they
 * also buy Product B in the same order or within 7 days?
 * 
 * PRODUCTION CRON SETUP:
 * Add to vercel.json for daily recompute at 2 AM IST (8:30 PM UTC):
 * {
 *   "crons": [{
 *     "path": "/api/admin/ml/cron-recompute",
 *     "schedule": "30 20 * * *"
 *   }]
 * }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Step 1: Clear old associations
    await prisma.$executeRaw`TRUNCATE TABLE product_associations`;

    // Step 2: Count individual product orders (for support calculation)
    // Step 3: Count co-occurrences (products in same order)
    // Step 4: Compute confidence and lift
    await prisma.$executeRaw`
      WITH order_product_pairs AS (
        -- All (order_id, product_id) pairs from confirmed orders
        SELECT oi.order_id, oi.product_id
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status NOT IN ('cancelled', 'pending_payment')
      ),
      product_counts AS (
        -- How many orders contain each product (support)
        SELECT product_id, COUNT(DISTINCT order_id)::float as order_count
        FROM order_product_pairs
        GROUP BY product_id
      ),
      total_orders AS (
        SELECT COUNT(DISTINCT order_id)::float as n
        FROM order_product_pairs
      ),
      co_occurrences AS (
        -- Products that appear in the SAME order
        SELECT 
          a.product_id as product_a,
          b.product_id as product_b,
          COUNT(DISTINCT a.order_id)::int as co_count
        FROM order_product_pairs a
        JOIN order_product_pairs b 
          ON a.order_id = b.order_id 
          AND a.product_id != b.product_id
        GROUP BY a.product_id, b.product_id
        HAVING COUNT(DISTINCT a.order_id) >= 2  -- minimum 2 co-occurrences
      )
      INSERT INTO product_associations (product_a, product_b, co_occurrence_count, confidence, lift, last_computed)
      SELECT 
        co.product_a,
        co.product_b,
        co.co_count,
        -- Confidence: P(B|A) = orders_with_both / orders_with_A
        (co.co_count / pc_a.order_count)::decimal(5,4) as confidence,
        -- Lift: confidence / P(B) — lift > 1 means positively correlated
        ((co.co_count / pc_a.order_count) / (pc_b.order_count / t.n))::decimal(8,4) as lift,
        NOW()
      FROM co_occurrences co
      JOIN product_counts pc_a ON pc_a.product_id = co.product_a
      JOIN product_counts pc_b ON pc_b.product_id = co.product_b
      CROSS JOIN total_orders t
      WHERE (co.co_count / pc_a.order_count) >= 0.1  -- min 10% confidence
      ON CONFLICT (product_a, product_b) DO UPDATE SET
        co_occurrence_count = EXCLUDED.co_occurrence_count,
        confidence = EXCLUDED.confidence,
        lift = EXCLUDED.lift,
        last_computed = NOW()
    `;

    // Count how many associations were computed
    const countResult = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count FROM product_associations
    `;

    return NextResponse.json({
      ok: true,
      message: 'Product associations computed successfully',
      associationPairs: countResult[0]?.count ?? 0,
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[ml/compute-associations]', err);
    return NextResponse.json({ error: 'Failed to compute associations' }, { status: 500 });
  }
}

/**
 * GET /api/admin/ml/compute-associations
 * Returns current association stats without recomputing
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await prisma.$queryRaw<{
    total_pairs: number;
    avg_confidence: number;
    avg_lift: number;
    last_computed: Date;
    top_pairs: number;
  }[]>`
    SELECT 
      COUNT(*)::int as total_pairs,
      ROUND(AVG(confidence)::numeric, 3) as avg_confidence,
      ROUND(AVG(lift)::numeric, 3) as avg_lift,
      MAX(last_computed) as last_computed,
      COUNT(CASE WHEN lift > 2 THEN 1 END)::int as top_pairs
    FROM product_associations
  `;

  const topAssociations = await prisma.$queryRaw<{
    product_a_name: string;
    product_b_name: string;
    confidence: number;
    lift: number;
    co_occurrence_count: number;
  }[]>`
    SELECT 
      pa_name.name as product_a_name,
      pb_name.name as product_b_name,
      pa.confidence,
      pa.lift,
      pa.co_occurrence_count
    FROM product_associations pa
    JOIN products pa_name ON pa_name.id = pa.product_a
    JOIN products pb_name ON pb_name.id = pa.product_b
    WHERE pa.lift > 1.5
    ORDER BY pa.lift DESC
    LIMIT 10
  `;

  return NextResponse.json({
    stats: stats[0] ?? {},
    topAssociations,
  });
}
