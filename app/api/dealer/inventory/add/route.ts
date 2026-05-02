import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'dealer')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { productId, quantity, price } = await req.json();
  
  // Check product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true }
  });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  
  // Check not already in inventory
  const existing = await prisma.dealerInventory.findUnique({
    where: { dealerId_productId: { dealerId: session.id, productId } }
  });
  if (existing) return NextResponse.json({ error: 'Product already in your inventory' }, { status: 409 });
  
  const item = await prisma.dealerInventory.create({
    data: {
      dealerId: session.id,
      productId,
      quantity: parseInt(quantity) || 0,
      price: parseFloat(price),
    }
  });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
