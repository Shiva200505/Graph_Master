/**
 * Notification utilities — WhatsApp Cloud API + Email via Resend
 *
 * Environment variables required:
 *   WHATSAPP_TOKEN       — Meta Cloud API Bearer token
 *   WHATSAPP_PHONE_ID    — Sender phone number ID from Meta
 *   WHATSAPP_TEMPLATE    — Approved template name (default: order_confirmation)
 *   RESEND_API_KEY       — Resend.com API key (or leave empty for console fallback)
 *   ADMIN_EMAIL          — Admin email address for order alerts
 *   NEXT_PUBLIC_APP_URL  — App base URL for order links
 */

interface OrderNotifyPayload {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    dealerName: string;
    items: { productName: string; quantity: number; unitPrice: number }[];
    total: number;
    fulfillmentType: 'pickup' | 'delivery';
    deliveryAddress: string;
    orderId: string;
}

import { addDevNotification } from './devNotifications';

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

export async function sendWhatsAppConfirmation(order: OrderNotifyPayload): Promise<void> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const template = process.env.WHATSAPP_TEMPLATE ?? 'order_confirmation';
    const useTextFallback = template === 'text_fallback';

    if (!token || !phoneId) {
        // Development fallback — log to console
        console.log('\n📲 [WhatsApp MOCK] Order confirmation:');
        console.log(`   To: +91${order.customerPhone}`);
        console.log(`   Order #${order.orderNumber} · ₹${order.total}`);
        console.log(`   Dealer: ${order.dealerName}`);
        console.log(`   Type: ${order.fulfillmentType}`);
        addDevNotification({
            type: 'whatsapp',
            to: `+91${order.customerPhone}`,
            message: `Order #${order.orderNumber} · ₹${order.total} · Dealer: ${order.dealerName} · Type: ${order.fulfillmentType}`,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // Normalize phone: strip non-digits, ensure 91 prefix
    const toPhone = `91${order.customerPhone.replace(/\D/g, '').slice(-10)}`;

    // ── Build message body ─────────────────────────────────────────────────────
    let body: Record<string, unknown>;

    if (useTextFallback) {
        // Plain text mode — no Meta template approval required.
        // Useful for testing / early deployment.
        // Note: Only works for users who have messaged your number first (24-hour window).
        const itemsList = order.items
            .map((i) => `• ${i.productName} × ${i.quantity}`)
            .join('\n');
        const textBody =
            `GrapeMaster Order Confirmed! 🌿\n` +
            `Order: #${order.orderNumber}\n` +
            `Items:\n${itemsList}\n` +
            `Total: ₹${order.total.toLocaleString('en-IN')}\n` +
            `Dealer: ${order.dealerName}\n` +
            `Type: ${order.fulfillmentType === 'pickup' ? 'Store Pickup' : 'Home Delivery'}\n` +
            `Thank you for ordering from GrapeMaster!`;

        body = {
            messaging_product: 'whatsapp',
            to: toPhone,
            type: 'text',
            text: { preview_url: false, body: textBody },
        };
    } else {
        // Approved template mode
        body = {
            messaging_product: 'whatsapp',
            to: toPhone,
            type: 'template',
            template: {
                name: template,
                language: { code: 'en' },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: order.customerName },
                            { type: 'text', text: order.orderNumber },
                            { type: 'text', text: order.dealerName },
                            { type: 'text', text: `₹${order.total.toLocaleString('en-IN')}` },
                            { type: 'text', text: order.fulfillmentType === 'pickup' ? 'Store Pickup' : 'Home Delivery' },
                        ],
                    },
                ],
            },
        };
    }

    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.text();
            console.error(`[WhatsApp] Send failed (${useTextFallback ? 'text' : 'template'}):`, err);
        } else {
            console.log(`[WhatsApp] Sent to ${toPhone} for order #${order.orderNumber} (${useTextFallback ? 'text_fallback' : template})`);
        }
    } catch (err) {
        console.error('[WhatsApp] Network error:', err);
    }
}

// ─── Admin Email via Resend ───────────────────────────────────────────────────

export async function sendAdminOrderEmail(order: OrderNotifyPayload): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@grapemaster.com';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const itemsHtml = order.items
        .map(
            (i) =>
                `<tr><td style="padding:6px 12px;border-bottom:1px solid #f3f4f6">${i.productName}</td>
         <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;text-align:center">${i.quantity}</td>
         <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;text-align:right">₹${(i.unitPrice * i.quantity).toLocaleString('en-IN')}</td></tr>`
        )
        .join('');

    const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#1A4D25,#2A7436);padding:24px 32px">
        <h1 style="color:#fff;margin:0;font-size:20px">🌿 New Order — GrapeMaster</h1>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Order #${order.orderNumber}</p>
      </div>
      <div style="padding:24px 32px">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px">Customer</td><td style="font-weight:600">${order.customerName} · ${order.customerPhone}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Dealer</td><td style="font-weight:600">${order.dealerName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Fulfillment</td><td>${order.fulfillmentType === 'pickup' ? '🏪 Store Pickup' : '🚚 Home Delivery'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Address</td><td style="font-size:13px">${order.deliveryAddress}</td></tr>
        </table>
        <h3 style="font-size:14px;color:#374151;margin-bottom:8px">Order Items</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead><tr style="background:#f9fafb">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Product</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase">Amount</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="margin-top:16px;text-align:right;font-size:18px;font-weight:800;color:#2A7436">Total: ₹${order.total.toLocaleString('en-IN')}</div>
        <div style="margin-top:20px">
          <a href="${appUrl}/admin/orders" style="display:inline-block;background:#2A7436;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View in Admin Panel →</a>
        </div>
      </div>
    </div>`;

    if (!apiKey) {
        console.log('\n📧 [Email MOCK] Admin order alert:');
        console.log(`   To: ${adminEmail}`);
        console.log(`   Subject: New Order #${order.orderNumber} — ₹${order.total}`);
        addDevNotification({
            type: 'email',
            to: adminEmail,
            message: `New Order #${order.orderNumber} — ₹${order.total}`,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                from: 'GrapeMaster <orders@grapemaster.com>',
                to: [adminEmail],
                subject: `🌿 New Order #${order.orderNumber} — ₹${order.total.toLocaleString('en-IN')}`,
                html,
            }),
        });
        if (!res.ok) console.error('[Email] Resend failed:', await res.text());
        else console.log(`[Email] Admin notified for order #${order.orderNumber}`);
    } catch (err) {
        console.error('[Email] Network error:', err);
    }
}

// ─── Convenience function ─────────────────────────────────────────────────────

export async function notifyOrderPlaced(order: OrderNotifyPayload): Promise<void> {
    // Fire both without blocking the response — errors are swallowed per notification
    await Promise.allSettled([
        sendWhatsAppConfirmation(order),
        sendAdminOrderEmail(order),
    ]);
}
