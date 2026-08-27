import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Hash,
  QrCode,
  Sparkles,
  CheckCircle2,
  User,
  Clock,
  Zap,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { PinKeypad } from '../components/PinKeypad';
import { CameraQRScanner } from '../components/CameraQRScanner';
import { CheckInResultModal } from '../components/CheckInResultModal';
import { NeoCard } from '../components/NeoCard';
import { NeoBadge } from '../components/NeoBadge';
import { getMemberByPin, getMemberByQR, recordCheckIn } from '../database/db';
import { syncAttendanceToCloud } from '../services/syncService';
import { Member } from '../types';
import {
  neoShadow,
  FONT_FAMILY,
  FONT_BOLD,
  FONT_BLACK,
  FONT_EXTRABOLD,
  FONT_REGULAR,
} from '../theme';

interface CheckInScreenProps {
  navigation: any;
}

export const CheckInScreen: React.FC<CheckInScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const topInset =
    Math.max(insets.top, StatusBar.currentHeight || 0) +
    (Platform.OS === 'android' ? 8 : 0);
  const { theme, refreshAttendance, todayAttendance, t } = useApp();
  const [mode, setMode] = useState<'pin' | 'qr'>('pin');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalResult, setModalResult] = useState<{
    visible: boolean;
    success: boolean;
    member?: Member | null;
    message: string;
    isDuplicate?: boolean;
  } | null>(null);

  const handlePinSubmit = async (enteredPin: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const member = await getMemberByPin(enteredPin);
      if (!member) {
        setModalResult({
          visible: true,
          success: false,
          member: null,
          message: t('checkin_invalid_pin'),
        });
        setPin('');
        return;
      }

      const res = await recordCheckIn(member.id, 'pin');
      if (res.success && res.attendanceId) {
        syncAttendanceToCloud(res.attendanceId).catch(() => {});
      }
      await refreshAttendance();

      setModalResult({
        visible: true,
        success: res.success,
        member,
        message: res.message,
        isDuplicate: res.message.includes('already checked in'),
      });
      setPin('');
    } catch (e: any) {
      setModalResult({
        visible: true,
        success: false,
        message: e?.message || 'Failed to process check-in.',
      });
      setPin('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRScanned = async (qrPayload: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const member = await getMemberByQR(qrPayload);
      if (!member) {
        setModalResult({
          visible: true,
          success: false,
          member: null,
          message: 'Unrecognized QR code. Please check member pass.',
        });
        return;
      }

      const res = await recordCheckIn(member.id, 'qr');
      if (res.success && res.attendanceId) {
        syncAttendanceToCloud(res.attendanceId).catch(() => {});
      }
      await refreshAttendance();

      setModalResult({
        visible: true,
        success: res.success,
        member,
        message: res.message,
        isDuplicate: res.message.includes('already checked in'),
      });
    } catch (e: any) {
      setModalResult({
        visible: true,
        success: false,
        message: e?.message || 'QR scanning failed.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: theme.background, paddingTop: topInset },
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Title */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: theme.text, fontFamily: FONT_BLACK },
              ]}
            >
              {t('checkin_title')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.textMuted, fontFamily: FONT_REGULAR },
              ]}
            >
              Enter member 4-digit PIN code or scan digital QR pass
            </Text>
          </View>

          {/* Mode Switcher Segmented Control */}
          <View
            style={[
              styles.tabBar,
              { backgroundColor: theme.surface, borderColor: theme.border },
              neoShadow(2, theme.border),
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setMode('pin')}
              style={[
                styles.tabBtn,
                mode === 'pin' && {
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Hash
                size={16}
                color={mode === 'pin' ? '#FFFFFF' : theme.text}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: mode === 'pin' ? '#FFFFFF' : theme.text,
                    fontFamily: FONT_BLACK,
                  },
                ]}
              >
                {t('checkin_pin_tab')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setMode('qr')}
              style={[
                styles.tabBtn,
                mode === 'qr' && {
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <QrCode
                size={16}
                color={mode === 'qr' ? '#FFFFFF' : theme.text}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: mode === 'qr' ? '#FFFFFF' : theme.text,
                    fontFamily: FONT_BLACK,
                  },
                ]}
              >
                {t('checkin_scan_tab')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* MODE: PIN Hash Keypad */}
          {mode === 'pin' && (
            <NeoCard style={styles.keypadCard} shadowOffset={3}>
              <PinKeypad
                pin={pin}
                onPinChange={setPin}
                onSubmit={handlePinSubmit}
                maxLength={4}
                label={t('checkin_pin_prompt')}
              />
            </NeoCard>
          )}

          {/* MODE: QR Scanner */}
          {mode === 'qr' && (
            <View style={styles.scannerWrapper}>
              <CameraQRScanner
                onScan={handleQRScanned}
                isScanning={!modalResult?.visible && mode === 'qr'}
              />
              <NeoCard style={styles.qrHelpCard} shadowOffset={2}>
                <Text
                  style={[
                    styles.qrHelpText,
                    { color: theme.text, fontFamily: FONT_BOLD },
                  ]}
                >
                  📱 Member opens GymFlow Pass on phone or shows printed ID.
                </Text>
              </NeoCard>
            </View>
          )}

          {/* Recent Live Check-In Mini Ticker */}
          {todayAttendance.length > 0 && (
            <View style={styles.recentBar}>
              <Text
                style={[
                  styles.recentBarTitle,
                  { color: theme.textMuted, fontFamily: FONT_EXTRABOLD },
                ]}
              >
                LATEST RECEPTION CHECK-IN
              </Text>
              <View
                style={[
                  styles.recentCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  neoShadow(2, theme.border),
                ]}
              >
                <View style={styles.recentLeft}>
                  <CheckCircle2 size={16} color="#15803D" strokeWidth={2.5} />
                  <Text
                    style={[
                      styles.recentName,
                      { color: theme.text, fontFamily: FONT_BLACK },
                    ]}
                    numberOfLines={1}
                  >
                    {todayAttendance[0].member_name}
                  </Text>
                </View>
                <NeoBadge
                  label={todayAttendance[0].method.toUpperCase()}
                  variant={todayAttendance[0].method}
                  size="sm"
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirmation / Result Modal */}
      <CheckInResultModal
        visible={Boolean(modalResult?.visible)}
        onClose={() => setModalResult(null)}
        onViewMember={(member) => {
          setModalResult(null);
          navigation.navigate('MemberDetail', { memberId: member.id });
        }}
        result={modalResult}
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
  },
  tabBar: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: 12,
    padding: 4,
    width: '100%',
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
  keypadCard: {
    width: '100%',
    padding: 16,
  },
  scannerWrapper: {
    width: '100%',
  },
  qrHelpCard: {
    marginTop: 12,
    padding: 12,
    width: '100%',
  },
  qrHelpText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  recentBar: {
    width: '100%',
    marginTop: 16,
  },
  recentBarTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 12,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recentName: {
    fontSize: 13,
  },
});
