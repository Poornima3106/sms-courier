import { z } from 'zod';

export interface CountryCodeOption {
  code: string;
  label: string;
  country: string;
  placeholder: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: '+91', label: '🇮🇳 India (+91)', country: 'India', placeholder: '98765 43210 (10 digits)' },
  { code: '+1', label: '🇺🇸/🇨🇦 USA / Canada (+1)', country: 'USA / Canada', placeholder: '415 555 2671' },
  { code: '+44', label: '🇬🇧 UK (+44)', country: 'United Kingdom', placeholder: '20 7946 0958' },
  { code: '+971', label: '🇦🇪 UAE (+971)', country: 'UAE', placeholder: '50 123 4567' },
  { code: '+65', label: '🇸🇬 Singapore (+65)', country: 'Singapore', placeholder: '8123 4567' },
  { code: '+60', label: '🇲🇾 Malaysia (+60)', country: 'Malaysia', placeholder: '12 345 6789' },
  { code: '+61', label: '🇦🇺 Australia (+61)', country: 'Australia', placeholder: '412 345 678' },
  { code: '+49', label: '🇩🇪 Germany (+49)', country: 'Germany', placeholder: '1512 3456789' },
  { code: '+33', label: '🇫🇷 France (+33)', country: 'France', placeholder: '6 12 34 56 78' },
  { code: '+966', label: '🇸🇦 Saudi Arabia (+966)', country: 'Saudi Arabia', placeholder: '50 123 4567' },
  { code: '+974', label: '🇶🇦 Qatar (+974)', country: 'Qatar', placeholder: '3312 3456' },
  { code: '+94', label: '🇱🇰 Sri Lanka (+94)', country: 'Sri Lanka', placeholder: '71 234 5678' },
  { code: 'custom', label: '🌍 Other International (+)', country: 'International', placeholder: '+81 3 1234 5678' },
];

export function parseStoredPhone(phone?: string | null): { countryCode: string; localNumber: string } {
  const raw = (phone || '').trim();
  if (!raw) {
    return { countryCode: '+91', localNumber: '' };
  }

  const cleaned = raw.replace(/[\s().-]/g, '');

  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return { countryCode: '+91', localNumber: cleaned };
  }
  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    return { countryCode: '+91', localNumber: cleaned.slice(1) };
  }
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return { countryCode: '+91', localNumber: cleaned.slice(2) };
  }

  if (cleaned.startsWith('+')) {
    const knownCodes = COUNTRY_CODES.filter((c) => c.code !== 'custom')
      .map((c) => c.code)
      .sort((a, b) => b.length - a.length);

    for (const code of knownCodes) {
      if (cleaned.startsWith(code)) {
        return {
          countryCode: code,
          localNumber: cleaned.slice(code.length),
        };
      }
    }
    return { countryCode: 'custom', localNumber: raw };
  }

  return { countryCode: '+91', localNumber: raw };
}

export function combinePhoneInput(countryCode: string, localNumber: string): string {
  const trimmed = localNumber.trim();
  if (!trimmed) return '';

  // If the user directly typed/pasted an international number starting with +
  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  const cleanedDigits = trimmed.replace(/[\s().-]/g, '');

  if (countryCode === 'custom') {
    return cleanedDigits.startsWith('+') ? cleanedDigits : `+${cleanedDigits}`;
  }

  if (countryCode === '+91') {
    if (/^0[6-9]\d{9}$/.test(cleanedDigits)) {
      return `+91${cleanedDigits.slice(1)}`;
    }
    if (/^91[6-9]\d{9}$/.test(cleanedDigits)) {
      return `+${cleanedDigits}`;
    }
  }

  return `${countryCode}${cleanedDigits}`;
}

export const phoneNumberSchema = z
  .string()
  .trim()
  .transform((value) => {
    const cleaned = value.replace(/[\s().-]/g, '');
    if (/^[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned}`;
    if (/^0[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned.slice(1)}`;
    if (/^91[6-9]\d{9}$/.test(cleaned)) return `+${cleaned}`;
    if (/^00[1-9]\d{6,14}$/.test(cleaned)) return `+${cleaned.slice(2)}`;
    return cleaned;
  })
  .superRefine((val, ctx) => {
    if (val.startsWith('+91')) {
      if (!/^\+91[6-9]\d{9}$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indian mobile number must be 10 digits starting with 6, 7, 8, or 9',
        });
      }
      return;
    }

    if (!/^\+[1-9]\d{6,14}$/.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid 10-digit Indian mobile number or international number with country code (e.g. +1 415 555 2671)',
      });
    }
  });

export const orderFormSchema = z.object({
  order_no: z
    .string()
    .trim()
    .min(1, 'Order number is required')
    .regex(/^\d+$/, 'Order number must contain only numbers (e.g. 1001)'),
  customer_name: z
    .string()
    .trim()
    .min(2, 'Customer name must be at least 2 characters'),
  phone: phoneNumberSchema,
  address: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => val ?? ''),
  city: z
    .string()
    .trim()
    .min(2, 'City/Town is required'),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
  product: z
    .string()
    .trim()
    .min(2, 'Product selection is required'),
  order_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid order date is required (YYYY-MM-DD)'),
  payment_status: z.enum(['Paid', 'COD', 'Pending']),
  amount: z
    .coerce
    .number()
    .min(0, 'Amount cannot be negative'),
  status: z
    .enum(['Pending', 'Dispatched', 'In Transit', 'Delivered', 'Delayed', 'Returned', 'Damaged'])
    .default('Pending'),
  courier: z.string().trim().optional().nullable(),
  awb_no: z.string().trim().optional().nullable(),
  dispatch_date: z.string().optional().nullable(),
  boxes: z.coerce.number().int().min(1, 'Total items must be at least 1').default(1),
  weight_kg: z.coerce.number().min(0).optional().nullable(),
  courier_charge: z.coerce.number().min(0).optional().nullable(),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;

export const bulkDispatchSchema = z.object({
  courier: z.string().min(1, 'Courier is required'),
  dispatch_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid dispatch date is required'),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        awbNo: z.string().trim().min(2, 'AWB tracking number is required for dispatch'),
        weightKg: z.coerce.number().optional().nullable(),
        boxes: z.coerce.number().int().min(1).default(1),
        courierCharge: z.coerce.number().optional().nullable(),
      })
    )
    .min(1, 'At least one order must be selected for dispatch'),
});
