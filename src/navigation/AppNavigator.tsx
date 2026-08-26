import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LayoutDashboard,
  QrCode,
  Users,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react-native';

import { useApp } from '../context/AppContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CheckInScreen } from '../screens/CheckInScreen';
import { MembersListScreen } from '../screens/MembersListScreen';
import { MemberDetailScreen } from '../screens/MemberDetailScreen';
import { AddEditMemberScreen } from '../screens/AddEditMemberScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AppLockModal } from '../components/AppLockModal';
import { neoShadow, FONT_FAMILY, FONT_EXTRABOLD, FONT_BOLD } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabNavigator() {
  const { theme, t } = useApp();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            borderTopWidth: 2,
          },
        ],
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: [styles.tabLabel, { fontFamily: FONT_FAMILY }],
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('tab_home'),
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={20} color={color} strokeWidth={2.5} />
          ),
        }}
      />

      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{
          tabBarLabel: t('tab_checkin'),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.centerTabBtn,
                {
                  backgroundColor: focused ? theme.yellow : theme.primary,
                  borderColor: theme.border,
                },
                neoShadow(2, theme.border),
              ]}
            >
              <QrCode
                size={20}
                color={focused ? '#18181B' : '#FFFFFF'}
                strokeWidth={2.5}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Members"
        component={MembersListScreen}
        options={{
          tabBarLabel: t('tab_members'),
          tabBarIcon: ({ color }) => (
            <Users size={20} color={color} strokeWidth={2.5} />
          ),
        }}
      />

      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: t('tab_reports'),
          tabBarIcon: ({ color }) => (
            <BarChart3 size={20} color={color} strokeWidth={2.5} />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('tab_settings'),
          tabBarIcon: ({ color }) => (
            <SettingsIcon size={20} color={color} strokeWidth={2.5} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isReady, settings, isLocked } = useApp();

  if (!isReady) {
    return null;
  }

  return (
    <>
      <NavigationContainer>
        {settings.onboarding_completed === 0 ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="MemberDetail"
              component={MemberDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="AddEditMember"
              component={AddEditMemberScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>

      {/* Global App Lock Screen when owner lock is enabled */}
      <AppLockModal visible={isLocked} />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: FONT_EXTRABOLD,
  },
  centerTabBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -12,
  },
});

