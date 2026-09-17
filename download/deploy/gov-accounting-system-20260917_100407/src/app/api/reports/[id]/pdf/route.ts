import { db } from '@/lib/db';
import { generateStatements, fmtNum, TBEntry, SupplementaryInput } from '@/lib/financial-engine';
import { NextResponse } from 'next/server';

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

    const supp = report.supplementary;
    const suppInput: SupplementaryInput | undefined = supp ? {
      advancesRecovered: supp.advancesRecovered,
      advancesRecoveredPrior: supp.advancesRecoveredPrior,
      depositsReceived: supp.depositsReceived,
      depositsReceivedPrior: supp.depositsReceivedPrior,
      transfersToTreasury: supp.transfersToTreasury,
      transfersToTreasuryPrior: supp.transfersToTreasuryPrior,
      revenueInKindTaxWaivers: supp.revenueInKindTaxWaivers,
      revenueInKindTaxWaiversPrior: supp.revenueInKindTaxWaiversPrior,
    } : undefined;

    const stmts = generateStatements(tbEntries, suppInput);

    const PDFDocument = await import('pdfkit');
    const PDFDocumentClass = PDFDocument.default || PDFDocument;

    const doc = new PDFDocumentClass({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 45, right: 45 },
      bufferPages: true,
      info: {
        Title: `${report.entityName} - Financial Statements ${report.periodLabel}`,
        Author: 'FinStatements Pro',
        Subject: 'Government Financial Statements',
      },
    });

    const FONT_DIR = '/usr/share/fonts/truetype';
    const fontRegular = `${FONT_DIR}/english/Tinos-Regular.ttf`;
    const fontBold = `${FONT_DIR}/english/Tinos-Bold.ttf`;
    doc.registerFont('Regular', fontRegular);
    doc.registerFont('Bold', fontBold);

    const W = 505;
    const COL_NOTE = 28;
    const COL_CURRENT = (W - COL_NOTE) / 2;
    const COL_PRIOR = (W - COL_NOTE) / 2;
    const LEFT_M = 45;

    function fmt(n: number): string {
      if (n === 0) return '-';
      if (n < 0) return `(${Math.abs(n).toLocaleString('en-US')})`;
      return n.toLocaleString('en-US');
    }

    function getPriorPeriodLabel(currentLabel: string): string {
      const match = currentLabel.match(/(\d{1,2}\s+\w+\s+)(\d{4})/);
      if (match) return match[1] + (parseInt(match[2]) - 1);
      return 'Prior Year';
    }

    // Statement narrations for IPSAS compliance
    const narrations: Record<string, string> = {
      'Statement of Financial Performance':
        'This statement presents the revenue and expenses of the entity for the reporting period. Revenue from non-exchange transactions includes taxes, grants, and transfers received from other government entities.',
      'Statement of Financial Position':
        'This statement presents the assets, liabilities, and net assets of the entity as at the reporting date. Assets and liabilities are classified into current and non-current based on the expected timing of realisation or settlement.',
      'Statement of Changes in Net Assets':
        'This statement explains the changes in the entity\'s net assets during the reporting period, including the surplus or deficit for the year and any balance sheet adjustments.',
      'Cash Flow Statement':
        'This statement presents the cash inflows and outflows classified by operating, investing, and financing activities, in accordance with IPSAS 2.',
      'Revenue Reconciliation for Cash Flow Statement':
        'This reconciliation explains the difference between revenue as recognised in the Statement of Financial Performance and revenue received for cash flow statement purposes, including adjustments for non-cash items.',
      'Cash Reconciliation':
        'This reconciliation confirms that the cash and cash equivalents balance per the Statement of Financial Position agrees with the cash flow statement.',
      'Budget Variance Analysis':
        'This analysis compares the actual revenue and expenses against the initial and adjusted (revised) budget amounts, highlighting significant variances.',
    };

    function addStatementTable(
      title: string,
      lines: { label: string; noteRef: string; current: number; prior: number; isBold?: boolean; isTotal?: boolean; isSection?: boolean; indent?: number }[],
      startY?: number
    ) {
      let y = startY || doc.y;
      const pageH = doc.page.height - 80;

      // Title
      if (y > pageH - 80) { doc.addPage(); y = 40; }
      doc.font('Bold').fontSize(11).fillColor('#1e293b')
        .text(title, LEFT_M, y, { width: W });
      y = doc.y + 4;

      // Narration text
      if (narrations[title]) {
        doc.font('Regular').fontSize(7.5).fillColor('#64748b')
          .text(narrations[title], LEFT_M, y, { width: W, lineGap: 1 });
        y = doc.y + 6;
      }

      // Column headers
      if (y > pageH - 40) { doc.addPage(); y = 40; }
      doc.rect(LEFT_M, y, W, 18).fill('#1e293b');
      doc.font('Bold').fontSize(7).fillColor('#ffffff')
        .text('Notes', LEFT_M + 4, y + 5, { width: COL_NOTE - 8, align: 'left' })
        .text(`Actual ${report.periodLabel} (${report.currency})`, LEFT_M + COL_NOTE + 4, y + 5, { width: COL_CURRENT - 8, align: 'left' })
        .text(`Actual ${getPriorPeriodLabel(report.periodLabel)} (${report.currency})`, LEFT_M + COL_NOTE + COL_CURRENT + 4, y + 5, { width: COL_PRIOR - 8, align: 'left' });
      y += 20;

      for (const line of lines) {
        if (y > pageH - 20) { doc.addPage(); y = 40; }

        const indent = (line.indent || 0) * 12;

        if (line.isSection) {
          doc.rect(LEFT_M, y, W, 16).fill('#f8fafc');
          doc.font('Bold').fontSize(7).fillColor('#64748b')
            .text(line.label.toUpperCase(), LEFT_M + indent + 4, y + 4, { width: W - indent - 8 });
          y += 18;
        } else if (line.isTotal) {
          doc.rect(LEFT_M, y, W, 16).fill('#f1f5f9');
          doc.font('Bold').fontSize(8).fillColor('#0f172a')
            .text(line.noteRef, LEFT_M + 4, y + 4, { width: COL_NOTE - 8, align: 'left' })
            .text(line.label, LEFT_M + COL_NOTE + indent + 4, y + 4, { width: COL_CURRENT + COL_PRIOR - indent - 12 })
            .text(fmt(line.current), LEFT_M + COL_NOTE + COL_CURRENT, y + 4, { width: COL_PRIOR - 8, align: 'right' })
            .text(fmt(line.prior), LEFT_M + W - COL_PRIOR + 4, y + 4, { width: COL_PRIOR - 8, align: 'right' });
          doc.moveTo(LEFT_M, y + 17).lineTo(LEFT_M + W, y + 17).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
          y += 20;
        } else {
          doc.font(line.isBold ? 'Bold' : 'Regular').fontSize(8).fillColor('#1e293b')
            .text(line.noteRef || '', LEFT_M + 4, y + 3, { width: COL_NOTE - 8, align: 'left' })
            .text(line.label, LEFT_M + COL_NOTE + indent + 4, y + 3, { width: COL_CURRENT + COL_PRIOR - indent - 12 })
            .text(fmt(line.current), LEFT_M + COL_NOTE + COL_CURRENT, y + 3, { width: COL_PRIOR - 8, align: 'right' })
            .text(fmt(line.prior), LEFT_M + W - COL_PRIOR + 4, y + 3, { width: COL_PRIOR - 8, align: 'right' });
          y += 16;
        }
      }
      return y;
    }

    // ===== NOTES TO THE FINANCIAL STATEMENTS =====
    function addNotesToFinancialStatements() {
      doc.addPage();
      let y = 40;
      const pageH = doc.page.height - 80;

      doc.font('Bold').fontSize(12).fillColor('#1e293b')
        .text('Notes to the Financial Statements', LEFT_M, y, { width: W });
      y = doc.y + 8;

      // Note 1: Statement of Accounting Policies
      if (supp?.accountingPolicies) {
        if (y > pageH - 60) { doc.addPage(); y = 40; }
        doc.font('Bold').fontSize(9).fillColor('#1e293b')
          .text('1. Statement of Accounting Policies', LEFT_M, y, { width: W });
        y = doc.y + 4;
        doc.font('Bold').fontSize(8).fillColor('#475569')
          .text(`Basis of Preparation: ${supp.ipsasBasis || 'IPSAS Accrual Basis'}`, LEFT_M, y, { width: W });
        y = doc.y + 4;
        doc.font('Regular').fontSize(7.5).fillColor('#334155')
          .text(supp.accountingPolicies, LEFT_M, y, { width: W, lineGap: 1.5 });
        y = doc.y + 10;
      } else {
        if (y > pageH - 60) { doc.addPage(); y = 40; }
        doc.font('Bold').fontSize(9).fillColor('#1e293b')
          .text('1. Statement of Accounting Policies', LEFT_M, y, { width: W });
        y = doc.y + 4;
        doc.font('Regular').fontSize(7.5).fillColor('#334155')
          .text('The financial statements have been prepared in accordance with International Public Sector Accounting Standards (IPSAS) on the accrual basis of accounting. The entity\'s reporting period ends on 30 June.', LEFT_M, y, { width: W, lineGap: 1.5 });
        y = doc.y + 10;
      }

      // Note 2: Employee Benefits
      if (supp && (supp.employeeCount > 0 || supp.salariesWages > 0)) {
        if (y > pageH - 80) { doc.addPage(); y = 40; }
        doc.font('Bold').fontSize(9).fillColor('#1e293b')
          .text('9. Employee Benefits', LEFT_M, y, { width: W });
        y = doc.y + 4;
        doc.font('Regular').fontSize(7.5).fillColor('#334155')
          .text(`The entity had ${supp.employeeCount} employees during the reporting period. Employee benefits comprise:`, LEFT_M, y, { width: W, lineGap: 1.5 });
        y = doc.y + 2;

        const empLines = [
          ['Salaries and wages', supp.salariesWages],
          ['Pension contributions', supp.pensionContributions],
          ['Payroll taxes', supp.payrollTaxes],
          ['Other employee benefits', supp.otherEmployeeBenefits],
        ];
        for (const [label, val] of empLines) {
          if (y > pageH - 20) { doc.addPage(); y = 40; }
          doc.font('Regular').fontSize(7.5).fillColor('#334155')
            .text(`${label}: ${report.currency} ${fmt(val)}`, LEFT_M + 12, y, { width: W - 12 });
          y = doc.y + 2;
        }
        y += 6;
      }

      // Note 3: PPE
      if (supp && (supp.ppeOpeningCurrent > 0 || supp.ppeAdditionsCurrent > 0)) {
        if (y > pageH - 80) { doc.addPage(); y = 40; }
        doc.font('Bold').fontSize(9).fillColor('#1e293b')
          .text('26. Property, Plant and Equipment', LEFT_M, y, { width: W });
        y = doc.y + 4;
        doc.font('Regular').fontSize(7.5).fillColor('#334155')
          .text('Property, plant and equipment are measured at cost less accumulated depreciation and impairment losses. Depreciation is calculated using the ' + (supp.depreciationMethod || 'straight-line') + ' method at a rate of ' + (supp.depreciationRate || 'N/A') + '%.', LEFT_M, y, { width: W, lineGap: 1.5 });
        y = doc.y + 6;

        // PPE Movement table
        if (y > pageH - 80) { doc.addPage(); y = 40; }
        doc.rect(LEFT_M, y, W, 16).fill('#1e293b');
        doc.font('Bold').fontSize(7).fillColor('#ffffff')
          .text('', LEFT_M + 4, y + 5, { width: 120 })
          .text(`Current Year (${report.currency})`, LEFT_M + 130, y + 5, { width: 120 })
          .text(`Prior Year (${report.currency})`, LEFT_M + 260, y + 5, { width: 120 });
        y += 20;

        const ppeRows = [
          ['Opening balance', supp.ppeOpeningCurrent, supp.ppeOpeningPrior],
          ['Additions', supp.ppeAdditionsCurrent, supp.ppeAdditionsPrior],
          ['Disposals', supp.ppeDisposalsCurrent, supp.ppeDisposalsPrior],
        ];
        for (const [label, cur, prior] of ppeRows) {
          doc.font('Regular').fontSize(7.5).fillColor('#1e293b')
            .text(label, LEFT_M + 4, y + 3, { width: 120 })
            .text(fmt(cur), LEFT_M + 130, y + 3, { width: 120, align: 'right' })
            .text(fmt(prior), LEFT_M + 260, y + 3, { width: 120, align: 'right' });
          y += 16;
        }
        y += 6;
      }

      // Note 4: Exchange Rates
      if (supp && (supp.exchangeRateUSD !== 1 || supp.exchangeRateEUR !== 1)) {
        if (y > pageH - 60) { doc.addPage(); y = 40; }
        doc.font('Bold').fontSize(9).fillColor('#1e293b')
          .text('Exchange Rates', LEFT_M, y, { width: W });
        y = doc.y + 4;
        doc.font('Regular').fontSize(7.5).fillColor('#334155')
          .text(`Exchange rates at reporting date: 1 USD = ${supp.exchangeRateUSD} ${report.currency}, 1 EUR = ${supp.exchangeRateEUR} ${report.currency}`, LEFT_M, y, { width: W, lineGap: 1.5 });
        y = doc.y + 10;
      }

      // Note 5: Prior Year Adjustments
      if (supp && supp.priorYearAdjustments !== 0) {
        if (y > pageH - 60) { doc.addPage(); y = 40; }
        doc.font('Bold').fontSize(9).fillColor('#1e293b')
          .text('Prior Year Adjustments', LEFT_M, y, { width: W });
        y = doc.y + 4;
        doc.font('Regular').fontSize(7.5).fillColor('#334155')
          .text(`Prior year adjustments totaling ${report.currency} ${fmt(supp.priorYearAdjustments)} have been recognised in the current period.`, LEFT_M, y, { width: W, lineGap: 1.5 });
        y = doc.y + 10;
      }

      // Note 6: Revaluation Reserves & Transfers to UCF
      if (supp && (supp.revaluationReserves !== 0 || supp.transfersToUCF !== 0)) {
        if (y > pageH - 60) { doc.addPage(); y = 40; }
        doc.font('Bold').fontSize(9).fillColor('#1e293b')
          .text('Reserves and Transfers', LEFT_M, y, { width: W });
        y = doc.y + 4;
        const lines: string[] = [];
        if (supp.revaluationReserves !== 0) lines.push(`Revaluation reserves: ${report.currency} ${fmt(supp.revaluationReserves)}`);
        if (supp.transfersToUCF !== 0) lines.push(`Transfers to the Uniform Classification Framework (UCF): ${report.currency} ${fmt(supp.transfersToUCF)}`);
        doc.font('Regular').fontSize(7.5).fillColor('#334155')
          .text(lines.join('. ') + '.', LEFT_M, y, { width: W, lineGap: 1.5 });
        y = doc.y + 10;
      }

      return y;
    }

    // ===== SIGNATORY BLOCK =====
    function addSignatoryBlock() {
      doc.addPage();
      let y = 40;

      doc.font('Bold').fontSize(12).fillColor('#1e293b')
        .text('Signatories', LEFT_M, y, { width: W });
      y = doc.y + 16;

      const sigDate = supp?.signatoryDate || report.periodLabel;

      const signatories = [
        { title: 'Accounting Officer', name: supp?.accountingOfficer || '' },
        { title: 'Chief Finance Officer', name: supp?.chiefFinanceOfficer || '' },
        { title: 'Head of Internal Audit', name: supp?.internalAuditHead || '' },
      ];

      const colW = W / 3;
      for (let i = 0; i < signatories.length; i++) {
        const x = LEFT_M + i * colW;
        doc.font('Bold').fontSize(8).fillColor('#475569')
          .text(signatories[i].title, x, y, { width: colW - 10 });
        doc.moveDown(2);

        // Signature line
        if (signatories[i].name) {
          doc.moveTo(x, doc.y).lineTo(x + colW - 20, doc.y).lineWidth(0.5).strokeColor('#94a3b8').stroke();
          doc.moveDown(0.5);
          doc.font('Bold').fontSize(8).fillColor('#1e293b')
            .text(signatories[i].name, x, doc.y, { width: colW - 10 });
          doc.moveDown(0.5);
        } else {
          doc.moveTo(x, doc.y).lineTo(x + colW - 20, doc.y).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
          doc.moveDown(0.5);
          doc.font('Regular').fontSize(7).fillColor('#94a3b8')
            .text('(Name not provided)', x, doc.y, { width: colW - 10 });
          doc.moveDown(0.5);
        }

        doc.font('Regular').fontSize(7).fillColor('#64748b')
          .text(`Date: ${sigDate}`, x, doc.y, { width: colW - 10 });
      }
    }

    // ===== PAGE 1: COVER =====
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f172a');
    doc.font('Bold').fontSize(28).fillColor('#ffffff')
      .text(report.entityName, 45, 180, { width: W, align: 'center' });
    doc.moveDown(0.5);
    doc.font('Regular').fontSize(14).fillColor('#94a3b8')
      .text('Financial Statements', 45, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.3);
    doc.font('Regular').fontSize(12).fillColor('#64748b')
      .text(`For the Year Ended ${report.periodLabel}`, 45, doc.y, { width: W, align: 'center' });
    if (report.versionLabel) {
      doc.moveDown(0.3);
      doc.font('Regular').fontSize(10).fillColor('#64748b')
        .text(`Version: ${report.versionLabel}`, 45, doc.y, { width: W, align: 'center' });
    }
    doc.moveDown(2);
    doc.moveTo(45 + W * 0.3, doc.y).lineTo(45 + W * 0.7, doc.y).lineWidth(1).strokeColor('#10b981').stroke();
    doc.moveDown(1);
    doc.font('Regular').fontSize(9).fillColor('#475569')
      .text('Prepared in accordance with International Public Sector Accounting Standards (IPSAS)', 45, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.5);
    doc.font('Regular').fontSize(8).fillColor('#475569')
      .text('Generated by FinStatements Pro', 45, doc.y, { width: W, align: 'center' });

    // ===== STATEMENT OF FINANCIAL PERFORMANCE =====
    doc.addPage();
    addStatementTable(
      'Statement of Financial Performance',
      [
        ...stmts.sfp.revenueLines,
        { label: '', noteRef: '', current: 0, prior: 0 },
        ...stmts.sfp.expenseLines,
        { label: '', noteRef: '', current: 0, prior: 0 },
        { label: 'Surplus/ Deficit for the year', noteRef: '', current: stmts.sfp.surplusCurrent, prior: stmts.sfp.surplusPrior, isBold: true, isTotal: true },
      ]
    );

    // ===== STATEMENT OF FINANCIAL POSITION =====
    doc.addPage();
    addStatementTable('Statement of Financial Position', [
      ...stmts.balanceSheet.assetLines,
      { label: '', noteRef: '', current: 0, prior: 0 },
      ...stmts.balanceSheet.liabilityLines,
    ]);

    // ===== STATEMENT OF CHANGES IN NET ASSETS =====
    doc.addPage();
    addStatementTable('Statement of Changes in Net Assets', [
      { label: 'At 1 July - net assets last financial year (B/F)', noteRef: '', current: stmts.changesInNA.bfCurrent, prior: stmts.changesInNA.bfPrior },
      { label: 'Less: Transfers to the UCF account (Prev year balances)', noteRef: '32', current: supp?.transfersToUCF ?? 0, prior: 0 },
      { label: '+/- Balance sheet adjustments', noteRef: '32', current: stmts.changesInNA.adjustmentsCurrent, prior: stmts.changesInNA.adjustmentsPrior },
      { label: 'Revaluation reserves', noteRef: '32', current: supp?.revaluationReserves ?? 0, prior: 0 },
      { label: 'Add: Surplus/(deficit) for the year', noteRef: '', current: stmts.changesInNA.surplusCurrent, prior: stmts.changesInNA.surplusPrior, isBold: true },
      { label: 'Closing net assets/ Net worth', noteRef: '', current: stmts.changesInNA.closingCurrent, prior: stmts.changesInNA.closingPrior, isBold: true, isTotal: true },
    ]);

    // ===== CASH FLOW STATEMENT =====
    doc.addPage();
    const cfLines: { label: string; noteRef: string; current: number; prior: number; isBold?: boolean; isTotal?: boolean; isSection?: boolean; indent?: number }[] = [];
    cfLines.push({ label: 'CASH FLOWS FROM OPERATING ACTIVITIES', noteRef: '', current: 0, prior: 0, isSection: true });
    cfLines.push({ label: 'Revenue from operating activities', noteRef: '', current: stmts.cashFlow.operatingRevenueCurrent, prior: stmts.cashFlow.operatingRevenuePrior, indent: 1 });
    cfLines.push({ label: 'Payments', noteRef: '', current: 0, prior: 0, indent: 1, isBold: true });
    for (const p of stmts.cashFlow.payments) {
      cfLines.push({ label: p.label, noteRef: p.noteRef, current: p.current, prior: p.prior, indent: 2 });
    }
    cfLines.push({ label: 'Net cash inflows/(outflows) from operating activities', noteRef: '', current: stmts.cashFlow.netOperatingCurrent, prior: stmts.cashFlow.netOperatingPrior, isBold: true, isTotal: true });
    cfLines.push({ label: '', noteRef: '', current: 0, prior: 0 });
    cfLines.push({ label: 'CASH FLOWS FROM INVESTING ACTIVITIES', noteRef: '', current: 0, prior: 0, isSection: true });
    for (const inv of stmts.cashFlow.investing) {
      cfLines.push({ label: inv.label, noteRef: '', current: inv.current, prior: inv.prior, indent: 1 });
    }
    cfLines.push({ label: 'Net cash inflows/(outflows) from investing activities', noteRef: '', current: stmts.cashFlow.netInvestingCurrent, prior: stmts.cashFlow.netInvestingPrior, isBold: true });
    cfLines.push({ label: '', noteRef: '', current: 0, prior: 0 });
    cfLines.push({ label: 'CASH FLOWS FROM FINANCING ACTIVITIES', noteRef: '', current: 0, prior: 0, isSection: true });
    cfLines.push({ label: 'Net cash flows from financing activities', noteRef: '', current: 0, prior: 0, indent: 1 });
    cfLines.push({ label: '', noteRef: '', current: 0, prior: 0 });
    cfLines.push({ label: 'Net increase (decrease) in cash and cash equivalents', noteRef: '', current: stmts.cashFlow.netChangeCurrent, prior: stmts.cashFlow.netChangePrior, isBold: true, isTotal: true });

    addStatementTable('Cash Flow Statement', cfLines);

    // ===== REVENUE RECONCILIATION =====
    doc.addPage();
    const rr = stmts.revenueReconciliation;
    addStatementTable('Revenue Reconciliation for Cash Flow Statement', [
      { label: 'Total Revenue as per Statement of Financial Performance', noteRef: '', current: rr.sfpRevenueCurrent, prior: rr.sfpRevenuePrior },
      { label: 'Add: Advances recovered during the year', noteRef: '', current: rr.advancesRecoveredCurrent, prior: rr.advancesRecoveredPrior, indent: 1 },
      { label: 'Revenue receivable collected during the period', noteRef: '', current: rr.revenueReceivableCollectedCurrent, prior: rr.revenueReceivableCollectedPrior, indent: 1 },
      { label: 'Deposits received', noteRef: '', current: rr.depositsReceivedCurrent, prior: rr.depositsReceivedPrior, indent: 1 },
      { label: 'Total Revenue', noteRef: '', current: rr.totalRevenueCFCurrent, prior: rr.totalRevenueCFPrior, isBold: true },
      { label: 'Less: Grants received in Kind', noteRef: '', current: rr.grantsInKindCurrent, prior: rr.grantsInKindPrior, indent: 1 },
      { label: 'Revenue in Kind (Tax waivers)', noteRef: '', current: supp?.revenueInKindTaxWaivers ?? 0, prior: supp?.revenueInKindTaxWaiversPrior ?? 0, indent: 1 },
      { label: 'Transfers to Treasury', noteRef: '20', current: rr.transfersToTreasuryCurrent, prior: rr.transfersToTreasuryPrior, indent: 1 },
      { label: 'Revenue Receivable for the reporting period', noteRef: '', current: rr.revenueReceivablePeriodCurrent, prior: rr.revenueReceivablePeriodPrior },
      { label: 'Total revenue received for Cash flow statement purposes', noteRef: '', current: rr.totalRevenueCashFlowCurrent, prior: rr.totalRevenueCashFlowPrior, isBold: true, isTotal: true },
    ]);

    // ===== CASH RECONCILIATION =====
    addStatementTable('Cash Reconciliation', [
      { label: 'Cash and cash equivalents at the beginning of the year', noteRef: '', current: stmts.cashReconciliation.openingCashCurrent, prior: stmts.cashReconciliation.openingCashPrior },
      { label: 'Net increase (decrease) of cash from the Cash flow Statement', noteRef: '', current: stmts.cashReconciliation.netChangeCurrent, prior: stmts.cashReconciliation.netChangePrior },
      { label: 'Cash and cash equivalents at the end of the year', noteRef: '', current: stmts.cashReconciliation.closingCashCurrent, prior: stmts.cashReconciliation.closingCashPrior, isBold: true, isTotal: true },
    ]);

    // ===== BUDGET VARIANCE =====
    if (stmts.budgetVariance.length > 0) {
      doc.addPage();
      const bvLines: { label: string; noteRef: string; current: number; prior: number; isBold?: boolean; isTotal?: boolean; isSection?: boolean; indent?: number }[] = [];
      bvLines.push({ label: 'BUDGET VARIANCE ANALYSIS', noteRef: '', current: 0, prior: 0, isSection: true });
      for (const bv of stmts.budgetVariance) {
        bvLines.push({ label: bv.label, noteRef: '', current: bv.actual, prior: bv.revisedBudget, indent: 1 });
      }
      addStatementTable('Budget Variance Analysis', bvLines);
    }

    // ===== NOTES TO THE FINANCIAL STATEMENTS =====
    addNotesToFinancialStatements();

    // ===== SIGNATORY BLOCK =====
    addSignatoryBlock();

    // ===== VALIDATION ERRORS =====
    if (stmts.validationErrors.length > 0) {
      doc.addPage();
      doc.font('Bold').fontSize(11).fillColor('#991b1b')
        .text('Validation Warnings', LEFT_M, 40, { width: W });
      doc.moveDown(0.5);
      for (const err of stmts.validationErrors) {
        doc.font('Regular').fontSize(8).fillColor('#7f1d1d')
          .text(`- ${err}`, LEFT_M + 8, doc.y, { width: W - 16 });
        doc.moveDown(0.3);
      }
    }

    // Finalize
    doc.end();

    const pdfBuffer = (doc as unknown as { buffer: Buffer }).buffer;
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.entityName.replace(/\s+/g, '_')}_Financial_Statements_${report.periodEnd}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
