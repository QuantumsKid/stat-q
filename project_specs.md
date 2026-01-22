# Project Specification: Advanced AI Questionnaire Platform
**Project Name:** StatQ
**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase, Shadcn/UI.

## 1. Project Overview
We are building a cutting-edge survey and data analysis platform. It surpasses Google Forms by offering advanced statistical analysis, AI-driven insights, and a highly interactive, modern UX.

## 2. Technical Architecture & Stack
* **Framework:** Next.js 15+ (App Router).
* **Language:** TypeScript (Strict Mode).
* **Styling:** Tailwind CSS + Shadcn/UI (Components) + Framer Motion (Animations).
* **Database & Auth:** Supabase (PostgreSQL).
* **State Management:** React Query (TanStack Query) for server state, Zustand for client global state.
* **Forms:** React Hook Form + Zod (Schema Validation).
* **Charts/Vis:** Recharts or Visx.
* **AI Integration:** OpenAI SDK (or compatible) for generating questions and summarizing open-ended answers.

## 3. Core Features & Requirements

### A. Authentication (Supabase)
* Implementation of Supabase Auth using Email/Password only.
* **Role-Based Access Control (RBAC):**
    * `Admin`: Can create forms, view all data, access analytics.
    * `Respondent`: Anonymous or authenticated users who answer forms.

### B. The Form Builder (Admin Panel)
* **Drag-and-Drop Interface:** Smooth UX for reordering questions.
* **Question Types Supported:**
    * Short Text / Long Text.
    * Multiple Choice / Checkboxes.
    * Dropdowns.
    * Linear Scale (Likert).
    * Matrix/Grid (Complex).
    * Date/Time.
* **Logic:** Conditional logic (Show Question B only if Question A answer is X).

### C. The Respondent View
* Distraction-free, single-question-per-step mode (Typeform style) OR classic scroll mode (toggleable).
* Real-time validation.
* Auto-save progress (Local Storage + DB).

### D. Advanced Statistical Analysis (The Core)
* **The system must perform client-side or server-side calculation of:**
    * Descriptive Stats: Mean, Median, Mode, Standard Deviation, Variance.
    * Frequency Distributions.
    * Cross-Tabulation (filtering results of Q1 based on answers to Q2).
    * Trend Analysis (time-series data of submission timestamps).
* **Visualization:** Dynamic rendering of charts based on data type (e.g., Pie for boolean, Bar for categorical, Histogram for linear scales).

## 4. Database Schema (Conceptual)
* `profiles`: (id, role, email).
* `forms`: (id, title, description, schema_json, user_id).
* `questions`: (id, form_id, type, logic_rules, required).
* `responses`: (id, form_id, respondent_email, submitted_at).
* `answers`: (id, response_id, question_id, value_json).

## 5. UI/UX Guidelines ("Cutting Edge")
* **Glassmorphism & Gradients:** Subtle use of blur and modern gradients; no flat, boring designs.
* **Micro-interactions:** Buttons should provide feedback; transitions between routes must be smooth.
* **Responsive:** Mobile-first approach is mandatory.
* **Dark Mode:** Built-in default support.

## 6. Coding Standards & Best Practices (Strict Rules)
1.  **Type Safety:** `any` is strictly forbidden. Define Interfaces/Types for EVERYTHING.
2.  **Server Actions:** Use Next.js Server Actions for all mutations (submitting forms, creating questions).
3.  **Supabase RLS:** Row Level Security must be enabled immediately. No open access tables.
4.  **Component Modularity:** Break down UI into small, reusable components (atoms/molecules).
5.  **Error Handling:** Use `try/catch` blocks in server actions and display user-friendly Toasts (Sonner) on the UI.
6.  **Code Logic for Math:** Do not rely solely on DB aggregation. Implement a utility class `StatisticsEngine.ts` that takes raw data arrays and returns calculated statistical objects.

## 7. Development Phases
1.  **Phase 1:** Scaffolding, Auth, and Database setup.
2.  **Phase 2:** Form Builder (CRUD) and Rendering.
3.  **Phase 3:** Response collection.
4.  **Phase 4:** The Statistical Engine & Dashboard.
