import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Order, ActivityLog, MasterItem, OrderStatus, PaymentStatus } from '../types';
import { getDb, schema } from './index';
import { eq, desc, and, gte, lte, or, sql } from 'drizzle-orm';

const LOCAL_STORE_DIR = path.join(process.cwd(), '.local_data');
const LOCAL_STORE_FILE = path.join(LOCAL_STORE_DIR, 'store.json');

interface LocalStoreData {
  users: User[];
  orders: Order[];
  activityLogs: ActivityLog[];
  masters: MasterItem[];
}

function getDefaultStore(): LocalStoreData {
  const hash = bcrypt.hashSync('Admin@1946', 10);
  const staffHash = bcrypt.hashSync('Staff@1946', 10);
  const now = new Date().toISOString();

  const defaultUsers: User[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      username: 'owner',
      full_name: 'Mahadevaiyer (Owner)',
      password_hash: hash,
      role: 'owner',
      is_active: true,
      must_change_password: false,
      created_at: now,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      username: 'staff',
      full_name: 'Shop Staff Desk',
      password_hash: staffHash,
      role: 'staff',
      is_active: true,
      must_change_password: false,
      created_at: now,
    },
  ];

  const defaultMasters: MasterItem[] = [
    { id: 'c1', category: 'courier', name: 'DTDC', is_active: true, created_at: now },
    { id: 'c2', category: 'courier', name: 'ST Courier', is_active: true, created_at: now },
    { id: 'c3', category: 'courier', name: 'Professional', is_active: true, created_at: now },
    { id: 'c4', category: 'courier', name: 'Others', is_active: true, created_at: now },
    { id: 'ct0', category: 'city', name: 'Pollachi', is_active: true, created_at: now },
    { id: 'ct1', category: 'city', name: 'Madurai', is_active: true, created_at: now },
    { id: 'ct2', category: 'city', name: 'Chennai', is_active: true, created_at: now },
    { id: 'ct3', category: 'city', name: 'Coimbatore', is_active: true, created_at: now },
    { id: 'ct4', category: 'city', name: 'Trichy', is_active: true, created_at: now },
    { id: 'ct5', category: 'city', name: 'Salem', is_active: true, created_at: now },
    { id: 'ct6', category: 'city', name: 'Tirunelveli', is_active: true, created_at: now },
    { id: 'p1', category: 'product', name: 'Diwali Feast Box', is_active: true, created_at: now },
    { id: 'p2', category: 'product', name: 'Mixed Sweets Box', is_active: true, created_at: now },
    { id: 'p3', category: 'product', name: 'Mysore Pak Box', is_active: true, created_at: now },
    { id: 'p4', category: 'product', name: 'Laddu Box', is_active: true, created_at: now },
  ];

  const defaultOrders: Order[] = [
    {
      id: 'order-1',
      order_no: '1001',
      customer_name: 'Priya S',
      phone: '9876543210',
      address: '12 West Masi Street',
      city: 'Madurai',
      pincode: '625001',
      product: 'Diwali Feast Box',
      order_date: '2026-10-25',
      payment_status: 'Paid',
      amount: 1250,
      status: 'Delivered',
      courier: 'DTDC',
      awb_no: 'DTDC9812401',
      weight_kg: 1.5,
      boxes: 2,
      courier_charge: 120,
      dispatch_date: '2026-10-26',
      created_by: defaultUsers[0].id,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'order-2',
      order_no: '1002',
      customer_name: 'Arjun K',
      phone: '9845123456',
      address: '45 Cherry Road, Hasthampatti',
      city: 'Salem',
      pincode: '636007',
      product: 'Mysore Pak Box',
      order_date: '2026-10-28',
      payment_status: 'Paid',
      amount: 850,
      status: 'In Transit',
      courier: 'ST Courier',
      awb_no: 'ST8892110',
      weight_kg: 1.0,
      boxes: 1,
      courier_charge: 90,
      dispatch_date: '2026-10-29',
      created_by: defaultUsers[0].id,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'order-3',
      order_no: '1003',
      customer_name: 'Meena R',
      phone: '9789012345',
      address: '88 Thillai Nagar 10th Cross',
      city: 'Trichy',
      pincode: '620018',
      product: 'Mixed Sweets Box',
      order_date: '2026-10-29',
      payment_status: 'COD',
      amount: 950,
      status: 'Delayed',
      courier: 'Professional',
      awb_no: 'PRO672314',
      weight_kg: 1.2,
      boxes: 1,
      courier_charge: 95,
      dispatch_date: '2026-10-30',
      created_by: defaultUsers[0].id,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'order-4',
      order_no: '1004',
      customer_name: 'Karthik M',
      phone: '9944123890',
      address: '23 Gandhipuram 4th Street',
      city: 'Coimbatore',
      pincode: '641012',
      product: 'Laddu Box',
      order_date: '2026-10-31',
      payment_status: 'Pending',
      amount: 650,
      status: 'Pending',
      courier: null,
      awb_no: null,
      weight_kg: null,
      boxes: 1,
      courier_charge: null,
      dispatch_date: null,
      created_by: defaultUsers[0].id,
      created_at: now,
      updated_at: now,
    },
  ];

  const defaultLogs: ActivityLog[] = [
    {
      id: 'log-1',
      user_id: defaultUsers[0].id,
      user_name: defaultUsers[0].full_name,
      action: 'Seeded system initial data',
      order_no: null,
      created_at: now,
    },
  ];

  return {
    users: defaultUsers,
    orders: defaultOrders,
    activityLogs: defaultLogs,
    masters: defaultMasters,
  };
}

