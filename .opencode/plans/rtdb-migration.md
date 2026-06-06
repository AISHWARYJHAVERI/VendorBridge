# RTDB Migration Plan

## 1. `.env`
Add: `VITE_FIREBASE_DATABASE_URL=https://billing-1b756-default-rtdb.firebaseio.com`

## 2. `src/firebase.js`
Replace `getFirestore` with `getDatabase` from `firebase/database`, add `databaseURL` to config, export RTDB db.

## 3. `src/api.js` — Full rewrite
- Import `ref, get, set, push, update, remove` from `firebase/database`
- Helper functions `snapData(snap)` and `docData(snap)` adapted for RTDB
- All CRUD functions: `logins/{id}`, `usersByOwner/{ownerId}/{id}`, `billsByOwner/{ownerId}/{id}`, `billCounters/{ownerId}`
- No `where()` — data is partitioned by ownerId at path level

## 4. `database.rules.json` (new)
Open read/write rules for development.

## 5. `firebase.json`
Add `"database": { "rules": "database.rules.json" }`

## 6. `scripts/clear-data.js`
Update to use RTDB SDK if still needed.

## No changes
AuthContext, Login, AddOwner, Dashboard, Users, Billing, App — all use api.js interface, no changes needed.
