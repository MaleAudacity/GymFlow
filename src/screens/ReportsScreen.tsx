import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Clock,
  DollarSign,
  Users,
  PieChart,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { NeoBadge } from '../components/NeoBadge';
import { StatCard } from '../components/StatCard';
import { getAttendanceAnalytics, getAllMembers, getTodayAttendance, exportMembersCSV } from '../database/db';
import { neoShadow, FONT_FAMILY, FONT_BOLD, FONT_BLACK, FONT_EXTRABOLD, FONT_REGULAR } from '../theme';

const AnimatedBarColumn: React.FC<{
  day: { day: string; date: string; count: number };
  heightPercent: number;
  isToday: boolean;
  theme: any;
  delayIndex: number;
}> = ({ day, heightPercent, isToday, theme, delayIndex }) => {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: heightPercent,
      duration: 600,
      delay: delayIndex * 70,
      useNativeDriver: false,
    }).start();
  }, [heightPercent, delayIndex, heightAnim]);

  const animatedHeight = heightAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barCol}>
      <Text style={[styles.barCount, { color: theme.text, fontFamily: FONT_BOLD }]}>
        {day.count}
      </Text>
      <View
        style={[
          styles.barTrack,
          { backgroundColor: theme.surfaceSubtle },
        ]}
      >
        <Animated.View
          style={[
            styles.barFill,
            {
              height: animatedHeight,
              backgroundColor: isToday
                ? theme.yellow
                : day.count > 0
                ? theme.primary
                : theme.surfaceSubtle,
            },
          ]}
        />
      </View>
      <Text
        style={[
          styles.barDay,
          {
            color: isToday ? theme.primary : theme.text,
            fontFamily: isToday ? FONT_BLACK : FONT_BOLD,
          },
        ]}
      >
        {day.day}
      </Text>
      <Text style={[styles.barDate, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
        {day.date}
      </Text>
    </View>
  );
};

export const ReportsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, StatusBar.currentHeight || 0) + (Platform.OS === 'android' ? 10 : 0);
  const { theme, stats, settings, t, formatPrice } = useApp();
  const [analytics, setAnalytics] = useState<{
    weekly: { day: string; date: string; count: number }[];
    hourly: { hour: number; count: number }[];
    planBreakdown: { planName: string; count: number; percentage: number }[];
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadAnalytics = useCallback(async () => {
    const data = await getAttendanceAnalytics();
    setAnalytics(data);
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csv = await exportMembersCSV();
      const filename = `${settings.gym_name.toLowerCase().replace(/\s+/g, '_')}_members_${new Date().toISOString().slice(0, 10)}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Gym Members CSV',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Export Complete', `File saved to ${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Could not export CSV file.');
    } finally {
      setIsExporting(false);
    }
  };

  const weeklyData = analytics?.weekly || [];
  const planData = analytics?.planBreakdown || [];

  const maxWeeklyAttendance = weeklyData.length > 0
    ? Math.max(...weeklyData.map((d) => d.count), 1)
    : 1;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: topInset }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text, fontFamily: FONT_BLACK }]}>
            {t('rep_title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
            Attendance trends, revenue metrics, and member demographics
          </Text>
        </View>

        {/* Top Financial Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            title={t('dash_revenue_month')}
            value={formatPrice(stats?.revenueThisMonth || 0)}
            subtitle="Active subscriptions"
            icon={<DollarSign size={20} color="#059669" strokeWidth={2.5} />}
            iconBgColor="#D1FAE5"
            accentColor="#059669"
            index={0}
          />
          <StatCard
            title={t('dash_due_fees')}
            value={stats?.dueFeesCount || 0}
            subtitle="Members with unpaid fees"
            icon={<TrendingUp size={20} color="#DC2626" strokeWidth={2.5} />}
            iconBgColor="#FEE2E2"
            accentColor="#DC2626"
            index={1}
          />
        </View>

        {/* 7-Day Attendance Trend Chart */}
        <NeoCard style={styles.chartCard} shadowOffset={3}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <BarChart3 size={18} color={theme.primary} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: theme.text, fontFamily: FONT_BLACK }]}>
                Attendance (Past 7 Days)
              </Text>
            </View>
            <NeoBadge label="WEEKLY TREND" variant="active" size="sm" />
          </View>

          <View style={styles.barChartContainer}>
            {weeklyData.map((day, idx) => {
              const heightPercent = Math.max(
                (day.count / maxWeeklyAttendance) * 100,
                8
              );
              const isToday = idx === (weeklyData.length - 1);

              return (
                <AnimatedBarColumn
                  key={day.date}
                  day={day}
                  heightPercent={heightPercent}
                  isToday={isToday}
                  theme={theme}
                  delayIndex={idx}
                />
              );
            })}
          </View>
        </NeoCard>

        {/* Plan Breakdown */}
        <NeoCard style={styles.chartCard} shadowOffset={3}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <PieChart size={18} color={theme.primary} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: theme.text, fontFamily: FONT_BLACK }]}>
                Plan Distribution
              </Text>
            </View>
          </View>

          <View style={styles.planBreakdownList}>
            {planData.map((item) => {
              return (
                <View key={item.planName} style={styles.planItem}>
                  <View style={styles.planInfoRow}>
                    <Text style={[styles.planName, { color: theme.text, fontFamily: FONT_BLACK }]}>
                      {item.planName}
                    </Text>
                    <Text style={[styles.planCount, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
                      {item.count} members ({item.percentage}%)
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.planProgressTrack,
                      { backgroundColor: theme.surfaceSubtle },
                    ]}
                  >
                    <View
                      style={[
                        styles.planProgressFill,
                        {
                          width: `${item.percentage}%`,
                          backgroundColor: theme.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </NeoCard>

        {/* CSV Export & Data Card */}
        <NeoCard style={styles.exportCard} shadowOffset={3}>
          <View style={styles.exportHeader}>
            <Download size={20} color={theme.primary} strokeWidth={2.5} />
            <Text style={[styles.exportTitle, { color: theme.text, fontFamily: FONT_BLACK }]}>
              Data Export & Records
            </Text>
          </View>
          <Text style={[styles.exportDesc, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
            Export your entire member roster with join dates, fee status, and attendance records as a standard CSV spreadsheet file.
          </Text>
          <NeoButton
            title={isExporting ? 'Generating CSV...' : 'Export Members CSV'}
            variant="outline"
            size="md"
            onPress={handleExportCSV}
            disabled={isExporting}
            style={{ marginTop: 8 }}
          />
        </NeoCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 90,
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
  statsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  chartCard: {
    padding: 14,
    marginBottom: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 16,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barCount: {
    fontSize: 10,
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    height: 80,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#18181B',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barDay: {
    fontSize: 11,
    marginTop: 6,
  },
  barDate: {
    fontSize: 9,
  },
  planBreakdownList: {
    gap: 12,
  },
  planItem: {},
  planInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  planName: {
    fontSize: 13,
  },
  planCount: {
    fontSize: 12,
  },
  planProgressTrack: {
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#18181B',
    overflow: 'hidden',
  },
  planProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  exportCard: {
    padding: 16,
    marginBottom: 14,
  },
  exportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  exportTitle: {
    fontSize: 15,
  },
  exportDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
});
