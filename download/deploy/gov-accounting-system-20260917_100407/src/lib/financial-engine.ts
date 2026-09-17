export interface TBEntry {
  accountCode: string;
  accountName: string;
  classification: string;
  category: string;
  noteRef: string;
  debitCurrent: number;
  creditCurrent: number;
  debitPrior: number;
  creditPrior: number;
  budgetInitial: number;
  budgetAdjusted: number;
}

export interface GeneratedStatements {
  sfp: SFPData;
  balanceSheet: BalanceSheetData;
  changesInNA: ChangesInNAData;
  cashFlow: CashFlowData;
  revenueReconciliation: RevenueReconciliationData;
  cashReconciliation: CashReconciliationData;
  budgetVariance: BudgetVarianceData[];
  validationErrors: string[];
}

export interface SFPLine {
  label: string;
  noteRef: string;
  current: number;
  prior: number;
  indent?: number;
  isBold?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
}

export interface SFPData {
  revenueLines: SFPLine[];
  expenseLines: SFPLine[];
  totalRevenueCurrent: number;
  totalRevenuePrior: number;
  totalExpensesCurrent: number;
  totalExpensesPrior: number;
  surplusCurrent: number;
  surplusPrior: number;
}

export interface BSLine {
  label: string;
  noteRef: string;
  current: number;
  prior: number;
  indent?: number;
  isBold?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isSection?: boolean;
}

export interface BalanceSheetData {
  assetLines: BSLine[];
  liabilityLines: BSLine[];
  totalAssetsCurrent: number;
  totalAssetsPrior: number;
  totalLiabilitiesCurrent: number;
  totalLiabilitiesPrior: number;
  netAssetsCurrent: number;
  netAssetsPrior: number;
  reservesCurrent: number;
  reservesPrior: number;
}

export interface ChangesInNAData {
  bfCurrent: number;
  bfPrior: number;
  adjustmentsCurrent: number;
  adjustmentsPrior: number;
  surplusCurrent: number;
  surplusPrior: number;
  closingCurrent: number;
  closingPrior: number;
}

export interface CashFlowData {
  operatingRevenueCurrent: number;
  operatingRevenuePrior: number;
  payments: { label: string; noteRef: string; current: number; prior: number }[];
  netOperatingCurrent: number;
  netOperatingPrior: number;
  investing: { label: string; current: number; prior: number }[];
  netInvestingCurrent: number;
  netInvestingPrior: number;
  financing: { label: string; current: number; prior: number }[];
  netFinancingCurrent: number;
  netFinancingPrior: number;
  netChangeCurrent: number;
  netChangePrior: number;
}

export interface RevenueReconciliationData {
  sfpRevenueCurrent: number;
  sfpRevenuePrior: number;
  advancesRecoveredCurrent: number;
  advancesRecoveredPrior: number;
  revenueReceivableCollectedCurrent: number;
  revenueReceivableCollectedPrior: number;
  depositsReceivedCurrent: number;
  depositsReceivedPrior: number;
  totalRevenueCFCurrent: number;
  totalRevenueCFPrior: number;
  grantsInKindCurrent: number;
  grantsInKindPrior: number;
  transfersToTreasuryCurrent: number;
  transfersToTreasuryPrior: number;
  revenueReceivablePeriodCurrent: number;
  revenueReceivablePeriodPrior: number;
  totalRevenueCashFlowCurrent: number;
  totalRevenueCashFlowPrior: number;
}

export interface CashReconciliationData {
  openingCashCurrent: number;
  openingCashPrior: number;
  netChangeCurrent: number;
  netChangePrior: number;
  closingCashCurrent: number;
  closingCashPrior: number;
}

