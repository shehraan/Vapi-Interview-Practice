"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type === "sign-up") {
        const { name, email, password } = data;

        console.log("Starting sign-up process...");

        let userCredential;
        try {
          // Try to create new user
          userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          console.log("Created new user:", userCredential.user.uid);
        } catch (error: any) {
          // If user exists, try to sign in instead
          if (error.code === 'auth/email-already-in-use') {
            console.log("User exists, attempting sign in...");
            userCredential = await signInWithEmailAndPassword(
              auth,
              email,
              password
            );
            console.log("Signed in existing user:", userCredential.user.uid);
          } else {
            throw error; // Re-throw other errors
          }
        }

        // Always try to create/update user document in Firestore FIRST
        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          photoURL: userCredential.user.photoURL || undefined,
        });

        console.log("Firestore result:", result);

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        // Only after Firestore document is created, proceed with sign in
        const idToken = await userCredential.user.getIdToken(true); // Force refresh the token
        console.log("Got fresh ID token");

        const signInResult = await signIn(idToken);
        console.log("Sign in result:", signInResult);

        if (!signInResult.success) {
          toast.error(signInResult.message);
          return;
        }

        toast.success("Account created and signed in successfully.");
        router.push("/");
        router.refresh();
      } else {
        const { email, password } = data;

        console.log("Starting sign-in process...");

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        console.log("Got user credential:", userCredential.user.uid);

        // Ensure user document exists in Firestore
        const result = await signUp({
          uid: userCredential.user.uid,
          name: userCredential.user.displayName || email.split('@')[0],
          email,
          photoURL: userCredential.user.photoURL || undefined,
        });

        console.log("Firestore document check result:", result);

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        // Get a fresh token after ensuring Firestore document exists
        const idToken = await userCredential.user.getIdToken(true);
        if (!idToken) {
          toast.error("Sign in Failed. Please try again.");
          return;
        }

        console.log("Got fresh ID token");

        const signInResult = await signIn(idToken);

        console.log("Sign in result:", signInResult);

        if (!signInResult.success) {
          toast.error(signInResult.message);
          return;
        }

        toast.success("Signed in successfully.");
        router.push("/");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address.');
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error('Email/password accounts are not enabled. Please contact support.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please use a stronger password.');
      } else if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password.');
      } else {
        toast.error(error.message || "Authentication failed. Please try again.");
      }
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image 
            src="/chat (1).svg"
            alt="logo" 
            height={32} 
            width={38}
            style={{ width: 'auto', height: 'auto' }}
          />
          <h2 className="text-primary-100">Vapi Practice Interview\</h2>
        </div>

        <h3>Practice job interviews with AI</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                type="text"
              />
            )}

            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your email address"
              type="email"
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            <Button className="btn" type="submit">
              {isSignIn ? "Sign In" : "Create an Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;