# 🏋️ GymFlow — Local-First Gym CRM & Front-Desk Reception Platform

<p align="center">
  <img src="assets/icon.png" width="140" height="140" alt="GymFlow Logo" />
</p>

<p align="center">
  <b>The modern, high-speed, local-first Gym CRM and Reception Check-In system designed for independent gym owners worldwide.</b>
</p>

---

## 🌟 Key Features

### 🏢 1. Front Desk & Reception Kiosk
- **4-Digit PIN Keypad**: Attendees punch in their personal PIN for instant check-in.
- **High-Speed QR Camera Scanner**: Scans member digital passes with real-time feedback.
- **Live Reception Feed**: Real-time attendee check-in ticker with 1-tap WhatsApp action buttons.

### 👥 2. Member & Subscription Management
- **Member Profiles**: Name, phone number, photo ID, validity date, and assigned membership plan.
- **Smart Filter Chips**: Filter members by `ALL`, `ACTIVE`, `DUE`, and `EXPIRING`.
- **VIP Digital Member Pass Cards**: Generates high-res visual passes with encrypted QR codes and 4-digit PINs.

### 💬 3. 1-Click WhatsApp Direct Automation
- **Official Payment Receipts**: Auto-formats and sends official payment receipts via WhatsApp.
- **Fee Due Notices**: Sends friendly fee due alerts with outstanding balance in your currency.
- **Pass Sharing**: Exports the complete VIP Member Card as a real PNG image file directly to WhatsApp.

### 🌍 4. Global Localization & Universal Currency
- **13 Global Languages**: English, Hindi (हिन्दी), Spanish (Español), French (Français), Arabic (العربية), German (Deutsch), Portuguese, Russian, Japanese, Korean, Chinese, Italian, and Turkish.
- **30+ World Currencies**: ₹ INR, $ USD, € EUR, £ GBP, AED, SAR, CAD, AUD, and more.
- **Country Dial Code Integration**: Automatic country dial code prefix for WhatsApp dispatch.

### 🎮 5. Animated Game Mission Tutorial
- **5-Level RPG-style Walkthrough**: Guides new gym owners through every feature with bouncy spring physics and button breakdown cards.
- **Always Accessible**: Replayable anytime from Home Screen header or Settings.

### 🔒 6. Privacy & Offline Security
- **100% Offline SQLite Architecture**: Zero cloud dependencies, zero data leakage.
- **Owner Security PIN Lock**: Protects sensitive financial reports and analytics from front-desk staff.
- **JSON & CSV Backups**: 1-tap full database export and roster spreadsheets.

---

## 🛠️ Tech Stack
- **Framework**: React Native & Expo (Bare Workflow / Android Native)
- **Database**: Local SQLite (`expo-sqlite`) in WAL mode
- **UI & Styling**: Neo-Brutalist Design System with Poppins & Fraunces Typography
- **Camera & Barcode**: `expo-camera`
- **Image & File Export**: `react-native-view-shot`, `expo-file-system`, `expo-sharing`
- **Icons**: `lucide-react-native`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Android SDK & JDK 21

### Installation
```bash
# Clone the repository
git clone https://github.com/MaleAudacity/GymFlow.git
cd GymFlow

# Install dependencies
npm install

# Run on Android
npx expo run:android
```

---

## 📄 License
This project is licensed under the MIT License.
