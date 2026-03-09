'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';

interface FormData {
    name: string;
    phone: string;
    address: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, dealerId, dealerName, fulfillmentType, setFulfillmentType, subtotal, clearCart } = useCartStore();
    const { locationName, lat: userLat, lng: userLng } = useLocationStore();

    const [form, setForm] = useState<FormData>({ name: '', phone: '', address: '' });
    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [placing, setPlacing] = useState(false);
    const [apiError, setApiError] = useState('');

    // ── Dynamic delivery charge state ──────────────────────────────────────────
    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [chargeLoading, setChargeLoading] = useState(false);

    const sub = subtotal();
    const total = sub + deliveryCharge;

    // Fetch live delivery charge from API
    const fetchDeliveryCharge = useCallback(async () => {
        if (fulfillmentType === 'pickup') { setDeliveryCharge(0); setDistanceKm(null); return; }
        if (!dealerId || !userLat || !userLng) {
            // Fallback: simple flat rate
            setDeliveryCharge(sub >= 2000 ? 0 : 50);
            return;
        }
        setChargeLoading(true);
        try {
            const params = new URLSearchParams({
                dealerId, lat: String(userLat), lng: String(userLng),
                subtotal: String(sub), fulfillmentType,
            });
            const res = await fetch(`/api/delivery-charge?${params}`);
            const data = await res.json();
            setDeliveryCharge(data.charge ?? 0);
            setDistanceKm(data.distanceKm ?? null);
        } catch {
            setDeliveryCharge(sub >= 2000 ? 0 : 50);
        } finally {
            setChargeLoading(false);
        }
    }, [fulfillmentType, dealerId, userLat, userLng, sub]);

    useEffect(() => { fetchDeliveryCharge(); }, [fetchDeliveryCharge]);

    const validate = () => {
        const e: Partial<FormData> = {};
        if (!form.name.trim()) e.name = 'Full name is required';
        if (!form.phone.match(/^[6-9]\d{9}$/)) e.phone = 'Enter a valid 10-digit mobile number';
        if (fulfillmentType === 'delivery' && !form.address.trim()) e.address = 'Delivery address is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const getAddress = () =>
        fulfillmentType === 'pickup' ? `Store Pickup — ${dealerName ?? 'Dealer'}` : form.address.trim();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        if (items.length === 0) { setApiError('Your cart is empty'); return; }
        if (!dealerId) { setApiError('Please select a dealer from the home page first'); return; }

        setPlacing(true);
        setApiError('');
        try {
            // Initiate PhonePe payment — creates order with pending_payment status
            const res = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealerId,
                    customerName: form.name.trim(),
                    customerPhone: form.phone.trim(),
                    deliveryAddress: getAddress(),
                    fulfillmentType,
                    userLat,
                    userLng,
                    items: items.map((i) => ({
                        inventoryId: i.inventoryId,
                        productId: i.productId,
                        productName: i.name,
                        unit: i.unit,
                        unitPrice: i.price,
                        quantity: i.quantity,
                        subtotal: i.price * i.quantity,
                    })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Order failed');

            // Clear cart then redirect to PhonePe payment page
            clearCart();
            window.location.href = data.redirectUrl;
        } catch (err: unknown) {
            setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            setPlacing(false);
        }
    };

    if (items.length === 0) {
        return (
            <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
                <div style={{ textAlign: 'center', maxWidth: '380px', padding: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem' }}>🛒</div>
                    <h2 className="heading-md" style={{ marginBottom: '0.5rem' }}>Your Cart is Empty</h2>
                    <p className="body-sm" style={{ marginBottom: '2rem' }}>Browse our product catalogue and add items to your cart before checking out.</p>
                    <a href="/products" className="btn btn-primary">Browse Products</a>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--cream)', minHeight: '100vh', padding: '0 0 4rem' }}>

            {/* ── Page Header ── */}
            <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-200)', padding: '1.5rem 0', marginBottom: '2rem' }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <a href="/products" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--gray-500)', textDecoration: 'none', fontSize: '0.85rem' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                            Products
                        </a>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-900)' }}>Checkout</span>
                    </div>
                    <h1 className="heading-lg" style={{ fontSize: '1.6rem', marginTop: '0.75rem', marginBottom: '0.25rem' }}>Complete Your Order</h1>
                    {dealerName && (
                        <p className="body-sm">
                            Ordering from <span style={{ color: 'var(--leaf-600)', fontWeight: 600 }}>{dealerName}</span>
                            {locationName && ` · ${locationName}`}
                            {distanceKm !== null && fulfillmentType === 'delivery' && (
                                <span style={{ color: 'var(--gray-400)', marginLeft: '0.5rem' }}>({distanceKm} km away)</span>
                            )}
                        </p>
                    )}
                </div>
            </div>

            <div className="container">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: '1.5rem', alignItems: 'start' }}>

                        {/* ── Left Column ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            {/* Contact Details */}
                            <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>
                                <h3 className="heading-md" style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--leaf-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>👤</span>
                                    Contact Details
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label className="input-label">Full Name *</label>
                                        <input className={`input ${errors.name ? 'error' : ''}`} placeholder="e.g. Ramesh Patil" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                        {errors.name && <div className="input-error">{errors.name}</div>}
                                    </div>
                                    <div>
                                        <label className="input-label">Mobile Number (WhatsApp) *</label>
                                        <input className={`input ${errors.phone ? 'error' : ''}`} placeholder="10-digit mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} maxLength={10} />
                                        {errors.phone && <div className="input-error">{errors.phone}</div>}
                                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '0.3rem' }}>📲 Order confirmation will be sent to this WhatsApp number</div>
                                    </div>
                                </div>
                            </div>

                            {/* Fulfillment */}
                            <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>
                                <h3 className="heading-md" style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--leaf-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🚚</span>
                                    Fulfillment Method
                                </h3>
                                <div className="pill-group" style={{ marginBottom: '1rem' }}>
                                    <button type="button" className={`pill-option ${fulfillmentType === 'pickup' ? 'active' : ''}`} onClick={() => setFulfillmentType('pickup')}>🏪 Store Pickup — Free</button>
                                    <button type="button" className={`pill-option ${fulfillmentType === 'delivery' ? 'active' : ''}`} onClick={() => setFulfillmentType('delivery')}>🚚 Home Delivery</button>
                                </div>

                                {fulfillmentType === 'delivery' && (
                                    <div>
                                        <label className="input-label">Delivery Address *</label>
                                        <textarea className={`input ${errors.address ? 'error' : ''}`} placeholder="Plot no., Street, Village / City, District, Pincode" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} style={{ resize: 'vertical' }} />
                                        {errors.address && <div className="input-error">{errors.address}</div>}

                                        {/* Delivery charge preview */}
                                        <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: deliveryCharge === 0 ? 'var(--leaf-50)' : '#FFFBEB', border: `1px solid ${deliveryCharge === 0 ? 'rgba(42,116,54,0.2)' : 'rgba(217,119,6,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ fontSize: '0.8rem', color: deliveryCharge === 0 ? 'var(--leaf-700)' : '#92400E' }}>
                                                {chargeLoading ? (
                                                    <span>📍 Calculating delivery charge…</span>
                                                ) : (
                                                    <>
                                                        {distanceKm !== null ? `📍 ${distanceKm} km from dealer` : '📍 Delivery to your address'}
                                                        {sub >= 2000 && <span> · Free delivery on orders ≥ ₹2,000</span>}
                                                    </>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: deliveryCharge === 0 ? 'var(--leaf-700)' : '#B45309', marginLeft: '0.5rem', flexShrink: 0 }}>
                                                {chargeLoading ? '…' : deliveryCharge === 0 ? '✓ Free' : `₹${deliveryCharge}`}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {fulfillmentType === 'pickup' && dealerName && (
                                    <div style={{ background: 'var(--leaf-50)', border: '1px solid rgba(42,116,54,0.15)', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📍</span>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--leaf-700)', marginBottom: '0.2rem', fontSize: '0.9rem' }}>{dealerName}</div>
                                            <div className="body-sm">Your order will be ready at the store. We'll notify you via WhatsApp when it's ready to collect.</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {apiError && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius)', padding: '0.875rem 1rem', color: '#DC2626', fontSize: '0.88rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                    <span>⚠️</span> {apiError}
                                </div>
                            )}
                        </div>

                        {/* ── Right Column: Order Summary ── */}
                        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                                <h3 className="heading-md" style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Order Summary</h3>

                                {/* Items */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
                                    {items.map((item) => (
                                        <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                                <div className="body-sm">{item.quantity} × ₹{item.price.toLocaleString('en-IN')}</div>
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--leaf-700)', flexShrink: 0 }}>
                                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="divider" />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                                        <span>Subtotal</span><span>₹{sub.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gray-600)', alignItems: 'center' }}>
                                        <span>Delivery</span>
                                        <span style={{ color: deliveryCharge === 0 ? '#16a34a' : undefined, fontWeight: deliveryCharge === 0 ? 600 : undefined }}>
                                            {chargeLoading ? '…' : fulfillmentType === 'pickup' ? '— Pickup' : deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge}`}
                                        </span>
                                    </div>
                                    {distanceKm !== null && fulfillmentType === 'delivery' && !chargeLoading && (
                                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', textAlign: 'right' }}>
                                            {distanceKm} km · Distance-based rate
                                        </div>
                                    )}
                                    <div className="divider" style={{ margin: '0.4rem 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem' }}>
                                        <span>Total</span>
                                        <span style={{ color: 'var(--leaf-700)' }}>₹{total.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-harvest" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }} disabled={placing || chargeLoading}>
                                    {placing ? (
                                        <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: '0.4rem' }} />Redirecting to PhonePe…</>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                            Pay with PhonePe
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                        </span>
                                    )}
                                </button>

                                <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.75rem' }}>
                                    🔒 Secured by PhonePe · UPI · Cards · Wallets Accepted
                                </p>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
}
