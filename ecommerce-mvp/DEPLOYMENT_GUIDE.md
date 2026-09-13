# Deployment Guide — Getting the MVP Online for Your Team

This walks through every click, in order, to get the store and dashboard
live on the internet so your colleagues can access them. No prior server
experience needed — both platforms used here (Railway, Vercel) handle the
infrastructure for you.

**Total time:** ~30–45 minutes for a first deployment.
**Cost:** Free to start; Railway may ask for a small usage-based fee
(a few dollars/month) once your free trial credit runs out.

---

## Before you start — what you'll need

- A GitHub account (free) — github.com
- A Railway account (free to start) — railway.app
- A Vercel account (free to start) — vercel.com
- Git installed on your computer. Check by opening a terminal and running:
  ```bash
  git --version
  ```
  If you get an error, install Git first from git-scm.com/downloads

---

## Part 1 — Put the code on GitHub

Railway and Vercel both deploy by connecting to a GitHub repository, so
the code needs to live there first.

### 1.1 Create the repository on GitHub

1. Go to github.com and log in.
2. Click the **+** icon in the top-right corner → **New repository**.
3. Name it something like `ecommerce-mvp`.
4. Leave it set to **Private** (recommended — this is your business code).
5. Do **not** check "Add a README" or any other initialization option —
   leave everything else unchecked.
6. Click **Create repository**.
7. GitHub will show you a page with setup commands. Keep this page open —
   you'll need the repository URL from it in a moment (it looks like
   `https://github.com/your-username/ecommerce-mvp.git`).

### 1.2 Push your local code to it

Open a terminal, navigate to the folder where you extracted the
`ecommerce-mvp.zip` project, and run these commands one at a time:

```bash
cd ecommerce-mvp
git init
git add .
git commit -m "Initial MVP"
git branch -M main
git remote add origin https://github.com/your-username/ecommerce-mvp.git
git push -u origin main
```

Replace the URL in the `git remote add origin` line with the actual URL
GitHub showed you in step 1.1.7.

If this is your first time using Git from this computer, it may ask you
to log in to GitHub (a browser window will pop up) — just follow the
prompts.

**How to check this worked:** refresh the GitHub repository page in your
browser. You should see all your project folders (`backend`, `frontend`)
listed there.

---

## Part 2 — Deploy the backend + database on Railway

### 2.1 Create the project

1. Go to railway.app and sign up/log in (you can sign up directly with
   your GitHub account — this also makes the next step easier since
   Railway will already have access to your repos).
2. Click **New Project**.
3. Click **Deploy from GitHub repo**.
4. If asked to install/authorize the Railway GitHub App, approve it and
   select your `ecommerce-mvp` repository (or "All repositories" if you
   prefer).
5. Click on your `ecommerce-mvp` repo to select it.

Railway will create a service and start trying to build it. **This first
build will likely fail or misbehave — that's expected**, because it
doesn't yet know the code lives inside the `backend` subfolder. We'll fix
that next.

### 2.2 Point Railway at the backend folder

1. Click on the service Railway just created (it may be named after your
   repo).
2. Go to the **Settings** tab.
3. Find **Root Directory** (sometimes under a "Source" or "Build"
   section) and set it to:
   ```
   backend
   ```
4. Still in Settings, confirm/set:
   - **Build Command**: leave blank (Railway auto-detects `npm install`)
   - **Start Command**: `npm start`
5. Click outside the field to save (Railway usually auto-saves).

### 2.3 Add the PostgreSQL database

1. In your Railway project (not inside the backend service — go back to
   the project overview), click **+ New** (or **Create**).
2. Select **Database** → **Add PostgreSQL**.
3. Railway provisions a Postgres database automatically and creates a
   `DATABASE_URL` variable for it.
4. Click on the new Postgres service, go to its **Variables** tab, and
   copy the value of `DATABASE_URL` (you likely won't need to copy it
   manually — Railway can auto-link it, covered in step 2.4).

### 2.4 Connect the database to your backend service

1. Click back into your **backend** service (not the database).
2. Go to the **Variables** tab.
3. Click **+ New Variable** → there should be an option like
   **"Add Reference"** or **"Add from another service"** — use this to
   link `DATABASE_URL` directly from the Postgres service. This way, if
   the database ever changes, your backend always has the current value.
   - If that option isn't available in your Railway version, just paste
     the `DATABASE_URL` value you copied in step 2.3.4 directly as a new
     variable named `DATABASE_URL`.

### 2.5 Add the remaining environment variables

Still in the backend service's **Variables** tab, add these one at a
time (click **+ New Variable** for each):

| Variable | Value |
|---|---|
| `JWT_SECRET` | A random secret string — see below for how to generate one |
| `CORS_ORIGIN` | Leave this blank for now — you'll fill it in during Part 4 |
| `PORT` | `4000` |

**To generate a `JWT_SECRET`:** open a terminal on your own computer and run:
```bash
openssl rand -hex 32
```
This prints a long random string. Copy the entire output and use it as
the value for `JWT_SECRET`. (If `openssl` isn't available on your
system, any long random string of letters/numbers works — the important
thing is that it's unpredictable and you don't reuse it anywhere else.)

**Optional — only needed for product photo uploads to work:**

| Variable | Value |
|---|---|
| `S3_ENDPOINT` | Your storage provider's endpoint |
| `S3_REGION` | `auto` |
| `S3_BUCKET` | Your bucket name |
| `S3_ACCESS_KEY_ID` | From your storage provider |
| `S3_SECRET_ACCESS_KEY` | From your storage provider |
| `S3_PUBLIC_URL_BASE` | The public URL prefix for that bucket |

