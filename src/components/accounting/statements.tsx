'use client'

import { useState } from 'react'
import { Sparkles, FileDown, AlertTriangle, Loader2, BarChart3, Banknote, Scale } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useFinancialStore } from '@/components/financials/store'
import type {
  CashFlowData,
  RevenueReconciliationData,
  CashReconciliationData,
  BudgetVarianceData,
  ChangesInNAData,
} from '@/lib/financial-engine'

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

interface StatementsProps {
  reportId: string
}

export default function Statements({ reportId }: StatementsProps) {
  const { generatedStatements, generateStatements, isLoading, entityConfig } =
    useFinancialStore()
  const { toast } = useToast()
  const [activeGroup, setActiveGroup] = useState('performance')
  const [generating, setGenerating] = useState(false)

  const currency = entityConfig.currency || 'Shs'

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await generateStatements()
      toast({
        title: 'Statements Generated',
        description: 'All IPSAS financial statements have been generated from the trial balance.',
      })
    } catch {
      toast({
        title: 'Generation Failed',
        description: 'Could not generate statements. Ensure trial balance has entries and is saved.',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleExportPDF = async () => {
    toast({
      title: 'Export Started',
      description: 'PDF export is being prepared...',
    })
    try {
      const res = await fetch(`/api/reports/${reportId}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financial-statements-${reportId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Export Complete', description: 'PDF downloaded successfully.' })
    } catch {
      toast({
        title: 'Export Failed',
        description: 'Could not export PDF. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const stmts = generatedStatements
  const errors = stmts?.validationErrors || []

  // ── Empty state ──────────────────────────────────────────────
  if (!stmts) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="max-w-md border-slate-200">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <BarChart3 className="h-7 w-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No Statements Generated Yet
            </h3>
            <p className="text-sm text-slate-500">
              Generate IPSAS financial statements (Tables 1-24) from your trial
              balance data. Ensure entries are saved first.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating || isLoading}
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate Statements from Trial Balance
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── With statements ──────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Financial Statements</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {entityConfig.name} — {entityConfig.periodLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating || isLoading}
            className="gap-1.5"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Validation Errors Banner */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validation Errors ({errors.length})</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Tab groups */}
      <Tabs value={activeGroup} onValueChange={setActiveGroup}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-3.5 w-3.5 hidden sm:inline-block" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="position" className="gap-1.5 text-xs sm:text-sm">
            <Scale className="h-3.5 w-3.5 hidden sm:inline-block" />
            Position
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="gap-1.5 text-xs sm:text-sm">
            <Banknote className="h-3.5 w-3.5 hidden sm:inline-block" />
            Cash Flow
          </TabsTrigger>
        </TabsList>

        {/* ── Performance Tab ──────────────────────────────── */}
        <TabsContent value="performance" className="space-y-6 mt-4">
          {/* SFP - Table 2 */}
          <StatementSection
            title="Statement of Financial Performance (Table 2)"
            subtitle="For the year ended"
          >
            <TwoColumnStatementTable
              rows={[
                ...stmts.sfp.revenueLines,
                { label: '', noteRef: '', current: 0, prior: 0, isSection: true } as SFPLine,
                { label: 'SURPLUS / (DEFICIT)', noteRef: '', current: stmts.sfp.surplusCurrent, prior: stmts.sfp.surplusPrior, isBold: true, isTotal: true, indent: 0 } as SFPLine,
                ...stmts.sfp.expenseLines,
              ]}
              currency={currency}
            />
          </StatementSection>

          {/* Budget Variance - Table 9 */}
          <StatementSection
            title="Budget Variance Report (Table 9)"
            subtitle="Comparison of budget to actual"
          >
            <BudgetVarianceTable data={stmts.budgetVariance} currency={currency} />
          </StatementSection>
        </TabsContent>

        {/* ── Position Tab ────────────────────────────────── */}
        <TabsContent value="position" className="space-y-6 mt-4">
          {/* Balance Sheet - Table 3 */}
          <StatementSection
            title="Statement of Financial Position (Table 3)"
            subtitle="As at"
          >
            <TwoColumnStatementTable
              rows={[...stmts.balanceSheet.assetLines, ...stmts.balanceSheet.liabilityLines]}
              currency={currency}
            />
          </StatementSection>

          {/* Changes in Net Assets - Table 4 */}
          <StatementSection
            title="Statement of Changes in Net Assets (Table 4)"
            subtitle="For the year ended"
          >
            <ChangesInNATable data={stmts.changesInNA} currency={currency} />
          </StatementSection>
        </TabsContent>

        {/* ── Cash Flow Tab ───────────────────────────────── */}
        <TabsContent value="cashflow" className="space-y-6 mt-4">
          {/* Cash Flow Statement - Table 5 */}
          <StatementSection
            title="Cash Flow Statement (Table 5)"
            subtitle="For the year ended"
          >
            <CashFlowTable data={stmts.cashFlow} currency={currency} />
          </StatementSection>

          {/* Revenue Reconciliation - Table 6 */}
          <StatementSection
            title="Reconciliation of Revenue from Non-Exchange Transactions (Table 6)"
            subtitle="For the year ended"
          >
            <RevenueReconciliationTable data={stmts.revenueReconciliation} currency={currency} />
          </StatementSection>

          {/* Cash Reconciliation - Table 7 */}
          <StatementSection
            title="Reconciliation of Cash and Cash Equivalents (Table 7)"
            subtitle="For the year ended"
          >
            <CashReconciliationTable data={stmts.cashReconciliation} currency={currency} />
          </StatementSection>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────

function StatementSection({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <span className="text-xs text-slate-400">{subtitle}</span>
      </div>
      {children}
    </div>
  )
}

// ── Generic Two-Column Statement Table (SFP / BS) ──────────────

interface LineLike {
  label: string
  noteRef: string
  current: number
  prior: number
  indent?: number
  isBold?: boolean
  isSubtotal?: boolean
  isTotal?: boolean
  isSection?: boolean
}

function TwoColumnStatementTable({
  rows,
  currency,
}: {
  rows: LineLike[]
  currency: string
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide">
              Description
            </th>
            <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide w-14">
              Note
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
              Current Year ({currency})
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
              Prior Year ({currency})
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isSection = row.isSection
            const isTotal = row.isTotal
            const isBold = row.isBold
            const indent = row.indent || 0

            let rowClass = 'border-b border-slate-100 '
            if (isSection) rowClass += 'bg-slate-50 '
            else if (isTotal) rowClass += 'bg-slate-100 '
            else if (isSubtotal?.(row)) rowClass += 'bg-slate-50/50 '

            const labelClass = isSection
              ? 'text-xs font-semibold uppercase tracking-wide text-slate-500'
              : isBold || isTotal
                ? 'font-semibold text-slate-800'
                : 'text-slate-600'

            const numClass = isSection
              ? 'text-xs uppercase tracking-wide text-slate-500'
              : isBold || isTotal
                ? 'font-semibold text-slate-800 font-mono'
                : 'text-slate-700 font-mono'

            const isNegCurrent = !isSection && row.current < 0
            const isNegPrior = !isSection && row.prior < 0

            return (
              <tr key={i} className={rowClass}>
                <td
                  className={`px-4 py-2 ${labelClass}`}
                  style={{ paddingLeft: `${16 + indent * 24}px` }}
                >
                  {row.label}
                </td>
                <td className="px-4 py-2 text-center text-xs text-slate-500 font-mono">
                  {row.noteRef || ''}
                </td>
                <td className={`px-4 py-2 text-right ${numClass} ${isNegCurrent ? 'text-red-600' : ''}`}>
                  {isSection ? '' : formatNum(row.current)}
                </td>
                <td className={`px-4 py-2 text-right ${numClass} ${isNegPrior ? 'text-red-600' : ''}`}>
                  {isSection ? '' : formatNum(row.prior)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// helper to check subtotal
function isSubtotal(row: LineLike): boolean {
  return row.isSubtotal === true
}

// ── Changes in Net Assets Table (Table 4) ──────────────────────

function ChangesInNATable({ data, currency }: { data: ChangesInNAData; currency: string }) {
  const rows: LineLike[] = [
    { label: 'Net Assets at beginning of year', noteRef: '', current: data.bfCurrent, prior: data.bfPrior, indent: 0 },
    { label: 'Prior year adjustments', noteRef: '', current: data.adjustmentsCurrent, prior: data.adjustmentsPrior, indent: 1 },
    { label: 'Restated net assets', noteRef: '', current: data.bfCurrent + data.adjustmentsCurrent, prior: data.bfPrior + data.adjustmentsPrior, isBold: true, indent: 0 },
    { label: 'Surplus / (Deficit) for the year', noteRef: '', current: data.surplusCurrent, prior: data.surplusPrior, isBold: true, indent: 0 },
    { label: 'Net Assets at end of year', noteRef: '', current: data.closingCurrent, prior: data.closingPrior, isBold: true, isTotal: true, indent: 0 },
  ]
  return <TwoColumnStatementTable rows={rows} currency={currency} />
}

// ── Cash Flow Statement Table (Table 5) ────────────────────────

function CashFlowTable({ data, currency }: { data: CashFlowData; currency: string }) {
  const rows: LineLike[] = [
    { label: 'CASH FLOWS FROM OPERATING ACTIVITIES', noteRef: '', current: 0, prior: 0, isSection: true },
    { label: 'Revenue received (for CF purposes)', noteRef: '', current: data.operatingRevenueCurrent, prior: data.operatingRevenuePrior, indent: 1 },
    ...data.payments.map((p) => ({
      label: `(${p.label})`,
      noteRef: p.noteRef,
      current: -Math.abs(p.current),
      prior: -Math.abs(p.prior),
      indent: 2,
    })),
    { label: 'Net Cash from Operating Activities', noteRef: '', current: data.netOperatingCurrent, prior: data.netOperatingPrior, isBold: true, isTotal: true, indent: 0 },
    { label: 'CASH FLOWS FROM INVESTING ACTIVITIES', noteRef: '', current: 0, prior: 0, isSection: true },
    ...data.investing.map((inv) => ({
      label: inv.label,
      noteRef: '',
      current: inv.current,
      prior: inv.prior,
      indent: 1,
    })),
    { label: 'Net Cash from Investing Activities', noteRef: '', current: data.netInvestingCurrent, prior: data.netInvestingPrior, isBold: true, isTotal: true, indent: 0 },
    ...(data.financing.length > 0
      ? [
          { label: 'CASH FLOWS FROM FINANCING ACTIVITIES', noteRef: '', current: 0, prior: 0, isSection: true },
          ...data.financing.map((f) => ({
            label: f.label,
            noteRef: '',
            current: f.current,
            prior: f.prior,
            indent: 1,
          })),
          { label: 'Net Cash from Financing Activities', noteRef: '', current: data.netFinancingCurrent, prior: data.netFinancingPrior, isBold: true, isTotal: true, indent: 0 },
        ]
      : []),
    { label: 'NET INCREASE / (DECREASE) IN CASH', noteRef: '', current: data.netChangeCurrent, prior: data.netChangePrior, isBold: true, isTotal: true, indent: 0 },
  ]
  return <TwoColumnStatementTable rows={rows} currency={currency} />
}

// ── Revenue Reconciliation Table (Table 6) ─────────────────────

function RevenueReconciliationTable({ data, currency }: { data: RevenueReconciliationData; currency: string }) {
  const rows: LineLike[] = [
    { label: 'RECONCILIATION OF REVENUE FROM NON-EXCHANGE TRANSACTIONS', noteRef: '', current: 0, prior: 0, isSection: true },
    { label: 'Revenue per Statement of Financial Performance', noteRef: '', current: data.sfpRevenueCurrent, prior: data.sfpRevenuePrior, indent: 0 },
    { label: 'Advances recovered', noteRef: '', current: data.advancesRecoveredCurrent, prior: data.advancesRecoveredPrior, indent: 1 },
    { label: 'Revenue receivables collected during the year', noteRef: '', current: data.revenueReceivableCollectedCurrent, prior: data.revenueReceivableCollectedPrior, indent: 1 },
    { label: 'Deposits received', noteRef: '', current: data.depositsReceivedCurrent, prior: data.depositsReceivedPrior, indent: 1 },
    { label: 'Total Revenue for Cash Flow purposes', noteRef: '', current: data.totalRevenueCFCurrent, prior: data.totalRevenueCFPrior, isBold: true, indent: 0 },
    { label: 'Less:', noteRef: '', current: 0, prior: 0, isBold: true, indent: 0 },
    { label: 'Grants in kind', noteRef: '', current: data.grantsInKindCurrent, prior: data.grantsInKindPrior, indent: 1 },
    { label: 'Transfers to Treasury', noteRef: '', current: data.transfersToTreasuryCurrent, prior: data.transfersToTreasuryPrior, indent: 1 },
    { label: 'Revenue receivables at end of period', noteRef: '', current: data.revenueReceivablePeriodCurrent, prior: data.revenueReceivablePeriodPrior, indent: 1 },
    { label: 'Total Revenue Cash Flow', noteRef: '', current: data.totalRevenueCashFlowCurrent, prior: data.totalRevenueCashFlowPrior, isBold: true, isTotal: true, indent: 0 },
  ]
  return <TwoColumnStatementTable rows={rows} currency={currency} />
}

// ── Cash Reconciliation Table (Table 7) ────────────────────────

function CashReconciliationTable({ data, currency }: { data: CashReconciliationData; currency: string }) {
  const rows: LineLike[] = [
    { label: 'RECONCILIATION OF CASH AND CASH EQUIVALENTS', noteRef: '', current: 0, prior: 0, isSection: true },
    { label: 'Cash and cash equivalents at beginning of year', noteRef: '', current: data.openingCashCurrent, prior: data.openingCashPrior, indent: 0 },
    { label: 'Net increase / (decrease) in cash', noteRef: '', current: data.netChangeCurrent, prior: data.netChangePrior, indent: 0 },
    { label: 'Cash and cash equivalents at end of year', noteRef: '', current: data.closingCashCurrent, prior: data.closingCashPrior, isBold: true, isTotal: true, indent: 0 },
  ]
  return <TwoColumnStatementTable rows={rows} currency={currency} />
}

// ── Budget Variance Table (Table 9) ────────────────────────────

function BudgetVarianceTable({ data, currency }: { data: BudgetVarianceData[]; currency: string }) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-slate-500 py-8 text-center">
        No budget data available. Add budget amounts to trial balance entries to see variance analysis.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide">
              Description
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
              Initial Budget ({currency})
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
              Adjustments ({currency})
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
              Revised Budget ({currency})
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
              Actual ({currency})
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
              Variance ({currency})
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-20">
              Var %
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const varNeg = row.variance < 0
            return (
              <tr
                key={i}
                className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-4 py-2 text-slate-700">{row.label}</td>
                <td className="px-4 py-2 text-right font-mono text-slate-700">
                  {formatNum(row.initialBudget)}
                </td>
                <td className="px-4 py-2 text-right font-mono text-slate-700">
                  {formatNum(row.adjustments)}
                </td>
                <td className="px-4 py-2 text-right font-mono font-semibold text-slate-800">
                  {formatNum(row.revisedBudget)}
                </td>
                <td className="px-4 py-2 text-right font-mono text-slate-700">
                  {formatNum(row.actual)}
                </td>
                <td
                  className={`px-4 py-2 text-right font-mono font-semibold ${
                    varNeg ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {varNeg ? '(' : ''}
                  {formatNum(row.variance)}
                  {varNeg ? ')' : ''}
                </td>
                <td
                  className={`px-4 py-2 text-right font-mono text-xs ${
                    Math.abs(row.variancePercent) > 10
                      ? 'text-red-600 font-semibold'
                      : 'text-slate-600'
                  }`}
                >
                  {row.variancePercent.toFixed(1)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
