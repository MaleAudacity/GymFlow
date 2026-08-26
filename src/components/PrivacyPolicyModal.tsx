import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ShieldCheck, FileText, X, Check } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoButton } from './NeoButton';
import {
  neoShadow,
  FONT_FAMILY,
  FONT_BOLD,
  FONT_BLACK,
  FONT_EXTRABOLD,
  FONT_REGULAR,
} from '../theme';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  visible,
  onClose,
  initialTab = 'privacy',
}) => {
  const { theme, t } = useApp();
  const [tab, setTab] = useState<'privacy' | 'terms'>(initialTab);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerBadge, { backgroundColor: theme.primaryLight }]}>
              <ShieldCheck size={20} color={theme.primary} />
            </View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {tab === 'privacy' ? t('set_privacy_policy') : t('set_terms_service')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
          >
            <X size={20} color={theme.text} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setTab('privacy')}
            style={[
              styles.tabBtn,
              { borderColor: theme.border },
              tab === 'privacy' && { backgroundColor: theme.primary },
            ]}
          >
            <ShieldCheck size={16} color={tab === 'privacy' ? '#FFFFFF' : theme.text} />
            <Text
              style={[
                styles.tabBtnText,
                { color: tab === 'privacy' ? '#FFFFFF' : theme.text },
              ]}
            >
              Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab('terms')}
            style={[
              styles.tabBtn,
              { borderColor: theme.border },
              tab === 'terms' && { backgroundColor: theme.primary },
            ]}
          >
            <FileText size={16} color={tab === 'terms' ? '#FFFFFF' : theme.text} />
            <Text
              style={[
                styles.tabBtnText,
                { color: tab === 'terms' ? '#FFFFFF' : theme.text },
              ]}
            >
              Terms of Service
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legal Text Content */}
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {tab === 'privacy' ? (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, neoShadow(3, theme.border)]}>
              <Text style={[styles.docTitle, { color: theme.text }]}>GymFlow Privacy Policy</Text>
              <Text style={[styles.docSubtitle, { color: theme.textMuted }]}>
                Last Updated: August 2026 • Google Play Store Verified
              </Text>

              <Text style={[styles.sectionHeading, { color: theme.primary }]}>1. Overview & Data Philosophy</Text>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                GymFlow is built on an offline-first architecture. Your gym's member records, attendance logs, subscription plans, and financial reports are stored locally on your device in an encrypted SQLite database. We do not sell, rent, or monetize your gym's data.
              </Text>

              <Text style={[styles.sectionHeading, { color: theme.primary }]}>2. Information We Handle</Text>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                • <Text style={styles.bold}>Gym Profile & Branding:</Text> Gym name, operating hours, theme colors, currency, and language preference.
                {'\n'}• <Text style={styles.bold}>Member Information:</Text> Full name, phone number, membership tier, fee status, and QR/PIN check-in identifiers.
                {'\n'}• <Text style={styles.bold}>Attendance Logs:</Text> Timestamps and method of member check-in.
              </Text>

              <Text style={[styles.sectionHeading, { color: theme.primary }]}>3. Permissions & Usage</Text>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                • <Text style={styles.bold}>Camera (Optional):</Text> Used solely to scan member QR passes during front-desk check-in. Camera feed is processed in real time and is never recorded or transmitted.
                {'\n'}• <Text style={styles.bold}>Storage / File Sharing (Optional):</Text> Used strictly when you choose to export JSON/CSV database backups or member attendance reports to your device or cloud drive.
              </Text>

              <Text style={[styles.sectionHeading, { color: theme.primary }]}>4. Security & Access Control</Text>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                Owner PIN codes and sensitive security tokens are stored using Android KeyStore-backed secure storage (Expo SecureStore). No unauthenticated third-party can access your gym management database.
              </Text>

              <Text style={[styles.sectionHeading, { color: theme.primary }]}>5. Contact & Data Deletion</Text>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                You have 100% control over your data. You can clear or delete members and history at any time directly within the Settings menu, or uninstall the app to erase all local data immediately.
              </Text>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, neoShadow(3, theme.border)]}>
              <Text style={[styles.docTitle, { color: theme.text }]}>Terms of Service</Text>
              <Text style={[styles.docSubtitle, { color: theme.textMuted }]}>
                Standard End User License Agreement (EULA)
              </Text>

              <Text style={[styles.sectionHeading, { color: theme.primary }]}>1. Acceptance of Terms</Text>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                By downloading, installing, or using GymFlow, you agree to these Terms of Service. If you do not agree, please discontinue using the application.
              </Text>

              <Text style={[styles.sectionHeading, { color: theme.primary }]}>2. License & Authorized Use</Text>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                GymFlow grants you a revocable, non-exclusive, non-transferable license to manage gym, fitness studio, or personal trainer clients and attendance on your Android devices.
              </Text>

              <Text style={[styles.sectionHeading, { color: theme.primary }]}>3. Subscriptions & Billing</Text>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                GymFlow Pro unlocks unlimited member rosters, automated WhatsApp receipt dispatch, and CSV financial reporting. Subscriptions can be managed directly in the app or activated via genuine license keys.
              </Text>

              <Text style={[styles.sectionHeading, { color: theme.primary }]}>4. Disclaimer & Limitation of Liability</Text>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                The application is provided "AS IS". While GymFlow provides high-reliability automated backups and offline redundancy, the gym owner is encouraged to perform regular JSON data exports for business continuity.
              </Text>
            </View>
          )}

          <View style={{ marginTop: 20 }}>
            <NeoButton
              title={t('common_close')}
              onPress={onClose}
              variant="primary"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONT_BLACK,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  tabBtnText: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 13,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 18,
  },
  docTitle: {
    fontFamily: FONT_BLACK,
    fontSize: 20,
    marginBottom: 4,
  },
  docSubtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: 12,
    marginBottom: 16,
  },
  sectionHeading: {
    fontFamily: FONT_BOLD,
    fontSize: 14,
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    lineHeight: 20,
  },
  bold: {
    fontFamily: FONT_BOLD,
  },
});
