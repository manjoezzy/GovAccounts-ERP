import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Madera Government Financial Statement FY 2024-25...')

  // ── Clean existing data ──────────────────────────────────────
  await prisma.ledgerTransaction.deleteMany()
  await prisma.ledgerAccount.deleteMany()
  await prisma.journalLine.deleteMany()
  await prisma.journalEntry.deleteMany()
  await prisma.cashbookEntry.deleteMany()
  await prisma.cashbookOpeningBalance.deleteMany()
  await prisma.votebookEntry.deleteMany()
  await prisma.fund.deleteMany()
  await prisma.supplementaryData.deleteMany()
  await prisma.trialBalanceEntry.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.financialReport.deleteMany()

  // ════════════════════════════════════════════════════════════
  // 1. FINANCIAL REPORT
  // ════════════════════════════════════════════════════════════
  const report = await prisma.financialReport.create({
    data: {
      entityName: 'Madera Local Government',
      periodEnd: '2025-06-30',
      periodLabel: '30 June 2025',
      currency: 'Shs',
      status: 'draft', // will set to complete at end
      version: 1,
      versionLabel: 'Original',
      fiscalYear: '2024-25',
    },
  })
  console.log(`  ✓ FinancialReport created: ${report.id}`)

  // ════════════════════════════════════════════════════════════
  // 2. TRIAL BALANCE ENTRIES (37 entries)
  // ════════════════════════════════════════════════════════════

  // Revenue (Non-Exchange) — credit balances
  const revenueNonExchange = [
    { accountCode: 'R001', accountName: 'Taxes', classification: 'revenue-non-exchange', category: 'taxes', noteRef: '2', creditCurrent: 125_000_000, creditPrior: 118_500_000, budgetInitial: 130_000_000, budgetAdjusted: 130_000_000 },
    { accountCode: 'R002', accountName: 'External Assistance', classification: 'revenue-non-exchange', category: 'external_assistance', noteRef: '3', creditCurrent: 45_200_000, creditPrior: 42_800_000, budgetInitial: 48_000_000, budgetAdjusted: 48_000_000 },
    { accountCode: 'R003', accountName: 'Transfers received from Treasury-UCF', classification: 'revenue-non-exchange', category: 'transfers_treasury_ucf', noteRef: '4', creditCurrent: 320_000_000, creditPrior: 305_000_000, budgetInitial: 330_000_000, budgetAdjusted: 330_000_000 },
    { accountCode: 'R004', accountName: 'Transfers from Contingencies Fund', classification: 'revenue-non-exchange', category: 'transfers_contingencies', noteRef: '5', creditCurrent: 8_500_000, creditPrior: 6_200_000, budgetInitial: 10_000_000, budgetAdjusted: 10_000_000 },
    { accountCode: 'R005', accountName: 'Transfers from other Government Units', classification: 'revenue-non-exchange', category: 'transfers_other_govt', noteRef: '6', creditCurrent: 15_300_000, creditPrior: 14_100_000, budgetInitial: 16_000_000, budgetAdjusted: 16_000_000 },
    { accountCode: 'R006', accountName: 'Non-Tax revenue-Exchange Transaction', classification: 'revenue-non-exchange', category: 'non_tax_exchange', noteRef: '7', creditCurrent: 22_700_000, creditPrior: 20_500_000, budgetInitial: 24_000_000, budgetAdjusted: 24_000_000 },
    { accountCode: 'R008', accountName: 'Revenue in Kind', classification: 'revenue-non-exchange', category: 'revenue_in_kind', noteRef: '8(b)', creditCurrent: 3_200_000, creditPrior: 2_800_000, budgetInitial: 3_500_000, budgetAdjusted: 3_500_000 },
  ]

  // Revenue (Exchange) — credit balances
  const revenueExchange = [
    { accountCode: 'R007', accountName: 'Students Fees / Exchange Revenue', classification: 'revenue-exchange', category: 'sub_exchange', noteRef: '8', creditCurrent: 35_600_000, creditPrior: 32_400_000, budgetInitial: 38_000_000, budgetAdjusted: 38_000_000 },
    { accountCode: 'R009', accountName: 'Non-Tax Revenue-Exchange', classification: 'revenue-exchange', category: 'non_tax_revenue_exchange', noteRef: '7(b)', creditCurrent: 18_400_000, creditPrior: 16_800_000, budgetInitial: 20_000_000, budgetAdjusted: 20_000_000 },
  ]

  // Expenses — debit balances
  const expenses = [
    { accountCode: 'E001', accountName: 'Compensation of Employees', classification: 'expense', category: 'compensation', noteRef: '9', debitCurrent: 285_000_000, debitPrior: 268_000_000, budgetInitial: 295_000_000, budgetAdjusted: 295_000_000 },
    { accountCode: 'E002', accountName: 'Goods and Services Consumed', classification: 'expense', category: 'goods_services', noteRef: '10', debitCurrent: 142_500_000, debitPrior: 135_200_000, budgetInitial: 150_000_000, budgetAdjusted: 150_000_000 },
    { accountCode: 'E003', accountName: 'Depreciation Expense', classification: 'expense', category: 'depreciation', noteRef: '11', debitCurrent: 28_600_000, debitPrior: 26_400_000, budgetInitial: 0, budgetAdjusted: 0 },
    { accountCode: 'E004', accountName: 'Impairment of PPE', classification: 'expense', category: 'impairment', noteRef: '12', debitCurrent: 2_100_000, debitPrior: 1_800_000, budgetInitial: 0, budgetAdjusted: 0 },
    { accountCode: 'E005', accountName: 'Subsidies', classification: 'expense', category: 'subsidies', noteRef: '13', debitCurrent: 12_400_000, debitPrior: 11_200_000, budgetInitial: 13_000_000, budgetAdjusted: 13_000_000 },
    { accountCode: 'E006', accountName: 'Grants and Other Transfers', classification: 'expense', category: 'grants_transfers', noteRef: '14', debitCurrent: 38_700_000, debitPrior: 35_500_000, budgetInitial: 40_000_000, budgetAdjusted: 40_000_000 },
    { accountCode: 'E007', accountName: 'Social Benefits', classification: 'expense', category: 'social_benefits', noteRef: '15', debitCurrent: 22_800_000, debitPrior: 21_200_000, budgetInitial: 24_000_000, budgetAdjusted: 24_000_000 },
    { accountCode: 'E008', accountName: 'Finance Costs', classification: 'expense', category: 'finance_costs', noteRef: '16', debitCurrent: 5_400_000, debitPrior: 4_800_000, budgetInitial: 6_000_000, budgetAdjusted: 6_000_000 },
    { accountCode: 'E009', accountName: 'Bad Debts Expense', classification: 'expense', category: 'bad_debts', noteRef: '17', debitCurrent: 1_200_000, debitPrior: 900_000, budgetInitial: 0, budgetAdjusted: 0 },
    { accountCode: 'E010', accountName: 'Other Expenses', classification: 'expense', category: 'other_expenses', noteRef: '18', debitCurrent: 8_600_000, debitPrior: 7_400_000, budgetInitial: 9_000_000, budgetAdjusted: 9_000_000 },
  ]

  // Assets — debit balances
  const assets = [
    { accountCode: 'A001', accountName: 'Cash and Cash Equivalents', classification: 'asset', category: 'cash', noteRef: '21', debitCurrent: 89_200_000, debitPrior: 76_500_000 },
    { accountCode: 'A002', accountName: 'Prepayments and Advances (Current)', classification: 'asset', category: 'prepayments_current', noteRef: '22(a)', debitCurrent: 12_400_000, debitPrior: 10_800_000 },
    { accountCode: 'A003', accountName: 'Receivables (Current)', classification: 'asset', category: 'receivables_current', noteRef: '23(d)', debitCurrent: 28_600_000, debitPrior: 24_200_000 },
    { accountCode: 'A004', accountName: 'Inventories', classification: 'asset', category: 'inventories', noteRef: '24', debitCurrent: 8_500_000, debitPrior: 7_200_000 },
    { accountCode: 'A005', accountName: 'Prepayments and Advances (Non-Current)', classification: 'asset', category: 'prepayments_nc', noteRef: '22(b)', debitCurrent: 15_200_000, debitPrior: 13_800_000 },
    { accountCode: 'A006', accountName: 'Receivables (Non-Current)', classification: 'asset', category: 'receivables_nc', noteRef: '23(e)', debitCurrent: 6_800_000, debitPrior: 5_400_000 },
    { accountCode: 'A007', accountName: 'Investments', classification: 'asset', category: 'investments', noteRef: '25', debitCurrent: 42_000_000, debitPrior: 38_500_000 },
    { accountCode: 'A008', accountName: 'Property, Plant and Equipment', classification: 'asset', category: 'ppe', noteRef: '26(a)', debitCurrent: 185_000_000, debitPrior: 172_000_000 },
    { accountCode: 'A009', accountName: 'Investment Property', classification: 'asset', category: 'investment_property', noteRef: '26(b)', debitCurrent: 0, debitPrior: 0 },
    { accountCode: 'A010', accountName: 'Intangible Assets', classification: 'asset', category: 'intangible', noteRef: '26(c)', debitCurrent: 3_200_000, debitPrior: 3_600_000 },
    { accountCode: 'A011', accountName: 'Non-Produced Assets', classification: 'asset', category: 'non_produced', noteRef: '27', debitCurrent: 0, debitPrior: 0 },
  ]

  // Liabilities — credit balances
  const liabilities = [
    { accountCode: 'L001', accountName: 'Payables (Current)', classification: 'liability', category: 'payables_current', noteRef: '28(a)', creditCurrent: 32_400_000, creditPrior: 28_600_000 },
    { accountCode: 'L002', accountName: 'Deposits (Current)', classification: 'liability', category: 'deposits_current', noteRef: '29(a)', creditCurrent: 8_200_000, creditPrior: 7_400_000 },
    { accountCode: 'L003', accountName: 'Short-term Borrowings', classification: 'liability', category: 'short_borrowings', noteRef: '30(a)', creditCurrent: 15_600_000, creditPrior: 12_800_000 },
    { accountCode: 'L004', accountName: 'Pensions (Current)', classification: 'liability', category: 'pensions_current', noteRef: '31(a)', creditCurrent: 22_800_000, creditPrior: 20_200_000 },
    { accountCode: 'L005', accountName: 'Payables (Non-Current)', classification: 'liability', category: 'payables_nc', noteRef: '28(b)', creditCurrent: 18_400_000, creditPrior: 16_200_000 },
    { accountCode: 'L006', accountName: 'Deposits (Non-Current)', classification: 'liability', category: 'deposits_nc', noteRef: '29(b)', creditCurrent: 5_600_000, creditPrior: 4_800_000 },
    { accountCode: 'L007', accountName: 'Long-term Borrowings', classification: 'liability', category: 'long_borrowings', noteRef: '30(b)', creditCurrent: 45_000_000, creditPrior: 42_000_000 },
    { accountCode: 'L008', accountName: 'Pensions (Non-Current)', classification: 'liability', category: 'pensions_nc', noteRef: '31(b)', creditCurrent: 68_500_000, creditPrior: 62_400_000 },
  ]

  // Net Assets / Equity — credit balance (balancing figure)
  // Assets(390.9M) + Expenses(547.3M) = 938.2M total debits
  // Liabilities(216.5M) + Revenue(593.9M) = 810.4M total credits
  // Equity = 938.2M - 810.4M = 127.8M (current)
  // Prior: 864.4M - 753.5M = 110.9M
  const equity = [
    { accountCode: 'NA01', accountName: 'Accumulated Surplus / Net Assets', classification: 'equity', category: 'net_assets', noteRef: '32', creditCurrent: 127_800_000, creditPrior: 110_900_000 },
  ]

  // Merge all entries with defaults
  const allEntries = [
    ...revenueNonExchange,
    ...revenueExchange,
    ...expenses,
    ...assets,
    ...liabilities,
    ...equity,
  ].map((entry, index) => ({
    reportId: report.id,
    accountCode: entry.accountCode,
    accountName: entry.accountName,
    classification: entry.classification,
    category: entry.category || '',
    noteRef: entry.noteRef || '',
    debitCurrent: (entry as any).debitCurrent || 0,
    creditCurrent: (entry as any).creditCurrent || 0,
    debitPrior: (entry as any).debitPrior || 0,
    creditPrior: (entry as any).creditPrior || 0,
    budgetInitial: (entry as any).budgetInitial || 0,
    budgetAdjusted: (entry as any).budgetAdjusted || 0,
    sortOrder: index + 1,
  }))

  await prisma.trialBalanceEntry.createMany({ data: allEntries })
  console.log(`  ✓ ${allEntries.length} TrialBalanceEntry records created`)

  // ════════════════════════════════════════════════════════════
  // 3. SUPPLEMENTARY DATA
  // ════════════════════════════════════════════════════════════
  await prisma.supplementaryData.create({
    data: {
      reportId: report.id,
      // PPE Movements
      ppeOpeningCurrent: 172_000_000,
      ppeAdditionsCurrent: 18_500_000,
      ppeDisposalsCurrent: 5_500_000,
      ppeOpeningPrior: 158_000_000,
      ppeAdditionsPrior: 16_200_000,
      ppeDisposalsPrior: 2_200_000,
      depreciationRate: 15,
      depreciationMethod: 'straight-line',
      // Employee data
      employeeCount: 342,
      salariesWages: 245_000_000,
      pensionContributions: 28_500_000,
      payrollTaxes: 11_500_000,
      otherEmployeeBenefits: 8_200_000,
      // Advances & deposits
      advancesRecovered: 12_400_000,
      advancesRecoveredPrior: 10_800_000,
      depositsReceived: 8_200_000,
      depositsReceivedPrior: 7_400_000,
      transfersToTreasury: 15_600_000,
      transfersToTreasuryPrior: 13_200_000,
      revenueInKindTaxWaivers: 3_200_000,
      revenueInKindTaxWaiversPrior: 2_800_000,
      // Adjustments
      priorYearAdjustments: 2_400_000,
      revaluationReserves: 5_600_000,
      transfersToUCF: 320_000_000,
      // Signatories
      accountingOfficer: 'James K. Madera',
      chiefFinanceOfficer: 'Sarah N. Achieng',
      internalAuditHead: 'Peter O. Mukasa',
      signatoryDate: '2025-08-15',
      // IPSAS
      ipsasBasis: 'IPSAS Accrual Basis',
      accountingPolicies: 'Accrual basis of accounting consistent with IPSAS standards. Revenue recognised when the entity has satisfied its performance obligation. PPE measured at cost less accumulated depreciation and impairment.',
      // Exchange rates
      exchangeRateUSD: 3725,
      exchangeRateEUR: 4050,
    },
  })
  console.log('  ✓ SupplementaryData created')

  // ════════════════════════════════════════════════════════════
  // 4. CASHBOOK OPENING BALANCE
  // ════════════════════════════════════════════════════════════
  await prisma.cashbookOpeningBalance.create({
    data: {
      reportId: report.id,
      bankAccount: 'main',
      amount: 89_200_000,
      asOfDate: '2024-07-01',
    },
  })
  console.log('  ✓ CashbookOpeningBalance created (main: Shs 89,200,000)')

  // ════════════════════════════════════════════════════════════
  // 5. FUND
  // ════════════════════════════════════════════════════════════
  const fund = await prisma.fund.create({
    data: {
      reportId: report.id,
      name: 'Consolidated Fund',
      fundType: 'general',
      code: 'CF-001',
      description: 'Uganda Consolidated Fund — primary government operating fund',
      isActive: true,
      openingBalance: 76_500_000,
    },
  })
  console.log('  ✓ Fund created: Consolidated Fund')

  // ════════════════════════════════════════════════════════════
  // 6. VOTEBOOK ENTRIES (5)
  // ════════════════════════════════════════════════════════════
  const votebookEntries = [
    { voteCode: '101', voteName: 'Compensation of Employees', originalAppropriation: 295_000_000, supplementaryAppropriation: 0, totalAppropriation: 295_000_000, actualExpenditure: 285_000_000, balance: 10_000_000 },
    { voteCode: '102', voteName: 'Goods and Services', originalAppropriation: 150_000_000, supplementaryAppropriation: 0, totalAppropriation: 150_000_000, actualExpenditure: 142_500_000, balance: 7_500_000 },
    { voteCode: '201', voteName: 'Grants and Transfers', originalAppropriation: 40_000_000, supplementaryAppropriation: 0, totalAppropriation: 40_000_000, actualExpenditure: 38_700_000, balance: 1_300_000 },
    { voteCode: '301', voteName: 'Social Benefits', originalAppropriation: 24_000_000, supplementaryAppropriation: 0, totalAppropriation: 24_000_000, actualExpenditure: 22_800_000, balance: 1_200_000 },
    { voteCode: '401', voteName: 'Capital Development', originalAppropriation: 50_000_000, supplementaryAppropriation: 5_000_000, totalAppropriation: 55_000_000, actualExpenditure: 48_600_000, balance: 6_400_000 },
  ]

  await prisma.votebookEntry.createMany({
    data: votebookEntries.map(v => ({
      reportId: report.id,
      ...v,
      commitDate: '2024-07-01',
      notes: `FY 2024-25 appropriation for ${v.voteName}`,
    })),
  })
  console.log('  ✓ 5 VotebookEntry records created')

  // ════════════════════════════════════════════════════════════
  // 7. JOURNAL ENTRIES (3) with lines
  // ════════════════════════════════════════════════════════════

  // Journal Entry 1: Revenue collection
  const je1 = await prisma.journalEntry.create({
    data: {
      reportId: report.id,
      entryNo: 'JE-001',
      entryDate: '2024-09-15',
      narration: 'Record Q1 tax revenue collection',
      entryType: 'revenue',
      reference: 'REV-Q1-001',
      status: 'posted',
      postedAt: new Date('2024-09-15'),
      lines: {
        create: [
          { accountCode: 'A001', accountName: 'Cash and Cash Equivalents', debit: 31_250_000, credit: 0, sortOrder: 1 },
          { accountCode: 'R001', accountName: 'Taxes', debit: 0, credit: 31_250_000, sortOrder: 2 },
        ],
      },
    },
  })

  // Journal Entry 2: Salary payments
  const je2 = await prisma.journalEntry.create({
    data: {
      reportId: report.id,
      entryNo: 'JE-002',
      entryDate: '2024-09-30',
      narration: 'Monthly salary payments for September 2024',
      entryType: 'payment',
      reference: 'PAY-SEP-2024',
      status: 'posted',
      postedAt: new Date('2024-09-30'),
      lines: {
        create: [
          { accountCode: 'E001', accountName: 'Compensation of Employees', debit: 23_750_000, credit: 0, sortOrder: 1 },
          { accountCode: 'L001', accountName: 'Payables (Current)', debit: 0, credit: 23_750_000, sortOrder: 2 },
          { accountCode: 'L001', accountName: 'Payables (Current)', debit: 23_750_000, credit: 0, sortOrder: 3 },
          { accountCode: 'A001', accountName: 'Cash and Cash Equivalents', debit: 0, credit: 23_750_000, sortOrder: 4 },
        ],
      },
    },
  })

  // Journal Entry 3: UCF transfer received
  const je3 = await prisma.journalEntry.create({
    data: {
      reportId: report.id,
      entryNo: 'JE-003',
      entryDate: '2024-10-01',
      narration: 'Quarterly UCF transfer received from Treasury',
      entryType: 'receipt',
      reference: 'UCF-Q2-2024',
      status: 'posted',
      postedAt: new Date('2024-10-01'),
      lines: {
        create: [
          { accountCode: 'A001', accountName: 'Cash and Cash Equivalents', debit: 80_000_000, credit: 0, sortOrder: 1 },
          { accountCode: 'R003', accountName: 'Transfers received from Treasury-UCF', debit: 0, credit: 80_000_000, sortOrder: 2 },
        ],
      },
    },
  })

  console.log('  ✓ 3 JournalEntry records with lines created')

  // ════════════════════════════════════════════════════════════
  // 8. CASHBOOK ENTRIES (5)
  // ════════════════════════════════════════════════════════════
  const cashbookEntries = [
    { date: '2024-07-15', description: 'Tax revenue collection - July', reference: 'REV-JUL-001', receipt: 10_400_000, payment: 0, balance: 99_600_000, accountCode: 'R001' },
    { date: '2024-08-31', description: 'Salary payments - August', reference: 'PAY-AUG-001', receipt: 0, payment: 23_750_000, balance: 75_850_000, accountCode: 'E001' },
    { date: '2024-09-15', description: 'Tax revenue collection - September', reference: 'REV-SEP-001', receipt: 31_250_000, payment: 0, balance: 107_100_000, accountCode: 'R001' },
    { date: '2024-10-01', description: 'UCF transfer received Q2', reference: 'UCF-Q2-001', receipt: 80_000_000, payment: 0, balance: 187_100_000, accountCode: 'R003' },
    { date: '2024-10-15', description: 'Goods and services procurement', reference: 'PO-OCT-001', receipt: 0, payment: 11_800_000, balance: 175_300_000, accountCode: 'E002' },
  ]

  await prisma.cashbookEntry.createMany({
    data: cashbookEntries.map(c => ({
      reportId: report.id,
      ...c,
      bankAccount: 'main',
    })),
  })
  console.log('  ✓ 5 CashbookEntry records created')

  // ════════════════════════════════════════════════════════════
  // 9. LEDGER ACCOUNTS (2) with transactions
  // ════════════════════════════════════════════════════════════

  // Ledger Account 1: Cash
  const ledgerCash = await prisma.ledgerAccount.create({
    data: {
      reportId: report.id,
      accountCode: 'A001',
      accountName: 'Cash and Cash Equivalents',
      accountType: 'asset',
      openingDebit: 76_500_000,
      openingCredit: 0,
      totalDebit: 121_650_000,
      totalCredit: 35_550_000,
      closingDebit: 89_200_000,
      closingCredit: 0,
      transactions: {
        create: [
          { date: '2024-07-15', narration: 'Tax revenue collection - July', reference: 'REV-JUL-001', debit: 10_400_000, credit: 0, balance: 86_900_000 },
          { date: '2024-08-31', narration: 'Salary payments - August', reference: 'PAY-AUG-001', debit: 0, credit: 23_750_000, balance: 63_150_000 },
          { date: '2024-09-15', narration: 'Tax revenue collection - September', reference: 'REV-SEP-001', debit: 31_250_000, credit: 0, balance: 94_400_000 },
          { date: '2024-10-01', narration: 'UCF transfer received Q2', reference: 'UCF-Q2-001', debit: 80_000_000, credit: 0, balance: 174_400_000 },
          { date: '2024-10-15', narration: 'Goods and services procurement', reference: 'PO-OCT-001', debit: 0, credit: 11_800_000, balance: 162_600_000 },
        ],
      },
    },
  })

  // Ledger Account 2: Compensation of Employees
  const ledgerComp = await prisma.ledgerAccount.create({
    data: {
      reportId: report.id,
      accountCode: 'E001',
      accountName: 'Compensation of Employees',
      accountType: 'expense',
      openingDebit: 0,
      openingCredit: 0,
      totalDebit: 285_000_000,
      totalCredit: 0,
      closingDebit: 285_000_000,
      closingCredit: 0,
      transactions: {
        create: [
          { date: '2024-07-31', narration: 'Salary payments - July', reference: 'PAY-JUL-001', debit: 23_750_000, credit: 0, balance: 23_750_000 },
          { date: '2024-08-31', narration: 'Salary payments - August', reference: 'PAY-AUG-001', debit: 23_750_000, credit: 0, balance: 47_500_000 },
          { date: '2024-09-30', narration: 'Salary payments - September', reference: 'PAY-SEP-2024', debit: 23_750_000, credit: 0, balance: 71_250_000 },
        ],
      },
    },
  })

  console.log('  ✓ 2 LedgerAccount records with transactions created')

  // ════════════════════════════════════════════════════════════
  // 10. SET REPORT STATUS TO COMPLETE
  // ════════════════════════════════════════════════════════════
  await prisma.financialReport.update({
    where: { id: report.id },
    data: { status: 'complete' },
  })
  console.log('  ✓ Report status set to "complete"')

  console.log('\n🎉 Seed complete! Madera LG FY 2024-25 financial statement ready.')
  console.log(`   Report ID: ${report.id}`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
