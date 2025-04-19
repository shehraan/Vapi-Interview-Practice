"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";
import { headers } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie
export async function setSessionCookie(idToken: string) {
  try {
    console.log("🔵 Starting setSessionCookie");
    const cookieStore = await cookies();

    // Create session cookie
    console.log("🔵 Creating session cookie");
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION * 1000, // milliseconds
    });
    console.log("✅ Session cookie created successfully");

    // Set cookie in the browser
    cookieStore.set("session", sessionCookie, {
      maxAge: SESSION_DURATION,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
    console.log("✅ Session cookie set in browser");
  } catch (error) {
    console.error("❌ Error in setSessionCookie:", error);
    throw error;
  }
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
}

export async function signUp(params: SignUpParams) {
  const { uid, name, email, photoURL } = params;

  try {
    console.log("🔵 Starting user creation in Firestore:", { uid, name, email });

    // Create or update user document in Firestore
    try {
      const usersRef = db.collection('users');
      const userDocRef = usersRef.doc(uid);
      
      // Check if user document already exists
      const existingDoc = await userDocRef.get();
      if (existingDoc.exists) {
        console.log("⚠️ User document already exists, updating...");
      }

      const userData = {
        uid,
        name,
        email,
        photoURL: photoURL || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isOnboarded: false,
        role: 'user',
        status: 'active',
        // Add any additional user fields here
        preferences: {
          emailNotifications: true,
          theme: 'light'
        },
        profile: {
          bio: '',
          location: '',
          skills: []
        }
      };

      console.log("🔵 Writing user data to Firestore:", userData);
      await userDocRef.set(userData, { merge: true });
      console.log("✅ Successfully wrote user data to Firestore");

      // Assume success if set() didn't throw
      console.log("✅ Assuming Firestore write was successful (verification step skipped)");
      return {
        success: true,
        message: "Account created successfully (verification skipped).",
        // Return the data we tried to write, as we can't verify read
        user: userData 
      };
    } catch (firestoreError: any) {
      console.error("❌ Firestore inner error caught:", {
        name: firestoreError.name,
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack, // Include stack trace if available
        details: firestoreError.details, // Include details if available
      });

      if (firestoreError.code === 'permission-denied') {
        throw new Error("Permission denied. Please check Firestore rules.");
      }
      // Re-throw the original error to be caught by the outer catch
      throw firestoreError;
    }
  } catch (error: any) {
    console.error("❌ Error in signUp:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });

    return {
      success: false,
      message: error.message || "Failed to create account. Please try again."
    };
  }
}

// Sign in user
export async function signIn(idToken: string) {
  try {
    console.log("🔵 Starting signIn process with token");

    // Verify Firebase Admin is initialized
    if (!auth) {
      console.error("❌ Firebase Admin auth is not initialized");
      throw new Error("Firebase Admin not initialized");
    }

    // Create session cookie with a longer expiration
    try {
      console.log("🔵 Creating session cookie");
      const expiresIn = 60 * 60 * 24 * 7 * 1000; // 1 week
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
      
      if (!sessionCookie) {
        console.error("❌ Failed to create session cookie");
        throw new Error("Failed to create session cookie");
      }
      
      console.log("✅ Session cookie created successfully");

      // First, verify the token
      try {
        await auth.verifySessionCookie(sessionCookie);
        console.log("✅ Session cookie verified");
      } catch (error) {
        console.error("❌ Session cookie verification failed:", error);
        throw error;
      }

      const cookiesStore = await cookies();
      await cookiesStore.delete('session'); // Clear any existing session
      await cookiesStore.set('session', sessionCookie);


      console.log("✅ Session cookie set in response");

      return { success: true, message: "Successfully signed in!" };
    } catch (error: any) {
      console.error("❌ Error creating/setting session cookie:", error);
      if (error.code === 'auth/invalid-id-token') {
        return { 
          success: false, 
          message: "Invalid authentication token. Please sign in again." 
        };
      }
      throw error;
    }
  } catch (error: any) {
    console.error("❌ Error in signIn:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    return { 
      success: false, 
      message: error.message || "Failed to sign in. Please try again." 
    };
  }
}

// Sign out user by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) {
    // No session cookie found, user is not logged in
    return null;
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    // get user info from db
    const userDoc = await db.collection("users").doc(decodedClaims.uid).get();
    if (!userDoc.exists) return null;

    return {
      ...userDoc.data(),
      id: userDoc.id,
    } as User;
  } catch (error) {
    // If there's an error verifying the session cookie or the user doesn't exist,
    // return null instead of throwing an error
    console.error("Get current user error:", error);
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  try {
    console.log("🔵 Checking authentication status");
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    
    if (!sessionCookie) {
      console.log("❌ No session cookie found");
      return false;
    }
    
    console.log("🔵 Session cookie found, verifying user");
    const user = await getCurrentUser();
    console.log("Authentication result:", !!user);
    return !!user;
  } catch (error) {
    console.error("❌ Authentication check error:", error);
    return false;
  }
}