type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; color: string; dot: string }> = {
    pending: { label: 'Pending', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
    confirmed: { label: 'Confirmed', bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
    dispatched: { label: 'Dispatched', bg: '#EDE9FE', color: '#6D28D9', dot: '#8B5CF6' },
    delivered: { label: 'Delivered', bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
    cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
};

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const cfg = STATUS_CONFIG[status as OrderStatus] ?? { label: status, bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF' };
    const padding = size === 'sm' ? '0.2rem 0.5rem' : '0.3rem 0.7rem';
    const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            background: cfg.bg, color: cfg.color, fontWeight: 700,
            padding, borderRadius: '20px', fontSize, letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
        }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
}
