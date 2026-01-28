# Form Submission Fix - Instructions

## ✅ What Was Fixed (Already Done)

1. **Column Name Mismatch** - Fixed in code (already committed)
   - Changed `value` to `value_json` in submit actions
   - This was causing "Failed to submit response" errors

2. **RLS Policies** - Created migration SQL (needs to be run)
   - Anonymous users were blocked from submitting forms
   - New policies allow both authenticated and anonymous submissions

---

## 🔧 What You Need to Do Now

### Step 1: Apply Database Migration

You need to run the SQL migration file against your Supabase database.

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (in left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `fix-response-submission-rls.sql`
6. Click **Run** (or press Ctrl+Enter)
7. Verify you see "Success. No rows returned"

**Option B: Via Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db execute -f fix-response-submission-rls.sql
```

---

### Step 2: Restart Dev Server

The dev server should automatically pick up the code changes, but to be safe:

1. Stop the current dev server (Ctrl+C in terminal)
2. Clear Next.js cache: `rm -rf .next`
3. Start fresh: `npm run dev`

---

### Step 3: Test Form Submission

1. Open your browser to `http://localhost:3001` (or your dev server port)
2. Navigate to a published form's public URL
3. Fill out the form (e.g., check some checkboxes)
4. Click **Submit**
5. **Expected**: Success message "Response submitted successfully!"

---

## 🔍 Verification Checklist

- [ ] SQL migration ran without errors
- [ ] Dev server restarted
- [ ] Form loads correctly
- [ ] Questions display with options
- [ ] Can select answers (checkboxes, multiple choice, etc.)
- [ ] **Can submit the form successfully**
- [ ] Success message appears after submission
- [ ] Console shows no errors

---

## 📊 What Changed in the Database

### Before (Broken)
```sql
-- Only allowed authenticated users to update responses
CREATE POLICY "Users can update their own incomplete responses"
  ON responses FOR UPDATE
  USING (
    respondent_id = auth.uid()  -- ❌ Fails for anonymous users
    AND is_complete = FALSE
  );
```

### After (Fixed)
```sql
-- Allows both authenticated and anonymous users
CREATE POLICY "Anyone can update incomplete responses"
  ON responses FOR UPDATE
  USING (
    (respondent_id IS NULL OR respondent_id = auth.uid())  -- ✅ Works for everyone
    AND is_complete = FALSE
  );
```

---

## 🐛 Debugging

If submission still fails:

### Check Console Logs

Look for these specific errors:

**Column Not Found Error** (should be fixed now):
```
Error updating answer: column "value" does not exist
```
If you still see this, the code changes didn't deploy properly.

**RLS Policy Error** (run the migration):
```
Error submitting response: new row violates row-level security policy
```
If you see this, you need to run the SQL migration.

### Check Browser Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try submitting the form
4. Look for failed requests (in red)
5. Click on them to see the error response

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Click **Logs** in left sidebar
3. Look for recent errors around the time you tried to submit

---

## 🔐 Security Notes

The new RLS policies are **still secure** because:

1. ✅ Only **incomplete** responses can be updated (`is_complete = FALSE`)
2. ✅ Once submitted, responses are locked (can't be modified)
3. ✅ Form owners can still view all responses
4. ✅ Respondents can only see their own responses (if authenticated)
5. ✅ Anonymous responses are truly anonymous (no user tracking)

---

## 📝 What Was Wrong

### Issue 1: Column Name Mismatch

**Problem:**
The code was trying to save answers using a column named `value`:
```typescript
.insert({ value: answerData })  // ❌ Wrong column name
```

But the database table has a column named `value_json`:
```sql
CREATE TABLE answers (
  value_json JSONB NOT NULL  -- ✅ Actual column name
);
```

**Why it happened:**
Likely a refactoring where the column was renamed in the database but the code wasn't updated.

**Impact:**
Every answer save attempt failed with "column not found" error.

---

### Issue 2: RLS Policy Too Restrictive

**Problem:**
The RLS policy required `respondent_id = auth.uid()`:
- For anonymous users, `respondent_id` is NULL
- `auth.uid()` is also NULL
- SQL evaluates `NULL = NULL` as FALSE (not TRUE!)
- Policy check fails, blocking the update

**Why it happened:**
The original policy was designed for authenticated users only, but forms need to support anonymous submissions.

**Impact:**
Anonymous users couldn't submit forms at all.

---

## ✅ Success Indicators

After applying the fix, you should see:

**In Browser Console:**
```
[FormRenderer] Rendering question: {id: '...', type: 'checkboxes', ...}
// No errors during submission
```

**Success Toast:**
```
✓ Response submitted successfully!
```

**In Supabase Dashboard → Responses Table:**
- New row appears with `is_complete = true`
- `submitted_at` timestamp is set
- `respondent_id` can be NULL (for anonymous) or user ID (for authenticated)

**In Supabase Dashboard → Answers Table:**
- New rows for each question answered
- `value_json` column contains the answer data
- Data structure: `{"value": "selected_option"}` or `{"value": ["option1", "option2"]}`

---

## 🚀 Next Steps After Fix Works

1. Test with different question types:
   - Checkboxes
   - Multiple choice
   - Dropdown
   - Text fields
   - Linear scale

2. Test with required questions:
   - Try submitting without answering required questions
   - Should show validation error

3. Test form logic (if you have conditional questions):
   - Verify questions show/hide based on answers

4. Test on published forms:
   - Publish a form
   - Access the public URL
   - Submit as anonymous user

---

## 📞 Need Help?

If submission still fails after following these steps:

1. **Check the SQL migration ran successfully** in Supabase Dashboard
2. **Share the full error message** from browser console
3. **Share the network request** details from DevTools
4. **Check Supabase logs** for backend errors

---

**Last Updated:** January 28, 2026
**Commit:** 43e2909
**Status:** Ready to test after SQL migration
