#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Government Accounting & Financial Statements Generation System
# Deployment Package Builder
# ═══════════════════════════════════════════════════════════════

set -e

PROJECT_DIR="/home/z/my-project"
OUTPUT_DIR="/home/z/my-project/download/deploy"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="gov-accounting-system-${TIMESTAMP}"

echo "📦 Building deployment package: ${PACKAGE_NAME}"
echo "================================================"

# Clean output
rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}/${PACKAGE_NAME}"

# ── 1. Copy essential project files ──────────────────────────
echo "  Copying project files..."

# Source code
cp -r "${PROJECT_DIR}/src" "${OUTPUT_DIR}/${PACKAGE_NAME}/src"
cp -r "${PROJECT_DIR}/prisma" "${OUTPUT_DIR}/${PACKAGE_NAME}/prisma"
cp -r "${PROJECT_DIR}/public" "${OUTPUT_DIR}/${PACKAGE_NAME}/public"

# Config files
cp "${PROJECT_DIR}/package.json" "${OUTPUT_DIR}/${PACKAGE_NAME}/"
cp "${PROJECT_DIR}/tsconfig.json" "${OUTPUT_DIR}/${PACKAGE_NAME}/"
cp "${PROJECT_DIR}/next.config.ts" "${OUTPUT_DIR}/${PACKAGE_NAME}/"
cp "${PROJECT_DIR}/tailwind.config.ts" "${OUTPUT_DIR}/${PACKAGE_NAME}/"
cp "${PROJECT_DIR}/postcss.config.mjs" "${OUTPUT_DIR}/${PACKAGE_NAME}/"
cp "${PROJECT_DIR}/components.json" "${OUTPUT_DIR}/${PACKAGE_NAME}/"
cp "${PROJECT_DIR}/eslint.config.mjs" "${OUTPUT_DIR}/${PACKAGE_NAME}/"

# Environment example
if [ -f "${PROJECT_DIR}/.env.example" ]; then
  cp "${PROJECT_DIR}/.env.example" "${OUTPUT_DIR}/${PACKAGE_NAME}/.env.example"
else
  cat > "${OUTPUT_DIR}/${PACKAGE_NAME}/.env.example" << 'EOF'
DATABASE_URL=file:./db/dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF
fi

# ── 2. Copy seed scripts ─────────────────────────────────────
echo "  Copying seed & verification scripts..."
mkdir -p "${OUTPUT_DIR}/${PACKAGE_NAME}/scripts"
cp "${PROJECT_DIR}/prisma/seed-comprehensive.ts" "${OUTPUT_DIR}/${PACKAGE_NAME}/prisma/seed-comprehensive.ts"
cp "${PROJECT_DIR}/prisma/seed.ts" "${OUTPUT_DIR}/${PACKAGE_NAME}/prisma/seed.ts"
if [ -f "${PROJECT_DIR}/scripts/verify-system.ts" ]; then
  cp "${PROJECT_DIR}/scripts/verify-system.ts" "${OUTPUT_DIR}/${PACKAGE_NAME}/scripts/verify-system.ts"
fi

# ── 3. Create deployment README ──────────────────────────────
echo "  Creating README..."
cat > "${OUTPUT_DIR}/${PACKAGE_NAME}/DEPLOY.md" << 'DEPLOY_EOF'
# Government Accounting & Financial Statements Generation System

## Deployment Guide

### Prerequisites
- Node.js 18+ (or Bun)
- npm/bun package manager
- Google OAuth credentials (for authentication)

### Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Initialize database:**
   ```bash
   npx prisma generate
   npx prisma db push --accept-data-loss
   ```

4. **Seed with initial data:**
   ```bash
   npx tsx prisma/seed-comprehensive.ts
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

6. **Verify the system:**
   ```bash
   npx tsx scripts/verify-system.ts
   ```

### Vercel Deployment

1. Push to GitHub (ensure .env is NOT committed)
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. For Turso database: set `DATABASE_URL=libsql://...`
5. Deploy

### Key Features

- **16 Accounting Modules:** Fund Setup, Votebook, Warrants, Virements, Commitments, Procurement, Journal Book, Petty Cash, Imprest, Cashbook, Bank Reconciliation, General Ledger, Payroll, Tax, Grants, Debt
- **IPSAS-Compliant:** All 24 financial statement tables
- **Carry Forward Balances:** Create new periods with opening balances from previous period
- **Full Editability:** All data is editable via the unified API
- **Audit Trail:** All changes are logged automatically
- **Approval Workflow:** Draft → Review → CFO Approval
- **Dark Mode:** Toggle light/dark theme
- **PDF & Excel Export:** Generate reports for download

### Carry-Forward API

Create a new financial period from an existing one:

```bash
POST /api/reports/carry-forward
{
  "sourceReportId": "...",
  "newPeriodEnd": "2026-06-30",
  "newPeriodLabel": "30 June 2026",
  "newFiscalYear": "2025-26"
}
```

This automatically:
- Carries forward balance sheet accounts (assets/liabilities/equity)
- Resets nominal accounts (revenue/expense) to 0 with prior year data
- Carries forward: Funds, Votebook, Warrants, Ledger, Assets, Grants, Debt, Appropriation, Inventory, Debtors, Creditors

### Editable Data API

All 16 modules support full CRUD operations:

```bash
# Fetch module data
GET /api/reports/[id]/data?module=votebook

# Create new entry
POST /api/reports/[id]/data
{ "module": "votebook", "data": { ... } }

# Update existing entry
PUT /api/reports/[id]/data
{ "module": "votebook", "entryId": "...", "updates": { ... } }

# Delete entry
DELETE /api/reports/[id]/data?module=votebook&entryId=...
```

Supported modules: trialBalance, supplementary, funds, votebook, warrants, virements, commitments, procurement, journal, pettyCash, imprest, cashbook, bankReconciliation, ledger, payroll, tax, grants, debt, cheques, suspense, revenue, expenditure, appropriation, interFundTransfers, assets, inventory, debtors, creditors, closingEntries, approval
DEPLOY_EOF

# ── 4. Create tarball ────────────────────────────────────────
echo "  Creating tarball..."
cd "${OUTPUT_DIR}"
tar -czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}"

# ── 5. Summary ───────────────────────────────────────────────
SIZE=$(du -sh "${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz" | cut -f1)
FILES=$(find "${OUTPUT_DIR}/${PACKAGE_NAME}" -type f | wc -l)

echo ""
echo "✅ Package built successfully!"
echo "   Location: ${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz"
echo "   Size: ${SIZE}"
echo "   Files: ${FILES}"
echo ""
echo "   To deploy:"
echo "   1. Extract: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "   2. cd ${PACKAGE_NAME}"
echo "   3. npm install"
echo "   4. cp .env.example .env && edit .env"
echo "   5. npx prisma generate && npx prisma db push"
echo "   6. npx tsx prisma/seed-comprehensive.ts"
echo "   7. npm run dev"
