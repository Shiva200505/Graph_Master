import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [counts, topViewed] = await Promise.all([
    prisma.$queryRaw<{ event_type: string; count: number }[]>`
      SELECT event_type, COUNT(*)::int as count
      FROM recommendation_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY event_type
    `,
    prisma.$queryRaw<{ name: string; view_count: number }[]>`
      SELECT p.name, COUNT(*)::int as view_count
      FROM recommendation_events re
      JOIN products p ON p.id = re.product_id
      WHERE re.event_type = 'view'
        AND re.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY p.name
      ORDER BY view_count DESC
      LIMIT 5
    `,
  ]);

  const views = counts.find(c => c.event_type === 'view')?.count ?? 0;
  const cart_adds = counts.find(c => c.event_type === 'cart_add')?.count ?? 0;
  const purchases = counts.find(c => c.event_type === 'purchase')?.count ?? 0;

  const uniqueSessions = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(DISTINCT COALESCE(session_id, user_id::text))::int as count
    FROM recommendation_events
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `;

  return NextResponse.json({
    views,
    cart_adds,
    purchases,
    unique_sessions: uniqueSessions[0]?.count ?? 0,
    top_viewed: topViewed,
  });
}
