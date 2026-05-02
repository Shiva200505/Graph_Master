import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'customer')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { name } = await req.json();
  if (!name || name.trim().length < 2)
    return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
  
  await prisma.user.update({
    where: { id: session.id },
    data: { name: name.trim() }
  });
  return NextResponse.json({ ok: true });
}
