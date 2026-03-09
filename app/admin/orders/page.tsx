'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';

const STATUSES = ['all', 'pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

interface Order {
    id: string; orderNumber: string; customerName: string; customerPhone: string;
    dealerName: string; itemCount: number; total: number; fulfillmentType: string;
    status: string; createdAt: string;
}

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ status, page: String(page), limit: '20' });
        if (search) params.set('search', search);
        const res = await fetch(`/api/admin/orders?${params}`);
        const data = await res.json();
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setLoading(false);
    }, [status, search, page]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Orders</h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>{total} total orders</p>
            </div>

            {/* Filters */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input className="input" placeholder="Search order#, customer..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ width: '240px', fontSize: '0.84rem' }} />
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {STATUSES.map(s => (
                        <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1.5px solid', borderColor: status === s ? 'var(--leaf-600)' : 'var(--gray-200)', background: status === s ? 'var(--leaf-600)' : 'white', color: status === s ? 'white' : 'var(--gray-600)', fontWeight: status === s ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                            {s === 'all' ? 'All' : s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                {['Order #', 'Customer', 'Phone', 'Dealer', 'Items', 'Total', 'Type', 'Status', 'Date'].map(h => (
                                    <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i}><td colSpan={9} style={{ padding: '0.75rem 1rem' }}><div className="skeleton" style={{ height: '18px' }} /></td></tr>
                            )) : orders.length === 0 ? (
                                <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>No orders found</td></tr>
                            ) : orders.map((o, i) => (
                                <tr key={o.id} onClick={() => router.push(`/admin/orders/${o.id}`)}
                                    style={{ borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', transition: 'background 0.1s', background: i % 2 === 0 ? 'white' : '#fafafa' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--leaf-50)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa')}>
                                    <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: 'var(--leaf-700)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>#{o.orderNumber}</td>
                                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customerName}</td>
                                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>{o.customerPhone}</td>
                                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.8rem', color: 'var(--gray-600)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.dealerName}</td>
                                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', textAlign: 'center' }}>{o.itemCount}</td>
                                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', fontWeight: 700 }}>₹{o.total.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.78rem' }}>
                                        <span style={{ background: o.fulfillmentType === 'pickup' ? '#E0F2FE' : '#FEF3C7', color: o.fulfillmentType === 'pickup' ? '#0369A1' : '#92400E', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.72rem' }}>
                                            {o.fulfillmentType === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.7rem 1rem' }}><StatusBadge status={o.status} size="sm" /></td>
                                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.78rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Page {page} of {totalPages}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.35rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: '0.82rem' }}>← Prev</button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.35rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: '0.82rem' }}>Next →</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
