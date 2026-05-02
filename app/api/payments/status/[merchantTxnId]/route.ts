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
 * GET /api/payments/status/[merchantTxnId]
 * Used by the success page to poll payment result (handles redirect-back case
 * where callback may not have fired yet).
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ merchantTxnId: string }> }
) {
    const { merchantTxnId } = await params;
    const { prisma, pool } = getClient();

    try {
        // Check DB first
        const payment = await prisma.payment.findUnique({
            where: { merchantTransactionId: merchantTxnId },
            include: { order: { select: { id: true, orderNumber: true, status: true, paymentStatus: true, total: true } } },
        });

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // If already resolved in DB, return immediately
        if (payment.status === 'success') {
            return NextResponse.json({ status: 'success', order: payment.order });
        }
        if (payment.status === 'failed') {
            return NextResponse.json({ status: 'failed', order: payment.order });
        }

        // Still pending
        return NextResponse.json({ status: 'pending', order: payment.order });
    } catch (err) {
        console.error('[payments/status]', err);
        return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
