-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    min_duration INTEGER NOT NULL DEFAULT 15,
    tag TEXT NOT NULL DEFAULT 'General',
    energy_level TEXT NOT NULL DEFAULT 'Medium' CHECK (energy_level IN ('High', 'Medium', 'Low')),
    recurrence TEXT,
    linked_activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tasks table (instances of activities for specific days)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Skipped')),
    planned_date DATE NOT NULL,
    actual_duration INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Time Bank table
CREATE TABLE IF NOT EXISTS time_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    minutes_saved INTEGER NOT NULL DEFAULT 0,
    minutes_spent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_bank ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- RLS Policies for activities
CREATE POLICY "Users can view own activities"
    ON activities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
    ON activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
    ON activities FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
    ON activities FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for time_bank
CREATE POLICY "Users can view own time bank"
    ON time_bank FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time bank"
    ON time_bank FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time bank"
    ON time_bank FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_activity_id ON tasks(activity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_planned_date ON tasks(planned_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_time_bank_user_id ON time_bank(user_id);
CREATE INDEX IF NOT EXISTS idx_time_bank_date ON time_bank(date);

