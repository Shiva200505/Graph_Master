'use client';
import { useEffect, useState } from 'react';

interface MLStats {
  stats: {
    total_pairs: number;
    avg_confidence: number;
    avg_lift: number;
    last_computed: string;
    top_pairs: number;
  };
  topAssociations: {
    product_a_name: string;
    product_b_name: string;
    confidence: number;
    lift: number;
    co_occurrence_count: number;
  }[];
}

interface EventStats {
  views: number;
  cart_adds: number;
  purchases: number;
  unique_sessions: number;
  top_viewed: { name: string; view_count: number }[];
}

export default function MLDashboardPage() {
  const [mlStats, setMlStats] = useState<MLStats | null>(null);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [computing, setComputing] = useState(false);
  const [computeMsg, setComputeMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/ml/compute-associations').then(r => r.json()),
      fetch('/api/admin/ml/event-stats').then(r => r.json()),
    ]).then(([ml, ev]) => {
      setMlStats(ml);
      setEventStats(ev);
    }).finally(() => setLoading(false));
  }, []);

  const handleCompute = async () => {
    setComputing(true);
    setComputeMsg('');
    try {
      const res = await fetch('/api/admin/ml/compute-associations', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setComputeMsg(`✅ Computed ${data.associationPairs} product pairs at ${new Date(data.computedAt).toLocaleTimeString()}`);
        // Refresh stats
        const ml = await fetch('/api/admin/ml/compute-associations').then(r => r.json());
        setMlStats(ml);
      } else {
        setComputeMsg('❌ Failed to compute associations');
      }
    } catch {
      setComputeMsg('❌ Failed to compute associations');
    } finally {
      setComputing(false);
    }
  };

  const currentSeason = (() => {
    const m = new Date().getMonth() + 1;
    if (m >= 6 && m <= 9) return { name: 'Kharif Season 🌾', desc: 'Boosting: Seeds, Fertilizers, Pesticides', color: '#16a34a' };
    if (m === 10 || m === 11) return { name: 'Rabi Sowing 🌱', desc: 'Boosting: Seeds heavily, Fertilizers', color: '#d97706' };
    if (m >= 12 || m <= 2) return { name: 'Rabi Growing ❄️', desc: 'Boosting: Fertilizers, Pesticides', color: '#2563eb' };
    return { name: 'Summer / Pre-Kharif ☀️', desc: 'Boosting: Equipment, Irrigation, Seeds', color: '#dc2626' };
  })();

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          🤖 ML Recommendation Engine
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>
          Behavior-driven recommendations that learn from farmer purchase history
        </p>
      </div>

      {/* Season Banner */}
      <div style={{
        background: `${currentSeason.color}15`, border: `1px solid ${currentSeason.color}40`,
        borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontWeight: 700, color: currentSeason.color }}>{currentSeason.name}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginTop: '0.2rem' }}>
            {currentSeason.desc} — Season weights automatically applied to all recommendations
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textAlign: 'right' }}>
          Maharashtra<br />Crop Calendar
        </div>
      </div>

      {/* Strategy Explanation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: '👥', title: 'Collaborative Filtering', desc: 'For logged-in farmers — finds similar buyers and recommends what they bought', priority: '1st' },
          { icon: '📍', title: 'Location-Based', desc: 'Shows trending products ordered by farmers within 50km radius in last 90 days', priority: '2nd' },
          { icon: '🔗', title: 'Frequently Bought Together', desc: 'Apriori association rules from co-occurring products in same orders', priority: '3rd' },
          { icon: '👁️', title: 'Session Interest', desc: 'For anonymous users — tracks viewed/carted categories and recommends from them', priority: '4th' },
          { icon: '🌾', title: 'Season-Weighted Fallback', desc: 'Popular products boosted by current Maharashtra crop season weights', priority: 'Last' },
        ].map(s => (
          <div key={s.title} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '1rem', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'var(--leaf-100)', color: 'var(--leaf-700)', padding: '0.1rem 0.4rem', borderRadius: '8px' }}>Priority {s.priority}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>{s.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Association Rules Panel + Behavior Tracking */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>🔗 Product Associations</h3>
            <button onClick={handleCompute} disabled={computing} style={{
              padding: '0.4rem 0.875rem', background: computing ? '#ccc' : 'var(--leaf-600)',
              color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.8rem',
              fontWeight: 700, cursor: computing ? 'not-allowed' : 'pointer',
            }}>
              {computing ? 'Computing…' : 'Recompute Now'}
            </button>
          </div>
          {computeMsg && (
            <div style={{ fontSize: '0.8rem', marginBottom: '0.75rem', color: computeMsg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>
              {computeMsg}
            </div>
          )}
          {loading ? (
            <div className="skeleton" style={{ height: '80px', borderRadius: '8px' }} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Association Pairs', value: mlStats?.stats?.total_pairs ?? 0 },
                { label: 'High-Lift Pairs (>2x)', value: mlStats?.stats?.top_pairs ?? 0 },
                { label: 'Avg Confidence', value: `${((Number(mlStats?.stats?.avg_confidence ?? 0)) * 100).toFixed(1)}%` },
                { label: 'Avg Lift Score', value: Number(mlStats?.stats?.avg_lift ?? 0).toFixed(2) },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--gray-50)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--leaf-700)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          {mlStats?.stats?.last_computed && (
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '0.75rem' }}>
              Last computed: {new Date(mlStats.stats.last_computed).toLocaleString('en-IN')}
            </div>
          )}
        </div>

        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>👁️ Behavior Tracking (Last 30 Days)</h3>
          {loading ? (
            <div className="skeleton" style={{ height: '80px', borderRadius: '8px' }} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Product Views', value: eventStats?.views ?? 0, icon: '👁️' },
                { label: 'Cart Adds', value: eventStats?.cart_adds ?? 0, icon: '🛒' },
                { label: 'Purchases', value: eventStats?.purchases ?? 0, icon: '✅' },
                { label: 'Unique Sessions', value: eventStats?.unique_sessions ?? 0, icon: '📱' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--gray-50)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--gray-900)' }}>
                    {Number(s.value).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          {/* Top Viewed Products */}
          {eventStats?.top_viewed && eventStats.top_viewed.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Top Viewed Products
              </div>
              {eventStats.top_viewed.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: i < eventStats.top_viewed.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-700)' }}>{item.name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--leaf-600)' }}>{item.view_count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Associations Table */}
      {mlStats?.topAssociations && mlStats.topAssociations.length > 0 && (
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: '0.9rem' }}>
            🏆 Top Product Associations (Highest Lift Score)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['If farmer buys...', '...they also buy', 'Confidence', 'Lift Score', 'Co-Orders'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mlStats.topAssociations.map((a, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.7rem 1rem', fontSize: '0.84rem', fontWeight: 600 }}>{a.product_a_name}</td>
                  <td style={{ padding: '0.7rem 1rem', fontSize: '0.84rem', color: 'var(--leaf-700)', fontWeight: 600 }}>→ {a.product_b_name}</td>
                  <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem' }}>{(Number(a.confidence) * 100).toFixed(1)}%</td>
                  <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: Number(a.lift) > 2 ? '#16a34a' : 'var(--gray-700)' }}>
                    {Number(a.lift).toFixed(2)}x
                  </td>
                  <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem' }}>{a.co_occurrence_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', color: 'var(--gray-400)', background: 'var(--gray-50)' }}>
            Lift &gt; 1.0 = positive correlation. Lift = 2.0 means 2× more likely to buy B when A is purchased. Recompute after every 50+ new orders.
          </div>
        </div>
      )}

      {/* Empty state for associations */}
      {!loading && (!mlStats?.topAssociations || mlStats.topAssociations.length === 0) && (
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
          <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No associations computed yet</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
            Click &ldquo;Recompute Now&rdquo; above after you have placed at least 2–3 orders to generate product association rules.
          </div>
        </div>
      )}
    </div>
  );
}
