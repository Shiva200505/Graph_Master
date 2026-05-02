import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'customer')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id } = await params;
  const userPhone = session.phone?.replace(/\s+/g, '');
  
  // Verify order belongs to this user (by ID or Phone)
  const order = await prisma.order.findFirst({
    where: { 
      id, 
      OR: [
        { userId: session.id },
        ...(userPhone ? [{ customerPhone: userPhone }] : [])
      ]
    },
    include: { payment: true }
  });
  
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  
  // Can only cancel if not yet dispatched
  if (['dispatched', 'delivered', 'cancelled'].includes(order.status)) {
    return NextResponse.json({ 
      error: 'Order cannot be cancelled at this stage. Contact dealer directly.' 
    }, { status: 400 });
  }
  
  // Update order status
  await prisma.order.update({
    where: { id },
    data: { status: 'cancelled', paymentStatus: 'refund_pending' }
  });
  
  // Note: Actual PhonePe refund API integration would go here
  // For now, flag it for admin to process manually
  
  return NextResponse.json({ 
    ok: true, 
    message: 'Order cancelled. Refund will be processed in 5-7 business days.' 
  });
}
