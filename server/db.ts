import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import fs from 'node:fs';
import path from 'node:path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
try {
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.error('[Gateway] Failed to read firebase-applet-config.json:', err);
}

// Runtime resolution for API Key (matching src/firebase.ts fallback)
const resolvedApiKey =
  process.env.VITE_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  firebaseConfig.apiKey;

const activeConfig = {
  ...firebaseConfig,
  apiKey: resolvedApiKey
};

// Initialize Firebase for Node.js context
let db: any = null;
let auth: any = null;

if (firebaseConfig.projectId) {
  try {
    const app = initializeApp(activeConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    if (resolvedApiKey) {
      try {
        auth = getAuth(app);
      } catch (authErr) {
        console.warn('[Gateway] Firebase Auth initialization warning:', authErr);
      }
    }
  } catch (err) {
    console.error('[Gateway] Failed to initialize Firebase app in Node.js context:', err);
  }
}

export { db, auth };

export async function getGatewayConfig() {
  if (!db) return null;
  try {
    const docRef = doc(db, 'gateway_config', 'active');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error('Error loading gateway config from Firestore:', err);
  }
  return null;
}

export async function saveGatewayConfig(config: any) {
  if (!db) return false;
  try {
    const docRef = doc(db, 'gateway_config', 'active');
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err: any) {
    console.error('Error saving gateway config to Firestore:', err);
    // If it's a permission error, it's helpful to see it in logs
    if (err.code === 'permission-denied') {
      console.error('Firestore Permission Denied. Check your firestore.rules.');
    }
    return false;
  }
}
