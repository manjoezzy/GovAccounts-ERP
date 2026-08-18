import { db } from '@/lib/db';
import { generateStatements } from '@/lib/financial-engine';
import { NextResponse } from 'next/server';

interface ComplianceItem {
  id: string;
  requirement: string;
  ipsasReference: string;
  status: 'met' | 'not_met' | 'partial' | 'not_applicable';
  details: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await db.financialReport.findUnique({
      where: { id },
      include: {
        entries: { orderBy: { sortOrder: 'asc' } },
        supplementary: true,
      },
    });
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const checklist: ComplianceItem[] = [];
    const entries = report.entries;
    const supp = report.supplementary;

    const tbEntries = entries.map(e => ({
      accountCode: e.accountCode,
      accountName: e.accountName,
      classification: e.classification,
      category: e.category,
      noteRef: e.noteRef,
      debitCurrent: e.debitCurrent,
      creditCurrent: e.creditCurrent,
      debitPrior: e.debitPrior,
      creditPrior: e.creditPrior,
      budgetInitial: e.budgetInitial,
      budgetAdjusted: e.budgetAdjusted,
    }));

    const stmts = generateStatements(tbEntries);

    // 1. Trial balance balances
    const totalDebitCurrent = entries.reduce((s, e) => s + e.debitCurrent, 0);
    const totalCreditCurrent = entries.reduce((s, e) => s + e.creditCurrent, 0);
    const totalDebitPrior = entries.reduce((s, e) => s + e.debitPrior, 0);
    const totalCreditPrior = entries.reduce((s, e) => s + e.creditPrior, 0);
    const tbBalancedCurrent = Math.abs(totalDebitCurrent - totalCreditCurrent) <= 1;
    const tbBalancedPrior = Math.abs(totalDebitPrior - totalCreditPrior) <= 1;

    checklist.push({
      id: 'tb_balance',
      requirement: 'Trial balance must balance (debits = credits) for both current and prior years',
      ipsasReference: 'IPSAS 1',
      status: (tbBalancedCurrent && tbBalancedPrior) ? 'met' : 'not_met',
      details: tbBalancedCurrent && tbBalancedPrior
        ? 'Trial balance is balanced for both years'
        : `Current year diff: ${totalDebitCurrent - totalCreditCurrent}, Prior year diff: ${totalDebitPrior - totalCreditPrior}`,
    });

    // 2. Statement of Financial Performance present
    checklist.push({
      id: 'sfp_present',
      requirement: 'Statement of Financial Performance (Income Statement) must be presented',
      ipsasReference: 'IPSAS 1',
      status: entries.length > 0 ? 'met' : 'not_met',
      details: entries.length > 0
        ? `Revenue lines: ${stmts.sfp.revenueLines.length}, Expense lines: ${stmts.sfp.expenseLines.length}`
        : 'No trial balance entries found',
    });

    // 3. Statement of Financial Position present
    checklist.push({
      id: 'sfp_bs_present',
      requirement: 'Statement of Financial Position (Balance Sheet) must be presented',
      ipsasReference: 'IPSAS 1',
      status: stmts.balanceSheet.assetLines.length > 0 || stmts.balanceSheet.liabilityLines.length > 0 ? 'met' : 'not_met',
      details: `Asset lines: ${stmts.balanceSheet.assetLines.length}, Liability lines: ${stmts.balanceSheet.liabilityLines.length}`,
    });

    // 4. Comparative figures provided
    const hasPriorData = entries.some(e => e.debitPrior !== 0 || e.creditPrior !== 0);
    checklist.push({
      id: 'comparative_figures',
      requirement: 'Comparative prior period figures must be presented for all amounts',
      ipsasReference: 'IPSAS 1.112',
      status: hasPriorData ? 'met' : 'not_met',
      details: hasPriorData
        ? 'Prior year data is present in trial balance entries'
        : 'No prior year figures detected - IPSAS requires comparative information',
    });

    // 5. Note references populated
    const entriesWithNotes = entries.filter(e => e.noteRef && e.noteRef.trim() !== '');
    const entriesRequiringNotes = entries.filter(e => {
      const cat = e.category;
      return cat && cat !== 'other_expenses' && cat !== 'sub_exchange';
    });
    const noteCoverage = entriesRequiringNotes.length > 0
      ? entriesWithNotes.length / entriesRequiringNotes.length
      : 0;
    checklist.push({
      id: 'note_references',
      requirement: 'Note references should be populated for significant line items',
      ipsasReference: 'IPSAS 1.113',
      status: noteCoverage > 0.8 ? 'met' : noteCoverage > 0.5 ? 'partial' : 'not_met',
      details: `${entriesWithNotes.length} of ${entriesRequiringNotes.length} entries have note references (${(noteCoverage * 100).toFixed(0)}%)`,
    });

    // 6. Budget data completeness
    const entriesWithBudget = entries.filter(e => e.budgetInitial > 0 || e.budgetAdjusted > 0);
    const revenueExpenseEntries = entries.filter(e =>
      e.classification.startsWith('revenue') ||
      e.classification.startsWith('expense') ||
      e.category === 'compensation' ||
      e.category === 'goods_services'
    );
    const budgetCoverage = revenueExpenseEntries.length > 0
      ? entriesWithBudget.length / revenueExpenseEntries.length
      : 0;
    checklist.push({
      id: 'budget_data',
      requirement: 'Budget figures (initial and adjusted) should be provided for revenue and expense items',
      ipsasReference: 'IPSAS 24',
      status: budgetCoverage > 0.7 ? 'met' : budgetCoverage > 0.3 ? 'partial' : 'not_met',
      details: `${entriesWithBudget.length} of ${revenueExpenseEntries.length} revenue/expense entries have budget data (${(budgetCoverage * 100).toFixed(0)}%)`,
    });

