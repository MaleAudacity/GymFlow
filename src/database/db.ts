import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { GymSettings, Plan, Member, Attendance, DashboardStats, SubscriptionInfo } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('gymflow.db');
  }
  return dbInstance;
};

export const initDatabase = async (): Promise<void> => {
  const db = await getDB();

  // Enable WAL mode for performance
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS gym_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      gym_name TEXT NOT NULL DEFAULT 'PowerForge Gym',
      logo_uri TEXT,
      theme_color TEXT NOT NULL DEFAULT '#4B4FE0',
      working_hours_start TEXT NOT NULL DEFAULT '06:00',
      working_hours_end TEXT NOT NULL DEFAULT '22:00',
      owner_pin TEXT,
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      app_locked INTEGER NOT NULL DEFAULT 0,
      subscription_status TEXT NOT NULL DEFAULT 'trial',
      subscription_plan TEXT NOT NULL DEFAULT 'monthly',
      subscription_price REAL NOT NULL DEFAULT 299,
      subscription_currency TEXT NOT NULL DEFAULT '₹',
      subscription_expires_at TEXT,
      license_key TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      duration_days INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      photo_uri TEXT,
      plan_id INTEGER NOT NULL,
      join_date TEXT NOT NULL,
      fee_status TEXT NOT NULL DEFAULT 'paid',
      pin_code TEXT NOT NULL UNIQUE,
      qr_payload TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      checked_in_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      method TEXT NOT NULL CHECK (method IN ('pin', 'qr')),
      FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
    );
  `);

  // Safe migrations for existing tables
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'trial';`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN subscription_plan TEXT NOT NULL DEFAULT 'monthly';`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN subscription_price REAL NOT NULL DEFAULT 299;`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN subscription_currency TEXT NOT NULL DEFAULT 'INR';`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN subscription_expires_at TEXT;`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN license_key TEXT;`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN app_locked INTEGER NOT NULL DEFAULT 0;`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN language TEXT NOT NULL DEFAULT 'en';`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN currency TEXT NOT NULL DEFAULT 'INR';`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN country TEXT NOT NULL DEFAULT 'IN';`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN phone TEXT;`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN email TEXT;`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN address TEXT;`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN tax_id TEXT;`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE gym_settings ADD COLUMN has_seen_tutorial INTEGER NOT NULL DEFAULT 0;`);
  } catch {}

  // Seed default settings if not exists
  const existingSettings = await db.getFirstAsync<GymSettings>('SELECT * FROM gym_settings WHERE id = 1');
  if (!existingSettings) {
    await db.runAsync(
      `INSERT INTO gym_settings (id, gym_name, theme_color, working_hours_start, working_hours_end, onboarding_completed, subscription_status, subscription_price, subscription_currency, language, currency, country)
       VALUES (1, 'PowerForge Gym', '#4F46E5', '06:00', '22:00', 0, 'trial', 299, 'INR', 'en', 'INR', 'IN')`
    );
  }

  // Ensure standard plans exist so member registration always succeeds
  const plansCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM plans');
  if (!plansCount || plansCount.count === 0) {
    await db.runAsync(
      `INSERT INTO plans (name, price, duration_days) VALUES 
       ('Monthly Standard', 1000, 30),
       ('Quarterly Fitness', 2500, 90),
       ('Annual VIP', 8000, 365)`
    );
  }
};

export const clearAllDataAndStartFresh = async (): Promise<void> => {
  const db = await getDB();
  await db.execAsync(`
    DELETE FROM attendance;
    DELETE FROM members;
    DELETE FROM plans;
    DELETE FROM sqlite_sequence WHERE name IN ('members', 'attendance', 'plans');
    INSERT INTO plans (name, price, duration_days) VALUES 
      ('Monthly Standard', 1000, 30),
      ('Quarterly Fitness', 2500, 90),
      ('Annual VIP', 8000, 365);
  `);
};

/* ==================== SETTINGS & SUBSCRIPTION ==================== */

