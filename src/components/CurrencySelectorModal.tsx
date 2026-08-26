import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Coins, Check, X, Search } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { SUPPORTED_CURRENCIES, CurrencyOption } from '../i18n';
import {
  neoShadow,
  FONT_FAMILY,
  FONT_BOLD,
  FONT_BLACK,
  FONT_EXTRABOLD,
  FONT_REGULAR,
} from '../theme';

interface CurrencySelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CurrencySelectorModal: React.FC<CurrencySelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme, settings, updateSettings, t } = useApp();
  const [search, setSearch] = useState('');

  const currentCurrency = settings.currency || 'INR';

  const filtered = SUPPORTED_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (curr: CurrencyOption) => {
    await updateSettings({
      currency: curr.code,
      subscription_currency: curr.code,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerBadge, { backgroundColor: theme.primaryLight }]}>
              <Coins size={20} color={theme.primary} />
            </View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {t('set_currency')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
          >
            <X size={20} color={theme.text} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: theme.surface, borderColor: theme.border },
              neoShadow(2, theme.border),
            ]}
          >
            <Search size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search currency by name or code..."
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Currency List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isSelected = item.code.toUpperCase() === currentCurrency.toUpperCase();
            return (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                activeOpacity={0.8}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                  neoShadow(isSelected ? 3 : 2, isSelected ? theme.primary : theme.border),
                ]}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.flagEmoji}>{item.flag}</Text>
                  <View>
                    <View style={styles.codeRow}>
                      <Text style={[styles.currCode, { color: theme.text }]}>{item.code}</Text>
                      <Text style={[styles.symbolPill, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
                        {item.symbol}
                      </Text>
                    </View>
                    <Text style={[styles.currName, { color: theme.textMuted }]}>{item.name}</Text>
                  </View>
                </View>

                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONT_BLACK,
    fontSize: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flagEmoji: {
    fontSize: 24,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currCode: {
    fontFamily: FONT_BLACK,
    fontSize: 15,
  },
  symbolPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    fontFamily: FONT_EXTRABOLD,
    fontSize: 11,
  },
  currName: {
    fontFamily: FONT_REGULAR,
    fontSize: 12,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
