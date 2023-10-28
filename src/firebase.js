// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBsPk8btdOAnIOiSdzApPAq75ON-O5iMZ8",
  authDomain: "codeit-68475.firebaseapp.com",
  projectId: "codeit-68475",
  storageBucket: "codeit-68475.appspot.com",
  messagingSenderId: "330411903795",
  appId: "1:330411903795:web:26108dbf43c055370b4c46",
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore();
