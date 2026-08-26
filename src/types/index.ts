import { LanguageCode } from '../i18n/translations';

export interface GymSettings {
  id: number;
  gym_name: string;
  logo_uri: string | null;
  theme_color: string;
  working_hours_start: string;
  working_hours_end: string;
  owner_pin: string | null;
  onboarding_completed: number;
  app_locked?: boolean;
  language?: LanguageCode;
  currency?: string;
  country?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  has_seen_tutorial?: number;
  subscription_status?: 'trial' | 'active' | 'expired';
  subscription_plan?: 'monthly' | 'yearly' | 'trial';
  subscription_price?: number;
  subscription_currency?: string;
  subscription_expires_at?: string;
  license_key?: string | null;
  created_at: string;
}

export interface SubscriptionInfo {
  status: 'trial' | 'active' | 'expired';
  plan: 'monthly' | 'yearly' | 'trial';
  price: number;
  currency: string;
  trialEndsAt: string;
  expiresAt: string;
  licenseKey: string | null;
  daysLeft: number;
  isSubscribed: boolean;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  created_at: string;
}

export interface Member {
  id: number;
  name: string;
  phone: string;
  photo_uri: string | null;
  plan_id: number;
  plan_name?: string;
  plan_price?: number;
  plan_duration?: number;
  join_date: string;
  fee_status: 'paid' | 'due' | 'overdue';
  pin_code: string;
  qr_payload: string;
  active: number;
  created_at: string;
  days_left?: number;
  is_expired?: boolean;
}

export interface Attendance {
  id: number;
  member_id: number;
  member_name?: string;
  member_phone?: string;
  member_photo?: string | null;
  plan_name?: string;
  checked_in_at: string;
  method: 'pin' | 'qr';
}

export interface DashboardStats {
  todayCheckIns: number;
  activeMembers: number;
  expiringSoon: number;
  revenueThisMonth: number;
  dueFeesCount: number;
  overdueFeesCount: number;
}

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  text: string;
  textMuted: string;
  coral: string;
  yellow: string;
  mint: string;
  red: string;
  blue: string;
  cardShadow: string;
}
