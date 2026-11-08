# RollCall Android Standalone Installation & APK Guide

## 📱 Generated Android Packages

All packages were compiled, dexed, and packaged directly using Android SDK and Gradle:

1. **Signed Release APK (Recommended for Installation)**
   - **File:** `RollCall-Release.apk`
   - **Path:** `/downloads/RollCall-Release.apk` (and `android/app/build/outputs/apk/release/app-release.apk`)
   - **Size:** 16.3 MB (17,118,891 bytes)
   - **Package ID:** `com.rollcall.attendance`
   - **Signing:** Pre-signed with release keystore (`rollcall`, SHA-256 with RSA 2048-bit)
   - **Minimum Android Version:** Android 5.1+ (API 22)
   - **Target Android Version:** Android 14 / 15 (API 34 / 35)

2. **Debug APK (For Developer Testing & Diagnostics)**
   - **File:** `RollCall-Debug.apk`
   - **Path:** `/downloads/RollCall-Debug.apk` (and `android/app/build/outputs/apk/debug/app-debug.apk`)
   - **Size:** 17.4 MB (18,323,383 bytes)
   - **Use Case:** USB debugging and runtime logcat inspection.

3. **Google Play Android App Bundle (AAB)**
   - **File:** `RollCall-Release.aab`
   - **Path:** `/downloads/RollCall-Release.aab` (and `android/app/build/outputs/bundle/release/app-release.aab`)
   - **Size:** 16.1 MB (16,967,809 bytes)
   - **Use Case:** Upload directly to Google Play Console for official Play Store distribution.

---

## 🚀 How to Install on Any Android Phone

### Step 1: Download the APK
- In Google Chrome on your phone, open the app and tap **"Download APK"** or navigate directly to `/downloads/RollCall-Release.apk`.

### Step 2: Allow the Download
- Chrome may display a standard security prompt:
  > *"File might be harmful. Do you want to download RollCall-Release.apk anyway?"*
- Tap **Download anyway** (*ይህ ከPlay Store ውጭ ለሚወርዱ አፖች የሚታይ መደበኛ ማስጠንቀቂያ ነው*).

### Step 3: Open the Downloaded APK
- When the download completes, tap **Open** from the Chrome bottom snackbar or pull down your notification tray and tap `RollCall-Release.apk`.

### Step 4: Allow Unknown Apps (First-Time Only)
- If your phone displays a prompt saying:
  > *"For your security, your phone is not allowed to install unknown apps from this source"*
- Tap **Settings**.
- Turn ON the toggle for **Allow from this source** (for Chrome / Files).
- Tap the **Back** arrow and tap **Install**.

### Step 5: Launch RollCall
- Tap **Open**! RollCall is now installed on your home screen with its official icon.
- It operates completely independently of the browser and works 100% offline.

---

## 🛡️ Stability Fixes Applied

1. **Storage Wiping Bug Permanently Removed:**
   - Eliminated the artificial reset check in `initializeStorage()` that previously wiped roster and attendance data when the record count reached 120. All records in `rollcall_students_v2`, `rollcall_attendance_v2`, and feeding logs are now permanently preserved.

2. **Application Crash Boundary Added:**
   - Wrapped the entire application in a bilingual (`ErrorBoundary`) that catches any unhandled runtime exceptions and presents an actionable recovery UI (with safe state reload and diagnostics) instead of a white screen.

3. **Cloud Run 403 / 404 Bypassed:**
   - Native APK runs local code inside Android's WebView container and does not make unauthorized Google Cloud IAM requests.
