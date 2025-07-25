# ML Dojo - Project Handover & Debugging Guide

This document provides a complete guide for setting up, running, and debugging the ML Dojo application. The project is currently facing a persistent build error that seems to be related to the Genkit and Next.js integration. The goal of this guide is to provide a new developer or an AI agent (like the Kimi agent) with all the necessary context to solve this final issue.

---

## 1. Pushing the Project to GitHub

To collaborate or get help, first push the current codebase to a new GitHub repository.

**Step 1: Create a New Repository on GitHub**
1.  Go to [GitHub](https://github.com) and log in.
2.  Click the `+` icon in the top-right corner and select "New repository".
3.  Give it a name (e.g., `ml-dojo-app`) and a description.
4.  Choose "Private" if you don't want it to be public.
5.  **Do not** initialize it with a README, .gitignore, or license. We already have those.
6.  Click "Create repository".

**Step 2: Push the Local Code to GitHub**
Open your terminal in the project directory and run the following commands. Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPOSITORY_NAME` with your details.

```bash
# Initialize a git repository if you haven't already
git init -b main

# Add all files to staging
git add .

# Create the first commit
git commit -m "Initial commit of ML Dojo project"

# Add your new GitHub repository as the remote origin
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git

# Push the code to the main branch on GitHub
git push -u origin main
```

---

## 2. Kimi Dev Program: Setup and Debugging Instructions

This section details how to set up the project from scratch to debug the final build error.

### Project Overview
ML Dojo is a Next.js application designed to be an AI-powered coding tutor. It uses Firebase for authentication and database services, and Google AI (via Genkit) for its intelligent features.

### Core Technologies
- **Framework:** Next.js (with App Router)
- **UI:** Tailwind CSS with shadcn/ui
- **Database & Auth:** Firebase (Firestore and Authentication)
- **AI Integration:** Google AI (Gemini) via Genkit

### Step 1: Firebase Setup
The app is hardcoded to a specific Firebase project, but a new setup is required.

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Authentication:**
    - In the "Build" section, go to **Authentication**.
    - Click "Get started".
    - In the "Sign-in method" tab, enable the **Email/Password** provider.
3.  **Set Up Firestore:**
    - In the "Build" section, go to **Firestore Database**.
    - Click "Create database".
    - Start in **Production mode**. Choose a location and click "Enable".
    - Go to the **Rules** tab and paste in the following open rules for development. This allows any logged-in user to read/write, which simplifies debugging:
      ```
      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /{document=**} {
            allow read, write: if request.auth != null;
          }
        }
      }
      ```
4.  **Get Firebase Config:**
    - Go to your Project Settings (click the gear icon ⚙️).
    - In the "Your apps" section, create a new **Web App** (`</>`).
    - Give it a name and register the app.
    - Firebase will provide you with a `firebaseConfig` object. Copy this object.
5.  **Update the App Code:**
    - Open `src/lib/firebase/client.ts`.
    - Replace the existing `firebaseConfig` object with the one you just copied.

### Step 2: Google AI (Genkit) Setup
The AI features are powered by the Gemini model through Genkit.

1.  **Get a Google AI API Key:**
    - Go to [Google AI Studio](https://aistudio.google.com/).
    - Click "Get API key" and create a new key.
    - Copy the key.
2.  **Create a `.env.local` file:**
    - In the root of the project, create a new file named `.env.local`.
    - Add your API key to this file. It should look like this (no quotes):
      ```
      GOOGLE_API_KEY=AIzaSy...
      ```
    - The `.gitignore` file is already configured to keep this file private.

### Step 3: Run the Application
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

### Step 4: The Current Issue (For the Kimi Agent)
The application is failing during the `npm run dev` build process.

- **Error:** The most recent error was `Export next doesn't exist in target module` originating from `src/ai/genkit.ts`.
- **Suspicion:** The problem lies in the integration between Next.js and Genkit. The setup of the `genkit.ts` file, the Genkit API route (`src/app/api/genkit/[slug]/route.ts`), and the server actions (`src/lib/actions.ts`) are the most likely sources of the error.
- **Request:** Please review the Genkit setup files and correct the integration to follow the latest best practices for using Genkit within a Next.js 14+ App Router project. The goal is to get the `npm run dev` command to build successfully.
