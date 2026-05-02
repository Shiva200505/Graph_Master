export default function AdminLoading() {
    return (
        <div style={{
            minHeight: '60vh',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '1rem',
        }}>
            {/* Green admin spinner */}
            <div style={{
                width: '44px', height: '44px',
                border: '3.5px solid rgba(42,116,54,0.15)',
                borderTop: '3.5px solid #2A7436',
                borderRadius: '50%',
                animation: 'spin 0.75s linear infinite',
            }} />
            <p style={{
                fontSize: '0.82rem', color: 'var(--gray-400)',
                fontWeight: 600, letterSpacing: '0.03em',
            }}>
                Loading Admin Panel…
            </p>
        </div>
    );
}
