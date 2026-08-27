import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Cloud,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
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
  resetPasswordForEmail,
} from '../services/supabase';
import { restoreFromSupabase, checkHasCloudData } from '../services/syncService';

const APP_LOGO = require('../../assets/gymflow_logo.png');

interface AuthScreenProps {
  navigation: any;
}

type TabType = 'signin' | 'signup';

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topInset =
    Math.max(insets.top, StatusBar.currentHeight || 0) + (Platform.OS === 'android' ? 12 : 0);

  const { theme, checkAuthSession, refreshAll, updateSettings } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSignInAndRestore = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your account email and password.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Sign In to Supabase
      await signInWithEmail(email, password);
      await checkAuthSession();

      // 2. Check and Restore Cloud Data
      const res = await restoreFromSupabase();
      await refreshAll();

      if (res.hasCloudData) {
        // Returning Owner with existing gym data -> mark onboarding complete & go to Home!
        await updateSettings({ onboarding_completed: 1 });
        await refreshAll();
        Alert.alert(
          'Welcome Back! 🎉',
          `Successfully connected to your GymFlow Cloud. Restored ${res.counts?.members ?? 0} members and ${res.counts?.plans ?? 0} plans!`,
          [
            {
              text: 'Open Gym Dashboard',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              },
            },
          ]
        );
      } else {
        // Brand new account with no gym setup yet -> Go to Onboarding ("Setup Your Gym")
        Alert.alert(
          'Account Ready! 🚀',
          'Let’s set up your gym name, operating hours, and branding.',
          [
            {
              text: 'Setup My Gym',
              onPress: () => navigation.navigate('Onboarding'),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Sign In Failed', err?.message || 'Invalid email or password.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and a password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Security', 'Password must be at least 6 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await signUpWithEmail(email, password, 'My Gym');
      if (res.needsEmailConfirmation) {
        Alert.alert(
          'Account Created! ✉️',
          `A confirmation link was sent to ${email}. Please check your inbox and tap Confirm, then Sign In here.`,
          [{ text: 'OK', onPress: () => setActiveTab('signin') }]
        );
      } else {
        await checkAuthSession();
        Alert.alert(
          'Account Created! 🚀',
          'Your GymFlow Owner Account is ready. Let’s configure your gym name and settings!',
          [
            {
              text: 'Configure Gym',
              onPress: () => navigation.navigate('Onboarding'),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err?.message || 'Could not create account.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address to send a reset link.');
      return;
    }
    setIsProcessing(true);
    try {
      await resetPasswordForEmail(email);
      Alert.alert('Email Sent', `Password reset instructions sent to ${email}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not send reset email.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinueOffline = () => {
    navigation.navigate('Onboarding');
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: topInset }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Branding Hero */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.logoBadge,
              { backgroundColor: theme.surface, borderColor: theme.border },
              neoShadow(4, theme.border),
            ]}
          >
            <Image source={APP_LOGO} style={styles.logoImg} resizeMode="contain" />
          </View>
          <Text style={[styles.appTitle, { color: theme.text, fontFamily: FONT_BLACK }]}>
            GymFlow
          </Text>
          <Text style={[styles.appTagline, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
            Smarter Local-First Gym Management & Cloud Sync
          </Text>
        </View>

        {/* Auth Card */}
        <NeoCard style={styles.authCard} shadowOffset={5}>
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
                    fontFamily: FONT_BLACK,
                  },
                ]}
              >
                RETURNING OWNER
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
                    fontFamily: FONT_BLACK,
                  },
                ]}
              >
                NEW OWNER
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Explanation */}
          <Text style={[styles.formDesc, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
            {activeTab === 'signin'
              ? '🔑 Sign in to instantly restore your gym name, members, plans, and check-in history from the cloud.'
              : '🚀 Create your GymFlow account to ensure your gym records are backed up and safe on any device.'}
          </Text>

          {/* Email Input */}
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

          {/* Password Input */}
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

          {activeTab === 'signin' && (
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
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={activeTab === 'signin' ? handleSignInAndRestore : handleCreateAccount}
            disabled={isProcessing}
            style={[
              styles.actionBtn,
              {
                backgroundColor: activeTab === 'signin' ? theme.primary : theme.yellow,
                borderColor: theme.border,
              },
              neoShadow(3, theme.border),
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator
                color={activeTab === 'signin' ? '#FFFFFF' : '#18181B'}
                size="small"
              />
            ) : (
              <View style={styles.actionBtnRow}>
                <Text
                  style={[
                    styles.actionBtnText,
                    {
                      color: activeTab === 'signin' ? '#FFFFFF' : '#18181B',
                      fontFamily: FONT_BLACK,
                    },
                  ]}
                >
                  {activeTab === 'signin'
                    ? 'SIGN IN & RESTORE GYM 🚀'
                    : 'CREATE ACCOUNT & SETUP GYM ➔'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </NeoCard>

        {/* Offline Fallback Link */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleContinueOffline}
          style={styles.offlineLink}
        >
          <Text
            style={[
              styles.offlineLinkText,
              { color: theme.textMuted, fontFamily: FONT_REGULAR },
            ]}
          >
            Or setup gym offline without cloud account ➔
          </Text>
        </TouchableOpacity>

        {/* Guarantee Pill */}
        <View style={styles.guaranteeRow}>
          <ShieldCheck size={14} color="#10B981" />
          <Text
            style={[
              styles.guaranteeText,
              { color: theme.textMuted, fontFamily: FONT_REGULAR },
            ]}
          >
            Encrypted & Private • Offline First • Cloud Backup
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: 28,
    letterSpacing: -0.8,
  },
  appTagline: {
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  authCard: {
    width: '100%',
    maxWidth: 380,
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
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
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 10,
    letterSpacing: 0.6,
  },
  formDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 14,
    textAlign: 'center',
    paddingHorizontal: 4,
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: 14,
    marginTop: -4,
  },
  forgotPassText: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  actionBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 2,
    marginTop: 4,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  offlineLink: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  offlineLinkText: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  guaranteeText: {
    fontSize: 10,
  },
});
