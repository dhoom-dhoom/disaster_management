// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDXTLKgt_aRC5dBHQcF2A3XX7kvo10lyOo",
  authDomain: "disaster-91a59.firebaseapp.com",
  projectId: "disaster-91a59",
  storageBucket: "disaster-91a59.firebasestorage.app",
  messagingSenderId: "161399609559",
  appId: "1:161399609559:web:fe670bb9da5c112d19b892"
};



const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
