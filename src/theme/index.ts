import { StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { ThemeColors } from '../types';

export const THEME_PRESETS = [
  { id: 'indigo', name: 'Electric Indigo', primary: '#4F46E5', accent: '#FACC15' },
  { id: 'crimson', name: 'Power Crimson', primary: '#E11D48', accent: '#F59E0B' },
  { id: 'emerald', name: 'Iron Emerald', primary: '#059669', accent: '#FBBF24' },
  { id: 'amber', name: 'Forge Amber', primary: '#D97706', accent: '#3B82F6' },
  { id: 'violet', name: 'Neon Violet', primary: '#7C3AED', accent: '#10B981' },
  { id: 'blue', name: 'Titan Blue', primary: '#2563EB', accent: '#F43F5E' },
  { id: 'cyan', name: 'Pulse Teal', primary: '#0D9488', accent: '#F43F5E' },
  { id: 'dark', name: 'Obsidian Black', primary: '#18181B', accent: '#FACC15' },
];

export const FONT_FAMILY = 'Poppins_500Medium';
export const FONT_REGULAR = 'Poppins_400Regular';
export const FONT_SEMIBOLD = 'Poppins_600SemiBold';
export const FONT_BOLD = 'Poppins_700Bold';
export const FONT_EXTRABOLD = 'Poppins_800ExtraBold';
export const FONT_BLACK = 'Poppins_900Black';

export const getTheme = (primaryColor: string = '#4F46E5'): ThemeColors => {
  return {
    primary: primaryColor,
    primaryLight: `${primaryColor}18`,
    primaryDark: primaryColor,
    background: '#F4F0E8',
    surface: '#FFFFFF',
    surfaceSubtle: '#EBE5D8',
    border: '#18181B',
    text: '#18181B',
    textMuted: '#52525B',
    coral: '#FB7185',
    yellow: '#FACC15',
    mint: '#10B981',
    red: '#EF4444',
    blue: '#3B82F6',
    cardShadow: '#18181B',
  };
};

export const neoShadow = (offset: number = 3, shadowColor: string = '#18181B'): ViewStyle => ({
  shadowColor,
  shadowOffset: { width: offset, height: offset },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 0,
});

export const typography = {
  h1: {
    fontFamily: FONT_BLACK,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FONT_BOLD,
    fontSize: 16,
    letterSpacing: 0.1,
  },
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyBold: {
    fontFamily: FONT_BOLD,
    fontSize: 14,
  },
  caption: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 12,
  },
  label: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
};

export const defaultTheme = getTheme('#4F46E5');

