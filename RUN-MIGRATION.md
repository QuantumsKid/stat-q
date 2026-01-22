# Database Migration Instructions

## Issue Fixed
This migration adds missing question types to your database so you can create all question types in the UI.

## What's Being Added
- `file_upload` - Allow users to upload files
- `ranking` - Allow users to rank items
- `slider` - Allow users to select values with a slider

## How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project (enrxccgihdeomtryijqo)
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the contents of `migration-add-question-types.sql`
6. Click "Run" or press Ctrl+Enter

### Option 2: psql Command Line

If you have psql installed and your database connection string:

```bash
psql "your-connection-string-here" -f migration-add-question-types.sql
```

## Verify the Migration

After running the migration, you can verify it worked by running this query in the SQL Editor:

```sql
SELECT unnest(enum_range(NULL::question_type))::text AS question_type;
```

You should see all 11 question types including the new ones:
- short_text
- long_text
- multiple_choice
- checkboxes
- dropdown
- linear_scale
- matrix
- date_time
- **file_upload** (NEW)
- **ranking** (NEW)
- **slider** (NEW)

## What This Fixes

- ✅ You can now create File Upload questions
- ✅ You can now create Ranking questions
- ✅ You can now create Slider questions
- ✅ Question deletion now works properly

## After Running the Migration

Once you've run the migration, I'll deploy the code fixes and everything should work perfectly!