export const getGymSettings = async (): Promise<GymSettings> => {
  const db = await getDB();
  const settings = await db.getFirstAsync<GymSettings>('SELECT * FROM gym_settings WHERE id = 1');
  if (settings) {
    return {
      ...settings,
      language: settings.language || 'en',
      currency: settings.currency || settings.subscription_currency || 'INR',
      country: settings.country || 'IN',
    };
  }
  return {
    id: 1,
    gym_name: 'PowerForge Gym',
    logo_uri: null,
    theme_color: '#4F46E5',
    working_hours_start: '06:00',
    working_hours_end: '22:00',
    owner_pin: null,
    onboarding_completed: 0,
    app_locked: false,
    language: 'en',
    currency: 'INR',
    country: 'IN',
    subscription_status: 'trial',
    subscription_plan: 'monthly',
    subscription_price: 299,
    subscription_currency: 'INR',
    created_at: new Date().toISOString(),
  };
};

export const updateGymSettings = async (settings: Partial<GymSettings>): Promise<void> => {
  const db = await getDB();
  const keys = Object.keys(settings).filter((k) => k !== 'id' && k !== 'created_at');
  if (keys.length === 0) return;

  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (settings as any)[k]);

  await db.runAsync(`UPDATE gym_settings SET ${setClause} WHERE id = 1`, ...values);
};

export const setOwnerPin = async (pin: string | null): Promise<void> => {
  const db = await getDB();
  await db.runAsync('UPDATE gym_settings SET owner_pin = ? WHERE id = 1', pin);
  try {
    if (pin) {
      await SecureStore.setItemAsync('gymflow_owner_pin', pin);
    } else {
      await SecureStore.deleteItemAsync('gymflow_owner_pin');
    }
  } catch (e) {
    // SecureStore fallback to SQLite
  }
};

export const verifyOwnerPin = async (inputPin: string): Promise<boolean> => {
  try {
    const securePin = await SecureStore.getItemAsync('gymflow_owner_pin');
    if (securePin) return securePin === inputPin;
  } catch (e) {
    // Fallback to SQLite
  }
  const settings = await getGymSettings();
  if (!settings.owner_pin) return true; // No PIN set
  return settings.owner_pin === inputPin;
};

export const getSubscriptionInfo = async (): Promise<SubscriptionInfo> => {
  const settings = await getGymSettings();
  const now = Date.now();
  const createdTime = new Date(settings.created_at || new Date().toISOString()).getTime();
  const trialEnd = new Date(createdTime + 14 * 86400000); // 14-day free trial

  const status = settings.subscription_status || 'trial';
  const plan = (settings.subscription_plan as 'monthly' | 'yearly' | 'trial') || 'monthly';
  const price = settings.subscription_price !== undefined ? settings.subscription_price : 299;
  const currency = settings.subscription_currency || '₹';
  const expiresAt = settings.subscription_expires_at || trialEnd.toISOString();
  const licenseKey = settings.license_key || null;

  if (status === 'active') {
    const expiryTime = new Date(expiresAt).getTime();
    const diffTime = expiryTime - now;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isSubscribed = daysLeft > 0;

    return {
      status: isSubscribed ? 'active' : 'expired',
      plan,
      price,
      currency,
      trialEndsAt: trialEnd.toISOString(),
      expiresAt,
      licenseKey,
      daysLeft: Math.max(daysLeft, 0),
      isSubscribed,
    };
  }

  // Trial mode
  const diffTime = trialEnd.getTime() - now;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isTrialValid = daysLeft > 0;

  return {
    status: isTrialValid ? 'trial' : 'expired',
    plan: 'trial',
    price,
    currency,
    trialEndsAt: trialEnd.toISOString(),
    expiresAt: trialEnd.toISOString(),
    licenseKey,
    daysLeft: Math.max(daysLeft, 0),
    isSubscribed: isTrialValid,
  };
};

