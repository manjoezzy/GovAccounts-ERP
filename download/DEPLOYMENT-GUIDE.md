# GovAccounts ERP — Deployment & Setup Guide

## 🚀 Part 1: Vercel Deployment Fix

The Vercel deployment fails because **environment variables are not configured**. Follow these steps:

### Step 1: Set Up Turso Database (Cloud SQLite)

Vercel serverless functions cannot read local SQLite files. You need a cloud database.

```bash
# Install Turso CLI
curl -sL https://get.tur.so/install.sh | bash

# Login to Turso (free tier available)
turso auth login

# Create a database
turso db create gov-accounts-erp

# Get your connection URL
turso db show gov-accounts-erp --url
# → libsql://gov-accounts-erp-XXXX.aws-eu-west-1.turso.io

# Create an auth token
turso db tokens create gov-accounts-erp
# → eyJhbGciOiJFNVVTNTI...

# Apply the database schema
turso db shell gov-accounts-erp < prisma/schema.sql
```

### Step 2: Configure Vercel Environment Variables

Go to **https://vercel.com → Your Project → Settings → Environment Variables**

Add ALL of these:

| Variable | Value | How to Get |
|----------|-------|------------|
| `DATABASE_URL` | `libsql://gov-accounts-erp-XXXX.turso.io` | From `turso db show --url` |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFNVVT...` | From `turso db tokens create` |
| `NEXTAUTH_URL` | `https://gov-accounts-erp.vercel.app` | Your Vercel app URL |
| `NEXTAUTH_SECRET` | (generate below) | Run: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | `XXXX.apps.googleusercontent.com` | See Part 2 below |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-XXXX` | See Part 2 below |

Generate NEXTAUTH_SECRET locally:
```bash
openssl rand -base64 32
# → e.g. K7x3mN9vQ2wR8tY5pL1jH6fD0gB4zA+C/XsUeIiM=
```

### Step 3: Redeploy

After setting all environment variables, redeploy:
- Go to **Vercel → Deployments → Click "Redeploy"** on the latest deployment
- Or push a new commit to GitHub (auto-deploys)

---

## 🔐 Part 2: Google OAuth Credentials Setup

Follow these steps to get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`:

### Step 1: Go to Google Cloud Console

1. Open **https://console.cloud.google.com/**
2. Sign in with your Google account
3. If prompted, agree to Terms of Service

### Step 2: Create a New Project

1. Click the project dropdown at the top (next to "Google Cloud")
2. Click **"New Project"**
3. Name it: `GovAccounts ERP`
4. Click **"Create"**
5. Select the new project from the dropdown

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen** (left sidebar)
2. Choose **"External"** (since this is not a Google Workspace)
3. Click **"Create"**

Fill in the form:
- **App name**: `GovAccounts ERP`
- **User support email**: Your email
- **App logo**: (skip for now)
- **Application home page**: `https://gov-accounts-erp.vercel.app`
- **Application privacy policy link**: (skip or add a placeholder URL)
- **Application terms of service link**: (skip)
- **Authorized domains**: Click "Add domain" → `gov-accounts-erp.vercel.app`
- **Developer contact info**: Your email

Click **"Save and Continue"**

### Step 4: Add OAuth Scopes

1. On the Scopes page, click **"Add or Remove Scopes"**
2. Add these scopes:
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `openid`
3. Click **"Update"** → **"Save and Continue"**

### Step 5: Add Test Users

1. On the Test Users page, click **"Add Users"**
2. Add your Google email address
3. Click **"Add"** → **"Save and Continue"**
4. Click **"Back to Dashboard"**

> ⚠️ **Important**: While in "Testing" mode, only added users can sign in.
> To allow anyone, go back and **"Publish App"** to change status to "In Production".

### Step 6: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials** (left sidebar)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `GovAccounts ERP Web Client`

5. **Authorized JavaScript origins** — Click "Add URI":
   - `http://localhost:3000` (for local development)
   - `https://gov-accounts-erp.vercel.app` (for Vercel production)

6. **Authorized redirect URIs** — Click "Add URI":
   - `http://localhost:3000/api/auth/callback/google` (local dev)
   - `https://gov-accounts-erp.vercel.app/api/auth/callback/google` (Vercel production)

7. Click **"Create"**

### Step 7: Copy Your Credentials

You'll see a modal with:
- **Your Client ID**: Looks like `123456789-abc.apps.googleusercontent.com`
- **Your Client Secret**: Looks like `GOCSPX-xxxxxxxxxxxx`

Copy both values. You can also find them later in **Credentials → OAuth 2.0 Client IDs**.

### Step 8: Set Environment Variables

**For local development** — edit `.env`:
```bash
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

**For Vercel** — add in Settings → Environment Variables:
- `GOOGLE_CLIENT_ID` = your client ID
- `GOOGLE_CLIENT_SECRET` = your client secret
- `NEXTAUTH_URL` = `https://gov-accounts-erp.vercel.app`
- `NEXTAUTH_SECRET` = a generated secret

---

## 📋 Quick Checklist

Before redeploying to Vercel, verify ALL of these are set:

- [ ] Turso database created and schema applied
- [ ] `DATABASE_URL` set on Vercel (libsql:// URL)
- [ ] `TURSO_AUTH_TOKEN` set on Vercel
- [ ] Google Cloud project created
- [ ] OAuth consent screen configured (External)
- [ ] OAuth 2.0 credentials created (Web application)
- [ ] Redirect URIs include `https://gov-accounts-erp.vercel.app/api/auth/callback/google`
- [ ] `GOOGLE_CLIENT_ID` set on Vercel
- [ ] `GOOGLE_CLIENT_SECRET` set on Vercel
- [ ] `NEXTAUTH_URL` set to `https://gov-accounts-erp.vercel.app` on Vercel
- [ ] `NEXTAUTH_SECRET` generated and set on Vercel
- [ ] Redeployed on Vercel after setting all variables

---

## 🏠 Local Development (Quick Start)

For local development without Google OAuth, you can bypass auth:

1. The app auto-redirects to `/login` if not authenticated
2. Click "Continue with Google" to sign in
3. First user is automatically registered

If you just want to test locally without setting up Google OAuth:
```bash
# Start dev server
npm run dev

# Or production server
npm run build && npm run start
```

The app will still show the login page, but you need Google credentials to proceed.
