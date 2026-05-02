'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useCartStore } from '@/store/cartStore';
import { trackEvent } from '@/lib/trackEvent';
import { useLocationStore } from '@/store/locationStore';

interface ProductCardProps {
    id: string;
    productId: string;
    inventoryId: string;
    name: string;
    description: string;
    category: string;
    unit: string;
    price: number;
    quantity: number;
    basePrice?: number; // for price comparison
    imageUrl?: string | null;
}

// Category icon SVGs
const CATEGORY_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
    Fertilizer: {
        icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="24" cy="38" rx="14" ry="5" fill="#C8F7D0" opacity="0.6"/><path d="M24 5C24 5 10 14 10 26C10 33.7 16.3 40 24 40C31.7 40 38 33.7 38 26C38 14 24 5 24 5Z" fill="#359244" opacity="0.2"/><path d="M24 10C24 10 13 17 13 27C13 33.1 18 38 24 38C30 38 35 33.1 35 27C35 17 24 10 24 10Z" fill="#2A7436"/><path d="M24 18C24 18 18 22 18 28C18 31.3 20.7 34 24 34C27.3 34 30 31.3 30 28C30 22 24 18 24 18Z" fill="#52B061"/><circle cx="24" cy="27" r="4" fill="#7ECB8C"/></svg>`,
        color: '#1A5C2A', bg: '#EAF7EC', label: 'Fertilizer',
    },
    Seeds: {
        icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="24" cy="40" rx="12" ry="4" fill="#FEF5E7" opacity="0.6"/><path d="M24 8C17 8 11 16 11 25C11 33.3 17 39 24 39C31 39 37 33.3 37 25C37 16 31 8 24 8Z" fill="#E08F00" opacity="0.15"/><path d="M24 12C19 12 15 18 15 25C15 31.4 19 37 24 37C29 37 33 31.4 33 25C33 18 29 12 24 12Z" fill="#C47800"/><path d="M16 22C16 22 20 20 24 22C28 24 30 28 28 32C24 31 18 28 16 22Z" fill="#E08F00"/><circle cx="24" cy="25" r="5" fill="#F5A623" opacity="0.7"/></svg>`,
        color: '#9A5E00', bg: '#FEF5E7', label: 'Seeds',
    },
    Pesticide: {
        icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="17" y="10" width="14" height="24" rx="4" fill="#6B1A46" opacity="0.2"/><rect x="19" y="12" width="10" height="20" rx="3" fill="#8C2458"/><path d="M22 9V12H26V9" stroke="#6B1A46" strokeWidth="2" strokeLinecap="round"/><rect x="21" y="10" width="6" height="3" rx="1" fill="#A83070"/><path d="M24 16V28" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><path d="M21 22H27" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><ellipse cx="24" cy="33" rx="5" ry="2" fill="#8C2458" opacity="0.4"/><path d="M22 32L20 38C20 38 22 37 24 37C26 37 28 38 28 38L26 32" fill="#A83070" opacity="0.6"/></svg>`,
        color: '#6B1A46', bg: 'rgba(140,36,88,0.08)', label: 'Pesticide',
    },
    Equipment: {
        icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="12" fill="#374151" opacity="0.1"/><path d="M18 14L14 18L18 22L22 18Z" fill="#4B5563"/><path d="M30 14L34 18L30 22L26 18Z" fill="#4B5563"/><circle cx="24" cy="24" r="6" fill="#6B7280"/><circle cx="24" cy="24" r="3" fill="#9CA3AF"/><path d="M24 10V14M24 34V38M10 24H14M34 24H38" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round"/></svg>`,
        color: '#374151', bg: '#F3F4F6', label: 'Equipment',
    },
};

function PriceDisplay({ price, basePrice }: { price: number; basePrice?: number }) {
    const parts = price.toLocaleString('en-IN').split('.');
    const showComparison = basePrice && basePrice > price;
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--leaf-700)', letterSpacing: '-0.03em' }}>
                ₹{parts[0]}{parts[1] && <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>.{parts[1]}</span>}
            </span>
            {showComparison && (
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', textDecoration: 'line-through' }}>
                    ₹{basePrice.toLocaleString('en-IN')}
                </span>
            )}
        </div>
    );
}

