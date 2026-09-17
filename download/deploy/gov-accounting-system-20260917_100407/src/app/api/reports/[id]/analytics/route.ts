import { db } from '@/lib/db';
import { generateStatements, TBEntry } from '@/lib/financial-engine';
import { NextResponse } from 'next/server';

interface Anomaly {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  detail: string;
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
    const anomalies: Anomaly[] = [];

    function sumCategory(cat: string, year: 'current' | 'prior'): number {
      const isRevenue = year === 'current'
        ? (e: TBEntry) => e.classification.startsWith('revenue') ? e.creditCurrent : e.debitCurrent
        : (e: TBEntry) => e.classification.startsWith('revenue') ? e.creditPrior : e.debitPrior;
      return tbEntries.filter(e => e.category === cat).reduce((s, e) => s + isRevenue(e), 0);
    }

    const totalRevenueCurrent = stmts.sfp.totalRevenueCurrent;
    const totalRevenuePrior = stmts.sfp.totalRevenuePrior;
    const totalExpensesCurrent = stmts.sfp.totalExpensesCurrent;
    const totalExpensesPrior = stmts.sfp.totalExpensesPrior;
    const surplusCurrent = stmts.sfp.surplusCurrent;
    const surplusPrior = stmts.sfp.surplusPrior;

    const totalAssetsCurrent = stmts.balanceSheet.totalAssetsCurrent;
    const totalAssetsPrior = stmts.balanceSheet.totalAssetsPrior;
    const totalLiabilitiesCurrent = stmts.balanceSheet.totalLiabilitiesCurrent;
    const totalLiabilitiesPrior = stmts.balanceSheet.totalLiabilitiesPrior;

    const cashCurrent = sumCategory('cash', 'current');
    const cashPrior = sumCategory('cash', 'prior');
    const receivablesCurrent = sumCategory('receivables_current', 'current');
    const receivablesPrior = sumCategory('receivables_current', 'prior');
    const payablesCurrent = sumCategory('payables_current', 'current');
    const payablesPrior = sumCategory('payables_current', 'prior');

    // === RATIOS ===

    // Surplus ratio = surplus / total revenue
    const surplusRatio = totalRevenueCurrent !== 0
      ? (surplusCurrent / totalRevenueCurrent) * 100
      : 0;

    // Expense ratio = total expenses / total revenue
    const expenseRatio = totalRevenueCurrent !== 0
      ? (totalExpensesCurrent / totalRevenueCurrent) * 100
      : 0;

    // Current ratio = current assets / current liabilities
    const currentAssets = sumCategory('cash', 'current')
      + sumCategory('receivables_current', 'current')
      + sumCategory('prepayments_current', 'current')
      + sumCategory('inventories', 'current');
    const currentLiabilities = sumCategory('payables_current', 'current')
      + sumCategory('deposits_current', 'current')
      + sumCategory('short_borrowings', 'current')
      + sumCategory('pensions_current', 'current');
    const currentRatio = currentLiabilities !== 0 ? currentAssets / currentLiabilities : 0;

    // Cash ratio = cash / current liabilities
    const cashRatio = currentLiabilities !== 0 ? cashCurrent / currentLiabilities : 0;

    // Receivables days = (receivables / total revenue) * 365
    const receivablesDays = totalRevenueCurrent !== 0
      ? (receivablesCurrent / totalRevenueCurrent) * 365
      : 0;

    // Payables days = (payables / total expenses) * 365
    const payablesDays = totalExpensesCurrent !== 0
      ? (payablesCurrent / totalExpensesCurrent) * 365
      : 0;

    // Dependency ratio = transfers & grants / total revenue
    const transfersRevenue = sumCategory('transfers_treasury_ucf', 'current')
      + sumCategory('external_assistance', 'current')
      + sumCategory('transfers_contingencies', 'current');
    const dependencyRatio = totalRevenueCurrent !== 0
      ? (transfersRevenue / totalRevenueCurrent) * 100
      : 0;

    // Personnel cost ratio = compensation / total expenses
    const compensationCurrent = sumCategory('compensation', 'current');
    const personnelRatio = totalExpensesCurrent !== 0
      ? (compensationCurrent / totalExpensesCurrent) * 100
      : 0;

    // === TREND INDICATORS ===

    const revenueChange = totalRevenuePrior !== 0
      ? ((totalRevenueCurrent - totalRevenuePrior) / Math.abs(totalRevenuePrior)) * 100
      : 0;
    const expenseChange = totalExpensesPrior !== 0
      ? ((totalExpensesCurrent - totalExpensesPrior) / Math.abs(totalExpensesPrior)) * 100
      : 0;
    const surplusChange = surplusPrior !== 0
      ? ((surplusCurrent - surplusPrior) / Math.abs(surplusPrior)) * 100
      : 0;
    const assetChange = totalAssetsPrior !== 0
      ? ((totalAssetsCurrent - totalAssetsPrior) / Math.abs(totalAssetsPrior)) * 100
      : 0;
    const cashChange = cashPrior !== 0
      ? ((cashCurrent - cashPrior) / Math.abs(cashPrior)) * 100
      : 0;

