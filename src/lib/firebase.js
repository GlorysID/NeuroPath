import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-6taktd8PCTSUo9as4Ovbjse2lttwp2Q",
  authDomain: "neuropath-179f2.firebaseapp.com",
  projectId: "neuropath-179f2",
  storageBucket: "neuropath-179f2.firebasestorage.app",
  messagingSenderId: "398864228329",
  appId: "1:398864228329:web:15eeec7071608eab86b578"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true
  });
} catch {
  db = getFirestore(app);
}

export { app, auth, db };

