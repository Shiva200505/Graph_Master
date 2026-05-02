'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import OrderTimeline from '@/components/ui/OrderTimeline';

interface OrderData {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    fulfillmentType: string;
    status: string;
    paymentStatus: string | null;
    subtotal: number;
    deliveryCharge: number;
    total: number;
    createdAt: string;
    dealer: { name: string; phone: string; address: string };
    items: { id: string; productName: string; unit: string; unitPrice: number; quantity: number; subtotal: number }[];
}

export default function OrderConfirmationPage() {
    const { id } = useParams() as { id: string };
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`/api/orders/${id}`)
            .then((r) => r.json())
            .then((d) => { if (d.error) throw new Error(d.error); setOrder(d.order); })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', background: 'var(--cream)' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--gray-200)', borderTop: '3px solid var(--leaf-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                <div className="body-sm">Loading order details…</div>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', background: 'var(--cream)' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <div style={{ color: '#DC2626', marginBottom: '1rem' }}>{error}</div>
                <Link href="/" className="btn btn-outline">Go Home</Link>
            </div>
        </div>
    );

    if (!order) return null;
    const isDelivery = order.fulfillmentType === 'delivery';

    return (
        <div style={{ background: 'var(--cream)', minHeight: '100vh', padding: '3rem 0 5rem' }}>
            <div className="container" style={{ maxWidth: '680px' }}>

                {/* ── Success Card ── */}
                <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'fadeUp 0.4s ease' }}>

                    {/* Green Header */}
                    <div style={{ padding: '2.5rem 2rem 2rem', background: 'linear-gradient(135deg, #1A4D25, #2A7436)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(82,176,97,0.1)' }} />
                        {/* Checkmark */}
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(82,176,97,0.2)',
                            border: '2px solid rgba(126,203,140,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.25rem', animation: 'bounceIn 0.5s 0.1s both',
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7ECB8C" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h1 style={{ color: 'white', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Order Confirmed! 🎉</h1>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Thank you, <strong style={{ color: 'white' }}>{order.customerName}</strong>. Your order has been placed successfully.
                        </p>
                        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '0.5rem 1.25rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Order ID</span>
                            <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.04em', marginTop: '1px' }}>#{order.orderNumber}</div>
                        </div>
                    </div>

                    {/* ── Order Timeline ── */}
                    <div style={{ padding: '1.25rem 2rem 0' }}>
                        <OrderTimeline
                            status={order.status}
                            createdAt={order.createdAt}
                            fulfillmentType={order.fulfillmentType}
                        />
                    </div>

                    {/* Body */}
                    <div style={{ padding: '0 2rem 1.75rem' }}>

                        {/* Fulfillment & Dealer */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                    {isDelivery ? '🚚 Delivery To' : '🏪 Pickup From'}
                                </div>
                                {isDelivery
                                    ? <div style={{ fontSize: '0.85rem', color: 'var(--gray-700)', lineHeight: 1.5 }}>{order.deliveryAddress}</div>
                                    : <>
                                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-900)' }}>{order.dealer.name}</div>
                                        <div className="body-sm">{order.dealer.address}</div>
                                    </>
                                }
                            </div>
                            <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Your Dealer</div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-900)' }}>{order.dealer.name}</div>
                                <div className="body-sm">📞 {order.dealer.phone}</div>
                            </div>
                        </div>

                        {/* Items */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--gray-700)', marginBottom: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Order Items
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {order.items.map((item, i) => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderTop: i === 0 ? '1px solid var(--gray-200)' : '1px solid var(--gray-100)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.productName}</div>
                                            <div className="body-sm">{item.quantity} {item.unit} × ₹{item.unitPrice.toLocaleString('en-IN')}</div>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--leaf-700)' }}>
                                            ₹{item.subtotal.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                                    <span>Subtotal</span><span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                                    <span>Delivery</span>
                                    <span style={{ color: order.deliveryCharge === 0 ? '#16a34a' : undefined, fontWeight: order.deliveryCharge === 0 ? 600 : undefined }}>
                                        {order.deliveryCharge === 0 ? 'Free' : `₹${order.deliveryCharge}`}
                                    </span>
                                </div>
                                <div className="divider" style={{ margin: '0.3rem 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem' }}>
                                    <span>Total Payable</span>
                                    <span style={{ color: 'var(--leaf-700)' }}>₹{order.total.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Status */}
                        {order.paymentStatus === 'paid' ? (
                            <div style={{ background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#15803D', marginBottom: '0.2rem', fontSize: '0.9rem' }}>Paid Online ✓</div>
                                    <div style={{ fontSize: '0.82rem', color: '#166534' }}>Payment Confirmed — your order is being processed.</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: '#FFFBEB', border: '1px solid rgba(217,119,6,0.3)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#B45309', marginBottom: '0.2rem', fontSize: '0.9rem' }}>Payment Pending</div>
                                    <div style={{ fontSize: '0.82rem', color: '#92400E' }}>Check your payment app to confirm the payment status.</div>
                                </div>
                            </div>
                        )}

                        {/* Order Status Stepper */}
                        {(() => {
                            const steps = ['placed', 'confirmed', 'dispatched', 'delivered'];
                            const labels = ['Placed', 'Confirmed', 'Dispatched', 'Delivered'];
                            const icons = ['📋', '✅', '🚚', '🎉'];
                            const currentIdx = steps.indexOf(order.status.toLowerCase());
                            const activeIdx = currentIdx >= 0 ? currentIdx : 0;
                            return (
                                <div style={{ marginBottom: '1.75rem', padding: '1.25rem 1rem', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)' }}>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>Order Status</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                        {steps.map((step, idx) => {
                                            const done = idx <= activeIdx;
                                            const active = idx === activeIdx;
                                            return (
                                                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: idx < steps.length - 1 ? 1 : 'none' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                                                        <div style={{
                                                            width: '36px', height: '36px', borderRadius: '50%',
                                                            background: done ? (active ? 'var(--leaf-600)' : '#22C55E') : 'var(--gray-200)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '1rem',
                                                            boxShadow: active ? '0 0 0 3px rgba(42,116,54,0.2)' : 'none',
                                                            transition: 'all 0.3s',
                                                        }}>{icons[idx]}</div>
                                                        <div style={{ fontSize: '0.62rem', fontWeight: active ? 700 : 500, color: done ? (active ? 'var(--leaf-700)' : '#15803D') : 'var(--gray-400)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                            {labels[idx]}
                                                        </div>
                                                    </div>
                                                    {idx < steps.length - 1 && (
                                                        <div style={{ flex: 1, height: '3px', background: idx < activeIdx ? '#22C55E' : 'var(--gray-200)', margin: '0 4px', marginBottom: '20px', borderRadius: '2px', transition: 'background 0.3s' }} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Link href="/products" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                Continue Shopping
                            </Link>
                            <Link href="/" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--gray-200)' }}>
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
