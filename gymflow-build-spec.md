# GymFlow — Gym CRM App: Build Spec & Antigravity Prompt

## 1. What this app is
A white-label gym management app. One codebase, installed independently by each
gym owner. Each install holds only that gym's data, stored locally on the
owner's phone — no shared backend, no cloud sync, no cross-gym data ever mixes.
The owner customizes branding (name, logo, theme color) on first launch, adds
members, and members check in via PIN or QR code on the owner's phone at the
front desk.

## 2. Core user flows

**Owner (primary user, uses the app daily)**
- First-time setup: gym name, logo, theme color, membership plans, working hours
- Register a member: name, phone, photo, plan, join date, fee status
- Generate a unique PIN or QR code per member at registration
- Check in a member: PIN keypad entry OR scan member's QR (member shows QR on
  their own phone or a printed card)
- Dashboard: today's check-ins, active/expiring memberships, revenue snapshot
- Reports: attendance history per member, monthly attendance trends
- Manage plans/pricing, mark fees paid/due

**Member (interacts briefly, no login of their own)**
- Shown their PIN or QR code at signup (printed card or screenshot)
- At the gym: enters PIN on owner's phone, or shows QR to be scanned

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React Native + Expo | Single codebase → Android + iOS |
| Local database | expo-sqlite (or WatermelonDB if data grows large) | Structured, relational, fully offline |
| Secure fields | expo-secure-store | Owner's app-lock PIN, sensitive settings |
| QR generation | react-native-qrcode-svg | Per-member QR code |
| QR scanning | expo-camera (barcode scanning API) | Check-in scanning |
| Navigation | @react-navigation/native | Standard RN navigation |
| Charts | victory-native or react-native-svg-charts | Attendance/revenue graphs |
| State | React Context or Zustand | Lightweight, no backend sync needed |

**No backend, no auth server, no cloud database.** All data lives in the local
SQLite file on the owner's device. This is a deliberate trade-off: it's the
simplest way to guarantee data never leaves the phone, but the owner should be
told plainly that uninstalling the app or losing the phone loses the data —
worth adding a manual "export backup" (CSV/JSON file share) as a safety net.

## 4. Data model (SQLite tables)

```sql
-- gym_settings (single row, this device's gym identity)
id, gym_name, logo_uri, theme_color, working_hours_start, working_hours_end,
owner_pin, created_at

-- members
id, name, phone, photo_uri, plan_id, join_date, fee_status, pin_code,
qr_payload, active (boolean), created_at

-- plans
id, name, price, duration_days, created_at

-- attendance
id, member_id (FK), checked_in_at, method ('pin' | 'qr')
```

## 5. Screens to build

1. **Onboarding / Gym Setup** — gym name, logo upload, pick theme color, set plans
2. **Dashboard** — greeting header, today's check-in count, expiring-soon count
   (as bold stat cards, same visual language as your reference), quick-access
   "Check In" button
3. **Check-In screen** — big PIN keypad by default, toggle to QR scanner mode
4. **Members list** — searchable list, avatar + name + plan + fee status pill
5. **Member profile** — details, attendance history, their QR code, edit/deactivate
6. **Add/Edit Member** — form + auto-generated PIN and QR shown at the end
7. **Reports** — attendance trends chart, revenue this month, filter by date range
8. **Settings** — rebrand (name/logo/color), manage plans, export backup, app-lock PIN

## 6. Visual design system (consistent with your earlier reference)

- **Background:** cream `#F5F1E8`
- **Primary:** indigo `#4B4FE0` (default theme — but this is the ONE color the
  owner can override per-gym in Settings, since white-labeling means each gym
  picks their own brand color)
- **Accent:** coral `#F4674A`, yellow `#F4C542`
- **Cards:** white surface, 2px black border, 20px corner radius, soft shadow
- **Headers:** bold display/serif font (e.g. Fraunces)
- **Body:** clean sans (e.g. Poppins)
- **Illustrations:** thick black outline, flat color, playful — reuse the
  character/flower/badge SVGs from the earlier asset pack for empty states
  ("No members yet", "No check-ins today") to keep tone consistent
- Stat cards on Dashboard should mirror the "20K Full time / 18K Part time"
  card style: bold number, label, icon badge in corner

## 7. The Antigravity prompt (paste this in)

```
Build a React Native + Expo app called "GymFlow" — a local-first gym
management app for gym owners. No backend or cloud — all data in local
SQLite via expo-sqlite. Use expo-secure-store only for the owner's app-lock
PIN.

Screens needed: Onboarding/Setup, Dashboard, Check-In (PIN keypad + QR
scanner toggle), Members list, Member profile, Add/Edit Member, Reports,
Settings.

Data model: gym_settings (gym_name, logo_uri, theme_color, working hours,
owner_pin), members (name, phone, photo_uri, plan_id, join_date, fee_status,
pin_code, qr_payload, active), plans (name, price, duration_days),
attendance (member_id, checked_in_at, method).

Design system: cream background #F5F1E8, default primary indigo #4B4FE0
(must be overridable per-install from Settings since this is white-label),
coral #F4674A and yellow #F4C542 accents, white cards with 2px black border
and 20px radius, bold serif headers (Fraunces), clean sans body (Poppins).
Reference attached screenshots for card and layout style.

Use react-native-qrcode-svg to generate a QR per member at registration, and
expo-camera's barcode scanning for the Check-In screen's QR mode. PIN mode is
a numeric keypad matching a member's stored pin_code.

Start by scaffolding navigation and the SQLite schema, then build Dashboard
and Check-In first since they're used daily, then Members and Reports.
```

