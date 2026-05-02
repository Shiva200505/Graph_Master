'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationStore } from '@/store/locationStore';
import { useCartStore } from '@/store/cartStore';
import ProductRecommendations from '@/components/ui/ProductRecommendations';

const LOCATIONS = [
  { name: 'Pune', lat: 18.5204, lng: 73.8567, region: 'Western MH' },
  { name: 'Nashik', lat: 19.9975, lng: 73.7898, region: 'Wine Country' },
  { name: 'Shirur', lat: 18.8324, lng: 74.3789, region: 'Pune District' },
  { name: 'Ahmednagar', lat: 19.0948, lng: 74.748, region: 'Central MH' },
  { name: 'Solapur', lat: 17.6599, lng: 75.9064, region: 'South MH' },
  { name: 'Satara', lat: 17.6805, lng: 74.0183, region: 'Satara Dist.' },
  { name: 'Kolhapur', lat: 16.705, lng: 74.2433, region: 'South MH' },
  { name: 'Sangli', lat: 16.8524, lng: 74.5815, region: 'Grape Belt' },
];

const CATEGORIES = [
  { label: 'Fertilizers', category: 'Fertilizer', icon: '🌿', desc: 'NPK, Urea, DAP, Organic' },
  { label: 'Seeds', category: 'Seeds', icon: '🌱', desc: 'Hybrid tomato, onion & more' },
  { label: 'Pesticides', category: 'Pesticide', icon: '💧', desc: 'Sprays, powders, fungicides' },
  { label: 'Equipment', category: 'Equipment', icon: '⚙️', desc: 'Drip kits, sprayer pumps' },
];

const STEPS = [
  { n: '01', icon: '📍', title: 'Pick Your Location', desc: 'Select your village or city from our Maharashtra network' },
  { n: '02', icon: '🏪', title: 'Matched to Dealer', desc: 'We assign the nearest verified agri dealer to you instantly' },
  { n: '03', icon: '🛒', title: 'Browse & Add to Cart', desc: 'See live stock and real prices from your assigned dealer' },
  { n: '04', icon: '🚚', title: 'Pickup or Delivery', desc: 'Collect at store or get delivered to your farm gate' },
];

const STATS = [
  { value: '10+', label: 'Products Listed' },
  { value: '3', label: 'Verified Dealers' },
  { value: '8', label: 'Districts Covered' },
  { value: '100%', label: 'Authentic Stock' },
];

