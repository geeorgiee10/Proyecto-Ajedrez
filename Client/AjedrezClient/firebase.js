// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdBvnb45twX0bmZq15nBkQ7yl9P3JG8Aw",
  authDomain: "nextmove-e3b79.firebaseapp.com",
  projectId: "nextmove-e3b79",
  storageBucket: "nextmove-e3b79.firebasestorage.app",
  messagingSenderId: "831105009265",
  appId: "1:831105009265:web:2659ab68a5d02b665bbdd0",
  measurementId: "G-91D7EBKWQB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);

export const auth = getAuth(app);
export default app;