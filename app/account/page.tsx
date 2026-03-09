'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';

interface Order {
    id: string; orderNumber: string; dealerName: string; fulfillmentType: string;
    status: string; total: number; deliveryCharge: number; createdAt: string;
    items: { productName: string; quantity: number; unitPrice: number; subtotal: number }[];
}

export default function AccountPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/account/orders').then(r => {
            if (r.status === 401) { router.push('/login?next=/account'); return null; }
            return r.json();
        }).then(d => { if (d) setOrders(d.orders ?? []); }).finally(() => setLoading(false));
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--leaf-600)', textDecoration: 'none', fontWeight: 600, marginBottom: '0.75rem' }}>
                            ← Back to Shop
                        </a>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--gray-900)' }}>My Orders</h1>
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.2rem' }}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
                    </div>
                    <button onClick={handleLogout} style={{ padding: '0.45rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', fontSize: '0.82rem', color: 'var(--gray-600)', cursor: 'pointer', fontWeight: 600 }}>
                        Log Out
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '3.5rem 2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>No orders yet</div>
                        <p style={{ color: 'var(--gray-400)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>Your order history will appear here.</p>
                        <a href="/products" style={{ padding: '0.6rem 1.25rem', background: 'var(--leaf-600)', color: 'white', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>Browse Products</a>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {orders.map(order => (
                            <div key={order.id} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                                {/* Order Header */}
                                <div onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                    style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', userSelect: 'none' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--leaf-700)', fontSize: '0.9rem' }}>#{order.orderNumber}</span>
                                            <StatusBadge status={order.status} size="sm" />
                                            <span style={{ fontSize: '0.73rem', color: 'var(--gray-400)', background: order.fulfillmentType === 'pickup' ? '#E0F2FE' : '#FEF3C7', padding: '0.1rem 0.45rem', borderRadius: '10px', fontWeight: 600 }}>
                                                {order.fulfillmentType === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                                            {order.dealerName} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--gray-900)' }}>₹{order.total.toLocaleString('en-IN')}</div>
                                        <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>{expandedId === order.id ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {/* Expanded Items */}
                                {expandedId === order.id && (
                                    <div style={{ borderTop: '1px solid var(--gray-100)', padding: '1rem 1.25rem', background: 'var(--gray-50)' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead><tr>
                                                {['Product', 'Qty', 'Unit Price', 'Subtotal'].map(h => (
                                                    <th key={h} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', padding: '0.3rem 0.5rem', textAlign: h !== 'Product' ? 'right' : 'left' }}>{h}</th>
                                                ))}
                                            </tr></thead>
                                            <tbody>
                                                {order.items.map((item, i) => (
                                                    <tr key={i} style={{ borderTop: '1px solid var(--gray-200)' }}>
                                                        <td style={{ padding: '0.5rem', fontSize: '0.83rem', fontWeight: 600 }}>{item.productName}</td>
                                                        <td style={{ padding: '0.5rem', fontSize: '0.83rem', textAlign: 'right' }}>{item.quantity}</td>
                                                        <td style={{ padding: '0.5rem', fontSize: '0.83rem', textAlign: 'right' }}>₹{item.unitPrice}</td>
                                                        <td style={{ padding: '0.5rem', fontWeight: 700, fontSize: '0.83rem', textAlign: 'right', color: 'var(--leaf-700)' }}>₹{item.subtotal.toLocaleString('en-IN')}</td>
                                                    </tr>
                                                ))}
                                                {order.deliveryCharge > 0 && (
                                                    <tr style={{ borderTop: '1px solid var(--gray-200)' }}>
                                                        <td colSpan={3} style={{ padding: '0.5rem', fontSize: '0.82rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>Delivery charge</td>
                                                        <td style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.82rem' }}>₹{order.deliveryCharge}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
