import { initializeApp } from "firebase/app";

import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFXvK3o2C9nGTZdkPnvU_uMfZPO09nWmA",
  authDomain: "fintrack-d5d65.firebaseapp.com",
  projectId: "fintrack-d5d65",
  storageBucket: "fintrack-d5d65.firebasestorage.app",
  messagingSenderId: "70582618188",
  appId: "1:70582618188:web:9da1ba84f8a1cd86838ce9",
  measurementId: "G-5TWGMKKJJL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { db, auth, provider, doc, setDoc };


// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


// Initialize Firebase
