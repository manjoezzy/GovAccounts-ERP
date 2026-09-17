import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Comprehensive Seed — Madera Government Financial Statement FY 2024-25')
  console.log('   Populating ALL 16 modules with realistic government accounting data\n')

  // ── Clean existing data ──────────────────────────────────────
  await prisma.closingEntry.deleteMany()
  await prisma.creditorAccount.deleteMany()
  await prisma.debtorAccount.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.assetRegister.deleteMany()
  await prisma.interFundTransfer.deleteMany()
  await prisma.appropriationAccount.deleteMany()
  await prisma.expenditureEntry.deleteMany()
  await prisma.revenueEntry.deleteMany()
  await prisma.suspenseAccount.deleteMany()
  await prisma.chequeEntry.deleteMany()
  await prisma.debtEntry.deleteMany()
  await prisma.grantEntry.deleteMany()
  await prisma.taxEntry.deleteMany()
  await prisma.payrollEntry.deleteMany()
  await prisma.ledgerTransaction.deleteMany()
  await prisma.ledgerAccount.deleteMany()
  await prisma.bankReconciliation.deleteMany()
  await prisma.cashbookEntry.deleteMany()
  await prisma.cashbookOpeningBalance.deleteMany()
  await prisma.imprest.deleteMany()
  await prisma.pettyCashTransaction.deleteMany()
  await prisma.journalLine.deleteMany()
  await prisma.journalEntry.deleteMany()
  await prisma.procurementPlan.deleteMany()
  await prisma.commitment.deleteMany()
  await prisma.virement.deleteMany()
  await prisma.warrant.deleteMany()
  await prisma.votebookEntry.deleteMany()
  await prisma.fund.deleteMany()
  await prisma.approvalWorkflow.deleteMany()
  await prisma.supplementaryData.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.trialBalanceEntry.deleteMany()
  await prisma.financialReport.deleteMany()
  console.log('  ✓ All existing data cleared')

  // ════════════════════════════════════════════════════════════
  // 1. FINANCIAL REPORT
  // ════════════════════════════════════════════════════════════
  const report = await prisma.financialReport.create({
    data: {
      entityName: 'Madera Local Government',
      periodEnd: '2025-06-30',
      periodLabel: '30 June 2025',
      currency: 'Shs',
      status: 'draft',
      version: 1,
      versionLabel: 'Original',
      fiscalYear: '2024-25',
    },
  })
  console.log(`  ✓ FinancialReport: ${report.id}`)

  // ════════════════════════════════════════════════════════════
  // 2. TRIAL BALANCE ENTRIES (39 entries - balanced)
  // ════════════════════════════════════════════════════════════
  const revenueNonExchange = [
    { accountCode: 'R001', accountName: 'Taxes', classification: 'revenue-non-exchange', category: 'taxes', noteRef: '2', creditCurrent: 125_000_000, creditPrior: 118_500_000, budgetInitial: 130_000_000, budgetAdjusted: 130_000_000 },
    { accountCode: 'R002', accountName: 'External Assistance', classification: 'revenue-non-exchange', category: 'external_assistance', noteRef: '3', creditCurrent: 45_200_000, creditPrior: 42_800_000, budgetInitial: 48_000_000, budgetAdjusted: 48_000_000 },
    { accountCode: 'R003', accountName: 'Transfers received from Treasury-UCF', classification: 'revenue-non-exchange', category: 'transfers_treasury_ucf', noteRef: '4', creditCurrent: 320_000_000, creditPrior: 305_000_000, budgetInitial: 330_000_000, budgetAdjusted: 330_000_000 },
    { accountCode: 'R004', accountName: 'Transfers from Contingencies Fund', classification: 'revenue-non-exchange', category: 'transfers_contingencies', noteRef: '5', creditCurrent: 8_500_000, creditPrior: 6_200_000, budgetInitial: 10_000_000, budgetAdjusted: 10_000_000 },
    { accountCode: 'R005', accountName: 'Transfers from other Government Units', classification: 'revenue-non-exchange', category: 'transfers_other_govt', noteRef: '6', creditCurrent: 15_300_000, creditPrior: 14_100_000, budgetInitial: 16_000_000, budgetAdjusted: 16_000_000 },
    { accountCode: 'R006', accountName: 'Non-Tax revenue-Exchange Transaction', classification: 'revenue-non-exchange', category: 'non_tax_exchange', noteRef: '7', creditCurrent: 22_700_000, creditPrior: 20_500_000, budgetInitial: 24_000_000, budgetAdjusted: 24_000_000 },
    { accountCode: 'R008', accountName: 'Revenue in Kind', classification: 'revenue-non-exchange', category: 'revenue_in_kind', noteRef: '8(b)', creditCurrent: 3_200_000, creditPrior: 2_800_000, budgetInitial: 3_500_000, budgetAdjusted: 3_500_000 },
  ]
  const revenueExchange = [
    { accountCode: 'R007', accountName: 'Students Fees / Exchange Revenue', classification: 'revenue-exchange', category: 'sub_exchange', noteRef: '8', creditCurrent: 35_600_000, creditPrior: 32_400_000, budgetInitial: 38_000_000, budgetAdjusted: 38_000_000 },
    { accountCode: 'R009', accountName: 'Non-Tax Revenue-Exchange', classification: 'revenue-exchange', category: 'non_tax_revenue_exchange', noteRef: '7(b)', creditCurrent: 18_400_000, creditPrior: 16_800_000, budgetInitial: 20_000_000, budgetAdjusted: 20_000_000 },
  ]
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
  const equity = [
    { accountCode: 'NA01', accountName: 'Accumulated Surplus / Net Assets', classification: 'equity', category: 'net_assets', noteRef: '32', creditCurrent: 127_800_000, creditPrior: 110_900_000 },
  ]

  const allEntries = [
    ...revenueNonExchange, ...revenueExchange, ...expenses, ...assets, ...liabilities, ...equity,
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
  console.log(`  ✓ TrialBalance: ${allEntries.length} entries`)

  // ════════════════════════════════════════════════════════════
  // 3. SUPPLEMENTARY DATA
  // ════════════════════════════════════════════════════════════
  await prisma.supplementaryData.create({
    data: {
      reportId: report.id,
      ppeOpeningCurrent: 172_000_000, ppeAdditionsCurrent: 18_500_000, ppeDisposalsCurrent: 5_500_000,
      ppeOpeningPrior: 158_000_000, ppeAdditionsPrior: 16_200_000, ppeDisposalsPrior: 2_200_000,
      depreciationRate: 15, depreciationMethod: 'straight-line',
      employeeCount: 342, salariesWages: 245_000_000, pensionContributions: 28_500_000,
      payrollTaxes: 11_500_000, otherEmployeeBenefits: 8_200_000,
      advancesRecovered: 12_400_000, advancesRecoveredPrior: 10_800_000,
      depositsReceived: 8_200_000, depositsReceivedPrior: 7_400_000,
      transfersToTreasury: 15_600_000, transfersToTreasuryPrior: 13_200_000,
      revenueInKindTaxWaivers: 3_200_000, revenueInKindTaxWaiversPrior: 2_800_000,
      priorYearAdjustments: 2_400_000, revaluationReserves: 5_600_000, transfersToUCF: 320_000_000,
      accountingOfficer: 'James K. Madera', chiefFinanceOfficer: 'Sarah N. Achieng',
      internalAuditHead: 'Peter O. Mukasa', signatoryDate: '2025-08-15',
      ipsasBasis: 'IPSAS Accrual Basis',
      accountingPolicies: 'Accrual basis of accounting consistent with IPSAS standards. Revenue recognised when the entity has satisfied its performance obligation. PPE measured at cost less accumulated depreciation and impairment.',
      exchangeRateUSD: 3725, exchangeRateEUR: 4050,
    },
  })
  console.log('  ✓ SupplementaryData')

  // ════════════════════════════════════════════════════════════
  // 4. APPROVAL WORKFLOW
  // ════════════════════════════════════════════════════════════
  await prisma.approvalWorkflow.create({
    data: {
      reportId: report.id,
      currentStep: 'review',
      preparerName: 'Accountant A. Mwangi',
      preparerApprovedAt: new Date('2025-07-20'),
      reviewerName: 'Internal Auditor P. Mukasa',
      comments: 'Draft prepared and submitted for internal review. All supporting schedules attached.',
    },
  })
  console.log('  ✓ ApprovalWorkflow')

  // ════════════════════════════════════════════════════════════
  // 5. FUNDS (3 funds)
  // ════════════════════════════════════════════════════════════
  await prisma.fund.createMany({
    data: [
      { reportId: report.id, name: 'Consolidated Fund', fundType: 'general', code: 'CF-001', description: 'Primary government operating fund', isActive: true, openingBalance: 76_500_000 },
      { reportId: report.id, name: 'Development Fund', fundType: 'special', code: 'DF-001', description: 'Capital development and infrastructure projects', isActive: true, openingBalance: 42_000_000 },
      { reportId: report.id, name: 'Road Fund', fundType: 'earmarked', code: 'RF-001', description: 'Road maintenance and construction earmarked fund', isActive: true, openingBalance: 18_500_000 },
    ],
  })
  console.log('  ✓ Funds: 3')

  // ════════════════════════════════════════════════════════════
  // 6. VOTEBOOK ENTRIES (8 votes)
  // ════════════════════════════════════════════════════════════
  await prisma.votebookEntry.createMany({
    data: [
      { reportId: report.id, voteCode: '101', voteName: 'Compensation of Employees', originalAppropriation: 295_000_000, supplementaryAppropriation: 0, totalAppropriation: 295_000_000, actualExpenditure: 285_000_000, balance: 10_000_000, commitDate: '2024-07-01', notes: 'FY 2024-25 salaries, wages, and allowances' },
      { reportId: report.id, voteCode: '102', voteName: 'Goods and Services', originalAppropriation: 150_000_000, supplementaryAppropriation: 0, totalAppropriation: 150_000_000, actualExpenditure: 142_500_000, balance: 7_500_000, commitDate: '2024-07-01', notes: 'Operating supplies, utilities, travel' },
      { reportId: report.id, voteCode: '201', voteName: 'Grants and Transfers', originalAppropriation: 40_000_000, supplementaryAppropriation: 0, totalAppropriation: 40_000_000, actualExpenditure: 38_700_000, balance: 1_300_000, commitDate: '2024-07-01', notes: 'Conditional and unconditional grants' },
      { reportId: report.id, voteCode: '301', voteName: 'Social Benefits', originalAppropriation: 24_000_000, supplementaryAppropriation: 0, totalAppropriation: 24_000_000, actualExpenditure: 22_800_000, balance: 1_200_000, commitDate: '2024-07-01', notes: 'Pensions and social assistance' },
      { reportId: report.id, voteCode: '401', voteName: 'Capital Development', originalAppropriation: 50_000_000, supplementaryAppropriation: 5_000_000, totalAppropriation: 55_000_000, actualExpenditure: 48_600_000, balance: 6_400_000, commitDate: '2024-07-01', notes: 'Infrastructure and capital projects' },
      { reportId: report.id, voteCode: '501', voteName: 'Finance Costs', originalAppropriation: 6_000_000, supplementaryAppropriation: 0, totalAppropriation: 6_000_000, actualExpenditure: 5_400_000, balance: 600_000, commitDate: '2024-07-01', notes: 'Interest on domestic and external debt' },
      { reportId: report.id, voteCode: '601', voteName: 'Subsidies', originalAppropriation: 13_000_000, supplementaryAppropriation: 0, totalAppropriation: 13_000_000, actualExpenditure: 12_400_000, balance: 600_000, commitDate: '2024-07-01', notes: 'Agricultural and energy subsidies' },
      { reportId: report.id, voteCode: '701', voteName: 'Contingencies', originalAppropriation: 10_000_000, supplementaryAppropriation: 0, totalAppropriation: 10_000_000, actualExpenditure: 2_100_000, balance: 7_900_000, commitDate: '2024-07-01', notes: 'Contingency and emergency provisions' },
    ],
  })
  console.log('  ✓ Votebook: 8 votes')

  // ════════════════════════════════════════════════════════════
  // 7. WARRANTS (3)
  // ════════════════════════════════════════════════════════════
  await prisma.warrant.createMany({
    data: [
      { reportId: report.id, warrantNo: 'W-2024-001', voteCode: '101', amount: 295_000_000, authority: 'Appropriation Act 2024', issueDate: '2024-07-01', expiryDate: '2025-06-30', status: 'active', utilized: 285_000_000, balance: 10_000_000 },
      { reportId: report.id, warrantNo: 'W-2024-002', voteCode: '102', amount: 150_000_000, authority: 'Appropriation Act 2024', issueDate: '2024-07-01', expiryDate: '2025-06-30', status: 'active', utilized: 142_500_000, balance: 7_500_000 },
      { reportId: report.id, warrantNo: 'W-2024-003', voteCode: '401', amount: 55_000_000, authority: 'Supplementary Appropriation', issueDate: '2024-10-15', expiryDate: '2025-06-30', status: 'active', utilized: 48_600_000, balance: 6_400_000 },
    ],
  })
  console.log('  ✓ Warrants: 3')

  // ════════════════════════════════════════════════════════════
  // 8. VIREMENTS (2)
  // ════════════════════════════════════════════════════════════
  await prisma.virement.createMany({
    data: [
      { reportId: report.id, fromVote: '102', toVote: '401', amount: 5_000_000, reason: 'Additional capital development funding required for road project', authBy: 'CFO Sarah N. Achieng', authDate: '2024-10-15', status: 'approved' },
      { reportId: report.id, fromVote: '701', toVote: '102', amount: 2_000_000, reason: 'Supplement goods & services budget for office relocation', authBy: 'PS Finance', authDate: '2025-02-10', status: 'pending' },
    ],
  })
  console.log('  ✓ Virements: 2')

  // ════════════════════════════════════════════════════════════
  // 9. COMMITMENTS (4)
  // ════════════════════════════════════════════════════════════
  await prisma.commitment.createMany({
    data: [
      { reportId: report.id, poNumber: 'PO-2024-001', voteCode: '102', supplier: 'Office Solutions Ltd', description: 'IT equipment and software licenses', commitDate: '2024-08-15', committedAmount: 8_500_000, expendedAmount: 8_500_000, balance: 0, status: 'expended' },
      { reportId: report.id, poNumber: 'PO-2024-002', voteCode: '102', supplier: 'Uganda Printing & Publishing', description: 'Stationery and printing supplies Q3', commitDate: '2024-11-01', committedAmount: 3_200_000, expendedAmount: 2_800_000, balance: 400_000, status: 'partially_expended' },
      { reportId: report.id, poNumber: 'PO-2024-003', voteCode: '401', supplier: 'Madera Construction Co.', description: 'Road maintenance - Km 15-25 Madera-Kampala Highway', commitDate: '2024-09-01', committedAmount: 22_000_000, expendedAmount: 18_500_000, balance: 3_500_000, status: 'partially_expended' },
      { reportId: report.id, poNumber: 'PO-2024-004', voteCode: '401', supplier: 'Water & Sanitation Engineering', description: 'Rural water supply project Phase 2', commitDate: '2025-01-15', committedAmount: 15_000_000, expendedAmount: 0, balance: 15_000_000, status: 'open' },
    ],
  })
  console.log('  ✓ Commitments: 4')

  // ════════════════════════════════════════════════════════════
  // 10. PROCUREMENT PLANS (4)
  // ════════════════════════════════════════════════════════════
  await prisma.procurementPlan.createMany({
    data: [
      { reportId: report.id, itemDescription: 'Supply of IT equipment (laptops, servers, networking)', voteCode: '102', estimatedCost: 8_500_000, procurementMethod: 'open', plannedDate: '2024-08-01', status: 'completed' },
      { reportId: report.id, itemDescription: 'Road maintenance works Madera-Kampala Highway', voteCode: '401', estimatedCost: 22_000_000, procurementMethod: 'open', plannedDate: '2024-09-01', status: 'in_progress' },
      { reportId: report.id, itemDescription: 'Rural water supply construction Phase 2', voteCode: '401', estimatedCost: 15_000_000, procurementMethod: 'restricted', plannedDate: '2025-01-15', status: 'planned' },
      { reportId: report.id, itemDescription: 'Medical supplies and equipment for health centres', voteCode: '102', estimatedCost: 5_200_000, procurementMethod: 'open', plannedDate: '2025-03-01', status: 'planned' },
    ],
  })
  console.log('  ✓ ProcurementPlans: 4')

  // ════════════════════════════════════════════════════════════
  // 11. JOURNAL ENTRIES (5) with lines
  // ════════════════════════════════════════════════════════════
  await prisma.journalEntry.create({
    data: { reportId: report.id, entryNo: 'JE-001', entryDate: '2024-09-15', narration: 'Record Q1 tax revenue collection', entryType: 'revenue', reference: 'REV-Q1-001', status: 'posted', postedAt: new Date('2024-09-15'),
      lines: { create: [
        { accountCode: 'A001', accountName: 'Cash and Cash Equivalents', debit: 31_250_000, credit: 0, sortOrder: 1 },
        { accountCode: 'R001', accountName: 'Taxes', debit: 0, credit: 31_250_000, sortOrder: 2 },
      ]},
    },
  })
  await prisma.journalEntry.create({
    data: { reportId: report.id, entryNo: 'JE-002', entryDate: '2024-09-30', narration: 'Monthly salary payments September 2024', entryType: 'payment', reference: 'PAY-SEP-2024', status: 'posted', postedAt: new Date('2024-09-30'),
      lines: { create: [
        { accountCode: 'E001', accountName: 'Compensation of Employees', debit: 23_750_000, credit: 0, sortOrder: 1 },
        { accountCode: 'A001', accountName: 'Cash and Cash Equivalents', debit: 0, credit: 23_750_000, sortOrder: 2 },
      ]},
    },
  })
  await prisma.journalEntry.create({
    data: { reportId: report.id, entryNo: 'JE-003', entryDate: '2024-10-01', narration: 'Quarterly UCF transfer received from Treasury', entryType: 'receipt', reference: 'UCF-Q2-2024', status: 'posted', postedAt: new Date('2024-10-01'),
      lines: { create: [
        { accountCode: 'A001', accountName: 'Cash and Cash Equivalents', debit: 80_000_000, credit: 0, sortOrder: 1 },
        { accountCode: 'R003', accountName: 'Transfers received from Treasury-UCF', debit: 0, credit: 80_000_000, sortOrder: 2 },
      ]},
    },
  })
  await prisma.journalEntry.create({
    data: { reportId: report.id, entryNo: 'JE-004', entryDate: '2024-12-15', narration: 'Depreciation charge for Q2 FY 2024-25', entryType: 'adjustment', reference: 'DEP-Q2-2024', status: 'posted', postedAt: new Date('2024-12-15'),
      lines: { create: [
        { accountCode: 'E003', accountName: 'Depreciation Expense', debit: 7_150_000, credit: 0, sortOrder: 1 },
        { accountCode: 'A008', accountName: 'Property, Plant and Equipment', debit: 0, credit: 7_150_000, sortOrder: 2 },
      ]},
    },
  })
  await prisma.journalEntry.create({
    data: { reportId: report.id, entryNo: 'JE-005', entryDate: '2025-03-31', narration: 'Grants and transfers to lower local governments Q3', entryType: 'payment', reference: 'GRANT-Q3-2025', status: 'posted', postedAt: new Date('2025-03-31'),
      lines: { create: [
        { accountCode: 'E006', accountName: 'Grants and Other Transfers', debit: 12_900_000, credit: 0, sortOrder: 1 },
        { accountCode: 'A001', accountName: 'Cash and Cash Equivalents', debit: 0, credit: 12_900_000, sortOrder: 2 },
      ]},
    },
  })
  console.log('  ✓ JournalEntries: 5 with lines')

  // ════════════════════════════════════════════════════════════
  // 12. PETTY CASH (5 transactions)
  // ════════════════════════════════════════════════════════════
  await prisma.pettyCashTransaction.createMany({
    data: [
      { reportId: report.id, date: '2024-07-05', description: 'Office tea and sundries', voucherNo: 'PC-001', receipt: 0, payment: 150_000, balance: 4_850_000, category: 'sundries' },
      { reportId: report.id, date: '2024-07-20', description: 'Taxi hire for field visit', voucherNo: 'PC-002', receipt: 0, payment: 350_000, balance: 4_500_000, category: 'transport' },
      { reportId: report.id, date: '2024-08-01', description: 'Petty cash replenishment', voucherNo: 'PC-003', receipt: 2_000_000, payment: 0, balance: 6_500_000, category: 'replenishment' },
      { reportId: report.id, date: '2024-09-15', description: 'Emergency office repairs', voucherNo: 'PC-004', receipt: 0, payment: 800_000, balance: 5_700_000, category: 'maintenance' },
      { reportId: report.id, date: '2025-01-10', description: 'Courier and postage charges', voucherNo: 'PC-005', receipt: 0, payment: 120_000, balance: 5_580_000, category: 'postage' },
    ],
  })
  console.log('  ✓ PettyCash: 5 transactions')

  // ════════════════════════════════════════════════════════════
  // 13. IMPRESTS (3)
  // ════════════════════════════════════════════════════════════
  await prisma.imprest.createMany({
    data: [
      { reportId: report.id, imprestNo: 'IMP-001', holderName: 'J. Okello - Field Audit', purpose: 'Field audit travel and accommodation', amountIssued: 5_000_000, amountSurrendered: 4_200_000, balance: 800_000, issueDate: '2024-08-15', dueDate: '2024-09-15', surrenderDate: '2024-09-10', status: 'partially_surrendered' },
      { reportId: report.id, imprestNo: 'IMP-002', holderName: 'M. Nalubega - Workshop', purpose: 'Regional planning workshop Kampala', amountIssued: 3_500_000, amountSurrendered: 0, balance: 3_500_000, issueDate: '2024-11-01', dueDate: '2024-11-30', surrenderDate: '', status: 'outstanding' },
      { reportId: report.id, imprestNo: 'IMP-003', holderName: 'R. Kato - Inspection', purpose: 'Road construction site inspection', amountIssued: 2_800_000, amountSurrendered: 2_800_000, balance: 0, issueDate: '2025-01-10', dueDate: '2025-02-10', surrenderDate: '2025-02-08', status: 'surrendered' },
    ],
  })
  console.log('  ✓ Imprests: 3')

  // ════════════════════════════════════════════════════════════
  // 14. CASHBOOK ENTRIES (8)
  // ════════════════════════════════════════════════════════════
  await prisma.cashbookEntry.createMany({
    data: [
      { reportId: report.id, date: '2024-07-15', description: 'Tax revenue collection - July', reference: 'REV-JUL-001', receipt: 10_400_000, payment: 0, balance: 99_600_000, accountCode: 'R001', bankAccount: 'main' },
      { reportId: report.id, date: '2024-08-31', description: 'Salary payments - August', reference: 'PAY-AUG-001', receipt: 0, payment: 23_750_000, balance: 75_850_000, accountCode: 'E001', bankAccount: 'main' },
      { reportId: report.id, date: '2024-09-15', description: 'Tax revenue collection - September', reference: 'REV-SEP-001', receipt: 31_250_000, payment: 0, balance: 107_100_000, accountCode: 'R001', bankAccount: 'main' },
      { reportId: report.id, date: '2024-10-01', description: 'UCF transfer received Q2', reference: 'UCF-Q2-001', receipt: 80_000_000, payment: 0, balance: 187_100_000, accountCode: 'R003', bankAccount: 'main' },
      { reportId: report.id, date: '2024-10-15', description: 'Goods and services procurement', reference: 'PO-OCT-001', receipt: 0, payment: 11_800_000, balance: 175_300_000, accountCode: 'E002', bankAccount: 'main' },
      { reportId: report.id, date: '2024-12-20', description: 'External assistance received - DFID', reference: 'EA-DFID-001', receipt: 15_000_000, payment: 0, balance: 190_300_000, accountCode: 'R002', bankAccount: 'main' },
      { reportId: report.id, date: '2025-01-15', description: 'Capital development payment - roadworks', reference: 'CAP-JAN-001', receipt: 0, payment: 18_500_000, balance: 171_800_000, accountCode: 'E006', bankAccount: 'main' },
      { reportId: report.id, date: '2025-03-31', description: 'Quarterly grants transfer to LLGs', reference: 'GRANT-Q3-001', receipt: 0, payment: 12_900_000, balance: 158_900_000, accountCode: 'E006', bankAccount: 'main' },
    ],
  })
  await prisma.cashbookOpeningBalance.create({
    data: { reportId: report.id, bankAccount: 'main', amount: 89_200_000, asOfDate: '2024-07-01' },
  })
  console.log('  ✓ Cashbook: 8 entries + opening balance')

  // ════════════════════════════════════════════════════════════
  // 15. BANK RECONCILIATION (2)
  // ════════════════════════════════════════════════════════════
  await prisma.bankReconciliation.createMany({
    data: [
      { reportId: report.id, bankAccount: 'main', periodEnd: '2024-12-31', balancePerBooks: 190_300_000, balancePerBank: 185_600_000, outstandingDeposits: 8_200_000, outstandingCheques: 3_500_000, bankCharges: 0, bankInterest: 0, otherAdjustments: 0, adjustedBalance: 190_300_000, status: 'reconciled' },
      { reportId: report.id, bankAccount: 'main', periodEnd: '2025-06-30', balancePerBooks: 89_200_000, balancePerBank: 84_500_000, outstandingDeposits: 6_800_000, outstandingCheques: 2_100_000, bankCharges: 0, bankInterest: 0, otherAdjustments: 0, adjustedBalance: 89_200_000, status: 'draft' },
    ],
  })
  console.log('  ✓ BankReconciliation: 2')

  // ════════════════════════════════════════════════════════════
  // 16. LEDGER ACCOUNTS (6) with transactions
  // ════════════════════════════════════════════════════════════
  await prisma.ledgerAccount.create({
    data: { reportId: report.id, accountCode: 'A001', accountName: 'Cash and Cash Equivalents', accountType: 'asset', openingDebit: 76_500_000, openingCredit: 0, totalDebit: 136_650_000, totalCredit: 66_450_000, closingDebit: 89_200_000, closingCredit: 0,
      transactions: { create: [
        { date: '2024-07-15', narration: 'Tax revenue collection - July', reference: 'REV-JUL-001', debit: 10_400_000, credit: 0, balance: 86_900_000 },
        { date: '2024-08-31', narration: 'Salary payments - August', reference: 'PAY-AUG-001', debit: 0, credit: 23_750_000, balance: 63_150_000 },
        { date: '2024-09-15', narration: 'Tax revenue collection - September', reference: 'REV-SEP-001', debit: 31_250_000, credit: 0, balance: 94_400_000 },
        { date: '2024-10-01', narration: 'UCF transfer Q2', reference: 'UCF-Q2-001', debit: 80_000_000, credit: 0, balance: 174_400_000 },
        { date: '2024-10-15', narration: 'Goods and services procurement', reference: 'PO-OCT-001', debit: 0, credit: 11_800_000, balance: 162_600_000 },
      ]},
    },
  })
  await prisma.ledgerAccount.create({
    data: { reportId: report.id, accountCode: 'E001', accountName: 'Compensation of Employees', accountType: 'expense', openingDebit: 0, openingCredit: 0, totalDebit: 285_000_000, totalCredit: 0, closingDebit: 285_000_000, closingCredit: 0,
      transactions: { create: [
        { date: '2024-07-31', narration: 'Salary payments - July', reference: 'PAY-JUL-001', debit: 23_750_000, credit: 0, balance: 23_750_000 },
        { date: '2024-08-31', narration: 'Salary payments - August', reference: 'PAY-AUG-001', debit: 23_750_000, credit: 0, balance: 47_500_000 },
        { date: '2024-09-30', narration: 'Salary payments - September', reference: 'PAY-SEP-2024', debit: 23_750_000, credit: 0, balance: 71_250_000 },
      ]},
    },
  })
  await prisma.ledgerAccount.create({
    data: { reportId: report.id, accountCode: 'R001', accountName: 'Taxes', accountType: 'revenue', openingDebit: 0, openingCredit: 0, totalDebit: 0, totalCredit: 125_000_000, closingDebit: 0, closingCredit: 125_000_000,
      transactions: { create: [
        { date: '2024-07-15', narration: 'Tax revenue - July', reference: 'REV-JUL-001', debit: 0, credit: 10_400_000, balance: 10_400_000 },
        { date: '2024-09-15', narration: 'Tax revenue - September', reference: 'REV-SEP-001', debit: 0, credit: 31_250_000, balance: 41_650_000 },
      ]},
    },
  })
  await prisma.ledgerAccount.create({
    data: { reportId: report.id, accountCode: 'R003', accountName: 'Transfers from Treasury-UCF', accountType: 'revenue', openingDebit: 0, openingCredit: 0, totalDebit: 0, totalCredit: 320_000_000, closingDebit: 0, closingCredit: 320_000_000,
      transactions: { create: [
        { date: '2024-10-01', narration: 'UCF transfer Q2', reference: 'UCF-Q2-001', debit: 0, credit: 80_000_000, balance: 80_000_000 },
      ]},
    },
  })
  await prisma.ledgerAccount.create({
    data: { reportId: report.id, accountCode: 'E002', accountName: 'Goods and Services Consumed', accountType: 'expense', openingDebit: 0, openingCredit: 0, totalDebit: 142_500_000, totalCredit: 0, closingDebit: 142_500_000, closingCredit: 0,
      transactions: { create: [
        { date: '2024-10-15', narration: 'Office supplies and procurement', reference: 'PO-OCT-001', debit: 11_800_000, credit: 0, balance: 11_800_000 },
      ]},
    },
  })
  await prisma.ledgerAccount.create({
    data: { reportId: report.id, accountCode: 'E006', accountName: 'Grants and Other Transfers', accountType: 'expense', openingDebit: 0, openingCredit: 0, totalDebit: 38_700_000, totalCredit: 0, closingDebit: 38_700_000, closingCredit: 0,
      transactions: { create: [
        { date: '2025-01-15', narration: 'Capital development roadworks', reference: 'CAP-JAN-001', debit: 18_500_000, credit: 0, balance: 18_500_000 },
        { date: '2025-03-31', narration: 'Quarterly grants to LLGs', reference: 'GRANT-Q3-001', debit: 12_900_000, credit: 0, balance: 31_400_000 },
      ]},
    },
  })
  console.log('  ✓ LedgerAccounts: 6 with transactions')

  // ════════════════════════════════════════════════════════════
  // 17. PAYROLL ENTRIES (5)
  // ════════════════════════════════════════════════════════════
  await prisma.payrollEntry.createMany({
    data: [
      { reportId: report.id, employeeName: 'Mwangi James', employeeNumber: 'EMP-001', department: 'Finance', payPeriod: '2024-07', grossPay: 2_850_000, payeTax: 570_000, pensionEmployee: 285_000, pensionEmployer: 285_000, nssf: 200_000, otherDeductions: 0, netPay: 1_795_000, bankAccount: 'CBA-001' },
      { reportId: report.id, employeeName: 'Achieng Sarah', employeeNumber: 'EMP-002', department: 'Finance', payPeriod: '2024-07', grossPay: 3_200_000, payeTax: 640_000, pensionEmployee: 320_000, pensionEmployer: 320_000, nssf: 200_000, otherDeductions: 50_000, netPay: 1_990_000, bankAccount: 'STAN-002' },
      { reportId: report.id, employeeName: 'Okello Peter', employeeNumber: 'EMP-003', department: 'Internal Audit', payPeriod: '2024-07', grossPay: 2_500_000, payeTax: 500_000, pensionEmployee: 250_000, pensionEmployer: 250_000, nssf: 200_000, otherDeductions: 0, netPay: 1_550_000, bankAccount: 'BARCL-003' },
      { reportId: report.id, employeeName: 'Nalubega Mary', employeeNumber: 'EMP-004', department: 'Planning', payPeriod: '2024-07', grossPay: 2_100_000, payeTax: 420_000, pensionEmployee: 210_000, pensionEmployer: 210_000, nssf: 200_000, otherDeductions: 0, netPay: 1_270_000, bankAccount: 'DTB-004' },
      { reportId: report.id, employeeName: 'Kato Robert', employeeNumber: 'EMP-005', department: 'Works', payPeriod: '2024-07', grossPay: 1_800_000, payeTax: 360_000, pensionEmployee: 180_000, pensionEmployer: 180_000, nssf: 200_000, otherDeductions: 30_000, netPay: 1_030_000, bankAccount: 'BOU-005' },
    ],
  })
  console.log('  ✓ Payroll: 5 entries')

  // ════════════════════════════════════════════════════════════
  // 18. TAX ENTRIES (3)
  // ════════════════════════════════════════════════════════════
  await prisma.taxEntry.createMany({
    data: [
      { reportId: report.id, taxType: 'PAYE', taxPeriod: '2024-07', collected: 2_490_000, remitted: 2_490_000, balance: 0, dueDate: '2024-08-15', remittanceDate: '2024-08-10', status: 'remitted' },
      { reportId: report.id, taxType: 'NSSF', taxPeriod: '2024-07', collected: 1_000_000, remitted: 1_000_000, balance: 0, dueDate: '2024-08-15', remittanceDate: '2024-08-12', status: 'remitted' },
      { reportId: report.id, taxType: 'WHT', taxPeriod: '2025-Q1', collected: 3_500_000, remitted: 2_100_000, balance: 1_400_000, dueDate: '2025-04-15', remittanceDate: '', status: 'pending' },
    ],
  })
  console.log('  ✓ TaxEntries: 3')

  // ════════════════════════════════════════════════════════════
  // 19. GRANTS (3)
  // ════════════════════════════════════════════════════════════
  await prisma.grantEntry.createMany({
    data: [
      { reportId: report.id, grantName: 'DFID Governance Support', donor: 'UK DFID', grantType: 'development', totalAmount: 15_000_000, drawnDown: 15_000_000, expended: 12_500_000, balance: 2_500_000, conditions: 'Earmarked for governance and accountability strengthening', startDate: '2023-07-01', endDate: '2025-06-30', status: 'active' },
      { reportId: report.id, grantName: 'World Bank LGMD Project', donor: 'World Bank', grantType: 'development', totalAmount: 45_000_000, drawnDown: 30_200_000, expended: 28_600_000, balance: 16_400_000, conditions: 'Local Government Management Development - capacity building and infrastructure', startDate: '2022-07-01', endDate: '2026-06-30', status: 'active' },
      { reportId: report.id, grantName: 'EU Road Infrastructure Grant', donor: 'European Union', grantType: 'development', totalAmount: 20_000_000, drawnDown: 8_500_000, expended: 7_200_000, balance: 12_800_000, conditions: 'Road infrastructure development in Madera district', startDate: '2024-01-01', endDate: '2027-12-31', status: 'active' },
    ],
  })
  console.log('  ✓ Grants: 3')

  // ════════════════════════════════════════════════════════════
  // 20. DEBT ENTRIES (2)
  // ════════════════════════════════════════════════════════════
  await prisma.debtEntry.createMany({
    data: [
      { reportId: report.id, lender: 'World Bank IDA', loanType: 'external', principalAmount: 120_000_000, interestRate: 1.5, outstandingPrincipal: 95_000_000, totalServiceCost: 8_400_000, repaymentsMade: 25_000_000, balance: 95_000_000, disbursementDate: '2018-07-01', maturityDate: '2038-07-01', status: 'active' },
      { reportId: report.id, lender: 'Bank of Uganda', loanType: 'domestic', principalAmount: 30_000_000, interestRate: 12.5, outstandingPrincipal: 22_500_000, totalServiceCost: 5_400_000, repaymentsMade: 7_500_000, balance: 22_500_000, disbursementDate: '2022-01-15', maturityDate: '2027-01-15', status: 'active' },
    ],
  })
  console.log('  ✓ Debt: 2')

  // ════════════════════════════════════════════════════════════
  // 21. CHEQUE ENTRIES (5)
  // ════════════════════════════════════════════════════════════
  await prisma.chequeEntry.createMany({
    data: [
      { reportId: report.id, chequeNumber: 'CHQ-10001', payee: 'Staff - Salary August', amount: 23_750_000, voteCode: '101', issueDate: '2024-08-31', bankAccount: 'main', status: 'presented', presentedDate: '2024-09-02' },
      { reportId: report.id, chequeNumber: 'CHQ-10002', payee: 'Office Solutions Ltd', amount: 8_500_000, voteCode: '102', issueDate: '2024-09-20', bankAccount: 'main', status: 'presented', presentedDate: '2024-09-22' },
      { reportId: report.id, chequeNumber: 'CHQ-10003', payee: 'Madera Construction Co.', amount: 18_500_000, voteCode: '401', issueDate: '2025-01-15', bankAccount: 'main', status: 'presented', presentedDate: '2025-01-18' },
      { reportId: report.id, chequeNumber: 'CHQ-10004', payee: 'Water & Sanitation Engineering', amount: 15_000_000, voteCode: '401', issueDate: '2025-03-01', bankAccount: 'main', status: 'issued', presentedDate: '' },
      { reportId: report.id, chequeNumber: 'CHQ-10005', payee: 'LLG Q3 Transfers', amount: 12_900_000, voteCode: '201', issueDate: '2025-03-31', bankAccount: 'main', status: 'presented', presentedDate: '2025-04-02' },
    ],
  })
  console.log('  ✓ Cheques: 5')

  // ════════════════════════════════════════════════════════════
  // 22. SUSPENSE ACCOUNTS (2)
  // ════════════════════════════════════════════════════════════
  await prisma.suspenseAccount.createMany({
    data: [
      { reportId: report.id, description: 'Unidentified bank credit - awaiting classification', debitAmount: 0, creditAmount: 2_800_000, balance: 2_800_000, date: '2024-11-20', reason: 'Credit appears on bank statement without supporting documentation', resolution: '', resolutionDate: '', status: 'open' },
      { reportId: report.id, description: 'Exchange rate difference - USD payment', debitAmount: 450_000, creditAmount: 0, balance: 450_000, date: '2025-02-15', reason: 'USD payment resulted in exchange rate variance', resolution: 'Resolved - exchange gain recognized in P&L', resolutionDate: '2025-03-01', status: 'resolved' },
    ],
  })
  console.log('  ✓ SuspenseAccounts: 2')

  // ════════════════════════════════════════════════════════════
  // 23. REVENUE ENTRIES (6)
  // ════════════════════════════════════════════════════════════
  await prisma.revenueEntry.createMany({
    data: [
      { reportId: report.id, date: '2024-07-15', revenueType: 'Taxes', accountCode: 'R001', description: 'Property tax collection July', amount: 10_400_000, taxComponent: 0, netAmount: 10_400_000, collectedBy: 'Revenue Office', receiptNumber: 'REC-001', status: 'recorded' },
      { reportId: report.id, date: '2024-09-15', revenueType: 'Taxes', accountCode: 'R001', description: 'Income tax and trading licenses Q1', amount: 31_250_000, taxComponent: 0, netAmount: 31_250_000, collectedBy: 'URA Desk', receiptNumber: 'REC-002', status: 'recorded' },
      { reportId: report.id, date: '2024-10-01', revenueType: 'UCF Transfer', accountCode: 'R003', description: 'Quarterly UCF transfer from Treasury', amount: 80_000_000, taxComponent: 0, netAmount: 80_000_000, collectedBy: 'Treasury', receiptNumber: 'UCF-Q2', status: 'recorded' },
      { reportId: report.id, date: '2024-12-20', revenueType: 'External Assistance', accountCode: 'R002', description: 'DFID governance support grant', amount: 15_000_000, taxComponent: 0, netAmount: 15_000_000, collectedBy: 'Donor Liaison', receiptNumber: 'DFID-001', status: 'recorded' },
      { reportId: report.id, date: '2025-01-05', revenueType: 'Student Fees', accountCode: 'R007', description: 'Term 1 student fees collected', amount: 12_000_000, taxComponent: 0, netAmount: 12_000_000, collectedBy: 'Education Office', receiptNumber: 'SF-T1', status: 'recorded' },
      { reportId: report.id, date: '2025-03-15', revenueType: 'Other Revenue', accountCode: 'R009', description: 'Market fees and licences', amount: 5_600_000, taxComponent: 840_000, netAmount: 4_760_000, collectedBy: 'Revenue Office', receiptNumber: 'REC-003', status: 'recorded' },
    ],
  })
  console.log('  ✓ RevenueEntries: 6')

  // ════════════════════════════════════════════════════════════
  // 24. EXPENDITURE ENTRIES (5)
  // ════════════════════════════════════════════════════════════
  await prisma.expenditureEntry.createMany({
    data: [
      { reportId: report.id, date: '2024-08-31', expenditureType: 'Salaries', accountCode: 'E001', voteCode: '101', description: 'Monthly salary payments August 2024', amount: 23_750_000, supplier: '', invoiceNumber: '', paymentRef: 'PAY-AUG-001', status: 'recorded' },
      { reportId: report.id, date: '2024-09-20', expenditureType: 'Procurement', accountCode: 'E002', voteCode: '102', description: 'IT equipment and software licenses', amount: 8_500_000, supplier: 'Office Solutions Ltd', invoiceNumber: 'INV-OS-001', paymentRef: 'PO-2024-001', status: 'recorded' },
      { reportId: report.id, date: '2024-10-15', expenditureType: 'Operating', accountCode: 'E002', voteCode: '102', description: 'Utilities, supplies, and minor works', amount: 11_800_000, supplier: 'Various', invoiceNumber: '', paymentRef: 'PO-OCT-001', status: 'recorded' },
      { reportId: report.id, date: '2025-01-15', expenditureType: 'Capital', accountCode: 'E006', voteCode: '401', description: 'Road construction and maintenance', amount: 18_500_000, supplier: 'Madera Construction Co.', invoiceNumber: 'INV-MCC-001', paymentRef: 'CAP-JAN-001', status: 'recorded' },
      { reportId: report.id, date: '2025-03-31', expenditureType: 'Grants', accountCode: 'E006', voteCode: '201', description: 'Quarterly grants to lower local governments', amount: 12_900_000, supplier: '', invoiceNumber: '', paymentRef: 'GRANT-Q3-001', status: 'recorded' },
    ],
  })
  console.log('  ✓ ExpenditureEntries: 5')

  // ════════════════════════════════════════════════════════════
  // 25. APPROPRIATION ACCOUNTS (5)
  // ════════════════════════════════════════════════════════════
  await prisma.appropriationAccount.createMany({
    data: [
      { reportId: report.id, voteCode: '101', voteName: 'Compensation of Employees', initialAppropriation: 295_000_000, supplementaryAppropriation: 0, virementIn: 0, virementOut: 0, revisedAppropriation: 295_000_000, actualExpenditure: 285_000_000, savingsOverSpent: 10_000_000, status: 'approved' },
      { reportId: report.id, voteCode: '102', voteName: 'Goods and Services', initialAppropriation: 150_000_000, supplementaryAppropriation: 0, virementIn: 2_000_000, virementOut: 5_000_000, revisedAppropriation: 147_000_000, actualExpenditure: 142_500_000, savingsOverSpent: 4_500_000, status: 'approved' },
      { reportId: report.id, voteCode: '401', voteName: 'Capital Development', initialAppropriation: 50_000_000, supplementaryAppropriation: 5_000_000, virementIn: 5_000_000, virementOut: 0, revisedAppropriation: 60_000_000, actualExpenditure: 48_600_000, savingsOverSpent: 11_400_000, status: 'approved' },
      { reportId: report.id, voteCode: '201', voteName: 'Grants and Transfers', initialAppropriation: 40_000_000, supplementaryAppropriation: 0, virementIn: 0, virementOut: 0, revisedAppropriation: 40_000_000, actualExpenditure: 38_700_000, savingsOverSpent: 1_300_000, status: 'approved' },
      { reportId: report.id, voteCode: '301', voteName: 'Social Benefits', initialAppropriation: 24_000_000, supplementaryAppropriation: 0, virementIn: 0, virementOut: 0, revisedAppropriation: 24_000_000, actualExpenditure: 22_800_000, savingsOverSpent: 1_200_000, status: 'approved' },
    ],
  })
  console.log('  ✓ AppropriationAccounts: 5')

  // ════════════════════════════════════════════════════════════
  // 26. INTER-FUND TRANSFERS (2)
  // ════════════════════════════════════════════════════════════
  await prisma.interFundTransfer.createMany({
    data: [
      { reportId: report.id, fromFund: 'Consolidated Fund', toFund: 'Development Fund', amount: 18_500_000, description: 'Capital development funding for road projects', authBy: 'CFO Sarah N. Achieng', transferDate: '2024-10-01', status: 'completed' },
      { reportId: report.id, fromFund: 'Consolidated Fund', toFund: 'Road Fund', amount: 8_500_000, description: 'Road maintenance earmarked transfer', authBy: 'PS Finance', transferDate: '2025-01-15', status: 'completed' },
    ],
  })
  console.log('  ✓ InterFundTransfers: 2')

  // ════════════════════════════════════════════════════════════
  // 27. ASSET REGISTER (6)
  // ════════════════════════════════════════════════════════════
  await prisma.assetRegister.createMany({
    data: [
      { reportId: report.id, assetNumber: 'PPE-001', description: 'Administration Block - Madera HQ', category: 'ppe', location: 'Madera Town', dateAcquired: '2010-07-01', acquisitionCost: 85_000_000, accumulatedDep: 42_500_000, netBookValue: 42_500_000, depreciationRate: 5, usefulLife: 20, disposalDate: '', disposalValue: 0, status: 'active' },
      { reportId: report.id, assetNumber: 'PPE-002', description: 'Motor Vehicles - Fleet (5 units)', category: 'ppe', location: 'Madera HQ', dateAcquired: '2021-01-15', acquisitionCost: 45_000_000, accumulatedDep: 18_000_000, netBookValue: 27_000_000, depreciationRate: 20, usefulLife: 5, disposalDate: '', disposalValue: 0, status: 'active' },
      { reportId: report.id, assetNumber: 'PPE-003', description: 'IT Equipment and Servers', category: 'ppe', location: 'Madera HQ Server Room', dateAcquired: '2022-07-01', acquisitionCost: 12_500_000, accumulatedDep: 6_250_000, netBookValue: 6_250_000, depreciationRate: 25, usefulLife: 4, disposalDate: '', disposalValue: 0, status: 'active' },
      { reportId: report.id, assetNumber: 'PPE-004', description: 'Road Network Infrastructure', category: 'ppe', location: 'Madera District', dateAcquired: '2015-07-01', acquisitionCost: 250_000_000, accumulatedDep: 75_000_000, netBookValue: 175_000_000, depreciationRate: 4, usefulLife: 25, disposalDate: '', disposalValue: 0, status: 'active' },
      { reportId: report.id, assetNumber: 'PPE-005', description: 'Office Furniture and Fittings', category: 'ppe', location: 'Madera HQ', dateAcquired: '2020-07-01', acquisitionCost: 8_000_000, accumulatedDep: 4_000_000, netBookValue: 4_000_000, depreciationRate: 12.5, usefulLife: 8, disposalDate: '', disposalValue: 0, status: 'active' },
      { reportId: report.id, assetNumber: 'PPE-006', description: 'Generator Set 500KVA', category: 'ppe', location: 'Madera HQ', dateAcquired: '2019-03-01', acquisitionCost: 15_000_000, accumulatedDep: 9_000_000, netBookValue: 6_000_000, depreciationRate: 15, usefulLife: 7, disposalDate: '', disposalValue: 0, status: 'active' },
    ],
  })
  console.log('  ✓ AssetRegister: 6')

  // ════════════════════════════════════════════════════════════
  // 28. INVENTORY ITEMS (4)
  // ════════════════════════════════════════════════════════════
  await prisma.inventoryItem.createMany({
    data: [
      { reportId: report.id, itemCode: 'INV-001', itemDescription: 'Office Stationery (reams)', unitOfMeasure: 'Ream', unitCost: 25_000, openingQty: 200, openingValue: 5_000_000, receivedQty: 150, receivedValue: 3_750_000, issuedQty: 180, issuedValue: 4_500_000, closingQty: 170, closingValue: 4_250_000 },
      { reportId: report.id, itemCode: 'INV-002', itemDescription: 'Printer Cartridges', unitOfMeasure: 'Unit', unitCost: 350_000, openingQty: 15, openingValue: 5_250_000, receivedQty: 10, receivedValue: 3_500_000, issuedQty: 12, issuedValue: 4_200_000, closingQty: 13, closingValue: 4_550_000 },
      { reportId: report.id, itemCode: 'INV-003', itemDescription: 'Fuel (Diesel) Litres', unitOfMeasure: 'Litre', unitCost: 5_800, openingQty: 5000, openingValue: 29_000_000, receivedQty: 8000, receivedValue: 46_400_000, issuedQty: 10000, issuedValue: 58_000_000, closingQty: 3000, closingValue: 17_400_000 },
      { reportId: report.id, itemCode: 'INV-004', itemDescription: 'Cleaning Supplies', unitOfMeasure: 'Pack', unitCost: 120_000, openingQty: 30, openingValue: 3_600_000, receivedQty: 20, receivedValue: 2_400_000, issuedQty: 35, issuedValue: 4_200_000, closingQty: 15, closingValue: 1_800_000 },
    ],
  })
  console.log('  ✓ Inventory: 4 items')

  // ════════════════════════════════════════════════════════════
  // 29. DEBTORS (3)
  // ════════════════════════════════════════════════════════════
  await prisma.debtorAccount.createMany({
    data: [
      { reportId: report.id, name: 'Ministry of Health - Inter-agency', accountCode: 'A003', invoiceNumber: 'INV-MOH-001', invoiceAmount: 5_200_000, amountPaid: 2_000_000, balance: 3_200_000, invoiceDate: '2024-11-15', dueDate: '2025-02-15', agingDays: 60, status: 'overdue' },
      { reportId: report.id, name: 'Uganda Revenue Authority - WHT Refund', accountCode: 'A003', invoiceNumber: 'INV-URA-001', invoiceAmount: 1_800_000, amountPaid: 0, balance: 1_800_000, invoiceDate: '2025-01-20', dueDate: '2025-04-20', agingDays: 30, status: 'outstanding' },
      { reportId: report.id, name: 'Madera District Education Office', accountCode: 'A003', invoiceNumber: 'INV-MDE-001', invoiceAmount: 3_500_000, amountPaid: 3_500_000, balance: 0, invoiceDate: '2024-09-01', dueDate: '2024-12-01', agingDays: 0, status: 'settled' },
    ],
  })
  console.log('  ✓ Debtors: 3')

  // ════════════════════════════════════════════════════════════
  // 30. CREDITORS (3)
  // ════════════════════════════════════════════════════════════
  await prisma.creditorAccount.createMany({
    data: [
      { reportId: report.id, name: 'Madera Construction Co.', accountCode: 'L001', invoiceNumber: 'INV-MCC-001', invoiceAmount: 22_000_000, amountPaid: 18_500_000, balance: 3_500_000, invoiceDate: '2024-09-01', dueDate: '2025-03-01', agingDays: 45, status: 'outstanding' },
      { reportId: report.id, name: 'Water & Sanitation Engineering', accountCode: 'L001', invoiceNumber: 'INV-WSE-001', invoiceAmount: 15_000_000, amountPaid: 0, balance: 15_000_000, invoiceDate: '2025-01-15', dueDate: '2025-04-15', agingDays: 0, status: 'outstanding' },
      { reportId: report.id, name: 'Office Solutions Ltd', accountCode: 'L001', invoiceNumber: 'INV-OS-001', invoiceAmount: 8_500_000, amountPaid: 8_500_000, balance: 0, invoiceDate: '2024-09-20', dueDate: '2024-10-20', agingDays: 0, status: 'settled' },
    ],
  })
  console.log('  ✓ Creditors: 3')

  // ════════════════════════════════════════════════════════════
  // 31. CLOSING ENTRIES (year-end - 3)
  // ════════════════════════════════════════════════════════════
  await prisma.closingEntry.createMany({
    data: [
      { reportId: report.id, accountCode: 'R001', accountName: 'Taxes', entryType: 'closing', debit: 125_000_000, credit: 0, narration: 'Close revenue accounts to SFP', entryDate: '2025-06-30', posted: true },
      { reportId: report.id, accountCode: 'E001', accountName: 'Compensation of Employees', entryType: 'closing', debit: 0, credit: 285_000_000, narration: 'Close expense accounts to SFP', entryDate: '2025-06-30', posted: true },
      { reportId: report.id, accountCode: 'NA01', accountName: 'Accumulated Surplus', entryType: 'closing', debit: 0, credit: 46_600_000, narration: 'Transfer surplus to net assets', entryDate: '2025-06-30', posted: true },
    ],
  })
  console.log('  ✓ ClosingEntries: 3')

  // ════════════════════════════════════════════════════════════
  // 32. AUDIT LOG (5)
  // ════════════════════════════════════════════════════════════
  await prisma.auditLog.createMany({
    data: [
      { reportId: report.id, action: 'create', field: 'report', oldValue: '', newValue: 'FinancialReport created', userId: 'system', timestamp: new Date('2024-07-01') },
      { reportId: report.id, action: 'update', field: 'trialBalance.R001.creditCurrent', oldValue: '0', newValue: '125000000', userId: 'accountant-a', timestamp: new Date('2024-09-15') },
      { reportId: report.id, action: 'update', field: 'votebook.101.actualExpenditure', oldValue: '0', newValue: '285000000', userId: 'accountant-a', timestamp: new Date('2025-06-15') },
      { reportId: report.id, action: 'approve', field: 'workflow.preparer', oldValue: 'draft', newValue: 'review', userId: 'accountant-a', timestamp: new Date('2025-07-20') },
      { reportId: report.id, action: 'generate', field: 'statements', oldValue: '', newValue: 'IPSAS statements generated', userId: 'system', timestamp: new Date('2025-07-25') },
    ],
  })
  console.log('  ✓ AuditLog: 5 entries')

  // ════════════════════════════════════════════════════════════
  // FINAL: Set report status to complete
  // ════════════════════════════════════════════════════════════
  await prisma.financialReport.update({
    where: { id: report.id },
    data: { status: 'complete' },
  })
  console.log('\n  ✓ Report status → "complete"')

  console.log('\n🎉 Comprehensive seed complete!')
  console.log(`   Report ID: ${report.id}`)
  console.log('   Entity: Madera Local Government')
  console.log('   Period: FY 2024-25 (30 June 2025)')
  console.log('   Modules populated: ALL 16')
  console.log('   Total records: 100+')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
