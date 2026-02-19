'use client';

import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
    const { items, isOpen, closeCart, updateQuantity, removeItem, fulfillmentType, setFulfillmentType, subtotal, deliveryCharge, total } = useCartStore();
    const router = useRouter();

    if (!isOpen) return null;

    const sub = subtotal();
    const delivery = deliveryCharge();
    const tot = total();

    const CATEGORY_EMOJI: Record<string, string> = {
        Fertilizer: '🌿', Seeds: '🌱', Pesticide: '💧', Equipment: '⚙️',
    };

    return (
        <>
            <div className="cart-overlay" onClick={closeCart} />
            <div className="cart-drawer">

                {/* Header */}
                <div className="cart-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--leaf-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--leaf-700)" strokeWidth="2" strokeLinecap="round">
                                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--gray-900)' }}>Your Cart</div>
                            <div className="body-sm">
                                {items.length === 0 ? 'Empty' : `${items.reduce((s, i) => s + i.quantity, 0)} items`}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={closeCart}
                        style={{ width: '30px', height: '30px', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Items */}
                <div className="cart-items">
                    {items.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', color: 'var(--gray-400)', paddingTop: '4rem' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🌾</div>
                            <div>
                                <div style={{ fontWeight: 700, color: 'var(--gray-700)', textAlign: 'center' }}>Cart is empty</div>
                                <div className="body-sm" style={{ textAlign: 'center', marginTop: '0.25rem' }}>Add products to get started</div>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={closeCart} style={{ marginTop: '0.5rem' }}>
                                Browse Products
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {items.map((item) => (
                                <div key={item.productId} style={{
                                    display: 'flex', gap: '0.75rem', padding: '0.75rem',
                                    background: 'var(--gray-50)', borderRadius: '10px',
                                    border: '1px solid var(--gray-200)',
                                }}>
                                    {/* Icon */}
                                    <div style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '8px', background: 'var(--white)', border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        🌾
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.name}
                                        </div>
                                        <div style={{ fontSize: '0.76rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                                            ₹{item.price.toLocaleString('en-IN')} per {item.unit}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div className="qty-ctrl">
                                                <button className="qty-btn" onClick={() => item.quantity === 1 ? removeItem(item.productId) : updateQuantity(item.productId, item.quantity - 1)}>−</button>
                                                <span className="qty-val">{item.quantity}</span>
                                                <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.maxQuantity}>+</button>
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--leaf-700)' }}>
                                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.productId)}
                                        style={{ flexShrink: 0, width: '24px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', transition: 'all 0.12s' }}
                                        onMouseEnter={(e) => { (e.currentTarget).style.color = '#DC2626'; (e.currentTarget).style.background = '#FEE2E2'; }}
                                        onMouseLeave={(e) => { (e.currentTarget).style.color = 'var(--gray-400)'; (e.currentTarget).style.background = 'transparent'; }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="cart-footer">
                        {/* Fulfillment toggle */}
                        <div>
                            <div className="input-label" style={{ marginBottom: '0.5rem' }}>Fulfillment Type</div>
                            <div className="pill-group">
                                <button className={`pill-option ${fulfillmentType === 'pickup' ? 'active' : ''}`} onClick={() => setFulfillmentType('pickup')}>
                                    🏪 Store Pickup
                                </button>
                                <button className={`pill-option ${fulfillmentType === 'delivery' ? 'active' : ''}`} onClick={() => setFulfillmentType('delivery')}>
                                    🚚 Home Delivery
                                </button>
                            </div>
                        </div>

                        {/* Totals */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                                <span>Subtotal</span>
                                <span>₹{sub.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                                <span>Delivery</span>
                                <span style={{ color: delivery === 0 ? '#16a34a' : undefined, fontWeight: delivery === 0 ? 600 : undefined }}>
                                    {delivery === 0 ? (fulfillmentType === 'pickup' ? '— Pickup' : 'Free (≥₹2,000)') : `₹${delivery}`}
                                </span>
                            </div>
                            <div className="divider" style={{ margin: '0.3rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: 'var(--gray-900)' }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--leaf-700)' }}>₹{tot.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <button
                            className="btn btn-harvest"
                            style={{ width: '100%' }}
                            onClick={() => { closeCart(); router.push('/checkout'); }}
                        >
                            Proceed to Checkout
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>

                        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                            🔒 Secure · Cash on Delivery · Easy Returns
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
