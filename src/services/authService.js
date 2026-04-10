import { getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

function getFirebaseAuth() {
  if (!hasFirebaseConfig()) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getAuth(app);
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();

  if (!auth) {
    return {
      provider: "google",
      uid: "demo-google-user",
      displayName: "Demo Google User",
      email: "demo@wallet.local",
      photoURL: "https://placehold.co/96",
      accessMode: "mock"
    };
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  return {
    provider: "google",
    uid: user.uid,
    displayName: user.displayName || user.email || "Google User",
    email: user.email || "",
    photoURL: user.photoURL || "",
    accessMode: "firebase"
  };
}

export async function signOutGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}
