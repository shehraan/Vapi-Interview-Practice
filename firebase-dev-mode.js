/**
 * This is a script that can be used to mock Firebase functionality for development.
 * Steps to set up development mode:
 * 
 * 1. Save the original Firebase files:
 *    cp firebase/admin.ts firebase/admin.ts.orig
 *    cp firebase/client.ts firebase/client.ts.orig
 *    cp lib/actions/auth.action.ts lib/actions/auth.action.ts.orig
 * 
 * 2. Run this script to implement mock Firebase functionality:
 *    node firebase-dev-mode.js
 * 
 * 3. To restore original files:
 *    mv firebase/admin.ts.orig firebase/admin.ts
 *    mv firebase/client.ts.orig firebase/client.ts
 *    mv lib/actions/auth.action.ts.orig lib/actions/auth.action.ts
 */

const fs = require('fs');
const path = require('path');

console.log('Setting up Firebase development mode...');

// Mock Firebase Admin
const mockAdminContent = `import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Mock Firestore for development
class MockFirestore {
  collection(name) {
    console.log(\`[MOCK] Accessing collection: \${name}\`);
    return {
      doc: (id) => ({
        get: async () => ({
          exists: true,
          id: id || 'mock-id',
          data: () => {
            if (name === 'users') {
              return { name: 'Demo User', email: 'demo@example.com' };
            }
            if (name === 'interviews') {
              return {
                userId: 'mock-user-id',
                role: 'Frontend Developer',
                type: 'Technical',
                techstack: ['React', 'TypeScript', 'Next.js'],
                level: 'Senior',
                questions: ['Tell me about yourself', 'What is React?'],
                finalized: true,
                createdAt: new Date().toISOString(),
              };
            }
            return {};
          },
        }),
        set: async (data) => {
          console.log(\`[MOCK] Setting data in \${name}/\${id}:\`, data);
          return Promise.resolve();
        },
      }),
      where: () => ({
        where: () => ({
          limit: () => ({
            get: async () => ({
              empty: false,
              docs: [
                {
                  id: 'mock-doc-1',
                  data: () => ({ /* mock data */ }),
                },
              ],
            }),
          }),
        }),
        orderBy: () => ({
          get: async () => ({
            empty: false,
            docs: [
              {
                id: 'mock-doc-1',
                data: () => {
                  if (name === 'interviews') {
                    return {
                      userId: 'mock-user-id',
                      role: 'Frontend Developer',
                      type: 'Technical',
                      techstack: ['React', 'TypeScript', 'Next.js'],
                      level: 'Senior',
                      questions: ['Tell me about yourself', 'What is React?'],
                      finalized: true,
                      createdAt: new Date().toISOString(),
                    };
                  }
                  return {};
                },
              },
            ],
          }),
        }),
      }),
      orderBy: () => ({
        where: () => ({
          limit: () => ({
            get: async () => ({
              empty: false,
              docs: [{ id: 'mock-doc-1', data: () => ({ /* mock data */ }) }],
            }),
          }),
        }),
        get: async () => ({
          empty: false,
          docs: [
            {
              id: 'mock-interview-1',
              data: () => ({
                userId: 'mock-user-id',
                role: 'Frontend Developer',
                type: 'Technical',
                techstack: ['React', 'TypeScript', 'Next.js'],
                level: 'Senior',
                questions: ['Tell me about yourself', 'What is React?'],
                finalized: true,
                createdAt: new Date().toISOString(),
              }),
            },
          ],
        }),
      }),
    };
  }
}

// Mock Auth for development
class MockAuth {
  async verifySessionCookie() {
    return { uid: 'mock-user-id' };
  }
  
  async getUserByEmail() {
    return { uid: 'mock-user-id', email: 'demo@example.com' };
  }
  
  async createSessionCookie() {
    return 'mock-session-cookie';
  }
}

console.log("⚠️ USING MOCK FIREBASE FOR DEVELOPMENT ⚠️");
export const auth = new MockAuth();
export const db = new MockFirestore();

/* Original Firebase Admin code is commented out for development */
`;

// Mock Firebase Client
const mockClientContent = `
import { getAuth, Auth, User } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Mock client-side Firebase auth for development
class MockClientAuth {
  currentUser = {
    uid: 'mock-user-id',
    email: 'demo@example.com',
    displayName: 'Demo User',
    getIdToken: async () => 'mock-id-token',
  };

  async signInWithEmailAndPassword() {
    console.log('[MOCK] Signed in with email and password');
    return { 
      user: this.currentUser
    };
  }

  async createUserWithEmailAndPassword() {
    console.log('[MOCK] Created user with email and password');
    return { 
      user: this.currentUser
    };
  }
}

console.log("⚠️ USING MOCK FIREBASE CLIENT FOR DEVELOPMENT ⚠️");
export const auth = new MockClientAuth();
export const db = {} as Firestore;

/* Original Firebase Client code is commented out for development */
`;

// Mock Auth Action
const mockAuthActionContent = `"use server";

import { cookies } from "next/headers";

// Mock user for development
const MOCK_USER = {
  id: "mock-user-id",
  name: "Demo User",
  email: "demo@example.com",
};

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie (mock for development)
export async function setSessionCookie(idToken) {
  console.log("Setting mock session cookie");
  const cookieStore = await cookies();
  cookieStore.set("session", "mock-session-cookie", {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params) {
  const { name, email } = params;
  console.log("Mock sign up for:", email);
  return {
    success: true,
    message: "Account created successfully. Please sign in.",
  };
}

export async function signIn(params) {
  const { email } = params;
  console.log("Mock sign in for:", email);
  await setSessionCookie("mock-token");
  return {
    success: true,
    message: "Signed in successfully",
  };
}

export async function signOut() {
  console.log("Mock sign out");
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// Get current user - always returns mock user for development
export async function getCurrentUser() {
  console.log("Returning mock user");
  return MOCK_USER;
}

// Always authenticated in development mode
export async function isAuthenticated() {
  return true;
}
`;

try {
  // First create backup if it doesn't exist
  if (!fs.existsSync('firebase/admin.ts.orig')) {
    fs.copyFileSync('firebase/admin.ts', 'firebase/admin.ts.orig');
    console.log('Created backup of admin.ts');
  }
  
  if (!fs.existsSync('firebase/client.ts.orig')) {
    fs.copyFileSync('firebase/client.ts', 'firebase/client.ts.orig');
    console.log('Created backup of client.ts');
  }
  
  if (!fs.existsSync('lib/actions/auth.action.ts.orig')) {
    fs.copyFileSync('lib/actions/auth.action.ts', 'lib/actions/auth.action.ts.orig');
    console.log('Created backup of auth.action.ts');
  }
  
  // Write mock files
  fs.writeFileSync('firebase/admin.ts', mockAdminContent);
  fs.writeFileSync('firebase/client.ts', mockClientContent);
  fs.writeFileSync('lib/actions/auth.action.ts', mockAuthActionContent);
  
  console.log('Development mode enabled!');
  console.log('To restore original files:');
  console.log('  mv firebase/admin.ts.orig firebase/admin.ts');
  console.log('  mv firebase/client.ts.orig firebase/client.ts');
  console.log('  mv lib/actions/auth.action.ts.orig lib/actions/auth.action.ts');
} catch (error) {
  console.error('Error setting up development mode:', error);
}