export const activateSubscription = async (
  months: number = 1,
  plan: 'monthly' | 'yearly' = 'monthly',
  price: number = 299,
  currency: string = '₹',
  licenseKey?: string
): Promise<SubscriptionInfo> => {
  const db = await getDB();
  const currentSub = await getSubscriptionInfo();

  const currentExpiry = currentSub.isSubscribed && currentSub.status === 'active'
    ? new Date(currentSub.expiresAt).getTime()
    : Date.now();

  const durationMs = months * 30 * 86400000;
  const newExpiryISO = new Date(currentExpiry + durationMs).toISOString();
  const key = licenseKey || `GF-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  await db.runAsync(
    `UPDATE gym_settings 
     SET subscription_status = 'active',
         subscription_plan = ?,
         subscription_price = ?,
         subscription_currency = ?,
         subscription_expires_at = ?,
         license_key = ?
     WHERE id = 1`,
    plan,
    price,
    currency,
    newExpiryISO,
    key
  );

  return await getSubscriptionInfo();
};

export const verifyAndApplyLicenseKey = async (key: string): Promise<{ success: boolean; message: string }> => {
  const cleanKey = key.trim().toUpperCase();
  if (cleanKey.length < 6) {
    return { success: false, message: 'Invalid activation key. Please enter a valid license code.' };
  }

  const isAnnual = cleanKey.includes('YEAR') || cleanKey.includes('VIP') || cleanKey.includes('ANNUAL');
  const months = isAnnual ? 12 : 1;
  const plan = isAnnual ? 'yearly' : 'monthly';

  await activateSubscription(months, plan, isAnnual ? 2499 : 299, '₹', cleanKey);
  return {
    success: true,
    message: `GymFlow Pro successfully activated for ${months} month(s)!`,
  };
};

export const cancelSubscription = async (): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    `UPDATE gym_settings 
     SET subscription_status = 'expired'
     WHERE id = 1`
  );
};

/* ==================== PLANS ==================== */

export const getAllPlans = async (): Promise<Plan[]> => {
  const db = await getDB();
  return await db.getAllAsync<Plan>('SELECT * FROM plans ORDER BY price ASC');
};

export const addPlan = async (name: string, price: number, durationDays: number): Promise<number> => {
  const db = await getDB();
  const res = await db.runAsync(
    'INSERT INTO plans (name, price, duration_days) VALUES (?, ?, ?)',
    name,
    price,
    durationDays
  );
  return res.lastInsertRowId;
};

export const updatePlan = async (id: number, name: string, price: number, durationDays: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    'UPDATE plans SET name = ?, price = ?, duration_days = ? WHERE id = ?',
    name,
    price,
    durationDays,
    id
  );
};

export const deletePlan = async (id: number): Promise<{ success: boolean; error?: string }> => {
  const db = await getDB();
  const membersUsingPlan = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM members WHERE plan_id = ?',
    id
  );
  if (membersUsingPlan && membersUsingPlan.count > 0) {
    return {
      success: false,
      error: `Cannot delete plan: ${membersUsingPlan.count} member(s) are currently assigned to this plan.`,
    };
  }
  await db.runAsync('DELETE FROM plans WHERE id = ?', id);
  return { success: true };
};

/* ==================== MEMBERS ==================== */

export const getAllMembers = async (searchQuery: string = '', statusFilter: string = 'all'): Promise<Member[]> => {
  const db = await getDB();
  let sql = `
    SELECT 
      m.*,
      p.name as plan_name,
      p.price as plan_price,
      p.duration_days as plan_duration
    FROM members m
    LEFT JOIN plans p ON m.plan_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (searchQuery.trim()) {
    sql += ` AND (m.name LIKE ? OR m.phone LIKE ? OR m.pin_code LIKE ?)`;
    const search = `%${searchQuery.trim()}%`;
    params.push(search, search, search);
  }

  if (statusFilter === 'active') {
    sql += ` AND m.active = 1`;
  } else if (statusFilter === 'inactive') {
    sql += ` AND m.active = 0`;
  } else if (statusFilter === 'due') {
    sql += ` AND m.fee_status = 'due'`;
  } else if (statusFilter === 'overdue') {
    sql += ` AND m.fee_status = 'overdue'`;
  }

  sql += ` ORDER BY m.active DESC, m.created_at DESC`;

  const rows = await db.getAllAsync<any>(sql, ...params);
  return rows.map(calculateMemberExpiry);
};

export const getMemberById = async (id: number): Promise<Member | null> => {
  const db = await getDB();
  const row = await db.getFirstAsync<any>(
    `SELECT 
      m.*,
      p.name as plan_name,
      p.price as plan_price,
      p.duration_days as plan_duration
    FROM members m
    LEFT JOIN plans p ON m.plan_id = p.id
    WHERE m.id = ?`,
    id
  );
  return row ? calculateMemberExpiry(row) : null;
};

export const getMemberByPin = async (pin: string): Promise<Member | null> => {
  const db = await getDB();
  const row = await db.getFirstAsync<any>(
    `SELECT 
      m.*,
      p.name as plan_name,
      p.price as plan_price,
      p.duration_days as plan_duration
    FROM members m
    LEFT JOIN plans p ON m.plan_id = p.id
    WHERE m.pin_code = ?`,
    pin.trim()
  );
  return row ? calculateMemberExpiry(row) : null;
};