export default function HomePage() {
  const router = useRouter();
  const { setLocation, setNearestDealer, nearestDealer, locationName, lat, lng } = useLocationStore();
  const { setDealer } = useCartStore();
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Auto-detect location via browser GPS then snap to nearest city
  const autoDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser');
      return;
    }
    setGeoLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Snap to nearest known city using Haversine distance
        let nearestLoc = LOCATIONS[0];
        let minDist = Infinity;
        for (const loc of LOCATIONS) {
          const dLat = (loc.lat - latitude) * (Math.PI / 180);
          const dLng = (loc.lng - longitude) * (Math.PI / 180);
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(latitude * Math.PI / 180) * Math.cos(loc.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          if (dist < minDist) { minDist = dist; nearestLoc = loc; }
        }
        // Use exact GPS coords but city name from nearest match
        setSelected(nearestLoc.name);
        setLoading(true);
        setLocation(latitude, longitude, nearestLoc.name);
        try {
          const res = await fetch(`/api/dealers/nearest?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          if (data.dealer) {
            setNearestDealer({ id: data.dealer.id, name: data.dealer.name, distance: data.dealer.distanceKm });
            setDealer(data.dealer.id, data.dealer.name);
          }
        } catch { /* ignore */ }
        finally { setLoading(false); setGeoLocating(false); }
      },
      (err) => {
        setGeoLocating(false);
        setGeoError(err.code === 1 ? 'Please allow location access and try again' : 'Could not detect location');
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleLocation = async (loc: typeof LOCATIONS[0]) => {
    if (selected === loc.name) {
      router.push('/products');
      return;
    }
    setSelected(loc.name);
    setLoading(true);
    setLocation(loc.lat, loc.lng, loc.name);
    try {
      const res = await fetch(`/api/dealers/nearest?lat=${loc.lat}&lng=${loc.lng}`);
      const data = await res.json();
      if (data.dealer) {
        setNearestDealer({ id: data.dealer.id, name: data.dealer.name, distance: data.dealer.distanceKm });
        setDealer(data.dealer.id, data.dealer.name);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <div>

      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(150deg, #0C2410 0%, #1A4D25 40%, #2A7436 100%)',
        padding: 'clamp(3rem, 8vw, 6rem) 0 0',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(82,176,97,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0', left: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: 'rgba(140,36,88,0.06)', pointerEvents: 'none' }} />

        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'end' }}>
            <div style={{ maxWidth: '640px' }}>
              {/* Eyebrow */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(82,176,97,0.15)', border: '1px solid rgba(82,176,97,0.3)', borderRadius: '20px', padding: '0.35rem 0.875rem', marginBottom: '1.5rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#52B061', display: 'inline-block' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7ECB8C' }}>
                  Maharashtra's Agri Supply Platform
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.04em', color: 'white', marginBottom: '1.25rem' }}>
                Farm Inputs,<br />
                <span style={{ color: '#7ECB8C' }}>Delivered Fresh</span><br />
                to Your Field
              </h1>

              <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: '480px', marginBottom: '2.5rem' }}>
                Order fertilizers, seeds, pesticides & equipment from verified local dealers.
                Real-time inventory. Pickup or doorstep delivery.
              </p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7ECB8C', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dealer badge (desktop) */}
            {nearestDealer && (
              <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '1.25rem 1.5rem', minWidth: '220px', animation: 'fadeUp 0.4s ease' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Your Dealer</div>
                <div style={{ fontWeight: 800, color: 'white', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{nearestDealer.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7ECB8C" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span style={{ fontSize: '0.8rem', color: '#7ECB8C', fontWeight: 600 }}>{nearestDealer.distance} km away</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Location Selector Band ── */}
          <div style={{ marginTop: '3.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px 16px 0 0', borderTop: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(4px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>Select Location</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.84rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {selected ? `${selected} ✓` : 'Choose your city'}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* GPS auto-detect button */}
                <button
                  onClick={autoDetectLocation}
                  disabled={geoLocating || loading}
                  title="Auto-detect my GPS location"
                  style={{
                    padding: '0.45rem 0.875rem', borderRadius: '8px',
                    border: '1px solid rgba(82,176,97,0.5)',
                    background: geoLocating ? 'rgba(82,176,97,0.15)' : 'rgba(82,176,97,0.1)',
                    color: '#7ECB8C', fontWeight: 700, fontSize: '0.82rem',
                    cursor: geoLocating ? 'wait' : 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {geoLocating ? (
                    <><span style={{ width: '10px', height: '10px', border: '2px solid rgba(126,203,140,0.3)', borderTop: '2px solid #7ECB8C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Detecting…</>
                  ) : (
                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg> Detect My Location</>
                  )}
                </button>

                {/* Divider */}
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', userSelect: 'none' }}>or</span>
                {LOCATIONS.map((loc) => {
                  const isSelected = selected === loc.name;
                  return (
                    <button
                      key={loc.name}
                      onClick={() => handleLocation(loc)}
                      style={{
                        padding: '0.45rem 0.875rem', borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isSelected ? '#52B061' : 'rgba(255,255,255,0.15)',
                        background: isSelected ? 'rgba(82,176,97,0.2)' : 'rgba(255,255,255,0.06)',
                        color: isSelected ? '#7ECB8C' : 'rgba(255,255,255,0.75)',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {loc.name}
                    </button>
                  );
                })}
              </div>
              {/* Geo error */}
              {geoError && (
                <div style={{ width: '100%', fontSize: '0.75rem', color: '#FCA5A5', marginTop: '0.25rem', paddingLeft: '0.25rem' }}>⚠ {geoError}</div>
              )}

              <button
                className="btn btn-harvest"
                onClick={() => router.push('/products')}
                style={{ flexShrink: 0, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? 'Locating...' : 'Shop Now →'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TRUST BAR
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--leaf-700)', padding: '0.875rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: '✓', text: 'Verified Dealers Only' },
              { icon: '↩', text: 'Easy Returns' },
              { icon: '🚚', text: 'Farm-gate Delivery' },
              { icon: '💬', text: 'WhatsApp Support' },
              { icon: '🔒', text: 'Secure Ordering' },
            ].map((t) => (
              <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', fontWeight: 600 }}>
                <span style={{ color: '#7ECB8C', fontSize: '0.9rem' }}>{t.icon}</span>
                {t.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CATEGORIES
      ═══════════════════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="section-eyebrow">Browse by Category</div>
              <h2 className="heading-lg">Everything Your Farm Needs</h2>
              <p className="body-lg" style={{ marginTop: '0.4rem' }}>High-quality agri inputs from certified brands</p>
            </div>
            <button className="btn btn-outline" onClick={() => router.push('/products')}>
              View All Products →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.category}
                onClick={() => {
                  if (!locationName) { alert('Please choose your location first'); return; }
                  router.push(`/products?category=${cat.category}`);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1.25rem', background: 'var(--white)', cursor: 'pointer',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)',
                  textAlign: 'left', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.boxShadow = 'var(--shadow-lg)';
                  el.style.transform = 'translateY(-3px)';
                  el.style.borderColor = 'var(--leaf-400)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.boxShadow = 'var(--shadow-sm)';
                  el.style.transform = '';
                  el.style.borderColor = 'var(--gray-200)';
                }}
              >
                <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'var(--leaf-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                  {cat.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)', marginBottom: '0.2rem' }}>{cat.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{cat.desc}</div>
                </div>
                <svg style={{ marginLeft: 'auto', flexShrink: 0, color: 'var(--gray-300)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          AI RECOMMENDATIONS
      ═══════════════════════════════════════════════════════════ */}
      {nearestDealer && (
        <section className="section" style={{ background: 'var(--white)' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="section-eyebrow">Personalized for You</div>
                <h2 className="heading-lg">Trending in Your Area</h2>
              </div>
            </div>
            <ProductRecommendations lat={lat} lng={lng} />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-eyebrow" style={{ justifyContent: 'center' }}>Simple Process</div>
            <h2 className="heading-lg">Order in 4 Easy Steps</h2>
            <p className="body-lg" style={{ maxWidth: '440px', margin: '0.5rem auto 0' }}>
              From browsing to delivery — GrapeMaster makes agri shopping effortless
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1.5rem' }}>
            {STEPS.map((step, i) => (
              <div key={step.n} style={{ position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', top: '26px', left: 'calc(100% - 8px)', width: 'calc(100% - 64px)', height: '2px', background: 'linear-gradient(to right, var(--leaf-300), var(--gray-200))', display: 'none' }} />
                )}
                <div style={{ padding: '1.5rem', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--leaf-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                      {step.icon}
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--leaf-600)', textTransform: 'uppercase' }}>
                      Step {step.n}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem', color: 'var(--gray-900)' }}>
                    {step.title}
                  </div>
                  <div className="body-sm">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '4rem 0', background: 'var(--grape-700)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                Ready to Order?
              </div>
              <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                Premium Agri Inputs,<br />Straight from Your Dealer
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Pick a location above and start shopping in seconds.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <button className="btn" onClick={() => router.push('/products')} style={{ background: 'white', color: 'var(--grape-700)', fontWeight: 800, border: 'none', padding: '0.8rem 1.75rem' }}>
                Shop Now →
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
