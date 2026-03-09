import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = { title: 'GrapeMaster Admin' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // Read the pathname forwarded by middleware — reliable in App Router Server Components
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') ?? '';

    // ── Login page: skip the auth-guard, just render the login form ────────────
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    // ── All other /admin/* pages: require a valid admin session ────────────────
    const session = await getSession();
    if (!session || session.role !== 'admin') redirect('/admin/login');

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
            <AdminSidebar />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Top bar */}
                <div style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '0.875rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                        Logged in as <strong style={{ color: 'var(--gray-900)' }}>{session!.name}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Live</span>
                    </div>
                </div>
                <main style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
