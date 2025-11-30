# New Features Added

## 🎤 Audio Input for Smart Input
- Added microphone button to Smart Input component
- Uses browser's built-in Speech Recognition API
- Converts speech to text automatically
- Works in Chrome, Edge, and other Chromium-based browsers

## ⏰ Hour & Minute Scheduling
- Tasks now support `planned_time` field (HH:MM format)
- Time picker added to Smart Input
- AI can extract time from natural language (e.g., "at 2pm", "in the morning")
- Tasks display their scheduled time with a clock icon

## 🤖 AI Task Scheduler
- New "AI Schedule" button in Dashboard
- Input all your tasks and let AI arrange them optimally
- Considers:
  - Energy levels (High energy tasks in morning)
  - Task types (Deep Work needs focus time)
  - Breaks between tasks
  - No overlaps
- Set start time and available hours
- Preview schedule before applying

## ✏️ Editable Tasks
- Click edit button on any task to modify:
  - Time (HH:MM)
  - Duration (minutes)
- Tasks can be reordered with ↑/↓ buttons
- Changes save automatically

## 📊 Task Ordering
- Tasks sorted by:
  1. `sort_order` (if set)
  2. `planned_time` (if available)
  3. Creation time (fallback)
- Drag up/down buttons to reorder manually

## Database Updates Required

Run this SQL in your Supabase SQL Editor:

```sql
-- Add planned_time and sort_order columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS planned_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_planned_time ON tasks(planned_time);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);
```

Or use the provided `schema_updates.sql` file.

## New Edge Function: schedule-tasks

Deploy the new Edge Function:

```bash
supabase functions deploy schedule-tasks
```

This function:
- Takes a list of tasks
- Considers energy levels, task types, and available time
- Returns an optimized schedule with times and order

## Usage Guide

### 1. Audio Input
1. Click the microphone button in Smart Input
2. Speak your task description
3. Text appears automatically
4. AI parses it as usual

### 2. Time Scheduling
- **In Smart Input**: Select time from time picker, or let AI extract it from text
- **In Task List**: Click edit button (pencil icon) to change time

### 3. AI Scheduling
1. Create multiple tasks for the day
2. Click "AI Schedule" button
3. Set start time and available hours
4. Click "Generate Schedule"
5. Review the AI-generated schedule
6. Click "Apply Schedule" to save

### 4. Manual Reordering
- Use ↑ button to move task up
- Use ↓ button to move task down
- Tasks automatically save new order

## Browser Compatibility

**Audio Input:**
- ✅ Chrome/Edge (Chromium)
- ✅ Safari (with different API)
- ❌ Firefox (not supported)

If audio doesn't work, you can still type manually.

