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
  CloudRain,
  CloudUpload,
  CloudDownload,
  X,
  Lock,
  Mail,
  Building,
  KeyRound,
  LogOut,
  CheckCircle2,
  Settings,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoButton } from './NeoButton';
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
  getSupabaseConfig,
  setCustomSupabaseConfig,
} from '../services/supabase';
import { backupToSupabase, restoreFromSupabase, getLastSyncTime } from '../services/syncService';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'signin' | 'signup' | 'config';

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const {
    theme,
    user,
    isCloudAuthenticated,
    refreshAll,
    settings,
    updateSettings,
    checkAuthSession,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gymNameInput, setGymNameInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncStr, setLastSyncStr] = useState<string | null>(null);

  // Custom Supabase Config state
  const [customUrl, setCustomUrl] = useState('');
  const [customAnonKey, setCustomAnonKey] = useState('');
  const [isCustomConfig, setIsCustomConfig] = useState(false);

  useEffect(() => {
    if (visible) {
      loadConfig();
      fetchLastSync();
    }
  }, [visible, isCloudAuthenticated]);

  const loadConfig = async () => {
    const cfg = await getSupabaseConfig();
    setCustomUrl(cfg.url);
    setCustomAnonKey(cfg.anonKey);
    setIsCustomConfig(cfg.isCustom);
  };

  const fetchLastSync = async () => {
    const t = await getLastSyncTime();
    if (t) {
      const d = new Date(t);
      setLastSyncStr(d.toLocaleTimeString() + ' (' + d.toLocaleDateString() + ')');
    } else {
      setLastSyncStr('Never synced yet');
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setIsProcessing(true);
    setSyncMessage(null);
    try {
      await signInWithEmail(email, password);
      await checkAuthSession();
      Alert.alert('Welcome Back! 🎉', 'You are now signed in to GymFlow Cloud.');
      fetchLastSync();
    } catch (err: any) {
      Alert.alert('Sign In Failed', err?.message || 'Invalid email or password.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !gymNameInput.trim()) {
      Alert.alert('Required', 'Please fill in Gym Name, Email, and Password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Security', 'Password must be at least 6 characters.');
      return;
    }
    setIsProcessing(true);
    try {
      await signUpWithEmail(email, password, gymNameInput.trim());
      await checkAuthSession();
      Alert.alert(
        'Account Created! 🚀',
        'Your GymFlow Cloud account is ready. Your local gym data will now be protected on Supabase.'
      );
      fetchLastSync();
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
        await checkAuthSession();
        Alert.alert('Success 🎉', 'Signed in with Google OAuth!');
        fetchLastSync();
      } else if (res.error) {
        Alert.alert('Google Sign In', res.error);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to authenticate with Google.');
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
      Alert.alert('Email Sent', 'Password reset instructions have been dispatched to ' + email);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not dispatch password reset email.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your offline local gym data will remain safe on this phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutSupabase();
              await checkAuthSession();
              Alert.alert('Signed Out', 'You have been disconnected from Supabase Cloud.');
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
    setSyncMessage('Uploading gym roster and attendance to Supabase...');
    try {
      const res = await backupToSupabase();
      if (res.success) {
        setSyncMessage('✅ Backup successful!');
        fetchLastSync();
        Alert.alert(
          '☁️ Cloud Backup Complete',
          `Backed up ${res.counts?.members ?? 0} members, ${res.counts?.plans ?? 0} plans, and ${res.counts?.attendance ?? 0} attendance logs to Supabase.`
        );
      } else {
        Alert.alert('Backup Error', res.message);
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
      'This will download and sync all members, plans, and attendance from Supabase to this phone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Now',
          onPress: async () => {
            setIsProcessing(true);
            setSyncMessage('Restoring from Supabase cloud...');
            try {
              const res = await restoreFromSupabase();
              if (res.success) {
                await refreshAll();
                fetchLastSync();
                Alert.alert(
                  '🎉 Restore Complete',
                  `Restored ${res.counts?.members ?? 0} members and ${res.counts?.plans ?? 0} plans from your Supabase cloud account.`
                );
              } else {
                Alert.alert('Restore Error', res.message);
              }
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Restore failed.');
            } finally {
              setIsProcessing(false);
              setSyncMessage(null);
            }
          },
        },
      ]
    );
  };

  const handleSaveCustomConfig = async () => {
    if (!customUrl.trim() || !customAnonKey.trim()) {
      Alert.alert('Required', 'Please provide both Supabase URL and Anon Key.');
      return;
    }
    setIsProcessing(true);
    try {
      const ok = await setCustomSupabaseConfig(customUrl, customAnonKey);
      if (ok) {
        setIsCustomConfig(true);
        Alert.alert('Saved', 'Supabase project credentials updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to save Supabase configuration.');
      }
    } finally {
      setIsProcessing(false);
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
                  { backgroundColor: '#DCFCE7', borderColor: theme.border },
                  neoShadow(3, theme.border),
                ]}
              >
                <Cloud size={30} color="#15803D" strokeWidth={2.5} />
              </View>
            </View>

            <Text style={[styles.mainTitle, { color: theme.text, fontFamily: FONT_BLACK }]}>
              {isCloudAuthenticated ? 'Supabase Cloud Active' : 'Supabase Cloud Sync'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
              {isCloudAuthenticated
                ? 'Your local gym data is securely backed up and ready to restore anytime.'
                : 'Sign in to ensure your members, plans & check-ins are safe even if the app is deleted.'}
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
                        {settings.gym_name || 'GymFlow Owner'}
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
                        <CloudUpload size={20} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={[styles.actionBigBtnText, { fontFamily: FONT_BLACK }]}>
                          BACKUP LOCAL DATA TO SUPABASE
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
                      RESTORE DATA FROM CLOUD TO PHONE
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
                    Sign Out of Supabase
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

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setActiveTab('config')}
                    style={[
                      styles.tabItem,
                      activeTab === 'config' && {
                        backgroundColor: theme.yellow,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color: activeTab === 'config' ? '#18181B' : theme.textMuted,
                          fontFamily: FONT_BOLD,
                        },
                      ]}
                    >
                      ⚙️ CONFIG
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
                          SIGN IN WITH EMAIL
                        </Text>
                      )}
                    </TouchableOpacity>

                    <View style={styles.orDividerRow}>
                      <View style={[styles.orLine, { backgroundColor: theme.border }]} />
                      <Text
                        style={[styles.orText, { color: theme.textMuted, fontFamily: FONT_BOLD }]}
                      >
                        OR
                      </Text>
                      <View style={[styles.orLine, { backgroundColor: theme.border }]} />
                    </View>

                    {/* Google OAuth */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleGoogleSignIn}
                      disabled={isProcessing}
                      style={[
                        styles.googleOAuthBtn,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        neoShadow(2, theme.border),
                      ]}
                    >
                      <Globe size={18} color="#EA4335" strokeWidth={2.5} />
                      <Text
                        style={[
                          styles.googleOAuthBtnText,
                          { color: theme.text, fontFamily: FONT_BOLD },
                        ]}
                      >
                        Continue with Google
                      </Text>
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
                      PASSWORD (MIN 6 CHARACTERS):
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
                        { marginTop: 14 },
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

                {/* CONFIG TAB */}
                {activeTab === 'config' && (
                  <View style={styles.tabContent}>
                    <Text
                      style={[
                        styles.configHelpText,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      Connect your own self-hosted or managed Supabase project. Enter your Project
                      URL and Public Anon Key below:
                    </Text>

                    <Text style={[styles.inputLabel, { color: theme.text, fontFamily: FONT_BOLD }]}>
                      SUPABASE PROJECT URL:
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <Globe size={16} color={theme.textMuted} />
                      <TextInput
                        placeholder="https://xyz.supabase.co"
                        placeholderTextColor="#9CA3AF"
                        value={customUrl}
                        onChangeText={setCustomUrl}
                        autoCapitalize="none"
                        style={[styles.textInput, { color: theme.text }]}
                      />
                    </View>

                    <Text style={[styles.inputLabel, { color: theme.text, fontFamily: FONT_BOLD }]}>
                      SUPABASE ANON KEY:
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <KeyRound size={16} color={theme.textMuted} />
                      <TextInput
                        placeholder="eyJhbGciOi..."
                        placeholderTextColor="#9CA3AF"
                        value={customAnonKey}
                        onChangeText={setCustomAnonKey}
                        autoCapitalize="none"
                        style={[styles.textInput, { color: theme.text }]}
                      />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleSaveCustomConfig}
                      disabled={isProcessing}
                      style={[
                        styles.primaryActionBtn,
                        {
                          backgroundColor: theme.primary,
                          borderColor: theme.border,
                          marginTop: 12,
                        },
                        neoShadow(3, theme.border),
                      ]}
                    >
                      <Text style={[styles.primaryActionBtnText, { fontFamily: FONT_BLACK }]}>
                        SAVE SUPABASE CONFIGURATION
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <Text style={[styles.guaranteeNote, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
              🔒 100% Encrypted Cloud Storage • Local SQLite Cache First
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
    marginBottom: 8,
  },
  cloudIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 14,
    lineHeight: 15,
    paddingHorizontal: 8,
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
    marginBottom: 14,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  accountEmail: {
    fontSize: 13,
  },
  accountGymName: {
    fontSize: 11,
    marginTop: 1,
  },
  syncDivider: {
    height: 1,
    marginVertical: 10,
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
    gap: 10,
    marginBottom: 14,
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
    fontSize: 12,
    letterSpacing: 0.4,
  },
  actionOutlineBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  actionOutlineBtnText: {
    color: '#18181B',
    fontSize: 12,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    marginBottom: 8,
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
    marginBottom: 14,
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
    fontSize: 10,
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
    paddingVertical: 8,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  forgotPassText: {
    fontSize: 10,
    textDecorationLine: 'underline',
  },
  primaryActionBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 10,
  },
  googleOAuthBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    marginBottom: 10,
  },
  googleOAuthBtnText: {
    fontSize: 12,
  },
  configHelpText: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 12,
  },
  guaranteeNote: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },
});
