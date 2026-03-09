'use client';

import { useEffect, useState, useCallback } from 'react';
import StatusBadge from '@/components/admin/StatusBadge';

const STATUSES = ['all', 'pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
type StatusAction = { label: string; next: string; color: string; bg: string };
const NEXT_ACTION: Record<string, StatusAction> = {
    pending: { label: 'Accept Order', next: 'confirmed', color: '#065F46', bg: '#D1FAE5' },
    confirmed: { label: 'Mark Dispatched', next: 'dispatched', color: '#1E40AF', bg: '#DBEAFE' },
    dispatched: { label: 'Mark Delivered', next: 'delivered', color: '#065F46', bg: '#D1FAE5' },
};

interface Order {
    id: string; orderNumber: string; customerName: string; customerPhone: string;
    deliveryAddress: string; fulfillmentType: string; status: string;
    total: number; deliveryCharge: number; itemCount: number; itemNames: string; createdAt: string;
}

export default function DealerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ status, page: String(page) });
        const res = await fetch(`/api/dealer/orders?${params}`);
        const data = await res.json();
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setLoading(false);
    }, [status, page]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleStatusUpdate = async (id: string, nextStatus: string) => {
        setUpdating(id);
        const res = await fetch(`/api/dealer/orders/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus }),
        });
        const data = await res.json();
        if (data.ok) setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
        setUpdating(null);
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>My Orders</h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>{total} total orders</p>
            </div>

            {/* Status tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {STATUSES.map(s => (
                    <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                        style={{ padding: '0.35rem 0.875rem', borderRadius: '20px', border: '1.5px solid', borderColor: status === s ? '#8B5CF6' : 'var(--gray-200)', background: status === s ? '#8B5CF6' : 'white', color: status === s ? 'white' : 'var(--gray-600)', fontWeight: status === s ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                        {s === 'all' ? 'All' : s}
                    </button>
                ))}
            </div>

            {/* Orders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />) :
                    orders.length === 0 ? (
                        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.9rem' }}>No orders found</div>
                    ) : orders.map(o => (
                        <div key={o.id} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-xs)', display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            {/* Order info */}
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 800, color: '#8B5CF6', fontSize: '0.88rem' }}>#{o.orderNumber}</span>
                                    <StatusBadge status={o.status} size="sm" />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', background: o.fulfillmentType === 'pickup' ? '#E0F2FE' : '#FEF3C7', padding: '0.1rem 0.45rem', borderRadius: '10px', fontWeight: 600 }}>
                                        {o.fulfillmentType === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                                    </span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{o.customerName}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginBottom: '0.2rem' }}>📞 {o.customerPhone}</div>
                                <div style={{ fontSize: '0.76rem', color: 'var(--gray-400)' }}>{o.itemCount} item(s): {o.itemNames}{o.itemCount > 2 ? '...' : ''}</div>
                            </div>

                            {/* Total + Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem', minWidth: '160px' }}>
                                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--leaf-700)' }}>₹{o.total.toLocaleString('en-IN')}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                {NEXT_ACTION[o.status] && (
                                    <button onClick={() => handleStatusUpdate(o.id, NEXT_ACTION[o.status].next)} disabled={updating === o.id}
                                        style={{ padding: '0.4rem 0.875rem', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', background: NEXT_ACTION[o.status].bg, color: NEXT_ACTION[o.status].color, whiteSpace: 'nowrap' }}>
                                        {updating === o.id ? 'Updating…' : NEXT_ACTION[o.status].label}
                                    </button>
                                )}
                                {o.status === 'pending' && (
                                    <button onClick={() => handleStatusUpdate(o.id, 'cancelled')} disabled={updating === o.id}
                                        style={{ padding: '0.35rem 0.7rem', border: '1px solid #FECACA', borderRadius: '8px', fontWeight: 600, fontSize: '0.76rem', cursor: 'pointer', background: '#FEF2F2', color: '#991B1B' }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.4rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: '0.82rem' }}>← Prev</button>
                    <span style={{ padding: '0.4rem 0.875rem', fontSize: '0.82rem', color: 'var(--gray-500)' }}>Page {page} / {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.4rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', cursor: 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: '0.82rem' }}>Next →</button>
                </div>
            )}
        </div>
    );
}
