import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Check if credentials are placeholders or empty
const isPlaceholder = 
  !firebaseConfig || 
  firebaseConfig.apiKey === "placeholder-api-key" || 
  !firebaseConfig.apiKey;

let app;
let authInstance: any = null;
let dbInstance: any = null;
let isRealFirebase = false;

if (!isPlaceholder) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    // CRITICAL: Must use firestoreDatabaseId as specified in SDK skills
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
    isRealFirebase = true;
    console.info("VaultiX: Successfully authenticated with physical Cloud Firebase!");
  } catch (error) {
    console.warn("VaultiX: Failed to initialize Firebase client. Falling back to secure offline vault storage.", error);
  }
} else {
  console.info("VaultiX: Using secure local storage browser-persisted mock database. Complete the live project setup in AI Studio to activate live sync.");
}

export const auth = authInstance;
export const db = dbInstance;
export { isRealFirebase };

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((p: any) => ({
        providerId: p.providerId,
        email: p.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error event caught: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
