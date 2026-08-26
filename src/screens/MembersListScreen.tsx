import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
  Platform,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  UserPlus,
  User,
  Phone,
  Key,
  X,
  ChevronRight,
  Sparkles,
  Users,
  AlertCircle,
  MessageSquare,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoCard } from '../components/NeoCard';
import { NeoBadge } from '../components/NeoBadge';
import { NeoButton } from '../components/NeoButton';
import { EmptyState } from '../components/EmptyState';
import { WhatsAppDispatchModal } from '../components/WhatsAppDispatchModal';
import { getAllMembers } from '../database/db';
import { Member } from '../types';
import {
  neoShadow,
  FONT_FAMILY,
  FONT_BOLD,
  FONT_BLACK,
  FONT_EXTRABOLD,
  FONT_REGULAR,
} from '../theme';

interface MembersListScreenProps {
  navigation: any;
  route?: any;
}

export const MembersListScreen: React.FC<MembersListScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const topInset =
    Math.max(insets.top, StatusBar.currentHeight || 0) +
    (Platform.OS === 'android' ? 8 : 0);
  const { theme, members, refreshMembers, t, formatPrice } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>(route?.params?.filter || 'all');
  const [filteredList, setFilteredList] = useState<Member[]>(members);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [whatsAppModalVisible, setWhatsAppModalVisible] = useState(false);

  const filterChips = [
    { id: 'all', label: t('mem_filter_all') },
    { id: 'paid', label: t('mem_filter_paid') },
    { id: 'due', label: t('mem_filter_due') },
    { id: 'overdue', label: t('mem_filter_overdue') },
    { id: 'expiring', label: t('mem_filter_expiring') },
    { id: 'inactive', label: 'INACTIVE' },
  ];

  const applyFilter = useCallback(async () => {
    let result = await getAllMembers(
      search,
      filter === 'expiring' ? 'active' : filter
    );
    if (filter === 'expiring') {
      result = result.filter(
        (m) =>
          m.days_left !== undefined && m.days_left >= 0 && m.days_left <= 7
      );
    }
    setFilteredList(result);
  }, [search, filter]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter, members]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMembers();
    setRefreshing(false);
  };

  const renderMemberItem = ({ item }: { item: Member }) => {
    const isInactive = item.active === 0;

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('MemberDetail', { memberId: item.id })
        }
        style={[
          styles.memberCard,
          {
            backgroundColor: isInactive ? '#FAFAF9' : theme.surface,
            borderColor: isInactive ? '#D6D3D1' : theme.border,
            opacity: isInactive ? 0.8 : 1,
          },
          neoShadow(isInactive ? 1 : 2, theme.border),
        ]}
      >
        <View style={styles.cardContent}>
          {/* Avatar Squircle */}
          {item.photo_uri ? (
            <Image source={{ uri: item.photo_uri }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                {
                  backgroundColor: isInactive
                    ? '#E7E5E4'
                    : theme.primaryLight,
                  borderColor: theme.border,
                },
              ]}
            >
              <User
                size={22}
                color={isInactive ? '#78716C' : theme.primary}
                strokeWidth={2.5}
              />
            </View>
          )}

          {/* Member Details Column */}
          <View style={styles.memberInfoCol}>
            {/* Name and Inactive Badge */}
            <View style={styles.nameRow}>
              <Text
                style={[
                  styles.memberName,
                  { color: theme.text, fontFamily: FONT_BLACK },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {isInactive && (
                <NeoBadge label="INACTIVE" variant="inactive" size="sm" />
              )}
            </View>

            {/* Phone Number & PIN Tag */}
            <View style={styles.metaRow}>
              <View style={styles.phoneTag}>
                <Phone size={11} color={theme.textMuted} strokeWidth={2} />
                <Text
                  style={[
                    styles.phoneText,
                    { color: theme.textMuted, fontFamily: FONT_REGULAR },
                  ]}
                >
                  {item.phone}
                </Text>
              </View>

              <View
                style={[
                  styles.pinTag,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Key size={10} color={theme.primary} strokeWidth={2.5} />
                <Text
                  style={[
                    styles.pinText,
                    { color: theme.primary, fontFamily: FONT_EXTRABOLD },
                  ]}
                >
                  {item.pin_code}
                </Text>
              </View>
            </View>

            {/* Plan and Status Badges */}
            <View style={styles.badgesWrap}>
              {item.plan_name ? (
                <View
                  style={[
                    styles.planBadge,
                    {
                      backgroundColor: theme.yellowLight,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.planBadgeText,
                      { color: '#854D0E', fontFamily: FONT_EXTRABOLD },
                    ]}
                  >
                    {item.plan_name}
                  </Text>
                </View>
              ) : null}

              <NeoBadge
                label={item.fee_status.toUpperCase()}
                variant={item.fee_status}
                size="sm"
              />

              {item.is_expired ? (
                <NeoBadge
                  label={t('mem_expired')}
                  variant="overdue"
                  size="sm"
                />
              ) : item.days_left !== undefined && item.days_left <= 7 ? (
                <NeoBadge
                  label={t('mem_days_left', { days: item.days_left })}
                  variant="due"
                  size="sm"
                />
              ) : null}
            </View>
          </View>

          {/* Right Action Icons */}
          <View style={styles.cardRightActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMember(item);
                setWhatsAppModalVisible(true);
              }}
              style={[
                styles.waQuickBtn,
                { backgroundColor: '#DCFCE7', borderColor: '#15803D' },
              ]}
            >
              <MessageSquare size={13} color="#15803D" strokeWidth={2.5} />
            </TouchableOpacity>

            <View
              style={[
                styles.chevronCircle,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                },
              ]}
            >
              <ChevronRight
                size={16}
                color={theme.textMuted}
                strokeWidth={2.5}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: theme.background, paddingTop: topInset },
      ]}
    >
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={[
              styles.title,
              { color: theme.text, fontFamily: FONT_BLACK },
            ]}
          >
            {t('mem_title')}
          </Text>
          <View
            style={[
              styles.countPill,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
              neoShadow(1, theme.border),
            ]}
          >
            <Text
              style={[
                styles.countText,
                { color: theme.primary, fontFamily: FONT_BLACK },
              ]}
            >
              {filteredList.length}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddEditMember')}
          style={[
            styles.addMemberBtn,
            { backgroundColor: theme.primary, borderColor: theme.border },
            neoShadow(2, theme.border),
          ]}
        >
          <UserPlus size={15} color="#FFFFFF" strokeWidth={2.5} />
          <Text
            style={[
              styles.addMemberBtnText,
              { fontFamily: FONT_EXTRABOLD },
            ]}
          >
            {t('mem_add_btn')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Neo Search Input Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
            neoShadow(2, theme.border),
          ]}
        >
          <Search size={18} color={theme.textMuted} strokeWidth={2.5} />
          <TextInput
            placeholder={t('mem_search_placeholder')}
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            style={[
              styles.searchInput,
              { color: theme.text, fontFamily: FONT_REGULAR },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              style={styles.clearSearchBtn}
            >
              <X size={16} color={theme.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 3. Filter Chips Carousel */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filterChips.map((chip) => {
            const isSelected = filter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                activeOpacity={0.8}
                onPress={() => setFilter(chip.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.yellow : theme.surface,
                    borderColor: theme.border,
                  },
                  neoShadow(isSelected ? 2 : 1, theme.border),
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? '#18181B' : theme.textMuted,
                      fontFamily: isSelected ? FONT_BLACK : FONT_BOLD,
                    },
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Members List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMemberItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Users size={32} color={theme.text} strokeWidth={2} />}
            title={
              search ? t('mem_no_members_found') : t('mem_empty_title')
            }
            description={
              search
                ? `No members found matching "${search}". Try searching another name, phone, or PIN.`
                : t('mem_empty_subtitle')
            }
            buttonTitle={search ? undefined : t('mem_add_btn')}
            onButtonPress={
              search ? undefined : () => navigation.navigate('AddEditMember')
            }
          />
        }
      />

      {/* WhatsApp Dispatch Hub Modal */}
      <WhatsAppDispatchModal
        visible={whatsAppModalVisible}
        member={selectedMember}
        onClose={() => {
          setWhatsAppModalVisible(false);
          setSelectedMember(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    letterSpacing: -0.4,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  countText: {
    fontSize: 12,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
  },
  addMemberBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filtersWrapper: {
    marginBottom: 10,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  filterChipText: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
    gap: 12,
  },
  memberCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#18181B',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfoCol: {
    marginLeft: 12,
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
  },
  pinTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  pinText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  planBadgeText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  cardRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  waQuickBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
