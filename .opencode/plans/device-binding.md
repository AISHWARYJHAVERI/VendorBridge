# Device Binding Plan

**Problem:** Owners created on one device still appear in the login dropdown on other devices.

**Fix:** Bind every owner to the device that created it.

## Changes

### 1. `src/AuthContext.jsx`
- Compute `deviceId` from `localStorage` (generate if missing) — run once at component top
- Add `deviceId` to the context value

### 2. `src/AddOwner/AddOwner.jsx`
- Get `deviceId` from `useAuth()`
- Include `{ ...deviceId }` when calling `api.addLogin()`

### 3. `src/Login/Login.jsx`
- Get `deviceId` from `useAuth()`
- Filter logins: `l => !l.isDevice && (!l.deviceId || l.deviceId === deviceId)`
  - Hide device accounts
  - Only show owners bound to this device OR owners without deviceId (backwards compat)

### 4. `src/Dashboard/Dashboard.jsx`
- When upgrading device account, include `deviceId` in the updates so it stays bound to this device

## Result
- Each device sees ONLY its own owners in the dropdown
- Old owners without `deviceId` still appear everywhere (backwards compatible)
- Complete isolation
