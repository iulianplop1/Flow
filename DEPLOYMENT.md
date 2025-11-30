# Deployment Guide for FlowState v2

## Prerequisites

1. **Supabase CLI** installed globally:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```
   This will open a browser window for authentication.

## Step 1: Link Your Supabase Project

Link your local project to your Supabase project:

```bash
supabase link --project-ref pwlybloxddlltolduwok
```

When prompted, select your project or enter the project reference: `pwlybloxddlltolduwok`

## Step 2: Set Gemini API Key as Secret

Set the Gemini API key as a Supabase secret (this is used by Edge Functions):

```bash
supabase secrets set GEMINI_API_KEY=AIzaSyCv9ADJ81Pt-_tV54HszYyHoiaA_0cTmoc
```

## Step 3: Deploy Edge Functions

Deploy each edge function one by one:

```bash
# Deploy parse-task function
supabase functions deploy parse-task

# Deploy reschedule-crisis function
supabase functions deploy reschedule-crisis

# Deploy debrief-task function
supabase functions deploy debrief-task

# Deploy smart-start function
supabase functions deploy smart-start
```

Or deploy all at once:

```bash
supabase functions deploy
```

## Step 4: Verify Deployment

You can verify your functions are deployed by:

1. Going to your Supabase Dashboard: https://supabase.com/dashboard/project/pwlybloxddlltolduwok
2. Navigate to **Edge Functions** in the left sidebar
3. You should see all three functions listed

## Step 5: Test the Functions

You can test the functions using the Supabase CLI:

```bash
# Test parse-task
supabase functions invoke parse-task --body '{"input": "Deep work on Business for 90 mins high priority"}'

# Test reschedule-crisis
supabase functions invoke reschedule-crisis --body '{"tasks": [{"id": "test", "name": "Test Task", "duration": 30, "min_duration": 15, "tag": "Chore", "energy_level": "Low"}], "available_hours": 2}'

# Test debrief-task
supabase functions invoke debrief-task --body '{"task": {"name": "Test Task", "tag": "Chore", "energy_level": "Low"}, "conversation": [{"role": "user", "content": "I am too tired"}]}'
```

## Troubleshooting

### Function not found
- Make sure you're in the project root directory
- Verify the function files exist in `supabase/functions/[function-name]/index.ts`

### Authentication errors
- Run `supabase login` again
- Check that your project is linked: `supabase projects list`

### API key errors
- Verify the secret is set: `supabase secrets list`
- Re-set the secret if needed: `supabase secrets set GEMINI_API_KEY=your_key`

## Local Development

To test functions locally before deploying:

```bash
# Start local Supabase (requires Docker)
supabase start

# Serve functions locally
supabase functions serve parse-task --env-file .env.local
```

## Important Notes

- The Gemini API key is stored as a Supabase secret and is NOT exposed to the frontend
- Edge Functions run on Supabase's infrastructure, not in the browser
- The `.env` file is for frontend environment variables only
- Never commit `.env` files with real API keys to version control

