// The Firestore SDK and the site's database handle, in a chunk of their own:
// it is the largest part of the site's code, and only a signed-in account's
// sync, note history and screenshots use it. Load it through loadFirestore()
// (firestore.js), never import it statically, or it lands back in the entry.
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  deleteField,
  doc,
  FieldPath,
  getDoc,
  getDocs,
  initializeFirestore,
  limit,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { app } from "../firebase";

// Durable offline persistence (IndexedDB): writes are queued locally and
// survive a tab close, refresh, or offline period, then flush to the server
// when connectivity returns. The multi-tab manager keeps the cache coherent
// if the app is open in more than one tab.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Local testing against the emulators: see firebase.jsx.
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export { collection, deleteDoc, deleteField, doc, FieldPath, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc };
