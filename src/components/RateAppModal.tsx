import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Star, Heart, MessageSquare, X, Check } from 'lucide-react-native';
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

interface RateAppModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RateAppModal: React.FC<RateAppModalProps> = ({ visible, onClose }) => {
  const { theme, t } = useApp();
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const handleOpenPlayStore = () => {
    const packageName = 'com.gymflow.app';
    const playStoreUri = `market://details?id=${packageName}`;
    const webUri = `https://play.google.com/store/apps/details?id=${packageName}`;

    Linking.canOpenURL(playStoreUri)
      .then((supported) => {
        if (supported) {
          Linking.openURL(playStoreUri);
        } else {
          Linking.openURL(webUri);
        }
      })
      .catch(() => {
        Linking.openURL(webUri);
      })
      .finally(() => {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 1200);
      });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.surface, borderColor: theme.border },
            neoShadow(5, theme.border),
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
          >
            <X size={18} color={theme.text} strokeWidth={2.5} />
          </TouchableOpacity>

          {submitted ? (
            <View style={styles.submittedContainer}>
              <View style={[styles.heartCircle, { backgroundColor: '#DEF7EC' }]}>
                <Check size={36} color="#059669" strokeWidth={3} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Thank You!</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Your feedback helps us continuously improve GymFlow for fitness studios worldwide.
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.heartCircle, { backgroundColor: theme.primaryLight }]}>
                <Heart size={32} color={theme.primary} fill={theme.primary} />
              </View>

              <Text style={[styles.title, { color: theme.text }]}>Enjoying GymFlow?</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Tap a star to rate your experience managing your gym and members.
              </Text>

              {/* 5 Stars */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                    style={styles.starBtn}
                  >
                    <Star
                      size={36}
                      color="#F59E0B"
                      fill={star <= rating ? '#F59E0B' : 'transparent'}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ width: '100%', marginTop: 24, gap: 10 }}>
                <NeoButton
                  title={rating >= 4 ? 'RATE ON PLAY STORE' : 'SUBMIT FEEDBACK'}
                  onPress={handleOpenPlayStore}
                  variant="primary"
                />
                <NeoButton
                  title="MAYBE LATER"
                  onPress={onClose}
                  variant="neutral"
                />
              </View>
            </>
          )}
        </View>
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
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 3,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heartCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONT_BLACK,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  starBtn: {
    padding: 4,
  },
  submittedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
