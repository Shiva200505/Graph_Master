import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const requests = await prisma.productRequest.findMany({
    where: { status: 'pending' },
    include: { dealer: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ requests, total: requests.length });
}
