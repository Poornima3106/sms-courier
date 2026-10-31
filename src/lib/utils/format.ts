export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function getWhatsAppUrl(customerName: string, orderNo: string, courierName?: string | null, awbNo?: string | null, phone?: string): string {
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  const courier = courierName || 'Courier';
  const awb = awbNo || 'N/A';
  const text = `Vanakkam ${customerName}, your order ${orderNo} from Sri Mahadevaiyer Sweets has been sent via ${courier}. Tracking no: ${awb}. Thank you!`;
  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function getTrackingUrl(courierName?: string | null, awbNo?: string | null): string {
  if (!awbNo) return '#';
  const c = (courierName || '').toLowerCase().trim();
  const awb = encodeURIComponent(awbNo.trim());

  if (c.includes('dtdc')) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${awb}`;
  }
  if (c.includes('st') || c.includes('st courier')) {
    return `https://stcourier.com/track?awb=${awb}`;
  }
  if (c.includes('professional') || c.includes('tpc')) {
    return `https://www.tpcindia.com/track.aspx?awb=${awb}`;
  }

  // Fallback to verified search as specified in requirement
  return `https://www.google.com/search?q=${encodeURIComponent(`${courierName || 'courier'} tracking ${awbNo}`)}`;
}
