import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
  Animated,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { neoShadow, FONT_BOLD } from '../theme';

interface NeoButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'coral' | 'outline' | 'danger' | 'ghost' | 'plan';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { theme } = useApp();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  let bg = theme.primary;
  let textColor = '#FFFFFF';
  let borderColor = theme.border;
  let borderWidth = 2;

  switch (variant) {
    case 'primary':
      bg = theme.primary;
      textColor = '#FFFFFF';
      break;
    case 'secondary':
      bg = theme.surfaceSubtle;
      textColor = theme.text;
      break;
    case 'accent':
      bg = theme.yellow;
      textColor = '#18181B';
      break;
    case 'coral':
      bg = theme.coral;
      textColor = '#FFFFFF';
      break;
    case 'danger':
      bg = theme.red;
      textColor = '#FFFFFF';
      break;
    case 'outline':
      bg = theme.surface;
      textColor = theme.text;
      break;
    case 'plan':
      bg = theme.yellow;
      textColor = '#18181B';
      break;
    case 'ghost':
      bg = 'transparent';
      textColor = theme.text;
      borderWidth = 0;
      break;
  }

  let paddingVertical = 12;
  let paddingHorizontal = 18;
  let fontSize = 15;
  let borderRadius = 12;

  if (size === 'sm') {
    paddingVertical = 7;
    paddingHorizontal = 12;
    fontSize = 13;
    borderRadius = 10;
  } else if (size === 'lg') {
    paddingVertical = 15;
    paddingHorizontal = 24;
    fontSize = 17;
    borderRadius = 14;
  }

  const shadowOffset = variant === 'ghost' || disabled ? 0 : 3;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], alignSelf: fullWidth ? 'stretch' : 'auto' }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            backgroundColor: disabled ? '#D1D5DB' : bg,
            borderColor: disabled ? '#9CA3AF' : borderColor,
            borderWidth,
            paddingVertical,
            paddingHorizontal,
            borderRadius,
            alignSelf: fullWidth ? 'stretch' : 'auto',
          },
          neoShadow(shadowOffset, theme.border),
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
            <Text
              style={[
                styles.text,
                {
                  color: disabled ? '#6B7280' : textColor,
                  fontSize,
                  fontFamily: FONT_BOLD,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

