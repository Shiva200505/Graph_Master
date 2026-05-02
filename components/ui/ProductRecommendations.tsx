'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Recommendation {
    id: string;
    name: string;
    category: string;
    price: number;
    imageUrl?: string | null;
    score?: number;
}

interface RecommendationsResponse {
    source: string;
    recommendations: Recommendation[];
    season?: string;
    meta?: {
        strategy: string;
        count: number;
        hasLocation: boolean;
        hasUserHistory: boolean;
    };
}

interface ProductRecommendationsProps {
    lat?: number | null;
    lng?: number | null;
    currentProductId?: string;
    userId?: string | null;
    title?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
    Fertilizer: '🌿',
    Seeds: '🌱',
    Pesticide: '💧',
    Equipment: '⚙️',
};

function getCategoryIcon(category: string): string {
    return CATEGORY_ICONS[category] ?? '🌾';
}

const STRATEGY_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
    collaborative_filtering: {
        label: '👥 Based on Similar Farmers',
        color: '#2563eb',
        bg: 'rgba(37,99,235,0.08)',
        border: 'rgba(37,99,235,0.2)',
    },
    location_based: {
        label: '📍 Popular Near You',
        color: '#16a34a',
        bg: 'rgba(22,163,74,0.08)',
        border: 'rgba(22,163,74,0.2)',
    },
    frequently_bought_together: {
        label: '🔗 Frequently Bought Together',
        color: '#7c3aed',
        bg: 'rgba(124,58,237,0.08)',
        border: 'rgba(124,58,237,0.2)',
    },
    session_interest: {
        label: '✨ Based on Your Browsing',
        color: '#d97706',
        bg: 'rgba(217,119,6,0.08)',
        border: 'rgba(217,119,6,0.2)',
    },
    season_weighted_popularity: {
        label: '🌾 Popular This Season',
        color: '#16a34a',
        bg: 'rgba(22,163,74,0.08)',
        border: 'rgba(22,163,74,0.2)',
    },
};

export default function ProductRecommendations({
    lat,
    lng,
    currentProductId,
    userId,
    title = 'Recommended for You',
}: ProductRecommendationsProps) {
    const router = useRouter();
    const [data, setData] = useState<RecommendationsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const sessionId = useRef<string>('');

    // Generate/restore session ID on mount
    useEffect(() => {
        let sid = sessionStorage.getItem('gm_session_id');
        if (!sid) {
            sid = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            sessionStorage.setItem('gm_session_id', sid);
        }
        sessionId.current = sid;
    }, []);

    useEffect(() => {
        let cancelled = false;

        const params = new URLSearchParams({ limit: '4' });
        if (lat != null) params.set('lat', String(lat));
        if (lng != null) params.set('lng', String(lng));
        if (currentProductId) params.set('productId', currentProductId);
        if (sessionId.current) params.set('sessionId', sessionId.current);
        if (userId) params.set('userId', userId);

        fetch(`/api/recommendations?${params}`)
            .then((r) => r.json())
            .then((d: RecommendationsResponse) => {
                if (!cancelled) setData(d);
            })
            .catch(() => {
                if (!cancelled) setData(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [lat, lng, currentProductId, userId]);

    // Don't render if no recommendations and not loading
    if (!loading && (!data || data.recommendations.length === 0)) return null;

    const strategy = data?.source ?? '';
    const strategyMeta = STRATEGY_LABELS[strategy] ?? null;

    // Append season name to season_weighted_popularity label
    const strategyLabel = (() => {
        if (!strategyMeta) return null;
        if (strategy === 'season_weighted_popularity' && data?.season) {
            const seasonNames: Record<string, string> = {
                kharif: 'Kharif',
                rabi_sowing: 'Rabi Sowing',
                rabi_growing: 'Rabi Growing',
                summer: 'Summer',
            };
            const sName = seasonNames[data.season] ?? 'This';
            return `🌾 Popular This ${sName} Season`;
        }
        return strategyMeta.label;
    })();

    return (
        <div style={{ marginTop: '2.5rem' }}>
            {/* ── Section Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--gray-900)', margin: 0, letterSpacing: '-0.02em' }}>
                        {title}
                    </h2>
                </div>
                {strategyMeta && strategyLabel && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                        background: strategyMeta.bg,
                        border: `1px solid ${strategyMeta.border}`,
                        color: strategyMeta.color,
                        letterSpacing: '0.04em',
                    }}>
                        {strategyLabel}
                    </div>
                )}
            </div>

            {/* ── Cards ── */}
            {loading ? (
                /* Skeleton state */
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1rem',
                }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} style={{
                            background: 'var(--white)', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--gray-200)', padding: '1.25rem',
                            display: 'flex', flexDirection: 'column', gap: '0.75rem',
                        }}>
                            <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div className="skeleton" style={{ height: '10px', width: '40%' }} />
                                <div className="skeleton" style={{ height: '15px', width: '80%' }} />
                                <div className="skeleton" style={{ height: '13px', width: '35%' }} />
                            </div>
                            <div className="skeleton" style={{ height: '34px', borderRadius: '8px' }} />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Mobile: horizontal scroll | Desktop: 4-col grid */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        overflowX: 'auto',
                        paddingBottom: '0.5rem',
                        scrollbarWidth: 'none',
                    }}>
                        <style>{`
                            @media (min-width: 768px) {
                                .rec-scroll-outer {
                                    display: grid !important;
                                    grid-template-columns: repeat(4, 1fr) !important;
                                    overflow-x: visible !important;
                                }
                            }
                        `}</style>
                        <div
                            className="rec-scroll-outer"
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                width: '100%',
                                flex: 1,
                            }}
                        >
                            {data!.recommendations.map((rec) => (
                                <div
                                    key={rec.id}
                                    className="card"
                                    style={{
                                        background: 'var(--white)',
                                        border: '1px solid var(--gray-200)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '1.25rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                        minWidth: '185px',
                                        flex: '0 0 185px',
                                        boxShadow: 'var(--shadow-sm)',
                                        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                        e.currentTarget.style.borderColor = 'var(--leaf-400)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = '';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                        e.currentTarget.style.borderColor = 'var(--gray-200)';
                                    }}
                                    onClick={() => router.push(`/products?category=${encodeURIComponent(rec.category)}`)}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: 'var(--leaf-100)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.5rem', flexShrink: 0,
                                    }}>
                                        {getCategoryIcon(rec.category)}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                                            {rec.category}
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-900)', lineHeight: 1.35, marginBottom: '0.4rem' }}>
                                            {rec.name}
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--leaf-700)' }}>
                                            ₹{rec.price.toLocaleString('en-IN')}
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <button
                                        className="btn btn-outline btn-sm"
                                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/products?category=${encodeURIComponent(rec.category)}`);
                                        }}
                                    >
                                        View Products →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
