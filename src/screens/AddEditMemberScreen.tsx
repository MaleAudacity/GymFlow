import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  RefreshCw,
  User,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { NeoInput } from '../components/NeoInput';
import { NeoBadge } from '../components/NeoBadge';
import { QRCodeView } from '../components/QRCodeView';
import {
  addMember,
  updateMember,
  getMemberById,
  generateUniquePin,
} from '../database/db';
import { Member, Plan } from '../types';
import { neoShadow, FONT_FAMILY, FONT_BOLD, FONT_BLACK, FONT_EXTRABOLD, FONT_REGULAR } from '../theme';

interface AddEditMemberScreenProps {
  navigation: any;
  route: any;
}

export const AddEditMemberScreen: React.FC<AddEditMemberScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, StatusBar.currentHeight || 0) + (Platform.OS === 'android' ? 10 : 0);
  const { memberId } = route.params || {};
  const isEditing = Boolean(memberId);
  const { theme, plans, subscription, showPaywall, refreshMembers, formatPrice, t } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(plans[0]?.id || 1);
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [feeStatus, setFeeStatus] = useState<'paid' | 'due' | 'overdue'>('paid');
  const [pinCode, setPinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initForm = async () => {
      if (isEditing) {
        const existing = await getMemberById(memberId);
        if (existing) {
          setName(existing.name);
          setPhone(existing.phone);
          setPhotoUri(existing.photo_uri);
          setSelectedPlanId(existing.plan_id);
          setJoinDate(existing.join_date);
          setFeeStatus(existing.fee_status);
          setPinCode(existing.pin_code);
        }
      } else {
        const pin = await generateUniquePin();
        setPinCode(pin);
      }
    };
    initForm();
  }, [isEditing, memberId]);

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll access is needed to select a member photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const handleRegeneratePin = async () => {
    const pin = await generateUniquePin();
    setPinCode(pin);
  };

  const handleSave = async () => {
    if (!isEditing && !subscription.isSubscribed) {
      Alert.alert(
        'Subscription Required',
        `Your GymFlow trial has expired. Please upgrade for ${formatPrice(subscription.price)}/month to add unlimited members.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: `Subscribe • ${formatPrice(subscription.price)}/mo`, onPress: showPaywall },
        ]
      );
      return;
    }

    if (!name.trim()) {
      Alert.alert('Required', 'Please enter the member full name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter a contact phone number.');
      return;
    }
    if (!pinCode.trim() || pinCode.length < 4) {
      Alert.alert('Invalid PIN', 'PIN code must be at least 4 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateMember(memberId, {
          name: name.trim(),
          phone: phone.trim(),
          photo_uri: photoUri,
          plan_id: selectedPlanId,
          join_date: joinDate,
          fee_status: feeStatus,
          pin_code: pinCode.trim(),
          qr_payload: `GYMFLOW:MEMBER:${pinCode.trim()}`,
        });
      } else {
        await addMember({
          name: name.trim(),
          phone: phone.trim(),
          photo_uri: photoUri,
          plan_id: selectedPlanId,
          join_date: joinDate,
          fee_status: feeStatus,
          pin_code: pinCode.trim(),
          qr_payload: `GYMFLOW:MEMBER:${pinCode.trim()}:${Date.now()}`,
          active: 1,
        });
      }

      await refreshMembers();
      Alert.alert(
        'Success',
        `Member ${name} has been ${isEditing ? 'updated' : 'registered'} successfully!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Mock member preview for QR
  const previewMember: Member = {
    id: memberId || 999,
    name: name || 'Member Name',
    phone: phone || '+1 555-0000',
    photo_uri: photoUri,
    plan_id: selectedPlanId,
    plan_name: selectedPlan?.name || 'Standard Plan',
    join_date: joinDate,
    fee_status: feeStatus,
    pin_code: pinCode || '1234',
    qr_payload: `GYMFLOW:MEMBER:${pinCode || '1234'}`,
    active: 1,
    created_at: new Date().toISOString(),
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: topInset }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Navigation Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={[
              styles.navBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
              neoShadow(2, theme.border),
            ]}
          >
            <ArrowLeft size={20} color={theme.text} strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={[styles.navTitle, { color: theme.text }]}>
            {isEditing ? t('mem_form_edit_title') : t('mem_form_new_title')}
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Uploader */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePickPhoto}
              style={[
                styles.avatarTouch,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                neoShadow(4, theme.border),
              ]}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Camera size={32} color={theme.textMuted} />
                  <Text style={[styles.avatarUploadText, { color: theme.textMuted }]}>
                    Add Photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields Card */}
          <NeoCard style={styles.formCard} shadowOffset={5}>
            <NeoInput
              label={t('mem_name_label')}
              placeholder={t('mem_name_placeholder')}
              value={name}
              onChangeText={setName}
            />

            <NeoInput
              label={t('mem_phone_label')}
              placeholder={t('mem_phone_placeholder')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {/* Plan Selection */}
            <Text style={[styles.inputLabel, { color: theme.text }]}>{t('mem_plan_label')}</Text>
            <View style={styles.planChipsContainer}>
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPlanId(p.id)}
                    style={[
                      styles.planChip,
                      {
                        backgroundColor: isSelected ? theme.yellow : theme.surface,
                        borderColor: theme.border,
                      },
                      isSelected ? neoShadow(2, theme.border) : {},
                    ]}
                  >
                    <Text
                      style={[
                        styles.planChipTitle,
                        { color: theme.text, fontFamily: isSelected ? FONT_BLACK : FONT_BOLD },
                      ]}
                    >
                      {p.name}
                    </Text>
                    <Text style={[styles.planChipPrice, { color: theme.primary }]}>
                      {formatPrice(p.price)} • {p.duration_days}d
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <NeoInput
              label="JOIN DATE (YYYY-MM-DD)"
              placeholder="YYYY-MM-DD"
              value={joinDate}
              onChangeText={setJoinDate}
              containerStyle={{ marginTop: 14 }}
            />

            {/* Fee Status */}
            <Text style={[styles.inputLabel, { color: theme.text }]}>INITIAL FEE STATUS</Text>
            <View style={styles.feeRow}>
              {(['paid', 'due', 'overdue'] as const).map((status) => {
                const isSelected = feeStatus === status;
                return (
                  <TouchableOpacity
                    key={status}
                    activeOpacity={0.8}
                    onPress={() => setFeeStatus(status)}
                    style={[
                      styles.feeChip,
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
                        styles.feeChipText,
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

            {/* PIN Generator */}
            <View style={styles.pinSection}>
              <View style={styles.pinHeader}>
                <Text style={[styles.inputLabel, { color: theme.text, marginBottom: 0 }]}>
                  CHECK-IN PIN CODE (4 DIGITS) *
                </Text>
                {!isEditing && (
                  <TouchableOpacity
                    onPress={handleRegeneratePin}
                    style={styles.regenBtn}
                    activeOpacity={0.7}
                  >
                    <RefreshCw size={14} color={theme.primary} />
                    <Text style={[styles.regenText, { color: theme.primary }]}>Regenerate</Text>
                  </TouchableOpacity>
                )}
              </View>
              <NeoInput
                placeholder="4-digit PIN"
                value={pinCode}
                onChangeText={setPinCode}
                keyboardType="number-pad"
                maxLength={6}
                containerStyle={{ marginTop: 6 }}
              />
            </View>
          </NeoCard>

          {/* Pass Preview Section */}
          <Text style={[styles.previewHeading, { color: theme.text }]}>
            Member Pass & QR Preview
          </Text>
          <QRCodeView member={previewMember} />

          {/* Submit Button */}
          <NeoButton
            title={isEditing ? 'Save Changes' : 'Register & Generate Pass'}
            variant="primary"
            size="lg"
            loading={isSubmitting}
            onPress={handleSave}
            icon={<Check size={20} color="#FFFFFF" strokeWidth={3} />}
            iconPosition="right"
            fullWidth
            style={{ marginVertical: 24 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarTouch: {
    width: 90,
    height: 90,
    borderRadius: 26,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUploadText: {
    fontSize: 11,
    fontFamily: FONT_BOLD,
    marginTop: 4,
  },
  formCard: {
    padding: 18,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: FONT_EXTRABOLD,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  planChipsContainer: {
    gap: 8,
  },
  planChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  planChipTitle: {
    fontSize: 14,
  },
  planChipPrice: {
    fontSize: 13,
    fontFamily: FONT_EXTRABOLD,
  },
  feeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  feeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  feeChipText: {
    fontSize: 12,
  },
  pinSection: {
    marginTop: 4,
  },
  pinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  regenText: {
    fontSize: 12,
    fontFamily: FONT_BOLD,
  },
  previewHeading: {
    fontSize: 16,
    fontFamily: FONT_BLACK,
    marginBottom: 10,
    textAlign: 'center',
  },
});
