import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import {
  Share2,
  Image as ImageIcon,
  Key,
  ShieldCheck,
  Dumbbell,
  Sparkles,
  Phone,
  User,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoCard } from './NeoCard';
import { NeoBadge } from './NeoBadge';
import { Member } from '../types';
import {
  neoShadow,
  FONT_FAMILY,
  FONT_BOLD,
  FONT_BLACK,
  FONT_EXTRABOLD,
  FONT_REGULAR,
} from '../theme';

const APP_LOGO = require('../../assets/gymflow_logo.png');

interface QRCodeViewProps {
  member: Member;
  size?: number;
  showCardWrapper?: boolean;
  style?: ViewStyle;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  member,
  size = 170,
  showCardWrapper = true,
  style,
}) => {
  const { settings, theme, formatPrice } = useApp();
  const cardViewShotRef = useRef<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleShareCardImage = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      if (cardViewShotRef.current) {
        const uri = await captureRef(cardViewShotRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `${member.name}'s Official Gym Pass — ${settings.gym_name}`,
            UTI: 'public.png',
          });
        } else {
          Alert.alert('Notice', 'Image sharing is not available on this device.');
        }
      }
    } catch (e: any) {
      Alert.alert(
        'Share Failed',
        e?.message || 'Could not generate member pass card image.'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={[styles.outerWrapper, style]}>
      {/* 1. Captured High-Quality Member Pass Card */}
      <ViewShot
        ref={cardViewShotRef}
        options={{ format: 'png', quality: 1 }}
        style={styles.viewShotContainer}
      >
        <View
          style={[
            styles.passCard,
            {
              backgroundColor: '#FFFFFF',
              borderColor: theme.border,
            },
            neoShadow(4, theme.border),
          ]}
        >
          {/* Top Brand Header */}
          <View style={styles.cardHeader}>
            <View style={styles.brandRow}>
              <View
                style={[
                  styles.logoBadge,
                  { backgroundColor: theme.primaryLight, borderColor: theme.border },
                ]}
              >
                <Image
                  source={APP_LOGO}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.gymTitle,
                    { color: theme.primary, fontFamily: FONT_BLACK },
                  ]}
                  numberOfLines={1}
                >
                  {settings.gym_name.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.gymSubtitle,
                    { color: theme.textMuted, fontFamily: FONT_BOLD },
                  ]}
                >
                  OFFICIAL ACCESS PASS
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.passTypeBadge,
                { backgroundColor: theme.yellow, borderColor: theme.border },
                neoShadow(1, theme.border),
              ]}
            >
              <Text
                style={[
                  styles.passTypeText,
                  { color: '#18181B', fontFamily: FONT_BLACK },
                ]}
              >
                MEMBER PASS
              </Text>
            </View>
          </View>

          {/* Neo Divider */}
          <View
            style={[styles.neoDivider, { backgroundColor: theme.border }]}
          />

          {/* Member Name & Tier Row */}
          <View style={styles.memberRow}>
            {member.photo_uri ? (
              <Image
                source={{ uri: member.photo_uri }}
                style={[styles.memberPhoto, { borderColor: theme.border }]}
              />
            ) : (
              <View
                style={[
                  styles.memberPhotoPlaceholder,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}
              >
                <User size={24} color={theme.primary} strokeWidth={2.5} />
              </View>
            )}

            <View style={styles.memberTextCol}>
              <Text
                style={[
                  styles.memberName,
                  { color: theme.text, fontFamily: FONT_BLACK },
                ]}
                numberOfLines={1}
              >
                {member.name}
              </Text>

              <View style={styles.memberMetaRow}>
                <Phone size={11} color={theme.textMuted} />
                <Text
                  style={[
                    styles.memberPhone,
                    { color: theme.textMuted, fontFamily: FONT_REGULAR },
                  ]}
                >
                  {member.phone}
                </Text>
              </View>

              <View style={styles.badgeRow}>
                {member.plan_name ? (
                  <View
                    style={[
                      styles.planPill,
                      {
                        backgroundColor: theme.surfaceSubtle,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.planPillText,
                        { color: theme.primary, fontFamily: FONT_EXTRABOLD },
                      ]}
                    >
                      {member.plan_name.toUpperCase()}
                    </Text>
                  </View>
                ) : null}

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        member.fee_status === 'paid' ? '#DCFCE7' : '#FEE2E2',
                      borderColor:
                        member.fee_status === 'paid' ? '#15803D' : '#DC2626',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          member.fee_status === 'paid' ? '#15803D' : '#DC2626',
                        fontFamily: FONT_EXTRABOLD,
                      },
                    ]}
                  >
                    {member.fee_status === 'paid' ? 'PAID' : 'DUE'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* QR Code Container */}
          <View style={styles.qrBox}>
            <View
              style={[
                styles.qrWhiteBg,
                { borderColor: theme.border },
                neoShadow(2, theme.border),
              ]}
            >
              <QRCode
                value={
                  member.qr_payload || `GYMFLOW:MEMBER:${member.pin_code}`
                }
                size={160}
                color={theme.border}
                backgroundColor="#FFFFFF"
              />
            </View>
          </View>

          {/* 4-Digit PIN Code Box */}
          <View
            style={[
              styles.pinBox,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.pinBoxLeft}>
              <Key size={13} color={theme.primary} strokeWidth={2.5} />
              <Text
                style={[
                  styles.pinBoxLabel,
                  { color: theme.primary, fontFamily: FONT_EXTRABOLD },
                ]}
              >
                CHECK-IN PIN
              </Text>
            </View>
            <Text
              style={[
                styles.pinBoxCode,
                { color: theme.text, fontFamily: FONT_BLACK },
              ]}
            >
              {member.pin_code}
            </Text>
          </View>

          {/* Footer Bar */}
          <View
            style={[
              styles.cardFooter,
              { borderTopColor: '#E2E8F0' },
            ]}
          >
            <View style={styles.footerLeft}>
              <ShieldCheck size={12} color="#15803D" />
              <Text
                style={[
                  styles.footerText,
                  { color: theme.textMuted, fontFamily: FONT_REGULAR },
                ]}
              >
                Scan at reception or enter PIN
              </Text>
            </View>
            <Text
              style={[
                styles.joinedText,
                { color: theme.textMuted, fontFamily: FONT_REGULAR },
              ]}
            >
              Since {member.join_date}
            </Text>
          </View>
        </View>
      </ViewShot>

      {/* 2. Big Action Button: Share Member Pass Image */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleShareCardImage}
        disabled={isCapturing}
        style={[
          styles.shareBtn,
          { backgroundColor: theme.yellow, borderColor: theme.border },
          neoShadow(3, theme.border),
        ]}
      >
        {isCapturing ? (
          <ActivityIndicator size="small" color="#18181B" />
        ) : (
          <>
            <Share2 size={18} color="#18181B" strokeWidth={2.5} />
            <Text
              style={[
                styles.shareBtnText,
                { color: '#18181B', fontFamily: FONT_BLACK },
              ]}
            >
              SHARE MEMBER PASS CARD (IMAGE)
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  viewShotContainer: {
    width: '100%',
    maxWidth: 340,
  },
  passCard: {
    borderRadius: 20,
    borderWidth: 2.5,
    padding: 16,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  gymTitle: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  gymSubtitle: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  passTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  passTypeText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  neoDivider: {
    height: 1.5,
    marginVertical: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  memberPhoto: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
  },
  memberPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberTextCol: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberPhone: {
    fontSize: 11,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  planPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  planPillText: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  qrBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  qrWhiteBg: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
  },
  pinBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  pinBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinBoxLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  pinBoxCode: {
    fontSize: 18,
    letterSpacing: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 9,
  },
  joinedText: {
    fontSize: 9,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 340,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 14,
  },
  shareBtnText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
