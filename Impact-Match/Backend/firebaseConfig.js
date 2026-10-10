import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
// Firebase Auth otherwise uses in-memory persistence in React Native. Keep the
// signed-in session in device storage; the browser SDK manages web persistence.
export const auth = Platform.OS === "web"
  ? getAuth(app)
  : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db = getFirestore(app);
