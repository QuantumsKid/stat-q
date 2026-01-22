# Codebase Summary: stat-q

## Project Overview

`stat-q` is a form-building application designed for creating, managing, and analyzing forms. It features a modern web stack and a clear architectural separation between public-facing elements and a private, feature-rich user dashboard.

## Core Technologies

- **Framework**: [Next.js](https://nextjs.org/) (React framework)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Backend**: [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- **Database**: [Supabase](https.supabase.io) (PostgreSQL)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Internationalization (i18n)**: `next-intl`

## Application Structure

The application is organized into two main sections:

1.  **Public Area**: Handles public-facing pages, such as the login page and potentially published forms.
2.  **Dashboard (`/src/app/(dashboard)`)**: A private, authenticated area where users manage their forms.

### Dashboard Features

The dashboard provides a comprehensive set of features for form management, accessible through a form-specific route (`/forms/[formId]/`):

- **Form Editor (`/edit`)**: Allows for the creation and modification of forms.
- **Analytics (`/analytics`)**: Displays form performance metrics.
- **Responses (`/responses`)**: Provides a view of submitted form responses.
- **Version History (`/versions`)**: Manages different versions of a form.

### Backend and Data

- **API Endpoints**: The backend is implemented using Next.js API routes located in `src/app/api/`. A critical endpoint is `api/forms/[formId]/submit/`, which handles new form submissions.
- **Database Schema**: The database structure is defined in `.sql` files, with `database.sql` likely containing the primary schema for tables such as forms, questions, and responses.

## Key Files and Directories

- `package.json`: Defines all project dependencies, scripts, and metadata.
- `src/app/layout.tsx`: The root layout for the entire application.
- `src/app/(dashboard)/layout.tsx`: The specific layout for the user dashboard area.
- `src/app/(dashboard)/forms/[formId]/`: Directory containing the core form management pages.
- `src/app/api/`: Location of all backend API route handlers.
- `database.sql`: Contains the core database schema definitions.
- `supabase/migrations/`: Contains database migration scripts.
