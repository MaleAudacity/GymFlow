import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useApp } from '../context/AppContext';
import { neoShadow } from '../theme';

interface NeoCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  borderColor?: string;
  shadowOffset?: number;
  borderRadius?: number;
  padding?: number;
}

export const NeoCard: React.FC<NeoCardProps> = ({
  children,
  style,
  backgroundColor,
  borderColor,
  shadowOffset = 3,
  borderRadius = 16,
  padding = 16,
}) => {
  const { theme } = useApp();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: backgroundColor || theme.surface,
          borderColor: borderColor || theme.border,
          borderRadius,
          padding,
        },
        neoShadow(shadowOffset, theme.border),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
  },
});

