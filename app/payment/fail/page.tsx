'use client';

import { useRouter } from 'next/navigation';

export default function PaymentFailPage() {
    const router = useRouter();

    return (
        <div style={{
            minHeight: '80vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--cream)',
        }}>
            <div style={{ textAlign: 'center', maxWidth: '480px', padding: '2rem' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: '#FEF2F2', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem',
                }}>❌</div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#B91C1C', marginBottom: '0.5rem' }}>Payment Cancelled</h1>
                <p style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                    You cancelled the payment or it was declined. <strong>No charges were made.</strong>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                    Your cart is saved — try again anytime.
                </p>
                <div style={{ background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '2rem', fontSize: '0.82rem', color: '#166534' }}>
                    🛒 All your items are still in your cart. Simply go back to checkout and complete payment.
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-harvest"
                        onClick={() => router.push('/checkout')}
                    >
                        Try Again
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={() => router.push('/products')}
                    >
                        Back to Products
                    </button>
                </div>
            </div>
        </div>
    );
}