Attach your two reference screenshots and the asset-pack SVGs when you paste this in — Antigravity reads images directly and will match spacing/style far more accurately than from text alone.

## 8. Running the app on your own phone via USB debugging

Since you're using `expo-sqlite`, `expo-camera`, and `expo-secure-store`, this
needs a **custom dev build**, not the plain Expo Go app (Expo Go doesn't
support all native modules). You'll build it locally and install it straight
onto your phone over USB.

### Android
1. On your phone: Settings → About Phone → tap "Build Number" 7 times to unlock Developer Options
2. Settings → Developer Options → enable **USB Debugging**
3. Install **Android Studio** (gives you `adb` and the SDK platform tools) — or just the standalone [Platform Tools](https://developer.android.com/tools/releases/platform-tools) if you don't want the full IDE
4. Connect your phone to your computer via USB cable
5. On the phone, a popup appears asking "Allow USB debugging?" — tap Allow
6. Verify the connection from a terminal:
   ```
   adb devices
   ```
   Your device should show up listed as "device" (not "unauthorized")
7. From your project folder, run:
   ```
   npx expo run:android --device
   ```
   This builds the native app and installs it directly on your connected phone

### iOS
iOS requires a **Mac** with Xcode installed — there's no way around this, Apple doesn't allow building/signing iOS apps from Windows/Linux.
1. Install Xcode from the Mac App Store
2. Connect your iPhone via USB (or same-network wireless debugging once paired once)
3. On the iPhone: Settings → Privacy & Security → scroll down → enable **Developer Mode** (you'll be asked to restart)
4. Open Xcode once, go to Window → Devices and Simulators, and trust your computer from the phone's popup when prompted
5. From your project folder, run:
   ```
   npx expo run:ios --device
   ```
6. You'll need to sign in with your Apple ID in Xcode (Preferences → Accounts) — a **free Apple ID works for personal device testing**, no paid developer account needed unless you're publishing to the App Store later

### Doing this from inside Antigravity
Antigravity's built-in terminal can run all of the above commands itself —
just ask it to "run the app on my connected Android/iOS device via USB" and
it will execute `adb devices` / `expo run:android --device` (or the iOS
equivalent) and surface any errors (like an unauthorized device or missing
SDK) back to you to fix.

## 9. Design resources — since design is the priority here

**Illustration libraries (thick-outline, flat-color, "sticker" style like your reference):**
- **[Blush.design](https://blush.design)** — fully recolorable illustration packs; several styles match this outline+flat-color look almost exactly. Best single source for this project.
- **[Icons8 Ouch!](https://icons8.com/illustrations)** — filter by "style" for hand-drawn/cartoon sets, free and paid tiers
- **[DrawKit](https://www.drawkit.com)** — free + premium illustration packs, several in bold flat style
- **[Storyset (Freepik)](https://storyset.com)** — customizable colors per illustration, huge library, good for onboarding/empty-state graphics
- **[Humaaans](https://humaaans.com)** — mix-and-match character builder, simpler line style, very easy to reskin to your palette
- **[Open Peeps](https://www.openpeeps.com)** — hand-drawn character library, free, good for member avatars/placeholder people
- **[unDraw](https://undraw.co)** — simpler/more monochrome, easy single-color recolor, good filler option

**UI kits & full-screen references (Figma):**
- **Figma Community** — search "gym app UI kit" or "fitness app UI kit," many free kits already use this bold-card style
- **[Dribbble](https://dribbble.com)** — search "gym CRM," "fitness dashboard," "attendance app" for layout inspiration (not downloadable assets, but great for screen-composition ideas)
- **[Mobbin](https://mobbin.com)** — real production app screenshots, useful for seeing how real gym/fitness apps lay out check-in flows

**Icons (simple line icons for nav bars, buttons):**
- **[Phosphor Icons](https://phosphoricons.com)** — clean, consistent weight, free
- **[Lucide](https://lucide.dev)** — similarly clean, works great in React Native via `lucide-react-native`

**Fonts:**
- **[Google Fonts](https://fonts.google.com)** — Fraunces (bold display/serif) + Poppins (body) — both free, already specified in the design tokens
- **[Fontshare](https://www.fontshare.com)** — free alternative pairs: Clash Display (headers) + General Sans (body), also matches this style well

**Color palette tools (if you want to build your own gym-specific theme beyond the default indigo):**
- **[Coolors](https://coolors.co)** — quick palette generator
- **[Huemint](https://huemint.com)** — AI-assisted palette generator, good for UI-specific palettes

Recolor anything pulled from these libraries to match `design-tokens.json` from the earlier asset pack, so illustrations from different sources still look like one cohesive app.

## 10. Open decisions worth locking down before you build

- **QR vs PIN default:** PIN is faster to build and needs no camera permission friction; QR is nicer for member cards. Recommend building PIN first, QR as v2.
- **Backup/export:** since there's no cloud, decide now whether owners can export a CSV/JSON backup manually (strongly recommended) or accept the data-loss risk.
- **Multi-device for one gym:** if a gym owner ever wants two phones (front desk + back office) to share attendance data, local-only storage won't support that — worth flagging now even if out of scope for v1.