    // Budget utilization (overall)
    const totalBudgetInitial = tbEntries.reduce((s, e) => s + e.budgetInitial, 0);
    const totalBudgetAdjusted = tbEntries.reduce((s, e) => s + e.budgetAdjusted, 0);
    const totalActual = tbEntries.reduce((s, e) => s + e.debitCurrent + e.creditCurrent, 0);
    const budgetUtilization = totalBudgetAdjusted !== 0
      ? (totalActual / (totalBudgetInitial + totalBudgetAdjusted)) * 100
      : 0;

    // === ANOMALY DETECTION ===

    // Revenue change >50%
    if (Math.abs(revenueChange) > 50 && totalRevenuePrior !== 0) {
      anomalies.push({
        type: 'revenue_spike',
        severity: 'warning',
        description: 'Revenue change exceeds 50%',
        detail: `Revenue changed by ${revenueChange.toFixed(1)}% (${fmtNum(totalRevenuePrior)} to ${fmtNum(totalRevenueCurrent)})`,
      });
    }

    // Expense change >50%
    if (Math.abs(expenseChange) > 50 && totalExpensesPrior !== 0) {
      anomalies.push({
        type: 'expense_spike',
        severity: 'warning',
        description: 'Expense change exceeds 50%',
        detail: `Expenses changed by ${expenseChange.toFixed(1)}% (${fmtNum(totalExpensesPrior)} to ${fmtNum(totalExpensesCurrent)})`,
      });
    }

    // Negative cash
    if (cashCurrent < 0) {
      anomalies.push({
        type: 'negative_cash',
        severity: 'critical',
        description: 'Negative cash balance',
        detail: `Cash and cash equivalents is ${fmtNum(cashCurrent)}`,
      });
    }

    // Deficit
    if (surplusCurrent < 0) {
      anomalies.push({
        type: 'deficit',
        severity: 'warning',
        description: 'Operating deficit',
        detail: `Deficit of ${fmtNum(Math.abs(surplusCurrent))}`,  
      });
    }

    // Very high current ratio (>10)
    if (currentRatio > 10) {
      anomalies.push({
        type: 'high_liquidity',
        severity: 'info',
        description: 'Very high current ratio',
        detail: `Current ratio of ${currentRatio.toFixed(2)}x may indicate idle assets`,
      });
    }

    // Low current ratio (<1)
    if (currentRatio > 0 && currentRatio < 1) {
      anomalies.push({
        type: 'low_liquidity',
        severity: 'warning',
        description: 'Current ratio below 1',
        detail: `Current ratio of ${currentRatio.toFixed(2)}x - current liabilities exceed current assets`,
      });
    }

    // High dependency on transfers
    if (dependencyRatio > 80) {
      anomalies.push({
        type: 'high_dependency',
        severity: 'warning',
        description: 'High dependency on transfers and grants',
        detail: `${dependencyRatio.toFixed(1)}% of revenue comes from transfers/grants`,
      });
    }

    // High personnel costs
    if (personnelRatio > 60) {
      anomalies.push({
        type: 'high_personnel',
        severity: 'warning',
        description: 'Personnel costs exceed 60% of total expenses',
        detail: `Personnel costs are ${personnelRatio.toFixed(1)}% of total expenses`,
      });
    }

    // Budget utilization >110% or <50%
    if (budgetUtilization > 110) {
      anomalies.push({
        type: 'budget_overrun',
        severity: 'warning',
        description: 'Budget overrun detected',
        detail: `Budget utilization is ${budgetUtilization.toFixed(1)}% of approved budget`,
      });
    } else if (budgetUtilization > 0 && budgetUtilization < 50) {
      anomalies.push({
        type: 'low_utilization',
        severity: 'info',
        description: 'Low budget utilization',
        detail: `Only ${budgetUtilization.toFixed(1)}% of approved budget was utilized`,
      });
    }

    // Receivables days > 180
    if (receivablesDays > 180 && receivablesCurrent > 0) {
      anomalies.push({
        type: 'slow_receivables',
        severity: 'warning',
        description: 'High receivables collection period',
        detail: `Receivables days of ${receivablesDays.toFixed(0)} days`,
      });
    }

    return NextResponse.json({
      reportId: id,
      ratios: {
        surplusRatio: round2(surplusRatio),
        expenseRatio: round2(expenseRatio),
        currentRatio: round2(currentRatio),
        cashRatio: round2(cashRatio),
        receivablesDays: round2(receivablesDays),
        payablesDays: round2(payablesDays),
        dependencyRatio: round2(dependencyRatio),
        personnelRatio: round2(personnelRatio),
        budgetUtilization: round2(budgetUtilization),
      },
      trends: {
        revenueChange: round2(revenueChange),
        expenseChange: round2(expenseChange),
        surplusChange: round2(surplusChange),
        assetChange: round2(assetChange),
        cashChange: round2(cashChange),
      },
      anomalies,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtNum(n: number): string {
  if (n === 0) return '0';
  if (n < 0) return `(${Math.abs(n).toLocaleString('en-US')})`;
  return n.toLocaleString('en-US');
}
