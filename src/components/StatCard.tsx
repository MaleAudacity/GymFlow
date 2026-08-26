import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useApp } from '../context/AppContext';
import { neoShadow, FONT_BOLD, FONT_BLACK, FONT_FAMILY } from '../theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  accentColor?: string;
  onPress?: () => void;
  index?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  accentColor,
  onPress,
  index = 0,
}) => {
  const { theme } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 14,
        bounciness: 6,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 25,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }).start();
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          minWidth: 140,
          margin: 5,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <CardComponent
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
          neoShadow(3, theme.border),
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textMuted, fontFamily: FONT_BOLD }]}>
            {title}
          </Text>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: iconBgColor || theme.yellow,
                borderColor: theme.border,
              },
            ]}
          >
            {icon}
          </View>
        </View>

        <Text
          style={[
            styles.value,
            { color: accentColor || theme.text, fontFamily: FONT_BLACK },
          ]}
        >
          {value}
        </Text>

        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { color: theme.textMuted, fontFamily: FONT_FAMILY },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </CardComponent>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    margin: 5,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 4,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});


