import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
  try {
    const apps = getApps();
    
    if (!apps.length) {
      // Log environment variables (without sensitive data)
      console.log("Firebase Admin Initialization:", {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      });

      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error("Missing Firebase Admin credentials");
      }

      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });

      console.log("Firebase Admin initialized successfully");
    }

    const auth = getAuth();
    const db = getFirestore("appdatabase");
    console.log("Firestore Admin client initialized for database: appdatabase");

    // // Test Firestore connection (REMOVED)
    // db.collection('_test_').doc('_test_').set({ test: true })
    //   .then(() => {
    //     console.log("Firestore connection test successful");
    //     // Clean up test document
    //     db.collection('_test_').doc('_test_').delete();
    //   })
    //   .catch((error) => {
    //     console.error("Firestore connection test failed:", error);
    //   });

    return { auth, db };
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }
}

export const { auth, db } = initFirebaseAdmin();