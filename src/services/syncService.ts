import * as SecureStore from 'expo-secure-store';
import { getSupabaseClient, getActiveUser } from './supabase';
import {
  getDB,
  getGymSettings,
  updateGymSettings,
  getAllPlans,
  getAllMembers,
  getTodayAttendance,
} from '../database/db';
import { GymSettings, Plan, Member, Attendance } from '../types';

const STORAGE_KEY_LAST_SYNC = 'gymflow_last_sync_timestamp';

export interface SyncResult {
  success: boolean;
  message: string;
  hasCloudData?: boolean;
  syncedAt?: string;
  counts?: {
    plans: number;
    members: number;
    attendance: number;
  };
  error?: string;
}

/**
 * Get timestamp of the last successful cloud sync
 */
export const getLastSyncTime = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEY_LAST_SYNC);
  } catch {
    return null;
  }
};

/**
 * Check if the user has an existing gym profile or members in the cloud
 */
export const checkHasCloudData = async (): Promise<{
  hasData: boolean;
  gymName?: string;
  memberCount: number;
}> => {
  try {
    const user = await getActiveUser();
    if (!user) return { hasData: false, memberCount: 0 };

    const client = await getSupabaseClient();

    const { data: profile } = await client
      .from('gym_profiles')
      .select('gym_name')
      .eq('id', user.id)
      .maybeSingle();

    const { count } = await client
      .from('gym_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const hasData = Boolean(profile || (count && count > 0));
    return {
      hasData,
      gymName: profile?.gym_name || undefined,
      memberCount: count || 0,
    };
  } catch (err) {
    console.warn('checkHasCloudData error:', err);
    return { hasData: false, memberCount: 0 };
  }
};

/**
 * 1. BACKUP (Local SQLite -> Supabase Cloud)
 */
export const backupToSupabase = async (): Promise<SyncResult> => {
  try {
    const user = await getActiveUser();
    if (!user) {
      return {
        success: false,
        message: 'No active cloud account found.',
      };
    }

    const client = await getSupabaseClient();
    const db = await getDB();

    const settings = await getGymSettings();
    const plans = await getAllPlans();
    const members = await db.getAllAsync<any>('SELECT * FROM members');
    const attendance = await db.getAllAsync<any>('SELECT * FROM attendance');

    // 1. Sync Gym Profile
    await client.from('gym_profiles').upsert(
      {
        id: user.id,
        gym_name: settings.gym_name,
        logo_uri: settings.logo_uri,
        theme_color: settings.theme_color,
        working_hours_start: settings.working_hours_start,
        working_hours_end: settings.working_hours_end,
        language: settings.language,
        currency: settings.currency,
        country: settings.country,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 2. Sync Plans
    if (plans.length > 0) {
      const cloudPlans = plans.map((p) => ({
        id: p.id,
        user_id: user.id,
        name: p.name,
        price: p.price,
        duration_days: p.duration_days,
        updated_at: new Date().toISOString(),
      }));

      await client.from('gym_plans').upsert(cloudPlans, {
        onConflict: 'id,user_id',
      });
    }

    // 3. Sync Members
    if (members.length > 0) {
      const cloudMembers = members.map((m) => ({
        id: m.id,
        user_id: user.id,
        name: m.name,
        phone: m.phone,
        photo_uri: m.photo_uri,
        plan_id: m.plan_id,
        join_date: m.join_date,
        fee_status: m.fee_status,
        pin_code: m.pin_code,
        qr_payload: m.qr_payload,
        active: m.active !== undefined ? m.active : 1,
        updated_at: new Date().toISOString(),
      }));

      await client.from('gym_members').upsert(cloudMembers, {
        onConflict: 'id,user_id',
      });
    }

    // 4. Sync Attendance
    if (attendance.length > 0) {
      const cloudAttendance = attendance.map((a) => ({
        id: a.id,
        user_id: user.id,
        member_id: a.member_id,
        checked_in_at: a.checked_in_at,
        method: a.method,
        updated_at: new Date().toISOString(),
      }));

      await client.from('gym_attendance').upsert(cloudAttendance, {
        onConflict: 'id,user_id',
      });
    }

    const nowIso = new Date().toISOString();
    await SecureStore.setItemAsync(STORAGE_KEY_LAST_SYNC, nowIso);

    return {
      success: true,
      message: 'Cloud backup completed successfully!',
      syncedAt: nowIso,
      counts: {
        plans: plans.length,
        members: members.length,
        attendance: attendance.length,
      },
    };
  } catch (err: any) {
    console.error('Supabase backup failed:', err);
    return {
      success: false,
      message: err?.message || 'Failed to backup gym data.',
      error: err?.message,
    };
  }
};

/**
 * 2. RESTORE (Supabase Cloud -> Local SQLite)
 */
export const restoreFromSupabase = async (): Promise<SyncResult> => {
  try {
    const user = await getActiveUser();
    if (!user) {
      return {
        success: false,
        message: 'No authenticated user session found.',
      };
    }

    const client = await getSupabaseClient();
    const db = await getDB();

    // 1. Fetch Profile
    const { data: profile } = await client
      .from('gym_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      await updateGymSettings({
        gym_name: profile.gym_name || 'My Gym',
        logo_uri: profile.logo_uri || null,
        theme_color: profile.theme_color || '#4F46E5',
        working_hours_start: profile.working_hours_start || '06:00',
        working_hours_end: profile.working_hours_end || '22:00',
        language: profile.language || 'en',
        currency: profile.currency || 'INR',
        country: profile.country || 'IN',
        onboarding_completed: 1,
      });
    }

    // 2. Fetch Plans
    const { data: cloudPlans } = await client
      .from('gym_plans')
      .select('*')
      .eq('user_id', user.id);

    if (cloudPlans && cloudPlans.length > 0) {
      for (const p of cloudPlans) {
        await db.runAsync(
          `INSERT OR REPLACE INTO plans (id, name, price, duration_days, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          p.id,
          p.name,
          p.price,
          p.duration_days,
          p.updated_at || new Date().toISOString()
        );
      }
    }

    // 3. Fetch Members
    const { data: cloudMembers } = await client
      .from('gym_members')
      .select('*')
      .eq('user_id', user.id);

    if (cloudMembers && cloudMembers.length > 0) {
      for (const m of cloudMembers) {
        await db.runAsync(
          `INSERT OR REPLACE INTO members (id, name, phone, photo_uri, plan_id, join_date, fee_status, pin_code, qr_payload, active, created_at)
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
          m.updated_at || new Date().toISOString()
        );
      }
    }

    // 4. Fetch Attendance
    const { data: cloudAttendance } = await client
      .from('gym_attendance')
      .select('*')
      .eq('user_id', user.id);

    if (cloudAttendance && cloudAttendance.length > 0) {
      for (const a of cloudAttendance) {
        await db.runAsync(
          `INSERT OR REPLACE INTO attendance (id, member_id, checked_in_at, method)
           VALUES (?, ?, ?, ?)`,
          a.id,
          a.member_id,
          a.checked_in_at,
          a.method || 'pin'
        );
      }
    }

    const hasCloudData = Boolean(
      profile ||
        (cloudMembers && cloudMembers.length > 0) ||
        (cloudPlans && cloudPlans.length > 0)
    );

    const nowIso = new Date().toISOString();
    await SecureStore.setItemAsync(STORAGE_KEY_LAST_SYNC, nowIso);

    return {
      success: true,
      hasCloudData,
      message: 'Cloud data restored successfully to this device!',
      syncedAt: nowIso,
      counts: {
        plans: cloudPlans?.length || 0,
        members: cloudMembers?.length || 0,
        attendance: cloudAttendance?.length || 0,
      },
    };
  } catch (err: any) {
    console.error('Supabase restore failed:', err);
    return {
      success: false,
      message: err?.message || 'Failed to restore data from cloud.',
      error: err?.message,
    };
  }
};

/**
 * 3. REAL-TIME MEMBER SYNC
 */
export const syncMemberToCloud = async (memberId: number): Promise<void> => {
  try {
    const user = await getActiveUser();
    if (!user) return;

    const db = await getDB();
    const member = await db.getFirstAsync<any>('SELECT * FROM members WHERE id = ?', memberId);
    if (!member) return;

    const client = await getSupabaseClient();
    await client.from('gym_members').upsert(
      {
        id: member.id,
        user_id: user.id,
        name: member.name,
        phone: member.phone,
        photo_uri: member.photo_uri,
        plan_id: member.plan_id,
        join_date: member.join_date,
        fee_status: member.fee_status,
        pin_code: member.pin_code,
        qr_payload: member.qr_payload,
        active: member.active !== undefined ? member.active : 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id,user_id' }
    );
  } catch (err) {
    console.warn('Real-time syncMemberToCloud error:', err);
  }
};

/**
 * 4. REAL-TIME DELETE MEMBER FROM CLOUD
 */
export const deleteMemberFromCloud = async (memberId: number): Promise<void> => {
  try {
    const user = await getActiveUser();
    if (!user) return;

    const client = await getSupabaseClient();
    await client
      .from('gym_members')
      .delete()
      .eq('id', memberId)
      .eq('user_id', user.id);
  } catch (err) {
    console.warn('Real-time deleteMemberFromCloud error:', err);
  }
};

/**
 * 5. REAL-TIME ATTENDANCE SYNC
 */
export const syncAttendanceToCloud = async (attendanceId: number): Promise<void> => {
  try {
    const user = await getActiveUser();
    if (!user) return;

    const db = await getDB();
    const att = await db.getFirstAsync<any>('SELECT * FROM attendance WHERE id = ?', attendanceId);
    if (!att) return;

    const client = await getSupabaseClient();
    await client.from('gym_attendance').upsert(
      {
        id: att.id,
        user_id: user.id,
        member_id: att.member_id,
        checked_in_at: att.checked_in_at,
        method: att.method,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id,user_id' }
    );
  } catch (err) {
    console.warn('Real-time syncAttendanceToCloud error:', err);
  }
};
