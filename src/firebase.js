import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import fallbackConfig from "../firebase.config";

const envMap = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  databaseURL: "VITE_FIREBASE_DATABASE_URL",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "VITE_FIREBASE_APP_ID",
  measurementId: "VITE_FIREBASE_MEASUREMENT_ID",
};

const missingVars = [];

const resolvedEntries = Object.entries(envMap).map(([configKey, envKey]) => {
  const value = import.meta.env[envKey];
  if (value) {
    return [configKey, value];
  }
  missingVars.push({ configKey, envKey });
  return [configKey, fallbackConfig?.[configKey]];
});

const firebaseConfig = Object.fromEntries(resolvedEntries);

if (missingVars.length > 0) {
  const stillMissing = missingVars
    .filter(({ configKey }) => !firebaseConfig[configKey])
    .map(({ envKey }) => envKey);

  if (stillMissing.length > 0) {
    throw new Error(
      `Variável de ambiente ausente para Firebase: ${stillMissing.join(", ")}`
    );
  }
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;

