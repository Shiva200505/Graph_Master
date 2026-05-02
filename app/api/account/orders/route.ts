import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'customer') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const userPhone = session.phone?.replace(/\s+/g, '');
        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { userId: session.id },
                    ...(userPhone ? [{ customerPhone: userPhone }] : [])
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                items: { select: { productName: true, quantity: true, unitPrice: true, subtotal: true } },
                dealer: { select: { name: true, phone: true } },
            },
        });

        return NextResponse.json({
            orders: orders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                dealerName: o.dealer.name,
                fulfillmentType: o.fulfillmentType,
                status: o.status,
                total: Number(o.total),
                deliveryCharge: Number(o.deliveryCharge),
                createdAt: o.createdAt,
                items: o.items.map(i => ({ ...i, unitPrice: Number(i.unitPrice), subtotal: Number(i.subtotal) })),
            })),
        });
    } catch (err) {
        console.error('[account/orders]', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
