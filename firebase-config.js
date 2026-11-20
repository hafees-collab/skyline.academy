/**
 * Skyline Academy - Firebase Configuration & Bridge
 * 
 * Instructions:
 * 1. To connect your existing Firebase project, fill in the values below.
 * 2. In Firebase Console (Authentication > Sign-in method), enable "Email/Password".
 * 3. In Cloud Firestore, create a database in production mode.
 * 
 * Note: If values are left empty, the website automatically operates using its built-in
 * persistent storage (with all 92 real student records pre-loaded).
 */

window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

(function () {
  const isConfigured = window.FIREBASE_CONFIG && 
                       window.FIREBASE_CONFIG.apiKey && 
                       window.FIREBASE_CONFIG.apiKey.trim() !== "";

  window.isFirebaseActive = isConfigured;

  if (isConfigured && typeof firebase !== 'undefined') {
    try {
      firebase.initializeApp(window.FIREBASE_CONFIG);
      window.firebaseAuth = firebase.auth();
      window.firebaseDb = firebase.firestore();
      console.log('Firebase initialized successfully.');
    } catch (e) {
      console.warn('Firebase initialization error, running in local storage mode:', e);
      window.isFirebaseActive = false;
    }
  } else {
    // Local storage mode is active
  }
})();
