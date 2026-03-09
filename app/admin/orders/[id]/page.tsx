'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';

const STATUSES = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

interface OrderDetail {
    id: string; orderNumber: string; customerName: string; customerPhone: string;
    deliveryAddress: string; fulfillmentType: string; status: string;
    subtotal: number; deliveryCharge: number; total: number; createdAt: string;
    dealer: { id: string; name: string; phone: string; address: string };
    items: { id: string; productName: string; unit: string; unitPrice: number; quantity: number; subtotal: number }[];
}

export default function AdminOrderDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        fetch(`/api/admin/orders/${id}`)
            .then(r => r.json())
            .then(d => { setOrder(d.order); setNewStatus(d.order?.status ?? ''); })
            .finally(() => setLoading(false));
    }, [id]);

    const handleStatusUpdate = async () => {
        if (!newStatus || newStatus === order?.status) return;
        setUpdating(true);
        const res = await fetch(`/api/admin/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (data.ok) setOrder(o => o ? { ...o, status: newStatus } : o);
        setUpdating(false);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>Loading…</div>;
    if (!order) return <div style={{ color: '#DC2626' }}>Order not found</div>;

    return (
        <div style={{ maxWidth: '960px' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--gray-400)' }}>
                <button onClick={() => router.push('/admin/orders')} style={{ background: 'none', border: 'none', color: 'var(--leaf-600)', cursor: 'pointer', fontWeight: 600 }}>Orders</button>
                <span>›</span>
                <span style={{ color: 'var(--gray-700)', fontWeight: 600 }}>#{order.orderNumber}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Order #{order.orderNumber}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                        <StatusBadge status={order.status} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                            {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Status Update */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                        style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '8px', fontSize: '0.85rem', background: 'white', cursor: 'pointer' }}>
                        {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <button onClick={handleStatusUpdate} disabled={updating || newStatus === order.status}
                        style={{ padding: '0.45rem 1rem', background: 'var(--leaf-600)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', opacity: newStatus === order.status ? 0.4 : 1 }}>
                        {updating ? 'Updating…' : 'Update'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>
                {/* Left */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Items */}
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: '0.88rem' }}>Order Items</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--gray-50)' }}>
                                    {['Product', 'Unit', 'Qty', 'Price', 'Subtotal'].map(h => (
                                        <th key={h} style={{ padding: '0.6rem 1rem', textAlign: h === 'Qty' || h === 'Price' || h === 'Subtotal' ? 'right' : 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', borderBottom: '1px solid var(--gray-200)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, i) => (
                                    <tr key={item.id} style={{ borderBottom: i < order.items.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>{item.productName}</td>
                                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', color: 'var(--gray-500)' }}>{item.unit}</td>
                                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', textAlign: 'right' }}>{item.quantity}</td>
                                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', textAlign: 'right' }}>₹{item.unitPrice.toLocaleString('en-IN')}</td>
                                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', color: 'var(--leaf-700)' }}>₹{item.subtotal.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--gray-600)' }}><span>Subtotal</span><span>₹{order.subtotal.toLocaleString('en-IN')}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--gray-600)' }}><span>Delivery</span><span>{order.deliveryCharge === 0 ? 'Free' : `₹${order.deliveryCharge}`}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', paddingTop: '0.35rem', borderTop: '1px solid var(--gray-200)', marginTop: '0.25rem' }}><span>Total</span><span style={{ color: 'var(--leaf-700)' }}>₹{order.total.toLocaleString('en-IN')}</span></div>
                        </div>
                    </div>

                    {/* Fulfillment */}
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.875rem' }}>{order.fulfillmentType === 'pickup' ? '🏪 Store Pickup' : '🚚 Delivery Address'}</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--gray-700)', lineHeight: 1.6, margin: 0 }}>{order.deliveryAddress}</p>
                    </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Customer */}
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.875rem' }}>👤 Customer</div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>📞 {order.customerPhone}</div>
                    </div>

                    {/* Dealer */}
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.875rem' }}>🏪 Dealer</div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{order.dealer.name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: '0.2rem' }}>📞 {order.dealer.phone}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', lineHeight: 1.5 }}>{order.dealer.address}</div>
                        <button onClick={() => router.push(`/admin/dealers/${order.dealer.id}`)}
                            style={{ marginTop: '0.75rem', background: 'none', border: '1px solid var(--gray-200)', borderRadius: '7px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: 'var(--leaf-600)', cursor: 'pointer', fontWeight: 600 }}>
                            View Dealer →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
