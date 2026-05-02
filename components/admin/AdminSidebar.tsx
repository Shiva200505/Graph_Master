'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/orders', label: 'Orders', icon: '📦' },
    { href: '/admin/dealers', label: 'Dealers', icon: '🏪' },
    { href: '/admin/inventory', label: 'Inventory', icon: '🗂️' },
    { href: '/admin/products', label: 'Products', icon: '🌾' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/admin/ml', label: 'ML Engine', icon: '🤖' },
];

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Close sidebar when navigating on mobile
    useEffect(() => { setIsMobileOpen(false); }, [pathname]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    };

    const sidebarStyle: React.CSSProperties = {
        width: '220px',
        flexShrink: 0,
        background: '#0C2410',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        height: '100vh',
        overflowY: 'auto',
        zIndex: 300,
        transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isMobile && !isMobileOpen ? 'translateX(-100%)' : 'translateX(0)',
    };

    return (
        <>
            {/* Hamburger button — mobile only */}
            {isMobile && (
                <button
                    onClick={() => setIsMobileOpen(true)}
                    aria-label="Open menu"
                    style={{
                        position: 'fixed', top: '12px', left: '12px', zIndex: 200,
                        width: '42px', height: '42px', borderRadius: '10px',
                        background: '#0C2410', border: 'none', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', gap: '5px', boxShadow: 'var(--shadow-md)',
                    }}
                >
                    {[0, 1, 2].map(i => (
                        <span key={i} style={{ display: 'block', width: '18px', height: '2px', background: 'white', borderRadius: '2px' }} />
                    ))}
                </button>
            )}

            {/* Backdrop overlay */}
            {isMobile && isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        zIndex: 299, backdropFilter: 'blur(2px)',
                        animation: 'fadeIn 0.2s ease',
                    }}
                />
            )}

            {/* Sidebar */}
            <aside style={sidebarStyle}>
                {/* Logo + mobile close */}
                <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    {isMobile && (
                        <button onClick={() => setIsMobileOpen(false)}
                            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                            ✕
                        </button>
                    )}
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
        </>
    );
}
