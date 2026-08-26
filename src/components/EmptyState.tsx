import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useApp } from '../context/AppContext';
import { NeoCard } from './NeoCard';
import { NeoButton } from './NeoButton';
import { FONT_BLACK, FONT_REGULAR } from '../theme';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  buttonTitle,
  onButtonPress,
  style,
}) => {
  const { theme } = useApp();

  return (
    <NeoCard style={[styles.container, style]} shadowOffset={3}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.yellow,
            borderColor: theme.border,
          },
        ]}
      >
        {icon}
      </View>
      <Text style={[styles.title, { color: theme.text, fontFamily: FONT_BLACK }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
        {description}
      </Text>
      {buttonTitle && onButtonPress && (
        <NeoButton
          title={buttonTitle}
          onPress={onButtonPress}
          variant="primary"
          size="md"
          style={{ marginTop: 14 }}
        />
      )}
    </NeoCard>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 22,
    marginVertical: 10,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 250,
  },
});

