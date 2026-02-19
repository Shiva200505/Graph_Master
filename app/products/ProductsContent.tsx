'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import ProductCard from '@/components/ui/ProductCard';

interface Product {
    id: string;
    productId: string;
    inventoryId: string;
    name: string;
    description: string;
    category: string;
    unit: string;
    price: number;
    quantity: number;
}

const CATEGORY_ICONS: Record<string, string> = {
    all: '🌾', Fertilizer: '🌿', Seeds: '🌱', Pesticide: '💧', Equipment: '⚙️',
};

export default function ProductsPageContent() {
    const searchParams = useSearchParams();
    const { dealerId, dealerName } = useCartStore();
    const { locationName } = useLocationStore();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('category') ?? 'all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (dealerId) params.set('dealerId', dealerId);
            if (activeCategory !== 'all') params.set('category', activeCategory);
            if (search) params.set('search', search);
            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to load');
            setProducts(data.products ?? []);
            setCategories(data.categories ?? []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [dealerId, activeCategory, search]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const allCategories = ['all', ...categories];

    return (
        <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>

            {/* ── Page Header ── */}
            <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-200)', padding: '1.75rem 0' }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div className="section-eyebrow">Farm Supplies</div>
                            <h1 className="heading-lg" style={{ fontSize: '1.7rem', margin: '0.25rem 0' }}>
                                {dealerName ? `Products from ${dealerName}` : 'All Products'}
                            </h1>
                            <p className="body-sm">
                                {loading
                                    ? 'Loading...'
                                    : `${products.length} product${products.length !== 1 ? 's' : ''} available`
                                }
                                {dealerName && <span style={{ color: 'var(--leaf-600)', fontWeight: 600 }}> · {locationName}</span>}
                            </p>
                        </div>
                        {!dealerId && (
                            <div style={{
                                background: 'var(--harvest-50)', border: '1px solid rgba(224,143,0,0.25)',
                                borderRadius: '10px', padding: '0.75rem 1rem', maxWidth: '320px',
                                display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                            }}>
                                <span style={{ flexShrink: 0, marginTop: '2px' }}>💡</span>
                                <p style={{ fontSize: '0.8rem', color: 'var(--harvest-700)', lineHeight: 1.5, margin: 0 }}>
                                    <strong>Tip:</strong> Go to the <a href="/" style={{ color: 'var(--leaf-600)', fontWeight: 600 }}>home page</a> and pick your location to see live prices & stock from your nearest dealer.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Filters ── */}
                    <div style={{ display: 'flex', gap: '0.875rem', marginTop: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Search */}
                        <div style={{ position: 'relative', maxWidth: '240px', flex: '1 1 200px' }}>
                            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                className="input"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
                            />
                        </div>

                        {/* Category pills */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {allCategories.map((cat) => {
                                const isActive = activeCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                                            padding: '0.4rem 0.875rem', borderRadius: '40px', cursor: 'pointer',
                                            fontSize: '0.8rem', fontWeight: isActive ? 700 : 500, border: '1.5px solid',
                                            background: isActive ? 'var(--leaf-600)' : 'var(--white)',
                                            borderColor: isActive ? 'var(--leaf-600)' : 'var(--gray-200)',
                                            color: isActive ? 'white' : 'var(--gray-700)',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.85rem' }}>{CATEGORY_ICONS[cat] ?? '🌾'}</span>
                                        {cat === 'all' ? 'All' : cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Products ── */}
            <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
                {error && (
                    <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 'var(--radius)', padding: '0.875rem 1rem', color: '#DC2626', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                        <span>⚠️</span> {error}
                        <button onClick={fetchProducts} style={{ marginLeft: '0.5rem', color: 'var(--leaf-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Retry</button>
                    </div>
                )}

                {loading ? (
                    <div className="product-grid">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--gray-200)', background: 'var(--white)' }}>
                                <div className="skeleton" style={{ height: '150px' }} />
                                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <div className="skeleton" style={{ height: '11px', width: '45%' }} />
                                    <div className="skeleton" style={{ height: '18px', width: '75%' }} />
                                    <div className="skeleton" style={{ height: '13px' }} />
                                    <div className="skeleton" style={{ height: '13px', width: '85%' }} />
                                    <div className="skeleton" style={{ height: '36px', marginTop: '0.5rem' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--gray-500)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌱</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>No products found</div>
                        <div className="body-sm" style={{ marginBottom: '1.5rem' }}>Try a different category or search term</div>
                        {activeCategory !== 'all' && (
                            <button className="btn btn-outline btn-sm" onClick={() => setActiveCategory('all')}>Show All Products</button>
                        )}
                    </div>
                ) : (
                    <div className="product-grid">
                        {products.map((p) => <ProductCard key={p.id} {...p} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
