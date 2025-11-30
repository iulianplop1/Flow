# FlowState v2 - Complete Project Description

## 📋 Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [AI-Powered Features](#ai-powered-features)
4. [Task Management](#task-management)
5. [Timeline & Scheduling](#timeline--scheduling)
6. [Focus Mode](#focus-mode)
7. [Analytics & Insights](#analytics--insights)
8. [Notifications & Reminders](#notifications--reminders)
9. [Time Management](#time-management)
10. [User Interface](#user-interface)
11. [Technical Architecture](#technical-architecture)
12. [Database Schema](#database-schema)
13. [Edge Functions](#edge-functions)

---

## 🎯 Overview

**FlowState v2** is a sophisticated, AI-powered productivity application designed to help users achieve optimal flow states through intelligent task scheduling, energy management, and focus enhancement. The application combines natural language processing, behavioral psychology, and data analytics to create a personalized productivity system.

### Key Philosophy
- **Energy-Based Task Management**: Tasks are categorized by energy requirements (High/Medium/Low) to match user's natural energy cycles
- **Flow State Optimization**: Designed to help users enter and maintain flow states through proper task sequencing
- **AI-Assisted Decision Making**: Uses Google Gemini AI to understand context and provide intelligent suggestions
- **Empathetic Accountability**: Encourages rather than punishes, using Socratic questioning to understand obstacles

---

## 🚀 Core Features

### 1. Smart Start (Contextual Welcome Prompt)

**Location**: Appears at the top of the dashboard when the app loads

**Functionality**:
- **AI-Powered Analysis**: Uses Google Gemini AI to analyze:
  - Current time of day
  - User's task history and patterns
  - Pending tasks for the day
  - User's typical energy levels at different times
  - Most important/urgent task
- **Personalized Prompt**: Generates a warm, encouraging message like:
  - "Good morning. It's 9:00 AM and you usually have high energy. Your most important task is 'Write Project Proposal'. Want to start a 45-minute focus session for that now?"
- **One-Click Start**: Single button to immediately start focus mode for the recommended task
- **Dismissible**: Can be dismissed if user wants to browse tasks first
- **Context-Aware**: 
  - Uses appropriate greeting (Good morning/afternoon/evening)
  - References user's energy patterns
  - Identifies most important task based on:
    - Scheduled time
    - Energy level matching
    - Task importance/urgency
    - User's completion history

**User Experience**:
- Appears automatically when dashboard loads
- Only shows if there are pending tasks
- Beautiful gradient card design with sparkle icon
- Non-intrusive, can be dismissed
- Clicking "Start Focus Session" immediately begins focus mode

**Technical Details**:
- Uses Supabase Edge Function `smart-start`
- Analyzes last 7 days of user history
- Considers completion rates, typical energy levels, task patterns
- Returns personalized prompt with recommended task ID and duration

---

### 2. Smart Input Bar (Natural Language Task Creation)

**Location**: Floating button in bottom-right corner

**Functionality**:
- **Natural Language Processing**: Users can type or speak tasks in plain English
- **AI Parsing**: Google Gemini AI extracts:
  - Task name
  - Duration (in minutes)
  - Tag/category
  - Energy level (High/Medium/Low)
  - Recurrence pattern (if mentioned)
  - Scheduled time (e.g., "at 2pm", "in the morning")
- **Voice Input**: Microphone button for speech-to-text transcription
- **Time Picker**: Manual time selection for precise scheduling
- **Date Selection**: Choose which day to schedule the task
- **Activity Reuse**: Automatically detects if an activity already exists and reuses it

**Example Inputs**:
- "Workout for 45 minutes at 6am, high energy"
- "Read for 30 minutes every evening"
- "Meeting with team at 2pm, 1 hour"

**Technical Details**:
- Uses Supabase Edge Function `parse-task`
- Creates activity if it doesn't exist
- Creates task instance for selected date
- Handles time extraction from natural language

---

### 2. Focus Mode (Distraction-Free Timer)

**Location**: Activated when clicking "Start" on any pending task

**Features**:
- **Full-Screen Interface**: Black background, minimal UI
- **Countdown Timer**: Large, easy-to-read countdown showing remaining time
- **Progress Bar**: Visual progress indicator
- **Pause/Resume**: Control timer without losing progress
- **Complete Button**: Mark task as done early
- **Stop Button**: Exit focus mode without completing
- **Binaural Beats**: Optional background audio for focus (YouTube integration)
- **Confetti Celebration**: Visual celebration when task completes

**Functionality**:
- Tracks actual duration vs planned duration
- Calculates time saved (if completed early)
- Updates task status to "Completed"
- Adds saved time to Time Bank
- Handles habit stacking (creates linked tasks automatically)
- Shows task name and planned duration

**Time Tracking**:
- Records `actual_duration` in minutes
- Sets `completed_at` timestamp
- Updates task status to "Completed"

---

### 3. Enhanced Timeline View

**Location**: Main dashboard, "Timeline" tab

**View Modes**:
- **Day View**: Hourly breakdown from 6 AM to 11 PM
- **Week View**: 7-day calendar grid
- **Month View**: Full month calendar with task indicators

**Day View Features**:

#### Drag & Drop Scheduling
- **Drag Tasks**: Click and drag any task block to reschedule
- **Visual Feedback**: Task becomes semi-transparent while dragging
- **Drop Zones**: Drop on any time slot to reschedule
- **Auto-Rounding**: Rounds to nearest 15 minutes for better UX
- **Real-Time Updates**: Changes save immediately to database
- **Conflict Detection**: Automatically detects overlapping tasks

#### Time Block Visualization
- **Color-Coded Blocks**:
  - 🟢 **Green**: Completed tasks (with shadow effect)
  - 🔴 **Red**: Skipped tasks
  - 🔵 **Blue**: High energy tasks
  - 🟣 **Purple**: Low energy tasks
  - 🟡 **Amber**: Medium energy tasks
- **Duration Representation**: Block height represents task duration
- **Visual Enhancements**: Shadows, borders, hover effects
- **Conflict Highlighting**: Conflicting tasks show red border and pulse animation

#### Zoom Controls
- **Zoom In/Out**: Adjust timeline scale (50% to 200%)
- **Percentage Display**: Shows current zoom level
- **Proportional Scaling**: Tasks scale proportionally

#### Current Time Indicator
- **Red Line**: Shows current time position
- **Time Display**: Shows exact current time
- **Auto-Positioning**: Updates in real-time

#### Conflict Detection
- **Automatic Detection**: Scans all tasks for overlaps
- **Visual Warnings**: Conflicting tasks highlighted
- **Warning Banner**: Shows count of conflicts at top
- **Alert Icons**: ⚠️ icon on conflicting tasks

**Week View**:
- 7-day grid layout
- Shows tasks per day
- Click day to view details
- Compact task previews

**Month View**:
- Full calendar month
- Task indicators per day
- Shows first 2 tasks per day
- "+X more" indicator for additional tasks

---

### 4. Task List View

**Location**: Main dashboard, "List" tab

**Features**:
- **Sortable Tasks**: Sorted by `sort_order`, `planned_time`, or creation date
- **Task Status**: Visual indicators for Pending/Completed/Skipped
- **Task Actions**:
  - ✏️ **Edit**: Modify time and duration
  - ▶️ **Start**: Enter focus mode
  - ✅ **Complete**: Mark as done
  - ⏭️ **Skip**: Skip task (triggers Socratic Debriefer)
  - ↑↓ **Reorder**: Move tasks up/down
- **Energy Level Display**: Color-coded by energy requirement
- **Time Display**: Shows scheduled time with clock icon
- **Duration Display**: Shows planned duration
- **Tag Display**: Shows task category/tag

---

### 5. Analytics Dashboard

**Location**: Main dashboard, "Analytics" tab

**Metrics Displayed**:

#### Key Performance Indicators
- **Completion Rate**: Percentage of completed tasks
- **Total Tasks**: Count of all tasks in date range
- **Completed Tasks**: Count of completed tasks
- **Average Duration**: Mean actual duration of completed tasks
- **Time Saved**: Total minutes saved from Time Bank

#### Visualizations

**1. Tasks by Tag (Pie Chart)**
- Distribution of tasks across categories
- Color-coded segments
- Interactive tooltips

**2. Tasks by Energy Level (Bar Chart)**
- High/Medium/Low energy task distribution
- Visual comparison

**3. Weekly Completion Trends (Bar Chart)**
- Completion rate per day of week
- Shows completed vs total tasks
- Helps identify patterns

**Date Range Filter**:
- 7 days
- 30 days
- 90 days

**Data Sources**:
- Tasks table (with activity relations)
- Time Bank table
- Calculated metrics

---

## 🤖 AI-Powered Features

### 1. AI Task Scheduler

**Location**: "AI Schedule" button in header

**Functionality**:
- Takes all unscheduled tasks for the day
- Uses AI to optimally arrange them
- Considers:
  - Energy levels (high energy tasks in morning)
  - Task types (deep work needs focus time)
  - Breaks between tasks
  - No overlaps
  - Available hours

**User Inputs**:
- Start time (default: 9:00 AM)
- Available hours (default: 8 hours)

**AI Process**:
- Analyzes all tasks
- Creates optimal schedule
- Shows preview before applying
- User can approve or cancel

**Technical**:
- Uses Supabase Edge Function `schedule-tasks`
- Google Gemini AI for intelligent scheduling
- Returns scheduled tasks with times and sort orders

---

### 2. Crisis Button (AI Rescheduling)

**Location**: Floating button in bottom-right (red, with alert icon)

**Functionality**:
- Activated when user feels overwhelmed
- AI analyzes all pending tasks
- Calculates available time remaining
- Suggests actions:
  - **Delete**: Remove non-essential tasks
  - **Shorten**: Reduce task durations to fit schedule

**AI Decision Making**:
- Considers task importance
- Considers task dependencies
- Considers energy requirements
- Considers time constraints

**User Flow**:
1. Click "Crisis" button
2. AI analyzes and generates plan
3. Modal shows proposed actions
4. User reviews and approves
5. Changes applied automatically

**Technical**:
- Uses Supabase Edge Function `reschedule-crisis`
- Google Gemini AI for intelligent decisions
- Returns list of actions to take

---

### 3. Socratic Debriefer

**Location**: Triggered when skipping a task

**Functionality**:
- **Empathetic Approach**: Non-judgmental conversation
- **Socratic Questioning**: Asks thoughtful questions to understand obstacles
- **AI-Powered**: Uses Google Gemini for contextual responses
- **Rescheduling Suggestions**: May suggest better time for task
- **Conversation History**: Maintains context throughout conversation

**User Flow**:
1. User clicks "Skip" on a task
2. Modal opens with initial question
3. User responds
4. AI asks follow-up questions
5. May suggest rescheduling
6. User can skip anyway or reschedule

**Technical**:
- Uses Supabase Edge Function `debrief-task`
- Maintains conversation context
- Can suggest new date for rescheduling

---

### 4. Smart Notifications

**Location**: Browser notifications (works in background)

**Features**:

#### Task Reminders
- **5-Minute Warning**: Notification 5 minutes before task starts
- **AI Preparation Tips**: Gemini AI suggests how to prepare
- **Context-Aware**: Considers task type, energy level, duration
- **Actionable Tips**: Specific preparation steps

#### Task Start Notifications
- **On-Time Alerts**: Notification when task time arrives
- **Task Details**: Shows task name, time, duration

#### Break Reminders
- **Automatic Detection**: Detects gaps between tasks (10-30 min)
- **Smart Suggestions**: Suggests breaks when appropriate
- **Prevents Burnout**: Encourages rest between tasks

#### Energy Level Alerts
- **Evening Warnings**: Alerts for high-energy tasks after 6 PM
- **Energy Mismatch**: Warns about scheduling conflicts

**Technical**:
- Uses Browser Notification API
- Checks every minute
- Prevents duplicate notifications
- Works in background (PWA)

---

## 📝 Task Management

### Task Creation

**Methods**:
1. **Smart Input**: Natural language input
2. **Templates**: Use saved task templates
3. **Recurring Tasks**: Set up recurring patterns
4. **AI Scheduler**: Let AI create schedule

### Task Properties

- **Activity**: Links to reusable activity template
- **Status**: Pending / Completed / Skipped
- **Planned Date**: Which day the task is scheduled
- **Planned Time**: Specific time (HH:MM format)
- **Sort Order**: Manual ordering priority
- **Actual Duration**: Time actually spent (recorded in focus mode)
- **Completed At**: Timestamp when completed
- **Notes**: Optional notes field

### Task Actions

- **Start**: Enter focus mode
- **Complete**: Mark as done
- **Skip**: Skip task (triggers debriefer)
- **Edit**: Modify time/duration
- **Reorder**: Change sort order
- **Delete**: Remove task

### Task Filtering

- **By Date**: Select specific date
- **By Energy Level**: High / Neutral / Low
- **By Status**: Pending / Completed / Skipped
- **By Tag**: Filter by category

---

## ⏰ Timeline & Scheduling

### Time Blocking

- **Visual Representation**: Tasks shown as colored blocks
- **Duration Visualization**: Block height = task duration
- **Time Slots**: Hourly slots from 6 AM to 11 PM
- **Precise Positioning**: Tasks positioned by exact time

### Drag & Drop

- **Intuitive Interface**: Click and drag to reschedule
- **Visual Feedback**: Real-time position updates
- **Auto-Snap**: Rounds to 15-minute intervals
- **Conflict Prevention**: Warns about overlaps

### Scheduling Features

- **Manual Scheduling**: Drag tasks to desired time
- **AI Scheduling**: Let AI create optimal schedule
- **Time Picker**: Precise time selection
- **Bulk Scheduling**: Schedule multiple tasks at once

---

## 🎯 Focus Mode

### Interface

- **Full-Screen**: Distraction-free environment
- **Large Timer**: Easy-to-read countdown
- **Progress Bar**: Visual progress indicator
- **Minimal UI**: Only essential controls

### Controls

- **Pause/Resume**: Stop and resume timer
- **Complete**: Mark task as done early
- **Stop**: Exit without completing

### Features

- **Time Tracking**: Records actual duration
- **Time Bank Integration**: Adds saved time automatically
- **Habit Stacking**: Creates linked tasks automatically
- **Celebration**: Confetti on completion
- **Binaural Beats**: Optional focus music

### Time Bank Integration

- **Automatic Calculation**: Calculates time saved (planned - actual)
- **Positive Only**: Only saves time if completed early
- **Daily Tracking**: Tracks per day
- **Cumulative**: Shows total saved time

---

## 📊 Analytics & Insights

### Metrics

1. **Completion Rate**: % of tasks completed
2. **Task Statistics**: Total vs completed
3. **Average Duration**: Mean actual duration
4. **Time Saved**: Total from Time Bank
5. **Task Distribution**: By tag and energy level
6. **Weekly Trends**: Completion patterns

### Visualizations

- **Pie Charts**: Task distribution
- **Bar Charts**: Energy levels, weekly trends
- **Responsive Design**: Works on all screen sizes
- **Interactive**: Hover for details

### Date Ranges

- **7 Days**: Recent week
- **30 Days**: Past month
- **90 Days**: Past quarter

---

## 🔔 Notifications & Reminders

### Browser Notifications

- **Permission Request**: Asks on first use
- **Background Support**: Works when tab closed (PWA)
- **Rich Notifications**: Includes task details
- **No Duplicates**: Prevents spam

### Notification Types

1. **Task Reminders**: 5 minutes before
2. **Task Start**: When time arrives
3. **Break Suggestions**: Between tasks
4. **Energy Alerts**: Mismatch warnings

### AI-Enhanced Reminders

- **Preparation Tips**: AI suggests how to prepare
- **Context-Aware**: Considers task details
- **Actionable**: Specific steps

---

## ⏱️ Time Management

### Time Bank

**Concept**: Track time saved by completing tasks early

**Functionality**:
- **Automatic Tracking**: Calculated in focus mode
- **Daily Records**: One record per day
- **Cumulative**: Tracks total saved time
- **Spendable**: Can be used for breaks/leisure

**Calculation**:
```
Time Saved = Planned Duration - Actual Duration
(Only if Actual < Planned)
```

### Time Tracking

- **Planned Time**: User-scheduled time
- **Actual Time**: Time actually spent (from focus mode)
- **Variance**: Difference between planned and actual
- **Learning**: System learns user's actual durations

---

## 🎨 User Interface

### Design Philosophy

- **Dark Mode**: Eye-friendly dark theme
- **Minimalist**: Clean, uncluttered interface
- **Color-Coded**: Visual hierarchy through colors
- **Responsive**: Works on all screen sizes

### Color Scheme

- **Background**: Dark gray (#111827)
- **Cards**: Medium gray (#1F2937)
- **Accents**: Blue, Green, Red, Purple, Amber
- **Text**: Light gray with white for emphasis

### Components

- **Header**: Date picker, energy filters, time display
- **Dashboard**: Main content area
- **Floating Buttons**: Smart Input, Crisis Button
- **Modals**: Task creation, templates, settings
- **Timeline**: Interactive time-based view

### Responsive Design

- **Mobile-First**: Designed for mobile, enhanced for desktop
- **Touch-Friendly**: Minimum 44px touch targets
- **Flexible Layouts**: Adapts to screen size
- **Readable Text**: Minimum 16px font size

---

## 🏗️ Technical Architecture

### Frontend

**Framework**: React 18.2
**Build Tool**: Vite 5
**Language**: TypeScript 5.2
**Styling**: Tailwind CSS 3.3
**Icons**: Lucide React
**State Management**: Zustand 4.4
**Routing**: React Router DOM 6.21
**Drag & Drop**: @dnd-kit 6.1
**Charts**: Recharts 2.10
**Confetti**: canvas-confetti 1.9

### Backend

**Platform**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Edge Functions**: Deno runtime
- **Storage**: Supabase Storage (if needed)

### AI Integration

**Provider**: Google Gemini 1.5 Flash
**Usage**:
- Task parsing
- Scheduling optimization
- Crisis rescheduling
- Socratic debriefing
- Smart reminders

### Deployment

**Hosting**: GitHub Pages
**CI/CD**: GitHub Actions
**PWA**: Service Worker for offline support

---

## 🗄️ Database Schema

### Tables

#### 1. profiles
- Extends Supabase auth.users
- Stores username, avatar
- Created/updated timestamps

#### 2. activities
- Reusable activity templates
- Fields:
  - name: Activity name
  - duration_minutes: Default duration
  - min_duration: Minimum duration
  - tag: Category/tag
  - energy_level: High/Medium/Low
  - recurrence: Recurrence pattern
  - recurrence_pattern: Pattern type
  - recurrence_end_date: When to stop
  - linked_activity_id: For habit stacking

#### 3. tasks
- Daily task instances
- Fields:
  - activity_id: Links to activity
  - status: Pending/Completed/Skipped
  - planned_date: Which day
  - planned_time: Specific time (HH:MM)
  - sort_order: Manual ordering
  - actual_duration: Time actually spent
  - completed_at: Completion timestamp
  - notes: Optional notes

#### 4. task_templates
- Saved task combinations
- Fields:
  - name: Template name
  - description: Optional description
  - activity_ids: Array of activity IDs

#### 5. time_bank
- Tracks saved/spent time
- Fields:
  - date: Which day
  - minutes_saved: Time saved
  - minutes_spent: Time spent

### Relationships

- activities.user_id → profiles.id
- tasks.activity_id → activities.id
- tasks.user_id → profiles.id
- task_templates.user_id → profiles.id
- time_bank.user_id → profiles.id
- activities.linked_activity_id → activities.id (self-reference)

### Security

- **Row Level Security (RLS)**: Enabled on all tables
- **User Isolation**: Users can only see their own data
- **Policy-Based**: Policies enforce data access

---

## ⚡ Edge Functions

### 1. parse-task

**Purpose**: Parse natural language task input

**Input**:
- User's natural language text
- Selected date (optional)
- Selected time (optional)

**Process**:
1. Send to Google Gemini AI
2. Extract: name, duration, tag, energy_level, recurrence, time
3. Check if activity exists
4. Create activity if needed
5. Return parsed data

**Output**:
- Parsed task data
- Activity ID
- Suggested time (if extracted)

---

### 2. schedule-tasks

**Purpose**: AI-powered optimal task scheduling

**Input**:
- Array of tasks (with activity details)
- Available hours
- Start time

**Process**:
1. Analyze all tasks
2. Consider energy levels
3. Consider task types
4. Consider breaks
5. Create optimal schedule
6. Return scheduled times

**Output**:
- Array of scheduled tasks
- Each with planned_time and sort_order

---

### 3. reschedule-crisis

**Purpose**: AI-powered crisis rescheduling

**Input**:
- Array of pending tasks
- Available hours remaining

**Process**:
1. Analyze task importance
2. Calculate time constraints
3. Suggest deletions
4. Suggest duration reductions
5. Return action plan

**Output**:
- Array of actions (delete/shorten)
- Each with task_id and details

---

### 4. debrief-task

**Purpose**: Socratic questioning for skipped tasks

**Input**:
- Task details
- Conversation history

**Process**:
1. Maintain conversation context
2. Ask thoughtful questions
3. Understand obstacles
4. Suggest solutions
5. May suggest rescheduling

**Output**:
- AI response
- Optional suggested_date

---

### 5. smart-reminder

**Purpose**: AI-powered preparation suggestions

**Input**:
- Task details (name, tag, energy, duration)
- Reminder minutes

**Process**:
1. Analyze task context
2. Consider energy level
3. Consider duration
4. Generate preparation tips

**Output**:
- Preparation suggestion text

---

### 6. smart-start

**Purpose**: Generate personalized welcome prompt with recommended task

**Input**:
- Current time
- Array of pending tasks
- User history (completion patterns, energy levels, etc.)

**Process**:
1. Analyze user's task history (last 7 days)
2. Identify patterns (typical energy at time, completion rates)
3. Find most important/urgent task
4. Generate personalized, encouraging prompt
5. Return prompt text, recommended task ID, and duration

**Output**:
- Personalized prompt text
- Recommended task ID
- Suggested duration

---

### 7. transcribe-audio

**Purpose**: Speech-to-text transcription

**Input**:
- Audio blob (base64 encoded)
- MIME type

**Process**:
1. Send to speech recognition service
2. Transcribe audio
3. Return text

**Output**:
- Transcribed text

---

## 🔐 Authentication

### Method

- **Supabase Auth**: Email/password authentication
- **Session Management**: Automatic session handling
- **Protected Routes**: All routes require authentication

### User Flow

1. **Sign Up**: Create account with email/password
2. **Sign In**: Login with credentials
3. **Session**: Maintained automatically
4. **Sign Out**: Clear session

---

## 📱 Progressive Web App (PWA)

### Features

- **Installable**: Can be installed on mobile/desktop
- **Offline Support**: Service worker caches resources
- **Background Notifications**: Works when app closed
- **App-Like Experience**: Full-screen, no browser UI

### Service Worker

- **Caching Strategy**: Cache-first for static assets
- **Network Fallback**: Network-first for API calls
- **Offline Page**: Shows offline message
- **Update Detection**: Notifies when update available

---

## 🎯 Key Workflows

### 1. Creating a Task

1. Click Smart Input button
2. Type or speak task description
3. AI parses and extracts details
4. Preview shown
5. Adjust time/date if needed
6. Confirm creation
7. Task appears in list/timeline

### 2. Starting Focus Mode

1. Click "Start" on any pending task
2. Full-screen focus mode opens
3. Timer starts counting down
4. User works on task
5. Can pause/resume
6. Click "Complete" when done
7. Time tracked, task marked complete
8. Time saved added to Time Bank
9. Habit stacking creates linked task (if configured)

### 3. Rescheduling Tasks

**Method 1: Drag & Drop**
1. Go to Timeline view
2. Click and drag task block
3. Drop on desired time slot
4. Task rescheduled automatically

**Method 2: Edit Button**
1. Click edit button on task
2. Modify time/duration
3. Save changes

**Method 3: AI Scheduler**
1. Click "AI Schedule" button
2. Set start time and available hours
3. AI creates optimal schedule
4. Review and approve
5. All tasks scheduled

### 4. Handling Overwhelm (Crisis Mode)

1. Click red "Crisis" button
2. AI analyzes all pending tasks
3. Calculates available time
4. Generates reschedule plan
5. Shows proposed actions (delete/shorten)
6. User reviews and approves
7. Changes applied automatically

### 5. Skipping a Task

1. Click "Skip" on any task
2. Socratic Debriefer modal opens
3. AI asks why skipping
4. User responds
5. AI asks follow-up questions
6. May suggest rescheduling
7. User can skip anyway or reschedule

---

## 🔄 Data Flow

### Task Creation Flow

```
User Input → Smart Input Component
    ↓
Edge Function (parse-task)
    ↓
Google Gemini AI
    ↓
Parsed Data → Activity Check/Create
    ↓
Task Creation → Database
    ↓
UI Update → Task List/Timeline
```

### Focus Mode Flow

```
Start Task → Focus Mode Opens
    ↓
Timer Running → User Works
    ↓
Complete → Calculate Duration
    ↓
Update Task Status → Database
    ↓
Calculate Time Saved → Time Bank
    ↓
Habit Stacking → Create Linked Task
    ↓
Close Focus Mode → Return to Dashboard
```

### Notification Flow

```
useSmartNotifications Hook
    ↓
Check Every Minute
    ↓
Compare Current Time vs Task Times
    ↓
Trigger Notification (if needed)
    ↓
AI Preparation Suggestion (optional)
    ↓
Browser Notification API
```

---

## 🎨 Design Patterns

### Component Structure

- **Functional Components**: All React components are functional
- **Hooks**: Extensive use of React hooks
- **Custom Hooks**: Reusable logic (useSmartNotifications)
- **State Management**: Zustand for global state
- **Props Drilling**: Minimized through stores

### Code Organization

- **Components**: Reusable UI components
- **Pages**: Route-level components
- **Stores**: Global state management
- **Lib**: Utilities and types
- **Hooks**: Custom React hooks

### Best Practices

- **TypeScript**: Full type safety
- **Error Handling**: Try-catch blocks
- **Loading States**: User feedback
- **Optimistic Updates**: Immediate UI feedback
- **Error Messages**: User-friendly errors

---

## 📈 Performance Optimizations

### Frontend

- **Code Splitting**: Lazy loading routes
- **Memoization**: useMemo for expensive calculations
- **Virtual Scrolling**: For long lists (if needed)
- **Image Optimization**: Optimized assets
- **Bundle Size**: Tree shaking, minification

### Backend

- **Database Indexes**: On frequently queried fields
- **Query Optimization**: Efficient queries
- **Edge Functions**: Serverless, scalable
- **Caching**: Where appropriate

---

## 🔒 Security

### Authentication

- **Supabase Auth**: Secure authentication
- **JWT Tokens**: Secure session management
- **Password Hashing**: Automatic by Supabase

### Data Security

- **Row Level Security**: Database-level security
- **User Isolation**: Users can't access others' data
- **API Keys**: Stored as Supabase secrets
- **HTTPS**: All connections encrypted

---

## 🚀 Deployment

### GitHub Pages

- **Automatic Deployment**: On push to main
- **GitHub Actions**: CI/CD pipeline
- **Environment Variables**: Stored as secrets
- **Build Process**: Vite build → GitHub Pages

### Supabase

- **Edge Functions**: Deployed via Supabase CLI
- **Database**: Managed by Supabase
- **Secrets**: Stored securely in Supabase

---

## 📚 Future Enhancements

See `FEATURE_SUGGESTIONS.md` for comprehensive list of potential features including:
- Pomodoro technique
- Task notes/journaling
- Calendar integration
- Mobile app
- Team collaboration
- And 25+ more ideas

---

## 🎓 Learning Resources

### Technologies Used

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Google Gemini**: https://ai.google.dev

---

## 📝 Summary

FlowState v2 is a comprehensive productivity application that combines:
- **AI-Powered Intelligence**: Natural language processing, smart scheduling
- **Energy Management**: Tasks matched to energy levels
- **Focus Enhancement**: Distraction-free focus mode
- **Time Tracking**: Automatic time bank management
- **Analytics**: Data-driven insights
- **Empathetic Design**: Encouraging rather than punishing

The application is designed to help users achieve flow states through intelligent task management, proper scheduling, and focus enhancement, all while maintaining an empathetic and encouraging user experience.

