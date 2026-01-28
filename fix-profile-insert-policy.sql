-- Fix: Add INSERT policy for profiles table to allow automatic profile creation on signup
-- This fixes the "Database error saving new user" issue

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON profiles;

-- Create INSERT policy that allows the trigger to create profiles for new users
-- This policy allows inserts where the id matches the authenticated user's id
CREATE POLICY "Allow authenticated users to insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Ensure the handle_new_user function exists and is properly configured
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile with respondent role by default
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'respondent')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;

-- Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
