import { db } from './firebase';
import { ref, get, set, push, update, remove, runTransaction } from 'firebase/database';

const DEVICE_ID_KEY = 'popBillingDeviceId';

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

const devicePath = (path) => `devices/${getDeviceId()}/${path}`;

function snapData(snapshot) {
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
}

function docData(snapshot) {
  if (!snapshot.exists()) return null;
  return { id: snapshot.key, ...snapshot.val() };
}

export const BILL_LIMIT = 4;

export const api = {
  getLogins: async () => {
    const snap = await get(ref(db, devicePath('logins')));
    return snapData(snap);
  },

  getLoginById: async (id) => {
    const snap = await get(ref(db, devicePath(`logins/${id}`)));
    return docData(snap);
  },

  addLogin: async (login) => {
    const newRef = push(ref(db, devicePath('logins')));
    await set(newRef, login);
    return { id: newRef.key, ...login };
  },

  updateLogin: async (id, updates) => {
    await update(ref(db, devicePath(`logins/${id}`)), updates);
    return { id, ...updates };
  },

  getOwnerProfile: async (id) => {
    const snap = await get(ref(db, devicePath(`logins/${id}`)));
    return docData(snap);
  },

  updateOwnerProfile: async (id, updates) => {
    await update(ref(db, devicePath(`logins/${id}`)), updates);
    return { id, ...updates };
  },

  getUsers: async () => {
    const snap = await get(ref(db, devicePath('users')));
    return snapData(snap);
  },

  getUserById: async (id) => {
    const snap = await get(ref(db, devicePath(`users/${id}`)));
    return docData(snap);
  },

  addUser: async (user) => {
    const newRef = push(ref(db, devicePath('users')));
    await set(newRef, { ...user });
    return { id: newRef.key, ...user };
  },

  updateUser: async (id, updates) => {
    await update(ref(db, devicePath(`users/${id}`)), updates);
    return { id, ...updates };
  },

  deleteUser: async (id) => {
    await remove(ref(db, devicePath(`users/${id}`)));
    return { success: true };
  },

  getBills: async () => {
    const snap = await get(ref(db, devicePath('bills')));
    return snapData(snap);
  },

  addBill: async (bill) => {
    const newRef = push(ref(db, devicePath('bills')));
    await set(newRef, { ...bill });
    return { id: newRef.key, ...bill };
  },

  updateBill: async (id, updates) => {
    await update(ref(db, devicePath(`bills/${id}`)), updates);
    return { id, ...updates };
  },

  getBillCounters: async () => {
    const snap = await get(ref(db, devicePath('billCounters')));
    if (!snap.exists()) return {};
    return snap.val();
  },

  updateBillCounters: async (counters) => {
    await set(ref(db, devicePath('billCounters')), counters);
    return counters;
  },

  getDeviceId,

  getBillGenerationCount: async () => {
    const snap = await get(ref(db, devicePath('billGenerationCount')));
    if (snap.exists()) return snap.val();
    return 0;
  },

  incrementBillGenerationCount: async () => {
    const counterRef = ref(db, devicePath('billGenerationCount'));
    const result = await runTransaction(counterRef, (current) => {
      return (current || 0) + 1;
    });
    return result.snapshot.val();
  },

  setBillCounterValue: async (userId, year, value) => {
    await set(ref(db, devicePath(`billCounters/${userId}/${year}`)), value);
  },
};

export default api;
