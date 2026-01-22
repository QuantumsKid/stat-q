# StatQ - Changelog

## [Unreleased] - 2025-12-13

### 🎉 Major Improvements

This release includes significant improvements across bug fixes, accessibility, error handling, and database optimizations.

---

### ✅ Phase 1: Critical Bug Fixes (COMPLETE)

#### Quick Wins
- **Fixed mode calculation** - Returns `null` for uniform distributions instead of incorrect value
- **Sample variance** - Already using n-1 denominator (verified)
- **Form duplication logic** - Now properly handles both legacy AND advanced logic rules (nested conditions, setValue, calculate actions)
- **CSV export matrix labels** - Already working correctly (verified)
- **Server-side answer validation** - Fully implemented for all 11 question types
- **Linear scale step validation** - Enforces that step must evenly divide range with helpful error messages
- **Reduced motion support** - Respects user's OS accessibility preference
- **Link contrast in dark mode** - Proper WCAG-compliant colors using OKLCH
- **Print stylesheet** - Comprehensive print optimization (hides nav/buttons, optimizes page breaks, shows URLs)
- **Database index on logic_rules** - GIN index for JSONB queries

#### Additional Critical Fixes
- **Autosave rollback** - Added `rollback()` function to restore last successful save on network failure
  - New methods: `rollback()`, `getLastSuccessfulSave()`, `hasFailedSave`
  - Rollback button appears in error toasts
- **Circular logic prevention** - Server-side validation now BLOCKS submission (not just warns)
  - Returns error code `CIRCULAR_LOGIC`
- **Conflicting logic rules** - Priority-based resolution ensures higher priority rules win
  - Tracks action priorities per question
  - Prevents lower priority rules from overriding
- **Checkbox logic arrays** - Proper handling of array comparisons
  - `equals`: Checks array equality
  - `not_equals`: Checks array inequality
  - `contains`: Checks if value is in array
- **Matrix required indicators** - Already implemented with asterisks and selection UI
- **Other option validation** - Client-side UI + server-side validation fully integrated
- **Max form size constraint** - Limited to 100 questions with server-side enforcement
  - Returns error code `MAX_QUESTIONS_EXCEEDED`
- **Unused schema_json field** - Marked as deprecated, removed from validations

---

### ✅ Phase 2: Error Handling & Accessibility (COMPLETE)

#### Error Handling
- **Global Error Boundary** - React error boundary component catches all errors
  - User-friendly error messages
  - Development mode shows stack traces
  - Reset and "Go to dashboard" buttons
- **Consistent error response format** - Already implemented via `server-error-handler.ts`
  - Standardized error codes (UNAUTHORIZED, VALIDATION_ERROR, NOT_FOUND, etc.)
  - User-friendly messages
  - Structured error logging

#### Accessibility
- **Keyboard navigation utilities** - Comprehensive keyboard support
  - Arrow key navigation
  - Focus trapping for modals
  - Skip to content links
  - Common shortcuts (Ctrl+S, Ctrl+P, Alt+Up/Down, etc.)
- **ARIA labels and helpers** - Complete accessibility utilities
  - Screen reader announcements
  - Accessible button/form field helpers
  - ARIA ID generation
  - Focus management utilities
  - Detects user preferences (reduced motion, high contrast, dark mode)

---

### 📦 New Files Created

**Components:**
- `src/components/ErrorBoundary.tsx` - Global error boundary component

**Utilities:**
- `src/lib/utils/keyboard-navigation.ts` - Keyboard navigation and shortcuts
- `src/lib/utils/accessibility.ts` - ARIA and accessibility helpers

**Database:**
- `complete-migration.sql` - Comprehensive database migration

---

### 🗄️ Database Changes

All database changes are consolidated in `complete-migration.sql`. Key updates:

#### New Columns
- `forms.display_mode` - Choose between single-question or scroll mode
- `responses.started_at` - Track when respondent started the form
- `responses.submitted_at` - Now nullable (NULL until submitted)

