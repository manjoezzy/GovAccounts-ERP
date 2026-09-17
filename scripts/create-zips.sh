#!/bin/bash
set -e

BASE_DIR="/home/z/my-project"
DOWNLOAD_DIR="$BASE_DIR/download"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Creating GovAccounts-ERP downloadable packages ==="

# ── 1. FULL PROJECT ZIP ──────────────────────────────────────
echo "[1/2] Creating full project zip..."
cd "$BASE_DIR"

# Create full project zip (excluding node_modules, .next, db)
FULL_ZIP="$DOWNLOAD_DIR/GovAccounts-ERP-Full-${TIMESTAMP}.zip"
zip -r "$FULL_ZIP" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x "db/*" \
  -x ".git/*" \
  -x "download/*" \
  -x "scripts/*.py" \
  -x "tests/*" \
  -x "examples/*" \
  -x "upgrade-docs.json" \
  -x "worklog.md" \
  -x "bun.lock" \
  -x "Caddyfile" \
  -x "--timeout" \
  -x "*.tar.gz" \
  -x "upload/*" \
  -x "tool-results/*"

echo "  → Full project: $FULL_ZIP"
echo "  → Size: $(du -h "$FULL_ZIP" | cut -f1)"

# ── 2. DEPLOYABLE ZIP ────────────────────────────────────────
echo "[2/2] Creating deployable zip (Vercel-ready)..."

DEPLOY_DIR="$DOWNLOAD_DIR/deploy-temp"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy only files needed for deployment
mkdir -p "$DEPLOY_DIR/prisma"
mkdir -p "$DEPLOY_DIR/public"
mkdir -p "$DEPLOY_DIR/src"

# Root config files
cp package.json "$DEPLOY_DIR/"
cp next.config.ts "$DEPLOY_DIR/"
cp tsconfig.json "$DEPLOY_DIR/"
cp tailwind.config.ts "$DEPLOY_DIR/"
cp postcss.config.mjs "$DEPLOY_DIR/"
cp eslint.config.mjs "$DEPLOY_DIR/"
cp components.json "$DEPLOY_DIR/"
cp .env.example "$DEPLOY_DIR/" 2>/dev/null || true

# Prisma
cp prisma/schema.prisma "$DEPLOY_DIR/prisma/"

# Public
cp public/logo.svg "$DEPLOY_DIR/public/" 2>/dev/null || true
cp public/robots.txt "$DEPLOY_DIR/public/" 2>/dev/null || true

# Source code (recursively, excluding tool-results)
rsync -a --exclude='tool-results' src/ "$DEPLOY_DIR/src/"

# Create a DEPLOY.md for instructions
cat > "$DEPLOY_DIR/DEPLOY.md" << 'DEPLOY_EOF'
# GovAccounts ERP — Deployment Guide

## Vercel Deployment (Recommended)

### 1. Push to GitHub
```bash
git init && git add -A && git commit -m "initial"
git remote add origin https://github.com/YOUR_USER/GovAccounts-ERP.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework Preset: **Next.js**
4. Root Directory: `.` (default)

### 3. Set Environment Variables on Vercel
Add these in **Settings → Environment Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | Turso/libSQL connection URL (e.g. `libsql://your-db.turso.io`) |
| `TURSO_AUTH_TOKEN` | If using Turso | Turso database auth token |
| `NEXTAUTH_SECRET` | **Yes** | Random secret for JWT signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | **Yes** | Your Vercel URL (e.g. `https://gov-accounts-erp.vercel.app`) |
| `GOOGLE_CLIENT_ID` | **Yes** | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | **Yes** | Google OAuth client secret |

### 4. Set Up Turso Database (Cloud SQLite)
```bash
npm install -g turso
turso auth login
turso db create gov-accounts-erp
turso db shell gov-accounts-erp < prisma/schema.sql
```

Get the connection URL and auth token:
```bash
turso db show gov-accounts-erp --url
turso db tokens create gov-accounts-erp
```

### 5. Deploy
Vercel will auto-deploy on push. First deploy takes ~2-3 minutes.

## Local Development

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed    # Optional: seed with sample data
npm run dev
```

Open http://localhost:3000

## Without Turso (Local SQLite only)
For local-only development, the default `DATABASE_URL=file:./db/dev.db` works out of the box.
For Vercel, you **must** use a cloud database (Turso recommended).
DEPLOY_EOF

# Zip the deployable package
DEPLOY_ZIP="$DOWNLOAD_DIR/GovAccounts-ERP-Deploy-${TIMESTAMP}.zip"
cd "$DEPLOY_DIR"
zip -r "$DEPLOY_ZIP" . -x "node_modules/*" -x ".next/*"
cd "$BASE_DIR"

echo "  → Deployable: $DEPLOY_ZIP"
echo "  → Size: $(du -h "$DEPLOY_ZIP" | cut -f1)"

# Cleanup temp
rm -rf "$DEPLOY_DIR"

echo ""
echo "=== Done! ==="
echo "Full project:   $FULL_ZIP"
echo "Deployable:     $DEPLOY_ZIP"
