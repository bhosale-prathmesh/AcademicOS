
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "*******************************************",
  authDomain: "**************************************",
  databaseURL: "*************************************",
  projectId: "************",
  storageBucket: "**************",
  messagingSenderId: "*********",
  appId: "********************",
  measurementId: "**************"
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
