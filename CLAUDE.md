# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: StatQ

An advanced AI-powered questionnaire platform built with Next.js that surpasses Google Forms with statistical analysis, AI-driven insights, and modern UX.

## Development Commands

```bash
# Development
npm run dev          # Start development server (localhost:3000)

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Tech Stack & Architecture

**Core Stack:**
- Next.js 15+ (App Router with TypeScript strict mode)
- Tailwind CSS 4 + Shadcn/UI components
- Supabase (PostgreSQL + Auth)
- React Query (server state) + Zustand (client state)
- React Hook Form + Zod validation
- Recharts/Visx for visualization
- OpenAI SDK for AI features

**Key Architectural Decisions:**
1. **Next.js App Router:** All pages use app directory structure (`src/app/`)
2. **Path Aliases:** Use `@/*` for imports from `src/*` directory
3. **TypeScript Strict Mode:** The `any` type is forbidden - define interfaces/types for everything
4. **Server Actions:** All mutations (form submissions, DB writes) use Next.js Server Actions
5. **Supabase RLS:** Row Level Security must be enabled - no open access tables

## Project Structure

```
src/
  app/              # Next.js App Router pages
    layout.tsx      # Root layout with Geist fonts
    page.tsx        # Home page
  utils/
    supabase/       # Supabase client utilities (to be created)
      server.ts     # Server-side client
      client.ts     # Client-side client
      middleware.ts # Auth middleware
  components/       # Shadcn/UI components (to be scaffolded)
  lib/              # Utility functions
```

## Database Schema

```sql
profiles:
  - id (uuid, references auth.users)
  - role (enum: 'admin' | 'respondent')
  - email (text)

forms:
  - id (uuid, pk)
  - title (text)
  - description (text)
  - schema_json (jsonb) # Form structure/questions
  - user_id (uuid, fk to profiles)

questions:
  - id (uuid, pk)
  - form_id (uuid, fk)
  - type (enum: short_text, long_text, multiple_choice, checkboxes, dropdown, linear_scale, matrix, date_time)
  - logic_rules (jsonb) # Conditional logic
  - required (boolean)

responses:
  - id (uuid, pk)
  - form_id (uuid, fk)
  - respondent_email (text, nullable)
  - submitted_at (timestamp)

answers:
  - id (uuid, pk)
  - response_id (uuid, fk)
  - question_id (uuid, fk)
  - value_json (jsonb)
```

## Critical Coding Standards

1. **Type Safety:** Strict TypeScript - no `any` types allowed
2. **Component Modularity:** Break UI into small, reusable components (atomic design)
3. **Error Handling:** All Server Actions must use try/catch and return user-friendly errors
4. **Statistical Logic:** Implement `StatisticsEngine.ts` utility for calculations (mean, median, mode, std dev, variance, frequency distributions)
5. **Authentication:** Supabase Email/Password auth only, with RBAC (Admin/Respondent roles)
6. **UI Standards:**
   - Mobile-first responsive design
   - Dark mode support (built-in default)
   - Glassmorphism & gradients (no flat designs)
   - Micro-interactions and smooth transitions
   - Use Shadcn/UI components with 'slate' base color

## Supabase Configuration

When creating Supabase clients:
- **Server-side:** Use `@supabase/ssr` for App Router with cookie handling
- **Client-side:** Use `@supabase/supabase-js`
- **Middleware:** Implement auth middleware for protected routes
- Enable RLS policies on all tables before development

## Question Types Supported

- Short Text / Long Text
- Multiple Choice / Checkboxes
- Dropdowns
- Linear Scale (Likert)
- Matrix/Grid (complex)
- Date/Time

## Key Features to Implement

1. **Form Builder:** Drag-and-drop interface with conditional logic
2. **Respondent View:** Single-question-per-step (Typeform style) OR scroll mode
3. **Statistical Analysis:**
   - Descriptive stats (mean, median, mode, std dev, variance)
   - Frequency distributions
   - Cross-tabulation (filter Q1 by Q2 answers)
   - Trend analysis (time-series)
4. **Auto-save:** Local Storage + DB persistence
5. **AI Integration:** Question generation and open-ended answer summarization

## Development Phases

**Phase 1:** Scaffolding, Auth, Database setup (CURRENT)
**Phase 2:** Form Builder CRUD and rendering
**Phase 3:** Response collection
**Phase 4:** Statistical Engine & Analytics Dashboard

## Important Notes

- **DO NOT** use `create-next-app` again - project is already scaffolded
- **Shadcn/UI:** Use 'slate' as base color, CSS variables enabled
- **Fonts:** Project uses Geist Sans and Geist Mono (pre-configured)
- **State Management:** React Query for server state, Zustand for client global state
- **Form Validation:** React Hook Form + Zod schemas
- **Toast Notifications:** Use Sonner for user feedback
