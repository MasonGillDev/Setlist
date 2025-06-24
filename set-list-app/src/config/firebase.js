// Import the functions you need from the SDKs you need
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1vIbR7iYvCA_zyEBqTzvYtz6XM6QIBg8",
  authDomain: "set-list-45cb9.firebaseapp.com",
  projectId: "set-list-45cb9",
  storageBucket: "set-list-45cb9.firebasestorage.app",
  messagingSenderId: "843430590891",
  appId: "1:843430590891:web:aecc894a2caecdc6bdbaee",
  measurementId: "G-SJPT1YE36K",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only if supported
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(err => {
  console.log('Analytics not supported:', err);
});

const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
