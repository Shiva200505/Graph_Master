import { Suspense } from 'react';
import ProductsPageContent from './ProductsContent';

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🌾</div>
                <div>Loading products...</div>
            </div>
        }>
            <ProductsPageContent />
        </Suspense>
    );
}
