-- Add recurring task support
ALTER TABLE activities ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Task Templates table
CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    activity_ids UUID[] NOT NULL, -- Array of activity IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS for task_templates
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
    ON task_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
    ON task_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
    ON task_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
    ON task_templates FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON task_templates(user_id);

