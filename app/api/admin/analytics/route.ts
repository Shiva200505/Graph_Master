import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma';

export const dynamic = 'force-dynamic';

function getClient() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return { prisma: new PrismaClient({ adapter }), pool };
}

/**
 * GET /api/admin/analytics
 * Returns:
 *  - dailyRevenue: last 30 days revenue grouped by date
 *  - ordersByStatus: count per status
 *  - topProducts: top 5 by order count
 *  - topDealers: top 5 by revenue
 *  - ordersByFulfillment: pickup vs delivery count
 *  - locationInsights: top 8 locations by order count
 *  - mlStats: returning customer rate, avg items per order
 */
export async function GET(req: NextRequest) {
    const { prisma, pool } = getClient();

    // Auth check
    const cookie = req.cookies.get('gm_session');
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const [
            dailyRevenue,
            ordersByStatus,
            topProducts,
            topDealers,
            fulfillmentStats,
            totalStats,
            locationInsights,
            mlStatsRows,
        ] = await Promise.all([

            // Daily revenue — last 30 days
            prisma.$queryRaw<{ date: string; revenue: number; count: number }[]>`
        SELECT
          TO_CHAR(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS date,
          ROUND(SUM(total)::numeric, 2) AS revenue,
          COUNT(*)::int AS count
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
          AND status NOT IN ('cancelled')
        GROUP BY date
        ORDER BY date ASC
      `,

            // Orders by status
            prisma.$queryRaw<{ status: string; count: number }[]>`
        SELECT status, COUNT(*)::int AS count
        FROM orders
        GROUP BY status
        ORDER BY count DESC
      `,

            // Top 5 products by total quantity ordered
            prisma.$queryRaw<{ productName: string; totalQty: number; totalRevenue: number }[]>`
        SELECT
          product_name AS "productName",
          SUM(quantity)::int AS "totalQty",
          ROUND(SUM(subtotal)::numeric, 2) AS "totalRevenue"
        FROM order_items
        GROUP BY product_name
        ORDER BY "totalQty" DESC
        LIMIT 5
      `,

            // Top 5 dealers by revenue
            prisma.$queryRaw<{ dealerName: string; orderCount: number; revenue: number }[]>`
        SELECT
          d.name AS "dealerName",
          COUNT(o.id)::int AS "orderCount",
          ROUND(SUM(o.total)::numeric, 2) AS revenue
        FROM orders o
        JOIN dealers d ON d.id = o.dealer_id
        WHERE o.status NOT IN ('cancelled')
        GROUP BY d.id, d.name
        ORDER BY revenue DESC
        LIMIT 5
      `,

            // Fulfillment split
            prisma.$queryRaw<{ fulfillmentType: string; count: number }[]>`
        SELECT fulfillment_type AS "fulfillmentType", COUNT(*)::int AS count
        FROM orders
        GROUP BY fulfillment_type
      `,

            // Summary totals
            prisma.$queryRaw<{ totalOrders: number; totalRevenue: number; avgOrderValue: number }[]>`
        SELECT
          COUNT(*)::int AS "totalOrders",
          ROUND(SUM(total)::numeric, 2) AS "totalRevenue",
          ROUND(AVG(total)::numeric, 2) AS "avgOrderValue"
        FROM orders
        WHERE status NOT IN ('cancelled')
      `,

            // Top locations by order count — grouped by city extracted from delivery_address
            prisma.$queryRaw<{ location: string; order_count: number; revenue: number }>`
        SELECT
          CASE
            WHEN delivery_address ILIKE '%Pune%'       THEN 'Pune'
            WHEN delivery_address ILIKE '%Nashik%'     THEN 'Nashik'
            WHEN delivery_address ILIKE '%Shirur%'     THEN 'Shirur'
            WHEN delivery_address ILIKE '%Ahmednagar%' THEN 'Ahmednagar'
            WHEN delivery_address ILIKE '%Solapur%'    THEN 'Solapur'
            WHEN delivery_address ILIKE '%Kolhapur%'   THEN 'Kolhapur'
            WHEN delivery_address ILIKE '%Satara%'     THEN 'Satara'
            WHEN delivery_address ILIKE '%Sangli%'     THEN 'Sangli'
            ELSE 'Other'
          END AS location,
          COUNT(*)::int AS order_count,
          ROUND(SUM(total)::numeric, 2) AS revenue
        FROM orders
        WHERE status NOT IN ('cancelled')
        GROUP BY location
        ORDER BY order_count DESC
        LIMIT 8
      `,

            // ML stats proxy — returning customer rate + avg items per order
            prisma.$queryRaw<{ total_orders: number; returning_customers: number; avg_items_per_order: number }[]>`
        SELECT
          COUNT(DISTINCT o.id)::int                    AS total_orders,
          COUNT(DISTINCT o.user_id)::int               AS returning_customers,
          ROUND(AVG(oi.quantity)::numeric, 1)          AS avg_items_per_order
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.status NOT IN ('cancelled')
      `,
        ]);

        const mlServiceActive = !!process.env.ML_SERVICE_URL;

        return NextResponse.json({
            dailyRevenue,
            ordersByStatus,
            topProducts,
            topDealers,
            fulfillmentStats,
            totalStats: totalStats[0] ?? { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
            locationInsights,
            mlStats: {
                ...(mlStatsRows[0] ?? { total_orders: 0, returning_customers: 0, avg_items_per_order: 0 }),
                mlServiceActive,
            },
        });
    } catch (err) {
        console.error('[analytics]', err);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
