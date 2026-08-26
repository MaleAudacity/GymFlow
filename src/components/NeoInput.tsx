import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { neoShadow, FONT_FAMILY, FONT_BOLD, FONT_SEMIBOLD, FONT_REGULAR } from '../theme';

interface NeoInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const NeoInput: React.FC<NeoInputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  prefixIcon,
  suffixIcon,
  ...rest
}) => {
  const { theme } = useApp();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.text, fontFamily: FONT_BOLD }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.red : isFocused ? theme.primary : theme.border,
          },
          neoShadow(isFocused ? 2 : 1, theme.border),
        ]}
      >
        {prefixIcon && <View style={styles.prefix}>{prefixIcon}</View>}
        <TextInput
          placeholderTextColor="#9CA3AF"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            {
              color: theme.text,
              fontFamily: FONT_SEMIBOLD,
            },
            inputStyle,
          ]}
          {...rest}
        />
        {suffixIcon && <View style={styles.suffix}>{suffixIcon}</View>}
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: theme.red, fontFamily: FONT_BOLD }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  prefix: {
    marginRight: 8,
  },
  suffix: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});

