import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== VERIFYING ALL FEATURES ===\n')

  // Get the seeded report
  const report = await prisma.financialReport.findFirst({ where: { entityName: 'Madera Local Government' } })
  if (!report) { console.error('No report found!'); process.exit(1) }
  console.log(`Report: ${report.entityName} - ${report.fiscalYear} (ID: ${report.id})\n`)

  // Test each module
  const tests: { module: string; count: number; expected: number; ok: boolean }[] = []

  const check = async (module: string, expected: number, fn: () => Promise<any[]>) => {
    const data = await fn()
    const ok = data.length >= expected
    tests.push({ module, count: data.length, expected, ok })
    return data
  }

  // Core
  await check('TrialBalance', 37, async () => prisma.trialBalanceEntry.findMany({ where: { reportId: report.id } }))
  await check('Supplementary', 1, async () => { const d = await prisma.supplementaryData.findUnique({ where: { reportId: report.id } }); return d ? [d] : [] })
  await check('ApprovalWorkflow', 1, async () => { const d = await prisma.approvalWorkflow.findUnique({ where: { reportId: report.id } }); return d ? [d] : [] })
  await check('AuditLog', 1, async () => prisma.auditLog.findMany({ where: { reportId: report.id } }))

  // Modules
  await check('Funds', 3, async () => prisma.fund.findMany({ where: { reportId: report.id } }))
  await check('Votebook', 7, async () => prisma.votebookEntry.findMany({ where: { reportId: report.id } }))
  await check('Warrants', 4, async () => prisma.warrant.findMany({ where: { reportId: report.id } }))
  await check('Virements', 3, async () => prisma.virement.findMany({ where: { reportId: report.id } }))
  await check('Commitments', 5, async () => prisma.commitment.findMany({ where: { reportId: report.id } }))
  await check('Procurement', 4, async () => prisma.procurementPlan.findMany({ where: { reportId: report.id } }))
  await check('JournalEntry', 4, async () => prisma.journalEntry.findMany({ where: { reportId: report.id } }))
  await check('PettyCash', 6, async () => prisma.pettyCashTransaction.findMany({ where: { reportId: report.id } }))
  await check('Imprest', 3, async () => prisma.imprest.findMany({ where: { reportId: report.id } }))
  await check('CashbookEntry', 8, async () => prisma.cashbookEntry.findMany({ where: { reportId: report.id } }))
  await check('CashbookOB', 2, async () => prisma.cashbookOpeningBalance.findMany({ where: { reportId: report.id } }))
  await check('BankRecon', 1, async () => prisma.bankReconciliation.findMany({ where: { reportId: report.id } }))
  await check('LedgerAccount', 3, async () => prisma.ledgerAccount.findMany({ where: { reportId: report.id } }))
  await check('Payroll', 5, async () => prisma.payrollEntry.findMany({ where: { reportId: report.id } }))
  await check('Tax', 4, async () => prisma.taxEntry.findMany({ where: { reportId: report.id } }))
  await check('Grants', 3, async () => prisma.grantEntry.findMany({ where: { reportId: report.id } }))
  await check('Debt', 3, async () => prisma.debtEntry.findMany({ where: { reportId: report.id } }))
  await check('Cheques', 5, async () => prisma.chequeEntry.findMany({ where: { reportId: report.id } }))
  await check('Suspense', 3, async () => prisma.suspenseAccount.findMany({ where: { reportId: report.id } }))
  await check('Revenue', 5, async () => prisma.revenueEntry.findMany({ where: { reportId: report.id } }))
  await check('Expenditure', 5, async () => prisma.expenditureEntry.findMany({ where: { reportId: report.id } }))
  await check('Appropriation', 5, async () => prisma.appropriationAccount.findMany({ where: { reportId: report.id } }))
  await check('InterFund', 2, async () => prisma.interFundTransfer.findMany({ where: { reportId: report.id } }))
  await check('Assets', 5, async () => prisma.assetRegister.findMany({ where: { reportId: report.id } }))
  await check('Inventory', 3, async () => prisma.inventoryItem.findMany({ where: { reportId: report.id } }))
  await check('Debtors', 4, async () => prisma.debtorAccount.findMany({ where: { reportId: report.id } }))
  await check('Creditors', 4, async () => prisma.creditorAccount.findMany({ where: { reportId: report.id } }))
  await check('ClosingEntries', 4, async () => prisma.closingEntry.findMany({ where: { reportId: report.id } }))
  await check('YearEndChecklist', 15, async () => prisma.yearEndChecklist.findMany({ where: { reportId: report.id } }))
  await check('Notifications', 3, async () => prisma.notification.findMany({ where: { reportId: report.id } }))

  // Print results
  console.log('Module Verification Results:')
  console.log('-'.repeat(60))
  let totalPass = 0
  for (const t of tests) {
    const status = t.ok ? 'PASS' : 'FAIL'
    if (t.ok) totalPass++
    console.log(`  ${status}  ${t.module}: ${t.count} records (expected >= ${t.expected})`)
  }
  console.log('-'.repeat(60))
  console.log(`Passed: ${totalPass}/${tests.length}\n`)

  // ════════════════════════════════════════════════════════════════
  // CARRY FORWARD TEST
  // ════════════════════════════════════════════════════════════════
  console.log('=== TESTING CARRY FORWARD ===\n')

  const sourceEntries = await prisma.trialBalanceEntry.findMany({ where: { reportId: report.id }, orderBy: { sortOrder: 'asc' } })
  const supplementary = await prisma.supplementaryData.findUnique({ where: { reportId: report.id } })

  // Create new report via carry forward
  const newReport = await prisma.financialReport.create({
    data: {
      entityName: report.entityName,
      periodEnd: '2026-06-30',
      periodLabel: '30 June 2026',
      currency: report.currency,
      status: 'draft',
      version: 1,
      versionLabel: 'Original',
      fiscalYear: '2025-26',
      parentVersionId: report.id,
    },
  })

  // Carry forward trial balance entries
  for (const entry of sourceEntries) {
    const isBalanceSheet = ['asset', 'liability', 'equity'].includes(entry.classification)
    await prisma.trialBalanceEntry.create({
      data: {
        reportId: newReport.id,
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        classification: entry.classification,
        category: entry.category,
        noteRef: entry.noteRef,
        debitCurrent: isBalanceSheet ? entry.debitCurrent : 0,
        creditCurrent: isBalanceSheet ? entry.creditCurrent : 0,
        debitPrior: entry.debitCurrent,
        creditPrior: entry.creditCurrent,
        budgetInitial: entry.budgetInitial,
        budgetAdjusted: entry.budgetAdjusted,
        sortOrder: entry.sortOrder,
      },
    })
  }

  // Carry forward supplementary
  if (supplementary) {
    await prisma.supplementaryData.create({
      data: {
        reportId: newReport.id,
        ppeOpeningCurrent: supplementary.ppeOpeningCurrent + supplementary.ppeAdditionsCurrent - supplementary.ppeDisposalsCurrent,
        ppeAdditionsCurrent: 0, ppeDisposalsCurrent: 0,
        ppeOpeningPrior: supplementary.ppeOpeningCurrent,
        ppeAdditionsPrior: supplementary.ppeAdditionsCurrent,
        ppeDisposalsPrior: supplementary.ppeDisposalsCurrent,
        depreciationRate: supplementary.depreciationRate,
        depreciationMethod: supplementary.depreciationMethod,
        employeeCount: supplementary.employeeCount,
        salariesWages: 0, pensionContributions: 0, payrollTaxes: 0, otherEmployeeBenefits: 0,
        advancesRecovered: 0, advancesRecoveredPrior: supplementary.advancesRecovered,
        depositsReceived: 0, depositsReceivedPrior: supplementary.depositsReceived,
        transfersToTreasury: 0, transfersToTreasuryPrior: supplementary.transfersToTreasury,
        revenueInKindTaxWaivers: 0, revenueInKindTaxWaiversPrior: supplementary.revenueInKindTaxWaivers,
        priorYearAdjustments: 0, revaluationReserves: supplementary.revaluationReserves, transfersToUCF: 0,
        accountingOfficer: supplementary.accountingOfficer,
        chiefFinanceOfficer: supplementary.chiefFinanceOfficer,
        internalAuditHead: supplementary.internalAuditHead,
        signatoryDate: '', ipsasBasis: supplementary.ipsasBasis,
        accountingPolicies: supplementary.accountingPolicies,
        exchangeRateUSD: supplementary.exchangeRateUSD,
        exchangeRateEUR: supplementary.exchangeRateEUR,
      },
    })
  }

  // Carry forward other modules
  const sourceFunds = await prisma.fund.findMany({ where: { reportId: report.id } })
  for (const f of sourceFunds) {
    await prisma.fund.create({ data: { reportId: newReport.id, name: f.name, fundType: f.fundType, code: f.code, description: f.description, isActive: f.isActive, openingBalance: f.openingBalance } })
  }

  const sourceVotebook = await prisma.votebookEntry.findMany({ where: { reportId: report.id } })
  for (const v of sourceVotebook) {
    await prisma.votebookEntry.create({ data: { reportId: newReport.id, voteCode: v.voteCode, voteName: v.voteName, originalAppropriation: v.totalAppropriation, supplementaryAppropriation: 0, totalAppropriation: v.totalAppropriation, actualExpenditure: 0, balance: v.totalAppropriation, commitDate: '', notes: `Carried forward. Previous expenditure: ${v.actualExpenditure}` } })
  }

  const sourceAssets = await prisma.assetRegister.findMany({ where: { reportId: report.id, status: 'active' } })
  for (const a of sourceAssets) {
    await prisma.assetRegister.create({ data: { reportId: newReport.id, assetNumber: a.assetNumber, description: a.description, category: a.category, location: a.location, dateAcquired: a.dateAcquired, acquisitionCost: a.acquisitionCost, accumulatedDep: a.accumulatedDep, netBookValue: a.netBookValue, depreciationRate: a.depreciationRate, usefulLife: a.usefulLife, status: 'active' } })
  }

  const sourceLedger = await prisma.ledgerAccount.findMany({ where: { reportId: report.id } })
  for (const la of sourceLedger) {
    await prisma.ledgerAccount.create({ data: { reportId: newReport.id, accountCode: la.accountCode, accountName: la.accountName, accountType: la.accountType, openingDebit: la.closingDebit, openingCredit: la.closingCredit, totalDebit: 0, totalCredit: 0, closingDebit: la.closingDebit, closingCredit: la.closingCredit } })
  }

  // Verify carry forward
  const newEntries = await prisma.trialBalanceEntry.findMany({ where: { reportId: newReport.id }, orderBy: { sortOrder: 'asc' } })
  const newSupp = await prisma.supplementaryData.findUnique({ where: { reportId: newReport.id } })
  const newFunds = await prisma.fund.findMany({ where: { reportId: newReport.id } })
  const newVotebook = await prisma.votebookEntry.findMany({ where: { reportId: newReport.id } })
  const newAssets = await prisma.assetRegister.findMany({ where: { reportId: newReport.id } })
  const newLedger = await prisma.ledgerAccount.findMany({ where: { reportId: newReport.id } })

  console.log('Carry Forward Verification:')
  console.log('-'.repeat(60))

  // Check: Balance sheet accounts carry forward with current values
  const cashEntry = newEntries.find(e => e.accountCode === 'A001')
  console.log(`  ${cashEntry && cashEntry.debitCurrent === 89200000 && cashEntry.debitPrior === 89200000 ? 'PASS' : 'FAIL'}  Cash (A001): current=${cashEntry?.debitCurrent}, prior=${cashEntry?.debitPrior} (both should be 89,200,000)`)

  // Check: Revenue accounts have 0 current, prior = old current
  const taxEntry = newEntries.find(e => e.accountCode === 'R001')
  console.log(`  ${taxEntry && taxEntry.creditCurrent === 0 && taxEntry.creditPrior === 125000000 ? 'PASS' : 'FAIL'}  Taxes (R001): current=${taxEntry?.creditCurrent}, prior=${taxEntry?.creditPrior} (current=0, prior=125,000,000)`)

  // Check: Expense accounts have 0 current, prior = old current
  const compEntry = newEntries.find(e => e.accountCode === 'E001')
  console.log(`  ${compEntry && compEntry.debitCurrent === 0 && compEntry.debitPrior === 285000000 ? 'PASS' : 'FAIL'}  Compensation (E001): current=${compEntry?.debitCurrent}, prior=${compEntry?.debitPrior} (current=0, prior=285,000,000)`)

  // Check: Votebook expenditures reset to 0
  const vbComp = newVotebook.find(v => v.voteCode === '101')
  console.log(`  ${vbComp && vbComp.actualExpenditure === 0 && vbComp.totalAppropriation === 295000000 ? 'PASS' : 'FAIL'}  Votebook 101: expenditure=${vbComp?.actualExpenditure}, appropriation=${vbComp?.totalAppropriation}`)

  // Check: Assets carried forward
  console.log(`  ${newAssets.length === 4 ? 'PASS' : 'FAIL'}  Active assets carried forward: ${newAssets.length} (expected 4)`)

  // Check: Ledger closing becomes opening
  const cashLedger = newLedger.find(l => l.accountCode === 'A001')
  console.log(`  ${cashLedger && cashLedger.openingDebit === 89200000 ? 'PASS' : 'FAIL'}  Ledger A001 opening: ${cashLedger?.openingDebit} (should be 89,200,000)`)

  // Check: Funds carried forward
  console.log(`  ${newFunds.length === 3 ? 'PASS' : 'FAIL'}  Funds carried forward: ${newFunds.length}`)

  // Check: PPE opening balance calculated correctly
  if (newSupp) {
    const expectedPpeOpening = 172000000 + 18500000 - 5500000  // 185,000,000
    console.log(`  ${newSupp.ppeOpeningCurrent === expectedPpeOpening ? 'PASS' : 'FAIL'}  PPE opening: ${newSupp.ppeOpeningCurrent} (expected ${expectedPpeOpening})`)
  }

  // ════════════════════════════════════════════════════════════════
  // EDITABILITY TEST
  // ════════════════════════════════════════════════════════════════
  console.log('\n=== TESTING EDITABILITY ===\n')

  // Test: Update a trial balance entry
  const firstEntry = await prisma.trialBalanceEntry.findFirst({ where: { reportId: report.id, accountCode: 'A001' } })
  if (firstEntry) {
    const updated = await prisma.trialBalanceEntry.update({
      where: { id: firstEntry.id },
      data: { debitCurrent: 90000000 },
    })
    console.log(`  ${updated.debitCurrent === 90000000 ? 'PASS' : 'FAIL'}  TB entry update: A001 debit changed to 90,000,000`)
    // Revert
    await prisma.trialBalanceEntry.update({ where: { id: firstEntry.id }, data: { debitCurrent: 89200000 } })
  }

  // Test: Update supplementary data
  if (supplementary) {
    const updated = await prisma.supplementaryData.update({
      where: { reportId: report.id },
      data: { employeeCount: 350 },
    })
    console.log(`  ${updated.employeeCount === 350 ? 'PASS' : 'FAIL'}  Supplementary update: employeeCount changed to 350`)
    await prisma.supplementaryData.update({ where: { reportId: report.id }, data: { employeeCount: 342 } })
  }

  // Test: Create a new votebook entry
  const newVb = await prisma.votebookEntry.create({
    data: { reportId: report.id, voteCode: '601', voteName: 'Emergency Response', originalAppropriation: 5000000, supplementaryAppropriation: 0, totalAppropriation: 5000000, actualExpenditure: 0, balance: 5000000, commitDate: '2025-01-01', notes: 'Emergency response vote' },
  })
  console.log(`  ${newVb.voteCode === '601' ? 'PASS' : 'FAIL'}  Create new votebook entry: ${newVb.voteCode}`)
  await prisma.votebookEntry.delete({ where: { id: newVb.id } })

  // Test: Delete a commitment
  const testCommit = await prisma.commitment.create({
    data: { reportId: report.id, poNumber: 'PO-TEST', voteCode: '102', supplier: 'Test', description: 'Test entry', commitDate: '2025-01-01', committedAmount: 100000, expendedAmount: 0, balance: 100000, status: 'open' },
  })
  await prisma.commitment.delete({ where: { id: testCommit.id } })
  const deleted = await prisma.commitment.findUnique({ where: { id: testCommit.id } })
  console.log(`  ${deleted === null ? 'PASS' : 'FAIL'}  Delete commitment entry`)

  // Test: Update approval workflow
  const approval = await prisma.approvalWorkflow.findUnique({ where: { reportId: report.id } })
  if (approval) {
    const updated = await prisma.approvalWorkflow.update({
      where: { reportId: report.id },
      data: { currentStep: 'approved', reviewerApprovedAt: new Date('2025-07-20') },
    })
    console.log(`  ${updated.currentStep === 'approved' ? 'PASS' : 'FAIL'}  Approval workflow update: step changed to 'approved'`)
    await prisma.approvalWorkflow.update({ where: { reportId: report.id }, data: { currentStep: 'review', reviewerApprovedAt: null } })
  }

  console.log('\n=== ALL TESTS COMPLETE ===')

  // Clean up the carry-forward test report
  await prisma.trialBalanceEntry.deleteMany({ where: { reportId: newReport.id } })
  await prisma.supplementaryData.deleteMany({ where: { reportId: newReport.id } })
  await prisma.fund.deleteMany({ where: { reportId: newReport.id } })
  await prisma.votebookEntry.deleteMany({ where: { reportId: newReport.id } })
  await prisma.assetRegister.deleteMany({ where: { reportId: newReport.id } })
  await prisma.ledgerTransaction.deleteMany({ where: { account: { reportId: newReport.id } } })
  await prisma.ledgerAccount.deleteMany({ where: { reportId: newReport.id } })
  await prisma.financialReport.delete({ where: { id: newReport.id } })
  console.log('\nCarry-forward test report cleaned up.')
}

main()
  .catch((e) => { console.error('Test failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
