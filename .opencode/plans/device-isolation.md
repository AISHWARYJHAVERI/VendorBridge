# Device Isolation Plan

## Goal
Each device that opens https://billing-1b756.web.app should automatically get its own isolated owner account. Other devices sharing the same link cannot see each other's data.

## Changes

### 1. `src/AuthContext.jsx`
- Import `api` and `useEffect`
- Add `isLoading` state
- On mount (if no user in localStorage):
  - Check `localStorage` for `popBillingDeviceId`
  - If missing, generate: `device_${Date.now()}_${random}`
  - Try `api.getLoginById(deviceId)` — if no doc exists, `api.addLogin({...})` with `isDevice: true`
  - Auto-login using that device login
- Export `isLoading` in context so pages can show a loading state

### 2. `src/Login/Login.jsx`
- After `api.getLogins()`, filter: `.filter(l => !l.isDevice)`
- This hides all auto-created device accounts from the login dropdown

### 3. `src/Dashboard/Dashboard.jsx`
- If `user.isDevice`, show a banner:
  "This is a device account. Set a company name and password to secure it."
- Add companyName and password fields to the Profile dialog (shown only for device accounts)
- On save: call `api.updateOwnerProfile(user.id, { companyName, password, isDevice: false })`
- Update the local `user` state to reflect the changes

## Files Not Changed
- `src/api.js` — no changes needed
- `firestore.rules` — already open access
- `.env`, `vite.config.js`, `firebase.json` — no changes needed

## After Implementation
- Build: `npm run build`
- Deploy: `firebase deploy --only hosting,firestore`
- Test at https://billing-1b756.web.app
