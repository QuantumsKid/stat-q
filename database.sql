-- StatForm AI Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'respondent');
CREATE TYPE question_type AS ENUM (
  'short_text',
  'long_text',
  'multiple_choice',
  'checkboxes',
  'dropdown',
  'linear_scale',
  'matrix',
  'date_time'
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'respondent',
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forms table
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  schema_json JSONB NOT NULL DEFAULT '{}',
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB, -- For multiple choice, checkboxes, dropdown
  logic_rules JSONB, -- Conditional logic rules
  required BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Responses table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  respondent_email TEXT,
  respondent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers table
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_questions_form_id ON questions(form_id);
CREATE INDEX idx_responses_form_id ON responses(form_id);
CREATE INDEX idx_answers_response_id ON answers(response_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_responses_submitted_at ON responses(submitted_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Forms policies
CREATE POLICY "Admins can view their own forms"
  ON forms FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create forms"
  ON forms FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update their own forms"
  ON forms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete their own forms"
  ON forms FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published forms"
  ON forms FOR SELECT
  USING (is_published = TRUE);

-- Questions policies
CREATE POLICY "Admins can manage questions on their forms"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = questions.form_id
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view questions for published forms"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = questions.form_id
      AND forms.is_published = TRUE
    )
  );

-- Responses policies
CREATE POLICY "Users can view their own responses"
  ON responses FOR SELECT
  USING (
    respondent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = responses.form_id
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create responses"
  ON responses FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can update their own incomplete responses"
  ON responses FOR UPDATE
  USING (
    respondent_id = auth.uid()
    AND is_complete = FALSE
  );

-- Answers policies
CREATE POLICY "Users can view answers to their responses"
  ON answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM responses
      WHERE responses.id = answers.response_id
      AND (
        responses.respondent_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM forms
          WHERE forms.id = responses.form_id
          AND forms.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create answers"
  ON answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses
      WHERE responses.id = answers.response_id
      AND responses.is_complete = FALSE
    )
  );

CREATE POLICY "Users can update their own answers"
  ON answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM responses
      WHERE responses.id = answers.response_id
      AND responses.respondent_id = auth.uid()
      AND responses.is_complete = FALSE
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'respondent'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responses_updated_at
  BEFORE UPDATE ON responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
