import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id } = await params;
  const { action, adminNote, basePrice, initialStock } = await req.json();
  
  const request = await prisma.productRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
  if (action === 'approve') {
    // Use basePrice from request or admin override
    const price = basePrice || Number(request.estimatedPrice);
    
    // Check if product already exists with the same name
    let product = await prisma.product.findFirst({
        where: { name: { equals: request.productName, mode: 'insensitive' } }
    });

    if (!product) {
        // Create product
        product = await prisma.product.create({
            data: {
                name: request.productName,
                description: request.description,
                category: request.category,
                unit: request.unit,
                basePrice: price,
                isActive: true,
            },
        });
    }
    
    // Check if it already exists in dealer inventory
    const existingInv = await prisma.dealerInventory.findUnique({
        where: { dealerId_productId: { dealerId: request.dealerId, productId: product.id } }
    });

    if (!existingInv) {
        // Add to dealer inventory
        await prisma.dealerInventory.create({
            data: {
                dealerId: request.dealerId,
                productId: product.id,
                quantity: initialStock || 0,
                price: price,
            },
        });
    } else {
        await prisma.dealerInventory.update({
            where: { dealerId_productId: { dealerId: request.dealerId, productId: product.id } },
            data: {
                quantity: { increment: initialStock || 0 }
            }
        });
    }
    
    // Update request status
    await prisma.productRequest.update({
        where: { id },
        data: { status: 'approved', adminNote: adminNote || 'Request approved' },
    });
    
    return NextResponse.json({ ok: true, productId: product.id });
  }
  
  if (action === 'reject') {
    await prisma.productRequest.update({
        where: { id },
        data: { status: 'rejected', adminNote: adminNote || 'Request rejected' },
    });
    return NextResponse.json({ ok: true });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
