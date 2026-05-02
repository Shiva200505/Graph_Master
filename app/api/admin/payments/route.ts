import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'all';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limitParam = searchParams.get('limit') ?? '20';
  const isAll = limitParam === 'all';
  const limit = isAll ? 1000 : Math.min(parseInt(limitParam) || 20, 200);
  const skip = isAll ? 0 : (page - 1) * limit;

  // Date range filter
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');
  
  const where: any = {};
  if (status !== 'all') where.status = status;
  
  if (fromStr || toStr) {
      const createdAt: Record<string, Date> = {};
      if (fromStr) createdAt.gte = new Date(`${fromStr}T00:00:00.000Z`);
      if (toStr) createdAt.lte = new Date(`${toStr}T23:59:59.999Z`);
      where.createdAt = createdAt;
  }
  
  try {
      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            order: {
              select: {
                orderNumber: true,
                customerName: true,
                customerPhone: true,
                status: true,
              }
            }
          }
        }),
        prisma.payment.count({ where })
      ]);
      
      return NextResponse.json({
        payments: payments.map(p => ({
          id: p.id,
          orderId: p.orderId,
          orderNumber: p.order.orderNumber,
          customerName: p.order.customerName,
          customerPhone: p.order.customerPhone,
          orderStatus: p.order.status,
          amount: Number(p.amount),
          status: p.status,
          merchantTransactionId: p.merchantTransactionId,
          transactionId: p.transactionId,
          createdAt: p.createdAt,
        })),
        total,
        totalPages: isAll ? 1 : Math.ceil(total / limit),
        page,
      });
  } catch (err) {
      console.error('[admin/payments GET]', err);
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
