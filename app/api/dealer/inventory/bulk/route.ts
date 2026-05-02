import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'dealer')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { updates, addToExisting } = await req.json();
  if (!Array.isArray(updates) || updates.length === 0)
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  
  // Verify all items belong to this dealer
  const items = await prisma.dealerInventory.findMany({
    where: { id: { in: updates.map(u => u.id) }, dealerId: session.id }
  });
  if (items.length !== updates.length)
    return NextResponse.json({ error: 'Some items not found' }, { status: 404 });
  
  // Update all in a transaction
  await prisma.$transaction(
    updates.map(u => prisma.dealerInventory.update({
      where: { id: u.id },
      data: { quantity: addToExisting 
        ? { increment: parseInt(u.quantity) || 0 } 
        : parseInt(u.quantity) || 0
      }
    }))
  );
  
  return NextResponse.json({ ok: true, updated: updates.length });
}