function readLocalStore(): LocalStoreData {
  try {
    if (!fs.existsSync(LOCAL_STORE_DIR)) {
      fs.mkdirSync(LOCAL_STORE_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_STORE_FILE)) {
      const initial = getDefaultStore();
      fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return getDefaultStore();
  }
}

function writeLocalStore(data: LocalStoreData) {
  try {
    if (!fs.existsSync(LOCAL_STORE_DIR)) {
      fs.mkdirSync(LOCAL_STORE_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local store:', err);
  }
}

// Data Store Access Methods
export async function findUserByUsername(username: string): Promise<User | null> {
  const db = getDb();
  if (db) {
    const res = await db.select().from(schema.users).where(eq(schema.users.username, username.trim().toLowerCase())).limit(1);
    if (res.length > 0) {
      const u = res[0];
      return {
        id: u.id,
        username: u.username,
        full_name: u.fullName,
        password_hash: u.passwordHash,
        role: u.role as any,
        is_active: u.isActive,
        must_change_password: u.mustChangePassword,
        created_at: u.createdAt.toISOString(),
      };
    }
    return null;
  }
  const store = readLocalStore();
  return store.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase()) || null;
}

export async function findUserById(id: string): Promise<User | null> {
  const db = getDb();
  if (db) {
    const res = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    if (res.length > 0) {
      const u = res[0];
      return {
        id: u.id,
        username: u.username,
        full_name: u.fullName,
        password_hash: u.passwordHash,
        role: u.role as any,
        is_active: u.isActive,
        must_change_password: u.mustChangePassword,
        created_at: u.createdAt.toISOString(),
      };
    }
    return null;
  }
  const store = readLocalStore();
  return store.users.find((u) => u.id === id) || null;
}

export async function listUsers(): Promise<User[]> {
  const db = getDb();
  if (db) {
    const res = await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
    return res.map((u) => ({
      id: u.id,
      username: u.username,
      full_name: u.fullName,
      role: u.role as any,
      is_active: u.isActive,
      must_change_password: u.mustChangePassword,
      created_at: u.createdAt.toISOString(),
    }));
  }
  const store = readLocalStore();
  return store.users.map(({ password_hash, ...u }) => u as User);
}

export async function createUser(data: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const now = new Date().toISOString();
  const db = getDb();
  if (db) {
    const [inserted] = await db
      .insert(schema.users)
      .values({
        username: data.username.toLowerCase().trim(),
        fullName: data.full_name,
        passwordHash: data.password_hash || '',
        role: data.role,
        isActive: data.is_active,
        mustChangePassword: data.must_change_password,
      })
      .returning();
    return {
      id: inserted.id,
      username: inserted.username,
      full_name: inserted.fullName,
      role: inserted.role as any,
      is_active: inserted.isActive,
      must_change_password: inserted.mustChangePassword,
      created_at: inserted.createdAt.toISOString(),
    };
  }
  const store = readLocalStore();
  const newUser: User = {
    id: `user-${Date.now()}`,
    ...data,
    username: data.username.toLowerCase().trim(),
    created_at: now,
  };
  store.users.unshift(newUser);
  writeLocalStore(store);
  return newUser;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const db = getDb();
  if (db) {
    const val: any = {};
    if (updates.full_name !== undefined) val.fullName = updates.full_name;
    if (updates.password_hash !== undefined) val.passwordHash = updates.password_hash;
    if (updates.is_active !== undefined) val.isActive = updates.is_active;
    if (updates.must_change_password !== undefined) val.mustChangePassword = updates.must_change_password;
    if (updates.role !== undefined) val.role = updates.role;

    const [updated] = await db.update(schema.users).set(val).where(eq(schema.users.id, id)).returning();
    if (!updated) return null;
    return {
      id: updated.id,
      username: updated.username,
      full_name: updated.fullName,
      role: updated.role as any,
      is_active: updated.isActive,
      must_change_password: updated.mustChangePassword,
      created_at: updated.createdAt.toISOString(),
    };
  }
  const store = readLocalStore();
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  store.users[idx] = { ...store.users[idx], ...updates };
  writeLocalStore(store);
  return store.users[idx];
}

export async function listOrders(filters?: {
  search?: string;
  status?: string;
  courier?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Order[]> {
  const db = getDb();
  if (db) {
    const conditions = [];
    if (filters?.status && filters.status !== 'All') {
      conditions.push(eq(schema.orders.status, filters.status));
    }
    if (filters?.courier && filters.courier !== 'All') {
      conditions.push(eq(schema.orders.courier, filters.courier));
    }
    if (filters?.city && filters.city !== 'All') {
      conditions.push(eq(schema.orders.city, filters.city));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(schema.orders.orderDate, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(schema.orders.orderDate, filters.dateTo));
    }

    let query = db.select().from(schema.orders);
    if (conditions.length > 0) {
      query = (query as any).where(and(...conditions));
    }
    const res = await query.orderBy(desc(schema.orders.createdAt));

    let items: Order[] = res.map((o) => ({
      id: o.id,
      order_no: o.orderNo,
      customer_name: o.customerName,
      phone: o.phone,
      address: o.address,
      city: o.city,
      pincode: o.pincode,
      product: o.product,
      order_date: o.orderDate,
      payment_status: o.paymentStatus as PaymentStatus,
      amount: Number(o.amount) || 0,
      status: o.status as OrderStatus,
      courier: o.courier,
      awb_no: o.awbNo,
      weight_kg: o.weightKg ? Number(o.weightKg) : null,
      boxes: o.boxes,
      courier_charge: o.courierCharge ? Number(o.courierCharge) : null,
      dispatch_date: o.dispatchDate,
      created_by: o.createdBy,
      created_at: o.createdAt.toISOString(),
      updated_at: o.updatedAt.toISOString(),
    }));

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (o) =>
          o.order_no.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          (o.awb_no && o.awb_no.toLowerCase().includes(q))
      );
    }
    return items;
  }

  const store = readLocalStore();
  let items = [...store.orders];

  if (filters?.status && filters.status !== 'All') {
    items = items.filter((o) => o.status === filters.status);
  }
  if (filters?.courier && filters.courier !== 'All') {
    items = items.filter((o) => o.courier === filters.courier);
  }
  if (filters?.city && filters.city !== 'All') {
    items = items.filter((o) => o.city.toLowerCase() === filters.city!.toLowerCase());
  }
  if (filters?.dateFrom) {
    items = items.filter((o) => o.order_date >= filters.dateFrom!);
  }
  if (filters?.dateTo) {
    items = items.filter((o) => o.order_date <= filters.dateTo!);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    items = items.filter(
      (o) =>
        o.order_no.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.awb_no && o.awb_no.toLowerCase().includes(q))
    );
  }

  return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getOrderByOrderNo(orderNo: string): Promise<Order | null> {
  const clean = orderNo.toUpperCase().trim();
  const db = getDb();
  if (db) {
    const res = await db
      .select()
      .from(schema.orders)
      .where(or(eq(schema.orders.orderNo, clean), eq(schema.orders.awbNo, clean)))
      .limit(1);
    if (res.length === 0) return null;
    const o = res[0];
    return {
      id: o.id,
      order_no: o.orderNo,
      customer_name: o.customerName,
      phone: o.phone,
      address: o.address,
      city: o.city,
      pincode: o.pincode,
      product: o.product,
      order_date: o.orderDate,
      payment_status: o.paymentStatus as PaymentStatus,
      amount: Number(o.amount) || 0,
      status: o.status as OrderStatus,
      courier: o.courier,
      awb_no: o.awbNo,
      weight_kg: o.weightKg ? Number(o.weightKg) : null,
      boxes: o.boxes,
      courier_charge: o.courierCharge ? Number(o.courierCharge) : null,
      dispatch_date: o.dispatchDate,
      created_by: o.createdBy,
      created_at: o.createdAt.toISOString(),
      updated_at: o.updatedAt.toISOString(),
    };
  }
  const store = readLocalStore();
  return (
    store.orders.find(
      (o) =>
        o.order_no.toUpperCase() === clean ||
        (o.awb_no && o.awb_no.toUpperCase() === clean)
    ) || null
  );
}

export async function getNextOrderNumber(): Promise<string> {
  const orders = await listOrders();
  let maxNum = 1000;
  for (const o of orders) {
    const digits = o.order_no.replace(/\D/g, '');
    if (digits) {
      const num = parseInt(digits, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `${maxNum + 1}`;
}

export async function createOrder(data: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
  const now = new Date().toISOString();
  const db = getDb();
  if (db) {
    let validUserId: string | null = null;
    if (data.created_by) {
      try {
        const u = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, data.created_by)).limit(1);
        if (u.length > 0) validUserId = u[0].id;
      } catch {
        validUserId = null;
      }
    }

    const [inserted] = await db
      .insert(schema.orders)
      .values({
        orderNo: data.order_no.toUpperCase().trim(),
        customerName: data.customer_name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        product: data.product,
        orderDate: data.order_date,
        paymentStatus: data.payment_status,
        amount: data.amount.toString(),
        status: data.status || 'Pending',
        courier: data.courier || null,
        awbNo: data.awb_no || null,
        weightKg: data.weight_kg ? data.weight_kg.toString() : null,
        boxes: data.boxes || 1,
        courierCharge: data.courier_charge ? data.courier_charge.toString() : null,
        dispatchDate: data.dispatch_date || null,
        createdBy: validUserId,
      })
      .returning();

    return {
      id: inserted.id,
      order_no: inserted.orderNo,
      customer_name: inserted.customerName,
      phone: inserted.phone,
      address: inserted.address,
      city: inserted.city,
      pincode: inserted.pincode,
      product: inserted.product,
      order_date: inserted.orderDate,
      payment_status: inserted.paymentStatus as PaymentStatus,
      amount: Number(inserted.amount),
      status: inserted.status as OrderStatus,
      courier: inserted.courier,
      awb_no: inserted.awbNo,
      weight_kg: inserted.weightKg ? Number(inserted.weightKg) : null,
      boxes: inserted.boxes,
      courier_charge: inserted.courierCharge ? Number(inserted.courierCharge) : null,
      dispatch_date: inserted.dispatchDate,
      created_by: inserted.createdBy,
      created_at: inserted.createdAt.toISOString(),
      updated_at: inserted.updatedAt.toISOString(),
    };
  }

  const store = readLocalStore();
  const newOrder: Order = {
    id: `order-${Date.now()}`,
    ...data,
    order_no: data.order_no.toUpperCase().trim(),
    created_at: now,
    updated_at: now,
  };
  store.orders.unshift(newOrder);
  writeLocalStore(store);
  return newOrder;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  const now = new Date().toISOString();
  const db = getDb();
  if (db) {
    const val: any = { updatedAt: new Date() };
    if (updates.status !== undefined) val.status = updates.status;
    if (updates.product !== undefined) val.product = updates.product;
    if (updates.courier !== undefined) val.courier = updates.courier;
    if (updates.awb_no !== undefined) val.awbNo = updates.awb_no;
    if (updates.weight_kg !== undefined) val.weightKg = updates.weight_kg?.toString();
    if (updates.boxes !== undefined) val.boxes = updates.boxes;
    if (updates.courier_charge !== undefined) val.courierCharge = updates.courier_charge?.toString();
    if (updates.dispatch_date !== undefined) val.dispatchDate = updates.dispatch_date;
    if (updates.payment_status !== undefined) val.paymentStatus = updates.payment_status;

    const [updated] = await db.update(schema.orders).set(val).where(eq(schema.orders.id, id)).returning();
    if (!updated) return null;
    return {
      id: updated.id,
      order_no: updated.orderNo,
      customer_name: updated.customerName,
      phone: updated.phone,
      address: updated.address,
      city: updated.city,
      pincode: updated.pincode,
      product: updated.product,
      order_date: updated.orderDate,
      payment_status: updated.paymentStatus as PaymentStatus,
      amount: Number(updated.amount),
      status: updated.status as OrderStatus,
      courier: updated.courier,
      awb_no: updated.awbNo,
      weight_kg: updated.weightKg ? Number(updated.weightKg) : null,
      boxes: updated.boxes,
      courier_charge: updated.courierCharge ? Number(updated.courierCharge) : null,
      dispatch_date: updated.dispatchDate,
      created_by: updated.createdBy,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    };
  }

  const store = readLocalStore();
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  store.orders[idx] = {
    ...store.orders[idx],
    ...updates,
    updated_at: now,
  };
  writeLocalStore(store);
  return store.orders[idx];
}

export async function deleteOrder(id: string): Promise<boolean> {
  const db = getDb();
  if (db) {
    const res = await db.delete(schema.orders).where(eq(schema.orders.id, id)).returning();
    return res.length > 0;
  }
  const store = readLocalStore();
  const initialLen = store.orders.length;
  store.orders = store.orders.filter((o) => o.id !== id);
  writeLocalStore(store);
  return store.orders.length < initialLen;
}

export async function bulkDispatch(
  items: { id: string; awbNo: string; weightKg?: number; boxes?: number; courierCharge?: number }[],
  common: { courier: string; dispatchDate: string },
  user: { id?: string; name: string }
): Promise<number> {
  const db = getDb();
  if (db) {
    // In neon-http driver, perform operations sequentially in transaction
    let count = 0;
    for (const item of items) {
      await db
        .update(schema.orders)
        .set({
          status: 'Dispatched',
          courier: common.courier,
          dispatchDate: common.dispatchDate,
          awbNo: item.awbNo.trim(),
          weightKg: item.weightKg ? item.weightKg.toString() : null,
          boxes: item.boxes || 1,
          courierCharge: item.courierCharge ? item.courierCharge.toString() : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, item.id));

      await logActivity(user.id || null, user.name, `Dispatched via ${common.courier} (AWB: ${item.awbNo})`);
      count++;
    }
    return count;
  }

  const store = readLocalStore();
  let count = 0;
  const now = new Date().toISOString();

  for (const item of items) {
    const idx = store.orders.findIndex((o) => o.id === item.id);
    if (idx !== -1) {
      store.orders[idx] = {
        ...store.orders[idx],
        status: 'Dispatched',
        courier: common.courier,
        dispatch_date: common.dispatchDate,
        awb_no: item.awbNo.trim(),
        weight_kg: item.weightKg || null,
        boxes: item.boxes || 1,
        courier_charge: item.courierCharge || null,
        updated_at: now,
      };
      store.activityLogs.unshift({
        id: `log-${Date.now()}-${count}`,
        user_id: user.id || null,
        user_name: user.name,
        action: `Dispatched order ${store.orders[idx].order_no} via ${common.courier} (AWB: ${item.awbNo})`,
        order_no: store.orders[idx].order_no,
        created_at: now,
      });
      count++;
    }
  }
  writeLocalStore(store);
  return count;
}

export async function logActivity(
  userId: string | null,
  userName: string,
  action: string,
  orderNo?: string
): Promise<void> {
  const db = getDb();
  if (db) {
    let validUserId: string | null = null;
    if (userId) {
      try {
        const u = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
        if (u.length > 0) validUserId = u[0].id;
      } catch {
        validUserId = null;
      }
    }

    await db.insert(schema.activityLog).values({
      userId: validUserId,
      userName,
      action,
      orderNo: orderNo || null,
    });
    return;
  }
  const store = readLocalStore();
  store.activityLogs.unshift({
    id: `log-${Date.now()}`,
    user_id: userId,
    user_name: userName,
    action,
    order_no: orderNo || null,
    created_at: new Date().toISOString(),
  });
  if (store.activityLogs.length > 200) {
    store.activityLogs = store.activityLogs.slice(0, 200);
  }
  writeLocalStore(store);
}

export async function listActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
  const db = getDb();
  if (db) {
    const res = await db.select().from(schema.activityLog).orderBy(desc(schema.activityLog.createdAt)).limit(limit);
    return res.map((l) => ({
      id: l.id,
      user_id: l.userId,
      user_name: l.userName,
      action: l.action,
      order_no: l.orderNo,
      created_at: l.createdAt.toISOString(),
    }));
  }
  const store = readLocalStore();
  return store.activityLogs.slice(0, limit);
}

export async function listMasters(category?: string): Promise<MasterItem[]> {
  const db = getDb();
  if (db) {
    let query = db.select().from(schema.masters);
    if (category) {
      query = (query as any).where(eq(schema.masters.category, category));
    }
    const res = await query;
    return res.map((m) => ({
      id: m.id,
      category: m.category as any,
      name: m.name,
      is_active: m.isActive,
      created_at: m.createdAt.toISOString(),
    }));
  }
  const store = readLocalStore();
  let items = store.masters;
  if (category) {
    items = items.filter((m) => m.category === category);
  }
  return items;
}

export async function createMasterItem(category: string, name: string): Promise<MasterItem> {
  const now = new Date().toISOString();
  const db = getDb();
  if (db) {
    const [inserted] = await db
      .insert(schema.masters)
      .values({
        category,
        name: name.trim(),
        isActive: true,
      })
      .returning();
    return {
      id: inserted.id,
      category: inserted.category as any,
      name: inserted.name,
      is_active: inserted.isActive,
      created_at: inserted.createdAt.toISOString(),
    };
  }
  const store = readLocalStore();
  const newItem: MasterItem = {
    id: `m-${Date.now()}`,
    category: category as any,
    name: name.trim(),
    is_active: true,
    created_at: now,
  };
  store.masters.push(newItem);
  writeLocalStore(store);
  return newItem;
}

export async function toggleMasterItem(id: string, isActive: boolean): Promise<boolean> {
  const db = getDb();
  if (db) {
    const res = await db.update(schema.masters).set({ isActive }).where(eq(schema.masters.id, id)).returning();
    return res.length > 0;
  }
  const store = readLocalStore();
  const item = store.masters.find((m) => m.id === id);
  if (item) {
    item.is_active = isActive;
    writeLocalStore(store);
    return true;
  }
  return false;
}

export async function deleteMasterItem(id: string): Promise<boolean> {
  const db = getDb();
  if (db) {
    const res = await db.delete(schema.masters).where(eq(schema.masters.id, id)).returning();
    return res.length > 0;
  }
  const store = readLocalStore();
  store.masters = store.masters.filter((m) => m.id !== id);
  writeLocalStore(store);
  return true;
}
