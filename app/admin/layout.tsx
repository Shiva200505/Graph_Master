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
                {/* Top bar — padded left on mobile for the hamburger button */}
                <div style={{
                    background: 'white', borderBottom: '1px solid var(--gray-200)',
                    padding: '0.875rem 1.25rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0, paddingLeft: 'clamp(3.5rem, 10vw, 1.75rem)',
                }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong style={{ color: 'var(--gray-900)' }}>{session!.name}</strong>
                        <span className="hide-mobile"> — Admin</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Live</span>
                    </div>
                </div>
                <main style={{ flex: 1, padding: 'clamp(1rem, 4vw, 1.75rem)', overflowY: 'auto', paddingLeft: 'clamp(1rem, 4vw, 1.75rem)' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
