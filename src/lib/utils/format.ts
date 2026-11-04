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

export function formatPhoneDisplay(phone?: string | null): { formatted: string; isInternational: boolean } {
  const raw = (phone || '').trim();
  if (!raw) return { formatted: '—', isInternational: false };

  const cleaned = raw.replace(/[\s().-]/g, '');
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return {
      formatted: `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`,
      isInternational: false,
    };
  }
  if (/^\+?91[6-9]\d{9}$/.test(cleaned)) {
    const ten = cleaned.slice(-10);
    return {
      formatted: `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`,
      isInternational: false,
    };
  }
  if (cleaned.startsWith('+')) {
    return {
      formatted: raw,
      isInternational: !cleaned.startsWith('+91'),
    };
  }
  return {
    formatted: raw,
    isInternational: false,
  };
}

export function getWhatsAppUrl(customerName: string, orderNo: string, courierName?: string | null, awbNo?: string | null, phone?: string): string {
  const phoneDigits = (phone || '').replace(/\D/g, '');
  const cleanPhone = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
  let text = '';
  if (awbNo) {
    const courier = courierName || 'Courier';
    text = `Vanakkam ${customerName}, your order ${orderNo} from Sri Mahadevaiyer Sweets has been sent via ${courier}. Tracking no: ${awbNo}. Thank you!`;
  } else {
    text = `Vanakkam ${customerName}, your order ${orderNo} from Sri Mahadevaiyer Sweets has been received and is being prepared for dispatch. Thank you!`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function isProfessionalCourier(courierName?: string | null, awbNo?: string | null): boolean {
  const c = (courierName || '').toLowerCase().trim();
  if (c.includes('professional') || c.includes('tpc') || c.includes('pro courier')) {
    return true;
  }
  const cleanAwb = getCleanCarrierAwb(courierName, awbNo);
  if (/^(PRO|TPC|POL|CJB|MAA|BLR|HYD|COK|TRZ|IXM|SLM|ERD|TUP|POY|PLNI|CBE|MDU|TEN|TVL|VLR|KANCHI)\d{4,}/i.test(cleanAwb)) {
    return true;
  }
  return false;
}

export function normalizeTrackingId(value?: string | null): string {
  return (value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function getCleanCarrierAwb(courierName?: string | null, awbNo?: string | null): string {
  const raw = (awbNo || '').trim().toUpperCase();
  if (!raw) return '';
  // Strip internal spaces/hyphens/slashes so carrier portals recognize the consignment number cleanly
  const compact = raw.replace(/[\s\-/]+/g, '');

  // Fix common station code typo where digit '0' is typed instead of letter 'O' in 3-letter prefix (e.g. P0L1440426 -> POL1440426)
  const prefixMatch = compact.match(/^([A-Z01]{3})(\d{5,12})$/);
  if (prefixMatch && /[A-Z]/.test(prefixMatch[1])) {
    const fixedPrefix = prefixMatch[1].replace(/0/g, 'O').replace(/1/g, 'I');
    return `${fixedPrefix}${prefixMatch[2]}`;
  }

  return compact;
}

export function getTrackCourierSlug(courierName?: string | null, awbNo?: string | null): string {
  const c = (courierName || '').toLowerCase().trim();
  if (isProfessionalCourier(courierName, awbNo)) {
    return 'professional-courier';
  }
  if (c.includes('st') || c.includes('st courier')) {
    return 'st-courier';
  }
  if (c.includes('dtdc')) {
    return 'dtdc';
  }
  if (c.includes('speed') || c.includes('post') || c.includes('india post')) {
    return 'speed-post';
  }
  if (c.includes('blue') || c.includes('dart')) {
    return 'blue-dart-courier';
  }
  if (c.includes('delhivery')) {
    return 'delhivery-courier';
  }
  if (c.includes('trackon')) {
    return 'trackon-courier';
  }
  return 'professional-courier';
}

export function getLiveTrackingReportUrl(courierName?: string | null, awbNo?: string | null): string {
  if (!awbNo) return '#';
  const cleanAwb = getCleanCarrierAwb(courierName, awbNo);
  const awb = encodeURIComponent(cleanAwb);
  const slug = getTrackCourierSlug(courierName, awbNo);

  // Directly opens the automatic live parcel checkpoints & map page for Professional Courier (e.g. POL1440426), ST Courier, DTDC, etc.
  return `https://trackcourier.io/track-and-trace/${slug}/${awb}`;
}

export function getOfficialPortalUrl(courierName?: string | null, awbNo?: string | null): string {
  const c = (courierName || '').toLowerCase().trim();
  const cleanAwb = getCleanCarrierAwb(courierName, awbNo);
  const awb = cleanAwb ? encodeURIComponent(cleanAwb) : '';

  if (isProfessionalCourier(courierName, awbNo)) {
    return `https://www.tpcindia.com/Default.aspx`;
  }
  if (c.includes('st') || c.includes('st courier')) {
    return `https://stcourier.com/`;
  }
  if (c.includes('dtdc')) {
    return `https://www.dtdc.in/`;
  }
  if (c.includes('speed') || c.includes('post') || c.includes('india post')) {
    return `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.tracking/trackconsignment.aspx`;
  }
  if (c.includes('blue') || c.includes('dart')) {
    return `https://www.bluedart.com/tracking?handler=trak&numbers=${awb}`;
  }
  if (c.includes('delhivery')) {
    return `https://www.delhivery.com/track/package/${awb}`;
  }
  if (c.includes('trackon')) {
    return `https://trackon.in/TrackOrder.aspx?awb=${awb}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${courierName || 'courier'} tracking ${cleanAwb || ''}`)}`;
}

export function getTrackingUrl(courierName?: string | null, awbNo?: string | null): string {
  return getLiveTrackingReportUrl(courierName, awbNo);
}
