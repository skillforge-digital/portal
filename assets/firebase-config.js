import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js';
import { initializeFirestore, setLogLevel } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-storage.js';

// Primary App Configuration (Updated to 2CND as per user request)
const primaryConfig = { 
  apiKey: "AIzaSyAODtfZDqeR8DH7YRaiDlRwPOBlxxMfFnY", 
  authDomain: "skillfoge-ecosystem.firebaseapp.com", 
  projectId: "skillfoge-ecosystem", 
  storageBucket: "skillfoge-ecosystem.firebasestorage.app", 
  messagingSenderId: "279055501952", 
  appId: "1:279055501952:web:45e741d2e8b23af698f465", 
  measurementId: "G-YZNF8273RC" 
};

// Failover/Secondary App Configuration (Legacy/Alternate)
const secondaryConfig = { 
  apiKey: "AIzaSyAODtfZDqeR8DH7YRaiDlRwPOBlxxMfFnY", 
  authDomain: "skillfoge-ecosystem.firebaseapp.com", 
  projectId: "skillfoge-ecosystem", 
  storageBucket: "skillfoge-ecosystem.firebasestorage.app", 
  messagingSenderId: "279055501952", 
  appId: "1:279055501952:web:e812364a6f8bcb5998f465", 
  measurementId: "G-L669WT5FZS" 
};

let app;
try {
    app = !getApps().length ? initializeApp(primaryConfig) : getApp();
} catch (err) {
    app = initializeApp(secondaryConfig, "failover");
}

setLogLevel('silent');

const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false
});
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage, primaryConfig, secondaryConfig };
