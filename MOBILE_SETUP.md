# Mobile App Setup Guide

## ✅ Issues Fixed

### 1. Babel Configuration Error
**Error:** `.plugins is not a valid Plugin property`

**Fix:** Temporarily removed NativeWind babel plugin from `babel.config.js`
- NativeWind v4.2.1 has compatibility issues with the current Babel setup
- Removed `"nativewind/babel"` from plugins array
- Will need to add back when using NativeWind styling

### 2. Missing Assets Error
**Error:** `ENOENT: no such file or directory, scandir '.../assets/images'`

**Fix:** Removed asset references from `app.config.ts`
- Removed `icon`, `splash`, `adaptiveIcon`, and `favicon` references
- Created `assets/` directory with `.gitkeep` placeholder
- Assets can be added later when ready

### 3. Package Version Mismatches
**Error:** Multiple packages had versions incompatible with Expo SDK 54

**Fixes:**
- ✅ React: `19.2.3` → `19.1.0`
- ✅ React Native: `0.83.1` → `0.81.5`
- ✅ expo-status-bar: `2.0.1` → `3.0.9`
- ✅ expo-constants: `17.1.8` → `18.0.13`
- ✅ expo-linking: `7.1.7` → `8.0.11`
- ✅ expo-image-picker: `16.1.4` → `17.0.10`
- ✅ expo-image-manipulator: `13.1.7` → `14.0.8`
- ✅ expo-sqlite: `15.2.14` → `16.0.10`
- ✅ react-native-safe-area-context: `4.14.1` → `5.6.2`
- ✅ react-native-screens: `4.19.0` → `4.16.0`
- ✅ @types/react: `19.2.7` → `19.1.17`

---

## 🚀 Running the Mobile App

### Prerequisites
- Node.js 20.19.4+
- pnpm 10.27+
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- OR Xcode (iOS) / Android Studio (Android) for simulators

### Start Development Server

```bash
# From project root
pnpm --filter mobile start

# OR from apps/mobile directory
cd apps/mobile
pnpm start
```

### Clear Cache if Needed

```bash
pnpm --filter mobile start -- --clear
```

### Platform-Specific Commands

```bash
# iOS Simulator (requires Xcode)
pnpm --filter mobile ios

# Android Emulator (requires Android Studio)
pnpm --filter mobile android

# Web (development only)
pnpm --filter mobile web
```

---

## 📱 Testing on Device

1. **Install Expo Go** on your iOS or Android device
2. **Start the dev server:** `pnpm --filter mobile start`
3. **Scan the QR code** with:
   - iOS: Camera app
   - Android: Expo Go app

---

## ⚠️ Known Limitations

### NativeWind Styling
NativeWind babel plugin is currently disabled due to compatibility issues. This means:
- ❌ Tailwind-style className won't work yet
- ✅ Standard React Native StyleSheet works fine
- 💡 **TODO:** Fix NativeWind configuration or wait for v5

### Assets
- No app icon or splash screen configured
- Assets directory created but empty
- **TODO:** Add icon.png, splash.png, and adaptive-icon.png

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Then restart
pnpm --filter mobile start
```

### Metro Bundler Cache Issues
```bash
# Clear all caches
cd apps/mobile
rm -rf .expo node_modules/.cache
pnpm start --clear
```

### Package Version Errors
If you see warnings about package versions:
```bash
# Reinstall dependencies
pnpm install

# Check Expo doctor
npx expo-doctor
```

### TypeScript Errors
```bash
# Type check
pnpm --filter mobile typecheck

# If errors persist, clear TypeScript cache
rm -rf apps/mobile/.expo/types
```

---

## 📋 Next Steps

### 1. Configure NativeWind (Optional)
Research NativeWind v4 compatibility or upgrade to v5 when stable

### 2. Add App Assets
Create or generate:
- `assets/icon.png` (1024x1024)
- `assets/splash.png` (1284x2778)
- `assets/adaptive-icon.png` (Android, 1024x1024)

Then update `app.config.ts`:
```typescript
icon: "./assets/icon.png",
splash: {
  image: "./assets/splash.png",
  resizeMode: "contain",
  backgroundColor: "#ffffff",
},
android: {
  adaptiveIcon: {
    foregroundImage: "./assets/adaptive-icon.png",
    backgroundColor: "#ffffff",
  },
},
```

### 3. Test Supabase Connection
```typescript
// In any screen
import { supabase } from '@/lib/supabase';

const testConnection = async () => {
  const { data, error } = await supabase
    .from('boxes')
    .select('count');
  console.log({ data, error });
};
```

### 4. Implement Features
- Box listing screen
- QR code scanner
- Camera integration for photos
- Offline sync with SQLite

---

## 🎯 Current Status

✅ **Working:**
- Expo development server starts successfully
- Metro bundler running without errors
- All dependencies compatible with Expo SDK 54
- Three-tab navigation (Boxes, Scan, Settings)
- Supabase client configured
- TypeScript strict mode passing

⚠️ **Pending:**
- NativeWind styling integration
- App icon and splash screen
- Camera permissions testing
- QR code scanning implementation

---

## 📚 Useful Commands

```bash
# Check package compatibility
npx expo-doctor

# Update Expo SDK
npx expo install --fix

# Generate new Expo project ID
npx eas init

# Build for production
npx eas build --platform ios
npx eas build --platform android
```

---

## 🔗 Resources

- [Expo SDK 54 Docs](https://docs.expo.dev/)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [React Native Docs](https://reactnative.dev/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
