import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PrintSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'dealer') redirect('/dealer/login');
  
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, dealerId: session.id },
    include: { items: true, dealer: true }
  });
  if (!order) redirect('/dealer/orders');
  
  return (
    <html>
      <head>
        <title>{`Order Slip #${order.orderNumber}`}</title>
        <style>{`
          @media print { body { margin: 0; } }
          body { font-family: Arial, sans-serif; max-width: 380px; margin: 20px auto; font-size: 13px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .logo { font-size: 18px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 4px 0; }
          .total-row { border-top: 1px solid #000; font-weight: bold; padding-top: 4px; }
          .footer { text-align: center; font-size: 11px; margin-top: 16px; border-top: 1px dashed #999; padding-top: 8px; }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div className="logo">🍇 GrapeMaster</div>
          <div>Order #{order.orderNumber}</div>
          <div style={{ fontSize: '11px' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
        </div>
        <table>
          <tbody>
            <tr><td><strong>Customer:</strong></td><td>{order.customerName}</td></tr>
            <tr><td><strong>Phone:</strong></td><td>{order.customerPhone}</td></tr>
            <tr><td><strong>Type:</strong></td><td>{order.fulfillmentType === 'pickup' ? '🏪 Store Pickup' : '🚚 Home Delivery'}</td></tr>
            {order.fulfillmentType === 'delivery' && (
              <tr><td><strong>Address:</strong></td><td>{order.deliveryAddress}</td></tr>
            )}
          </tbody>
        </table>
        <hr style={{ margin: '10px 0' }}/>
        <table>
          <thead><tr><th style={{ textAlign: 'left' }}>Product</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id}>
                <td>{item.productName} ({item.unit})</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>₹{Number(item.subtotal).toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {Number(order.deliveryCharge) > 0 && (
              <tr><td colSpan={2}>Delivery charge</td><td style={{ textAlign: 'right' }}>₹{Number(order.deliveryCharge)}</td></tr>
            )}
            <tr className="total-row"><td colSpan={2}><strong>TOTAL</strong></td><td style={{ textAlign: 'right' }}><strong>₹{Number(order.total).toLocaleString('en-IN')}</strong></td></tr>
          </tbody>
        </table>
        <div className="footer">
          Payment: PhonePe ✓ Paid<br/>
          Dealer: {order.dealer.name} · {order.dealer.phone}<br/>
          GrapeMaster Agricultural Supplies
        </div>
        <script dangerouslySetInnerHTML={{ __html: 'window.onload = () => window.print();' }}></script>
      </body>
    </html>
  );
}
