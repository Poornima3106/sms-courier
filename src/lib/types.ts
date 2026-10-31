export type UserRole = 'owner' | 'staff';

export interface User {
  id: string;
  username: string;
  full_name: string;
  password_hash?: string;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Dispatched'
  | 'In Transit'
  | 'Delivered'
  | 'Delayed'
  | 'Returned'
  | 'Damaged';

export type PaymentStatus = 'Paid' | 'COD' | 'Pending';

export interface Order {
  id: string;
  order_no: string; // e.g. DWL1001
  customer_name: string;
  phone: string; // 10 digits, starts with 6-9
  address: string;
  city: string;
  pincode: string; // 6 digits
  product: string;
  order_date: string; // YYYY-MM-DD
  payment_status: PaymentStatus;
  amount: number;
  status: OrderStatus;
  courier?: string | null;
  awb_no?: string | null;
  weight_kg?: number | null;
  boxes?: number | null;
  courier_charge?: number | null;
  dispatch_date?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string | null;
  user_name: string;
  action: string;
  order_no?: string | null;
  created_at: string;
}

export type MasterCategory = 'courier' | 'city' | 'product';

export interface MasterItem {
  id: string;
  category: MasterCategory;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface SessionPayload {
  userId: string;
  username: string;
  full_name: string;
  role: UserRole;
  must_change_password: boolean;
  exp?: number;
}
