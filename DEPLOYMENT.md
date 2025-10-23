# Deployment Guide - Vercel

## Quick Deploy Steps

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in with your account

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Choose your import method:
     - **If using Git:** Connect your GitHub/GitLab/Bitbucket and select the repository
     - **If local:** Use Vercel CLI (see Option 2 below)

3. **Configure Project**
   - Framework Preset: **Vite** (should auto-detect)
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)

4. **Add Environment Variables**
   Click "Environment Variables" and add these two variables:

   ```
   VITE_SUPABASE_URL=https://nzcqjadhvhxfkhluezum.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Y3FqYWRodmh4ZmtobHVlenVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDU0MTcsImV4cCI6MjA3NTI4MTQxN30.LwH6VNncNUXqfE4GaH96h5iQIdbMBRV2XYyALmObUkk
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes for build to complete
   - Your site will be live at `https://your-project-name.vercel.app`

---

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```
   Follow the authentication prompts in your browser

3. **Deploy**
   ```bash
   vercel
   ```

   When prompted:
   - Set up and deploy?: **Y**
   - Which scope?: Choose your account
   - Link to existing project?: **N**
   - What's your project's name?: (press Enter or type a name)
   - In which directory is your code located?: **./** (press Enter)
   - Want to override the settings?: **N**

4. **Add Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   ```
   Paste: `https://nzcqjadhvhxfkhluezum.supabase.co`

   ```bash
   vercel env add VITE_SUPABASE_ANON_KEY
   ```
   Paste: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Y3FqYWRodmh4ZmtobHVlenVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDU0MTcsImV4cCI6MjA3NTI4MTQxN30.LwH6VNncNUXqfE4GaH96h5iQIdbMBRV2XYyALmObUkk`

   For both: Select **Production, Preview, and Development**

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## After Deployment

### Your Live URLs
- **Production**: `https://your-project-name.vercel.app`
- **Preview**: Automatic preview URLs for each Git push (if using Git)

### Share with Clients
Simply share your production URL with clients - they can access it immediately!

### Custom Domain (Optional)
1. Go to your project in Vercel Dashboard
2. Settings → Domains
3. Add your custom domain (e.g., `proposals.yourcompany.com`)
4. Follow DNS configuration instructions

### Automatic Deployments (If using Git)
- Every push to `main` branch → automatic production deployment
- Every push to other branches → automatic preview deployment

---

## Updating Your Site

### Via Git (Recommended)
```bash
git add .
git commit -m "Update site"
git push
```
Vercel automatically deploys changes

### Via CLI
```bash
vercel --prod
```

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Verify environment variables are set correctly
- Test locally: `npm run build`

### Environment Variables Not Working
- Make sure they start with `VITE_` prefix
- Redeploy after adding variables: `vercel --prod`
- Check they're set for "Production" environment

### 404 Errors on Routes
- The `vercel.json` file handles this (already configured)
- Make sure `vercel.json` is in your project root

---

## Database Migrations

Your Supabase database migrations need to be applied separately:

1. Migrations are in: `supabase/migrations/`
2. Apply them using the Supabase MCP tools (already done in development)
3. For production, ensure migrations are applied to your production Supabase instance

---

## Security Notes

- The Supabase Anon Key is safe to expose publicly
- Row Level Security (RLS) protects your data
- Never commit the Service Role Key to Git
- Keep your Supabase database secure with proper RLS policies

---

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Check deployment status: Vercel Dashboard → Your Project → Deployments
