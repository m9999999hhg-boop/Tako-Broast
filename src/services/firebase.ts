import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Order, ActivityLog, Product, User, RestaurantSettings } from '../types';

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
} else {
  app = getApp();
}

// Initialize Firestore with specific databaseId if provided
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Enable offline persistence gracefully if browser supports it
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore offline persistence warning: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore offline persistence not supported in this browser environment');
      }
    });
  } catch (e) {
    // Ignore persistence setup errors
  }
}

/**
 * Sync an order to Firestore in real-time
 */
export async function syncOrderToFirestore(order: Order): Promise<void> {
  try {
    const orderDocRef = doc(db, 'orders', order.id);
    await setDoc(orderDocRef, {
      ...order,
      _firestoreSyncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore order sync warning (operating in local fallback):', error);
  }
}

/**
 * Sync an activity log to Firestore audit trail
 * Explicitly sanitizes details and ensures no password/PIN data is stored
 */
export async function syncActivityLogToFirestore(log: ActivityLog): Promise<void> {
  try {
    // Sanitize any accidental sensitive tokens
    const safeDetails = (log.details || '')
      .replace(/pin:\s*\S+/gi, 'pin: [MASKED]')
      .replace(/password:\s*\S+/gi, 'password: [MASKED]');

    const logDocRef = doc(db, 'activityLogs', log.id);
    await setDoc(logDocRef, {
      ...log,
      details: safeDetails,
      _cybersecurityValidated: true,
      _firestoreSyncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Firestore activity log sync warning:', error);
  }
}

/**
 * Fetch latest activity logs from Firestore
 */
export async function fetchFirestoreActivityLogs(count: number = 50): Promise<ActivityLog[]> {
  try {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(count));
    const snap = await getDocs(q);
    const logs: ActivityLog[] = [];
    snap.forEach((d) => {
      const data = d.data() as ActivityLog;
      logs.push({
        id: data.id || d.id,
        actorName: data.actorName || 'System',
        role: data.role || 'STAFF',
        action: data.action || 'OPERATION',
        details: data.details || '',
        timestamp: data.timestamp || new Date().toISOString(),
      });
    });
    return logs;
  } catch (error) {
    console.warn('Could not read from Firestore activity logs, using local data', error);
    return [];
  }
}

/**
 * Sync user to Firestore without exposing cleartext credentials
 */
export async function syncUserToFirestore(user: User): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', user.id);
    // Never persist plain text PINs to public cloud logs
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      active: user.active,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, safeUser, { merge: true });
  } catch (error) {
    console.warn('Firestore user sync warning:', error);
  }
}

/**
 * Real-time listener for live orders from Firestore
 */
export function listenToFirestoreOrders(onOrdersUpdate: (orders: Order[]) => void) {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((doc) => {
        orders.push(doc.data() as Order);
      });
      if (orders.length > 0) {
        onOrdersUpdate(orders);
      }
    }, (err) => {
      console.warn('Firestore orders live listener error', err);
    });
  } catch (e) {
    console.warn('Could not attach Firestore listener', e);
    return () => {};
  }
}

export default {
  db,
  syncOrderToFirestore,
  syncActivityLogToFirestore,
  fetchFirestoreActivityLogs,
  syncUserToFirestore,
  listenToFirestoreOrders,
};