export default function ProductCard({
    id, productId, inventoryId, name, description, category, unit, price, quantity, basePrice, imageUrl
}: ProductCardProps) {
    const { addItem, items, updateQuantity, removeItem } = useCartStore();
    const cartItem = items.find((i) => i.productId === productId);
    const inCart = cartItem?.quantity ?? 0;
    const inStock = quantity > 0;
    const isLowStock = inStock && quantity <= 5;
    const meta = CATEGORY_META[category] ?? CATEGORY_META.Equipment;
    const { lat, lng } = useLocationStore();

    // ── IntersectionObserver for view tracking ────────────────────────────────
    const cardRef = useRef<HTMLDivElement>(null);
    const hasTracked = useRef(false);

    useEffect(() => {
        if (!cardRef.current || hasTracked.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasTracked.current) {
                    hasTracked.current = true;
                    trackEvent({ eventType: 'view', productId, userLat: lat, userLng: lng });
                    observer.disconnect();
                }
            },
            { threshold: 0.5 } // 50% of card must be visible
        );
        observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [productId, lat, lng]);

    // ── "Added!" flash animation ──────────────────────────────────────────────
    const [justAdded, setJustAdded] = useState(false);
    const handleAdd = useCallback(() => {
        if (!inStock) return;
        addItem({ id, productId, inventoryId, name, unit, price, maxQuantity: quantity });
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1200);
        // Track cart_add event for ML
        trackEvent({
            eventType: 'cart_add',
            productId,
            userLat: lat,
            userLng: lng,
        });
    }, [inStock, addItem, id, productId, inventoryId, name, unit, price, quantity, lat, lng]);

    // ── Stock indicator bar ───────────────────────────────────────────────────
    // Normalize to a 100-unit scale (max visible bar = 100+ units)
    const stockBarPct = Math.min((quantity / 100) * 100, 100);
    const stockBarColor = isLowStock ? '#F59E0B' : quantity === 0 ? '#EF4444' : '#22C55E';

    return (
        <div ref={cardRef} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--white)' }}>

            {/* ── Image / Icon Area ── */}
            <div style={{
                height: '150px', position: 'relative', overflow: 'hidden',
                background: meta.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {imageUrl ? (
                    <img 
                    src={imageUrl} 
                    alt={name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                    }}
                    />
                ) : null}
                <div style={{ width: '90px', height: '90px', opacity: 0.9, display: imageUrl ? 'none' : 'block' }}
                    dangerouslySetInnerHTML={{ __html: meta.icon }} />

                {/* Stock badge — top left */}
                <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    {inStock
                        ? <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓ In Stock</span>
                        : <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Out of Stock</span>}
                </div>

                {/* Low stock / only X left — top right */}
                {isLowStock && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                            fontSize: '0.65rem', fontWeight: 700, color: '#92400E',
                            background: '#FEF3C7', padding: '0.2rem 0.5rem', borderRadius: '20px',
                            border: '1px solid #FDE68A',
                        }}>
                            🔥 Only {quantity} left!
                        </span>
                    </div>
                )}
                {!inStock && quantity === 0 && quantity !== undefined && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#991B1B', background: '#FEE2E2', padding: '0.2rem 0.5rem', borderRadius: '20px', border: '1px solid #FECACA' }}>
                            Sold Out
                        </span>
                    </div>
                )}
            </div>

            {/* ── Content ── */}
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>

                {/* Category + unit */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: meta.color }}>
                        {meta.label}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)', background: 'var(--gray-50)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}>
                        per {unit}
                    </span>
                </div>

                {/* Name */}
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)', lineHeight: 1.3, margin: 0 }}>
                    {name}
                </h3>

                {/* Description */}
                {description && (
                    <p style={{
                        fontSize: '0.78rem', color: 'var(--gray-500)', lineHeight: 1.55, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {description}
                    </p>
                )}

                {/* Price + stock info + CTA */}
                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-100)' }}>
                    <PriceDisplay price={price} basePrice={basePrice} />

                    {/* Stock indicator bar + label */}
                    <div style={{ marginTop: '0.5rem', marginBottom: '0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.68rem', color: stockBarColor === '#22C55E' ? 'var(--gray-400)' : stockBarColor, fontWeight: 600 }}>
                                {quantity === 0
                                    ? 'Not available'
                                    : isLowStock
                                        ? `Only ${quantity} units left`
                                        : `${quantity} units available`
                                }
                            </span>
                        </div>
                        <div style={{ height: '3px', background: 'var(--gray-100)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: '2px',
                                width: quantity === 0 ? '0%' : `${Math.max(stockBarPct, 4)}%`,
                                background: stockBarColor,
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                    </div>

                    {inCart > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem' }}>
                            <div className="qty-ctrl">
                                <button className="qty-btn" onClick={() => inCart === 1 ? removeItem(productId) : updateQuantity(productId, inCart - 1)}>−</button>
                                <span className="qty-val">{inCart}</span>
                                <button className="qty-btn" onClick={() => updateQuantity(productId, inCart + 1)} disabled={inCart >= quantity}>+</button>
                            </div>
                            <span style={{ fontSize: '0.82rem', color: 'var(--leaf-600)', fontWeight: 700 }}>
                                ₹{(price * inCart).toLocaleString('en-IN')} total
                            </span>
                        </div>
                    ) : inStock ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleAdd}
                            style={{
                                width: '100%',
                                background: justAdded ? '#22C55E' : undefined,
                                borderColor: justAdded ? '#22C55E' : undefined,
                                transition: 'background 0.2s, border-color 0.2s',
                            }}
                        >
                            {justAdded ? (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Added!
                                </>
                            ) : (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Add to Cart
                                </>
                            )}
                        </button>
                    ) : (
                        /* Out of stock — Notify Me button */
                        <button
                            className="btn"
                            onClick={() => alert(`We'll notify you when ${name} is back in stock!`)}
                            style={{
                                width: '100%',
                                background: 'var(--gray-50)', color: 'var(--gray-600)',
                                border: '1.5px solid var(--gray-200)', cursor: 'pointer',
                            }}
                        >
                            🔔 Notify Me
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
