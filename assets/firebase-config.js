import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-storage.js';

// Primary App Configuration
const primaryConfig = { 
  apiKey: "AIzaSyAODtfZDqeR8DH7YRaiDlRwPOBlxxMfFnY", 
  authDomain: "skillfoge-ecosystem.firebaseapp.com", 
  projectId: "skillfoge-ecosystem", 
  storageBucket: "skillfoge-ecosystem.firebasestorage.app", 
  messagingSenderId: "279055501952", 
  appId: "1:279055501952:web:e812364a6f8bcb5998f465", 
  measurementId: "G-L669WT5FZS" 
};

// Failover/Secondary App Configuration (Legacy/Alternate)
const secondaryConfig = { 
  apiKey: "AIzaSyAODtfZDqeR8DH7YRaiDlRwPOBlxxMfFnY", 
  authDomain: "skillfoge-ecosystem.firebaseapp.com", 
  projectId: "skillfoge-ecosystem", 
  storageBucket: "skillfoge-ecosystem.firebasestorage.app", 
  messagingSenderId: "279055501952", 
  appId: "1:279055501952:web:45e741d2e8b23af698f465", 
  measurementId: "G-YZNF8273RC" 
};

let app;
if (!getApps().length) {
    app = initializeApp(primaryConfig);
} else {
    app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage, primaryConfig, secondaryConfig };
