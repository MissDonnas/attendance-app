// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDZYW4AQXyCtkB2mUMN-QIsc57ZwjvlsE",
  authDomain: "attendance-app-1b27e.firebaseapp.com",
  projectId: "attendance-app-1b27e",
  storageBucket: "attendance-app-1b27e.firebasestorage.app",
  messagingSenderId: "1043261702908",
  appId: "1:1043261702908:web:a29f90f3fb11c47476cd79",
  measurementId: "G-6M0R6HZH5J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
