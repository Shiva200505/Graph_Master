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
        ]);

        return NextResponse.json({
            dailyRevenue,
            ordersByStatus,
            topProducts,
            topDealers,
            fulfillmentStats,
            totalStats: totalStats[0] ?? { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
        });
    } catch (err) {
        console.error('[analytics]', err);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
