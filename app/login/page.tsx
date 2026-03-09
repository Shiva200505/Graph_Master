// Wrap login in Suspense (required for useSearchParams in next.js app router)
import { Suspense } from 'react';
import CustomerLoginPage from './LoginContent';

export default function Page() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A4D25, #2A7436)' }} />}>
            <CustomerLoginPage />
        </Suspense>
    );
}
