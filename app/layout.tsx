import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'GrapeMaster — Agricultural Inputs Delivered to You',
  description:
    'Order fertilizers, seeds, pesticides, and equipment from your nearest dealer. Fast pickup or home delivery across Maharashtra.',
  keywords: 'agriculture, fertilizer, seeds, pesticide, farming, Maharashtra, dealer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </main>
        <footer style={{ background: 'var(--gray-900)', color: 'var(--gray-400)', marginTop: 0 }}>
          <div className="container">
            <div style={{ padding: '3rem 0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
              {/* Brand */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1.4rem' }}>🍇</div>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'white', letterSpacing: '-0.02em' }}>
                    Grape<span style={{ color: '#52B061' }}>Master</span>
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.65, maxWidth: '220px', color: 'var(--gray-500)' }}>
                  Empowering Maharashtra farmers with quality agri inputs from verified local dealers.
                </p>
              </div>
              {/* Quick Links */}
              <div>
                <div style={{ fontWeight: 700, color: 'var(--gray-300)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Quick Links</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[['Home', '/'], ['Products', '/products'], ['Checkout', '/checkout']].map(([label, href]) => (
                    <a key={href} href={href} className="footer-link" style={{ fontSize: '0.85rem', color: 'var(--gray-500)', textDecoration: 'none' }}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>
              {/* Contact */}
              <div>
                <div style={{ fontWeight: 700, color: 'var(--gray-300)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Contact</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                  <span>📍 Pune, Maharashtra</span>
                  <span>📞 +91 98765 43210</span>
                  <span>💬 WhatsApp Support</span>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>© 2026 GrapeMaster Agri Supplies Pvt. Ltd.</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>Made with 🌿 for Maharashtra farmers</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
