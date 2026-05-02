'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';
import OrderTimeline from '@/components/ui/OrderTimeline';

const STATUSES = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

const WA_TEMPLATES: { label: string; getMessage: (o: OrderDetail) => string }[] = [
    {
        label: 'Order Confirmed',
        getMessage: o => `✅ Hello ${o.customerName}, your GrapeMaster order #${o.orderNumber} has been *confirmed* and is being prepared. Total: ₹${o.total.toLocaleString('en-IN')}`,
    },
    {
        label: 'Out for Delivery',
        getMessage: o => `🚚 Hello ${o.customerName}, your GrapeMaster order #${o.orderNumber} is *out for delivery*! You'll receive it shortly at ${o.deliveryAddress}.`,
    },
    {
        label: 'Order Delivered',
        getMessage: o => `🎉 Hello ${o.customerName}, your GrapeMaster order #${o.orderNumber} has been *delivered*. Thank you for your order! Total paid: ₹${o.total.toLocaleString('en-IN')}.`,
    },
    {
        label: 'Ready for Pickup',
        getMessage: o => `🏪 Hello ${o.customerName}, your GrapeMaster order #${o.orderNumber} is *ready for pickup* at ${o.dealer.address}. Please bring this message.`,
    },
];

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
    const [waOpen, setWaOpen] = useState(false);

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

    // ── Print order slip ──────────────────────────────────────────────────────
    const handlePrint = () => {
        if (!order) return;
        const win = window.open('', '_blank', 'width=700,height=900');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head>
        <title>Order #${order.orderNumber} — GrapeMaster</title>
        <style>
            body{font-family:Arial,sans-serif;padding:2rem;color:#111;max-width:600px;margin:0 auto}
            h1{font-size:1.4rem;border-bottom:2px solid #2A7436;padding-bottom:.5rem;color:#2A7436}
            .row{display:flex;justify-content:space-between;padding:.3rem 0;font-size:.88rem;border-bottom:1px solid #eee}
            .label{color:#777}.val{font-weight:600}
            table{width:100%;border-collapse:collapse;margin-top:1rem}
            th{background:#f5f5f5;padding:.4rem .75rem;text-align:left;font-size:.8rem;color:#555}
            td{padding:.5rem .75rem;font-size:.85rem;border-bottom:1px solid #eee}
            .total-row{font-weight:800;font-size:1rem}
            .footer{margin-top:2rem;text-align:center;color:#aaa;font-size:.75rem}
        </style></head><body>
        <h1>🍇 GrapeMaster — Order Slip</h1>
        <div class="row"><span class="label">Order #</span><span class="val">${order.orderNumber}</span></div>
        <div class="row"><span class="label">Date</span><span class="val">${new Date(order.createdAt).toLocaleString('en-IN')}</span></div>
        <div class="row"><span class="label">Status</span><span class="val">${order.status.toUpperCase()}</span></div>
        <div class="row"><span class="label">Customer</span><span class="val">${order.customerName}</span></div>
        <div class="row"><span class="label">Phone</span><span class="val">${order.customerPhone}</span></div>
        <div class="row"><span class="label">Address</span><span class="val">${order.deliveryAddress}</span></div>
        <div class="row"><span class="label">Dealer</span><span class="val">${order.dealer.name}</span></div>
        <div class="row"><span class="label">Fulfillment</span><span class="val">${order.fulfillmentType === 'pickup' ? 'Store Pickup' : 'Home Delivery'}</span></div>
        <table>
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
            <tbody>
                ${order.items.map(item => `<tr>
                    <td>${item.productName} (${item.unit})</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.unitPrice.toLocaleString('en-IN')}</td>
                    <td>₹${item.subtotal.toLocaleString('en-IN')}</td>
                </tr>`).join('')}
            </tbody>
            <tfoot>
                <tr><td colspan="3" style="text-align:right;color:#777;font-size:.82rem">Delivery Charge</td><td>${order.deliveryCharge === 0 ? 'Free' : `₹${order.deliveryCharge}`}</td></tr>
                <tr class="total-row"><td colspan="3" style="text-align:right">TOTAL</td><td>₹${order.total.toLocaleString('en-IN')}</td></tr>
            </tfoot>
        </table>
        <div class="footer">GrapeMaster Agri Supplies · Printed ${new Date().toLocaleString('en-IN')}</div>
        </body></html>`);
        win.document.close();
        win.print();
    };

    // ── WhatsApp send ─────────────────────────────────────────────────────────
    const sendWhatsApp = (templateIdx: number) => {
        if (!order) return;
        const msg = WA_TEMPLATES[templateIdx].getMessage(order);
        const phone = order.customerPhone.replace(/\D/g, '');
        const intlPhone = phone.startsWith('91') ? phone : `91${phone}`;
        window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
        setWaOpen(false);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>Loading…</div>;
    if (!order) return <div style={{ color: '#DC2626', padding: '2rem' }}>Order not found</div>;

    return (
        <div style={{ maxWidth: '960px' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--gray-400)' }}>
                <button onClick={() => router.push('/admin/orders')} style={{ background: 'none', border: 'none', color: 'var(--leaf-600)', cursor: 'pointer', fontWeight: 600 }}>Orders</button>
                <span>›</span>
                <span style={{ color: 'var(--gray-700)', fontWeight: 600 }}>#{order.orderNumber}</span>
            </div>

            {/* Header row */}
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

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Print */}
                    <button onClick={handlePrint} style={{ padding: '0.45rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: 'var(--gray-700)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        🖨️ Print Slip
                    </button>

                    {/* WhatsApp dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setWaOpen(v => !v)} style={{ padding: '0.45rem 0.875rem', border: '1px solid #25D366', borderRadius: '8px', background: waOpen ? '#25D366' : 'white', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: waOpen ? 'white' : '#128C7E', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.15s' }}>
                            💬 WhatsApp
                            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▾</span>
                        </button>
                        {waOpen && (
                            <div style={{ position: 'absolute', top: '110%', right: 0, background: 'white', border: '1px solid var(--gray-200)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', zIndex: 50, minWidth: '210px', overflow: 'hidden', animation: 'fadeUp 0.15s ease' }}>
                                {WA_TEMPLATES.map((t, i) => (
                                    <button key={i} onClick={() => sendWhatsApp(i)} style={{ display: 'block', width: '100%', padding: '0.65rem 1rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, color: 'var(--gray-700)', borderBottom: i < WA_TEMPLATES.length - 1 ? '1px solid var(--gray-100)' : 'none' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--leaf-50)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Update */}
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                        style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '8px', fontSize: '0.85rem', background: 'white', cursor: 'pointer' }}>
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <button onClick={handleStatusUpdate} disabled={updating || newStatus === order.status}
                        style={{ padding: '0.45rem 1rem', background: 'var(--leaf-600)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', opacity: newStatus === order.status ? 0.4 : 1 }}>
                        {updating ? 'Updating…' : 'Update Status'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: '1.25rem' }}>
                {/* ── Left column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Order Timeline */}
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '1rem' }}>📋 Order Progress</div>
                        <OrderTimeline
                            status={order.status}
                            createdAt={order.createdAt}
                            fulfillmentType={order.fulfillmentType}
                        />
                    </div>

                    {/* Items table */}
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
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.875rem' }}>
                            {order.fulfillmentType === 'pickup' ? '🏪 Store Pickup' : '🚚 Delivery Address'}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--gray-700)', lineHeight: 1.6, margin: 0 }}>{order.deliveryAddress}</p>
                    </div>
                </div>

                {/* ── Right column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Customer */}
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.875rem' }}>👤 Customer</div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{order.customerName}</div>
                        {/* tel: quick-action */}
                        <a href={`tel:${order.customerPhone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 700, textDecoration: 'none', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', padding: '0.35rem 0.75rem', transition: 'all 0.15s' }}>
                            📞 {order.customerPhone}
                        </a>
                        <div style={{ marginTop: '0.75rem' }}>
                            <a href={`https://wa.me/91${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.customerName}, regarding your GrapeMaster order #${order.orderNumber}`)}`}
                                target="_blank" rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#128C7E', fontWeight: 600, textDecoration: 'none', background: '#f0fefa', border: '1px solid #c3f0cb', borderRadius: '7px', padding: '0.3rem 0.65rem' }}>
                                💬 WhatsApp Customer
                            </a>
                        </div>
                    </div>

                    {/* Dealer */}
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.875rem' }}>🏪 Dealer</div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>{order.dealer.name}</div>
                        <a href={`tel:${order.dealer.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--leaf-600)', fontWeight: 600, textDecoration: 'none', marginBottom: '0.35rem' }}>
                            📞 {order.dealer.phone}
                        </a>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', lineHeight: 1.5, marginTop: '0.35rem' }}>{order.dealer.address}</div>
                        <button onClick={() => router.push(`/admin/dealers/${order.dealer.id}`)}
                            style={{ marginTop: '0.75rem', background: 'none', border: '1px solid var(--gray-200)', borderRadius: '7px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: 'var(--leaf-600)', cursor: 'pointer', fontWeight: 600 }}>
                            View Dealer →
                        </button>
                    </div>

                    {/* Order meta card */}
                    <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[
                                { label: 'Order ID', val: order.id.slice(0, 8) + '…' },
                                { label: 'Fulfillment', val: order.fulfillmentType === 'pickup' ? '🏪 Pickup' : '🚚 Delivery' },
                                { label: 'Items', val: `${order.items.length} product type${order.items.length !== 1 ? 's' : ''}` },
                            ].map(({ label, val }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                                    <span style={{ color: 'var(--gray-400)', fontWeight: 600 }}>{label}</span>
                                    <span style={{ color: 'var(--gray-700)', fontWeight: 600 }}>{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
