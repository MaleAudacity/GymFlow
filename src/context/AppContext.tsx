import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
  seedDemoDataIfEmpty,
} from '../database/db';
import { getTheme, defaultTheme } from '../theme';
import { SubscriptionPaywallModal } from '../components/SubscriptionPaywallModal';

import {
  getTranslation,
  formatCurrency as i18nFormatCurrency,
  formatDate as i18nFormatDate,
  LanguageCode,
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_COUNTRIES,
  getCountryByCode,
  getCurrencyByCode,
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
  t: (key: string, params?: Record<string, string | number>) => string;
  formatPrice: (amount: number) => string;
  formatDateStr: (date: string | number | Date) => string;
  showPaywall: () => void;
  hidePaywall: () => void;
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
  t: (key: string) => key,
  formatPrice: (amount: number) => `₹${amount}`,
  formatDateStr: (date) => String(date),
  showPaywall: () => {},
  hidePaywall: () => {},
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
  const [isLocked, setIsLocked] = useState(false);
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

      if (currentSettings.owner_pin && currentSettings.onboarding_completed === 1) {
        setIsLocked(false);
      }
    } catch (err) {
      console.error('Error initializing GymFlow DB:', err);
    } finally {
      setIsReady(true);
    }
  }, []);

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

  const refreshAll = async () => {
    await loadData();
  };

  const refreshStats = async () => {
    const s = await getDashboardStats();
    setStats(s);
  };

  const refreshMembers = async () => {
    const m = await getAllMembers();
    setMembers(m);
    await refreshStats();
  };

  const refreshPlans = async () => {
    const p = await getAllPlans();
    setPlans(p);
  };

  const refreshAttendance = async () => {
    const a = await getTodayAttendance();
    setTodayAttendance(a);
    await refreshStats();
  };

  const refreshSubscription = async () => {
    const s = await getSubscriptionInfo();
    setSubscription(s);
  };

  const subscribeToPlan = async (months: number = 1, plan: 'monthly' | 'yearly' = 'monthly') => {
    const price = plan === 'yearly' ? (activeCurrency === 'INR' ? 2499 : 29) : (activeCurrency === 'INR' ? 299 : 3.99);
    const s = await activateSubscription(months, plan, price, activeCurrency);
    setSubscription(s);
    const updatedSettings = await getGymSettings();
    setSettings(updatedSettings);
  };

  const applyLicenseKey = async (key: string): Promise<{ success: boolean; message: string }> => {
    const res = await verifyAndApplyLicenseKey(key);
    if (res.success) {
      const s = await getSubscriptionInfo();
      setSubscription(s);
      const updatedSettings = await getGymSettings();
      setSettings(updatedSettings);
    }
    return res;
  };

  const showPaywall = () => setPaywallVisible(true);
  const hidePaywall = () => setPaywallVisible(false);

  const handleUpdateSettings = async (newSettings: Partial<GymSettings>) => {
    await updateGymSettings(newSettings);
    const updated = await getGymSettings();
    setSettings(updated);
    if (newSettings.theme_color) {
      setTheme(getTheme(newSettings.theme_color));
    }
    if (newSettings.language) {
      setCurrentDateStr(getFormattedDate(newSettings.language));
    }
    await refreshSubscription();
  };

  const handleSetOwnerPin = async (pin: string | null) => {
    await dbSetOwnerPin(pin);
    await handleUpdateSettings({ owner_pin: pin });
  };

  const unlockApp = async (pin: string): Promise<boolean> => {
    const isValid = await dbVerifyOwnerPin(pin);
    if (isValid) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (settings.owner_pin) {
      setIsLocked(true);
    }
  };

  const completeOnboarding = async (setupData: {
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
      owner_pin: setupData.ownerPin || null,
      language: setupData.language || 'en',
      currency: setupData.currency || 'INR',
      country: setupData.country || 'IN',
      onboarding_completed: 1,
    });

    if (setupData.ownerPin) {
      await dbSetOwnerPin(setupData.ownerPin);
    }

    const updated = await getGymSettings();
    setSettings(updated);
    setTheme(getTheme(updated.theme_color));
    setCurrentDateStr(getFormattedDate((updated.language as LanguageCode) || 'en'));
    await refreshSubscription();
  };

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
        t,
        formatPrice,
        formatDateStr,
        showPaywall,
        hidePaywall,
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
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