export const getMemberByQR = async (qrPayload: string): Promise<Member | null> => {
  const db = await getDB();
  const row = await db.getFirstAsync<any>(
    `SELECT 
      m.*,
      p.name as plan_name,
      p.price as plan_price,
      p.duration_days as plan_duration
    FROM members m
    LEFT JOIN plans p ON m.plan_id = p.id
    WHERE m.qr_payload = ? OR m.pin_code = ?`,
    qrPayload.trim(),
    qrPayload.trim()
  );
  return row ? calculateMemberExpiry(row) : null;
};

export const generateUniquePin = async (): Promise<string> => {
  const db = await getDB();
  for (let i = 0; i < 20; i++) {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM members WHERE pin_code = ?', pin);
    if (!existing) return pin;
  }
  return Math.floor(10000 + Math.random() * 90000).toString();
};

export const addMember = async (member: {
  name: string;
  phone: string;
  photo_uri: string | null;
  plan_id: number;
  join_date: string;
  fee_status: 'paid' | 'due' | 'overdue';
  pin_code: string;
  qr_payload?: string;
  active?: number;
}): Promise<number> => {
  const db = await getDB();

  // Guard against foreign key violation if plan does not exist
  let validPlanId = member.plan_id;
  const existingPlan = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM plans WHERE id = ?',
    validPlanId
  );
  if (!existingPlan) {
    const anyPlan = await db.getFirstAsync<{ id: number }>('SELECT id FROM plans ORDER BY id ASC LIMIT 1');
    if (anyPlan) {
      validPlanId = anyPlan.id;
    } else {
      const resPlan = await db.runAsync(
        'INSERT INTO plans (name, price, duration_days) VALUES (?, ?, ?)',
        'Monthly Standard',
        1000,
        30
      );
      validPlanId = resPlan.lastInsertRowId;
    }
  }

  const qrPayload = member.qr_payload || `GYMFLOW:MEMBER:${member.pin_code}:${Date.now()}`;
  const res = await db.runAsync(
    `INSERT INTO members (name, phone, photo_uri, plan_id, join_date, fee_status, pin_code, qr_payload, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    member.name.trim(),
    member.phone.trim(),
    member.photo_uri,
    validPlanId,
    member.join_date,
    member.fee_status,
    member.pin_code.trim(),
    qrPayload,
    member.active !== undefined ? member.active : 1
  );
  return res.lastInsertRowId;
};

export const updateMember = async (
  id: number,
  member: Partial<{
    name: string;
    phone: string;
    photo_uri: string | null;
    plan_id: number;
    join_date: string;
    fee_status: 'paid' | 'due' | 'overdue';
    pin_code: string;
    qr_payload: string;
    active: number;
  }>
): Promise<void> => {
  const db = await getDB();

  if (member.plan_id) {
    const existingPlan = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM plans WHERE id = ?',
      member.plan_id
    );
    if (!existingPlan) {
      const anyPlan = await db.getFirstAsync<{ id: number }>('SELECT id FROM plans ORDER BY id ASC LIMIT 1');
      if (anyPlan) {
        member.plan_id = anyPlan.id;
      }
    }
  }

  const keys = Object.keys(member).filter((k) => k !== 'id');
  if (keys.length === 0) return;

  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (member as any)[k]);

  await db.runAsync(`UPDATE members SET ${setClause} WHERE id = ?`, ...values, id);
};

export const deleteMember = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync('DELETE FROM members WHERE id = ?', id);
};

export const toggleMemberActive = async (id: number, currentActive: number): Promise<number> => {
  const db = await getDB();
  const newActive = currentActive === 1 ? 0 : 1;
  await db.runAsync('UPDATE members SET active = ? WHERE id = ?', newActive, id);
  return newActive;
};

/* ==================== DATE & TIME HELPERS ==================== */

export const getLocalDayBounds = (
  targetDate: Date = new Date()
): { startISO: string; endISO: string; localDateStr: string } => {
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const localDateStr = `${year}-${month}-${day}`;

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    localDateStr,
  };
};

export const formatAttendanceTime = (isoString?: string | null): string => {
  if (!isoString) return '';
  let normalized = isoString;
  if (!normalized.includes('T') && normalized.includes(' ')) {
    normalized = normalized.replace(' ', 'T') + 'Z';
  }
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatAttendanceDateTime = (isoString?: string | null): string => {
  if (!isoString) return '';
  let normalized = isoString;
  if (!normalized.includes('T') && normalized.includes(' ')) {
    normalized = normalized.replace(' ', 'T') + 'Z';
  }
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/* ==================== ATTENDANCE ==================== */

export const recordCheckIn = async (
  memberId: number,
  method: 'pin' | 'qr'
): Promise<{ success: boolean; attendanceId: number; message: string }> => {
  const db = await getDB();
  const member = await getMemberById(memberId);
  if (!member) {
    return { success: false, attendanceId: 0, message: 'Member not found.' };
  }

  if (member.active === 0) {
    return { success: false, attendanceId: 0, message: 'This member is currently inactive.' };
  }

  const fiveMinutesAgoISO = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  // Check if member already checked in in last 5 minutes to avoid double-tapping
  const recent = await db.getFirstAsync<{ id: number; checked_in_at: string }>(
    `SELECT id, checked_in_at FROM attendance 
     WHERE member_id = ? 
     AND (datetime(checked_in_at) >= datetime(?) OR checked_in_at >= ?)
     ORDER BY id DESC LIMIT 1`,
    memberId,
    fiveMinutesAgoISO,
    fiveMinutesAgoISO
  );

  if (recent) {
    return {
      success: true,
      attendanceId: recent.id,
      message: `${member.name} was already checked in just now!`,
    };
  }

  const nowISO = new Date().toISOString();
  const res = await db.runAsync(
    'INSERT INTO attendance (member_id, method, checked_in_at) VALUES (?, ?, ?)',
    memberId,
    method,
    nowISO
  );

  return {
    success: true,
    attendanceId: res.lastInsertRowId,
    message: `Welcome, ${member.name}! Check-in successful.`,
  };
};

export const getTodayAttendance = async (): Promise<Attendance[]> => {
  const db = await getDB();
  const { startISO, endISO } = getLocalDayBounds();

  const rows = await db.getAllAsync<any>(
    `SELECT 
      a.id,
      a.member_id,
      a.checked_in_at,
      a.method,
      m.name as member_name,
      m.phone as member_phone,
      m.photo_uri as member_photo,
      p.name as plan_name
    FROM attendance a
    JOIN members m ON a.member_id = m.id
    LEFT JOIN plans p ON m.plan_id = p.id
    WHERE (datetime(a.checked_in_at) >= datetime(?) AND datetime(a.checked_in_at) <= datetime(?))
       OR (a.checked_in_at >= ? AND a.checked_in_at <= ?)
    ORDER BY a.id DESC`,
    startISO,
    endISO,
    startISO,
    endISO
  );
  return rows;
};

export const getMemberAttendanceHistory = async (memberId: number, limit: number = 50): Promise<Attendance[]> => {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(
    `SELECT 
      a.id,
      a.member_id,
      a.checked_in_at,
      a.method
    FROM attendance a
    WHERE a.member_id = ?
    ORDER BY a.id DESC
    LIMIT ?`,
    memberId,
    limit
  );
  return rows;
};

/* ==================== DASHBOARD & STATS ==================== */

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const db = await getDB();
  const { startISO, endISO } = getLocalDayBounds();

  // Today check ins strictly for today's calendar bounds
  const todayRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT member_id) as count FROM attendance 
     WHERE (datetime(checked_in_at) >= datetime(?) AND datetime(checked_in_at) <= datetime(?))
        OR (checked_in_at >= ? AND checked_in_at <= ?)`,
    startISO,
    endISO,
    startISO,
    endISO
  );

  // Active members
  const activeRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM members WHERE active = 1`
  );

  // Expiring soon (within next 7 days)
  const allMembers = await getAllMembers('', 'active');
  const expiringSoonCount = allMembers.filter((m) => m.days_left !== undefined && m.days_left >= 0 && m.days_left <= 7).length;

  // Fee status
  const dueRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM members WHERE fee_status = 'due' AND active = 1`
  );
  const overdueRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM members WHERE fee_status = 'overdue' AND active = 1`
  );

  // Estimated revenue this month (sum of active member plan prices)
  const revRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(p.price), 0) as total 
     FROM members m 
     JOIN plans p ON m.plan_id = p.id 
     WHERE m.active = 1 AND m.fee_status = 'paid'`
  );

  return {
    todayCheckIns: todayRow?.count || 0,
    activeMembers: activeRow?.count || 0,
    expiringSoon: expiringSoonCount,
    revenueThisMonth: revRow?.total || 0,
    dueFeesCount: dueRow?.count || 0,
    overdueFeesCount: overdueRow?.count || 0,
  };
};

