// Test script for Firebase Admin SDK credentials
const admin = require('firebase-admin');

// Using the environment variables from .env.local
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

console.log("Testing Firebase credentials with:");
console.log("- Project ID:", projectId);
console.log("- Client Email:", clientEmail);
console.log("- Private Key exists:", !!privateKey);

try {
  // Initialize the app with the service account credentials
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  // Test auth functionality
  admin.auth().listUsers(1)
    .then(() => {
      console.log('✅ Authentication successful! Your credentials are valid.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Authentication failed with error:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  process.exit(1);
}