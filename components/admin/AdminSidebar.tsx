'use client';

import { useRouter, usePathname } from 'next/navigation';

const NAV = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/orders', label: 'Orders', icon: '📦' },
    { href: '/admin/dealers', label: 'Dealers', icon: '🏪' },
    { href: '/admin/products', label: 'Products', icon: '🌾' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
];

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    };

    return (
        <aside style={{
            width: '220px', flexShrink: 0, background: '#0C2410',
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}>
            {/* Logo */}
            <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>🍇</span>
                    <div>
                        <div style={{ fontWeight: 900, color: 'white', fontSize: '1rem', letterSpacing: '-0.03em' }}>
                            Grape<span style={{ color: '#52B061' }}>Master</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Admin Panel
                        </div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {NAV.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                    return (
                        <a key={item.href} href={item.href} style={{
                            display: 'flex', alignItems: 'center', gap: '0.625rem',
                            padding: '0.6rem 0.875rem', borderRadius: '10px',
                            background: isActive ? 'rgba(82,176,97,0.15)' : 'transparent',
                            color: isActive ? '#7ECB8C' : 'rgba(255,255,255,0.6)',
                            textDecoration: 'none', fontWeight: isActive ? 700 : 500,
                            fontSize: '0.88rem', transition: 'all 0.15s',
                            borderLeft: isActive ? '3px solid #52B061' : '3px solid transparent',
                        }}>
                            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                            {item.label}
                        </a>
                    );
                })}
            </nav>

            {/* Footer */}
            <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={handleLogout} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.6rem 0.875rem', borderRadius: '10px', border: 'none',
                    background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', cursor: 'pointer',
                    fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
                }}>
                    <span>🚪</span> Logout
                </button>
                <div style={{ marginTop: '0.75rem', padding: '0 0.5rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)' }}>
                    GrapeMaster Admin v2.0
                </div>
            </div>
        </aside>
    );
}
