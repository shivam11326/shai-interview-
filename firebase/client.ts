// Import the functions you need from the SDKs you need
import { initializeApp  , getApp, getApps} from "firebase/app";
import { getAuth } from "firebase/auth";
import {getFirestore} from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDM75RzuHnJRXTBkJWsTW6-ehYymah40H0",
  authDomain: "shai-interview.firebaseapp.com",
  projectId: "shai-interview",
  storageBucket: "shai-interview.firebasestorage.app",
  messagingSenderId: "824158326103",
  appId: "1:824158326103:web:339841f7250e62300a8212",
  measurementId: "G-SYPQ2VVNRJ"
};

// Initialize Firebase
const app =  !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
