import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  Crown,
  X,
  KeyRound,
  ShieldCheck,
  Zap,
  Users,
  QrCode,
  BarChart3,
  Lock,
  Download,
  CreditCard,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { NeoButton } from "./NeoButton";
import { NeoCard } from "./NeoCard";
import { NeoBadge } from "./NeoBadge";
import {
  neoShadow,
  FONT_FAMILY,
  FONT_BOLD,
  FONT_BLACK,
  FONT_EXTRABOLD,
  FONT_REGULAR,
  FONT_SEMIBOLD,
} from "../theme";

interface SubscriptionPaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

type CheckoutMethod = "google_play" | "upi" | "card";

export const SubscriptionPaywallModal: React.FC<SubscriptionPaywallModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme, subscription, subscribeToPlan, applyLicenseKey, formatPrice } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [step, setStep] = useState<"plans" | "checkout" | "success">("plans");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutMethod>("google_play");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  if (!visible) return null;

  const monthlyPrice = subscription?.price || 299;
  const yearlyPrice = Math.round(monthlyPrice * 8.5);
  const activePrice = selectedPlan === "yearly" ? yearlyPrice : monthlyPrice;
  const currency = subscription?.currency || "INR";

  const handleStartCheckout = () => {
    setStep("checkout");
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    const mockTxn = "TXN_GF_" + Date.now().toString().slice(-8);
    setTransactionId(mockTxn);

    // Simulate real gateway processing delay
    setTimeout(async () => {
      try {
        const months = selectedPlan === "yearly" ? 12 : 1;
        await subscribeToPlan(months, selectedPlan);
        setIsProcessing(false);
        setStep("success");
      } catch (e: any) {
        setIsProcessing(false);
        Alert.alert("Payment Error", e?.message || "Failed to process transaction.");
      }
    }, 1800);
  };

  const handleApplyKey = async () => {
    if (!licenseKeyInput.trim()) {
      Alert.alert("Required", "Please enter a valid activation license code.");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await applyLicenseKey(licenseKeyInput.trim());
      if (res.success) {
        Alert.alert("Success", res.message, [
          {
            text: "OK",
            onPress: () => {
              setLicenseKeyInput("");
              setShowKeyInput(false);
              onClose();
            },
          },
        ]);
      } else {
        Alert.alert("Invalid Key", res.message);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to verify license key.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalClose = () => {
    setStep("plans");
    setShowKeyInput(false);
    onClose();
  };

  const features = [
    {
      icon: <Users size={16} color={theme.primary} strokeWidth={2.5} />,
      title: "Unlimited Member Profiles",
      desc: "Add unlimited gym members with photo ID & plan details",
    },
    {
      icon: <QrCode size={16} color={theme.primary} strokeWidth={2.5} />,
      title: "Front-Desk PIN & QR Check-Ins",
      desc: "High-speed 4-digit keypad & camera barcode scanning",
    },
    {
      icon: <BarChart3 size={16} color={theme.primary} strokeWidth={2.5} />,
      title: "Attendance & Revenue Analytics",
      desc: "7-day traffic trend, peak hourly logs & membership charts",
    },
    {
      icon: <Download size={16} color={theme.primary} strokeWidth={2.5} />,
      title: "Roster CSV Export & Full Backups",
      desc: "Export member spreadsheets & complete JSON device backups",
    },
    {
      icon: <Lock size={16} color={theme.primary} strokeWidth={2.5} />,
      title: "Owner Security PIN App Lock",
      desc: "Secure sensitive financials from desk staff and visitors",
    },
    {
      icon: <ShieldCheck size={16} color={theme.primary} strokeWidth={2.5} />,
      title: "100% Offline & Zero Cloud Risk",
      desc: "All gym data stays encrypted on your device permanently",
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleModalClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
            neoShadow(6, theme.border),
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleModalClose}
            style={[
              styles.closeBtn,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <X size={16} color={theme.text} strokeWidth={2.5} />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* STEP 1: PLANS & PRICING */}
            {step === "plans" && (
              <>
                <View style={styles.headerBadgeWrapper}>
                  <View
                    style={[
                      styles.crownIconCircle,
                      { backgroundColor: theme.yellow, borderColor: theme.border },
                      neoShadow(3, theme.border),
                    ]}
                  >
                    <Crown size={28} color="#18181B" strokeWidth={2.5} />
                  </View>
                </View>

                <Text style={[styles.mainTitle, { color: theme.text, fontFamily: FONT_BLACK }]}>
                  GymFlow Pro
                </Text>
                <Text
                  style={[styles.subtitle, { color: theme.textMuted, fontFamily: FONT_REGULAR }]}
                >
                  The complete local-first Gym CRM & Front-Desk check-in platform.
                </Text>

                {/* Tier Selector */}
                <View style={styles.tierSelector}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setSelectedPlan("monthly")}
                    style={[
                      styles.tierCard,
                      {
                        backgroundColor:
                          selectedPlan === "monthly" ? "#EEF2FF" : theme.surface,
                        borderColor:
                          selectedPlan === "monthly" ? theme.primary : theme.border,
                      },
                      selectedPlan === "monthly"
                        ? neoShadow(3, theme.border)
                        : neoShadow(1, theme.border),
                    ]}
                  >
                    <View style={styles.tierTop}>
                      <Text
                        style={[
                          styles.tierName,
                          { color: theme.text, fontFamily: FONT_EXTRABOLD },
                        ]}
                      >
                        MONTHLY
                      </Text>
                      {selectedPlan === "monthly" && (
                        <NeoBadge label="POPULAR" variant="active" size="sm" />
                      )}
                    </View>
                    <View style={styles.priceRow}>
                      <Text
                        style={[
                          styles.currency,
                          { color: theme.text, fontFamily: FONT_BLACK },
                        ]}
                      >
                        {formatPrice(monthlyPrice).replace(/[0-9.,]/g, "")}
                      </Text>
                      <Text
                        style={[
                          styles.priceNumber,
                          { color: theme.text, fontFamily: FONT_BLACK },
                        ]}
                      >
                        {monthlyPrice}
                      </Text>
                      <Text
                        style={[
                          styles.perPeriod,
                          { color: theme.textMuted, fontFamily: FONT_BOLD },
                        ]}
                      >
                        / mo
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.tierSubtext,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      Billed monthly • Cancel anytime
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setSelectedPlan("yearly")}
                    style={[
                      styles.tierCard,
                      {
                        backgroundColor:
                          selectedPlan === "yearly" ? "#FEFCE8" : theme.surface,
                        borderColor:
                          selectedPlan === "yearly" ? "#CA8A04" : theme.border,
                      },
                      selectedPlan === "yearly"
                        ? neoShadow(3, theme.border)
                        : neoShadow(1, theme.border),
                    ]}
                  >
                    <View style={styles.tierTop}>
                      <Text
                        style={[
                          styles.tierName,
                          { color: theme.text, fontFamily: FONT_EXTRABOLD },
                        ]}
                      >
                        ANNUAL
                      </Text>
                      <NeoBadge label="SAVE 30%" variant="yellow" size="sm" />
                    </View>
                    <View style={styles.priceRow}>
                      <Text
                        style={[
                          styles.currency,
                          { color: theme.text, fontFamily: FONT_BLACK },
                        ]}
                      >
                        {formatPrice(yearlyPrice).replace(/[0-9.,]/g, "")}
                      </Text>
                      <Text
                        style={[
                          styles.priceNumber,
                          { color: theme.text, fontFamily: FONT_BLACK },
                        ]}
                      >
                        {yearlyPrice}
                      </Text>
                      <Text
                        style={[
                          styles.perPeriod,
                          { color: theme.textMuted, fontFamily: FONT_BOLD },
                        ]}
                      >
                        / yr
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.tierSubtext,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      {formatPrice(Math.round(yearlyPrice / 12))}/mo equivalent
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Features Included */}
                <View
                  style={[
                    styles.featureBox,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.featureBoxTitle,
                      { color: theme.text, fontFamily: FONT_BLACK },
                    ]}
                  >
                    EVERYTHING INCLUDED IN PRO:
                  </Text>
                  {features.map((f, i) => (
                    <View key={i} style={styles.featureItem}>
                      <View style={styles.featureIcon}>{f.icon}</View>
                      <View style={styles.featureTextCol}>
                        <Text
                          style={[
                            styles.featureItemTitle,
                            { color: theme.text, fontFamily: FONT_BOLD },
                          ]}
                        >
                          {f.title}
                        </Text>
                        <Text
                          style={[
                            styles.featureItemDesc,
                            { color: theme.textMuted, fontFamily: FONT_REGULAR },
                          ]}
                        >
                          {f.desc}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* CTA to Checkout */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleStartCheckout}
                  style={[
                    styles.subscribeBtn,
                    { backgroundColor: theme.primary, borderColor: theme.border },
                    neoShadow(4, theme.border),
                  ]}
                >
                  <Zap size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text
                    style={[
                      styles.subscribeBtnText,
                      { color: "#FFFFFF", fontFamily: FONT_BLACK },
                    ]}
                  >
                    PROCEED TO CHECKOUT • {formatPrice(activePrice)}
                  </Text>
                </TouchableOpacity>

                {/* License Key Link */}
                <View style={styles.keySection}>
                  {!showKeyInput ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowKeyInput(true)}
                      style={styles.haveKeyBtn}
                    >
                      <KeyRound size={14} color={theme.textMuted} />
                      <Text
                        style={[
                          styles.haveKeyText,
                          { color: theme.textMuted, fontFamily: FONT_BOLD },
                        ]}
                      >
                        Have an activation license key?
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={[
                        styles.keyInputBox,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.keyInputLabel,
                          { color: theme.text, fontFamily: FONT_BOLD },
                        ]}
                      >
                        ENTER LICENSE / ACTIVATION CODE:
                      </Text>
                      <TextInput
                        placeholder="e.g. GF-VIP-2026-XXXX"
                        placeholderTextColor="#9CA3AF"
                        value={licenseKeyInput}
                        onChangeText={setLicenseKeyInput}
                        autoCapitalize="characters"
                        style={[
                          styles.keyTextInput,
                          { color: theme.text, borderColor: theme.border },
                        ]}
                      />
                      <View style={styles.keyActionRow}>
                        <NeoButton
                          title="Cancel"
                          variant="neutral"
                          size="sm"
                          onPress={() => setShowKeyInput(false)}
                          style={{ flex: 1, marginRight: 6 }}
                        />
                        <NeoButton
                          title={isProcessing ? "Verifying..." : "Activate"}
                          variant="primary"
                          size="sm"
                          onPress={handleApplyKey}
                          disabled={isProcessing}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* STEP 2: PAYMENT CHECKOUT GATEWAY */}
            {step === "checkout" && (
              <View style={styles.checkoutContainer}>
                <View style={styles.checkoutHeader}>
                  <Text
                    style={[
                      styles.checkoutTitle,
                      { color: theme.text, fontFamily: FONT_BLACK },
                    ]}
                  >
                    Secure Checkout
                  </Text>
                  <Text
                    style={[
                      styles.checkoutSub,
                      { color: theme.textMuted, fontFamily: FONT_REGULAR },
                    ]}
                  >
                    Select your preferred payment method
                  </Text>
                </View>

                {/* Order Summary Box */}
                <View
                  style={[
                    styles.orderSummaryCard,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                    neoShadow(2, theme.border),
                  ]}
                >
                  <View style={styles.orderRow}>
                    <Text
                      style={[
                        styles.orderLabel,
                        { color: theme.text, fontFamily: FONT_BOLD },
                      ]}
                    >
                      GymFlow Pro ({selectedPlan.toUpperCase()})
                    </Text>
                    <Text
                      style={[
                        styles.orderVal,
                        { color: theme.text, fontFamily: FONT_BLACK },
                      ]}
                    >
                      {formatPrice(activePrice)}
                    </Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text
                      style={[
                        styles.orderSubLabel,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      Duration: {selectedPlan === "yearly" ? "12 Months" : "1 Month"}
                    </Text>
                    <Text
                      style={[
                        styles.orderSubLabel,
                        { color: "#15803D", fontFamily: FONT_BOLD },
                      ]}
                    >
                      Taxes Included
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.orderDivider,
                      { backgroundColor: theme.border },
                    ]}
                  />
                  <View style={styles.orderTotalRow}>
                    <Text
                      style={[
                        styles.totalLabel,
                        { color: theme.text, fontFamily: FONT_BLACK },
                      ]}
                    >
                      TOTAL PAYABLE:
                    </Text>
                    <Text
                      style={[
                        styles.totalVal,
                        { color: theme.primary, fontFamily: FONT_BLACK },
                      ]}
                    >
                      {formatPrice(activePrice)}
                    </Text>
                  </View>
                </View>

                {/* Payment Methods */}
                <Text
                  style={[
                    styles.paymentMethodHeading,
                    { color: theme.textMuted, fontFamily: FONT_EXTRABOLD },
                  ]}
                >
                  SELECT PAYMENT GATEWAY:
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setPaymentMethod("google_play")}
                  style={[
                    styles.methodOption,
                    {
                      backgroundColor:
                        paymentMethod === "google_play"
                          ? "#DCFCE7"
                          : theme.surface,
                      borderColor:
                        paymentMethod === "google_play"
                          ? "#15803D"
                          : theme.border,
                    },
                    paymentMethod === "google_play"
                      ? neoShadow(2, theme.border)
                      : null,
                  ]}
                >
                  <Smartphone size={20} color="#15803D" strokeWidth={2.5} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.methodTitle,
                        { color: theme.text, fontFamily: FONT_BOLD },
                      ]}
                    >
                      Google Play In-App Billing
                    </Text>
                    <Text
                      style={[
                        styles.methodSub,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      One-tap official Play Store payment & subscriptions
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      paymentMethod === "google_play" && {
                        backgroundColor: "#15803D",
                      },
                    ]}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setPaymentMethod("upi")}
                  style={[
                    styles.methodOption,
                    {
                      backgroundColor:
                        paymentMethod === "upi" ? "#FEF08A" : theme.surface,
                      borderColor:
                        paymentMethod === "upi" ? "#854D0E" : theme.border,
                    },
                    paymentMethod === "upi"
                      ? neoShadow(2, theme.border)
                      : null,
                  ]}
                >
                  <Zap size={20} color="#854D0E" strokeWidth={2.5} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.methodTitle,
                        { color: theme.text, fontFamily: FONT_BOLD },
                      ]}
                    >
                      UPI / GPay / PhonePe / Paytm
                    </Text>
                    <Text
                      style={[
                        styles.methodSub,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      Instant UPI QR & App Direct Transfer
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      paymentMethod === "upi" && {
                        backgroundColor: "#854D0E",
                      },
                    ]}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setPaymentMethod("card")}
                  style={[
                    styles.methodOption,
                    {
                      backgroundColor:
                        paymentMethod === "card" ? "#EEF2FF" : theme.surface,
                      borderColor:
                        paymentMethod === "card" ? theme.primary : theme.border,
                    },
                    paymentMethod === "card"
                      ? neoShadow(2, theme.border)
                      : null,
                  ]}
                >
                  <CreditCard
                    size={20}
                    color={theme.primary}
                    strokeWidth={2.5}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.methodTitle,
                        { color: theme.text, fontFamily: FONT_BOLD },
                      ]}
                    >
                      Credit / Debit Card / Net Banking
                    </Text>
                    <Text
                      style={[
                        styles.methodSub,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      Visa, Mastercard, RuPay & International Cards
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      paymentMethod === "card" && {
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                </TouchableOpacity>

                {/* Confirm Pay Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleConfirmPayment}
                  disabled={isProcessing}
                  style={[
                    styles.confirmPayBtn,
                    {
                      backgroundColor: theme.yellow,
                      borderColor: theme.border,
                    },
                    neoShadow(3, theme.border),
                  ]}
                >
                  {isProcessing ? (
                    <View style={styles.procRow}>
                      <ActivityIndicator size="small" color="#18181B" />
                      <Text
                        style={[
                          styles.confirmPayBtnText,
                          { fontFamily: FONT_BLACK },
                        ]}
                      >
                        PROCESSING TRANSACTION...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <ShieldCheck size={18} color="#18181B" strokeWidth={2.5} />
                      <Text
                        style={[
                          styles.confirmPayBtnText,
                          { fontFamily: FONT_BLACK },
                        ]}
                      >
                        PAY {formatPrice(activePrice)} NOW
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setStep("plans")}
                  style={styles.backToPlansBtn}
                >
                  <Text
                    style={[
                      styles.backToPlansText,
                      { color: theme.textMuted, fontFamily: FONT_BOLD },
                    ]}
                  >
                    ← Change Membership Plan
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: PAYMENT SUCCESS RECEIPT */}
            {step === "success" && (
              <View style={styles.successContainer}>
                <View
                  style={[
                    styles.successIconCircle,
                    { backgroundColor: "#DCFCE7", borderColor: "#15803D" },
                    neoShadow(3, theme.border),
                  ]}
                >
                  <CheckCircle2 size={36} color="#15803D" strokeWidth={2.5} />
                </View>

                <Text
                  style={[
                    styles.successTitle,
                    { color: theme.text, fontFamily: FONT_BLACK },
                  ]}
                >
                  Payment Successful!
                </Text>
                <Text
                  style={[
                    styles.successSub,
                    { color: theme.textMuted, fontFamily: FONT_REGULAR },
                  ]}
                >
                  Your GymFlow Pro subscription is now officially active.
                </Text>

                {/* Receipt Card */}
                <View
                  style={[
                    styles.receiptCard,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                    neoShadow(2, theme.border),
                  ]}
                >
                  <View style={styles.receiptRow}>
                    <Text
                      style={[
                        styles.receiptLabel,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      Order Status
                    </Text>
                    <Text
                      style={[
                        styles.receiptVal,
                        { color: "#15803D", fontFamily: FONT_BLACK },
                      ]}
                    >
                      PAID IN FULL
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text
                      style={[
                        styles.receiptLabel,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      Plan Activated
                    </Text>
                    <Text
                      style={[
                        styles.receiptVal,
                        { color: theme.text, fontFamily: FONT_BOLD },
                      ]}
                    >
                      Pro ({selectedPlan.toUpperCase()})
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text
                      style={[
                        styles.receiptLabel,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      Amount Paid
                    </Text>
                    <Text
                      style={[
                        styles.receiptVal,
                        { color: theme.text, fontFamily: FONT_BLACK },
                      ]}
                    >
                      {formatPrice(activePrice)}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text
                      style={[
                        styles.receiptLabel,
                        { color: theme.textMuted, fontFamily: FONT_REGULAR },
                      ]}
                    >
                      Transaction ID
                    </Text>
                    <Text
                      style={[
                        styles.receiptVal,
                        { color: theme.primary, fontFamily: FONT_EXTRABOLD },
                      ]}
                    >
                      {transactionId}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleModalClose}
                  style={[
                    styles.doneBtn,
                    { backgroundColor: theme.primary, borderColor: theme.border },
                    neoShadow(3, theme.border),
                  ]}
                >
                  <Text
                    style={[
                      styles.doneBtnText,
                      { color: "#FFFFFF", fontFamily: FONT_BLACK },
                    ]}
                  >
                    CONTINUE TO DASHBOARD 🚀
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text
              style={[
                styles.guaranteeNote,
                { color: theme.textMuted, fontFamily: FONT_REGULAR },
              ]}
            >
              🔒 100% Offline Encrypted Storage • Local-First Architecture
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "92%",
    borderWidth: 2.5,
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollBody: {
    padding: 18,
    paddingTop: 20,
    alignItems: "center",
  },
  headerBadgeWrapper: {
    marginBottom: 8,
  },
  crownIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 3,
    marginBottom: 14,
    lineHeight: 15,
    paddingHorizontal: 8,
  },
  tierSelector: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 14,
  },
  tierCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    padding: 10,
  },
  tierTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  tierName: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginVertical: 2,
  },
  currency: {
    fontSize: 14,
  },
  priceNumber: {
    fontSize: 20,
  },
  perPeriod: {
    fontSize: 11,
    marginLeft: 2,
  },
  tierSubtext: {
    fontSize: 9,
    marginTop: 2,
  },
  featureBox: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  featureBoxTitle: {
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  featureIcon: {
    marginTop: 1,
  },
  featureTextCol: {
    flex: 1,
  },
  featureItemTitle: {
    fontSize: 12,
  },
  featureItemDesc: {
    fontSize: 10,
    lineHeight: 13,
  },
  subscribeBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    gap: 6,
    marginBottom: 10,
  },
  subscribeBtnText: {
    fontSize: 13,
    letterSpacing: 0.4,
  },
  keySection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  haveKeyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  haveKeyText: {
    fontSize: 11,
    textDecorationLine: "underline",
  },
  keyInputBox: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
  },
  keyInputLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  keyTextInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: FONT_BOLD,
    marginBottom: 6,
  },
  keyActionRow: {
    flexDirection: "row",
  },
  checkoutContainer: {
    width: "100%",
    alignItems: "center",
  },
  checkoutHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  checkoutTitle: {
    fontSize: 20,
  },
  checkoutSub: {
    fontSize: 11,
    marginTop: 2,
  },
  orderSummaryCard: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  orderLabel: {
    fontSize: 12,
  },
  orderVal: {
    fontSize: 14,
  },
  orderSubLabel: {
    fontSize: 10,
  },
  orderDivider: {
    height: 1,
    marginVertical: 8,
  },
  orderTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
  },
  totalVal: {
    fontSize: 16,
  },
  paymentMethodHeading: {
    alignSelf: "flex-start",
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  methodOption: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  methodTitle: {
    fontSize: 12,
  },
  methodSub: {
    fontSize: 10,
    marginTop: 1,
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#18181B",
  },
  confirmPayBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  confirmPayBtnText: {
    color: "#18181B",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  procRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backToPlansBtn: {
    paddingVertical: 6,
  },
  backToPlansText: {
    fontSize: 11,
  },
  successContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    textAlign: "center",
  },
  successSub: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 14,
  },
  receiptCard: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    fontSize: 11,
  },
  receiptVal: {
    fontSize: 12,
  },
  doneBtn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  doneBtnText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  guaranteeNote: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
});
