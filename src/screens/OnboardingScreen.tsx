import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dumbbell, Palette, Clock, Shield, ArrowRight, Check } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { NeoInput } from '../components/NeoInput';
import { neoShadow, THEME_PRESETS, FONT_FAMILY, FONT_BOLD, FONT_BLACK, FONT_EXTRABOLD, FONT_REGULAR } from '../theme';

const APP_LOGO = require('../../assets/gymflow_logo.png');

import { backupToSupabase } from '../services/syncService';

interface OnboardingScreenProps {
  onComplete?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, StatusBar.currentHeight || 0) + (Platform.OS === 'android' ? 10 : 0);
  const { theme, completeOnboarding } = useApp();
  const [step, setStep] = useState(1);

  // Form states
  const [gymName, setGymName] = useState('Iron Forge Fitness');
  const [selectedColor, setSelectedColor] = useState('#4F46E5');
  const [startHour, setStartHour] = useState('06:00');
  const [endHour, setEndHour] = useState('22:00');
  const [ownerPin, setOwnerPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep = () => {
    if (step === 1) {
      if (!gymName.trim()) {
        Alert.alert('Required', 'Please enter your Gym Name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinish = async () => {
    if (ownerPin.length > 0 && ownerPin.length < 4) {
      Alert.alert('Invalid PIN', 'Owner PIN must be at least 4 digits (or leave blank to skip).');
      return;
    }
    if (ownerPin && ownerPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'Entered PINs do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding({
        gymName: gymName.trim(),
        themeColor: selectedColor,
        startHour,
        endHour,
        ownerPin: ownerPin.trim() || undefined,
      });

      // Auto-backup to cloud if account is connected
      backupToSupabase().catch(() => {});

      if (onComplete) {
        onComplete();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: topInset }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoBadge,
              { backgroundColor: theme.surface, borderColor: theme.border },
              neoShadow(3, theme.border),
            ]}
          >
            <Image source={APP_LOGO} style={styles.logoImg} resizeMode="contain" />
          </View>
          <Text style={[styles.appTitle, { color: theme.text, fontFamily: FONT_FAMILY }]}>
            GymFlow
          </Text>
          <Text style={[styles.appSubtitle, { color: theme.textMuted, fontFamily: FONT_FAMILY }]}>
            Local-First Gym Management & Front-Desk CRM
          </Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: s === step ? selectedColor : s < step ? '#10B981' : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                {s < step ? (
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      { color: s === step ? '#FFFFFF' : theme.text, fontFamily: FONT_FAMILY },
                    ]}
                  >
                    {s}
                  </Text>
                )}
              </View>
              {s < 3 && (
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: s < step ? '#10B981' : '#D1D5DB' },
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* STEP 1: Gym Identity & Branding */}
        {step === 1 && (
          <NeoCard style={styles.card} shadowOffset={4}>
            <View style={styles.cardHeader}>
              <Palette size={22} color={selectedColor} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: theme.text, fontFamily: FONT_FAMILY }]}>
                1. Gym Brand & Color
              </Text>
            </View>
            <Text style={[styles.cardDesc, { color: theme.textMuted, fontFamily: FONT_FAMILY }]}>
              Customize your gym's brand identity. All records remain 100% offline and stored securely on this phone.
            </Text>

            <NeoInput
              label="GYM / STUDIO NAME"
              placeholder="e.g. Iron Forge Gym, Apex Fitness"
              value={gymName}
              onChangeText={setGymName}
              containerStyle={{ marginTop: 8 }}
            />

            <Text style={[styles.sectionLabel, { color: theme.text, fontFamily: FONT_FAMILY }]}>
              BRAND THEME COLOR
            </Text>
            <View style={styles.swatchGrid}>
              {THEME_PRESETS.map((preset) => {
                const isSelected = selectedColor === preset.primary;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedColor(preset.primary)}
                    style={[
                      styles.swatchBtn,
                      {
                        backgroundColor: preset.primary,
                        borderColor: theme.border,
                        transform: isSelected ? [{ scale: 1.08 }] : [{ scale: 1 }],
                      },
                      isSelected ? neoShadow(2, theme.border) : {},
                    ]}
                  >
                    {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <NeoButton
              title="Next: Working Hours"
              variant="primary"
              size="lg"
              onPress={handleNextStep}
              style={{ marginTop: 20, backgroundColor: selectedColor }}
              icon={<ArrowRight size={18} color="#FFFFFF" />}
              iconPosition="right"
              fullWidth
            />
          </NeoCard>
        )}

        {/* STEP 2: Working Hours */}
        {step === 2 && (
          <NeoCard style={styles.card} shadowOffset={4}>
            <View style={styles.cardHeader}>
              <Clock size={22} color={selectedColor} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: theme.text, fontFamily: FONT_FAMILY }]}>
                2. Operating Hours
              </Text>
            </View>
            <Text style={[styles.cardDesc, { color: theme.textMuted, fontFamily: FONT_FAMILY }]}>
              Set standard front-desk opening & closing hours.
            </Text>

            <View style={styles.rowInputs}>
              <NeoInput
                label="OPENING TIME"
                placeholder="06:00"
                value={startHour}
                onChangeText={setStartHour}
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <NeoInput
                label="CLOSING TIME"
                placeholder="22:00"
                value={endHour}
                onChangeText={setEndHour}
                containerStyle={{ flex: 1, marginLeft: 8 }}
              />
            </View>

            <View style={[styles.infoBanner, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
              <Text style={[styles.infoBannerText, { color: theme.text, fontFamily: FONT_FAMILY }]}>
                💡 4 Standard Membership Plans (Monthly, Quarterly, Annual, Class Pass) will be pre-loaded. You can edit them anytime in Settings.
              </Text>
            </View>

            <View style={styles.btnRow}>
              <NeoButton
                title="Back"
                variant="outline"
                size="md"
                onPress={() => setStep(1)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <NeoButton
                title="Next: Security"
                variant="primary"
                size="md"
                onPress={handleNextStep}
                style={{ flex: 2, backgroundColor: selectedColor }}
                icon={<ArrowRight size={18} color="#FFFFFF" />}
                iconPosition="right"
              />
            </View>
          </NeoCard>
        )}

        {/* STEP 3: Security & Owner PIN */}
        {step === 3 && (
          <NeoCard style={styles.card} shadowOffset={4}>
            <View style={styles.cardHeader}>
              <Shield size={22} color={selectedColor} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: theme.text, fontFamily: FONT_FAMILY }]}>
                3. Manager Security PIN
              </Text>
            </View>
            <Text style={[styles.cardDesc, { color: theme.textMuted, fontFamily: FONT_FAMILY }]}>
              Optional: Set a 4-digit PIN to lock manager settings and reports when leaving the device at the front desk.
            </Text>

            <NeoInput
              label="4-DIGIT OWNER PIN (OPTIONAL)"
              placeholder="e.g. 1234 (leave blank for no lock)"
              value={ownerPin}
              onChangeText={setOwnerPin}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              containerStyle={{ marginTop: 6 }}
            />

            {ownerPin.length > 0 && (
              <NeoInput
                label="CONFIRM PIN"
                placeholder="Re-enter PIN"
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
              />
            )}

            <View style={styles.btnRow}>
              <NeoButton
                title="Back"
                variant="outline"
                size="md"
                onPress={() => setStep(2)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <NeoButton
                title="Launch GymFlow"
                variant="primary"
                size="md"
                loading={isSubmitting}
                onPress={handleFinish}
                style={{ flex: 2, backgroundColor: selectedColor }}
                icon={<Check size={18} color="#FFFFFF" strokeWidth={3} />}
                iconPosition="right"
              />
            </View>
          </NeoCard>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    marginVertical: 14,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: 22,
    fontFamily: FONT_BLACK,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONT_REGULAR,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  form: {
    width: '100%',
  },
  timeRow: {
    flexDirection: 'row',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 13,
    fontFamily: FONT_BLACK,
  },
  stepLine: {
    width: 36,
    height: 3,
    marginHorizontal: 6,
  },
  card: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FONT_BLACK,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: FONT_EXTRABOLD,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  swatchBtn: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInputs: {
    flexDirection: 'row',
    marginTop: 4,
  },
  infoBanner: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  infoBannerText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONT_BOLD,
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
});

