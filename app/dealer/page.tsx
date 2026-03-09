'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';

interface Stats {
    totalOrders: number; pendingOrders: number; todayRevenue: number; lowStockCount: number;
    recentOrders: { id: string; orderNumber: string; customerName: string; total: number; status: string; itemCount: number; createdAt: string }[];
}

export default function DealerDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dealer/stats').then(r => r.json()).then(setStats).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div>
            <div className="skeleton" style={{ height: '28px', width: '200px', marginBottom: '1.5rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '14px' }} />)}
            </div>
        </div>
    );

    if (!stats) return <div style={{ color: '#DC2626' }}>Failed to load</div>;

    return (
        <div>
            <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Dealer Dashboard</h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>Manage your orders and inventory from here.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <StatCard label="Total Orders" value={stats.totalOrders} icon="📦" color="#8B5CF6" />
                <StatCard label="Pending Orders" value={stats.pendingOrders} icon="⏳" color="#F59E0B" sublabel="Need action" />
                <StatCard label="Today's Revenue" value={`₹${stats.todayRevenue.toLocaleString('en-IN')}`} icon="💰" color="#2A7436" />
                <StatCard label="Low Stock Items" value={stats.lowStockCount} icon="⚠️" color="#EF4444" sublabel="< 10 units" />
            </div>

            {/* Recent Orders */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Recent Orders</div>
                    <button onClick={() => router.push('/dealer/orders')} style={{ background: 'none', border: 'none', color: '#8B5CF6', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>View All →</button>
                </div>
                {stats.recentOrders.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--gray-400)' }}>No orders yet</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                            {['Order #', 'Customer', 'Items', 'Total', 'Status'].map(h => (
                                <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>{stats.recentOrders.map(o => (
                            <tr key={o.id} onClick={() => router.push(`/dealer/orders`)} style={{ borderBottom: '1px solid var(--gray-50)', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#FDF4FF'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: '#8B5CF6', fontSize: '0.82rem' }}>#{o.orderNumber}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem' }}>{o.customerName}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', textAlign: 'center' }}>{o.itemCount}</td>
                                <td style={{ padding: '0.7rem 1rem', fontWeight: 700, fontSize: '0.82rem' }}>₹{o.total.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '0.7rem 1rem' }}><StatusBadge status={o.status} size="sm" /></td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
