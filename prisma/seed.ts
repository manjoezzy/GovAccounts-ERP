import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Madera Government Financial Statement FY 2024-25...')

  // Clean all tables (reverse dependency order)
  const models = [
    'ledgerTransaction', 'ledgerAccount', 'journalLine', 'journalEntry',
    'cashbookEntry', 'cashbookOpeningBalance', 'votebookEntry', 'warrant', 'virement',
    'commitment', 'procurementPlan', 'pettyCashTransaction', 'imprest', 'bankReconciliation',
    'payrollEntry', 'taxEntry', 'grantEntry', 'debtEntry', 'chequeEntry', 'suspenseAccount',
    'revenueEntry', 'expenditureEntry', 'appropriationAccount', 'interFundTransfer',
    'assetRegister', 'inventoryItem', 'debtorAccount', 'creditorAccount',
    'closingEntry', 'yearEndChecklist', 'notification', 'fund',
    'approvalWorkflow', 'supplementaryData', 'auditLog', 'trialBalanceEntry',
    'financialReport', 'session', 'account', 'user',
  ]
  for (const m of models) {
    try { await (prisma as any)[m].deleteMany() } catch {}
  }
  console.log('  All tables cleaned')

  // ── 1. USERS ───────────────────────────────────────────────────
  const admin = await prisma.user.create({ data: { name: 'James K. Madera', email: 'admin@madera.go.ug', role: 'admin' } })
  const accountant = await prisma.user.create({ data: { name: 'Sarah N. Achieng', email: 'sachieng@madera.go.ug', role: 'accountant' } })
  const viewer = await prisma.user.create({ data: { name: 'Peter O. Mukasa', email: 'pmukasa@madera.go.ug', role: 'viewer' } })
  console.log('  3 Users created')

  // ── 2. FINANCIAL REPORT ────────────────────────────────────────
  const report = await prisma.financialReport.create({
    data: { entityName: 'Madera Local Government', periodEnd: '2025-06-30', periodLabel: '30 June 2025', currency: 'Shs', status: 'draft', version: 1, versionLabel: 'Original', fiscalYear: '2024-25' },
  })
  console.log(`  FinancialReport: ${report.id}`)

  // ── 3. TRIAL BALANCE ENTRIES (37) ─────────────────────────────
  const tbData: any[] = [
    // Revenue Non-Exchange (credit balances)
    { accountCode: 'R001', accountName: 'Taxes', classification: 'revenue-non-exchange', category: 'taxes', noteRef: '2', creditCurrent: 125000000, creditPrior: 118500000, budgetInitial: 130000000, budgetAdjusted: 130000000 },
    { accountCode: 'R002', accountName: 'External Assistance', classification: 'revenue-non-exchange', category: 'external_assistance', noteRef: '3', creditCurrent: 45200000, creditPrior: 42800000, budgetInitial: 48000000, budgetAdjusted: 48000000 },
    { accountCode: 'R003', accountName: 'Transfers received from Treasury-UCF', classification: 'revenue-non-exchange', category: 'transfers_treasury_ucf', noteRef: '4', creditCurrent: 320000000, creditPrior: 305000000, budgetInitial: 330000000, budgetAdjusted: 330000000 },
    { accountCode: 'R004', accountName: 'Transfers from Contingencies Fund', classification: 'revenue-non-exchange', category: 'transfers_contingencies', noteRef: '5', creditCurrent: 8500000, creditPrior: 6200000, budgetInitial: 10000000, budgetAdjusted: 10000000 },
    { accountCode: 'R005', accountName: 'Transfers from other Government Units', classification: 'revenue-non-exchange', category: 'transfers_other_govt', noteRef: '6', creditCurrent: 15300000, creditPrior: 14100000, budgetInitial: 16000000, budgetAdjusted: 16000000 },
    { accountCode: 'R006', accountName: 'Non-Tax revenue-Exchange Transaction', classification: 'revenue-non-exchange', category: 'non_tax_exchange', noteRef: '7', creditCurrent: 22700000, creditPrior: 20500000, budgetInitial: 24000000, budgetAdjusted: 24000000 },
    { accountCode: 'R008', accountName: 'Revenue in Kind', classification: 'revenue-non-exchange', category: 'revenue_in_kind', noteRef: '8(b)', creditCurrent: 3200000, creditPrior: 2800000, budgetInitial: 3500000, budgetAdjusted: 3500000 },
    // Revenue Exchange
    { accountCode: 'R007', accountName: 'Students Fees / Exchange Revenue', classification: 'revenue-exchange', category: 'sub_exchange', noteRef: '8', creditCurrent: 35600000, creditPrior: 32400000, budgetInitial: 38000000, budgetAdjusted: 38000000 },
    { accountCode: 'R009', accountName: 'Non-Tax Revenue-Exchange', classification: 'revenue-exchange', category: 'non_tax_revenue_exchange', noteRef: '7(b)', creditCurrent: 18400000, creditPrior: 16800000, budgetInitial: 20000000, budgetAdjusted: 20000000 },
    // Expenses (debit balances)
    { accountCode: 'E001', accountName: 'Compensation of Employees', classification: 'expense', category: 'compensation', noteRef: '9', debitCurrent: 285000000, debitPrior: 268000000, budgetInitial: 295000000, budgetAdjusted: 295000000 },
    { accountCode: 'E002', accountName: 'Goods and Services Consumed', classification: 'expense', category: 'goods_services', noteRef: '10', debitCurrent: 142500000, debitPrior: 135200000, budgetInitial: 150000000, budgetAdjusted: 150000000 },
    { accountCode: 'E003', accountName: 'Depreciation Expense', classification: 'expense', category: 'depreciation', noteRef: '11', debitCurrent: 28600000, debitPrior: 26400000 },
    { accountCode: 'E004', accountName: 'Impairment of PPE', classification: 'expense', category: 'impairment', noteRef: '12', debitCurrent: 2100000, debitPrior: 1800000 },
    { accountCode: 'E005', accountName: 'Subsidies', classification: 'expense', category: 'subsidies', noteRef: '13', debitCurrent: 12400000, debitPrior: 11200000, budgetInitial: 13000000, budgetAdjusted: 13000000 },
    { accountCode: 'E006', accountName: 'Grants and Other Transfers', classification: 'expense', category: 'grants_transfers', noteRef: '14', debitCurrent: 38700000, debitPrior: 35500000, budgetInitial: 40000000, budgetAdjusted: 40000000 },
    { accountCode: 'E007', accountName: 'Social Benefits', classification: 'expense', category: 'social_benefits', noteRef: '15', debitCurrent: 22800000, debitPrior: 21200000, budgetInitial: 24000000, budgetAdjusted: 24000000 },
    { accountCode: 'E008', accountName: 'Finance Costs', classification: 'expense', category: 'finance_costs', noteRef: '16', debitCurrent: 5400000, debitPrior: 4800000, budgetInitial: 6000000, budgetAdjusted: 6000000 },
    { accountCode: 'E009', accountName: 'Bad Debts Expense', classification: 'expense', category: 'bad_debts', noteRef: '17', debitCurrent: 1200000, debitPrior: 900000 },
    { accountCode: 'E010', accountName: 'Other Expenses', classification: 'expense', category: 'other_expenses', noteRef: '18', debitCurrent: 8600000, debitPrior: 7400000, budgetInitial: 9000000, budgetAdjusted: 9000000 },
    // Assets (debit balances)
    { accountCode: 'A001', accountName: 'Cash and Cash Equivalents', classification: 'asset', category: 'cash', noteRef: '21', debitCurrent: 89200000, debitPrior: 76500000 },
    { accountCode: 'A002', accountName: 'Prepayments and Advances (Current)', classification: 'asset', category: 'prepayments_current', noteRef: '22(a)', debitCurrent: 12400000, debitPrior: 10800000 },
    { accountCode: 'A003', accountName: 'Receivables (Current)', classification: 'asset', category: 'receivables_current', noteRef: '23(d)', debitCurrent: 28600000, debitPrior: 24200000 },
    { accountCode: 'A004', accountName: 'Inventories', classification: 'asset', category: 'inventories', noteRef: '24', debitCurrent: 8500000, debitPrior: 7200000 },
    { accountCode: 'A005', accountName: 'Prepayments and Advances (Non-Current)', classification: 'asset', category: 'prepayments_nc', noteRef: '22(b)', debitCurrent: 15200000, debitPrior: 13800000 },
    { accountCode: 'A006', accountName: 'Receivables (Non-Current)', classification: 'asset', category: 'receivables_nc', noteRef: '23(e)', debitCurrent: 6800000, debitPrior: 5400000 },
    { accountCode: 'A007', accountName: 'Investments', classification: 'asset', category: 'investments', noteRef: '25', debitCurrent: 42000000, debitPrior: 38500000 },
    { accountCode: 'A008', accountName: 'Property, Plant and Equipment', classification: 'asset', category: 'ppe', noteRef: '26(a)', debitCurrent: 185000000, debitPrior: 172000000 },
    { accountCode: 'A009', accountName: 'Investment Property', classification: 'asset', category: 'investment_property', noteRef: '26(b)', debitCurrent: 0, debitPrior: 0 },
    { accountCode: 'A010', accountName: 'Intangible Assets', classification: 'asset', category: 'intangible', noteRef: '26(c)', debitCurrent: 3200000, debitPrior: 3600000 },
    { accountCode: 'A011', accountName: 'Non-Produced Assets', classification: 'asset', category: 'non_produced', noteRef: '27', debitCurrent: 0, debitPrior: 0 },
    // Liabilities (credit balances)
    { accountCode: 'L001', accountName: 'Payables (Current)', classification: 'liability', category: 'payables_current', noteRef: '28(a)', creditCurrent: 32400000, creditPrior: 28600000 },
    { accountCode: 'L002', accountName: 'Deposits (Current)', classification: 'liability', category: 'deposits_current', noteRef: '29(a)', creditCurrent: 8200000, creditPrior: 7400000 },
    { accountCode: 'L003', accountName: 'Short-term Borrowings', classification: 'liability', category: 'short_borrowings', noteRef: '30(a)', creditCurrent: 15600000, creditPrior: 12800000 },
    { accountCode: 'L004', accountName: 'Pensions (Current)', classification: 'liability', category: 'pensions_current', noteRef: '31(a)', creditCurrent: 22800000, creditPrior: 20200000 },
    { accountCode: 'L005', accountName: 'Payables (Non-Current)', classification: 'liability', category: 'payables_nc', noteRef: '28(b)', creditCurrent: 18400000, creditPrior: 16200000 },
    { accountCode: 'L006', accountName: 'Deposits (Non-Current)', classification: 'liability', category: 'deposits_nc', noteRef: '29(b)', creditCurrent: 5600000, creditPrior: 4800000 },
    { accountCode: 'L007', accountName: 'Long-term Borrowings', classification: 'liability', category: 'long_borrowings', noteRef: '30(b)', creditCurrent: 45000000, creditPrior: 42000000 },
    { accountCode: 'L008', accountName: 'Pensions (Non-Current)', classification: 'liability', category: 'pensions_nc', noteRef: '31(b)', creditCurrent: 68500000, creditPrior: 62400000 },
    // Equity
    { accountCode: 'NA01', accountName: 'Accumulated Surplus / Net Assets', classification: 'equity', category: 'net_assets', noteRef: '32', creditCurrent: 127800000, creditPrior: 110900000 },
  ]

  const allEntries = tbData.map((e: any, i: number) => ({
    reportId: report.id, ...e,
    debitCurrent: e.debitCurrent || 0, creditCurrent: e.creditCurrent || 0,
    debitPrior: e.debitPrior || 0, creditPrior: e.creditPrior || 0,
    budgetInitial: e.budgetInitial || 0, budgetAdjusted: e.budgetAdjusted || 0,
    sortOrder: i + 1,
  }))
  await prisma.trialBalanceEntry.createMany({ data: allEntries })
  console.log(`  ${allEntries.length} TrialBalanceEntry records`)

  // ── 4. SUPPLEMENTARY DATA ──────────────────────────────────────
  await prisma.supplementaryData.create({
    data: {
      reportId: report.id,
      ppeOpeningCurrent: 172000000, ppeAdditionsCurrent: 18500000, ppeDisposalsCurrent: 5500000,
      ppeOpeningPrior: 158000000, ppeAdditionsPrior: 16200000, ppeDisposalsPrior: 2200000,
      depreciationRate: 15, depreciationMethod: 'straight-line',
      employeeCount: 342, salariesWages: 245000000, pensionContributions: 28500000,
      payrollTaxes: 11500000, otherEmployeeBenefits: 8200000,
      advancesRecovered: 12400000, advancesRecoveredPrior: 10800000,
      depositsReceived: 8200000, depositsReceivedPrior: 7400000,
      transfersToTreasury: 15600000, transfersToTreasuryPrior: 13200000,
      revenueInKindTaxWaivers: 3200000, revenueInKindTaxWaiversPrior: 2800000,
      priorYearAdjustments: 2400000, revaluationReserves: 5600000, transfersToUCF: 320000000,
      accountingOfficer: 'James K. Madera', chiefFinanceOfficer: 'Sarah N. Achieng',
      internalAuditHead: 'Peter O. Mukasa', signatoryDate: '2025-08-15',
      ipsasBasis: 'IPSAS Accrual Basis',
      accountingPolicies: 'Accrual basis of accounting consistent with IPSAS standards.',
      exchangeRateUSD: 3725, exchangeRateEUR: 4050,
    },
  })
  console.log('  SupplementaryData')

  // ── 5. APPROVAL WORKFLOW ───────────────────────────────────────
  await prisma.approvalWorkflow.create({
    data: { reportId: report.id, currentStep: 'review', preparerName: 'Sarah N. Achieng', preparerApprovedAt: new Date('2025-07-15'), reviewerName: 'Peter O. Mukasa', comments: 'Prepared and submitted for review.' },
  })
  console.log('  ApprovalWorkflow')

  // ── 6. FUNDS ──────────────────────────────────────────────────
  await prisma.fund.createMany({
    data: [
      { reportId: report.id, name: 'Consolidated Fund', fundType: 'general', code: 'CF-001', description: 'Primary government operating fund', isActive: true, openingBalance: 76500000 },
      { reportId: report.id, name: 'Development Fund', fundType: 'development', code: 'DF-001', description: 'Capital development fund', isActive: true, openingBalance: 42000000 },
      { reportId: report.id, name: 'Special Revenue Fund', fundType: 'special', code: 'SF-001', description: 'Ring-fenced donor grants', isActive: true, openingBalance: 15000000 },
    ],
  })
  console.log('  3 Funds')

  // ── 7. VOTEBOOK ───────────────────────────────────────────────
  await prisma.votebookEntry.createMany({
    data: [
      { reportId: report.id, voteCode: '101', voteName: 'Compensation of Employees', originalAppropriation: 295000000, supplementaryAppropriation: 0, totalAppropriation: 295000000, actualExpenditure: 285000000, balance: 10000000, commitDate: '2024-07-01', notes: 'FY 2024-25' },
      { reportId: report.id, voteCode: '102', voteName: 'Goods and Services', originalAppropriation: 150000000, supplementaryAppropriation: 0, totalAppropriation: 150000000, actualExpenditure: 142500000, balance: 7500000, commitDate: '2024-07-01', notes: 'FY 2024-25' },
      { reportId: report.id, voteCode: '201', voteName: 'Grants and Transfers', originalAppropriation: 40000000, supplementaryAppropriation: 0, totalAppropriation: 40000000, actualExpenditure: 38700000, balance: 1300000, commitDate: '2024-07-01', notes: 'FY 2024-25' },
      { reportId: report.id, voteCode: '301', voteName: 'Social Benefits', originalAppropriation: 24000000, supplementaryAppropriation: 0, totalAppropriation: 24000000, actualExpenditure: 22800000, balance: 1200000, commitDate: '2024-07-01', notes: 'FY 2024-25' },
      { reportId: report.id, voteCode: '401', voteName: 'Capital Development', originalAppropriation: 50000000, supplementaryAppropriation: 5000000, totalAppropriation: 55000000, actualExpenditure: 48600000, balance: 6400000, commitDate: '2024-07-01', notes: 'FY 2024-25' },
      { reportId: report.id, voteCode: '501', voteName: 'Finance Costs', originalAppropriation: 6000000, supplementaryAppropriation: 0, totalAppropriation: 6000000, actualExpenditure: 5400000, balance: 600000, commitDate: '2024-07-01', notes: 'FY 2024-25' },
      { reportId: report.id, voteCode: '502', voteName: 'Contingencies', originalAppropriation: 10000000, supplementaryAppropriation: 0, totalAppropriation: 10000000, actualExpenditure: 8500000, balance: 1500000, commitDate: '2024-07-01', notes: 'FY 2024-25' },
    ],
  })
  console.log('  7 VotebookEntry records')

  // ── 8. WARRANTS ───────────────────────────────────────────────
  await prisma.warrant.createMany({
    data: [
      { reportId: report.id, warrantNo: 'W-2024-001', voteCode: '101', amount: 295000000, authority: 'Accounting Officer', issueDate: '2024-07-01', expiryDate: '2025-06-30', status: 'active', utilized: 285000000, balance: 10000000 },
      { reportId: report.id, warrantNo: 'W-2024-002', voteCode: '102', amount: 150000000, authority: 'Accounting Officer', issueDate: '2024-07-01', expiryDate: '2025-06-30', status: 'active', utilized: 142500000, balance: 7500000 },
      { reportId: report.id, warrantNo: 'W-2024-003', voteCode: '401', amount: 55000000, authority: 'CFO', issueDate: '2024-07-01', expiryDate: '2025-06-30', status: 'active', utilized: 48600000, balance: 6400000 },
      { reportId: report.id, warrantNo: 'W-2023-010', voteCode: '301', amount: 20000000, authority: 'Accounting Officer', issueDate: '2023-07-01', expiryDate: '2024-06-30', status: 'expired', utilized: 20000000, balance: 0 },
    ],
  })
  console.log('  4 Warrant records')

  // ── 9. VIREMENTS ──────────────────────────────────────────────
  await prisma.virement.createMany({
    data: [
      { reportId: report.id, fromVote: '102', toVote: '301', amount: 2000000, reason: 'Additional social benefit payments', authBy: 'CFO', authDate: '2024-11-15', status: 'approved' },
      { reportId: report.id, fromVote: '502', toVote: '401', amount: 3000000, reason: 'Emergency road repair after floods', authBy: 'Accounting Officer', authDate: '2025-02-10', status: 'approved' },
      { reportId: report.id, fromVote: '101', toVote: '102', amount: 1500000, reason: 'Supplement operational expenses', authBy: 'CFO', authDate: '2025-04-01', status: 'pending' },
    ],
  })
  console.log('  3 Virement records')

  // ── 10. COMMITMENTS ───────────────────────────────────────────
  await prisma.commitment.createMany({
    data: [
      { reportId: report.id, poNumber: 'PO-2024-001', voteCode: '102', supplier: 'Uganda Printing Co.', description: 'Office supplies Q1-Q4', commitDate: '2024-08-01', committedAmount: 8500000, expendedAmount: 7200000, balance: 1300000, status: 'partially_expended' },
      { reportId: report.id, poNumber: 'PO-2024-002', voteCode: '401', supplier: 'Madera Construction Ltd', description: 'Road rehabilitation - Market Street', commitDate: '2024-09-15', committedAmount: 25000000, expendedAmount: 18500000, balance: 6500000, status: 'partially_expended' },
      { reportId: report.id, poNumber: 'PO-2024-003', voteCode: '102', supplier: 'Umeme Ltd', description: 'Utility payments', commitDate: '2024-07-01', committedAmount: 12000000, expendedAmount: 11800000, balance: 200000, status: 'partially_expended' },
      { reportId: report.id, poNumber: 'PO-2024-004', voteCode: '401', supplier: 'Tech Solutions Ltd', description: 'ICT infrastructure upgrade', commitDate: '2025-01-10', committedAmount: 5000000, expendedAmount: 0, balance: 5000000, status: 'open' },
      { reportId: report.id, poNumber: 'PO-2024-005', voteCode: '102', supplier: 'Clean Water Services', description: 'Water treatment chemicals', commitDate: '2024-07-01', committedAmount: 3500000, expendedAmount: 3500000, balance: 0, status: 'fully_expended' },
    ],
  })
  console.log('  5 Commitment records')

  // ── 11. PROCUREMENT PLANS ─────────────────────────────────────
  await prisma.procurementPlan.createMany({
    data: [
      { reportId: report.id, itemDescription: 'Office Furniture & Equipment', voteCode: '102', estimatedCost: 4500000, procurementMethod: 'shopping', plannedDate: '2024-09-01', status: 'completed' },
      { reportId: report.id, itemDescription: 'Road Rehabilitation - Market St', voteCode: '401', estimatedCost: 25000000, procurementMethod: 'open', plannedDate: '2024-10-01', status: 'in_progress' },
      { reportId: report.id, itemDescription: 'Medical Supplies', voteCode: '102', estimatedCost: 6000000, procurementMethod: 'restricted', plannedDate: '2025-01-15', status: 'planned' },
      { reportId: report.id, itemDescription: 'Vehicle Maintenance Contract', voteCode: '102', estimatedCost: 2800000, procurementMethod: 'direct', plannedDate: '2024-08-01', status: 'completed' },
    ],
  })
  console.log('  4 ProcurementPlan records')

  // ── 12. JOURNAL ENTRIES with lines ────────────────────────────
  await prisma.journalEntry.create({
    data: { reportId: report.id, entryNo: 'JE-001', entryDate: '2024-09-15', narration: 'Q1 tax revenue collection', entryType: 'revenue', reference: 'REV-Q1-001', status: 'posted', postedAt: new Date('2024-09-15'), lines: { create: [{ accountCode: 'A001', accountName: 'Cash and Cash Equivalents', debit: 31250000, credit: 0, sortOrder: 1 }, { accountCode: 'R001', accountName: 'Taxes', debit: 0, credit: 31250000, sortOrder: 2 }] } },
  })
  await prisma.journalEntry.create({
    data: { reportId: report.id, entryNo: 'JE-002', entryDate: '2024-09-30', narration: 'September salary payments', entryType: 'payment', reference: 'PAY-SEP-2024', status: 'posted', postedAt: new Date('2024-09-30'), lines: { create: [{ accountCode: 'E001', accountName: 'Compensation of Employees', debit: 23750000, credit: 0, sortOrder: 1 }, { accountCode: 'A001', accountName: 'Cash and Cash Equivalents', debit: 0, credit: 23750000, sortOrder: 2 }] } },
  })
  await prisma.journalEntry.create({
    data: { reportId: report.id, entryNo: 'JE-003', entryDate: '2024-10-01', narration: 'Quarterly UCF transfer', entryType: 'receipt', reference: 'UCF-Q2-2024', status: 'posted', postedAt: new Date('2024-10-01'), lines: { create: [{ accountCode: 'A001', accountName: 'Cash and Cash Equivalents', debit: 80000000, credit: 0, sortOrder: 1 }, { accountCode: 'R003', accountName: 'Transfers from Treasury-UCF', debit: 0, credit: 80000000, sortOrder: 2 }] } },
  })
  await prisma.journalEntry.create({
    data: { reportId: report.id, entryNo: 'JE-004', entryDate: '2024-12-15', narration: 'Depreciation charge Q2', entryType: 'adjustment', reference: 'DEP-Q2-2024', status: 'posted', postedAt: new Date('2024-12-15'), lines: { create: [{ accountCode: 'E003', accountName: 'Depreciation Expense', debit: 7150000, credit: 0, sortOrder: 1 }, { accountCode: 'A008', accountName: 'PPE', debit: 0, credit: 7150000, sortOrder: 2 }] } },
  })
  console.log('  4 JournalEntry records with lines')

  // ── 13. PETTY CASH ────────────────────────────────────────────
  await prisma.pettyCashTransaction.createMany({
    data: [
      { reportId: report.id, date: '2024-07-01', description: 'Petty cash float advance', voucherNo: 'PC-001', receipt: 500000, payment: 0, balance: 500000, category: 'advance' },
      { reportId: report.id, date: '2024-07-15', description: 'Office tea and sugar', voucherNo: 'PC-002', receipt: 0, payment: 45000, balance: 455000, category: 'consumables' },
      { reportId: report.id, date: '2024-08-01', description: 'Taxi hire for field visit', voucherNo: 'PC-003', receipt: 0, payment: 80000, balance: 375000, category: 'transport' },
      { reportId: report.id, date: '2024-08-15', description: 'Emergency stationery', voucherNo: 'PC-004', receipt: 0, payment: 65000, balance: 310000, category: 'stationery' },
      { reportId: report.id, date: '2024-09-01', description: 'Petty cash top-up', voucherNo: 'PC-005', receipt: 200000, payment: 0, balance: 510000, category: 'advance' },
      { reportId: report.id, date: '2024-09-20', description: 'Courier charges', voucherNo: 'PC-006', receipt: 0, payment: 25000, balance: 485000, category: 'postage' },
    ],
  })
  console.log('  6 PettyCashTransaction records')

  // ── 14. IMPREST ───────────────────────────────────────────────
  await prisma.imprest.createMany({
    data: [
      { reportId: report.id, imprestNo: 'IMP-001', holderName: 'John B. Ochieng', purpose: 'Field visit for revenue assessment', amountIssued: 2500000, amountSurrendered: 2350000, balance: 150000, issueDate: '2024-10-01', dueDate: '2024-10-31', surrenderDate: '2024-10-28', status: 'partially_surrendered' },
      { reportId: report.id, imprestNo: 'IMP-002', holderName: 'Mary K. Nabirye', purpose: 'Census data collection travel', amountIssued: 1800000, amountSurrendered: 0, balance: 1800000, issueDate: '2025-03-01', dueDate: '2025-04-15', surrenderDate: '', status: 'outstanding' },
      { reportId: report.id, imprestNo: 'IMP-003', holderName: 'Robert S. Opio', purpose: 'Workshop facilitation', amountIssued: 900000, amountSurrendered: 900000, balance: 0, issueDate: '2024-08-15', dueDate: '2024-09-15', surrenderDate: '2024-09-10', status: 'fully_surrendered' },
    ],
  })
  console.log('  3 Imprest records')

  // ── 15. CASHBOOK ──────────────────────────────────────────────
  await prisma.cashbookOpeningBalance.createMany({
    data: [
      { reportId: report.id, bankAccount: 'main', amount: 89200000, asOfDate: '2024-07-01' },
      { reportId: report.id, bankAccount: 'development', amount: 42000000, asOfDate: '2024-07-01' },
    ],
  })
  await prisma.cashbookEntry.createMany({
    data: [
      { reportId: report.id, date: '2024-07-15', description: 'Tax revenue collection - July', reference: 'REV-JUL-001', receipt: 10400000, payment: 0, balance: 99600000, accountCode: 'R001', bankAccount: 'main' },
      { reportId: report.id, date: '2024-08-31', description: 'Salary payments - August', reference: 'PAY-AUG-001', receipt: 0, payment: 23750000, balance: 75850000, accountCode: 'E001', bankAccount: 'main' },
      { reportId: report.id, date: '2024-09-15', description: 'Tax revenue - September', reference: 'REV-SEP-001', receipt: 31250000, payment: 0, balance: 107100000, accountCode: 'R001', bankAccount: 'main' },
      { reportId: report.id, date: '2024-10-01', description: 'UCF transfer Q2', reference: 'UCF-Q2-001', receipt: 80000000, payment: 0, balance: 187100000, accountCode: 'R003', bankAccount: 'main' },
      { reportId: report.id, date: '2024-10-15', description: 'Goods and services procurement', reference: 'PO-OCT-001', receipt: 0, payment: 11800000, balance: 175300000, accountCode: 'E002', bankAccount: 'main' },
      { reportId: report.id, date: '2024-11-01', description: 'Students fee collection', reference: 'FEE-NOV-001', receipt: 8900000, payment: 0, balance: 184200000, accountCode: 'R007', bankAccount: 'main' },
      { reportId: report.id, date: '2024-12-15', description: 'Creditor payments Q2', reference: 'PAY-DEC-001', receipt: 0, payment: 15600000, balance: 168600000, accountCode: 'L001', bankAccount: 'main' },
      { reportId: report.id, date: '2025-01-15', description: 'Grant disbursement received', reference: 'GR-JAN-001', receipt: 12000000, payment: 0, balance: 54000000, accountCode: 'R002', bankAccount: 'development' },
    ],
  })
  console.log('  2 CashbookOpeningBalance + 8 CashbookEntry records')

  // ── 16. BANK RECONCILIATION ───────────────────────────────────
  await prisma.bankReconciliation.create({
    data: { reportId: report.id, bankAccount: 'main', periodEnd: '2025-06-30', balancePerBooks: 89200000, balancePerBank: 87500000, outstandingDeposits: 3200000, outstandingCheques: 1800000, bankCharges: 150000, bankInterest: 450000, otherAdjustments: 0, adjustedBalance: 89200000, status: 'reconciled' },
  })
  console.log('  1 BankReconciliation record')

  // ── 17. LEDGER ACCOUNTS with transactions ────────────────────
  await prisma.ledgerAccount.create({
    data: { reportId: report.id, accountCode: 'A001', accountName: 'Cash and Cash Equivalents', accountType: 'asset', openingDebit: 76500000, openingCredit: 0, totalDebit: 121650000, totalCredit: 35550000, closingDebit: 89200000, closingCredit: 0, transactions: { create: [
      { date: '2024-07-15', narration: 'Tax revenue - July', reference: 'REV-JUL-001', debit: 10400000, credit: 0, balance: 86900000 },
      { date: '2024-08-31', narration: 'Salary payments - August', reference: 'PAY-AUG-001', debit: 0, credit: 23750000, balance: 63150000 },
      { date: '2024-09-15', narration: 'Tax revenue - September', reference: 'REV-SEP-001', debit: 31250000, credit: 0, balance: 94400000 },
      { date: '2024-10-01', narration: 'UCF transfer Q2', reference: 'UCF-Q2-001', debit: 80000000, credit: 0, balance: 174400000 },
      { date: '2024-10-15', narration: 'Goods procurement', reference: 'PO-OCT-001', debit: 0, credit: 11800000, balance: 162600000 },
    ] } },
  })
  await prisma.ledgerAccount.create({
    data: { reportId: report.id, accountCode: 'E001', accountName: 'Compensation of Employees', accountType: 'expense', openingDebit: 0, openingCredit: 0, totalDebit: 285000000, totalCredit: 0, closingDebit: 285000000, closingCredit: 0, transactions: { create: [
      { date: '2024-07-31', narration: 'Salary payments - July', reference: 'PAY-JUL-001', debit: 23750000, credit: 0, balance: 23750000 },
      { date: '2024-08-31', narration: 'Salary payments - August', reference: 'PAY-AUG-001', debit: 23750000, credit: 0, balance: 47500000 },
      { date: '2024-09-30', narration: 'Salary payments - September', reference: 'PAY-SEP-2024', debit: 23750000, credit: 0, balance: 71250000 },
    ] } },
  })
  await prisma.ledgerAccount.create({
    data: { reportId: report.id, accountCode: 'R001', accountName: 'Taxes', accountType: 'revenue', openingDebit: 0, openingCredit: 0, totalDebit: 0, totalCredit: 125000000, closingDebit: 0, closingCredit: 125000000, transactions: { create: [
      { date: '2024-07-15', narration: 'Tax revenue - July', reference: 'REV-JUL-001', debit: 0, credit: 10400000, balance: 10400000 },
      { date: '2024-09-15', narration: 'Tax revenue - September', reference: 'REV-SEP-001', debit: 0, credit: 31250000, balance: 41650000 },
    ] } },
  })
  console.log('  3 LedgerAccount records with transactions')

  // ── 18. PAYROLL ───────────────────────────────────────────────
  await prisma.payrollEntry.createMany({
    data: [
      { reportId: report.id, employeeName: 'Ochieng James', employeeNumber: 'EMP-001', department: 'Finance', payPeriod: '2024-07', grossPay: 2850000, payeTax: 427500, pensionEmployee: 142500, pensionEmployer: 142500, nssf: 85500, otherDeductions: 0, netPay: 2194500, bankAccount: 'STEO0001' },
      { reportId: report.id, employeeName: 'Achieng Sarah', employeeNumber: 'EMP-002', department: 'Finance', payPeriod: '2024-07', grossPay: 2650000, payeTax: 397500, pensionEmployee: 132500, pensionEmployer: 132500, nssf: 79500, otherDeductions: 50000, netPay: 1990000, bankAccount: 'STEO0002' },
      { reportId: report.id, employeeName: 'Mukasa Peter', employeeNumber: 'EMP-003', department: 'Internal Audit', payPeriod: '2024-07', grossPay: 2400000, payeTax: 360000, pensionEmployee: 120000, pensionEmployer: 120000, nssf: 72000, otherDeductions: 0, netPay: 1848000, bankAccount: 'STEO0003' },
      { reportId: report.id, employeeName: 'Nabirye Grace', employeeNumber: 'EMP-004', department: 'Revenue', payPeriod: '2024-07', grossPay: 1950000, payeTax: 292500, pensionEmployee: 97500, pensionEmployer: 97500, nssf: 58500, otherDeductions: 0, netPay: 1501500, bankAccount: 'STEO0004' },
      { reportId: report.id, employeeName: 'Opio David', employeeNumber: 'EMP-005', department: 'Administration', payPeriod: '2024-07', grossPay: 2100000, payeTax: 315000, pensionEmployee: 105000, pensionEmployer: 105000, nssf: 63000, otherDeductions: 30000, netPay: 1587000, bankAccount: 'STEO0005' },
    ],
  })
  console.log('  5 PayrollEntry records')

  // ── 19. TAX ENTRIES ───────────────────────────────────────────
  await prisma.taxEntry.createMany({
    data: [
      { reportId: report.id, taxType: 'PAYE', taxPeriod: '2024-25', collected: 45800000, remitted: 45200000, balance: 600000, dueDate: '2025-07-15', remittanceDate: '2025-07-10', status: 'partially_remitted' },
      { reportId: report.id, taxType: 'NSSF', taxPeriod: '2024-25', collected: 28500000, remitted: 28500000, balance: 0, dueDate: '2025-07-15', remittanceDate: '2025-07-12', status: 'fully_remitted' },
      { reportId: report.id, taxType: 'WHT', taxPeriod: '2024-25', collected: 8200000, remitted: 7800000, balance: 400000, dueDate: '2025-07-15', remittanceDate: '', status: 'pending' },
      { reportId: report.id, taxType: 'LST', taxPeriod: '2024-25', collected: 12600000, remitted: 12600000, balance: 0, dueDate: '2025-07-15', remittanceDate: '2025-07-10', status: 'fully_remitted' },
    ],
  })
  console.log('  4 TaxEntry records')

  // ── 20. GRANT ENTRIES ─────────────────────────────────────────
  await prisma.grantEntry.createMany({
    data: [
      { reportId: report.id, grantName: 'DANIDA Governance Support', donor: 'Danida', grantType: 'development', totalAmount: 35000000, drawnDown: 8000000, expended: 7500000, balance: 27500000, conditions: 'Quarterly progress reports required', startDate: '2024-07-01', endDate: '2026-09-30', status: 'active' },
      { reportId: report.id, grantName: 'World Bank LGMDP', donor: 'World Bank', grantType: 'development', totalAmount: 120000000, drawnDown: 45200000, expended: 42800000, balance: 77200000, conditions: 'Performance-based disbursements', startDate: '2023-08-01', endDate: '2027-12-31', status: 'active' },
      { reportId: report.id, grantName: 'GAVI Immunisation', donor: 'GAVI Alliance', grantType: 'development', totalAmount: 15000000, drawnDown: 15000000, expended: 14800000, balance: 200000, conditions: 'Health sector only', startDate: '2022-07-01', endDate: '2024-06-30', status: 'closing' },
    ],
  })
  console.log('  3 GrantEntry records')

  // ── 21. DEBT ENTRIES ──────────────────────────────────────────
  await prisma.debtEntry.createMany({
    data: [
      { reportId: report.id, lender: 'World Bank', loanType: 'external', principalAmount: 85000000, interestRate: 1.5, outstandingPrincipal: 78500000, totalServiceCost: 5400000, repaymentsMade: 6500000, balance: 78500000, disbursementDate: '2019-06-15', maturityDate: '2039-06-15', status: 'active' },
      { reportId: report.id, lender: 'AfDB', loanType: 'external', principalAmount: 40000000, interestRate: 2.0, outstandingPrincipal: 35000000, totalServiceCost: 2800000, repaymentsMade: 5000000, balance: 35000000, disbursementDate: '2020-09-01', maturityDate: '2041-09-01', status: 'active' },
      { reportId: report.id, lender: 'Uganda Treasury', loanType: 'domestic', principalAmount: 15600000, interestRate: 10.0, outstandingPrincipal: 15600000, totalServiceCost: 1560000, repaymentsMade: 0, balance: 15600000, disbursementDate: '2021-01-15', maturityDate: '2025-01-15', status: 'active' },
    ],
  })
  console.log('  3 DebtEntry records')

  // ── 22. CHEQUE ENTRIES ────────────────────────────────────────
  await prisma.chequeEntry.createMany({
    data: [
      { reportId: report.id, chequeNumber: 'CH-000001', payee: 'Various employees', amount: 23750000, voteCode: '101', issueDate: '2024-07-31', bankAccount: 'main', status: 'presented', presentedDate: '2024-08-02', cancelledReason: '' },
      { reportId: report.id, chequeNumber: 'CH-000002', payee: 'Uganda Printing Co.', amount: 3500000, voteCode: '102', issueDate: '2024-08-15', bankAccount: 'main', status: 'presented', presentedDate: '2024-08-18', cancelledReason: '' },
      { reportId: report.id, chequeNumber: 'CH-000003', payee: 'Madera Construction Ltd', amount: 12500000, voteCode: '401', issueDate: '2024-10-01', bankAccount: 'main', status: 'presented', presentedDate: '2024-10-04', cancelledReason: '' },
      { reportId: report.id, chequeNumber: 'CH-000004', payee: 'Clean Water Services', amount: 3500000, voteCode: '102', issueDate: '2025-05-15', bankAccount: 'main', status: 'issued', presentedDate: '', cancelledReason: '' },
      { reportId: report.id, chequeNumber: 'CH-000005', payee: 'Duplicate-voided', amount: 0, voteCode: '102', issueDate: '2024-11-20', bankAccount: 'main', status: 'cancelled', presentedDate: '', cancelledReason: 'Duplicate payment identified' },
    ],
  })
  console.log('  5 ChequeEntry records')

  // ── 23. SUSPENSE ACCOUNTS ─────────────────────────────────────
  await prisma.suspenseAccount.createMany({
    data: [
      { reportId: report.id, description: 'Unidentified bank deposit', debitAmount: 850000, creditAmount: 0, balance: 850000, date: '2024-07-15', reason: 'No supporting documentation', resolution: 'Revenue officer identified source', resolutionDate: '2024-08-02', status: 'resolved' },
      { reportId: report.id, description: 'Exchange rate difference', debitAmount: 120000, creditAmount: 0, balance: 120000, date: '2024-10-01', reason: 'Pending bank confirmation', resolution: '', resolutionDate: '', status: 'open' },
      { reportId: report.id, description: 'WHT overpayment', debitAmount: 0, creditAmount: 320000, balance: -320000, date: '2025-03-01', reason: 'Excess WHT remittance', resolution: 'Refund processed', resolutionDate: '2025-04-15', status: 'resolved' },
    ],
  })
  console.log('  3 SuspenseAccount records')

  // ── 24. REVENUE ENTRIES ───────────────────────────────────────
  await prisma.revenueEntry.createMany({
    data: [
      { reportId: report.id, date: '2024-07-15', revenueType: 'tax', accountCode: 'R001', description: 'Property rates collection', amount: 10400000, taxComponent: 0, netAmount: 10400000, collectedBy: 'J. Ochieng', receiptNumber: 'RCP-001', status: 'recorded' },
      { reportId: report.id, date: '2024-09-15', revenueType: 'tax', accountCode: 'R001', description: 'Trading licence fees', amount: 31250000, taxComponent: 0, netAmount: 31250000, collectedBy: 'Revenue Team', receiptNumber: 'RCP-002', status: 'recorded' },
      { reportId: report.id, date: '2024-10-01', revenueType: 'transfer', accountCode: 'R003', description: 'UCF quarterly transfer Q2', amount: 80000000, taxComponent: 0, netAmount: 80000000, collectedBy: 'Treasury', receiptNumber: 'RCP-003', status: 'recorded' },
      { reportId: report.id, date: '2024-11-01', revenueType: 'fees', accountCode: 'R007', description: 'Market fees collection', amount: 8900000, taxComponent: 0, netAmount: 8900000, collectedBy: 'G. Nabirye', receiptNumber: 'RCP-004', status: 'recorded' },
      { reportId: report.id, date: '2025-01-10', revenueType: 'grant', accountCode: 'R002', description: 'DANIDA Q3 disbursement', amount: 12000000, taxComponent: 0, netAmount: 12000000, collectedBy: 'Donor', receiptNumber: 'RCP-005', status: 'recorded' },
    ],
  })
  console.log('  5 RevenueEntry records')

  // ── 25. EXPENDITURE ENTRIES ───────────────────────────────────
  await prisma.expenditureEntry.createMany({
    data: [
      { reportId: report.id, date: '2024-07-31', expenditureType: 'compensation', accountCode: 'E001', voteCode: '101', description: 'Salary payments July', amount: 23750000, supplier: 'Various', invoiceNumber: 'INV-PAY-07', paymentRef: 'CH-000001', status: 'recorded' },
      { reportId: report.id, date: '2024-08-15', expenditureType: 'goods_services', accountCode: 'E002', voteCode: '102', description: 'Office supplies', amount: 3500000, supplier: 'Uganda Printing Co.', invoiceNumber: 'INV-UPC-001', paymentRef: 'CH-000002', status: 'recorded' },
      { reportId: report.id, date: '2024-10-01', expenditureType: 'capital', accountCode: 'E006', voteCode: '401', description: 'Road rehabilitation works', amount: 12500000, supplier: 'Madera Construction Ltd', invoiceNumber: 'INV-MCL-001', paymentRef: 'CH-000003', status: 'recorded' },
      { reportId: report.id, date: '2024-12-31', expenditureType: 'grants_transfers', accountCode: 'E006', voteCode: '201', description: 'Sub-count transfer Q2', amount: 9675000, supplier: 'Central Sub-count', invoiceNumber: 'TR-SC-001', paymentRef: 'EFT-001', status: 'recorded' },
      { reportId: report.id, date: '2025-03-15', expenditureType: 'social_benefits', accountCode: 'E007', voteCode: '301', description: 'Elderly support payments', amount: 5700000, supplier: 'Various beneficiaries', invoiceNumber: 'SB-004-001', paymentRef: 'EFT-002', status: 'recorded' },
    ],
  })
  console.log('  5 ExpenditureEntry records')

  // ── 26. APPROPRIATION ACCOUNTS ────────────────────────────────
  await prisma.appropriationAccount.createMany({
    data: [
      { reportId: report.id, voteCode: '101', voteName: 'Compensation of Employees', initialAppropriation: 295000000, supplementaryAppropriation: 0, virementIn: 0, virementOut: 1500000, revisedAppropriation: 293500000, actualExpenditure: 285000000, savingsOverSpent: 8500000, status: 'partial' },
      { reportId: report.id, voteCode: '102', voteName: 'Goods and Services', initialAppropriation: 150000000, supplementaryAppropriation: 0, virementIn: 2000000, virementOut: 0, revisedAppropriation: 152000000, actualExpenditure: 142500000, savingsOverSpent: 9500000, status: 'partial' },
      { reportId: report.id, voteCode: '401', voteName: 'Capital Development', initialAppropriation: 50000000, supplementaryAppropriation: 5000000, virementIn: 3000000, virementOut: 0, revisedAppropriation: 58000000, actualExpenditure: 48600000, savingsOverSpent: 9400000, status: 'partial' },
      { reportId: report.id, voteCode: '501', voteName: 'Finance Costs', initialAppropriation: 6000000, supplementaryAppropriation: 0, virementIn: 0, virementOut: 0, revisedAppropriation: 6000000, actualExpenditure: 5400000, savingsOverSpent: 600000, status: 'partial' },
      { reportId: report.id, voteCode: '301', voteName: 'Social Benefits', initialAppropriation: 24000000, supplementaryAppropriation: 0, virementIn: 2000000, virementOut: 0, revisedAppropriation: 26000000, actualExpenditure: 22800000, savingsOverSpent: 3200000, status: 'partial' },
    ],
  })
  console.log('  5 AppropriationAccount records')

  // ── 27. INTER-FUND TRANSFERS ──────────────────────────────────
  await prisma.interFundTransfer.createMany({
    data: [
      { reportId: report.id, fromFund: 'Consolidated Fund', toFund: 'Development Fund', amount: 8500000, description: 'Capital project co-financing', authBy: 'CFO', transferDate: '2024-10-01', status: 'approved' },
      { reportId: report.id, fromFund: 'Special Revenue Fund', toFund: 'Consolidated Fund', amount: 5200000, description: 'Grant reallocation', authBy: 'Accounting Officer', transferDate: '2025-03-15', status: 'approved' },
    ],
  })
  console.log('  2 InterFundTransfer records')

  // ── 28. ASSET REGISTER ────────────────────────────────────────
  await prisma.assetRegister.createMany({
    data: [
      { reportId: report.id, assetNumber: 'AST-001', description: 'LG Headquarters Building', category: 'ppe', location: 'Madera Town', dateAcquired: '2015-07-01', acquisitionCost: 95000000, accumulatedDep: 75000000, netBookValue: 20000000, depreciationRate: 5, usefulLife: 40, status: 'active' },
      { reportId: report.id, assetNumber: 'AST-002', description: 'Office Furniture', category: 'ppe', location: 'HQ & Sub-county offices', dateAcquired: '2020-07-01', acquisitionCost: 12000000, accumulatedDep: 6000000, netBookValue: 6000000, depreciationRate: 10, usefulLife: 10, status: 'active' },
      { reportId: report.id, assetNumber: 'AST-003', description: 'Motor Vehicles', category: 'ppe', location: 'Fleet pool', dateAcquired: '2022-01-15', acquisitionCost: 45000000, accumulatedDep: 22500000, netBookValue: 22500000, depreciationRate: 20, usefulLife: 5, status: 'active' },
      { reportId: report.id, assetNumber: 'AST-004', description: 'Road Network', category: 'infra', location: 'Madera District', dateAcquired: '2018-06-30', acquisitionCost: 33000000, accumulatedDep: 0, netBookValue: 33000000, depreciationRate: 0, usefulLife: 50, status: 'active' },
      { reportId: report.id, assetNumber: 'AST-005', description: 'Old Office Generator', category: 'ppe', location: 'HQ', dateAcquired: '2012-07-01', acquisitionCost: 8500000, accumulatedDep: 8500000, netBookValue: 0, depreciationRate: 10, usefulLife: 10, disposalDate: '2024-12-31', disposalValue: 500000, status: 'disposed' },
    ],
  })
  console.log('  5 AssetRegister records')

  // ── 29. INVENTORY ─────────────────────────────────────────────
  await prisma.inventoryItem.createMany({
    data: [
      { reportId: report.id, itemCode: 'INV-001', itemDescription: 'A4 Paper (Ream)', unitOfMeasure: 'Ream', unitCost: 25000, openingQty: 200, openingValue: 5000000, receivedQty: 350, receivedValue: 8750000, issuedQty: 400, issuedValue: 10000000, closingQty: 150, closingValue: 3000000 },
      { reportId: report.id, itemCode: 'INV-002', itemDescription: 'Printer Toner', unitOfMeasure: 'Piece', unitCost: 85000, openingQty: 50, openingValue: 4250000, receivedQty: 80, receivedValue: 6800000, issuedQty: 100, issuedValue: 8500000, closingQty: 30, closingValue: 2550000 },
      { reportId: report.id, itemCode: 'INV-003', itemDescription: 'Office Files', unitOfMeasure: 'Box', unitCost: 15000, openingQty: 300, openingValue: 4500000, receivedQty: 200, receivedValue: 3000000, issuedQty: 350, issuedValue: 5250000, closingQty: 150, closingValue: 2250000 },
    ],
  })
  console.log('  3 InventoryItem records')

  // ── 30. DEBTORS ───────────────────────────────────────────────
  await prisma.debtorAccount.createMany({
    data: [
      { reportId: report.id, name: 'Ministry of Education', accountCode: 'A003', invoiceNumber: 'INV-MoE-001', invoiceAmount: 8500000, amountPaid: 6000000, balance: 2500000, invoiceDate: '2024-10-01', dueDate: '2025-01-01', agingDays: 45, status: 'outstanding' },
      { reportId: report.id, name: 'Uganda Revenue Authority', accountCode: 'A003', invoiceNumber: 'INV-URA-001', invoiceAmount: 5000000, amountPaid: 2000000, balance: 3000000, invoiceDate: '2025-01-15', dueDate: '2025-04-15', agingDays: 30, status: 'outstanding' },
      { reportId: report.id, name: 'M/s ABC Supplies Ltd', accountCode: 'A003', invoiceNumber: 'INV-ABC-001', invoiceAmount: 12000000, amountPaid: 12000000, balance: 0, invoiceDate: '2024-08-01', dueDate: '2024-10-01', agingDays: 0, status: 'fully_paid' },
      { reportId: report.id, name: 'Health Development Partners', accountCode: 'A003', invoiceNumber: 'INV-HDP-001', invoiceAmount: 3800000, amountPaid: 0, balance: 3800000, invoiceDate: '2025-05-01', dueDate: '2025-08-01', agingDays: 90, status: 'overdue' },
    ],
  })
  console.log('  4 DebtorAccount records')

  // ── 31. CREDITORS ─────────────────────────────────────────────
  await prisma.creditorAccount.createMany({
    data: [
      { reportId: report.id, name: 'Uganda Printing Co.', accountCode: 'L001', invoiceNumber: 'INV-UPC-001', invoiceAmount: 3500000, amountPaid: 3000000, balance: 500000, invoiceDate: '2024-08-01', dueDate: '2024-11-01', agingDays: 60, status: 'outstanding' },
      { reportId: report.id, name: 'Madera Construction Ltd', accountCode: 'L001', invoiceNumber: 'INV-MCL-001', invoiceAmount: 25000000, amountPaid: 18500000, balance: 6500000, invoiceDate: '2024-09-15', dueDate: '2025-03-15', agingDays: 120, status: 'outstanding' },
      { reportId: report.id, name: 'Tech Solutions Ltd', accountCode: 'L001', invoiceNumber: 'INV-TSL-001', invoiceAmount: 5000000, amountPaid: 0, balance: 5000000, invoiceDate: '2025-01-10', dueDate: '2025-07-10', agingDays: 150, status: 'overdue' },
      { reportId: report.id, name: 'Clean Water Services', accountCode: 'L001', invoiceNumber: 'INV-CWS-001', invoiceAmount: 3500000, amountPaid: 3500000, balance: 0, invoiceDate: '2024-07-01', dueDate: '2024-10-01', agingDays: 0, status: 'fully_paid' },
    ],
  })
  console.log('  4 CreditorAccount records')

  // ── 32. CLOSING ENTRIES ───────────────────────────────────────
  await prisma.closingEntry.createMany({
    data: [
      { reportId: report.id, entryDate: '2025-06-30', narration: 'Close revenue accounts to SFP', accountCode: 'R001', accountName: 'Taxes', debit: 125000000, credit: 0, entryType: 'closing', posted: false },
      { reportId: report.id, entryDate: '2025-06-30', narration: 'Close expense accounts to SFP', accountCode: 'E001', accountName: 'Compensation of Employees', debit: 0, credit: 285000000, entryType: 'closing', posted: false },
      { reportId: report.id, entryDate: '2025-06-30', narration: 'Close expense accounts to SFP', accountCode: 'E002', accountName: 'Goods and Services Consumed', debit: 0, credit: 142500000, entryType: 'closing', posted: false },
      { reportId: report.id, entryDate: '2025-06-30', narration: 'Surplus to net assets', accountCode: 'NA01', accountName: 'Net Assets', debit: 46640000, credit: 0, entryType: 'closing', posted: false },
    ],
  })
  console.log('  4 ClosingEntry records')

  // ── 33. YEAR-END CHECKLIST ────────────────────────────────────
  const yecItems = [
    { task: 'Complete all journal entries', category: 'pre_close', isCompleted: true, completedBy: 'Sarah N. Achieng', completedAt: new Date('2025-06-15'), notes: 'All entries posted' },
    { task: 'Reconcile bank accounts', category: 'pre_close', isCompleted: true, completedBy: 'Sarah N. Achieng', completedAt: new Date('2025-06-20'), notes: 'All banks reconciled' },
    { task: 'Reconcile inter-fund transfers', category: 'pre_close', isCompleted: true, completedBy: 'Sarah N. Achieng', completedAt: new Date('2025-06-20'), notes: '' },
    { task: 'Verify asset register', category: 'pre_close', isCompleted: false, completedBy: '', notes: '' },
    { task: 'Verify inventory counts', category: 'pre_close', isCompleted: false, completedBy: '', notes: '' },
    { task: 'Post depreciation', category: 'adjustments', isCompleted: true, completedBy: 'Sarah N. Achieng', completedAt: new Date('2025-06-25'), notes: 'Straight-line method applied' },
    { task: 'Post impairment review', category: 'adjustments', isCompleted: true, completedBy: 'Peter O. Mukasa', completedAt: new Date('2025-06-25'), notes: '' },
    { task: 'Accrue outstanding expenses', category: 'adjustments', isCompleted: false, completedBy: '', notes: '' },
    { task: 'Calculate pension liability', category: 'adjustments', isCompleted: false, completedBy: '', notes: '' },
    { task: 'Prepare closing entries', category: 'closing', isCompleted: false, completedBy: '', notes: '' },
    { task: 'Post closing entries', category: 'closing', isCompleted: false, completedBy: '', notes: '' },
    { task: 'Verify trial balance after closing', category: 'closing', isCompleted: false, completedBy: '', notes: '' },
    { task: 'Prepare financial statements', category: 'reporting', isCompleted: false, completedBy: '', notes: '' },
    { task: 'Compliance check (IPSAS)', category: 'reporting', isCompleted: false, completedBy: '', notes: '' },
    { task: 'Submit for approval', category: 'reporting', isCompleted: false, completedBy: '', notes: '' },
  ]
  await prisma.yearEndChecklist.createMany({
    data: yecItems.map((y, i) => ({ reportId: report.id, ...y, sortOrder: i + 1 })),
  })
  console.log('  15 YearEndChecklist records')

  // ── 34. NOTIFICATIONS ─────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { reportId: report.id, title: 'Report Ready for Review', message: 'FY 2024-25 financial statement has been prepared and is ready for review.', type: 'info', isRead: false },
      { reportId: report.id, title: 'Commitment Expiring', message: 'PO-2024-004 (ICT upgrade) commitment will expire in 30 days.', type: 'warning', isRead: false },
      { reportId: report.id, title: 'Budget Variance Alert', message: 'Vote 301 (Social Benefits) has exceeded 85% of appropriation.', type: 'warning', isRead: true },
    ],
  })
  console.log('  3 Notification records')

  // ── 35. AUDIT LOG ─────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { reportId: report.id, action: 'create', field: 'report', oldValue: '', newValue: 'Created FY 2024-25 report', userId: admin.id },
      { reportId: report.id, action: 'update', field: 'trialBalance', oldValue: '', newValue: '37 entries loaded', userId: accountant.id },
      { reportId: report.id, action: 'update', field: 'supplementary', oldValue: '', newValue: 'Supplementary data populated', userId: accountant.id },
      { reportId: report.id, action: 'update', field: 'approval', oldValue: 'draft', newValue: 'review', userId: accountant.id },
    ],
  })
  console.log('  4 AuditLog records')

  // ── 36. SET REPORT STATUS ─────────────────────────────────────
  await prisma.financialReport.update({
    where: { id: report.id },
    data: { status: 'complete' },
  })

  console.log('\nSeed complete! Madera LG FY 2024-25 financial statement ready.')
  console.log(`Report ID: ${report.id}`)
  console.log('\nSummary of seeded data:')
  console.log('  - 3 Users (admin, accountant, viewer)')
  console.log('  - 1 FinancialReport (Madera LG FY 2024-25)')
  console.log('  - 37 TrialBalanceEntry records')
  console.log('  - 1 SupplementaryData')
  console.log('  - 1 ApprovalWorkflow (at review step)')
  console.log('  - 3 Funds (Consolidated, Development, Special Revenue)')
  console.log('  - 7 VotebookEntry records')
  console.log('  - 4 Warrant records')
  console.log('  - 3 Virement records')
  console.log('  - 5 Commitment records')
  console.log('  - 4 ProcurementPlan records')
  console.log('  - 4 JournalEntry records with lines')
  console.log('  - 6 PettyCashTransaction records')
  console.log('  - 3 Imprest records')
  console.log('  - 2 CashbookOpeningBalance + 8 CashbookEntry records')
  console.log('  - 1 BankReconciliation')
  console.log('  - 3 LedgerAccount records with transactions')
  console.log('  - 5 PayrollEntry records')
  console.log('  - 4 TaxEntry records')
  console.log('  - 3 GrantEntry records')
  console.log('  - 3 DebtEntry records')
  console.log('  - 5 ChequeEntry records')
  console.log('  - 3 SuspenseAccount records')
  console.log('  - 5 RevenueEntry records')
  console.log('  - 5 ExpenditureEntry records')
  console.log('  - 5 AppropriationAccount records')
  console.log('  - 2 InterFundTransfer records')
  console.log('  - 5 AssetRegister records')
  console.log('  - 3 InventoryItem records')
  console.log('  - 4 DebtorAccount records')
  console.log('  - 4 CreditorAccount records')
  console.log('  - 4 ClosingEntry records')
  console.log('  - 15 YearEndChecklist records')
  console.log('  - 3 Notification records')
  console.log('  - 4 AuditLog records')
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
