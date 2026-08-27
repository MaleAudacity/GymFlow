import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  X,
  Lock,
  Mail,
  Building,
  LogOut,
  CheckCircle2,
  Globe,
  Sparkles,
  RefreshCw,
  Download,
  ShieldCheck,
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useApp } from '../context/AppContext';
import { NeoBadge } from './NeoBadge';
import {
  neoShadow,
  FONT_BOLD,
  FONT_BLACK,
  FONT_EXTRABOLD,
  FONT_REGULAR,
  FONT_SEMIBOLD,
} from '../theme';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutSupabase,
  resetPasswordForEmail,
} from '../services/supabase';
import { backupToSupabase, restoreFromSupabase, getLastSyncTime } from '../services/syncService';
import { exportAllDataJSON } from '../database/db';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'signin' | 'signup';

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const {
    theme,
    user,
    isCloudAuthenticated,
    refreshAll,
    settings,
    checkAuthSession,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gymNameInput, setGymNameInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSyncStr, setLastSyncStr] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchLastSync();
    }
  }, [visible, isCloudAuthenticated]);

  const fetchLastSync = async () => {
    const t = await getLastSyncTime();
    if (t) {
      const d = new Date(t);
      setLastSyncStr(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
          ' (' +
          d.toLocaleDateString() +
          ')'
      );
    } else {
      setLastSyncStr('Not synced yet');
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setIsProcessing(true);
    try {
      await signInWithEmail(email, password);
      await checkAuthSession();
      // Auto-trigger backup upon sign in
      backupToSupabase().catch(() => {});
      fetchLastSync();
      Alert.alert('Welcome Back! 🎉', 'You are now signed in. Your gym data is connected to your cloud account.');
    } catch (err: any) {
      Alert.alert('Sign In Failed', err?.message || 'Invalid email or password.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !gymNameInput.trim()) {
      Alert.alert('Required', 'Please fill in your Gym Name, Email, and Password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Security', 'Password must be at least 6 characters.');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await signUpWithEmail(email, password, gymNameInput.trim());
      if (res.needsEmailConfirmation) {
        Alert.alert(
          'Account Created! ✉️',
          'A confirmation email was sent to ' +
            email +
            '. Please check your inbox and confirm your email, then Sign In to start cloud backup.'
        );
        setActiveTab('signin');
      } else {
        await checkAuthSession();
        // Auto-backup local records to new account
        await backupToSupabase();
        fetchLastSync();
        Alert.alert(
          'Account Created! 🚀',
          'Your GymFlow Owner Account is active! All your members, plans, and attendance are now backed up to your cloud.'
        );
      }
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err?.message || 'Could not create account.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        Alert.alert('OAuth Launched', 'Complete login in your browser window.');
      } else if (res.error) {
        Alert.alert('Google Sign In', res.error);
      }
    } catch (err: any) {
      Alert.alert('Notice', 'Please use Email & Password to sign in to your GymFlow Owner Account.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address above to reset password.');
      return;
    }
    setIsProcessing(true);
    try {
      await resetPasswordForEmail(email);
      Alert.alert('Email Sent', 'Password reset link sent to ' + email);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not dispatch password reset email.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Sign out of your GymFlow Account? Your offline records on this phone will remain 100% safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutSupabase();
              await checkAuthSession();
              Alert.alert('Signed Out', 'You have been signed out of your GymFlow Cloud Account.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Sign out failed.');
            }
          },
        },
      ]
    );
  };

  const handleBackupNow = async () => {
    setIsProcessing(true);
    try {
      const res = await backupToSupabase();
      if (res.success) {
        fetchLastSync();
        Alert.alert(
          '☁️ Cloud Backup Complete',
          `Successfully saved ${res.counts?.members ?? 0} members, ${res.counts?.plans ?? 0} plans, and ${res.counts?.attendance ?? 0} check-in logs to your cloud account.`
        );
      } else {
        Alert.alert('Backup Notice', res.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Backup failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreNow = async () => {
    Alert.alert(
      'Restore From Cloud',
      'This will download all members, plans, and check-in history from your GymFlow Cloud account to this phone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Now',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const res = await restoreFromSupabase();
              if (res.success) {
                await refreshAll();
                fetchLastSync();
                Alert.alert(
                  '🎉 Restore Complete',
                  `Restored ${res.counts?.members ?? 0} members and ${res.counts?.plans ?? 0} plans from your cloud account.`
                );
              } else {
                Alert.alert('Restore Notice', res.message);
              }
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Restore failed.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Local Offline Backup Fallback
  const handleLocalBackup = async () => {
    try {
      const jsonData = await exportAllDataJSON();
      const filename = `gymflow_backup_${Date.now()}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export GymFlow Backup File',
        });
      } else {
        Alert.alert('Backup Created', `Saved to ${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert('Backup Error', e?.message || 'Could not export local backup.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
            neoShadow(6, theme.border),
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={[
              styles.closeBtn,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <X size={16} color={theme.text} strokeWidth={2.5} />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Header Icon */}
            <View style={styles.headerIconWrapper}>
              <View
                style={[
                  styles.cloudIconCircle,
                  {
                    backgroundColor: isCloudAuthenticated ? '#DCFCE7' : '#EEF2FF',
                    borderColor: theme.border,
                  },
                  neoShadow(3, theme.border),
                ]}
              >
                <Cloud
                  size={28}
                  color={isCloudAuthenticated ? '#15803D' : theme.primary}
                  strokeWidth={2.5}
                />
              </View>
            </View>

            <Text style={[styles.mainTitle, { color: theme.text, fontFamily: FONT_BLACK }]}>
              {isCloudAuthenticated ? 'GymFlow Cloud Active' : 'GymFlow Cloud Backup'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
              {isCloudAuthenticated
                ? 'Your members, check-ins & plans are protected in the cloud and ready to restore on any phone.'
                : 'Sign in to your GymFlow Owner Account so your gym data is never lost even if the app is deleted.'}
            </Text>

            {/* LOGGED IN VIEW */}
            {isCloudAuthenticated && user ? (
              <View style={styles.profileSection}>
                {/* Account Card */}
                <View
                  style={[
                    styles.accountCard,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                    neoShadow(2, theme.border),
                  ]}
                >
                  <View style={styles.accountHeader}>
                    <View
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: theme.primary, borderColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.avatarText, { fontFamily: FONT_BLACK }]}>
                        {(user.email?.[0] || 'G').toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.accountEmail, { color: theme.text, fontFamily: FONT_BOLD }]}
                        numberOfLines={1}
                      >
                        {user.email}
                      </Text>
                      <Text
                        style={[
                          styles.accountGymName,
                          { color: theme.textMuted, fontFamily: FONT_REGULAR },
                        ]}
                      >
                        {settings.gym_name || 'Gym Owner'}
                      </Text>
                    </View>
                    <NeoBadge label="ONLINE" variant="active" size="sm" />
                  </View>

                  <View style={[styles.syncDivider, { backgroundColor: theme.border }]} />

                  <View style={styles.syncMetaRow}>
                    <RefreshCw size={13} color={theme.textMuted} />
                    <Text
                      style={[
                        styles.syncMetaText,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      Last Synced: {lastSyncStr}
                    </Text>
                  </View>
                </View>

                {/* Cloud Actions */}
                <View style={styles.cloudActionCol}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleBackupNow}
                    disabled={isProcessing}
                    style={[
                      styles.actionBigBtn,
                      { backgroundColor: theme.primary, borderColor: theme.border },
                      neoShadow(3, theme.border),
                    ]}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <CloudUpload size={18} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={[styles.actionBigBtnText, { fontFamily: FONT_BLACK }]}>
                          BACKUP DATA TO CLOUD
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleRestoreNow}
                    disabled={isProcessing}
                    style={[
                      styles.actionOutlineBtn,
                      { backgroundColor: theme.yellow, borderColor: theme.border },
                      neoShadow(2, theme.border),
                    ]}
                  >
                    <CloudDownload size={18} color="#18181B" strokeWidth={2.5} />
                    <Text style={[styles.actionOutlineBtnText, { fontFamily: FONT_BOLD }]}>
                      RESTORE DATA TO THIS PHONE
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sign Out Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSignOut}
                  style={styles.signOutBtn}
                >
                  <LogOut size={15} color="#DC2626" />
                  <Text style={[styles.signOutText, { fontFamily: FONT_BOLD }]}>
                    Sign Out of GymFlow Account
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* LOGGED OUT / AUTH FORM */
              <View style={styles.authFormContainer}>
                {/* Tab Switcher */}
                <View
                  style={[
                    styles.tabBar,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setActiveTab('signin')}
                    style={[
                      styles.tabItem,
                      activeTab === 'signin' && {
                        backgroundColor: theme.primary,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color: activeTab === 'signin' ? '#FFFFFF' : theme.textMuted,
                          fontFamily: FONT_BOLD,
                        },
                      ]}
                    >
                      SIGN IN
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setActiveTab('signup')}
                    style={[
                      styles.tabItem,
                      activeTab === 'signup' && {
                        backgroundColor: theme.primary,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color: activeTab === 'signup' ? '#FFFFFF' : theme.textMuted,
                          fontFamily: FONT_BOLD,
                        },
                      ]}
                    >
                      CREATE ACCOUNT
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* SIGN IN TAB */}
                {activeTab === 'signin' && (
                  <View style={styles.tabContent}>
                    <Text style={[styles.inputLabel, { color: theme.text, fontFamily: FONT_BOLD }]}>
                      EMAIL ADDRESS:
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <Mail size={16} color={theme.textMuted} />
                      <TextInput
                        placeholder="owner@yourgym.com"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={[styles.textInput, { color: theme.text }]}
                      />
                    </View>

                    <Text style={[styles.inputLabel, { color: theme.text, fontFamily: FONT_BOLD }]}>
                      PASSWORD:
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <Lock size={16} color={theme.textMuted} />
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor="#9CA3AF"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        style={[styles.textInput, { color: theme.text }]}
                      />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleForgotPassword}
                      style={styles.forgotPassBtn}
                    >
                      <Text
                        style={[
                          styles.forgotPassText,
                          { color: theme.textMuted, fontFamily: FONT_REGULAR },
                        ]}
                      >
                        Forgot password?
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleSignIn}
                      disabled={isProcessing}
                      style={[
                        styles.primaryActionBtn,
                        { backgroundColor: theme.primary, borderColor: theme.border },
                        neoShadow(3, theme.border),
                      ]}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={[styles.primaryActionBtnText, { fontFamily: FONT_BLACK }]}>
                          SIGN IN TO GYMFLOW
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* SIGN UP TAB */}
                {activeTab === 'signup' && (
                  <View style={styles.tabContent}>
                    <Text style={[styles.inputLabel, { color: theme.text, fontFamily: FONT_BOLD }]}>
                      GYM NAME:
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <Building size={16} color={theme.textMuted} />
                      <TextInput
                        placeholder="e.g. Iron Forge Fitness"
                        placeholderTextColor="#9CA3AF"
                        value={gymNameInput}
                        onChangeText={setGymNameInput}
                        style={[styles.textInput, { color: theme.text }]}
                      />
                    </View>

                    <Text style={[styles.inputLabel, { color: theme.text, fontFamily: FONT_BOLD }]}>
                      EMAIL ADDRESS:
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <Mail size={16} color={theme.textMuted} />
                      <TextInput
                        placeholder="owner@yourgym.com"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={[styles.textInput, { color: theme.text }]}
                      />
                    </View>

                    <Text style={[styles.inputLabel, { color: theme.text, fontFamily: FONT_BOLD }]}>
                      PASSWORD (MIN 6 CHARS):
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <Lock size={16} color={theme.textMuted} />
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor="#9CA3AF"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        style={[styles.textInput, { color: theme.text }]}
                      />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleSignUp}
                      disabled={isProcessing}
                      style={[
                        styles.primaryActionBtn,
                        { backgroundColor: theme.yellow, borderColor: theme.border },
                        neoShadow(3, theme.border),
                        { marginTop: 8 },
                      ]}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#18181B" size="small" />
                      ) : (
                        <Text
                          style={[
                            styles.primaryActionBtnText,
                            { color: '#18181B', fontFamily: FONT_BLACK },
                          ]}
                        >
                          CREATE OWNER ACCOUNT & START SYNC
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Offline 1-Tap Backup Safety Box */}
            <View
              style={[
                styles.offlineCard,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                neoShadow(1, theme.border),
              ]}
            >
              <View style={styles.offlineCardLeft}>
                <Download size={16} color={theme.text} strokeWidth={2.5} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.offlineTitle, { color: theme.text, fontFamily: FONT_BOLD }]}>
                    Local Device Backup (JSON)
                  </Text>
                  <Text style={[styles.offlineSub, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
                    Export full spreadsheet backup to your phone files anytime.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLocalBackup}
                style={[
                  styles.localExportBtn,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.localExportText, { color: theme.text, fontFamily: FONT_BOLD }]}>
                  Export JSON
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.guaranteeNote, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
              🔒 100% Private & Encrypted • Automatic Cloud Backup Protection
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '92%',
    borderWidth: 2.5,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    padding: 18,
    paddingTop: 20,
    alignItems: 'center',
  },
  headerIconWrapper: {
    marginBottom: 6,
  },
  cloudIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 14,
    paddingHorizontal: 6,
  },
  profileSection: {
    width: '100%',
    alignItems: 'center',
  },
  accountCard: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  accountEmail: {
    fontSize: 12,
  },
  accountGymName: {
    fontSize: 10,
    marginTop: 1,
  },
  syncDivider: {
    height: 1,
    marginVertical: 8,
  },
  syncMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncMetaText: {
    fontSize: 10,
  },
  cloudActionCol: {
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  actionBigBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  actionBigBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  actionOutlineBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  actionOutlineBtnText: {
    color: '#18181B',
    fontSize: 11,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    marginBottom: 6,
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 11,
  },
  authFormContainer: {
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  tabContent: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 11,
    padding: 0,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  forgotPassText: {
    fontSize: 10,
    textDecorationLine: 'underline',
  },
  primaryActionBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 2,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  offlineCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  offlineCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineTitle: {
    fontSize: 11,
  },
  offlineSub: {
    fontSize: 9,
    marginTop: 1,
  },
  localExportBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  localExportText: {
    fontSize: 10,
  },
  guaranteeNote: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 6,
  },
});
