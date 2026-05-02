'use client';

interface OrderTimelineProps {
    status: string;
    createdAt: string;
    fulfillmentType: string;
}

interface Step {
    key: string;
    label: string;
    icon: string;
    isDone: boolean;
    show: boolean;
    isActive: boolean;
}

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'dispatched', 'pending_payment']);

export default function OrderTimeline({ status, createdAt, fulfillmentType }: OrderTimelineProps) {
    const s = status.toLowerCase();
    const isDelivery = fulfillmentType === 'delivery';
    const isPaid = s !== 'pending_payment';
    const isPrepared = ['dispatched', 'delivered'].includes(s);
    const isDelivered = s === 'delivered';

    const steps: Step[] = [
        {
            key: 'placed',
            label: 'Order Placed',
            icon: '📋',
            isDone: true,
            show: true,
            isActive: s === 'pending' || s === 'pending_payment',
        },
        {
            key: 'payment',
            label: 'Payment Confirmed',
            icon: '💳',
            isDone: isPaid,
            show: true,
            isActive: isPaid && s === 'pending',
        },
        {
            key: 'prepared',
            label: 'Being Prepared',
            icon: '🌾',
            isDone: isPrepared,
            show: true,
            isActive: s === 'confirmed',
        },
        {
            key: 'out_delivery',
            label: 'Out for Delivery',
            icon: '🚚',
            isDone: isDelivered,
            show: isDelivery,
            isActive: s === 'dispatched' && isDelivery,
        },
        {
            key: 'ready_pickup',
            label: 'Ready for Pickup',
            icon: '🏪',
            isDone: isDelivered,
            show: !isDelivery,
            isActive: s === 'dispatched' && !isDelivery,
        },
        {
            key: 'delivered',
            label: isDelivery ? 'Delivered' : 'Collected',
            icon: '🎉',
            isDone: isDelivered,
            show: true,
            isActive: isDelivered,
        },
    ].filter(step => step.show);

    const placedAt = new Date(createdAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

    return (
        <div style={{
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-xs)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Order Progress
                </div>
                {ACTIVE_STATUSES.has(s) && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 700, color: '#22C55E' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        Live
                    </div>
                )}
            </div>

            {/* Vertical stepper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {steps.map((step, idx) => {
                    const isLast = idx === steps.length - 1;
                    const nextDone = !isLast && steps[idx + 1].isDone;

                    return (
                        <div key={step.key} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                            {/* Left column: circle + connector */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                {/* Circle */}
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease',
                                    ...(step.isDone
                                        ? {
                                            background: step.isActive
                                                ? 'linear-gradient(135deg, #1A4D25, #2A7436)'
                                                : '#22C55E',
                                            boxShadow: step.isActive ? '0 0 0 4px rgba(42,116,54,0.15)' : 'none',
                                        }
                                        : {
                                            background: 'white',
                                            border: '2px solid var(--gray-200)',
                                        }
                                    ),
                                }}>
                                    {step.isDone
                                        ? step.isActive
                                            ? <span style={{ fontSize: '1rem' }}>{step.icon}</span>
                                            : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )
                                        : <span style={{ fontSize: '0.85rem', opacity: 0.35 }}>{step.icon}</span>
                                    }
                                </div>
                                {/* Connector line */}
                                {!isLast && (
                                    <div style={{
                                        width: '2px',
                                        flex: 1,
                                        minHeight: '28px',
                                        background: nextDone
                                            ? 'linear-gradient(to bottom, #22C55E, #22C55E)'
                                            : 'var(--gray-200)',
                                        margin: '3px 0',
                                        transition: 'background 0.4s ease',
                                        borderRadius: '1px',
                                    }} />
                                )}
                            </div>

                            {/* Right column: text */}
                            <div style={{ paddingBottom: isLast ? 0 : '1.25rem', paddingTop: '0.4rem', flex: 1 }}>
                                <div style={{
                                    fontWeight: step.isActive ? 800 : step.isDone ? 600 : 500,
                                    fontSize: '0.88rem',
                                    color: step.isActive
                                        ? 'var(--leaf-700)'
                                        : step.isDone
                                            ? 'var(--gray-800)'
                                            : 'var(--gray-400)',
                                    lineHeight: 1.3,
                                    marginBottom: '0.15rem',
                                }}>
                                    {step.label}
                                    {step.isActive && (
                                        <span style={{ marginLeft: '0.4rem', fontSize: '0.68rem', fontWeight: 700, color: 'var(--leaf-600)', background: 'var(--leaf-50)', padding: '0.1rem 0.4rem', borderRadius: '8px', border: '1px solid rgba(42,116,54,0.15)' }}>
                                            Current
                                        </span>
                                    )}
                                </div>
                                {step.key === 'placed' && (
                                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '0.1rem' }}>{placedAt}</div>
                                )}
                                {step.key === 'delivered' && isDelivered && (
                                    <div style={{ fontSize: '0.72rem', color: '#15803D', marginTop: '0.1rem', fontWeight: 600 }}>Thank you for your order! 🌟</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