Skipping these is fine — the dashboard will just show a clear "image
storage not configured" message instead of failing unpredictably, and
products display a placeholder icon instead of a photo. Cloudflare R2
is a solid free option; see the equivalent section in
`DEPLOYMENT_GUIDE_FREE.md` for the exact R2 setup steps.

### 2.6 Deploy

1. Go to the **Deployments** tab of your backend service.
2. Click **Deploy** (or it may redeploy automatically after you saved
   the settings/variables above).
3. Click into the deployment to watch the **build logs** live.

**What you should see in the logs, roughly in this order:**
```
Running npm install...
Running postinstall: prisma generate...
Generated Prisma Client
Starting: npm start
Running prisma migrate deploy...
[migration output — creating tables]
API listening on port 4000
```

If you see `API listening on port 4000` at the end, your backend is
live.

**If the build fails instead:** click into the failed deployment, copy
the full error text from the logs, and send it to me — I'll diagnose it
directly from the error message.

### 2.7 Get your backend's public URL

1. In the backend service, go to **Settings**.
2. Under **Networking** (or similar), click **Generate Domain** if one
   isn't already there.
3. Railway gives you a URL like:
   ```
   https://ecommerce-mvp-backend-production.up.railway.app
   ```
4. **Copy this URL** — you'll need it in Part 3.

### 2.8 Load demo data (run the seed script)

You need to run the seed script once against your live database so
there's demo content and — importantly — a working admin login.

**Easiest way — using the Railway CLI:**

1. Install the Railway CLI on your computer:
   ```bash
   npm install -g @railway/cli
   ```
2. Log in:
   ```bash
   railway login
   ```
   (opens a browser window to authenticate)
3. Link your local project folder to the Railway project:
   ```bash
   cd ecommerce-mvp/backend
   railway link
   ```
   Follow the prompts to select your project and the backend service.
4. Run the seed script against the live database:
   ```bash
   railway run npm run prisma:seed
   ```
5. You should see output ending with something like:
   ```
   Created superuser (full access): admin@example.com / ChangeMe123!
   Seed complete.
   ```

That's your dashboard login — **change this password immediately** once
you log in (Settings → Users & Roles in the dashboard).

---

## Part 3 — Deploy the frontend on Vercel

### 3.1 Create the project

1. Go to vercel.com and sign up/log in — again, signing up with GitHub
   simplifies the next step.
2. Click **Add New...** → **Project**.
3. Find your `ecommerce-mvp` repository in the list and click **Import**.

### 3.2 Configure the project

Vercel will show a configuration screen before deploying:

1. **Framework Preset**: Vercel should auto-detect "Next.js" — leave it.
2. **Root Directory**: click **Edit** next to it, and set it to:
   ```
   frontend
   ```
3. Expand **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | The Railway backend URL you copied in step 2.7 (no trailing slash) |
4. Click **Deploy**.

### 3.3 Wait for the build

Vercel will show live build logs. A successful Next.js build ends with
something like:
```
Compiled successfully
Deployment completed
```

When done, Vercel gives you a URL like:
```
https://ecommerce-mvp-yourname.vercel.app
```

This is your live store.

---

## Part 4 — Connect the two (lock down CORS)

Right now your backend accepts requests from any website (open CORS),
which works but is a bit loose. Let's point it specifically at your new
Vercel URL.

1. Go back to **Railway** → your backend service → **Variables**.
2. Edit the `CORS_ORIGIN` variable you left blank earlier.
3. Set its value to your Vercel URL from step 3.3, e.g.:
   ```
   https://ecommerce-mvp-yourname.vercel.app
   ```
   (no trailing slash)
4. Save — Railway will automatically redeploy the backend with the new setting.

---

## Part 5 — Verify everything works

1. Open your Vercel URL in a browser. You should see the store home
   page, in Arabic, with product categories.
2. Go to `<your-vercel-url>/admin/login`.
3. Log in with:
   - Email: `admin@example.com`
   - Password: `ChangeMe123!`
4. You should land on the dashboard **Overview** screen.
5. **Immediately** go to **Settings** in the dashboard sidebar and change
   this password using the password-reset option next to your own account.

---

## Sharing access with colleagues

- **Store** (anyone): `https://ecommerce-mvp-yourname.vercel.app`
- **Dashboard** (staff only): `https://ecommerce-mvp-yourname.vercel.app/admin/login`

To give a colleague dashboard access without sharing the superuser
password, log in as the superuser and create a new staff account for
them from **Settings → Users & Roles**, picking whichever role fits
their job (Operations, Pricing, Finance, Delivery, or Read-only).

---

## Common issues and what they mean

| Symptom | Likely cause |
|---|---|
| Railway build fails at `npm install` | Usually a dependency issue — send me the exact error text |
| Railway build fails at `prisma migrate deploy` | Usually means `DATABASE_URL` isn't set correctly — recheck step 2.4 |
| Vercel builds fine, but the site shows errors when loading data | `NEXT_PUBLIC_API_URL` is probably missing, wrong, or pointing to `localhost` — recheck step 3.2.3 |
| Dashboard login fails with "invalid credentials" | The seed script may not have run — redo step 2.8 |
| Store loads but every page shows empty/no products | Same as above — seed script needs to run once against the live database |

If you hit anything not listed here, copy the exact error message
(from either the browser console or the platform's build logs) and send
it to me directly — that's the fastest way for me to pinpoint the fix.