export const getAttendanceAnalytics = async (): Promise<{
  weekly: { day: string; date: string; count: number }[];
  hourly: { hour: number; count: number }[];
  planBreakdown: { planName: string; count: number; percentage: number }[];
}> => {
  const db = await getDB();

  // Past 7 days attendance with exact local day bounds
  const weekly: { day: string; date: string; count: number }[] = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - i);
    const { startISO, endISO } = getLocalDayBounds(dateObj);

    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM attendance 
       WHERE (datetime(checked_in_at) >= datetime(?) AND datetime(checked_in_at) <= datetime(?))
          OR (checked_in_at >= ? AND checked_in_at <= ?)`,
      startISO,
      endISO,
      startISO,
      endISO
    );

    weekly.push({
      day: daysOfWeek[dateObj.getDay()],
      date: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: row?.count || 0,
    });
  }

  // Peak hourly distribution (past 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const hourlyRows = await db.getAllAsync<{ hour: number; count: number }>(
    `SELECT CAST(strftime('%H', checked_in_at) AS INTEGER) as hour, COUNT(*) as count
     FROM attendance
     WHERE datetime(checked_in_at) >= datetime(?)
     GROUP BY hour
     ORDER BY hour ASC`,
    thirtyDaysAgoISO
  );

  // Plan popularity
  const planRows = await db.getAllAsync<{ plan_name: string; count: number }>(
    `SELECT COALESCE(p.name, 'Unassigned') as plan_name, COUNT(m.id) as count
     FROM members m
     LEFT JOIN plans p ON m.plan_id = p.id
     WHERE m.active = 1
     GROUP BY p.id
     ORDER BY count DESC`
  );

  const totalMembers = planRows.reduce((sum, r) => sum + r.count, 0) || 1;
  const planBreakdown = planRows.map((r) => ({
    planName: r.plan_name,
    count: r.count,
    percentage: Math.round((r.count / totalMembers) * 100),
  }));

  return {
    weekly,
    hourly: hourlyRows,
    planBreakdown,
  };
};

/* ==================== BACKUP & RESTORE ==================== */

export const exportMembersCSV = async (): Promise<string> => {
  const members = await getAllMembers();
  const headers = ['ID', 'Name', 'Phone', 'Plan', 'Price', 'Join Date', 'Fee Status', 'PIN Code', 'Status', 'Days Remaining'];
  const rows = members.map((m) => [
    m.id,
    `"${(m.name || '').replace(/"/g, '""')}"`,
    `"${(m.phone || '').replace(/"/g, '""')}"`,
    `"${(m.plan_name || 'No Plan').replace(/"/g, '""')}"`,
    m.plan_price ?? 0,
    m.join_date,
    m.fee_status,
    m.pin_code,
    m.active === 1 ? 'Active' : 'Inactive',
    m.days_left !== undefined ? (m.is_expired ? 'Expired' : m.days_left) : '',
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};

