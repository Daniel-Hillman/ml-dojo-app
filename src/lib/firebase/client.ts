import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmkvTHI19S9QM3BTLY7cOk6khW9RaKZ6U",
  authDomain: "mldojo-49725.firebaseapp.com",
  projectId: "mldojo-49725",
  storageBucket: "mldojo-49725.appspot.com",
  messagingSenderId: "424109715041",
  appId: "1:424109715041:web:ae679c28d062599b4b0420",
  measurementId: "G-VZFPNL8W2H"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
