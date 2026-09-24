import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxhzZ5WzDdyDTlG2wr-U0cQroxebRcixw",
  authDomain: "semester-2-project-c6235.firebaseapp.com",
  projectId: "semester-2-project-c6235",
  storageBucket: "semester-2-project-c6235.firebasestorage.app",
  messagingSenderId: "227465397981",
  appId: "1:227465397981:web:3aeaaaf1c97727de61bd34"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// we will use this along the app for storing and accessing our database
export const auth = getAuth(app);
export const db = getFirestore(app);