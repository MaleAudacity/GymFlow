import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Share,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Edit,
  Phone,
  Calendar,
  Clock,
  DollarSign,
  UserCheck,
  Share2,
  Trash2,
  Power,
  User,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  QrCode,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { NeoBadge } from '../components/NeoBadge';
import { QRCodeView } from '../components/QRCodeView';
import { WhatsAppDispatchModal } from '../components/WhatsAppDispatchModal';
import {
  getMemberById,
  updateMember,
  deleteMember,
  toggleMemberActive,
  recordCheckIn,
  getMemberAttendanceHistory,
  formatAttendanceDateTime,
} from '../database/db';
import { syncMemberToCloud, deleteMemberFromCloud } from '../services/syncService';
import { Member, Attendance } from '../types';
import { neoShadow, FONT_FAMILY, FONT_BOLD, FONT_BLACK, FONT_EXTRABOLD, FONT_REGULAR, FONT_SEMIBOLD } from '../theme';

interface MemberDetailScreenProps {
  navigation: any;
  route: any;
}

export const MemberDetailScreen: React.FC<MemberDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, StatusBar.currentHeight || 0) + (Platform.OS === 'android' ? 10 : 0);
  const { memberId } = route.params;
  const { theme, settings, formatPrice, t, refreshMembers, refreshAttendance } = useApp();
  const [member, setMember] = useState<Member | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsAppModalVisible, setWhatsAppModalVisible] = useState(false);

  const loadMember = useCallback(async () => {
    const data = await getMemberById(memberId);
    if (data) {
      setMember(data);
      const history = await getMemberAttendanceHistory(memberId);
      setAttendanceHistory(history);
    }
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  const handleManualCheckIn = async () => {
    if (!member) return;
    const res = await recordCheckIn(member.id, 'pin');
    await refreshAttendance();
    await loadMember();
    Alert.alert(res.success ? 'Success' : 'Notice', res.message);
  };

  const handleToggleFeeStatus = async (newStatus: 'paid' | 'due' | 'overdue') => {
    if (!member) return;
    await updateMember(member.id, { fee_status: newStatus });
    syncMemberToCloud(member.id).catch(() => {});
    await refreshMembers();
    await loadMember();
  };

  const handleRenewMembership = async () => {
    if (!member) return;
    // Set join_date to today for fresh cycle
    const today = new Date().toISOString().split('T')[0];
    await updateMember(member.id, { join_date: today, fee_status: 'paid', active: 1 });
    syncMemberToCloud(member.id).catch(() => {});
    await refreshMembers();
    await loadMember();
    Alert.alert(t('mem_renew_membership'), `${member.name}'s plan has been renewed starting today.`);
  };

  const handleToggleActive = async () => {
    if (!member) return;
    const nextActive = await toggleMemberActive(member.id, member.active);
    syncMemberToCloud(member.id).catch(() => {});
    await refreshMembers();
    await loadMember();
    Alert.alert(
      'Member Status Updated',
      `${member.name} is now ${nextActive === 1 ? 'ACTIVE' : 'INACTIVE'}.`
    );
  };

  const handleDelete = () => {
    if (!member) return;
    Alert.alert(
      t('mem_delete_member'),
      `Are you sure you want to delete ${member.name}? This will permanently erase their profile and attendance records.`,
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
          style: 'destructive',
          onPress: async () => {
            deleteMemberFromCloud(member.id).catch(() => {});
            await deleteMember(member.id);
            await refreshMembers();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleSharePass = async () => {
    if (!member) return;
    try {
      await Share.share({
        message: `GymFlow Pass for ${member.name}\nPIN Code: ${member.pin_code}\nPlan: ${member.plan_name || 'Gym Member'}`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const handleSendWhatsAppReceipt = () => {
    if (!member?.phone) {
      Alert.alert('No Phone', 'This member has no phone number on record.');
      return;
    }
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const dialDigits = (settings.country === 'US' ? '1' : settings.country === 'GB' ? '44' : settings.country === 'AE' ? '971' : '91');
    const fullPhone = cleanPhone.length > 10 ? cleanPhone : `${dialDigits}${cleanPhone}`;

    const msg = encodeURIComponent(
      `🏋️ *${settings.gym_name.toUpperCase()} — OFFICIAL RECEIPT*\n\n` +
      `👤 *Member:* ${member.name}\n` +
      `📋 *Plan:* ${member.plan_name || 'Gym Plan'} (${formatPrice(member.plan_price || 0)})\n` +
      `🔑 *PIN Code:* ${member.pin_code}\n` +
      `📅 *Joined:* ${member.join_date}\n` +
      `💳 *Status:* ${member.fee_status === 'paid' ? '✅ PAID IN FULL' : '⚠️ DUE / UNPAID'}\n\n` +
      `_Thank you for training with ${settings.gym_name}!_`
    );

    const url = `whatsapp://send?phone=${fullPhone}&text=${msg}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://wa.me/${fullPhone}?text=${msg}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://wa.me/${fullPhone}?text=${msg}`);
      });
  };

  const handleCall = () => {
    if (member?.phone) {
      Linking.openURL(`tel:${member.phone}`);
    }
  };

  if (loading || !member) {
    return (
      <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: topInset }]}>
        <View style={styles.centered}>
          <Text style={{ color: theme.text, fontFamily: FONT_BOLD }}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  const isInactive = member.active === 0;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: topInset }]}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={[
            styles.navBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
            neoShadow(2, theme.border),
          ]}
        >
          <ArrowLeft size={20} color={theme.text} strokeWidth={2.5} />
        </TouchableOpacity>

        <Text style={[styles.navTitle, { color: theme.text }]}>Member Profile</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddEditMember', { memberId: member.id })}
          style={[
            styles.navBtn,
            { backgroundColor: theme.yellow, borderColor: theme.border },
            neoShadow(2, theme.border),
          ]}
        >
          <Edit size={18} color={theme.text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Inactive Alert Banner */}
        {isInactive && (
          <View
            style={[
              styles.inactiveBanner,
              { backgroundColor: '#FEE2E2', borderColor: '#DC2626' },
              neoShadow(2, theme.border),
            ]}
          >
            <AlertTriangle size={18} color="#991B1B" />
            <Text style={[styles.inactiveBannerText, { color: '#991B1B', fontFamily: FONT_BOLD }]}>
              This member profile is currently DEACTIVATED.
            </Text>
          </View>
        )}

        {/* Member Profile Overview Card */}
        <NeoCard style={styles.profileHeaderCard} shadowOffset={3}>
          <View style={styles.profileRow}>
            {member.photo_uri ? (
              <Image source={{ uri: member.photo_uri }} style={styles.largeAvatar} />
            ) : (
              <View
                style={[
                  styles.largeAvatarPlaceholder,
                  { backgroundColor: theme.primary, borderColor: theme.border },
                ]}
              >
                <User size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>{member.name}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCall}
                style={styles.profilePhoneBtn}
              >
                <Phone size={13} color={theme.primary} strokeWidth={2.5} />
                <Text style={[styles.profilePhone, { color: theme.primary }]}>
                  {member.phone}
                </Text>
              </TouchableOpacity>

              <View style={styles.profileBadges}>
                <NeoBadge
                  label={member.active === 1 ? 'ACTIVE' : 'INACTIVE'}
                  variant={member.active === 1 ? 'active' : 'inactive'}
                  size="sm"
                />
                <NeoBadge
                  label={member.fee_status.toUpperCase()}
                  variant={member.fee_status}
                  size="sm"
                />
              </View>
            </View>
          </View>

          {/* Quick Action Buttons Grid */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleManualCheckIn}
              style={[
                styles.quickActionBtn,
                { backgroundColor: theme.primary, borderColor: theme.border },
                neoShadow(2, theme.border),
              ]}
            >
              <UserCheck size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={[styles.quickActionBtnText, { fontFamily: FONT_BLACK }]}>CHECK IN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setWhatsAppModalVisible(true)}
              style={[
                styles.quickActionBtn,
                { backgroundColor: '#DCFCE7', borderColor: '#15803D' },
                neoShadow(2, theme.border),
              ]}
            >
              <Share2 size={16} color="#15803D" strokeWidth={2.5} />
              <Text style={[styles.quickActionBtnText, { color: '#15803D', fontFamily: FONT_BLACK }]}>
                WHATSAPP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleRenewMembership}
              style={[
                styles.quickActionBtn,
                { backgroundColor: theme.yellow, borderColor: theme.border },
                neoShadow(2, theme.border),
              ]}
            >
              <CreditCard size={16} color="#18181B" strokeWidth={2.5} />
              <Text style={[styles.quickActionBtnText, { color: '#18181B', fontFamily: FONT_BLACK }]}>
                RENEW
              </Text>
            </TouchableOpacity>
          </View>
        </NeoCard>

        {/* Member QR Pass & PIN View */}
        <View style={{ marginVertical: 14 }}>
          <QRCodeView member={member} />
        </View>

        {/* Membership Details Card */}
        <NeoCard style={styles.detailsCard} shadowOffset={3}>
          <Text style={[styles.cardHeading, { color: theme.text }]}>Membership Details</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Assigned Plan</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {member.plan_name || 'No Plan'} {member.plan_price ? `(${formatPrice(member.plan_price)})` : ''}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Join Date</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{member.join_date}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Days Remaining</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: member.is_expired ? theme.red : member.days_left! <= 7 ? theme.coral : '#15803D',
                  fontFamily: FONT_BLACK,
                },
              ]}
            >
              {member.is_expired ? 'Expired' : `${member.days_left} days left`}
            </Text>
          </View>

          {/* Fee Status Selector */}
          <Text style={[styles.subLabel, { color: theme.text }]}>UPDATE FEE PAYMENT STATUS</Text>
          <View style={styles.feeToggleRow}>
            {(['paid', 'due', 'overdue'] as const).map((status) => {
              const isSelected = member.fee_status === status;
              return (
                <TouchableOpacity
                  key={status}
                  activeOpacity={0.8}
                  onPress={() => handleToggleFeeStatus(status)}
                  style={[
                    styles.feeToggleBtn,
                    {
                      backgroundColor: isSelected
                        ? status === 'paid'
                          ? '#DCFCE7'
                          : status === 'due'
                          ? '#FEF08A'
                          : '#FEE2E2'
                        : theme.surface,
                      borderColor: isSelected ? theme.border : '#D1D5DB',
                    },
                    isSelected ? neoShadow(2, theme.border) : {},
                  ]}
                >
                  <Text
                    style={[
                      styles.feeToggleText,
                      {
                        color: isSelected
                          ? status === 'paid'
                            ? '#15803D'
                            : status === 'due'
                            ? '#854D0E'
                            : '#991B1B'
                          : theme.textMuted,
                        fontFamily: isSelected ? FONT_BLACK : FONT_BOLD,
                      },
                    ]}
                  >
                    {status.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </NeoCard>

        {/* Attendance History Log */}
        <NeoCard style={styles.historyCard} shadowOffset={4}>
          <View style={styles.historyHeader}>
            <Text style={[styles.cardHeading, { color: theme.text, marginBottom: 0 }]}>
              Attendance History
            </Text>
            <NeoBadge
              label={`${attendanceHistory.length} VISITS`}
              variant="plan"
              size="sm"
            />
          </View>

          {attendanceHistory.length === 0 ? (
            <Text style={[styles.emptyHistory, { color: theme.textMuted }]}>
              No check-in visits recorded yet for this member.
            </Text>
          ) : (
            <View style={styles.historyList}>
              {attendanceHistory.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.historyItem,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.historyItemLeft}>
                    <Clock size={16} color={theme.primary} />
                    <Text style={[styles.historyTime, { color: theme.text }]}>
                      {formatAttendanceDateTime(item.checked_in_at)}
                    </Text>
                  </View>
                  <NeoBadge
                    label={item.method.toUpperCase()}
                    variant={item.method}
                    size="sm"
                  />
                </View>
              ))}
            </View>
          )}
        </NeoCard>

        {/* Danger Zone / Admin Actions */}
        <View style={styles.dangerZone}>
          <NeoButton
            title={isInactive ? 'Reactivate Member' : 'Deactivate Member'}
            variant="outline"
            size="md"
            onPress={handleToggleActive}
            icon={<Power size={18} color={theme.text} />}
            fullWidth
            style={{ marginBottom: 12 }}
          />

          <NeoButton
            title="Delete Member Profile"
            variant="danger"
            size="md"
            onPress={handleDelete}
            icon={<Trash2 size={18} color="#FFFFFF" />}
            fullWidth
          />
        </View>
      </ScrollView>

      {/* WhatsApp Dispatch Hub Modal */}
      <WhatsAppDispatchModal
        visible={whatsAppModalVisible}
        member={member}
        onClose={() => setWhatsAppModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontFamily: FONT_BLACK,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeAvatar: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1E2022',
  },
  largeAvatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: FONT_BLACK,
  },
  profilePhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 13,
    fontFamily: FONT_BOLD,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#E5E7EB',
    paddingTop: 14,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
  },
  quickActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FONT_BLACK,
  },
  detailsCard: {
    padding: 18,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 17,
    fontFamily: FONT_BLACK,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: FONT_SEMIBOLD,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },
  subLabel: {
    fontSize: 12,
    fontFamily: FONT_EXTRABOLD,
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  feeToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  feeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  feeToggleText: {
    fontSize: 12,
  },
  historyCard: {
    padding: 18,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyHistory: {
    fontSize: 13,
    paddingVertical: 8,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTime: {
    fontSize: 13,
    fontFamily: FONT_BOLD,
  },
  dangerZone: {
    marginTop: 8,
    marginBottom: 20,
  },
});
