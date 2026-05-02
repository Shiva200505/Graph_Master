/**
 * Track farmer behavior events for ML recommendations.
 * Call this from client components whenever a meaningful action occurs.
 * Silently fails to never block the user experience.
 */

// Generate/retrieve anonymous session ID for non-logged-in farmers
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('gm_session_id');
  if (!sid) {
    sid = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('gm_session_id', sid);
  }
  return sid;
}

export async function trackEvent(params: {
  eventType: 'view' | 'cart_add' | 'cart_remove' | 'purchase';
  productId: string;
  dealerId?: string;
  userLat?: number | null;
  userLng?: number | null;
  userId?: string | null;
}): Promise<void> {
  try {
    await fetch('/api/recommendations/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        sessionId: getSessionId(),
      }),
    });
  } catch {
    // Silent fail — tracking must never break user experience
  }
}
