import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { User } from '@supabase/supabase-js';
import {
  GymSettings,
  Member,
  Plan,
  Attendance,
  DashboardStats,
  ThemeColors,
  SubscriptionInfo,
} from '../types';
import {
  initDatabase,
  getGymSettings,
  updateGymSettings,
  getAllMembers,
  getAllPlans,
  getTodayAttendance,
  getDashboardStats,
  getSubscriptionInfo,
  activateSubscription,
  verifyAndApplyLicenseKey,
  setOwnerPin as dbSetOwnerPin,
  verifyOwnerPin as dbVerifyOwnerPin,
} from '../database/db';
import { getTheme, defaultTheme } from '../theme';
import { SubscriptionPaywallModal } from '../components/SubscriptionPaywallModal';
import { AuthModal } from '../components/AuthModal';
import { getActiveUser, getSupabaseClient } from '../services/supabase';
import { backupToSupabase, restoreFromSupabase, getLastSyncTime, SyncResult } from '../services/syncService';

import {
  getTranslation,
  formatCurrency as i18nFormatCurrency,
  formatDate as i18nFormatDate,
  LanguageCode,
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_COUNTRIES,
} from '../i18n';

const getFormattedDate = (lang: LanguageCode = 'en') =>
  new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : lang, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const defaultSubscription: SubscriptionInfo = {
  status: 'trial',
  plan: 'trial',
  price: 299,
  currency: 'INR',
  trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
  expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
  licenseKey: null,
  daysLeft: 14,
  isSubscribed: true,
};

interface AppContextType {
  isReady: boolean;
  settings: GymSettings;
  theme: ThemeColors;
  stats: DashboardStats;
  members: Member[];
  plans: Plan[];
  todayAttendance: Attendance[];
  currentDateStr: string;
  subscription: SubscriptionInfo;
  paywallVisible: boolean;
  isLocked: boolean;
  hasOwnerPin: boolean;
  language: LanguageCode;
  currency: string;
  country: string;
  user: User | null;
  isCloudAuthenticated: boolean;
  authModalVisible: boolean;
  lastSyncedAt: string | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatPrice: (amount: number) => string;
  formatDateStr: (date: string | number | Date) => string;
  showPaywall: () => void;
  hidePaywall: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  checkAuthSession: () => Promise<void>;
  syncWithCloud: () => Promise<SyncResult>;
  subscribeToPlan: (months?: number, plan?: 'monthly' | 'yearly') => Promise<void>;
  applyLicenseKey: (key: string) => Promise<{ success: boolean; message: string }>;
  refreshAll: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  refreshAttendance: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  updateSettings: (newSettings: Partial<GymSettings>) => Promise<void>;
  setOwnerPin: (pin: string | null) => Promise<void>;
  unlockApp: (pin: string) => Promise<boolean>;
  lockApp: () => void;
  completeOnboarding: (setupData: {
    gymName: string;
    themeColor: string;
    startHour: string;
    endHour: string;
    ownerPin?: string;
    language?: LanguageCode;
    currency?: string;
    country?: string;
  }) => Promise<void>;
}

const defaultStats: DashboardStats = {
  todayCheckIns: 0,
  activeMembers: 0,
  expiringSoon: 0,
  revenueThisMonth: 0,
  dueFeesCount: 0,
  overdueFeesCount: 0,
};

const defaultSettings: GymSettings = {
  id: 1,
  gym_name: 'PowerForge Gym',
  logo_uri: null,
  theme_color: '#4F46E5',
  working_hours_start: '06:00',
  working_hours_end: '22:00',
  owner_pin: null,
  onboarding_completed: 0,
  language: 'en',
  currency: 'INR',
  country: 'IN',
  subscription_status: 'trial',
  subscription_price: 299,
  subscription_currency: 'INR',
  created_at: new Date().toISOString(),
};

