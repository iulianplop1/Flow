# GitHub Pages Setup Instructions

## Error: "Get Pages site failed. Please verify that the repository has Pages enabled"

This error occurs when GitHub Pages is not enabled in your repository settings. Follow these steps to fix it:

## Step 1: Enable GitHub Pages

1. Go to your GitHub repository
2. Click on **Settings** (in the repository navigation bar)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select:
   - **Source**: `GitHub Actions` (not "Deploy from a branch")
5. Click **Save**

## Step 2: Verify Repository Secrets

Make sure you have these secrets configured in your repository:

1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Add the following secrets if they don't exist:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Step 3: Verify Workflow Permissions

The workflow file (`.github/workflows/deploy.yml`) should have these permissions:
- ✅ `pages: write` - Already configured
- ✅ `id-token: write` - Already configured
- ✅ `contents: read` - Already configured

## Step 4: Re-run the Workflow

After enabling GitHub Pages:

1. Go to **Actions** tab in your repository
2. Find the failed workflow run
3. Click **Re-run all jobs**

Or simply push a new commit to trigger the workflow again.

## Alternative: Manual Deployment

If you prefer to deploy manually:

1. Build the project locally:
   ```bash
   npm run build
   ```

2. The `dist` folder contains the built files

3. You can deploy the `dist` folder to any static hosting service:
   - Netlify
   - Vercel
   - Cloudflare Pages
   - Or any other static hosting

## Troubleshooting

### Still getting errors?

1. **Check repository settings**: Make sure Pages is enabled with "GitHub Actions" as the source
2. **Check permissions**: Repository settings > Actions > General > Workflow permissions should allow "Read and write permissions"
3. **Check secrets**: Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
4. **Check workflow file**: Make sure `.github/workflows/deploy.yml` exists and is correct

### Common Issues

- **"Pages site not found"**: Enable Pages in repository settings first
- **"Permission denied"**: Check workflow permissions in repository settings
- **"Build failed"**: Check that all TypeScript errors are fixed (they should be now!)
- **"Secrets not found"**: Add the required secrets in repository settings

## After Setup

Once Pages is enabled and the workflow runs successfully:
- Your site will be available at: `https://[your-username].github.io/[repository-name]/`
- The workflow will automatically deploy on every push to `main` branch

