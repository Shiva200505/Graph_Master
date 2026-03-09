/**
 * Haversine distance formula — returns distance in kilometres
 * between two lat/lng points.
 */
export function haversineKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371; // Earth radius km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
    return (deg * Math.PI) / 180;
}

/**
 * Calculate delivery charge based on distance.
 * Rules (as per spec — km-based):
 *  - Pickup:          ₹0
 *  - Subtotal ≥ 2000: ₹0 (free delivery)
 *  - 0–5 km:         ₹30
 *  - 5–15 km:         ₹50
 *  - 15–30 km:        ₹80
 *  - 30–50 km:        ₹120
 *  - > 50 km:         ₹180
 */
export function calcDeliveryCharge(
    distanceKm: number,
    subtotal: number,
    fulfillmentType: 'pickup' | 'delivery'
): number {
    if (fulfillmentType === 'pickup') return 0;
    if (subtotal >= 2000) return 0;
    if (distanceKm <= 5) return 30;
    if (distanceKm <= 15) return 50;
    if (distanceKm <= 30) return 80;
    if (distanceKm <= 50) return 120;
    return 180;
}
