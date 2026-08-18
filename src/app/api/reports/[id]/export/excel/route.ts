import { db } from '@/lib/db';
import { generateStatements, TBEntry } from '@/lib/financial-engine';
import { NextResponse } from 'next/server';

interface SheetData {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await db.financialReport.findUnique({
      where: { id },
      include: { entries: { orderBy: { sortOrder: 'asc' } }, supplementary: true },
    });
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const tbEntries: TBEntry[] = report.entries.map(e => ({
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
    const priorLabel = getPriorPeriodLabel(report.periodLabel);
    const sheets: SheetData[] = [];

    // Sheet 1: Trial Balance
    sheets.push({
      name: 'Trial Balance',
      headers: ['Account Code', 'Account Name', 'Classification', 'Category', 'Note Ref', `Debit ${report.periodLabel}`, `Credit ${report.periodLabel}`, `Debit ${priorLabel}`, `Credit ${priorLabel}`, 'Budget Initial', 'Budget Adjusted'],
      rows: report.entries.map(e => [
        e.accountCode, e.accountName, e.classification, e.category, e.noteRef,
        e.debitCurrent, e.creditCurrent, e.debitPrior, e.creditPrior,
        e.budgetInitial, e.budgetAdjusted,
      ]),
    });

    // Sheet 2: Statement of Financial Performance
    sheets.push({
      name: 'Financial Performance',
      headers: ['Note', 'Line Item', `${report.periodLabel} (${report.currency})`, `${priorLabel} (${report.currency})`],
      rows: [
        ...stmts.sfp.revenueLines.map(l => [l.noteRef, l.label, l.current, l.prior]),
        ['', '', 0, 0],
        ...stmts.sfp.expenseLines.map(l => [l.noteRef, l.label, l.current, l.prior]),
        ['', 'Surplus/Deficit for the year', stmts.sfp.surplusCurrent, stmts.sfp.surplusPrior],
      ],
    });

    // Sheet 3: Statement of Financial Position
    sheets.push({
      name: 'Financial Position',
      headers: ['Note', 'Line Item', `${report.periodLabel} (${report.currency})`, `${priorLabel} (${report.currency})`],
      rows: [
        ...stmts.balanceSheet.assetLines.map(l => [l.noteRef, l.label, l.current, l.prior]),
        ['', '', 0, 0],
        ...stmts.balanceSheet.liabilityLines.map(l => [l.noteRef, l.label, l.current, l.prior]),
      ],
    });

    // Sheet 4: Changes in Net Assets
    sheets.push({
      name: 'Changes in Net Assets',
      headers: ['Line Item', `${report.periodLabel} (${report.currency})`, `${priorLabel} (${report.currency})`],
      rows: [
        ['At 1 July - net assets last financial year (B/F)', stmts.changesInNA.bfCurrent, stmts.changesInNA.bfPrior],
        ['+/- Balance sheet adjustments', stmts.changesInNA.adjustmentsCurrent, stmts.changesInNA.adjustmentsPrior],
        ['Add: Surplus/(deficit) for the year', stmts.changesInNA.surplusCurrent, stmts.changesInNA.surplusPrior],
        ['Closing net assets/ Net worth', stmts.changesInNA.closingCurrent, stmts.changesInNA.closingPrior],
      ],
    });

    // Sheet 5: Cash Flow Statement
    const cfRows: (string | number)[][] = [
      ['CASH FLOWS FROM OPERATING ACTIVITIES', '', ''],
      ['Revenue from operating activities', stmts.cashFlow.operatingRevenueCurrent, stmts.cashFlow.operatingRevenuePrior],
      ['Payments', '', ''],
    ];
    for (const p of stmts.cashFlow.payments) {
      cfRows.push([p.label, p.current, p.prior]);
    }
    cfRows.push(['Net cash from operating activities', stmts.cashFlow.netOperatingCurrent, stmts.cashFlow.netOperatingPrior]);
    cfRows.push(['', '', '']);
    cfRows.push(['CASH FLOWS FROM INVESTING ACTIVITIES', '', '']);
    for (const inv of stmts.cashFlow.investing) {
      cfRows.push([inv.label, inv.current, inv.prior]);
    }
    cfRows.push(['Net cash from investing activities', stmts.cashFlow.netInvestingCurrent, stmts.cashFlow.netInvestingPrior]);
    cfRows.push(['', '', '']);
    cfRows.push(['Net increase/(decrease) in cash', stmts.cashFlow.netChangeCurrent, stmts.cashFlow.netChangePrior]);

    sheets.push({
      name: 'Cash Flow',
      headers: ['Line Item', `${report.periodLabel} (${report.currency})`, `${priorLabel} (${report.currency})`],
      rows: cfRows,
    });

    // Sheet 6: Budget Variance
    if (stmts.budgetVariance.length > 0) {
      sheets.push({
        name: 'Budget Variance',
        headers: ['Line Item', 'Initial Budget', 'Adjustments', 'Revised Budget', 'Actual', 'Variance', 'Variance %'],
        rows: stmts.budgetVariance.map(bv => [
          bv.label, bv.initialBudget, bv.adjustments, bv.revisedBudget,
          bv.actual, bv.variance, Math.round(bv.variancePercent * 100) / 100,
        ]),
      });
    }

    // Sheet 7: Supplementary Data
    if (report.supplementary) {
      const s = report.supplementary;
      sheets.push({
        name: 'Supplementary',
        headers: ['Field', 'Current Year', 'Prior Year'],
        rows: [
          ['Advances Recovered', s.advancesRecovered, s.advancesRecoveredPrior],
          ['Deposits Received', s.depositsReceived, s.depositsReceivedPrior],
          ['Transfers to Treasury', s.transfersToTreasury, s.transfersToTreasuryPrior],
          ['Revenue in Kind (Tax Waivers)', s.revenueInKindTaxWaivers, s.revenueInKindTaxWaiversPrior],
          ['PPE Opening Balance', s.ppeOpeningCurrent, s.ppeOpeningPrior],
          ['PPE Additions', s.ppeAdditionsCurrent, s.ppeAdditionsPrior],
          ['PPE Disposals', s.ppeDisposalsCurrent, s.ppeDisposalsPrior],
          ['Depreciation Rate (%)', s.depreciationRate, ''],
          ['Depreciation Method', s.depreciationMethod, ''],
          ['Employee Count', s.employeeCount, ''],
          ['Salaries & Wages', s.salariesWages, ''],
          ['Pension Contributions', s.pensionContributions, ''],
          ['Payroll Taxes', s.payrollTaxes, ''],
          ['Other Employee Benefits', s.otherEmployeeBenefits, ''],
          ['Prior Year Adjustments', s.priorYearAdjustments, ''],
          ['Revaluation Reserves', s.revaluationReserves, ''],
          ['Transfers to UCF', s.transfersToUCF, ''],
          ['Exchange Rate (USD)', s.exchangeRateUSD, ''],
          ['Exchange Rate (EUR)', s.exchangeRateEUR, ''],
          ['', '', ''],
          ['Accounting Officer', s.accountingOfficer, ''],
          ['Chief Finance Officer', s.chiefFinanceOfficer, ''],
          ['Internal Audit Head', s.internalAuditHead, ''],
          ['Signatory Date', s.signatoryDate, ''],
          ['IPSAS Basis', s.ipsasBasis, ''],
          ['Accounting Policies', s.accountingPolicies, ''],
        ],
      });
    }

    // Audit log
    return NextResponse.json({
      reportInfo: {
        entityName: report.entityName,
        periodLabel: report.periodLabel,
        currency: report.currency,
        version: report.version,
        versionLabel: report.versionLabel,
      },
      sheets,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function getPriorPeriodLabel(currentLabel: string): string {
  const match = currentLabel.match(/(\d{1,2}\s+\w+\s+)(\d{4})/);
  if (match) return match[1] + (parseInt(match[2]) - 1);
  return 'Prior Year';
}
