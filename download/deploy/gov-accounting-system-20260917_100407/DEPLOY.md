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