export const exportAllDataJSON = async (): Promise<string> => {
  const db = await getDB();
  const settings = await getGymSettings();
  const plans = await getAllPlans();
  const members = await db.getAllAsync('SELECT * FROM members');
  const attendance = await db.getAllAsync('SELECT * FROM attendance');

  const exportPayload = {
    gymflow_version: '1.0.0',
    exported_at: new Date().toISOString(),
    settings,
    plans,
    members,
    attendance,
  };

  return JSON.stringify(exportPayload, null, 2);
};

export const importDataJSON = async (jsonString: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.plans || !data.members) {
      return { success: false, error: 'Invalid backup format. Missing core tables.' };
    }

    const db = await getDB();

    // Clear existing data
    await db.execAsync(`
      DELETE FROM attendance;
      DELETE FROM members;
      DELETE FROM plans;
    `);

    // Restore Settings
    if (data.settings) {
      await updateGymSettings({
        gym_name: data.settings.gym_name || 'My Gym',
        logo_uri: data.settings.logo_uri || null,
        theme_color: data.settings.theme_color || '#4B4FE0',
        working_hours_start: data.settings.working_hours_start || '06:00',
        working_hours_end: data.settings.working_hours_end || '22:00',
        onboarding_completed: 1,
      });
    }

    // Restore Plans
    for (const plan of data.plans) {
      await db.runAsync(
        'INSERT INTO plans (id, name, price, duration_days, created_at) VALUES (?, ?, ?, ?, ?)',
        plan.id,
        plan.name,
        plan.price,
        plan.duration_days,
        plan.created_at || new Date().toISOString()
      );
    }

    // Restore Members
    for (const m of data.members) {
      await db.runAsync(
        `INSERT INTO members (id, name, phone, photo_uri, plan_id, join_date, fee_status, pin_code, qr_payload, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        m.id,
        m.name,
        m.phone,
        m.photo_uri || null,
        m.plan_id,
        m.join_date,
        m.fee_status || 'paid',
        m.pin_code,
        m.qr_payload || `GYMFLOW:MEMBER:${m.pin_code}`,
        m.active !== undefined ? m.active : 1,
        m.created_at || new Date().toISOString()
      );
    }

    // Restore Attendance
    if (data.attendance && Array.isArray(data.attendance)) {
      for (const a of data.attendance) {
        await db.runAsync(
          'INSERT INTO attendance (id, member_id, checked_in_at, method) VALUES (?, ?, ?, ?)',
          a.id,
          a.member_id,
          a.checked_in_at,
          a.method || 'pin'
        );
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to import backup.' };
  }
};

export const seedDemoDataIfEmpty = async (): Promise<void> => {
  const db = await getDB();
  const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM members');
  if (count && count.count > 0) return;

  const plans = await getAllPlans();
  if (plans.length === 0) return;

  const standardPlan = plans[0].id;
  const proPlan = plans[1] ? plans[1].id : standardPlan;
  const vipPlan = plans[2] ? plans[2].id : standardPlan;

  const demoMembers = [
    {
      name: 'Alex Mercer',
      phone: '+1 (555) 234-5678',
      photo_uri: null,
      plan_id: vipPlan,
      join_date: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0],
      fee_status: 'paid' as const,
      pin_code: '1042',
      qr_payload: 'GYMFLOW:MEMBER:1042:DEMO1',
      active: 1,
    },
    {
      name: 'Sarah Connor',
      phone: '+1 (555) 876-5432',
      photo_uri: null,
      plan_id: proPlan,
      join_date: new Date(Date.now() - 85 * 86400000).toISOString().split('T')[0],
      fee_status: 'paid' as const,
      pin_code: '2398',
      qr_payload: 'GYMFLOW:MEMBER:2398:DEMO2',
      active: 1,
    },
    {
      name: 'Marcus Vance',
      phone: '+1 (555) 345-6789',
      photo_uri: null,
      plan_id: standardPlan,
      join_date: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0],
      fee_status: 'due' as const,
      pin_code: '7721',
      qr_payload: 'GYMFLOW:MEMBER:7721:DEMO3',
      active: 1,
    },
    {
      name: 'Elena Rostova',
      phone: '+1 (555) 901-2345',
      photo_uri: null,
      plan_id: standardPlan,
      join_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      fee_status: 'paid' as const,
      pin_code: '4512',
      qr_payload: 'GYMFLOW:MEMBER:4512:DEMO4',
      active: 1,
    },
    {
      name: 'David Kim',
      phone: '+1 (555) 654-3210',
      photo_uri: null,
      plan_id: proPlan,
      join_date: new Date(Date.now() - 110 * 86400000).toISOString().split('T')[0],
      fee_status: 'overdue' as const,
      pin_code: '9083',
      qr_payload: 'GYMFLOW:MEMBER:9083:DEMO5',
      active: 1,
    },
  ];

  for (const m of demoMembers) {
    const memberId = await addMember(m);
    // Add sample attendance for today (2 hours ago)
    const sampleTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    await db.runAsync(
      `INSERT INTO attendance (member_id, checked_in_at, method) 
       VALUES (?, ?, 'pin')`,
      memberId,
      sampleTime
    );
  }
};

/* ==================== HELPER ==================== */

const calculateMemberExpiry = (memberRow: any): Member => {
  const duration = memberRow.plan_duration || 30;
  const joinDate = new Date(memberRow.join_date);
  const expiryDate = new Date(joinDate.getTime() + duration * 86400000);
  const now = new Date();

  const diffTime = expiryDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    ...memberRow,
    days_left: daysLeft,
    is_expired: daysLeft < 0,
  };
};
