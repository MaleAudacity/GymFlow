import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  Palette,
  Clock,
  Shield,
  Layers,
  Download,
  Upload,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  Crown,
  Zap,
  Languages,
  Coins,
  Globe,
  Star,
  FileText,
  ShieldCheck,
  ChevronRight,
  Info,
  Gamepad2,
  Cloud,
  CloudUpload,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { NeoInput } from '../components/NeoInput';
import { NeoBadge } from '../components/NeoBadge';
import { PinKeypad } from '../components/PinKeypad';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';
import { CurrencySelectorModal } from '../components/CurrencySelectorModal';
import { CountrySelectorModal } from '../components/CountrySelectorModal';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';
import { RateAppModal } from '../components/RateAppModal';
import { GymFlowTutorialModal } from '../components/GymFlowTutorialModal';
import {
  exportAllDataJSON,
  importDataJSON,
  addPlan,
  deletePlan,
  clearAllDataAndStartFresh,
  seedDemoDataIfEmpty,
} from '../database/db';
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_COUNTRIES,
  getCountryByCode,
  getCurrencyByCode,
  LanguageCode,
} from '../i18n';
import {
  THEME_PRESETS,
  neoShadow,
  FONT_FAMILY,
  FONT_BOLD,
  FONT_BLACK,
  FONT_EXTRABOLD,
  FONT_REGULAR,
} from '../theme';
import { Plan } from '../types';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const topInset =
    Math.max(insets.top, StatusBar.currentHeight || 0) +
    (Platform.OS === 'android' ? 8 : 0);
  const {
    settings,
    theme,
    plans,
    subscription,
    language,
    currency,
    country,
    t,
    formatPrice,
    showPaywall,
    openAuthModal,
    isCloudAuthenticated,
    user,
    lastSyncedAt,
    updateSettings,
    setOwnerPin,
    refreshAll,
    refreshPlans,
    lockApp,
  } = useApp();

  const [isExporting, setIsExporting] = useState(false);

  // Modals visibility
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [privacyModalTab, setPrivacyModalTab] = useState<'privacy' | 'terms'>('privacy');
  const [rateModalVisible, setRateModalVisible] = useState(false);

  // Branding states
  const [gymName, setGymName] = useState(settings.gym_name);
  const [selectedColor, setSelectedColor] = useState(settings.theme_color);
  const [startHour, setStartHour] = useState(settings.working_hours_start);
  const [endHour, setEndHour] = useState(settings.working_hours_end);
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  // PIN states
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [pinError, setPinError] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Plan Modal states
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanDuration, setNewPlanDuration] = useState('30');
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [tutorialModalVisible, setTutorialModalVisible] = useState(false);

  const activeLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
    SUPPORTED_LANGUAGES[0];
  const activeCurrObj = getCurrencyByCode(currency);
  const activeCountryObj = getCountryByCode(country);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const json = await exportAllDataJSON();
      const filename = `${settings.gym_name
        .toLowerCase()
        .replace(/\s+/g, '_')}_backup_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export GymFlow Backup JSON',
          UTI: 'public.json',
        });
      } else {
        Alert.alert(t('common_success'), `File saved to ${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert(
        t('common_error'),
        e?.message || 'Could not export backup JSON.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetFreshStart = () => {
    Alert.alert(
      'Fresh Start / Clear All Data',
      'Are you sure you want to delete all members, attendance records, and membership plans? This will reset GymFlow to a completely clean, fresh state ready for real members.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllDataAndStartFresh();
              await refreshAll();
              Alert.alert('Fresh Start Ready', 'All customer and membership records have been wiped clean.');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Could not clear data.');
            }
          },
        },
      ]
    );
  };

  const handleSaveBranding = async () => {
    if (!gymName.trim()) {
      Alert.alert('Required', 'Gym Name cannot be empty.');
      return;
    }
    setIsSavingBrand(true);
    try {
      await updateSettings({
        gym_name: gymName.trim(),
        theme_color: selectedColor,
        working_hours_start: startHour,
        working_hours_end: endHour,
      });
      Alert.alert('Saved', 'Gym branding updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update settings.');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) {
      Alert.alert('Required', 'Please enter a plan name.');
      return;
    }
    const priceNum = parseFloat(newPlanPrice) || 0;
    const durationNum = parseInt(newPlanDuration, 10) || 30;

    try {
      await addPlan(newPlanName.trim(), priceNum, durationNum);
      await refreshPlans();
      setPlanModalVisible(false);
      setNewPlanName('');
      setNewPlanPrice('');
      setNewPlanDuration('30');
      Alert.alert('Plan Created', 'New membership plan added successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not create plan.');
    }
  };

  const handleDeletePlan = (planId: number, planName: string) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to remove "${planName}"? Existing members will retain their assigned plan.`,
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
          style: 'destructive',
          onPress: async () => {
            await deletePlan(planId);
            await refreshPlans();
          },
        },
      ]
    );
  };

  const handlePinKeypadSubmit = async (enteredPin: string) => {
    if (pinStep === 'enter') {
      setNewPin(enteredPin);
      setPinStep('confirm');
    } else {
      if (enteredPin === newPin) {
        await updateSettings({ owner_pin: enteredPin, app_locked: true });
        setPinModalVisible(false);
        setNewPin('');
        setConfirmPin('');
        setPinStep('enter');
        setPinError('');
        Alert.alert(
          'PIN Updated',
          'Your Owner Security PIN is set and App Lock is enabled.'
        );
      } else {
        setPinError('PINs do not match. Please try again.');
        setConfirmPin('');
        setPinStep('enter');
        setNewPin('');
      }
    }
  };

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: theme.background, paddingTop: topInset },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Title */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: theme.text, fontFamily: FONT_BLACK },
            ]}
          >
            {t('set_title')}
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.textMuted, fontFamily: FONT_REGULAR },
            ]}
          >
            Universal language, currency, membership tiers & data safety
          </Text>
        </View>

        {/* 0. GymFlow Pro Subscription Card */}
        <NeoCard
          style={[
            styles.subscriptionCard,
            {
              backgroundColor: subscription.isSubscribed
                ? subscription.status === 'active'
                  ? '#EEF2FF'
                  : '#FEFCE8'
                : '#FEE2E2',
              borderColor: theme.border,
            },
          ]}
          shadowOffset={3}
        >
          <View style={styles.subHeaderRow}>
            <View style={styles.subLeft}>
              <View
                style={[
                  styles.subIconCircle,
                  {
                    backgroundColor:
                      subscription.status === 'active'
                        ? theme.primary
                        : theme.yellow,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Crown
                  size={20}
                  color={
                    subscription.status === 'active' ? '#FFFFFF' : '#18181B'
                  }
                  strokeWidth={2.5}
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.subPlanTitle,
                    { color: theme.text, fontFamily: FONT_BLACK },
                  ]}
                >
                  GymFlow Pro
                </Text>
                <Text
                  style={[
                    styles.subPlanPrice,
                    { color: theme.textMuted, fontFamily: FONT_REGULAR },
                  ]}
                >
                  {formatPrice(subscription.price)}/mo • Full License
                </Text>
              </View>
            </View>

            <NeoBadge
              label={
                subscription.status === 'active'
                  ? 'ACTIVE PRO'
                  : subscription.status === 'trial'
                  ? `${subscription.daysLeft}D TRIAL`
                  : 'EXPIRED'
              }
              variant={
                subscription.status === 'active'
                  ? 'active'
                  : subscription.status === 'trial'
                  ? 'due'
                  : 'overdue'
              }
              size="sm"
            />
          </View>

          <View
            style={[styles.subDivider, { backgroundColor: theme.border }]}
          />

          <View style={styles.subFooterRow}>
            <Text
              style={[
                styles.subExpiryText,
                { color: theme.textMuted, fontFamily: FONT_REGULAR },
              ]}
            >
              {subscription.status === 'active'
                ? `Active until ${new Date(
                    subscription.expiresAt
                  ).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })} (${subscription.daysLeft} days remaining)`
                : subscription.status === 'trial'
                ? `Free trial active (${subscription.daysLeft} days remaining). Full offline & cloud features.`
                : 'Subscription expired. Upgrade to keep unlimited member records.'}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={showPaywall}
              style={[
                styles.manageSubBtn,
                {
                  backgroundColor: theme.primary,
                  borderColor: theme.border,
                },
                neoShadow(2, theme.border),
              ]}
            >
              <Zap size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text
                style={[
                  styles.manageSubBtnText,
                  { fontFamily: FONT_BLACK },
                ]}
              >
                {subscription.status === 'active'
                  ? 'MANAGE PLAN'
                  : `UPGRADE • ${formatPrice(subscription.price)}/MO`}
              </Text>
            </TouchableOpacity>
          </View>
        </NeoCard>

        {/* Cloud Sync & OAuth Account Card */}
        <NeoCard
          style={[
            styles.subscriptionCard,
            {
              backgroundColor: isCloudAuthenticated ? '#DCFCE7' : '#EEF2FF',
              borderColor: theme.border,
            },
          ]}
          shadowOffset={3}
        >
          <View style={styles.subHeaderRow}>
            <View style={styles.subLeft}>
              <View
                style={[
                  styles.subIconCircle,
                  {
                    backgroundColor: isCloudAuthenticated ? '#15803D' : theme.primary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Cloud
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                />
              </View>
              <View style={styles.subTextCol}>
                <Text
                  style={[
                    styles.subGymName,
                    { color: theme.text, fontFamily: FONT_BLACK },
                  ]}
                >
                  Supabase Cloud Sync
                </Text>
                <Text
                  style={[
                    styles.subStatusBadge,
                    {
                      color: isCloudAuthenticated ? '#15803D' : theme.primary,
                      fontFamily: FONT_BOLD,
                    },
                  ]}
                >
                  {isCloudAuthenticated
                    ? 'CONNECTED & BACKED UP'
                    : 'OFFLINE / NOT CONNECTED'}
                </Text>
              </View>
            </View>

            <NeoBadge
              label={isCloudAuthenticated ? 'SYNC ON' : 'CONNECT'}
              variant={isCloudAuthenticated ? 'active' : 'primary'}
              size="sm"
            />
          </View>

          <View style={styles.subBody}>
            <Text
              style={[
                styles.subValidity,
                { color: theme.textMuted, fontFamily: FONT_REGULAR },
              ]}
            >
              {isCloudAuthenticated && user
                ? `Logged in as ${user.email}. Even if this app is deleted or you switch phones, all data is safe on Supabase.`
                : 'Sign in or link Supabase so your member database, check-ins, and membership plans survive app uninstalls.'}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openAuthModal}
              style={[
                styles.manageSubBtn,
                {
                  backgroundColor: isCloudAuthenticated ? '#15803D' : theme.primary,
                  borderColor: theme.border,
                },
                neoShadow(2, theme.border),
              ]}
            >
              <CloudUpload size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text
                style={[
                  styles.manageSubBtnText,
                  { fontFamily: FONT_BLACK },
                ]}
              >
                {isCloudAuthenticated
                  ? 'MANAGE CLOUD BACKUP'
                  : 'LOGIN / LINK SUPABASE CLOUD'}
              </Text>
            </TouchableOpacity>
          </View>
        </NeoCard>

        {/* 1. Global Localization & Region Suite */}
        <NeoCard style={styles.sectionCard} shadowOffset={3}>
          <View style={styles.sectionTitleRow}>
            <Globe size={18} color={theme.primary} strokeWidth={2.5} />
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, fontFamily: FONT_BLACK },
              ]}
            >
              Language, Currency & Country
            </Text>
          </View>
          <Text
            style={[
              styles.sectionDesc,
              { color: theme.textMuted, fontFamily: FONT_REGULAR },
            ]}
          >
            Configure your gym's language, default currency symbol, and country dial code for WhatsApp receipts.
          </Text>

          {/* Language Selector Item */}
          <TouchableOpacity
            onPress={() => setLangModalVisible(true)}
            style={[
              styles.selectorItem,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.selectorLeft}>
              <View
                style={[
                  styles.selectorIcon,
                  { backgroundColor: theme.primaryLight },
                ]}
              >
                <Languages size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.selectorLabel, { color: theme.textMuted }]}
                >
                  {t('set_language')}
                </Text>
                <Text
                  style={[styles.selectorValue, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {activeLangObj.flag} {activeLangObj.nativeName} ({activeLangObj.name})
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Currency Selector Item */}
          <TouchableOpacity
            onPress={() => setCurrencyModalVisible(true)}
            style={[
              styles.selectorItem,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.selectorLeft}>
              <View
                style={[styles.selectorIcon, { backgroundColor: '#FEF3C7' }]}
              >
                <Coins size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.selectorLabel, { color: theme.textMuted }]}
                >
                  {t('set_currency')}
                </Text>
                <Text
                  style={[styles.selectorValue, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {activeCurrObj.flag} {activeCurrObj.code} ({activeCurrObj.symbol}) — {activeCurrObj.name}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Country Selector Item */}
          <TouchableOpacity
            onPress={() => setCountryModalVisible(true)}
            style={[
              styles.selectorItem,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.selectorLeft}>
              <View
                style={[styles.selectorIcon, { backgroundColor: '#DCFCE7' }]}
              >
                <Globe size={18} color="#15803D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.selectorLabel, { color: theme.textMuted }]}
                >
                  {t('set_country')}
                </Text>
                <Text
                  style={[styles.selectorValue, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {activeCountryObj.flag} {activeCountryObj.name} ({activeCountryObj.dialCode})
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </NeoCard>

        {/* 2. Brand & Theme Color Customizer */}
        <NeoCard style={styles.sectionCard} shadowOffset={3}>
          <View style={styles.sectionTitleRow}>
            <Palette size={18} color={theme.primary} strokeWidth={2.5} />
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, fontFamily: FONT_BLACK },
              ]}
            >
              {t('set_branding_section')}
            </Text>
          </View>
          <Text
            style={[
              styles.sectionDesc,
              { color: theme.textMuted, fontFamily: FONT_REGULAR },
            ]}
          >
            Personalize your gym name, accent color palette, and operating schedule.
          </Text>

          <NeoInput
            label={t('set_gym_name')}
            value={gymName}
            onChangeText={setGymName}
            placeholder="e.g. Iron Forge Fitness"
          />

          <Text
            style={[
              styles.label,
              { color: theme.text, fontFamily: FONT_EXTRABOLD },
            ]}
          >
            {t('set_theme_color')}
          </Text>
          <View style={styles.swatchWrap}>
            {THEME_PRESETS.map((preset) => {
              const isSelected =
                selectedColor.toLowerCase() === preset.primary.toLowerCase();
              return (
                <TouchableOpacity
                  key={preset.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedColor(preset.primary)}
                  style={[
                    styles.colorSwatchBox,
                    {
                      backgroundColor: preset.primary,
                      borderColor: theme.border,
                    },
                    neoShadow(isSelected ? 3 : 1, theme.border),
                  ]}
                >
                  {isSelected && (
                    <Check size={18} color="#FFFFFF" strokeWidth={3} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.timeInputsRow}>
            <View style={{ flex: 1 }}>
              <NeoInput
                label="OPENING TIME"
                value={startHour}
                onChangeText={setStartHour}
                placeholder="06:00"
              />
            </View>
            <View style={{ flex: 1 }}>
              <NeoInput
                label="CLOSING TIME"
                value={endHour}
                onChangeText={setEndHour}
                placeholder="22:00"
              />
            </View>
          </View>

          <NeoButton
            title={isSavingBrand ? 'Saving...' : t('common_save')}
            variant="primary"
            size="md"
            onPress={handleSaveBranding}
            disabled={isSavingBrand}
            style={{ marginTop: 6 }}
          />
        </NeoCard>

        {/* 3. Membership Plans Manager */}
        <NeoCard style={styles.sectionCard} shadowOffset={3}>
          <View style={styles.sectionHeaderBetween}>
            <View style={styles.sectionHeaderLeft}>
              <View
                style={[
                  styles.sectionHeaderIcon,
                  { backgroundColor: theme.primaryLight },
                ]}
              >
                <Layers size={18} color={theme.primary} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.text, fontFamily: FONT_BLACK },
                  ]}
                  numberOfLines={1}
                >
                  {t('set_plans_section')}
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: theme.textMuted, fontFamily: FONT_REGULAR },
                  ]}
                >
                  {plans.length} active tiers configured
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPlanModalVisible(true)}
              style={[
                styles.addPlanHeaderBtn,
                { backgroundColor: theme.yellow, borderColor: theme.border },
                neoShadow(2, theme.border),
              ]}
            >
              <Plus size={14} color="#18181B" strokeWidth={3} />
              <Text
                style={[
                  styles.addPlanHeaderBtnText,
                  { fontFamily: FONT_BLACK },
                ]}
              >
                ADD PLAN
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.planList}>
            {plans.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.planCardItem,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.planItemLeft}>
                  <Text
                    style={[
                      styles.planItemName,
                      { color: theme.text, fontFamily: FONT_BLACK },
                    ]}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={[
                      styles.planItemSub,
                      { color: theme.textMuted, fontFamily: FONT_REGULAR },
                    ]}
                  >
                    {formatPrice(p.price)} • {p.duration_days} days validity
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeletePlan(p.id, p.name)}
                  style={styles.deletePlanBtn}
                >
                  <Trash2 size={16} color={theme.red} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </NeoCard>

        {/* 4. Security & Owner PIN Lock */}
        <NeoCard style={styles.sectionCard} shadowOffset={3}>
          <View style={styles.sectionTitleRow}>
            <Shield size={18} color={theme.primary} strokeWidth={2.5} />
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, fontFamily: FONT_BLACK },
              ]}
            >
              {t('set_security_section')}
            </Text>
          </View>
          <Text
            style={[
              styles.sectionDesc,
              { color: theme.textMuted, fontFamily: FONT_REGULAR },
            ]}
          >
            Set a 4-digit master PIN to lock financial analytics and gym administration.
          </Text>

          <View style={styles.lockStatusRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.lockStatusLabel,
                  { color: theme.text, fontFamily: FONT_BLACK },
                ]}
              >
                Owner Lock: {settings.app_locked ? '🔒 ENABLED' : '🔓 DISABLED'}
              </Text>
              <Text
                style={[
                  styles.lockStatusSub,
                  { color: theme.textMuted, fontFamily: FONT_REGULAR },
                ]}
              >
                {settings.owner_pin
                  ? 'Protected with 4-digit PIN'
                  : 'App opens directly without PIN'}
              </Text>
            </View>
            <NeoButton
              title={settings.owner_pin ? t('set_change_pin') : t('set_set_pin')}
              variant="outline"
              size="sm"
              onPress={() => {
                setPinStep('enter');
                setNewPin('');
                setConfirmPin('');
                setPinError('');
                setPinModalVisible(true);
              }}
            />
          </View>

          {settings.owner_pin && (
            <View style={{ marginTop: 10 }}>
              <NeoButton
                title={t('set_lock_now')}
                variant="neutral"
                size="sm"
                onPress={lockApp}
                icon={<Lock size={14} color={theme.text} />}
              />
            </View>
          )}
        </NeoCard>

        {/* 5. Data Backup & JSON Restore */}
        <NeoCard style={styles.sectionCard} shadowOffset={3}>
          <View style={styles.sectionTitleRow}>
            <Download size={18} color={theme.primary} strokeWidth={2.5} />
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, fontFamily: FONT_BLACK },
              ]}
            >
              {t('set_backup_section')}
            </Text>
          </View>
          <Text
            style={[
              styles.sectionDesc,
              { color: theme.textMuted, fontFamily: FONT_REGULAR },
            ]}
          >
            Since GymFlow is 100% offline, create periodic JSON backup files to safeguard your member roster and attendance history.
          </Text>

          <NeoButton
            title={isExporting ? 'Exporting...' : t('set_export_backup')}
            variant="outline"
            size="md"
            onPress={handleExportBackup}
            disabled={isExporting}
            icon={<Download size={16} color={theme.text} />}
          />

          <NeoButton
            title="Wipe & Reset to Fresh Start"
            variant="danger"
            size="md"
            onPress={handleResetFreshStart}
            icon={<Trash2 size={16} color="#FFFFFF" />}
            style={{ marginTop: 10 }}
          />
        </NeoCard>

        {/* 6. Play Store, Reviews & Legal Compliance */}
        <NeoCard style={styles.sectionCard} shadowOffset={3}>
          <View style={styles.sectionTitleRow}>
            <ShieldCheck size={18} color={theme.primary} strokeWidth={2.5} />
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, fontFamily: FONT_BLACK },
              ]}
            >
              {t('set_about_section')}
            </Text>
          </View>
          <Text
            style={[
              styles.sectionDesc,
              { color: theme.textMuted, fontFamily: FONT_REGULAR },
            ]}
          >
            Legal disclosures, privacy policy compliance, and app store ratings.
          </Text>

          {/* Rate on Play Store Item */}
          <TouchableOpacity
            onPress={() => setRateModalVisible(true)}
            style={[
              styles.selectorItem,
              {
                backgroundColor: '#FEF3C7',
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.selectorLeft}>
              <View
                style={[styles.selectorIcon, { backgroundColor: '#FDE68A' }]}
              >
                <Star size={18} color="#D97706" fill="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.selectorValue, { color: theme.text }]}
                >
                  {t('set_rate_app')}
                </Text>
                <Text
                  style={[styles.selectorLabel, { color: theme.textMuted }]}
                >
                  Help other gym owners discover GymFlow
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Game Tutorial & How to Use Guide */}
          <TouchableOpacity
            onPress={() => setTutorialModalVisible(true)}
            style={[
              styles.selectorItem,
              {
                backgroundColor: '#FEF08A',
                borderColor: theme.border,
              },
              neoShadow(2, theme.border),
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.selectorLeft}>
              <View
                style={[
                  styles.selectorIcon,
                  { backgroundColor: '#FACC15' },
                ]}
              >
                <Gamepad2 size={18} color="#18181B" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.selectorValue,
                    { color: '#18181B', fontFamily: FONT_BLACK },
                  ]}
                >
                  🎮 How to Use (Game Guide & Tutorial)
                </Text>
                <Text
                  style={[
                    styles.selectorLabel,
                    { color: '#854D0E', fontFamily: FONT_BOLD },
                  ]}
                >
                  Interactive 5-level mission walkthrough & button guide
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#854D0E" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Privacy Policy Item */}
          <TouchableOpacity
            onPress={() => {
              setPrivacyModalTab('privacy');
              setPrivacyModalVisible(true);
            }}
            style={[
              styles.selectorItem,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.selectorLeft}>
              <View
                style={[
                  styles.selectorIcon,
                  { backgroundColor: theme.primaryLight },
                ]}
              >
                <ShieldCheck size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.selectorValue, { color: theme.text }]}
                >
                  {t('set_privacy_policy')}
                </Text>
                <Text
                  style={[styles.selectorLabel, { color: theme.textMuted }]}
                >
                  Google Play Data Safety & Protection
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Terms of Service Item */}
          <TouchableOpacity
            onPress={() => {
              setPrivacyModalTab('terms');
              setPrivacyModalVisible(true);
            }}
            style={[
              styles.selectorItem,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.selectorLeft}>
              <View
                style={[styles.selectorIcon, { backgroundColor: theme.surface }]}
              >
                <FileText size={18} color={theme.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.selectorValue, { color: theme.text }]}
                >
                  {t('set_terms_service')}
                </Text>
                <Text
                  style={[styles.selectorLabel, { color: theme.textMuted }]}
                >
                  EULA & Software License Terms
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Version badge */}
          <View style={styles.versionRow}>
            <Text style={[styles.versionText, { color: theme.textMuted }]}>
              GymFlow v1.0.1 (Build 2) • Universal Edition
            </Text>
            <View
              style={[
                styles.certifiedBadge,
                { backgroundColor: '#DEF7EC', borderColor: '#059669' },
              ]}
            >
              <Check size={12} color="#059669" strokeWidth={3} />
              <Text style={styles.certifiedText}>PLAY READY</Text>
            </View>
          </View>
        </NeoCard>
      </ScrollView>

      {/* Plan Builder Modal */}
      <Modal
        visible={planModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, borderColor: theme.border },
              neoShadow(5, theme.border),
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.text, fontFamily: FONT_BLACK },
              ]}
            >
              {t('set_add_plan')}
            </Text>

            <NeoInput
              label="PLAN NAME"
              placeholder="e.g. Annual VIP"
              value={newPlanName}
              onChangeText={setNewPlanName}
            />

            <NeoInput
              label={`PRICE (${activeCurrObj.symbol.trim()})`}
              placeholder="99.99"
              keyboardType="numeric"
              value={newPlanPrice}
              onChangeText={setNewPlanPrice}
            />

            <NeoInput
              label="DURATION (DAYS)"
              placeholder="30"
              keyboardType="numeric"
              value={newPlanDuration}
              onChangeText={setNewPlanDuration}
            />

            <View style={styles.modalActions}>
              <NeoButton
                title={t('common_cancel')}
                variant="neutral"
                size="md"
                onPress={() => setPlanModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <NeoButton
                title="Create Plan"
                variant="primary"
                size="md"
                onPress={handleCreatePlan}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN Setup Modal */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, borderColor: theme.border },
              neoShadow(5, theme.border),
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.text, fontFamily: FONT_BLACK },
              ]}
            >
              {pinStep === 'enter' ? t('set_set_pin') : 'Confirm Owner PIN'}
            </Text>
            <Text
              style={[
                styles.modalSubtitle,
                { color: theme.textMuted, fontFamily: FONT_REGULAR },
              ]}
            >
              {pinStep === 'enter'
                ? 'Enter a new 4-digit master security PIN'
                : 'Re-enter your 4-digit PIN to confirm'}
            </Text>

            {pinError ? (
              <View
                style={[
                  styles.modalErrorBox,
                  { backgroundColor: '#FEE2E2', borderColor: theme.red },
                ]}
              >
                <Text
                  style={[
                    styles.modalErrorText,
                    { color: theme.red, fontFamily: FONT_BOLD },
                  ]}
                >
                  {pinError}
                </Text>
              </View>
            ) : null}

            <PinKeypad
              pin={pinStep === 'enter' ? newPin : confirmPin}
              onPinChange={(val) => {
                setPinError('');
                if (pinStep === 'enter') setNewPin(val);
                else setConfirmPin(val);
              }}
              onSubmit={handlePinKeypadSubmit}
              label=""
            />

            <NeoButton
              title={t('common_cancel')}
              variant="neutral"
              size="md"
              onPress={() => setPinModalVisible(false)}
              style={{ marginTop: 14, width: '100%' }}
            />
          </View>
        </View>
      </Modal>

      {/* Selectors & Legal Modals */}
      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />

      <CurrencySelectorModal
        visible={currencyModalVisible}
        onClose={() => setCurrencyModalVisible(false)}
      />

      <CountrySelectorModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
      />

      <PrivacyPolicyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
        initialTab={privacyModalTab}
      />

      <RateAppModal
        visible={rateModalVisible}
        onClose={() => setRateModalVisible(false)}
      />

      {/* Interactive Game Tutorial & How-to Guide */}
      <GymFlowTutorialModal
        visible={tutorialModalVisible}
        onClose={() => setTutorialModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  subscriptionCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subPlanTitle: {
    fontSize: 15,
  },
  subPlanPrice: {
    fontSize: 11,
  },
  subDivider: {
    height: 1.5,
    marginVertical: 12,
    opacity: 0.15,
  },
  subFooterRow: {
    gap: 10,
  },
  subExpiryText: {
    fontSize: 12,
    lineHeight: 16,
  },
  manageSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    marginTop: 2,
  },
  manageSubBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  addPlanHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  addPlanHeaderBtnText: {
    fontSize: 11,
    color: '#18181B',
    letterSpacing: 0.3,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorLabel: {
    fontFamily: FONT_REGULAR,
    fontSize: 11,
  },
  selectorValue: {
    fontFamily: FONT_BOLD,
    fontSize: 13,
    marginTop: 1,
  },
  label: {
    fontSize: 11,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  swatchWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  colorSwatchBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  planList: {
    gap: 8,
  },
  planCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  planItemLeft: {
    flex: 1,
  },
  planItemName: {
    fontSize: 14,
  },
  planItemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  deletePlanBtn: {
    padding: 6,
  },
  lockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  lockStatusLabel: {
    fontSize: 13,
  },
  lockStatusSub: {
    fontSize: 11,
    marginTop: 2,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  versionText: {
    fontFamily: FONT_REGULAR,
    fontSize: 11,
  },
  certifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  certifiedText: {
    color: '#059669',
    fontFamily: FONT_EXTRABOLD,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 3,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  modalErrorBox: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  modalErrorText: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 14,
  },
});
