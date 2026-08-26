import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  MessageSquare,
  FileCheck,
  AlertCircle,
  Share2,
  X,
  Phone,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Member } from '../types';
import {
  sendWhatsAppReceipt,
  sendWhatsAppDueReminder,
  shareMemberPass,
  openWhatsApp,
} from '../utils/whatsapp';
import {
  neoShadow,
  FONT_FAMILY,
  FONT_BOLD,
  FONT_BLACK,
  FONT_EXTRABOLD,
  FONT_REGULAR,
} from '../theme';

interface WhatsAppDispatchModalProps {
  visible: boolean;
  member: Member | null;
  onClose: () => void;
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  visible,
  member,
  onClose,
}) => {
  const { theme, settings, formatPrice, t } = useApp();

  if (!member) return null;

  const handleReceipt = async () => {
    onClose();
    await sendWhatsAppReceipt(member, settings);
  };

  const handleDueNotice = async () => {
    onClose();
    await sendWhatsAppDueReminder(member, settings);
  };

  const handleSharePass = async () => {
    onClose();
    await shareMemberPass(member, settings);
  };

  const handleDirectChat = async () => {
    onClose();
    await openWhatsApp(
      member.phone,
      `Hello ${member.name}, greetings from ${settings.gym_name}!`,
      settings.country || 'IN'
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.content,
            { backgroundColor: theme.surface, borderColor: theme.border },
            neoShadow(5, theme.border),
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIcon, { backgroundColor: '#DCFCE7' }]}>
                <MessageSquare size={20} color="#15803D" strokeWidth={2.5} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text, fontFamily: FONT_BLACK }]}>
                  WhatsApp Dispatch
                </Text>
                <Text style={[styles.subtitle, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
                  {member.name} • {member.phone}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
            >
              <X size={18} color={theme.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Action List */}
          <View style={styles.actionList}>
            {/* 1. Payment Receipt */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleReceipt}
              style={[
                styles.actionCard,
                { backgroundColor: '#F0FDF4', borderColor: '#15803D' },
                neoShadow(2, '#15803D'),
              ]}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <FileCheck size={20} color="#15803D" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: '#14532D', fontFamily: FONT_BLACK }]}>
                  Send Payment Receipt
                </Text>
                <Text style={[styles.actionDesc, { color: '#166534', fontFamily: FONT_REGULAR }]}>
                  Official confirmation for {formatPrice(member.plan_price || 0)} with PIN code.
                </Text>
              </View>
              <ArrowRight size={18} color="#15803D" />
            </TouchableOpacity>

            {/* 2. Fee Due Notice */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleDueNotice}
              style={[
                styles.actionCard,
                { backgroundColor: '#FFFBEB', borderColor: '#D97706' },
                neoShadow(2, '#D97706'),
              ]}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <AlertCircle size={20} color="#D97706" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: '#78350F', fontFamily: FONT_BLACK }]}>
                  Send Fee Due Notice
                </Text>
                <Text style={[styles.actionDesc, { color: '#92400E', fontFamily: FONT_REGULAR }]}>
                  Reminder of pending membership dues and renewal instructions.
                </Text>
              </View>
              <ArrowRight size={18} color="#D97706" />
            </TouchableOpacity>

            {/* 3. Share Digital Member Pass */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSharePass}
              style={[
                styles.actionCard,
                { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
                neoShadow(2, '#2563EB'),
              ]}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Share2 size={20} color="#2563EB" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: '#1E3A8A', fontFamily: FONT_BLACK }]}>
                  Share Digital QR Pass
                </Text>
                <Text style={[styles.actionDesc, { color: '#1E40AF', fontFamily: FONT_REGULAR }]}>
                  Send pass details and 4-digit PIN code via Share Sheet.
                </Text>
              </View>
              <ArrowRight size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 3,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#15803D',
  },
  title: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    gap: 12,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
  },
  actionDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});
