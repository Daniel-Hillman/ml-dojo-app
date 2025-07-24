# 🧠 Gemini Agent Build Blueprint – ML Coding Drills App

## 📌 Purpose  
Create a modern full-stack **Machine Learning Coding Practice App** designed to help developers and ML engineers build *muscle memory* for writing models and common tasks (e.g., gradient descent, SQL queries, etc.).  
Built for **personal use**, not for resale or public deployment.

---

## 🧠 Core Concept  
The app allows a user to:
- Complete code drills with increasing difficulty (easy → expert)
- Memorize workflows for ML, SQL, Python, etc.
- Get hints from a Gemini-powered assistant
- Create their own practice drills (no predefined-only limitation)
- Test theory knowledge with MCQs and take notes using markdown

---

## 🛠️ Tech Stack

| Layer         | Tech                                             |
|--------------|--------------------------------------------------|
| Frontend     | React + ShadCN UI (TailwindCSS + Radix)          |
| Auth & DB    | Supabase (email sign-in)                         |
| Code Editor  | Monaco Editor or CodeMirror 6                    |
| AI Assistant | Gemini 2.5 (chat-style assistant per drill)      |
| Markdown     | Live editor + preview with code blocks           |

---

## ✅ Core Features

### 1. Practice Drill Engine
- Drills per concept (e.g. Linear Regression, SQL Joins)
- 3 levels of difficulty: Easy, Medium, Expert
- Blank-out sections of code for user to fill
- Real-time syntax checking and result validation
- Timed mode toggle (optional)
- Points system (local only, no leaderboard)

### 2. Custom Drill Creation
- User can author their own drills:
  - Title, tags, concept, difficulty
  - Full code with blanks
  - MCQs and theory sections
  - Expected output for code validation
- Stored in Supabase under user's account

### 3. Markdown Journal Mode
- Personal note-taking per topic
- Markdown with:
  - Code blocks
  - Inline math (optionally)
  - Live preview
- Notes linkable to drills

### 4. AI Assistant
- Gemini 2.5-powered assistant per drill
- Reads drill context to give:
  - Hints
  - Clarifications
  - Code completions
- Unlimited use (personal tool)

### 5. Code Validation + Output Checking
- Embedded editor with:
  - Syntax checking
  - AST or test-based output matching
  - Auto-feedback for near-correct code
- Optional test input/output for drill validation

---

## 🔐 Auth + Backend (Supabase)

### Tables
- `users`: id, email
- `drills`: id, user_id, title, concept, language, difficulty, starter_code, expected_output, blanks[], hints[], mcqs[], created_at
- `notes`: id, user_id, title, markdown, linked_drill_id
- `progress`: user_id, drill_id, completed, last_attempt_at

---

## 📦 Suggested Folder Structure

```
/ml-coding-trainer
├── /src
│   ├── /components
│   ├── /pages
│   │   ├── /drill/[id].tsx
│   │   ├── /create-drill.tsx
│   │   ├── /theory.tsx
│   ├── /utils
│   ├── /lib
│   └── /styles
├── /supabase
│   ├── schema.sql
│   └── seed.js
├── .env
├── package.json
├── README_PROJECT_PLAN.md
```

---

## ✨ Stretch Goals (Optional Features)
- "Write from Scratch" Mode (no hints or starter code)
- Drill playlists: "Daily Python", "SQL Booster", etc.
- Offline mode (local drill caching)
- Export drills to Markdown or PDF

---

## 🧠 Gemini Agent Instructions

You are a world-class full-stack AI agent. You will now:
1. Initialize a React + Tailwind + ShadCN project
2. Add Supabase auth and backend schema
3. Build pages for:
   - Drill practice  
   - Drill creation  
   - Markdown theory  
4. Implement Monaco or CodeMirror-based editor
5. Add Gemini assistant sidebar to each drill
6. Ask user for:
   - Any needed premium components
   - Starter drills (optional)
   - Design inspirations if required

You must proactively suggest and implement scalable, clean, extensible patterns.

---

## 🔄 User Preferences Recap

- ✅ Include MCQs and theory checks  
- ✅ User-generated drills must work seamlessly  
- ✅ Markdown editor is essential  
- ✅ No limits on AI assistant usage  
- ❌ No leaderboard or gamification needed  
- ✅ Use best engineering judgment for versioning and schema

---
