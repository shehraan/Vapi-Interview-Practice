<div align="center">
  <br />
  <br />

  <div>
    <img src="https://img.shields.io/badge/-Next.JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=black" alt="next.js" />
    <img src="https://img.shields.io/badge/-Vapi-white?style=for-the-badge&color=5dfeca" alt="vapi" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
    <img src="https://img.shields.io/badge/-Firebase-black?style=for-the-badge&logoColor=white&logo=firebase&color=DD2C00" alt="firebase" />
    <img src="https://img.shields.io/badge/-Google_Gemini-blue?style=for-the-badge&logoColor=white&logo=google&color=4285F4" alt="google gemini" />
  </div>

  <h3 align="center">AI Interview Practice: Conduct mock interviews with Voice Agents</h3>

   <div align="center">
     An app for practicing job interviews using AI voice agents.
   </div>
</div>

## 📋 Table of Contents

1.  [Introduction](#introduction)
2.  [Tech Stack](#tech-stack)
3.  [Features](#features)
4.  [Quick Start](#quick-start)

## <a name="introduction">🤖 Introduction</a>

This project utilizes Next.js for the frontend and backend API routes, Firebase for authentication and database storage (Firestore), TailwindCSS for styling, and Vapi for integrating voice AI agents powered by Google Gemini. It allows users to generate mock interview questions based on job criteria and then practice answering those questions with a voice agent, receiving feedback afterward.

The application architecture involves frontend components triggering backend API routes for tasks like question generation, which then interact with AI models and the database.

## <a name="tech-stack">⚙️ Tech Stack</a>

-   Next.js (v14+ with App Router)
-   Firebase (Authentication & Firestore)
-   Tailwind CSS
-   Vapi AI SDK
-   shadcn/ui
-   Google Gemini (via Vercel AI SDK & Google AI SDK)
-   Zod (for schema validation)
-   TypeScript

## <a name="features">🔋 Features</a>

*   **Firebase Authentication**: Secure user Sign Up and Sign In via email/password.
*   **Dynamic Interview Generation**: Users specify job role, level, tech stack, and desired question count. The backend API (`/api/vapi/generate`) uses Google Gemini to create relevant interview questions.
*   **AI Voice Interview Practice**: Users can start an interview session where a Vapi voice agent asks the generated questions.
*   **AI-Powered Feedback**: After completing an interview, the conversation transcript is sent to Google Gemini (via a server action `createFeedback`) to generate detailed feedback on communication, technical knowledge, problem-solving, and more.
*   **Modern UI/UX**: Interface built with Tailwind CSS and shadcn/ui for a clean user experience.
*   **Interview Dashboard**: Users can view and manage their past interviews.
*   **Responsive Design**: Adapts to various screen sizes.

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed:

-   [Git](https://git-scm.com/)
-   [Node.js](https://nodejs.org/en) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone <your-repository-url> # Replace with the actual URL if needed
cd <repository-directory-name>
```

**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Set Up Environment Variables**

Create a new file named `.env.local` in the root of your project and add the following environment variables:

```env
# Vapi Credentials
NEXT_PUBLIC_VAPI_API_KEY=YOUR_VAPI_PUBLIC_KEY # Or NEXT_PUBLIC_VAPI_WEB_TOKEN if using web token
# VAPI_ASSISTANT_ID=YOUR_VAPI_INTERVIEWER_ASSISTANT_ID # Required if directly calling Vapi 'start' with an assistant ID
# VAPI_WORKFLOW_ID=YOUR_VAPI_WORKFLOW_ID # Required if using Vapi Workflows

# Google Gemini API Key (used in the backend API route)
GOOGLE_GENERATIVE_AI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY

# Base URL for API calls (usually needed for server actions or absolute fetch paths)
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # Change if deploying

# Firebase Credentials (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_WEB_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID

# Firebase Admin Credentials (Server-side - Used in API routes/Server Actions)
# Ensure these are kept secure and not exposed client-side.
# Consider using Base64 encoding for the private key if needed.
FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL=YOUR_FIREBASE_ADMIN_SERVICE_ACCOUNT_EMAIL
FIREBASE_PRIVATE_KEY=YOUR_FIREBASE_ADMIN_PRIVATE_KEY # Replace newlines with \\n or use Base64
```

Replace the placeholder values with your actual credentials from **[Firebase](https://firebase.google.com/)**, **[Vapi AI](https://vapi.ai/)**, and **[Google AI Studio](https://aistudio.google.com/)**. Ensure your Firebase service account has necessary permissions (e.g., Firestore read/write).

**Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.
