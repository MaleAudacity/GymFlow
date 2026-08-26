import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Dumbbell,
  UserCheck,
  Users,
  AlertTriangle,
  DollarSign,
  QrCode,
  UserPlus,
  BarChart3,
  Lock,
  ArrowRight,
  User,
  Clock,
  Crown,
  Sparkles,
  MessageSquare,
  Send,
  Zap,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { NeoCard } from '../components/NeoCard';
import { NeoBadge } from '../components/NeoBadge';
import { EmptyState } from '../components/EmptyState';
import { WhatsAppDispatchModal } from '../components/WhatsAppDispatchModal';
import { GymFlowTutorialModal } from '../components/GymFlowTutorialModal';
import { formatAttendanceTime, getMemberById } from '../database/db';
import { Member } from '../types';
import {
  Gamepad2,
  HelpCircle,
} from 'lucide-react-native';
import {
  neoShadow,
  FONT_FAMILY,
  FONT_BOLD,
  FONT_EXTRABOLD,
  FONT_BLACK,
  FONT_REGULAR,
} from '../theme';

const APP_LOGO = require('../../assets/gymflow_logo.png');

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const topInset =
    Math.max(insets.top, StatusBar.currentHeight || 0) +
    (Platform.OS === 'android' ? 8 : 0);
  const {
    settings,
    theme,
    stats,
    todayAttendance,
    currentDateStr,
    subscription,
    showPaywall,
    refreshAll,
    lockApp,
    hasOwnerPin,
    t,
    formatPrice,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [whatsAppModalVisible, setWhatsAppModalVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Auto-launch tutorial guide on first time
  useEffect(() => {
    if (settings.has_seen_tutorial !== 1) {
      const timer = setTimeout(() => {
        setTutorialVisible(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [settings.has_seen_tutorial]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const handleOpenWhatsAppForAttendance = async (memberId: number) => {
    try {
      const member = await getMemberById(memberId);
      if (member) {
        setSelectedMember(member);
        setWhatsAppModalVisible(true);
      }
    } catch {
      // ignore
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* 1. Top Gym Header */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.gymIconBadge,
                { backgroundColor: theme.surface, borderColor: theme.border },
                neoShadow(2, theme.border),
              ]}
            >
              <Image
                source={APP_LOGO}
                style={styles.gymLogoImg}
                resizeMode="contain"
              />
            </View>
            <View style={styles.headerTextCol}>
              <Text
                style={[
                  styles.gymName,
                  { color: theme.text, fontFamily: FONT_BLACK },
                ]}
                numberOfLines={1}
              >
                {settings.gym_name}
              </Text>
              <View style={styles.liveDeskRow}>
                <View style={styles.liveDot} />
                <Text
                  style={[
                    styles.dateText,
                    { color: theme.textMuted, fontFamily: FONT_REGULAR },
                  ]}
                >
                  {currentDateStr}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Header Buttons */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTutorialVisible(true)}
              style={[
                styles.guideHeaderBtn,
                { backgroundColor: theme.yellow, borderColor: theme.border },
                neoShadow(1, theme.border),
              ]}
            >
              <Gamepad2 size={13} color="#18181B" strokeWidth={2.5} />
              <Text
                style={[
                  styles.guideHeaderBtnText,
                  { color: '#18181B', fontFamily: FONT_BLACK },
                ]}
              >
                GUIDE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={showPaywall}
              style={[
                styles.subPill,
                {
                  backgroundColor: subscription.isSubscribed
                    ? subscription.status === 'active'
                      ? '#DCFCE7'
                      : '#FEF08A'
                    : '#FEE2E2',
                  borderColor: theme.border,
                },
                neoShadow(1, theme.border),
              ]}
            >
              <Crown
                size={12}
                color={
                  subscription.status === 'active'
                    ? '#15803D'
                    : subscription.status === 'trial'
                    ? '#854D0E'
                    : '#991B1B'
                }
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.subPillText,
                  {
                    color:
                      subscription.status === 'active'
                        ? '#15803D'
                        : subscription.status === 'trial'
                        ? '#854D0E'
                        : '#991B1B',
                    fontFamily: FONT_BLACK,
                  },
                ]}
              >
                {subscription.status === 'active'
                  ? 'PRO'
                  : subscription.status === 'trial'
                  ? `${subscription.daysLeft}D`
                  : 'EXPIRED'}
              </Text>
            </TouchableOpacity>

            {hasOwnerPin && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={lockApp}
                style={[
                  styles.lockButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  neoShadow(1, theme.border),
                ]}
              >
                <Lock size={15} color={theme.text} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 2. Hero Check-In & Action Hub */}
        <NeoCard
          style={[styles.heroCard, { backgroundColor: theme.primary }]}
          shadowOffset={4}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextCol}>
              <View style={styles.heroTitleRow}>
                <Zap size={16} color={theme.yellow} strokeWidth={3} />
                <Text
                  style={[
                    styles.heroTitle,
                    { fontFamily: FONT_BLACK },
                  ]}
                  numberOfLines={1}
                >
                  {t('checkin_title')}
                </Text>
              </View>
              <Text
                style={[
                  styles.heroSubtitle,
                  { fontFamily: FONT_REGULAR },
                ]}
                numberOfLines={1}
              >
                {t('dash_scan_member_qr')} • {t('checkin_pin_tab')}
              </Text>
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('CheckIn')}
                style={[
                  styles.heroCheckInBtn,
                  { backgroundColor: theme.yellow, borderColor: theme.border },
                  neoShadow(2, theme.border),
                ]}
              >
                <QrCode size={17} color="#18181B" strokeWidth={2.5} />
                <Text
                  style={[
                    styles.heroCheckInBtnText,
                    { fontFamily: FONT_BLACK },
                  ]}
                >
                  {t('tab_checkin').toUpperCase()}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Quick Hub Action Pills (2-column layout to prevent any overflow) */}
          <View style={styles.heroActionDivider} />

          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('AddEditMember', { isNew: true })
              }
              style={[
                styles.hubBtn,
                { backgroundColor: '#DCFCE7', borderColor: theme.border },
                neoShadow(1, theme.border),
              ]}
            >
              <UserPlus size={15} color="#15803D" strokeWidth={2.5} />
              <Text
                style={[
                  styles.hubBtnText,
                  { color: '#15803D', fontFamily: FONT_BLACK },
                ]}
                numberOfLines={1}
              >
                + ADD MEMBER
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('Members', { filter: 'due' })
              }
              style={[
                styles.hubBtn,
                { backgroundColor: '#FEF08A', borderColor: theme.border },
                neoShadow(1, theme.border),
              ]}
            >
              <MessageSquare size={15} color="#854D0E" strokeWidth={2.5} />
              <Text
                style={[
                  styles.hubBtnText,
                  { color: '#854D0E', fontFamily: FONT_BLACK },
                ]}
                numberOfLines={1}
              >
                WHATSAPP DUES ({stats.dueFeesCount})
              </Text>
            </TouchableOpacity>
          </View>
        </NeoCard>

        {/* 3. Live Front Desk Stats Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionHeading,
              { color: theme.text, fontFamily: FONT_BLACK },
            ]}
          >
            {t('dash_live_frontdesk')}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title={t('dash_today_checkins')}
              value={stats.todayCheckIns}
              subtitle="Active attendees today"
              icon={<UserCheck size={18} color="#18181B" strokeWidth={2.5} />}
              iconBgColor={theme.yellow}
              onPress={() => navigation.navigate('CheckIn')}
              index={0}
            />
            <StatCard
              title={t('dash_active_members')}
              value={stats.activeMembers}
              subtitle={`${stats.dueFeesCount} ${t('mem_filter_due').toLowerCase()}`}
              icon={<Users size={18} color={theme.primary} strokeWidth={2.5} />}
              iconBgColor="#EEF2FF"
              onPress={() => navigation.navigate('Members')}
              index={1}
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              title={t('dash_expiring_soon')}
              value={stats.expiringSoon}
              subtitle="Within next 7 days"
              icon={
                <AlertTriangle
                  size={18}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                />
              }
              iconBgColor={theme.coral}
              accentColor={stats.expiringSoon > 0 ? theme.coral : theme.text}
              onPress={() =>
                navigation.navigate('Members', { filter: 'expiring' })
              }
              index={2}
            />
            <StatCard
              title={t('dash_revenue_month')}
              value={formatPrice(stats.revenueThisMonth)}
              subtitle="Active collections"
              icon={
                <DollarSign size={18} color="#FFFFFF" strokeWidth={2.5} />
              }
              iconBgColor={theme.mint}
              accentColor={theme.mint}
              onPress={() => navigation.navigate('Reports')}
              index={3}
            />
          </View>
        </View>

        {/* 4. Today's Live Check-Ins Feed */}
        <View style={styles.feedHeader}>
          <View style={styles.feedTitleRow}>
            <Clock size={17} color={theme.primary} strokeWidth={2.5} />
            <Text
              style={[
                styles.sectionHeading,
                { color: theme.text, marginBottom: 0, fontFamily: FONT_BLACK },
              ]}
            >
              {t('dash_recent_activity')}
            </Text>
          </View>

          <NeoBadge
            label={`${todayAttendance.length} TODAY`}
            variant="active"
            size="sm"
          />
        </View>

        {todayAttendance.length === 0 ? (
          <EmptyState
            icon={<Clock size={28} color={theme.text} strokeWidth={2.5} />}
            title={t('dash_no_checkins_yet')}
            description="Members will appear here live when they scan their QR code or enter their PIN at the front desk."
            buttonTitle={t('checkin_title')}
            onButtonPress={() => navigation.navigate('CheckIn')}
          />
        ) : (
          <View style={styles.activityList}>
            {todayAttendance.slice(0, 10).map((att) => (
              <TouchableOpacity
                key={att.id}
                activeOpacity={0.88}
                onPress={() =>
                  navigation.navigate('MemberDetail', {
                    memberId: att.member_id,
                  })
                }
                style={[
                  styles.activityItem,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  neoShadow(2, theme.border),
                ]}
              >
                <View style={styles.activityLeft}>
                  {att.member_photo ? (
                    <Image
                      source={{ uri: att.member_photo }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarPlaceholder,
                        {
                          backgroundColor: theme.primaryLight,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <User
                        size={18}
                        color={theme.primary}
                        strokeWidth={2.5}
                      />
                    </View>
                  )}
                  <View style={styles.activityMeta}>
                    <Text
                      style={[
                        styles.memberName,
                        { color: theme.text, fontFamily: FONT_BLACK },
                      ]}
                      numberOfLines={1}
                    >
                      {att.member_name}
                    </Text>
                    <View style={styles.metaSubRow}>
                      {att.plan_name && (
                        <Text
                          style={[
                            styles.planSubText,
                            {
                              color: theme.textMuted,
                              fontFamily: FONT_REGULAR,
                            },
                          ]}
                        >
                          {att.plan_name} •{' '}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.timeSubText,
                          { color: theme.primary, fontFamily: FONT_EXTRABOLD },
                        ]}
                      >
                        {formatAttendanceTime(att.checked_in_at)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.activityRight}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      handleOpenWhatsAppForAttendance(att.member_id)
                    }
                    style={[
                      styles.waQuickBtn,
                      {
                        backgroundColor: '#DCFCE7',
                        borderColor: '#15803D',
                      },
                    ]}
                  >
                    <MessageSquare size={13} color="#15803D" strokeWidth={2.5} />
                  </TouchableOpacity>

                  <NeoBadge
                    label={att.method.toUpperCase()}
                    variant={att.method}
                    size="sm"
                  />
                  <ArrowRight
                    size={15}
                    color={theme.textMuted}
                    strokeWidth={2.5}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* WhatsApp Dispatch Modal */}
      <WhatsAppDispatchModal
        visible={whatsAppModalVisible}
        member={selectedMember}
        onClose={() => {
          setWhatsAppModalVisible(false);
          setSelectedMember(null);
        }}
      />

      {/* Interactive Game Tutorial & How-to Guide */}
      <GymFlowTutorialModal
        visible={tutorialVisible}
        onClose={() => setTutorialVisible(false)}
        onNavigateToTab={(tab) => navigation.navigate(tab)}
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
    paddingBottom: 110,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gymIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  gymLogoImg: {
    width: '100%',
    height: '100%',
  },
  headerTextCol: {
    flex: 1,
  },
  gymName: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  liveDeskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  dateText: {
    fontSize: 11,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  guideHeaderBtnText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  subPillText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  lockButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 3,
  },
  heroCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 2,
  },
  heroCheckInBtnText: {
    color: '#18181B',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  heroActionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 12,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  hubBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  hubBtnText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 15,
    letterSpacing: -0.3,
  },
  statsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#18181B',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityMeta: {
    marginLeft: 10,
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  metaSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  planSubText: {
    fontSize: 11,
  },
  timeSubText: {
    fontSize: 11,
  },
  activityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waQuickBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