export interface BudgetVarianceData {
  label: string;
  initialBudget: number;
  adjustments: number;
  revisedBudget: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

// Revenue category definitions matching the Madera template
const REVENUE_CATEGORIES = [
  { key: 'taxes', label: 'Taxes', noteRef: '2', classification: 'revenue-non-exchange' },
  { key: 'external_assistance', label: 'External Assistance', noteRef: '3', classification: 'revenue-non-exchange' },
  { key: 'transfers_treasury_ucf', label: 'Transfers received from Treasury- UCF', noteRef: '4', classification: 'revenue-non-exchange' },
  { key: 'transfers_contingencies', label: 'Transfers received from the Contingencies Fund', noteRef: '5', classification: 'revenue-non-exchange' },
  { key: 'transfers_other_govt', label: 'Transfers received from other Government Units', noteRef: '6', classification: 'revenue-non-exchange' },
  { key: 'non_tax_exchange', label: 'Non-Tax revenue- Exchange Transaction', noteRef: '7', classification: 'revenue-non-exchange' },
  { key: 'sub_exchange', label: 'Sub-total Revenue from Exchange transactions', noteRef: '8', classification: 'revenue-exchange' },
  { key: 'revenue_in_kind', label: 'Revenue in kind', noteRef: '8(b)', classification: 'revenue-non-exchange' },
  { key: 'non_tax_revenue_exchange', label: 'Non-Tax Revenue- Exchange', noteRef: '', classification: 'revenue-exchange' },
];

const EXPENSE_CATEGORIES = [
  { key: 'compensation', label: 'Compensation of employees', noteRef: '9' },
  { key: 'goods_services', label: 'Goods and services consumed', noteRef: '10' },
  { key: 'depreciation', label: 'Depreciation expense', noteRef: '11' },
  { key: 'impairment', label: 'Impairment of property, plant, and equipment', noteRef: '12' },
  { key: 'subsidies', label: 'Subsidies', noteRef: '13' },
  { key: 'grants_transfers', label: 'Grants and other transfers', noteRef: '14' },
  { key: 'social_benefits', label: 'Social benefits', noteRef: '15' },
  { key: 'finance_costs', label: 'Finance costs', noteRef: '16' },
  { key: 'bad_debts', label: 'Bad debts expense', noteRef: '17' },
  { key: 'other_expenses', label: 'Other expenses', noteRef: '18' },
];

const ASSET_CATEGORIES = [
  { key: 'cash', label: 'Cash and Cash equivalents', noteRef: '21', type: 'current' },
  { key: 'prepayments_current', label: 'Prepayments and advances', noteRef: '22(a)', type: 'current' },
  { key: 'receivables_current', label: 'Receivables', noteRef: '23(d)', type: 'current' },
  { key: 'inventories', label: 'Inventories', noteRef: '24', type: 'current' },
  { key: 'prepayments_nc', label: 'Prepayments and advances', noteRef: '22(b)', type: 'non-current' },
  { key: 'receivables_nc', label: 'Receivables', noteRef: '23(e)', type: 'non-current' },
  { key: 'investments', label: 'Investments', noteRef: '25', type: 'non-current' },
  { key: 'ppe', label: 'Property, Plant and Equipment', noteRef: '26(a)', type: 'non-current' },
  { key: 'investment_property', label: 'Investment property', noteRef: '26(b)', type: 'non-current' },
  { key: 'intangible', label: 'Intangible assets', noteRef: '26(c)', type: 'non-current' },
  { key: 'non_produced', label: 'Non-Produced Assets', noteRef: '27', type: 'non-current' },
];

const LIABILITY_CATEGORIES = [
  { key: 'payables_current', label: 'Payables', noteRef: '28(a)', type: 'current' },
  { key: 'deposits_current', label: 'Deposits', noteRef: '29(a)', type: 'current' },
  { key: 'short_borrowings', label: 'Short-term borrowings', noteRef: '30(a)', type: 'current' },
  { key: 'pensions_current', label: 'Pensions', noteRef: '31(a)', type: 'current' },
  { key: 'payables_nc', label: 'Payables', noteRef: '28(b)', type: 'non-current' },
  { key: 'deposits_nc', label: 'Deposits', noteRef: '29(b)', type: 'non-current' },
  { key: 'long_borrowings', label: 'Long-term borrowings', noteRef: '30(b)', type: 'non-current' },
  { key: 'pensions_nc', label: 'Pensions', noteRef: '31(b)', type: 'non-current' },
];

function getAmount(entry: TBEntry, year: 'current' | 'prior'): number {
  if (year === 'current') {
    return (entry.classification === 'revenue-non-exchange' || entry.classification === 'revenue-exchange')
      ? entry.creditCurrent : entry.debitCurrent;
  }
  return (entry.classification === 'revenue-non-exchange' || entry.classification === 'revenue-exchange')
    ? entry.creditPrior : entry.debitPrior;
}

function sumByCategory(entries: TBEntry[], categoryKey: string, year: 'current' | 'prior'): number {
  return entries
    .filter(e => e.category === categoryKey)
    .reduce((sum, e) => sum + getAmount(e, year), 0);
}

export interface SupplementaryInput {
  advancesRecovered?: number;
  advancesRecoveredPrior?: number;
  depositsReceived?: number;
  depositsReceivedPrior?: number;
  transfersToTreasury?: number;
  transfersToTreasuryPrior?: number;
  revenueInKindTaxWaivers?: number;
  revenueInKindTaxWaiversPrior?: number;
}

export function generateStatements(entries: TBEntry[], supp?: SupplementaryInput): GeneratedStatements {
  const errors: string[] = [];

  // Validate trial balance balances
  const totalDebitCurrent = entries.reduce((s, e) => s + e.debitCurrent, 0);
  const totalCreditCurrent = entries.reduce((s, e) => s + e.creditCurrent, 0);
  const totalDebitPrior = entries.reduce((s, e) => s + e.debitPrior, 0);
  const totalCreditPrior = entries.reduce((s, e) => s + e.creditPrior, 0);

  if (Math.abs(totalDebitCurrent - totalCreditCurrent) > 1) {
    errors.push(`Trial Balance does not balance (Current Year): Debits ${fmtNum(totalDebitCurrent)} vs Credits ${fmtNum(totalCreditCurrent)} - Difference: ${fmtNum(totalDebitCurrent - totalCreditCurrent)}`);
  }
  if (Math.abs(totalDebitPrior - totalCreditPrior) > 1) {
    errors.push(`Trial Balance does not balance (Prior Year): Debits ${fmtNum(totalDebitPrior)} vs Credits ${fmtNum(totalCreditPrior)} - Difference: ${fmtNum(totalDebitPrior - totalCreditPrior)}`);
  }

  // ===== STATEMENT OF FINANCIAL PERFORMANCE =====
  const revenueLines: SFPLine[] = [];
  revenueLines.push({ label: 'REVENUE', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true });
  revenueLines.push({ label: 'Revenue from non-Exchange transactions', noteRef: '', current: 0, prior: 0, indent: 1 });

  let subtotalNonExchangeCurrent = 0;
  let subtotalNonExchangePrior = 0;
  for (const cat of REVENUE_CATEGORIES.filter(c => c.classification === 'revenue-non-exchange')) {
    const current = sumByCategory(entries, cat.key, 'current');
    const prior = sumByCategory(entries, cat.key, 'prior');
    revenueLines.push({ label: cat.label, noteRef: cat.noteRef, current, prior, indent: 2 });
    subtotalNonExchangeCurrent += current;
    subtotalNonExchangePrior += prior;
  }

  let subtotalExchangeCurrent = 0;
  let subtotalExchangePrior = 0;
  for (const cat of REVENUE_CATEGORIES.filter(c => c.classification === 'revenue-exchange')) {
    const current = sumByCategory(entries, cat.key, 'current');
    const prior = sumByCategory(entries, cat.key, 'prior');
    revenueLines.push({ label: cat.label, noteRef: cat.noteRef, current, prior, indent: 2 });
    subtotalExchangeCurrent += current;
    subtotalExchangePrior += prior;
  }

  const totalRevenueCurrent = subtotalNonExchangeCurrent + subtotalExchangeCurrent;
  const totalRevenuePrior = subtotalNonExchangePrior + subtotalExchangePrior;

  revenueLines.push({ label: 'Total Revenue', noteRef: '', current: totalRevenueCurrent, prior: totalRevenuePrior, isBold: true, isTotal: true });

  // Expenses
  const expenseLines: SFPLine[] = [];
  expenseLines.push({ label: 'EXPENSES', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true });

  let totalExpensesCurrent = 0;
  let totalExpensesPrior = 0;
  for (const cat of EXPENSE_CATEGORIES) {
    const current = sumByCategory(entries, cat.key, 'current');
    const prior = sumByCategory(entries, cat.key, 'prior');
    expenseLines.push({ label: cat.label, noteRef: cat.noteRef, current, prior, indent: 1 });
    totalExpensesCurrent += current;
    totalExpensesPrior += prior;
  }

  expenseLines.push({ label: 'Total Expenses', noteRef: '', current: totalExpensesCurrent, prior: totalExpensesPrior, isBold: true, isTotal: true });

  // Surplus/Deficit
  const surplusCurrent = totalRevenueCurrent - totalExpensesCurrent;
  const surplusPrior = totalRevenuePrior - totalExpensesPrior;

  // ===== STATEMENT OF FINANCIAL POSITION =====
  const assetLines: BSLine[] = [];
  assetLines.push({ label: 'ASSETS', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true });
  assetLines.push({ label: 'Current Assets', noteRef: '', current: 0, prior: 0, isBold: true, indent: 1 });

  let totalAssetsCurrent = 0;
  let totalAssetsPrior = 0;
  for (const cat of ASSET_CATEGORIES) {
    const current = sumByCategory(entries, cat.key, 'current');
    const prior = sumByCategory(entries, cat.key, 'prior');
    if (cat.type === 'current') {
      assetLines.push({ label: cat.label, noteRef: cat.noteRef, current, prior, indent: 2 });
    }
    totalAssetsCurrent += current;
    totalAssetsPrior += prior;
  }

  assetLines.push({ label: 'Non-current Assets', noteRef: '', current: 0, prior: 0, isBold: true, indent: 1 });
  for (const cat of ASSET_CATEGORIES) {
    const current = sumByCategory(entries, cat.key, 'current');
    const prior = sumByCategory(entries, cat.key, 'prior');
    if (cat.type === 'non-current') {
      assetLines.push({ label: cat.label, noteRef: cat.noteRef, current, prior, indent: 2 });
    }
  }

  assetLines.push({ label: 'Total Assets', noteRef: '', current: totalAssetsCurrent, prior: totalAssetsPrior, isBold: true, isTotal: true });

  // Liabilities
  const liabilityLines: BSLine[] = [];
  liabilityLines.push({ label: 'LIABILITIES', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true });
  liabilityLines.push({ label: 'Current Liabilities', noteRef: '', current: 0, prior: 0, isBold: true, indent: 1 });

  let totalLiabilitiesCurrent = 0;
  let totalLiabilitiesPrior = 0;
  for (const cat of LIABILITY_CATEGORIES) {
    const current = sumByCategory(entries, cat.key, 'current');
    const prior = sumByCategory(entries, cat.key, 'prior');
    if (cat.type === 'current') {
      liabilityLines.push({ label: cat.label, noteRef: cat.noteRef, current, prior, indent: 2 });
    }
    totalLiabilitiesCurrent += current;
    totalLiabilitiesPrior += prior;
  }

  liabilityLines.push({ label: 'Non-current liabilities', noteRef: '', current: 0, prior: 0, isBold: true, indent: 1 });
  for (const cat of LIABILITY_CATEGORIES) {
    const current = sumByCategory(entries, cat.key, 'current');
    const prior = sumByCategory(entries, cat.key, 'prior');
    if (cat.type === 'non-current') {
      liabilityLines.push({ label: cat.label, noteRef: cat.noteRef, current, prior, indent: 2 });
    }
  }

  liabilityLines.push({ label: 'Total liabilities', noteRef: '', current: totalLiabilitiesCurrent, prior: totalLiabilitiesPrior, isBold: true, isTotal: true });

  const netAssetsCurrent = totalAssetsCurrent - totalLiabilitiesCurrent;
  const netAssetsPrior = totalAssetsPrior - totalLiabilitiesPrior;

  liabilityLines.push({ label: 'Net Assets', noteRef: '', current: netAssetsCurrent, prior: netAssetsPrior, isBold: true, isTotal: true });
  liabilityLines.push({ label: 'REPRESENTED BY', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true });
  liabilityLines.push({ label: 'Reserves', noteRef: '', current: netAssetsCurrent, prior: netAssetsPrior, isBold: true, indent: 1, isTotal: true });

  // ===== STATEMENT OF CHANGES IN NET ASSETS =====
  const cashCurrent = sumByCategory(entries, 'cash', 'current');
  const cashPrior = sumByCategory(entries, 'cash', 'prior');
  const receivablesCurrent = sumByCategory(entries, 'receivables_current', 'current');
  const receivablesPrior = sumByCategory(entries, 'receivables_current', 'prior');
  const ppeCurrent = sumByCategory(entries, 'ppe', 'current');
  const ppePrior = sumByCategory(entries, 'ppe', 'prior');
  const payablesCurrent = sumByCategory(entries, 'payables_current', 'current');
  const payablesPrior = sumByCategory(entries, 'payables_current', 'prior');

  const changesInNA: ChangesInNAData = {
    bfCurrent: netAssetsPrior,
    bfPrior: netAssetsPrior - surplusPrior, // estimated
    adjustmentsCurrent: netAssetsCurrent - netAssetsPrior - surplusCurrent,
    adjustmentsPrior: 0,
    surplusCurrent,
    surplusPrior,
    closingCurrent: netAssetsCurrent,
    closingPrior: netAssetsPrior,
  };

  // ===== CASH FLOW STATEMENT =====
  // Revenue for cash flow = SFP Revenue + revenue receivable collected
  const revenueReceivableCurrent = receivablesCurrent;
  const revenueReceivablePrior = receivablesPrior;
  const revenueInKindCurrent = sumByCategory(entries, 'revenue_in_kind', 'current');
  const revenueInKindPrior = sumByCategory(entries, 'revenue_in_kind', 'prior');

  const operatingRevenueCurrent = totalRevenueCurrent + revenueReceivableCurrent - revenueInKindCurrent;
  const operatingRevenuePrior = totalRevenuePrior + revenueReceivablePrior - revenueInKindPrior;

  const compensationCurrent = sumByCategory(entries, 'compensation', 'current');
  const compensationPrior = sumByCategory(entries, 'compensation', 'prior');
  const goodsServicesCurrent = sumByCategory(entries, 'goods_services', 'current');
  const goodsServicesPrior = sumByCategory(entries, 'goods_services', 'prior');
  const otherExpensesCurrent = sumByCategory(entries, 'other_expenses', 'current');
  const otherExpensesPrior = sumByCategory(entries, 'other_expenses', 'prior');

  const netOperatingCurrent = operatingRevenueCurrent - compensationCurrent - goodsServicesCurrent - otherExpensesCurrent;
  const netOperatingPrior = operatingRevenuePrior - compensationPrior - goodsServicesPrior - otherExpensesPrior;

  // PPE purchases = closing PPE + depreciation (since opening was 0 or needs calculation)
  const depreciationCurrent = sumByCategory(entries, 'depreciation', 'current');
  const depreciationPrior = sumByCategory(entries, 'depreciation', 'prior');
  const purchasePPECurrent = ppeCurrent + depreciationCurrent;
  const purchasePPEPrior = 0;

  const netChangeCurrent = netOperatingCurrent - purchasePPECurrent;
  const netChangePrior = netOperatingPrior;

  const cashFlow: CashFlowData = {
    operatingRevenueCurrent,
    operatingRevenuePrior,
    payments: [
      { label: 'Compensation of employees', noteRef: '9', current: compensationCurrent, prior: compensationPrior },
      { label: 'Goods and services consumed', noteRef: '', current: goodsServicesCurrent, prior: goodsServicesPrior },
      { label: 'Other expenses', noteRef: '', current: otherExpensesCurrent, prior: otherExpensesPrior },
    ],
    netOperatingCurrent,
    netOperatingPrior,
    investing: [
      { label: 'Purchase of property, plant and equipment', current: -purchasePPECurrent, prior: purchasePPEPrior },
    ],
    netInvestingCurrent: -purchasePPECurrent,
    netInvestingPrior: 0,
    financing: [],
    netFinancingCurrent: 0,
    netFinancingPrior: 0,
    netChangeCurrent,
    netChangePrior,
  };

  // ===== REVENUE RECONCILIATION =====
  const revenueReconciliation: RevenueReconciliationData = {
    sfpRevenueCurrent: totalRevenueCurrent,
    sfpRevenuePrior: totalRevenuePrior,
    advancesRecoveredCurrent: supp?.advancesRecovered ?? 0,
    advancesRecoveredPrior: supp?.advancesRecoveredPrior ?? 0,
    revenueReceivableCollectedCurrent: revenueReceivableCurrent,
    revenueReceivableCollectedPrior: revenueReceivablePrior,
    depositsReceivedCurrent: supp?.depositsReceived ?? 0,
    depositsReceivedPrior: supp?.depositsReceivedPrior ?? 0,
    totalRevenueCFCurrent: totalRevenueCurrent + (supp?.advancesRecovered ?? 0) + revenueReceivableCurrent + (supp?.depositsReceived ?? 0),
    totalRevenueCFPrior: totalRevenuePrior + (supp?.advancesRecoveredPrior ?? 0) + revenueReceivablePrior + (supp?.depositsReceivedPrior ?? 0),
    grantsInKindCurrent: revenueInKindCurrent,
    grantsInKindPrior: revenueInKindPrior,
    transfersToTreasuryCurrent: supp?.transfersToTreasury ?? 0,
    transfersToTreasuryPrior: supp?.transfersToTreasuryPrior ?? 0,
    revenueReceivablePeriodCurrent: receivablesCurrent,
    revenueReceivablePeriodPrior: receivablesPrior,
    totalRevenueCashFlowCurrent: 0,
    totalRevenueCashFlowPrior: 0,
  };

  // Compute final cash flow revenue totals
  revenueReconciliation.totalRevenueCashFlowCurrent = revenueReconciliation.totalRevenueCFCurrent - revenueInKindCurrent - (supp?.revenueInKindTaxWaivers ?? 0) - (supp?.transfersToTreasury ?? 0);
  revenueReconciliation.totalRevenueCashFlowPrior = revenueReconciliation.totalRevenueCFPrior - revenueInKindPrior - (supp?.revenueInKindTaxWaiversPrior ?? 0) - (supp?.transfersToTreasuryPrior ?? 0);

  // ===== CASH RECONCILIATION =====
  const cashReconciliation: CashReconciliationData = {
    openingCashCurrent: cashPrior,
    openingCashPrior: 0,
    netChangeCurrent,
    netChangePrior,
    closingCashCurrent: cashCurrent,
    closingCashPrior: cashPrior,
  };

  // Verify cash reconciliation
  if (Math.abs(cashPrior + netChangeCurrent - cashCurrent) > 1) {
    errors.push(`Cash reconciliation failed: Opening ${fmtNum(cashPrior)} + Net Change ${fmtNum(netChangeCurrent)} = ${fmtNum(cashPrior + netChangeCurrent)} != Closing ${fmtNum(cashCurrent)}`);
  }

  // ===== BUDGET VARIANCE =====
  const budgetVariance: BudgetVarianceData[] = [];
  for (const cat of [...REVENUE_CATEGORIES, ...EXPENSE_CATEGORIES]) {
    const initial = entries.filter(e => e.category === cat.key).reduce((s, e) => s + e.budgetInitial, 0);
    const adjusted = entries.filter(e => e.category === cat.key).reduce((s, e) => s + e.budgetAdjusted, 0);
    const actual = sumByCategory(entries, cat.key, 'current');
    if (initial > 0 || actual > 0) {
      const revised = initial + adjusted;
      const variance = revised - actual;
      const variancePercent = revised !== 0 ? (variance / revised) * 100 : 0;
      budgetVariance.push({
        label: cat.label,
        initialBudget: initial,
        adjustments: adjusted,
        revisedBudget: revised,
        actual,
        variance,
        variancePercent,
      });
    }
  }

  // Cross-validation checks
  if (revenueReconciliation.totalRevenueCashFlowCurrent !== cashFlow.operatingRevenueCurrent) {
    errors.push(`Cross-reference: Revenue for CF purposes (${fmtNum(revenueReconciliation.totalRevenueCashFlowCurrent)}) != CF operating revenue (${fmtNum(cashFlow.operatingRevenueCurrent)})`);
  }

  if (Math.abs(cashReconciliation.closingCashCurrent - cashCurrent) > 1) {
    errors.push(`Cash note (${fmtNum(cashReconciliation.closingCashCurrent)}) != Balance Sheet cash (${fmtNum(cashCurrent)})`);
  }

  return {
    sfp: { revenueLines, expenseLines, totalRevenueCurrent, totalRevenuePrior, totalExpensesCurrent, totalExpensesPrior, surplusCurrent, surplusPrior },
    balanceSheet: { assetLines, liabilityLines, totalAssetsCurrent, totalAssetsPrior, totalLiabilitiesCurrent, totalLiabilitiesPrior, netAssetsCurrent, netAssetsPrior, reservesCurrent: netAssetsCurrent, reservesPrior: netAssetsPrior },
    changesInNA,
    cashFlow,
    revenueReconciliation,
    cashReconciliation,
    budgetVariance,
    validationErrors: errors,
  };
}

function fmtNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export { fmtNum };
