import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'dealer') 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const requests = await prisma.productRequest.findMany({
    where: { dealerId: session.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'dealer')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const body = await req.json();
  const { productName, category, unit, estimatedPrice, description, reason } = body;
  
  if (!productName || !category || !unit || !estimatedPrice) {
    return NextResponse.json({ error: 'Product name, category, unit and estimated price are required' }, { status: 400 });
  }
  
  const request = await prisma.productRequest.create({
    data: {
      dealerId: session.id,
      productName,
      category,
      unit,
      estimatedPrice: parseFloat(estimatedPrice),
      description: description || null,
      reason: reason || null,
      status: 'pending',
    },
  });
  return NextResponse.json({ ok: true, request }, { status: 201 });
}
