import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealer = await prisma.dealer.findUnique({
    where: { id },
    select: { id: true, name: true, isActive: true }
  });
  if (!dealer) return NextResponse.json({ active: false });
  return NextResponse.json({ active: dealer.isActive, name: dealer.name });
}
