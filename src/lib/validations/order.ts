import { z } from 'zod';

export const orderFormSchema = z.object({
  order_no: z
    .string()
    .trim()
    .min(3, 'Order number must be at least 3 characters')
    .regex(/^DWL\d+$/i, 'Order number must follow format DWL1001'),
  customer_name: z
    .string()
    .trim()
    .min(2, 'Customer name must be at least 2 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9'),
  address: z
    .string()
    .trim()
    .min(5, 'Delivery address is required and must be at least 5 characters'),
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
  boxes: z.coerce.number().int().min(1).optional().nullable(),
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
