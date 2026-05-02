import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { getDevNotifications } = await import('@/lib/devNotifications');
    return NextResponse.json({ notifications: getDevNotifications() });
}
