// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";
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

// Initialize Firebase. Imported first by index.jsx, before anything calls
// getAuth(). Firestore is not set up here: it loads on demand
// (Data/firestore.js), so a guest never downloads it.
export const app = initializeApp(firebaseConfig);

// Local testing against the Firebase emulators (`firebase emulators:start`
// with Firestore on 8080 and Auth on 9099): run the dev server with
// VITE_USE_EMULATORS=1. Never active in a production build.
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS) {
  connectAuthEmulator(getAuth(app), "http://127.0.0.1:9099", { disableWarnings: true });
  window.__emulatorSignIn = (email, password) => signInWithEmailAndPassword(getAuth(app), email, password);
}
