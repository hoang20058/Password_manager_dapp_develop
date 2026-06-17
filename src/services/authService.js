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
    const params = new URLSearchParams(window.location.search);
    let email = params.get("mockEmail") || params.get("email");

    if (!email) {
      if (globalThis.navigator?.webdriver) {
        email = "resettest@gmail.com";
      } else {
        email = prompt(
          "ĐĂNG NHẬP DEMO (Chưa cấu hình Firebase)\n\nNhập email Google bạn muốn dùng để test:",
          "user1@gmail.com"
        );
      }
    }

    if (!email || !email.trim()) {
      throw new Error("Đăng nhập bằng Google bị hủy");
    }
    const cleanEmail = email.trim();
    return {
      provider: "google",
      uid: `mock-google-uid-${cleanEmail}`,
      displayName: cleanEmail.split("@")[0],
      email: cleanEmail,
      photoURL: "https://placehold.co/96",
      accessMode: "mock"
    };
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account"
  });
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
