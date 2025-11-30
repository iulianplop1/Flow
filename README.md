# FlowState v2 - Advanced Productivity App

A sophisticated productivity application focused on flow states, energy management, and AI-assisted scheduling.

## Features

- **Smart Input Bar**: Natural language task creation powered by Google Gemini AI
- **Focus Mode**: Full-screen distraction-free timer with countdown
- **Context-Aware Dashboard**: Energy-based filtering (High/Neutral/Low)
- **Crisis Button**: AI-powered task rescheduling when overwhelmed
- **Habit Stacking**: Automatic linking of related activities
- **Socratic Debriefer**: Empathetic AI accountability partner for skipped tasks
- **Time Bank**: Track saved time from completing tasks early

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS (Dark mode, mobile-first)
- **Icons**: Lucide React
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: Google Gemini 1.5 Flash
- **Deployment**: GitHub Pages

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `schema.sql` in the Supabase SQL Editor
3. Get your Supabase URL and anon key from Project Settings > API

### 3. Environment Variables

**Option 1: Quick Setup (Recommended)**
Run the setup script:
```bash
node setup-env.js
```

**Option 2: Manual Setup**
Create a `.env` file in the root directory with your credentials:

```env
VITE_SUPABASE_URL=https://pwlybloxddlltolduwok.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHlibG94ZGRsbHRvbGR1d29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzcxMTgsImV4cCI6MjA3OTk1MzExOH0.J-dEpLqj13PZfSkirNKc61XbOUzGvIVFgfdkrUckIyM
VITE_GEMINI_API_KEY=AIzaSyCv9ADJ81Pt-_tV54HszYyHoiaA_0cTmoc
```

**Note:** The Gemini API key in `.env` is for reference only. The actual key used by Edge Functions must be set as a Supabase secret (see Step 4 below).

### 4. Supabase Edge Functions

**Quick Deployment Steps:**

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```
   This will open a browser for authentication.

3. **Link your project**:
   ```bash
   supabase link --project-ref pwlybloxddlltolduwok
   ```

4. **Set Gemini API Key as Secret**:
   ```bash
   supabase secrets set GEMINI_API_KEY=AIzaSyCv9ADJ81Pt-_tV54HszYyHoiaA_0cTmoc
   ```

5. **Deploy all Edge Functions**:
   ```bash
   supabase functions deploy parse-task
   supabase functions deploy reschedule-crisis
   supabase functions deploy debrief-task
   ```

   Or deploy all at once:
   ```bash
   supabase functions deploy
   ```

**Verify Deployment:**
- Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/pwlybloxddlltolduwok)
- Navigate to **Edge Functions** in the sidebar
- You should see all three functions listed

**For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### 5. Google Gemini API

✅ **Already configured!** The Gemini API key is set up in the deployment steps above.

If you need to update it:
```bash
supabase secrets set GEMINI_API_KEY=your_new_key
```

### 6. Run Development Server

```bash
npm run dev
```

## Deployment to GitHub Pages

1. Add repository secrets in GitHub:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Push to `main` branch - the workflow will automatically deploy

3. Enable GitHub Pages in repository settings (Settings > Pages)

## Project Structure

```
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── stores/          # Zustand stores
│   ├── lib/             # Utilities and types
│   └── main.tsx         # Entry point
├── supabase/
│   └── functions/       # Edge Functions
├── schema.sql           # Database schema
└── .github/
    └── workflows/       # CI/CD
```

## Database Schema

- **profiles**: User profiles extending auth.users
- **activities**: Reusable activity templates
- **tasks**: Daily task instances
- **time_bank**: Tracked saved/spent time

All tables have Row Level Security (RLS) enabled.

## License

MIT

