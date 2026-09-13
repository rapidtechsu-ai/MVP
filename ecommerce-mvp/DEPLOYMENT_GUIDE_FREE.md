# Deployment Guide (Free Tier) — Testing Access for Your Team

This version uses a stack that costs **$0/month**, no credit card required
anywhere. It's built for testing/internal demo use, not for real customers —
see the trade-offs section at the end for why.

**The stack:**
- **Vercel** — hosts the frontend (store + dashboard pages)
- **Render** — hosts the backend (free web service)
- **Neon** — hosts the PostgreSQL database (free, does not expire)

**Total time:** ~30–45 minutes.

---

## Before you start

- A GitHub account — github.com
- A Render account — render.com
- A Neon account — neon.tech
- A Vercel account — vercel.com
- Git installed locally (`git --version` to check)

---

## Part 1 — Push your code to GitHub

(Skip this if you've already done it.)

```bash
cd ecommerce-mvp
git init
git add .
git commit -m "Initial MVP"
git branch -M main
git remote add origin https://github.com/your-username/ecommerce-mvp.git
git push -u origin main
```

Create the empty repo on GitHub first (github.com → **+** → **New
repository** → name it, set Private, don't initialize with a README),
then run the commands above with the URL GitHub gives you.

---

## Part 2 — Create the database on Neon

### 2.1 Create the project

1. Go to neon.tech and sign up (no credit card needed).
2. Click **Create a project** (or you may be dropped straight into
   project creation on first login).
3. Give it a name, e.g. `ecommerce-mvp`.
4. Choose a region close to you or your colleagues.
5. Click **Create project**.

### 2.2 Get your connection string

1. On your new project's dashboard, look for **Connection Details** (or
   a **"Connect"** button near the top).
2. Make sure it's showing the connection string for the `main` branch
   and the `neondb` database (these are Neon's defaults).
3. Copy the full connection string — it looks like:
   ```
   postgresql://neondb_owner:AbC123xyz@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this somewhere** — you'll paste it into Render in Part 3.

---

## Part 3 — Deploy the backend on Render

### 3.1 Create the web service

1. Go to render.com and sign up (you can use GitHub to sign up, which
   makes the next step faster).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account if prompted, then select your
   `ecommerce-mvp` repository.
4. Render shows a configuration form:
   - **Name**: anything, e.g. `ecommerce-mvp-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**

### 3.2 Add environment variables

Scroll down to the **Environment Variables** section on the same page
(or find it under the service's **Environment** tab after creation) and
add:

| Key | Value |
|---|---|
| `DATABASE_URL` | The Neon connection string from step 2.2 |
| `JWT_SECRET` | A random string — generate with `openssl rand -hex 32` in your terminal |
| `CORS_ORIGIN` | Leave blank for now — you'll set this in Part 5 |
| `PORT` | `4000` |

**Optional — only if you want product photo uploads to work:**

| Key | Value |
|---|---|
| `S3_ENDPOINT` | Your storage provider's endpoint (see below) |
| `S3_REGION` | `auto` |
| `S3_BUCKET` | The bucket name you create |
| `S3_ACCESS_KEY_ID` | From your storage provider |
| `S3_SECRET_ACCESS_KEY` | From your storage provider |
| `S3_PUBLIC_URL_BASE` | The public URL prefix for that bucket |

If you skip these, the dashboard will show a clear "image storage not
configured" message when someone tries to upload a product photo —
nothing breaks, product listings just show a placeholder icon instead
of real photos.

**Recommended provider for this free-tier setup: Cloudflare R2** (also
genuinely free, no card required for a small testing bucket, and no
bandwidth/egress fees unlike AWS S3):
1. Go to dash.cloudflare.com → **R2** → **Create bucket**.
2. Name it, e.g. `ecommerce-mvp-images`.
3. Go to **Settings** on that bucket → **Public Access** → enable it →
   copy the `pub-xxxxxx.r2.dev` URL it gives you. That's your
   `S3_PUBLIC_URL_BASE`.
4. Go to **Manage R2 API Tokens** → **Create API Token** → give it
   read/write access to your bucket → copy the **Access Key ID** and
   **Secret Access Key** it shows you (shown only once — save them now).
5. Your `S3_ENDPOINT` is shown on the API token page too, looking like
   `https://<account-id>.r2.cloudflarestorage.com`.

### 3.3 Deploy

1. Click **Create Web Service** (or **Deploy** if you were editing an
   existing one).
2. Render will build and start your app. Watch the logs.

**What success looks like in the logs:**
```
==> Running build command 'npm install'...
Running postinstall: prisma generate
Generated Prisma Client
==> Build successful
==> Running 'npm start'
Running prisma migrate deploy...
[migration output — creating tables]
API listening on port 4000
```

**If it fails:** copy the exact error from the logs and send it to me.

### 3.4 Get your backend's URL

Once deployed, Render shows your service's URL near the top of the page,
looking like:
```
https://ecommerce-mvp-backend.onrender.com
```
Copy this — you'll need it in Part 4.

### 3.5 Load demo data (seed script)

Render's free tier doesn't give you a persistent shell the same way
Railway does, so the simplest way to seed is to run the seed script
**from your own computer**, pointed at the live Neon database:

1. On your computer, in the `backend` folder, temporarily edit your
   local `.env` file's `DATABASE_URL` to the Neon connection string from
   step 2.2 (back it up first if you also use this `.env` for local dev
   against a different database).
2. Run:
   ```bash
   cd backend
   npx prisma generate
   npm run prisma:seed
   ```
3. You should see:
   ```
   Created superuser (full access): admin@example.com / ChangeMe123!
   Seed complete.
   ```
4. Restore your local `.env` afterward if you changed it, so local
   development still points at your own local database.

---

## Part 4 — Deploy the frontend on Vercel

### 4.1 Create the project

1. Go to vercel.com, sign up (GitHub sign-in recommended).
2. Click **Add New...** → **Project**.
3. Import your `ecommerce-mvp` repository.

### 4.2 Configure

1. **Root Directory**: click **Edit**, set to `frontend`.
2. **Framework Preset**: should auto-detect Next.js.
3. Under **Environment Variables**, add:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | Your Render backend URL from step 3.4 (no trailing slash) |
4. Click **Deploy**.

Once done, Vercel gives you a URL like:
```
https://ecommerce-mvp-yourname.vercel.app
```

---

## Part 5 — Lock down CORS

1. Go back to **Render** → your backend service → **Environment**.
2. Edit `CORS_ORIGIN`, set it to your Vercel URL from Part 4, e.g.:
   ```
   https://ecommerce-mvp-yourname.vercel.app
   ```
3. Save — Render redeploys automatically with the new value.

---

## Part 6 — Verify and share

1. Visit your Vercel URL — the store should load.
2. Visit `<your-vercel-url>/admin/login`, log in with
   `admin@example.com` / `ChangeMe123!`.
3. **Change that password immediately** via Settings → Users & Roles.
4. Share the store URL with anyone; share `/admin/login` only with staff.

---

## Trade-offs of this free stack (read before you rely on it)

- **Cold starts**: Render's free web service goes to sleep after 15
  minutes with no traffic. The next visitor after that will wait
  **30–60 seconds** for the first page to load while it wakes up. Every
  request after that is normal speed until it goes idle again. This is
  the single biggest reason this setup is for **testing only** — it
  would be a bad experience for real customers.
- **No always-on guarantee**: Render can restart a free service at any
  time; nothing catastrophic happens (it just reboots), but don't expect
  five-nines uptime.
- **Neon compute limits**: 100 compute-hours/month free. For a handful
  of colleagues clicking around during testing, you won't come close to
  this. It also "scales to zero" when unused, which is a good thing
  (saves your quota) but adds to the cold-start feeling if both the
  backend *and* database were idle.
- **Storage cap**: Neon's free tier caps at 0.5GB — plenty for MVP
  testing with a small product catalog and test orders, but keep an eye
  on it if you seed a lot of data repeatedly.

**When you're ready to move from testing to something colleagues (or
real customers) can rely on**, the fix is simple: upgrade the Render
service to a paid instance type (removes the cold start) — everything
else (Neon, Vercel, your code) stays exactly the same. No migration
needed, just a plan change.
