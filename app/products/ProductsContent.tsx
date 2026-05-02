'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import ProductCard from '@/components/ui/ProductCard';
import ProductRecommendations from '@/components/ui/ProductRecommendations';

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

type SortBy = 'default' | 'price_asc' | 'price_desc' | 'stock';

const CATEGORY_ICONS: Record<string, string> = {
    all: '🌾', Fertilizer: '🌿', Seeds: '🌱', Pesticide: '💧', Equipment: '⚙️',
};

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'price_asc', label: 'Price: Low → High' },
    { value: 'price_desc', label: 'Price: High → Low' },
    { value: 'stock', label: 'In Stock First' },
];

export default function ProductsPageContent() {
    const searchParams = useSearchParams();
    const { dealerId, dealerName } = useCartStore();
    const { locationName, lat, lng } = useLocationStore();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('category') ?? 'all');
    const [search, setSearch] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [isDebouncing, setIsDebouncing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('default');
    const [inStockOnly, setInStockOnly] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Debounced search ─────────────────────────────────────────────────────
    useEffect(() => {
        if (search === searchDebounced) { setIsDebouncing(false); return; }
        setIsDebouncing(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearchDebounced(search);
            setIsDebouncing(false);
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search, searchDebounced]);

    // ── Fetch products ───────────────────────────────────────────────────────
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (dealerId) params.set('dealerId', dealerId);
            if (activeCategory !== 'all') params.set('category', activeCategory);
            if (searchDebounced) params.set('search', searchDebounced);
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
    }, [dealerId, activeCategory, searchDebounced]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // ── Client-side sort and filter ──────────────────────────────────────────
    const sortedFiltered = (() => {
        let result = inStockOnly ? products.filter(p => p.quantity > 0) : [...products];
        if (sortBy === 'price_asc') result = result.sort((a, b) => a.price - b.price);
        else if (sortBy === 'price_desc') result = result.sort((a, b) => b.price - a.price);
        else if (sortBy === 'stock') result = result.sort((a, b) => b.quantity - a.quantity);
        return result;
    })();

    // ── Category counts from raw (pre-filter) products ───────────────────────
    const categoryCounts = products.reduce<Record<string, number>>((acc, p) => {
        acc[p.category] = (acc[p.category] ?? 0) + 1;
        return acc;
    }, {});

    const allCategories = ['all', ...categories];
    const totalAll = products.length;

    const resetFilters = () => {
        setActiveCategory('all');
        setSearch('');
        setSearchDebounced('');
        setInStockOnly(false);
        setSortBy('default');
    };

    const hasActiveFilters = activeCategory !== 'all' || inStockOnly || sortBy !== 'default' || search;

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
                                    : <span>
                                        Showing <strong>{sortedFiltered.length}</strong> of <strong>{totalAll}</strong> product{totalAll !== 1 ? 's' : ''}
                                        {inStockOnly && <span style={{ color: '#16a34a', fontWeight: 600 }}> · In Stock Only</span>}
                                    </span>
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
                                    <strong>Tip:</strong> Go to the <a href="/" style={{ color: 'var(--leaf-600)', fontWeight: 600 }}>home page</a> and pick your location to see live prices &amp; stock from your nearest dealer.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Filters row ── */}
                    <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                        {/* Row 1: Search + Sort + In-stock toggle */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>

                            {/* Debounced Search */}
                            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
                                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }}
                                    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    className="input"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ paddingLeft: '2rem', paddingRight: isDebouncing ? '2rem' : undefined, fontSize: '0.85rem' }}
                                />
                                {isDebouncing && (
                                    <div style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        width: '14px', height: '14px',
                                        border: '2px solid var(--gray-200)', borderTop: '2px solid var(--leaf-500)',
                                        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                                    }} />
                                )}
                            </div>

                            {/* Sort dropdown */}
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as SortBy)}
                                className="input"
                                style={{ flex: '0 0 auto', width: 'auto', paddingRight: '2rem', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                {SORT_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>

                            {/* In Stock Only toggle */}
                            <button
                                onClick={() => setInStockOnly(v => !v)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                    padding: '0.4rem 0.875rem', borderRadius: '40px', cursor: 'pointer',
                                    fontSize: '0.8rem', fontWeight: inStockOnly ? 700 : 500,
                                    border: '1.5px solid',
                                    background: inStockOnly ? '#D1FAE5' : 'var(--white)',
                                    borderColor: inStockOnly ? '#16a34a' : 'var(--gray-200)',
                                    color: inStockOnly ? '#065F46' : 'var(--gray-700)',
                                    transition: 'all 0.15s', flexShrink: 0,
                                }}
                            >
                                {inStockOnly ? '✓' : ''} In Stock Only
                            </button>

                            {/* Clear filters */}
                            {hasActiveFilters && (
                                <button onClick={resetFilters} style={{
                                    fontSize: '0.78rem', color: 'var(--gray-500)', background: 'none', border: 'none',
                                    cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', flexShrink: 0,
                                }}>
                                    ✕ Clear filters
                                </button>
                            )}
                        </div>

                        {/* Row 2: Category pills with count badges */}
                        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
                            {allCategories.map((cat) => {
                                const isActive = activeCategory === cat;
                                const count = cat === 'all' ? totalAll : (categoryCounts[cat] ?? 0);
                                return (
                                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                        padding: '0.4rem 0.875rem', borderRadius: '40px', cursor: 'pointer',
                                        fontSize: '0.8rem', fontWeight: isActive ? 700 : 500,
                                        border: '1.5px solid',
                                        background: isActive ? 'var(--leaf-600)' : 'var(--white)',
                                        borderColor: isActive ? 'var(--leaf-600)' : 'var(--gray-200)',
                                        color: isActive ? 'white' : 'var(--gray-700)',
                                        transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap',
                                    }}>
                                        {/* Active green dot */}
                                        {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />}
                                        <span style={{ fontSize: '0.85rem' }}>{CATEGORY_ICONS[cat] ?? '🌾'}</span>
                                        {cat === 'all' ? 'All' : cat}
                                        {count > 0 && (
                                            <span style={{
                                                fontSize: '0.62rem', fontWeight: 700,
                                                background: isActive ? 'rgba(255,255,255,0.22)' : 'var(--gray-100)',
                                                color: isActive ? 'white' : 'var(--gray-500)',
                                                padding: '0.05rem 0.38rem', borderRadius: '20px', minWidth: '18px', textAlign: 'center',
                                            }}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Products ── */}
            <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
                {!dealerId && (
                  <div style={{
                    background: 'linear-gradient(135deg, #1A4D25, #2A7436)',
                    borderRadius: '14px', padding: '1.25rem 1.5rem',
                    marginBottom: '1.5rem', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between',
                    gap: '1rem', flexWrap: 'wrap'
                  }}>
                    <div>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        📍 Select your location first
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem' }}>
                        We'll match you to the nearest dealer with live prices and stock.
                      </div>
                    </div>
                    <a href="/" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0, fontSize: '0.85rem' }}>
                      Choose Location →
                    </a>
                  </div>
                )}

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
                ) : sortedFiltered.length === 0 ? (

                    /* ── Empty state ── */
                    <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--gray-500)', maxWidth: '460px', margin: '0 auto' }}>
                        {!dealerId ? (
                            <>
                                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📍</div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>No location selected</div>
                                <p className="body-sm" style={{ marginBottom: '1.5rem' }}>
                                    Select your location on the home page to see live prices and available stock from the nearest dealer.
                                </p>
                                <a href="/" style={{ padding: '0.65rem 1.5rem', background: 'var(--leaf-600)', color: 'white', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block' }}>
                                    🏠 Choose My Location
                                </a>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                                    {CATEGORY_ICONS[activeCategory] ?? '🌾'}
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                                    No {activeCategory !== 'all' ? activeCategory.toLowerCase() : ''} products available
                                    {dealerName && <span style={{ color: 'var(--gray-400)', display: 'block', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.2rem' }}>from {dealerName}</span>}
                                </div>
                                <p className="body-sm" style={{ marginBottom: '1.5rem' }}>
                                    {inStockOnly ? 'Try removing the "In Stock Only" filter, or t' : 'T'}ry a different category or clearing your search.
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {activeCategory !== 'all' && (
                                        <button className="btn btn-outline btn-sm" onClick={() => setActiveCategory('all')}>Show All Products</button>
                                    )}
                                    {hasActiveFilters && (
                                        <button className="btn btn-ghost btn-sm" onClick={resetFilters}>Clear All Filters</button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                ) : (
                    <div className="product-grid">
                        {sortedFiltered.map((p) => <ProductCard key={p.id} {...p} />)}
                    </div>
                )}

                {/* ── ML Recommendations ── */}
                {dealerId && !loading && sortedFiltered.length > 0 && (
                    <ProductRecommendations lat={lat} lng={lng} title="Farmers Near You Also Ordered" />
                )}
            </div>
        </div>
    );
}