const AppContext = createContext<AppContextType>({
  isReady: false,
  settings: defaultSettings,
  theme: defaultTheme,
  stats: defaultStats,
  members: [],
  plans: [],
  todayAttendance: [],
  currentDateStr: getFormattedDate('en'),
  subscription: defaultSubscription,
  paywallVisible: false,
  isLocked: false,
  hasOwnerPin: false,
  language: 'en',
  currency: 'INR',
  country: 'IN',
  user: null,
  isCloudAuthenticated: false,
  authModalVisible: false,
  lastSyncedAt: null,
  t: (key: string) => key,
  formatPrice: (amount: number) => `₹${amount}`,
  formatDateStr: (date) => String(date),
  showPaywall: () => {},
  hidePaywall: () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
  checkAuthSession: async () => {},
  syncWithCloud: async () => ({ success: false, message: '' }),
  subscribeToPlan: async () => {},
  applyLicenseKey: async () => ({ success: false, message: '' }),
  refreshAll: async () => {},
  refreshStats: async () => {},
  refreshMembers: async () => {},
  refreshPlans: async () => {},
  refreshAttendance: async () => {},
  refreshSubscription: async () => {},
  updateSettings: async () => {},
  setOwnerPin: async () => {},
  unlockApp: async () => true,
  lockApp: () => {},
  completeOnboarding: async () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [settings, setSettings] = useState<GymSettings>(defaultSettings);
  const [theme, setTheme] = useState<ThemeColors>(defaultTheme);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [currentDateStr, setCurrentDateStr] = useState<string>(getFormattedDate());
  const [subscription, setSubscription] = useState<SubscriptionInfo>(defaultSubscription);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const lastDayRef = useRef<string>(new Date().toDateString());

  const activeLang: LanguageCode = (settings.language as LanguageCode) || 'en';
  const activeCurrency = settings.currency || 'INR';
  const activeCountry = settings.country || 'IN';

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return getTranslation(key, activeLang, params);
    },
    [activeLang]
  );

  const formatPrice = useCallback(
    (amount: number) => {
      return i18nFormatCurrency(amount, activeCurrency);
    },
    [activeCurrency]
  );

  const formatDateStr = useCallback(
    (date: string | number | Date) => {
      return i18nFormatDate(date, activeLang);
    },
    [activeLang]
  );

  const checkAuthSession = useCallback(async () => {
    try {
      const activeUser = await getActiveUser();
      setUser(activeUser);
      const syncTime = await getLastSyncTime();
      setLastSyncedAt(syncTime);
    } catch (err) {
      console.warn('Could not check Supabase auth session:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      await initDatabase();

      const currentSettings = await getGymSettings();
      setSettings(currentSettings);
      setTheme(getTheme(currentSettings.theme_color || '#4F46E5'));

      const [currentStats, currentMembers, currentPlans, currentAttendance, currentSub] = await Promise.all([
        getDashboardStats(),
        getAllMembers(),
        getAllPlans(),
        getTodayAttendance(),
        getSubscriptionInfo(),
      ]);

      setStats(currentStats);
      setMembers(currentMembers);
      setPlans(currentPlans);
      setTodayAttendance(currentAttendance);
      setSubscription(currentSub);
      setCurrentDateStr(getFormattedDate((currentSettings.language as LanguageCode) || 'en'));
      lastDayRef.current = new Date().toDateString();

      await checkAuthSession();

      if (currentSettings.owner_pin && currentSettings.onboarding_completed === 1) {
        setIsLocked(false);
      }
    } catch (err) {
      console.error('Error initializing GymFlow DB:', err);
    } finally {
      setIsReady(true);
    }
  }, [checkAuthSession]);

  useEffect(() => {
    loadData();

    // 1. Refresh data when app returns from background to foreground
    const appStateSub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const todayStr = new Date().toDateString();
        if (todayStr !== lastDayRef.current) {
          lastDayRef.current = todayStr;
          setCurrentDateStr(getFormattedDate(activeLang));
        }
        loadData();
      }
    });

    // 2. Automatic midnight reset interval: checks every 15 seconds if day changed
    const interval = setInterval(() => {
      const todayStr = new Date().toDateString();
      if (todayStr !== lastDayRef.current) {
        lastDayRef.current = todayStr;
        setCurrentDateStr(getFormattedDate(activeLang));
        loadData();
      }
    }, 15000);

    return () => {
      appStateSub.remove();
      clearInterval(interval);
    };
  }, [loadData, activeLang]);

  const refreshStats = useCallback(async () => {
    const s = await getDashboardStats();
    setStats(s);
  }, []);

  const refreshMembers = useCallback(async () => {
    const m = await getAllMembers();
    setMembers(m);
    await refreshStats();
  }, [refreshStats]);

  const refreshPlans = useCallback(async () => {
    const p = await getAllPlans();
    setPlans(p);
  }, []);

  const refreshAttendance = useCallback(async () => {
    const a = await getTodayAttendance();
    setTodayAttendance(a);
    await refreshStats();
  }, [refreshStats]);

  const refreshSubscription = useCallback(async () => {
    const sub = await getSubscriptionInfo();
    setSubscription(sub);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshStats(),
      refreshMembers(),
      refreshPlans(),
      refreshAttendance(),
      refreshSubscription(),
      checkAuthSession(),
    ]);
  }, [refreshStats, refreshMembers, refreshPlans, refreshAttendance, refreshSubscription, checkAuthSession]);

  const syncWithCloud = useCallback(async (): Promise<SyncResult> => {
    const res = await backupToSupabase();
    if (res.success && res.syncedAt) {
      setLastSyncedAt(res.syncedAt);
    }
    return res;
  }, []);

  const handleUpdateSettings = useCallback(
    async (newSettings: Partial<GymSettings>) => {
      await updateGymSettings(newSettings);
      const s = await getGymSettings();
      setSettings(s);
      if (newSettings.theme_color) {
        setTheme(getTheme(newSettings.theme_color));
      }
    },
    []
  );

  const handleSetOwnerPin = useCallback(async (pin: string | null) => {
    await dbSetOwnerPin(pin);
    const s = await getGymSettings();
    setSettings(s);
  }, []);

  const unlockApp = useCallback(async (pin: string): Promise<boolean> => {
    const valid = await dbVerifyOwnerPin(pin);
    if (valid) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const lockApp = useCallback(() => {
    if (settings.owner_pin) {
      setIsLocked(true);
    }
  }, [settings.owner_pin]);

  const completeOnboarding = useCallback(
    async (setupData: {
      gymName: string;
      themeColor: string;
      startHour: string;
      endHour: string;
      ownerPin?: string;
      language?: LanguageCode;
      currency?: string;
      country?: string;
    }) => {
      await updateGymSettings({
        gym_name: setupData.gymName,
        theme_color: setupData.themeColor,
        working_hours_start: setupData.startHour,
        working_hours_end: setupData.endHour,
        onboarding_completed: 1,
        language: setupData.language || 'en',
        currency: setupData.currency || 'INR',
        country: setupData.country || 'IN',
      });
      if (setupData.ownerPin) {
        await dbSetOwnerPin(setupData.ownerPin);
      }
      await loadData();
    },
    [loadData]
  );

  const showPaywall = useCallback(() => {
    setPaywallVisible(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setPaywallVisible(false);
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthModalVisible(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalVisible(false);
  }, []);

  const subscribeToPlan = useCallback(
    async (months: number = 1, plan: 'monthly' | 'yearly' = 'monthly') => {
      await activateSubscription(months, plan);
      await refreshSubscription();
      hidePaywall();
    },
    [refreshSubscription, hidePaywall]
  );

  const applyLicenseKey = useCallback(
    async (key: string) => {
      const res = await verifyAndApplyLicenseKey(key);
      if (res.success) {
        await refreshSubscription();
        hidePaywall();
      }
      return res;
    },
    [refreshSubscription, hidePaywall]
  );

  return (
    <AppContext.Provider
      value={{
        isReady,
        settings,
        theme,
        stats,
        members,
        plans,
        todayAttendance,
        currentDateStr,
        subscription,
        paywallVisible,
        isLocked,
        hasOwnerPin: Boolean(settings.owner_pin),
        language: activeLang,
        currency: activeCurrency,
        country: activeCountry,
        user,
        isCloudAuthenticated: Boolean(user),
        authModalVisible,
        lastSyncedAt,
        t,
        formatPrice,
        formatDateStr,
        showPaywall,
        hidePaywall,
        openAuthModal,
        closeAuthModal,
        checkAuthSession,
        syncWithCloud,
        subscribeToPlan,
        applyLicenseKey,
        refreshAll,
        refreshStats,
        refreshMembers,
        refreshPlans,
        refreshAttendance,
        refreshSubscription,
        updateSettings: handleUpdateSettings,
        setOwnerPin: handleSetOwnerPin,
        unlockApp,
        lockApp,
        completeOnboarding,
      }}
    >
      {children}
      <SubscriptionPaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