#### New Question Types
- `slider` - Slider input with min/max/step
- `ranking` - Drag-and-drop ranking
- `file_upload` - File upload with validation

#### Performance Indexes
- `idx_questions_logic_rules` (GIN) - For conditional logic queries
- `idx_forms_published` (Partial) - For public form queries
- `idx_questions_form_order` (Composite) - For question ordering
- `idx_forms_user_updated` (Composite) - For user dashboard
- `idx_questions_type` - For analytics by question type
- `idx_responses_complete` (Composite) - For completion tracking
- `idx_answers_value` (GIN) - For answer value searches

#### Data Quality Constraints
- `forms_title_not_empty` - Ensures valid form titles
- `questions_title_not_empty` - Ensures valid question titles
- `questions_order_index_valid` - Ensures non-negative order

#### Database Views
- `form_statistics` - Aggregated form stats (question count, response count, etc.)
- `question_analytics` - Question-level analytics

#### Utility Functions
- `get_form_completion_rate(form_uuid)` - Calculate completion percentage
- `get_avg_response_time(form_uuid)` - Calculate average response time

---

### 🔧 Modified Files

**Core Logic:**
- `src/lib/utils/statistics-engine.ts` - Fixed mode calculation
- `src/app/(dashboard)/dashboard/actions.ts` - Form duplication + schema_json cleanup
- `src/hooks/use-autosave-with-retry.ts` - Added rollback functionality
- `src/app/(dashboard)/forms/[formId]/edit/actions.ts` - Circular logic prevention + max questions
- `src/lib/utils/advanced-logic-evaluator.ts` - Priority-based conflict resolution
- `src/lib/utils/logic-evaluator.ts` - Checkbox array handling
- `src/components/form-builder/question-types/LinearScaleEditor.tsx` - Step validation

**Configuration:**
- `src/lib/constants/question-limits.ts` - Max questions reduced to 100
- `src/lib/types/form.types.ts` - Deprecated schema_json
- `src/lib/validations/form.validation.ts` - Removed schema_json + added display_mode

**UI/UX:**
- `src/app/layout.tsx` - Added ErrorBoundary
- `src/app/globals.css` - Print stylesheet (lines 107-206)

---

### 📊 Build Status

✅ **Production build passes with ZERO errors**
- All TypeScript strict checks pass
- All linting passes
- All routes compile successfully

---

### 🚀 How to Apply Database Changes

Run the complete migration SQL in your Supabase SQL Editor:

```bash
# The migration is located at:
./complete-migration.sql
```

This migration is **incremental** and safe to run on existing databases. It uses:
- `IF NOT EXISTS` checks to avoid duplicates
- `DO $$ BEGIN ... EXCEPTION ... END $$` blocks for safe alterations
- Comments and verification steps

---

### 📝 What's Still Todo (Future Phases)

**Phase 3-8 Remaining Features** (~70 items):
- Undo/redo functionality
- Form templates (10+ starter templates)
- Bulk operations (delete, duplicate, move)
- Import/export (JSON, CSV)
- Version control/history
- Form scheduling (start/end dates)
- Response limit enforcement
- Password-protected forms
- PDF export for analytics
- Cross-tabulation between questions
- Correlation analysis
- Date range filtering for analytics
- Word clouds for text responses
- Heatmaps for matrix questions
- Response quality metrics
- Abandonment analysis
- Audit logging
- Response deletion/editing
- Background jobs system
- Rate limiting per user
- i18n/RTL support

**Code Quality Improvements** (Optional):
- Reduce 49 instances of `as unknown` casts
- Remove 3 instances of `any` type
- Implement discriminated unions for question types

---

### 🙏 Notes

**Excluded from this release:**
- AI/LLM features (sentiment analysis, question generation, answer summarization)
- Real-time features (WebSockets for live dashboard)

All non-AI features are production-ready and fully tested.

---

### 📅 Release Date
2025-12-13
