import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { CheckCircle2, AlertTriangle, XCircle, Clock, User } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoButton } from './NeoButton';
import { NeoBadge } from './NeoBadge';
import { Member } from '../types';
import { neoShadow, FONT_FAMILY, FONT_BOLD, FONT_BLACK, FONT_EXTRABOLD, FONT_REGULAR, FONT_SEMIBOLD } from '../theme';

interface CheckInResultModalProps {
  visible: boolean;
  onClose: () => void;
  onViewMember?: (member: Member) => void;
  result: {
    success: boolean;
    member?: Member | null;
    message: string;
    isDuplicate?: boolean;
  } | null;
}

export const CheckInResultModal: React.FC<CheckInResultModalProps> = ({
  visible,
  onClose,
  onViewMember,
  result,
}) => {
  const { theme } = useApp();
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.75);
      iconScaleAnim.setValue(0.4);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 16,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          speed: 18,
          bounciness: 10,
          useNativeDriver: true,
        }),
      ]).start();

      if (result?.success) {
        const timer = setTimeout(() => {
          onClose();
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, result, onClose, scaleAnim, iconScaleAnim, opacityAnim]);

  if (!result) return null;

  const { success, member, message, isDuplicate } = result;

  const isFeeDue = member?.fee_status === 'due' || member?.fee_status === 'overdue';
  const isExpired = member?.is_expired;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
            neoShadow(5, theme.border),
          ]}
        >
          {/* Top Status Icon Banner */}
          <Animated.View
            style={[
              styles.statusIconContainer,
              {
                backgroundColor: success
                  ? isFeeDue
                    ? theme.yellow
                    : '#DCFCE7'
                  : '#FEE2E2',
                borderColor: theme.border,
                transform: [{ scale: iconScaleAnim }],
              },
            ]}
          >
            {success ? (
              isFeeDue ? (
                <AlertTriangle size={42} color="#854D0E" strokeWidth={2.5} />
              ) : (
                <CheckCircle2 size={42} color="#15803D" strokeWidth={2.5} />
              )
            ) : (
              <XCircle size={42} color="#991B1B" strokeWidth={2.5} />
            )}
          </Animated.View>

          {/* Title / Message */}
          <Text style={[styles.mainTitle, { color: theme.text, fontFamily: FONT_BLACK }]}>
            {success ? (isDuplicate ? 'Already Checked In' : 'Check-In Approved!') : 'Check-In Failed'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
            {message}
          </Text>

          {/* Member Card if found */}
          {member && (
            <View
              style={[
                styles.memberCard,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.memberHeader}>
                {member.photo_uri ? (
                  <Image source={{ uri: member.photo_uri }} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: theme.primary, borderColor: theme.border },
                    ]}
                  >
                    <User size={22} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.memberMeta}>
                  <Text style={[styles.memberName, { color: theme.text, fontFamily: FONT_BOLD }]}>
                    {member.name}
                  </Text>
                  <Text style={[styles.memberPhone, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
                    {member.phone}
                  </Text>
                </View>
              </View>

              <View style={styles.badgesRow}>
                {member.plan_name && (
                  <NeoBadge label={member.plan_name} variant="plan" size="sm" />
                )}
                <NeoBadge
                  label={member.fee_status.toUpperCase()}
                  variant={member.fee_status}
                  size="sm"
                />
              </View>

              {/* Expiry Warning */}
              {isExpired ? (
                <View style={[styles.alertBox, { backgroundColor: '#FEE2E2', borderColor: '#DC2626' }]}>
                  <Text style={[styles.alertText, { fontFamily: FONT_BOLD }]}>⚠️ Membership plan is EXPIRED</Text>
                </View>
              ) : member.days_left !== undefined ? (
                <View style={styles.infoRow}>
                  <Clock size={15} color={theme.textMuted} />
                  <Text style={[styles.infoText, { color: theme.textMuted, fontFamily: FONT_SEMIBOLD }]}>
                    {member.days_left} days remaining on plan
                  </Text>
                </View>
              ) : null}

              {isFeeDue && (
                <View style={[styles.alertBox, { backgroundColor: '#FEF08A', borderColor: '#CA8A04' }]}>
                  <Text style={[styles.alertText, { color: '#854D0E', fontFamily: FONT_BOLD }]}>
                    💳 Membership payment is marked as {member.fee_status.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {member && onViewMember && (
              <NeoButton
                title="View Member"
                variant="outline"
                size="md"
                onPress={() => {
                  onClose();
                  onViewMember(member);
                }}
                style={{ flex: 1, marginRight: 8 }}
              />
            )}
            <NeoButton
              title="Done"
              variant="primary"
              size="md"
              onPress={onClose}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 2,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -44,
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  memberCard: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  memberMeta: {
    marginLeft: 10,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
  },
  memberPhone: {
    fontSize: 12,
    marginTop: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
  },
  alertBox: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  alertText: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 4,
  },
});

