import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import DealerSidebar from '@/components/dealer/DealerSidebar';

export const metadata = { title: 'GrapeMaster Dealer Panel' };

export default async function DealerLayout({ children }: { children: React.ReactNode }) {
    // Read pathname forwarded by middleware — skip auth guard on login page
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') ?? '';

    // ── Login page: just render the form, no auth check ───────────────────────
    if (pathname === '/dealer/login') {
        return <>{children}</>;
    }

    // ── All other /dealer/* pages: require a valid dealer session ─────────────
    const session = await getSession();
    if (!session || session.role !== 'dealer') redirect('/dealer/login');

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
            <DealerSidebar name={session!.name} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '0.875rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                        Dealer Portal — <strong style={{ color: 'var(--gray-900)' }}>{session!.name}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B07FD7' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Connected</span>
                    </div>
                </div>
                <main style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>{children}</main>
            </div>
        </div>
    );
}
