import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  QrCode,
  Users,
  MessageSquare,
  Globe,
  Shield,
  Zap,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Trophy,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  ArrowRight,
  Flame,
  Award,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import {
  neoShadow,
  FONT_FAMILY,
  FONT_BOLD,
  FONT_BLACK,
  FONT_EXTRABOLD,
  FONT_REGULAR,
} from '../theme';

const { width } = Dimensions.get('window');

interface GymFlowTutorialModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToTab?: (tabName: string) => void;
}

interface TutorialMission {
  level: number;
  badge: string;
  title: string;
  subtitle: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  description: string;
  buttonGuide: {
    btnName: string;
    actionDesc: string;
  }[];
  proTip: string;
}

const MISSIONS: TutorialMission[] = [
  {
    level: 1,
    badge: 'MISSION 1 OF 5 • RECEPTION COMBAT',
    title: 'Front Desk Check-In Kiosk',
    subtitle: 'Lightning-fast walk-in attendee check-in',
    icon: QrCode,
    iconBg: '#FEF08A',
    iconColor: '#854D0E',
    description:
      'Turn your phone into a self-service check-in kiosk for attendees at your reception desk.',
    buttonGuide: [
      {
        btnName: '🔢 PIN KEYPAD',
        actionDesc: 'Members punch their unique 4-digit PIN code to check in in 2 seconds.',
      },
      {
        btnName: '📷 QR SCANNER',
        actionDesc: 'Scans the member digital pass displayed on their phone screen or printed card.',
      },
    ],
    proTip: '💡 Pro Tip: Tap "CHECK IN" on the Home Screen anytime to activate the front-desk kiosk.',
  },
  {
    level: 2,
    badge: 'MISSION 2 OF 5 • MEMBER ROSTER',
    title: 'VIP Member Management & Passes',
    subtitle: 'Track active, due, and expiring memberships',
    icon: Users,
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    description:
      'Manage all gym athletes, track active subscriptions, and view automatic expiry notices.',
    buttonGuide: [
      {
        btnName: '+ ADD MEMBER',
        actionDesc: 'Registers a new member, assigns custom tier pricing, and auto-generates PIN & QR.',
      },
      {
        btnName: '🎫 MEMBER PASS',
        actionDesc: 'Generates a stylized VIP pass image with encrypted QR code & credentials.',
      },
    ],
    proTip: '💡 Pro Tip: Filter by "DUE" or "EXPIRING" chips to see members due for fee renewals.',
  },
  {
    level: 3,
    badge: 'MISSION 3 OF 5 • WHATSAPP WEAPON',
    title: '1-Click WhatsApp Direct Dispatch',
    subtitle: 'Send official payment receipts & dues instantly',
    icon: MessageSquare,
    iconBg: '#DCFCE7',
    iconColor: '#15803D',
    description:
      'Dispatch formatted payment receipts, renewal reminders, and VIP Pass images directly to members on WhatsApp without manual typing.',
    buttonGuide: [
      {
        btnName: '🧾 SEND RECEIPT',
        actionDesc: 'Sends official receipt with gym branding, plan price, validity, and PIN code.',
      },
      {
        btnName: '⚠️ SEND DUE NOTICE',
        actionDesc: 'Sends a friendly fee notice with outstanding balance in your currency.',
      },
      {
        btnName: '🖼️ SHARE PASS (IMAGE)',
        actionDesc: 'Snapshots the whole VIP Member Card as a high-res PNG image file.',
      },
    ],
    proTip: '💡 Pro Tip: Tap the green WhatsApp button on any member card or home activity item!',
  },
  {
    level: 4,
    badge: 'MISSION 4 OF 5 • WORLD REALM',
    title: 'Universal Multi-Language & Currencies',
    subtitle: 'Global localization for gyms worldwide',
    icon: Globe,
    iconBg: '#F3E8FF',
    iconColor: '#7E22CE',
    description:
      'GymFlow speaks 13 global languages and formats all finances in 30+ world currencies.',
    buttonGuide: [
      {
        btnName: '🌐 APP LANGUAGE',
        actionDesc: 'Switch between English, Hindi (हिन्दी), Spanish, Arabic, etc., with 1 tap.',
      },
      {
        btnName: '🪙 DEFAULT CURRENCY',
        actionDesc: 'Set ₹ INR, $ USD, € EUR, £ GBP, AED, SAR, CAD, etc., for all revenue tracking.',
      },
    ],
    proTip: '💡 Pro Tip: Open Settings ⚙️ anytime to change your gym language, currency, or country code.',
  },
  {
    level: 5,
    badge: 'MISSION 5 OF 5 • SECURITY FORTRESS',
    title: 'Owner Security Lock & Offline Safety',
    subtitle: 'Zero data leakage, 100% offline privacy',
    icon: Shield,
    iconBg: '#FFE4E6',
    iconColor: '#E11D48',
    description:
      'Lock sensitive financial revenue charts and gym configurations with a 4-digit Master Owner PIN.',
    buttonGuide: [
      {
        btnName: '🔒 OWNER PIN',
        actionDesc: 'Locks financial analytics from front-desk staff or walk-in attendees.',
      },
      {
        btnName: '💾 EXPORT BACKUP',
        actionDesc: 'Exports complete encrypted backup files to your device storage.',
      },
    ],
    proTip: '💡 Pro Tip: Tap the header Lock icon anytime to seal GymFlow instantly.',
  },
];

