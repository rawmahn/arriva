// src/firebaseConfig.js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyDz3RFaxPSJrjXyEKeYIwOcPnVzeDDy7rw",
    authDomain: "arriva-500b3.firebaseapp.com",
    projectId: "arriva-500b3",
    storageBucket: "arriva-500b3.firebasestorage.app",
    messagingSenderId: "44916704633",
    appId: "1:44916704633:web:8a92829bcf8e0d69c95ba8"
};

const app = initializeApp(firebaseConfig);

export default app;

