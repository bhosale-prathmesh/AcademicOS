
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQCX2gFMvLdBDd46_AFDaprTGfWT5Wg1E",
  authDomain: "academicos-ff1ad.firebaseapp.com",
  databaseURL: "https://academicos-ff1ad-default-rtdb.firebaseio.com",
  projectId: "academicos-ff1ad",
  storageBucket: "academicos-ff1ad.firebasestorage.app",
  messagingSenderId: "746148310439",
  appId: "1:746148310439:web:6529a16a7b4c23b8de9a82",
  measurementId: "G-TYCSJ6HGFZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDB = getDatabase(app);

let analytics = null;

try {
  if (await isSupported()) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn("Analytics unavailable:", error);
}

export { app, auth, db, realtimeDB, analytics };
