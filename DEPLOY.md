# WriteVault Deployment Guide

## Prerequisites

- GitHub account (push your code there first)
- Vercel account (free) — [vercel.com](https://vercel.com)
- Railway account (free tier) — [railway.app](https://railway.app)

---

## Step 1: Push to GitHub

```bash
git init
git add -A
git commit -m "Initial commit"
gh repo create writevault --private --source=. --push
```

---

## Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `writevault` repo
4. Railway will detect the monorepo — set the **Root Directory** to `server`
5. Go to **Settings** → **Environment** and add these variables:

| Variable | Value |
|----------|-------|
| `PORT` | `3001` (Railway will override with its own) |
| `JWT_SECRET` | Generate a random 64-char string |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://writevault.vercel.app` (update after Vercel deploy) |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret |

6. Railway will auto-deploy. Note your Railway URL (e.g., `https://writevault-api.up.railway.app`)
7. Verify the health check: `curl https://YOUR-RAILWAY-URL/health`

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project** → Import your `writevault` repo
3. Vercel should auto-detect the root `vercel.json` config:
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
4. Add this environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway URL (e.g., `https://writevault-api.up.railway.app`) |

5. Click **Deploy**

---

## Step 4: Update Cross-References

After both are deployed:

1. **Railway** — Update `CLIENT_URL` env var to your actual Vercel URL
2. **Vercel** — Update `VITE_API_URL` env var to your actual Railway URL
3. Redeploy both (or trigger redeployments)

---

## Custom Domain (Optional)

### Vercel (Frontend)
1. Go to your Vercel project → **Settings** → **Domains**
2. Add `writevault.app` (or your domain)
3. Update DNS records as Vercel instructs
4. Update Railway's `CLIENT_URL` to include the custom domain

### Railway (Backend)
1. Go to your Railway service → **Settings** → **Networking** → **Custom Domain**
2. Add `api.writevault.app` (or your subdomain)
3. Update Vercel's `VITE_API_URL` to the custom domain

---

## Environment Variables Summary

### Backend (Railway)
```
PORT=3001
JWT_SECRET=<random-64-char-string>
NODE_ENV=production
CLIENT_URL=https://writevault.vercel.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (Vercel)
```
VITE_API_URL=https://writevault-api.up.railway.app
```

---

## Troubleshooting

- **CORS errors**: Ensure `CLIENT_URL` on Railway matches your exact Vercel domain (no trailing slash)
- **API 404s**: Check that `VITE_API_URL` is set correctly on Vercel and redeploy
- **Health check failing**: Visit `https://YOUR-RAILWAY-URL/health` — should return `{"status":"ok"}`
- **Stripe webhooks**: Update your Stripe webhook endpoint URL to `https://YOUR-RAILWAY-URL/api/payments/webhook`
