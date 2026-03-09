'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';

interface DealerDetail {
    id: string; name: string; phone: string; email: string; address: string;
    isActive: boolean; coverageRadiusKm: number;
    inventory: { id: string; productName: string; category: string; unit: string; basePrice: number; price: number | null; quantity: number }[];
    orders: { id: string; orderNumber: string; customerName: string; total: number; status: string; itemCount: number; createdAt: string }[];
}

export default function AdminDealerDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [dealer, setDealer] = useState<DealerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'inventory' | 'orders'>('orders');

    useEffect(() => {
        fetch(`/api/admin/dealers/${id}`).then(r => r.json()).then(d => setDealer(d.dealer)).finally(() => setLoading(false));
    }, [id]);

    const toggleActive = async () => {
        if (!dealer) return;
        const res = await fetch(`/api/admin/dealers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !dealer.isActive }) });
        const data = await res.json();
        if (data.ok) setDealer(d => d ? { ...d, isActive: !d.isActive } : d);
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--gray-400)' }}>Loading…</div>;
    if (!dealer) return <div style={{ color: '#DC2626' }}>Dealer not found</div>;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--gray-400)' }}>
                <button onClick={() => router.push('/admin/dealers')} style={{ background: 'none', border: 'none', color: 'var(--leaf-600)', cursor: 'pointer', fontWeight: 600 }}>Dealers</button>
                <span>›</span><span style={{ color: 'var(--gray-700)', fontWeight: 600 }}>{dealer.name}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{dealer.name}</h1>
                    <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>📞 {dealer.phone}</span>
                        {dealer.email && <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>✉️ {dealer.email}</span>}
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>📍 {dealer.coverageRadiusKm} km radius</span>
                    </div>
                </div>
                <button onClick={toggleActive} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', background: dealer.isActive ? '#FEE2E2' : '#D1FAE5', color: dealer.isActive ? '#991B1B' : '#065F46', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    {dealer.isActive ? 'Deactivate Dealer' : 'Activate Dealer'}
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--gray-200)', marginBottom: '1.25rem' }}>
                {(['orders', 'inventory'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{ padding: '0.6rem 1.25rem', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--leaf-600)' : '2px solid transparent', marginBottom: '-2px', fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--leaf-700)' : 'var(--gray-500)', cursor: 'pointer', fontSize: '0.88rem', textTransform: 'capitalize' }}>
                        {t === 'orders' ? `Orders (${dealer.orders.length})` : `Inventory (${dealer.inventory.length})`}
                    </button>
                ))}
            </div>

            {tab === 'orders' ? (
                <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                            {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date'].map(h => (
                                <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>{dealer.orders.map((o, i) => (
                            <tr key={o.id} onClick={() => router.push(`/admin/orders/${o.id}`)} style={{ borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', background: 'white' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--leaf-50)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: 'var(--leaf-700)', fontSize: '0.82rem' }}>#{o.orderNumber}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem' }}>{o.customerName}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', textAlign: 'center' }}>{o.itemCount}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', fontWeight: 700 }}>₹{o.total.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '0.7rem 1rem' }}><StatusBadge status={o.status} size="sm" /></td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.78rem', color: 'var(--gray-400)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : (
                <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                            {['Product', 'Category', 'Base Price', 'Dealer Price', 'Stock'].map(h => (
                                <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>{dealer.inventory.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                <td style={{ padding: '0.7rem 1rem' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.productName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{item.unit}</div>
                                </td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', color: 'var(--gray-600)' }}>{item.category}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem' }}>₹{item.basePrice}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', fontWeight: 600 }}>{item.price ? `₹${item.price}` : '—'}</td>
                                <td style={{ padding: '0.7rem 1rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: item.quantity < 10 ? '#DC2626' : item.quantity < 20 ? '#D97706' : '#16a34a' }}>
                                        {item.quantity}
                                        {item.quantity < 10 && <span style={{ fontSize: '0.72rem', marginLeft: '0.3rem', color: '#DC2626' }}>⚠️ Low</span>}
                                    </span>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
