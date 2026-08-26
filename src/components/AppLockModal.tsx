import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Lock, ShieldCheck } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { PinKeypad } from './PinKeypad';
import { neoShadow, FONT_FAMILY, FONT_BOLD, FONT_BLACK, FONT_EXTRABOLD, FONT_REGULAR } from '../theme';

interface AppLockModalProps {
  visible: boolean;
  onSuccess?: () => void;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({ visible, onSuccess }) => {
  const { theme, unlockApp, settings } = useApp();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePinSubmit = async (enteredPin: string) => {
    const success = await unlockApp(enteredPin);
    if (success) {
      setPin('');
      setErrorMsg('');
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg('Incorrect Owner PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.container}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: theme.yellow,
                borderColor: theme.border,
              },
              neoShadow(3, theme.border),
            ]}
          >
            <Lock size={32} color={theme.text} strokeWidth={2.5} />
          </View>

          <Text style={[styles.gymTitle, { color: theme.primary, fontFamily: FONT_EXTRABOLD }]}>
            {settings.gym_name}
          </Text>
          <Text style={[styles.title, { color: theme.text, fontFamily: FONT_BLACK }]}>
            Owner Lock Protected
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
            Enter your 4-digit security PIN to access the manager dashboard & settings.
          </Text>

          {errorMsg ? (
            <View style={[styles.errorBox, { backgroundColor: '#FEE2E2', borderColor: theme.red }]}>
              <Text style={[styles.errorText, { color: theme.red, fontFamily: FONT_BOLD }]}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.keypadWrapper}>
            <PinKeypad
              pin={pin}
              onPinChange={(val) => {
                setErrorMsg('');
                setPin(val);
              }}
              onSubmit={handlePinSubmit}
              label=""
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  gymTitle: {
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 270,
    lineHeight: 18,
  },
  errorBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
  },
  keypadWrapper: {
    width: '100%',
    maxWidth: 300,
  },
});

