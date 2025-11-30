# 🚀 Quick Start Guide - FlowState v2

## ✅ Credentials Configured

Your credentials have been added to the project:
- ✅ Supabase URL: `https://pwlybloxddlltolduwok.supabase.co`
- ✅ Supabase Anon Key: Configured in `.env`
- ✅ Gemini API Key: Ready for Edge Functions

## 📋 Deployment Checklist

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Deploy Supabase Edge Functions

**Install Supabase CLI** (if not already installed):
```bash
npm install -g supabase
```

**Login to Supabase**:
```bash
supabase login
```
*This opens a browser for authentication*

**Link Your Project**:
```bash
supabase link --project-ref pwlybloxddlltolduwok
```

**Set Gemini API Key as Secret**:
```bash
supabase secrets set GEMINI_API_KEY=AIzaSyCv9ADJ81Pt-_tV54HszYyHoiaA_0cTmoc
```

**Deploy All Functions**:
```bash
supabase functions deploy parse-task
supabase functions deploy reschedule-crisis
supabase functions deploy debrief-task
```

Or deploy all at once:
```bash
supabase functions deploy
```

### Step 3: Run Database Schema

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/pwlybloxddlltolduwok)
2. Click on **SQL Editor** in the left sidebar
3. Copy and paste the contents of `schema.sql`
4. Click **Run** to execute

### Step 4: Start Development Server
```bash
npm run dev
```

## 🎯 Verify Everything Works

1. **Check Edge Functions**: 
   - Go to [Supabase Dashboard > Edge Functions](https://supabase.com/dashboard/project/pwlybloxddlltolduwok/functions)
   - You should see 3 functions: `parse-task`, `reschedule-crisis`, `debrief-task`

2. **Test the App**:
   - Open http://localhost:5173
   - Sign up/Sign in
   - Try creating a task with Smart Input

## 🔧 Troubleshooting

### "Function not found" error
- Make sure you're in the project root directory
- Check that files exist in `supabase/functions/[function-name]/index.ts`

### "Authentication failed"
- Run `supabase login` again
- Verify project link: `supabase projects list`

### "GEMINI_API_KEY not found"
- Verify secret is set: `supabase secrets list`
- Re-set if needed: `supabase secrets set GEMINI_API_KEY=AIzaSyCv9ADJ81Pt-_tV54HszYyHoiaA_0cTmoc`

## 📚 More Information

- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Project documentation: [README.md](./README.md)