    // 7. Cash flow statement
    checklist.push({
      id: 'cash_flow',
      requirement: 'Statement of Cash Flows must be presented',
      ipsasReference: 'IPSAS 2',
      status: 'met',
      details: `Operating: ${stmts.cashFlow.netOperatingCurrent}, Investing: ${stmts.cashFlow.netInvestingCurrent}, Net change: ${stmts.cashFlow.netChangeCurrent}`,
    });

    // 8. Statement of Changes in Net Assets
    checklist.push({
      id: 'changes_in_na',
      requirement: 'Statement of Changes in Net Assets / Equity must be presented',
      ipsasReference: 'IPSAS 1',
      status: 'met',
      details: `Opening: ${stmts.changesInNA.bfCurrent}, Closing: ${stmts.changesInNA.closingCurrent}`,
    });

    // 9. Accounting policies disclosed
    checklist.push({
      id: 'accounting_policies',
      requirement: 'Accounting policies must be disclosed (basis of preparation, measurement, depreciation)',
      ipsasReference: 'IPSAS 1.118-1.125',
      status: supp?.accountingPolicies && supp.accountingPolicies.trim().length > 10 ? 'met' : 'not_met',
      details: supp?.accountingPolicies
        ? `Policies disclosed: ${supp.accountingPolicies.length} characters`
        : 'No accounting policies text provided in supplementary data',
    });

    // 10. Signatory blocks
    checklist.push({
      id: 'signatories',
      requirement: 'Signatory blocks with Accounting Officer, CFO, and Internal Audit Head must be completed',
      ipsasReference: 'IPSAS 1',
      status: (supp?.accountingOfficer && supp?.chiefFinanceOfficer && supp?.internalAuditHead) ? 'met' : 'partial',
      details: `Accounting Officer: ${supp?.accountingOfficer || 'MISSING'}, CFO: ${supp?.chiefFinanceOfficer || 'MISSING'}, Internal Audit: ${supp?.internalAuditHead || 'MISSING'}`,
    });

    // 11. Employee benefits note
    checklist.push({
      id: 'employee_benefits',
      requirement: 'Employee benefits disclosure (salaries, pensions, payroll taxes, count)',
      ipsasReference: 'IPSAS 25',
      status: supp && (supp.employeeCount > 0 || supp.salariesWages > 0) ? 'met' : 'not_met',
      details: supp
        ? `Employees: ${supp.employeeCount}, Salaries: ${supp.salariesWages}, Pensions: ${supp.pensionContributions}`
        : 'No employee data in supplementary section',
    });

    // 12. PPE disclosure
    checklist.push({
      id: 'ppe_disclosure',
      requirement: 'Property, Plant & Equipment disclosure (opening, additions, disposals, depreciation rate/method)',
      ipsasReference: 'IPSAS 17',
      status: supp && (supp.ppeOpeningCurrent > 0 || supp.ppeAdditionsCurrent > 0) ? 'met' : 'not_met',
      details: supp
        ? `Opening: ${supp.ppeOpeningCurrent}, Additions: ${supp.ppeAdditionsCurrent}, Disposals: ${supp.ppeDisposalsCurrent}, Rate: ${supp.depreciationRate}% (${supp.depreciationMethod})`
        : 'No PPE supplementary data provided',
    });

    // 13. Revenue reconciliation completeness
    checklist.push({
      id: 'revenue_reconciliation',
      requirement: 'Revenue reconciliation for cash flow purposes must tie to SFP revenue',
      ipsasReference: 'IPSAS 2',
      status: stmts.validationErrors.some(e => e.includes('Cross-reference')) ? 'not_met' : 'met',
      details: stmts.validationErrors.some(e => e.includes('Cross-reference'))
        ? stmts.validationErrors.find(e => e.includes('Cross-reference'))!
        : 'Revenue reconciliation ties correctly to cash flow operating revenue',
    });

    // 14. Cash reconciliation
    checklist.push({
      id: 'cash_reconciliation',
      requirement: 'Cash and cash equivalents reconciliation must balance',
      ipsasReference: 'IPSAS 2',
      status: stmts.validationErrors.some(e => e.includes('Cash reconciliation')) ? 'not_met' : 'met',
      details: stmts.validationErrors.some(e => e.includes('Cash reconciliation'))
        ? stmts.validationErrors.find(e => e.includes('Cash reconciliation'))!
        : `Opening: ${stmts.cashReconciliation.openingCashCurrent} + Change: ${stmts.cashReconciliation.netChangeCurrent} = Closing: ${stmts.cashReconciliation.closingCashCurrent}`,
    });

    // 15. IPSAS basis stated
    checklist.push({
      id: 'ipsas_basis',
      requirement: 'The basis of accounting (IPSAS Accrual) must be stated',
      ipsasReference: 'IPSAS 1.112',
      status: supp?.ipsasBasis && supp.ipsasBasis.trim().length > 0 ? 'met' : 'not_met',
      details: `Basis: ${supp?.ipsasBasis || 'NOT SPECIFIED'}`,
    });

    const metCount = checklist.filter(c => c.status === 'met').length;
    const totalCount = checklist.filter(c => c.status !== 'not_applicable').length;
    const score = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

    return NextResponse.json({
      reportId: id,
      score,
      metCount,
      totalCount,
      checklist,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
