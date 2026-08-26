import { Linking, Share, Alert } from 'react-native';
import { Member, GymSettings } from '../types';
import { getCountryByCode, formatCurrency } from '../i18n';

/**
 * Clean and format phone number with gym country dial code
 */
export const getCleanPhoneNumber = (phone: string, countryCode: string = 'IN'): string => {
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  const country = getCountryByCode(countryCode);
  const dialDigits = country.dialCode.replace(/[^0-9]/g, '');

  if (digitsOnly.startsWith(dialDigits)) {
    return digitsOnly;
  }
  return `${dialDigits}${digitsOnly}`;
};

/**
 * Open WhatsApp with pre-filled message
 */
export const openWhatsApp = async (phone: string, message: string, countryCode: string = 'IN'): Promise<void> => {
  if (!phone || !phone.trim()) {
    Alert.alert('No Phone Number', 'This member does not have a contact phone number.');
    return;
  }

  const cleanPhone = getCleanPhoneNumber(phone, countryCode);
  const encodedText = encodeURIComponent(message);
  const nativeUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
  const webUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  try {
    const canOpen = await Linking.canOpenURL(nativeUrl);
    if (canOpen) {
      await Linking.openURL(nativeUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (err) {
    try {
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert('Error', 'Could not open WhatsApp on this device.');
    }
  }
};

/**
 * 1-Click WhatsApp Official Membership Receipt
 */
export const sendWhatsAppReceipt = async (
  member: Member,
  settings: GymSettings
): Promise<void> => {
  const priceFormatted = formatCurrency(member.plan_price || 0, settings.currency || 'INR');
  const gymTitle = (settings.gym_name || 'GymFlow Fitness').toUpperCase();

  const msg =
    `🏋️ *${gymTitle} — PAYMENT RECEIPT*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Member Name:* ${member.name}\n` +
    `📋 *Membership Plan:* ${member.plan_name || 'Standard Plan'}\n` +
    `💰 *Fee Amount:* ${priceFormatted}\n` +
    `🔑 *Your Check-In PIN:* ${member.pin_code}\n` +
    `📅 *Join Date:* ${member.join_date}\n` +
    `💳 *Payment Status:* ✅ PAID IN FULL\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `_Thank you for choosing ${settings.gym_name}! You can check in at the front desk using your 4-digit PIN or QR pass._\n\n` +
    `📞 *Gym Contact:* ${settings.phone || 'Front Desk'}`;

  await openWhatsApp(member.phone, msg, settings.country || 'IN');
};

/**
 * 1-Click WhatsApp Fee Due / Expiry Reminder
 */
export const sendWhatsAppDueReminder = async (
  member: Member,
  settings: GymSettings
): Promise<void> => {
  const priceFormatted = formatCurrency(member.plan_price || 0, settings.currency || 'INR');
  const gymTitle = (settings.gym_name || 'GymFlow Fitness').toUpperCase();

  const msg =
    `⚠️ *${gymTitle} — MEMBERSHIP FEE NOTICE*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Dear *${member.name}*,\n\n` +
    `This is a friendly reminder from *${settings.gym_name}* regarding your membership fee.\n\n` +
    `📋 *Assigned Plan:* ${member.plan_name || 'Gym Membership'}\n` +
    `💰 *Amount Due:* ${priceFormatted}\n` +
    `🔑 *Member PIN:* ${member.pin_code}\n` +
    `📌 *Current Status:* ${member.is_expired ? '⛔ EXPIRED' : '⚠️ PAYMENT DUE'}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Please clear your membership dues at the front desk to continue seamless access to the gym.\n\n` +
    `_Have questions or need assistance? Reply to this chat or visit the reception._\n` +
    `💪 *Stay fit with ${settings.gym_name}!*`;

  await openWhatsApp(member.phone, msg, settings.country || 'IN');
};

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Share Member QR Pass as an actual PNG image file
 */
export const shareQRCodeAsImage = async (
  member: Member,
  settings: GymSettings,
  base64PngData: string
): Promise<void> => {
  try {
    const cleanName = member.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `gym_pass_${cleanName}_${member.pin_code}.png`;
    const filePath = `${FileSystem.cacheDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(filePath, base64PngData, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'image/png',
        dialogTitle: `${member.name}'s QR Pass — ${settings.gym_name}`,
        UTI: 'public.png',
      });
    } else {
      Alert.alert('Notice', 'File sharing is not available on this device.');
    }
  } catch (e: any) {
    Alert.alert('Share Failed', e?.message || 'Could not export QR code image.');
  }
};
