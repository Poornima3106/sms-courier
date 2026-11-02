import { pgTable, uuid, text, boolean, timestamp, date, numeric, integer, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('staff'), // 'owner' | 'staff'
  isActive: boolean('is_active').notNull().default(true),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNo: text('order_no').notNull().unique(),
    customerName: text('customer_name').notNull(),
    phone: text('phone').notNull(),
    address: text('address').notNull().default(''),
    city: text('city').notNull(),
    pincode: text('pincode').notNull(),
    product: text('product').notNull(),
    orderDate: date('order_date').notNull(),
    paymentStatus: text('payment_status').notNull().default('Pending'), // 'Paid' | 'COD' | 'Pending'
    amount: numeric('amount', { precision: 10, scale: 2 }).default('0').notNull(),
    status: text('status').notNull().default('Pending'), // 'Pending' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Delayed' | 'Returned' | 'Damaged'
    courier: text('courier'),
    awbNo: text('awb_no'),
    weightKg: numeric('weight_kg', { precision: 6, scale: 2 }),
    boxes: integer('boxes'),
    courierCharge: numeric('courier_charge', { precision: 10, scale: 2 }),
    dispatchDate: date('dispatch_date'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_orders_order_no').on(table.orderNo),
    index('idx_orders_order_date').on(table.orderDate),
    index('idx_orders_status').on(table.status),
    index('idx_orders_courier').on(table.courier),
    index('idx_orders_city').on(table.city),
  ]
);

export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  userName: text('user_name').notNull(),
  action: text('action').notNull(),
  orderNo: text('order_no'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const masters = pgTable('masters', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: text('category').notNull(), // 'courier' | 'city' | 'product'
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
