# Quick Redeploy Instructions

The Edge Functions have been updated with CORS headers. Redeploy them with these commands:

```bash
supabase functions deploy parse-task
supabase functions deploy reschedule-crisis
supabase functions deploy debrief-task
```

Or deploy all at once:
```bash
supabase functions deploy
```

After redeploying, the Smart Input feature should work without CORS errors!

