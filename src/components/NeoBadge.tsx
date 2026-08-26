import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useApp } from '../context/AppContext';
import { FONT_BOLD } from '../theme';

interface NeoBadgeProps {
  label: string;
  variant?: 'paid' | 'due' | 'overdue' | 'active' | 'inactive' | 'pin' | 'qr' | 'plan' | 'neutral';
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export const NeoBadge: React.FC<NeoBadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  textStyle,
  size = 'md',
}) => {
  const { theme } = useApp();

  let bg = theme.surfaceSubtle;
  let textColor = theme.text;
  let borderColor = theme.border;

  switch (variant) {
    case 'paid':
      bg = '#DCFCE7';
      textColor = '#15803D';
      borderColor = '#16A34A';
      break;
    case 'due':
      bg = '#FEF08A';
      textColor = '#854D0E';
      borderColor = '#CA8A04';
      break;
    case 'overdue':
      bg = '#FEE2E2';
      textColor = '#991B1B';
      borderColor = '#DC2626';
      break;
    case 'active':
      bg = '#EEF2FF';
      textColor = theme.primary;
      borderColor = theme.primary;
      break;
    case 'inactive':
      bg = '#F3F4F6';
      textColor = '#6B7280';
      borderColor = '#9CA3AF';
      break;
    case 'pin':
      bg = '#E0F2FE';
      textColor = '#0369A1';
      borderColor = '#0284C7';
      break;
    case 'qr':
      bg = '#F3E8FF';
      textColor = '#7E22CE';
      borderColor = '#9333EA';
      break;
    case 'plan':
      bg = theme.yellow;
      textColor = '#18181B';
      borderColor = theme.border;
      break;
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 12,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: isSmall ? 10 : 12,
            fontFamily: FONT_BOLD,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1.5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});


