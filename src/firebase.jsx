// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBAS_MESSAGINGSENDERID,
  appId: import.meta.env.VITE_FIREBASE_APPID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore with durable offline persistence (IndexedDB). Writes are queued
// locally and survive a tab close, refresh, or offline period, then flush to
// the server automatically when connectivity returns — so on a single device
// a change can't be lost between the app and the database. Multi-tab manager
// keeps the cache coherent if the app is open in more than one tab.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Local testing against the Firebase emulators (`firebase emulators:start`
// with Firestore on 8080 and Auth on 9099): run the dev server with
// VITE_USE_EMULATORS=1. Never active in a production build.
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(getAuth(app), "http://127.0.0.1:9099", { disableWarnings: true });
  window.__emulatorSignIn = (email, password) => signInWithEmailAndPassword(getAuth(app), email, password);
}
