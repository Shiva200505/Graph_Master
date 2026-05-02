import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// This endpoint is called by Vercel Cron — no user auth, uses CRON_SECRET
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow without secret
  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Run the same association computation as the admin manual trigger
    await prisma.$executeRaw`TRUNCATE TABLE product_associations`;

    await prisma.$executeRaw`
      WITH order_product_pairs AS (
        SELECT oi.order_id, oi.product_id
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status NOT IN ('cancelled', 'pending_payment')
      ),
      product_counts AS (
        SELECT product_id, COUNT(DISTINCT order_id)::float as order_count
        FROM order_product_pairs
        GROUP BY product_id
      ),
      total_orders AS (
        SELECT COUNT(DISTINCT order_id)::float as n
        FROM order_product_pairs
      ),
      co_occurrences AS (
        SELECT 
          a.product_id as product_a,
          b.product_id as product_b,
          COUNT(DISTINCT a.order_id)::int as co_count
        FROM order_product_pairs a
        JOIN order_product_pairs b 
          ON a.order_id = b.order_id 
          AND a.product_id != b.product_id
        GROUP BY a.product_id, b.product_id
        HAVING COUNT(DISTINCT a.order_id) >= 2
      )
      INSERT INTO product_associations (product_a, product_b, co_occurrence_count, confidence, lift, last_computed)
      SELECT 
        co.product_a,
        co.product_b,
        co.co_count,
        (co.co_count / pc_a.order_count)::decimal(5,4),
        ((co.co_count / pc_a.order_count) / (pc_b.order_count / t.n))::decimal(8,4),
        NOW()
      FROM co_occurrences co
      JOIN product_counts pc_a ON pc_a.product_id = co.product_a
      JOIN product_counts pc_b ON pc_b.product_id = co.product_b
      CROSS JOIN total_orders t
      WHERE (co.co_count / pc_a.order_count) >= 0.1
      ON CONFLICT (product_a, product_b) DO UPDATE SET
        co_occurrence_count = EXCLUDED.co_occurrence_count,
        confidence = EXCLUDED.confidence,
        lift = EXCLUDED.lift,
        last_computed = NOW()
    `;

    console.log(`[cron] ML associations recomputed at ${new Date().toISOString()}`);
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/ml]', err);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