export const GymFlowTutorialModal: React.FC<GymFlowTutorialModalProps> = ({
  visible,
  onClose,
  onNavigateToTab,
}) => {
  const { theme, settings, updateSettings } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  // Animated scale and bounce
  const bounceAnim = useRef(new Animated.Value(0.9)).current;
  const pulseHalo = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseHalo, {
            toValue: 1.15,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseHalo, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible, bounceAnim, pulseHalo]);

  const mission = MISSIONS[currentStep];
  const IconComp = mission.icon;

  const handleNext = () => {
    if (currentStep < MISSIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await updateSettings({ has_seen_tutorial: 1 });
    } catch {}
    onClose();
  };

  const progressPercent = ((currentStep + 1) / MISSIONS.length) * 100;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalBox,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              transform: [{ scale: bounceAnim }],
            },
            neoShadow(6, theme.border),
          ]}
        >
          {/* Game HUD Top Bar */}
          <View style={styles.hudTopBar}>
            <View
              style={[
                styles.hudBadge,
                { backgroundColor: theme.yellow, borderColor: theme.border },
                neoShadow(1, theme.border),
              ]}
            >
              <Trophy size={13} color="#18181B" strokeWidth={2.5} />
              <Text
                style={[
                  styles.hudBadgeText,
                  { color: '#18181B', fontFamily: FONT_BLACK },
                ]}
              >
                {mission.badge}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleComplete}
              style={[
                styles.closeBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              <X size={15} color={theme.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.xpBarWrapper}>
            <View
              style={[
                styles.xpBarTrack,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.xpBarFill,
                  { width: `${progressPercent}%`, backgroundColor: theme.primary },
                ]}
              />
            </View>
            <Text
              style={[
                styles.xpBarText,
                { color: theme.textMuted, fontFamily: FONT_EXTRABOLD },
              ]}
            >
              LEVEL PROGRESS: {Math.round(progressPercent)}%
            </Text>
          </View>

          {/* Spotlight Mission Icon */}
          <View style={styles.iconCenterWrap}>
            <Animated.View
              style={[
                styles.iconHalo,
                {
                  borderColor: theme.primary,
                  transform: [{ scale: pulseHalo }],
                },
              ]}
            />
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: mission.iconBg,
                  borderColor: theme.border,
                },
                neoShadow(3, theme.border),
              ]}
            >
              <IconComp size={34} color={mission.iconColor} strokeWidth={2.5} />
            </View>
          </View>

          {/* Mission Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text
              style={[
                styles.missionTitle,
                { color: theme.text, fontFamily: FONT_BLACK },
              ]}
            >
              {mission.title}
            </Text>
            <Text
              style={[
                styles.missionSubtitle,
                { color: theme.textMuted, fontFamily: FONT_REGULAR },
              ]}
            >
              {mission.subtitle}
            </Text>
          </View>

          {/* Mission Overview */}
          <Text
            style={[
              styles.missionDesc,
              { color: theme.text, fontFamily: FONT_REGULAR },
            ]}
          >
            {mission.description}
          </Text>

          {/* Interactive Button Guide Section */}
          <View
            style={[
              styles.guideCard,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.guideHeading,
                { color: theme.text, fontFamily: FONT_BLACK },
              ]}
            >
              🎮 WHAT BUTTONS DO IN THIS LEVEL:
            </Text>

            {mission.buttonGuide.map((item, idx) => (
              <View key={idx} style={styles.guideRow}>
                <View
                  style={[
                    styles.guideBtnTag,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    neoShadow(1, theme.border),
                  ]}
                >
                  <Text
                    style={[
                      styles.guideBtnTagText,
                      { color: theme.primary, fontFamily: FONT_BLACK },
                    ]}
                  >
                    {item.btnName}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.guideActionText,
                    { color: theme.text, fontFamily: FONT_REGULAR },
                  ]}
                >
                  {item.actionDesc}
                </Text>
              </View>
            ))}
          </View>

          {/* Pro Tip Box */}
          <View
            style={[
              styles.proTipBox,
              {
                backgroundColor: '#FEF08A',
                borderColor: theme.border,
              },
              neoShadow(1, theme.border),
            ]}
          >
            <Text
              style={[
                styles.proTipText,
                { color: '#854D0E', fontFamily: FONT_BOLD },
              ]}
            >
              {mission.proTip}
            </Text>
          </View>

          {/* Bottom Action Controls */}
          <View style={styles.footerControls}>
            {currentStep > 0 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePrev}
                style={[
                  styles.prevBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  neoShadow(2, theme.border),
                ]}
              >
                <ChevronLeft size={16} color={theme.text} strokeWidth={2.5} />
                <Text
                  style={[
                    styles.prevBtnText,
                    { color: theme.text, fontFamily: FONT_BLACK },
                  ]}
                >
                  BACK
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleNext}
              style={[
                styles.nextBtn,
                {
                  backgroundColor:
                    currentStep === MISSIONS.length - 1
                      ? theme.primary
                      : theme.yellow,
                  borderColor: theme.border,
                  flex: currentStep === 0 ? 2 : 1.5,
                },
                neoShadow(3, theme.border),
              ]}
            >
              <Text
                style={[
                  styles.nextBtnText,
                  {
                    color:
                      currentStep === MISSIONS.length - 1
                        ? '#FFFFFF'
                        : '#18181B',
                    fontFamily: FONT_BLACK,
                  },
                ]}
              >
                {currentStep === MISSIONS.length - 1
                  ? 'START TRAINING 🚀'
                  : 'NEXT MISSION ➡️'}
              </Text>
            </TouchableOpacity>
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
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 2.5,
    padding: 18,
  },
  hudTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  hudBadgeText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpBarWrapper: {
    marginBottom: 12,
  },
  xpBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpBarText: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'right',
  },
  iconCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    height: 70,
  },
  iconHalo: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    opacity: 0.35,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  missionTitle: {
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  missionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  missionDesc: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 10,
  },
  guideCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    marginBottom: 8,
    gap: 7,
  },
  guideHeading: {
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  guideRow: {
    gap: 3,
  },
  guideBtnTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  guideBtnTagText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  guideActionText: {
    fontSize: 11,
    lineHeight: 15,
  },
  proTipBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 9,
    marginBottom: 12,
  },
  proTipText: {
    fontSize: 11,
    lineHeight: 15,
  },
  footerControls: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  prevBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  prevBtnText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 2,
  },
  nextBtnText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
