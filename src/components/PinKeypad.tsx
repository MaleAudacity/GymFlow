import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Animated } from 'react-native';
import { Delete, X } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { neoShadow, FONT_BOLD, FONT_BLACK, FONT_EXTRABOLD, FONT_REGULAR } from '../theme';

interface PinKeypadProps {
  pin: string;
  onPinChange: (newPin: string) => void;
  onSubmit?: (pin: string) => void;
  maxLength?: number;
  label?: string;
  style?: ViewStyle;
}

const AnimatedKey: React.FC<{
  val: string | React.ReactNode;
  onPress: () => void;
  isSpecial?: boolean;
  theme: any;
}> = ({ val, onPress, isSpecial = false, theme }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.key,
          {
            backgroundColor: isSpecial ? theme.surfaceSubtle : theme.surface,
            borderColor: theme.border,
          },
          neoShadow(2, theme.border),
        ]}
      >
        {typeof val === 'string' ? (
          <Text style={[styles.keyText, { color: theme.text, fontFamily: FONT_BLACK }]}>{val}</Text>
        ) : (
          val
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const PinKeypad: React.FC<PinKeypadProps> = ({
  pin,
  onPinChange,
  onSubmit,
  maxLength = 4,
  label = 'ENTER MEMBER PIN',
  style,
}) => {
  const { theme } = useApp();

  const handleDigitPress = (digit: string) => {
    if (pin.length < maxLength) {
      const nextPin = pin + digit;
      onPinChange(nextPin);
      if (nextPin.length === maxLength && onSubmit) {
        onSubmit(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      onPinChange(pin.slice(0, -1));
    }
  };

  const handleClear = () => {
    onPinChange('');
  };

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={[styles.label, { color: theme.textMuted, fontFamily: FONT_EXTRABOLD }]}>
          {label}
        </Text>
      ) : null}

      {/* PIN Dots / Digit Boxes Display */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: maxLength }).map((_, index) => {
          const isFilled = index < pin.length;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  borderColor: theme.border,
                  backgroundColor: isFilled ? theme.primary : theme.surfaceSubtle,
                },
                neoShadow(isFilled ? 2 : 1, theme.border),
              ]}
            >
              {isFilled ? (
                <Text style={[styles.digitTextInDot, { fontFamily: FONT_BLACK }]}>
                  {pin[index]}
                </Text>
              ) : (
                <View style={[styles.emptyDotIndicator, { backgroundColor: theme.border }]} />
              )}
            </View>
          );
        })}
      </View>

      {/* Numeric Grid */}
      <View style={styles.grid}>
        <View style={styles.row}>
          <AnimatedKey val="1" onPress={() => handleDigitPress('1')} theme={theme} />
          <AnimatedKey val="2" onPress={() => handleDigitPress('2')} theme={theme} />
          <AnimatedKey val="3" onPress={() => handleDigitPress('3')} theme={theme} />
        </View>
        <View style={styles.row}>
          <AnimatedKey val="4" onPress={() => handleDigitPress('4')} theme={theme} />
          <AnimatedKey val="5" onPress={() => handleDigitPress('5')} theme={theme} />
          <AnimatedKey val="6" onPress={() => handleDigitPress('6')} theme={theme} />
        </View>
        <View style={styles.row}>
          <AnimatedKey val="7" onPress={() => handleDigitPress('7')} theme={theme} />
          <AnimatedKey val="8" onPress={() => handleDigitPress('8')} theme={theme} />
          <AnimatedKey val="9" onPress={() => handleDigitPress('9')} theme={theme} />
        </View>
        <View style={styles.row}>
          <AnimatedKey
            val={<X size={20} color={theme.text} strokeWidth={2.5} />}
            onPress={handleClear}
            isSpecial
            theme={theme}
          />
          <AnimatedKey val="0" onPress={() => handleDigitPress('0')} theme={theme} />
          <AnimatedKey
            val={<Delete size={20} color={theme.text} strokeWidth={2.5} />}
            onPress={handleBackspace}
            isSpecial
            theme={theme}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  dot: {
    width: 44,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitTextInDot: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  emptyDotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.3,
  },
  grid: {
    width: '100%',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  key: {
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 20,
  },
});
