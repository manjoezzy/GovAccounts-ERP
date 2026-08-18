'use client'

import React, { useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Scale,
  Plus,
  LayoutDashboard,
  Table,
  FileText,
  Download,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FolderOpen,
  Loader2,
  Calendar,
  Banknote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useFinancialStore, type TabType, type StatementSubTab } from '@/components/financials/store'
import { TBEntryRow } from '@/components/financials/tb-entry-row'
import { StatementTable, type StatementRow } from '@/components/financials/statement-table'
import type {
  GeneratedStatements,
  SFPLine,
  BSLine,
  CashFlowData,
  RevenueReconciliationData,
  CashReconciliationData,
  BudgetVarianceData,
} from '@/lib/financial-engine'

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function statusColor(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-yellow-100 text-yellow-800'
    case 'complete':
      return 'bg-sky-100 text-sky-800'
    case 'generated':
      return 'bg-emerald-100 text-emerald-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

// ─── HEADER ────────────────────────────────────────────────────────
function Header() {
  const { entityConfig, activeReportId, isLoading, createReport } =
    useFinancialStore()

  const handleNew = async () => {
    try {
      await createReport()
      toast.success('Report created successfully')
    } catch {
      toast.error('Failed to create report')
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-base tracking-tight">
              FinStatements Pro
            </span>
          </div>
          {activeReportId && (
            <>
              <Separator
                orientation="vertical"
                className="h-6 bg-slate-600"
              />
              <div className="hidden sm:flex items-center gap-3 text-sm text-slate-300">
                <span className="font-medium text-white">
                  {entityConfig.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {entityConfig.periodLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5" />
                  {entityConfig.currency}
                </span>
              </div>
            </>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleNew}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">New Report</span>
        </Button>
      </div>
    </header>
  )
}

// ─── TAB BAR ───────────────────────────────────────────────────────
function TabBar() {
  const { activeTab, setActiveTab, activeReportId, entries } =
    useFinancialStore()

  const tabs: { value: TabType; label: string; icon: React.ReactNode }[] = [
    { value: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { value: 'trial-balance', label: 'Trial Balance', icon: <Table className="h-4 w-4" /> },
    { value: 'statements', label: 'Financial Statements', icon: <FileText className="h-4 w-4" /> },
    { value: 'export', label: 'Export PDF', icon: <Download className="h-4 w-4" /> },
  ]

  return (
    <div className="bg-white border-b border-slate-200 sticky top-14 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabType)}
        >
          <TabsList className="bg-transparent h-11 p-0 gap-0 border-b-0 rounded-none">
            {tabs.map((tab) => {
              const disabled =
                (tab.value === 'trial-balance' ||
                  tab.value === 'statements' ||
                  tab.value === 'export') &&
                !activeReportId
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={disabled}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-700 text-slate-500 h-11 px-4 gap-2 transition-colors"
                >
                  {tab.icon}
                  <span className="hidden sm:inline text-sm">
                    {tab.label}
                  </span>
                  {tab.value === 'trial-balance' && entries.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs bg-emerald-50 text-emerald-700"
                    >
                      {entries.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}

// ─── DASHBOARD TAB ─────────────────────────────────────────────────
function DashboardTab() {
  const { reports, loadReport, deleteReport, isLoading } = useFinancialStore()

  const handleLoad = async (id: string) => {
    try {
      await loadReport(id)
      toast.success('Report loaded')
    } catch {
      toast.error('Failed to load report')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteReport(id)
      toast.success('Report deleted')
    } catch {
      toast.error('Failed to delete report')
    }
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-slate-100 p-6 mb-6">
          <FolderOpen className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          No Reports Yet
        </h2>
        <p className="text-slate-500 mb-6 max-w-md">
          Create your first financial report to get started. You can set up
          entity details, enter trial balance data, and generate IPSAS-compliant
          statements.
        </p>
        <Button
          onClick={async () => {
            try {
              await useFinancialStore.getState().createReport()
              toast.success('Report created successfully')
            } catch {
              toast.error('Failed to create report')
            }
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Your First Report
        </Button>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Financial Reports
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {reports.length} report{reports.length !== 1 ? 's' : ''} in your
          workspace
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card
            key={report.id}
            className="cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
            onClick={() => handleLoad(report.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-semibold text-slate-800 leading-snug">
                  {report.entityName}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className={`text-xs ${statusColor(report.status)}`}
                >
                  {report.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {report.periodLabel}
                </div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  {report.entries.length} trial balance entries
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span>
                    {new Date(report.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(report.id, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── TRIAL BALANCE TAB ─────────────────────────────────────────────
function TrialBalanceTab() {
  const {
    entries,
    entityConfig,
    setEntityConfig,
    updateEntry,
    deleteEntry,
    addEntry,
    loadTemplate,
    saveTrialBalance,
    isLoading,
  } = useFinancialStore()

  const totalDebitCurrent = entries.reduce(
    (s, e) => s + (e.debitCurrent || 0),
    0
  )
  const totalCreditCurrent = entries.reduce(
    (s, e) => s + (e.creditCurrent || 0),
    0
  )
  const difference = totalDebitCurrent - totalCreditCurrent
  const isBalanced = Math.abs(difference) < 0.01

  const handleSave = async () => {
    try {
      await saveTrialBalance()
      toast.success('Trial balance saved and validated')
    } catch {
      toast.error('Failed to save trial balance')
    }
  }

  const handleLoadTemplate = () => {
    loadTemplate()
    toast.success('Template loaded')
  }

  return (
    <div className="py-4 space-y-4">
      {/* Entity Config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Entity Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Entity Name</Label>
              <Input
                className="h-9 text-sm"
                value={entityConfig.name}
                onChange={(e) =>
                  setEntityConfig({ name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">
                Period End Date
              </Label>
              <Input
                type="date"
                className="h-9 text-sm"
                value={entityConfig.periodEnd}
                onChange={(e) =>
                  setEntityConfig({ periodEnd: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Period Label</Label>
              <Input
                className="h-9 text-sm"
                value={entityConfig.periodLabel}
                onChange={(e) =>
                  setEntityConfig({ periodLabel: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Currency</Label>
              <Input
                className="h-9 text-sm"
                value={entityConfig.currency}
                onChange={(e) =>
                  setEntityConfig({ currency: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleLoadTemplate}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Load Template
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={addEntry}
        >
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
        <span className="text-xs text-slate-400 ml-2">
          {entries.length} entries
        </span>
      </div>

      {/* Trial Balance Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm min-w-[1200px]">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="px-1 py-2.5 text-center text-xs font-medium uppercase tracking-wide w-8">
                #
              </th>
              <th className="px-1 py-2.5 text-left text-xs font-medium uppercase tracking-wide w-24">
                Code
              </th>
              <th className="px-1 py-2.5 text-left text-xs font-medium uppercase tracking-wide">
                Account Name
              </th>
              <th className="px-1 py-2.5 text-left text-xs font-medium uppercase tracking-wide w-[160px]">
                Classification
              </th>
              <th className="px-1 py-2.5 text-left text-xs font-medium uppercase tracking-wide w-[200px]">
                Category
              </th>
              <th className="px-1 py-2.5 text-center text-xs font-medium uppercase tracking-wide w-16">
                Note
              </th>
              <th className="px-1 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-32">
                Dr. Current
              </th>
              <th className="px-1 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-32">
                Cr. Current
              </th>
              <th className="px-1 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-32">
                Dr. Prior
              </th>
              <th className="px-1 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-32">
                Cr. Prior
              </th>
              <th className="px-1 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <TBEntryRow
                key={(entry._id || entry._dbId) ?? index}
                entry={entry}
                index={index}
                onEntryChange={updateEntry}
                onDelete={deleteEntry}
              />
            ))}
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="py-12 text-center text-slate-400 text-sm"
                >
                  No entries. Click "Load Template" or "Add Row" to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Bar */}
      <Card className="bg-slate-50">
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Total Dr:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatNum(totalDebitCurrent)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Total Cr:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatNum(totalCreditCurrent)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Difference:</span>
                <Badge
                  variant="secondary"
                  className={`font-mono ${
                    isBalanced
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isBalanced
                    ? 'Balanced'
                    : formatNum(difference)}
                </Badge>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isLoading || entries.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Save & Validate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── STATEMENTS TAB ────────────────────────────────────────────────
function StatementsTab() {
  const {
    generatedStatements,
    entityConfig,
    statementSubTab,
    setStatementSubTab,
    generateStatements,
    isLoading,
  } = useFinancialStore()

  const handleGenerate = async () => {
    try {
      await generateStatements()
      toast.success('Statements generated successfully')
    } catch {
      toast.error('Failed to generate statements')
    }
  }

  const subTabs: { value: StatementSubTab; label: string }[] = [
    { value: 'sfp', label: 'Fin. Performance' },
    { value: 'balance-sheet', label: 'Fin. Position' },
    { value: 'changes-na', label: 'Changes in NA' },
    { value: 'cash-flow', label: 'Cash Flow' },
    { value: 'revenue-recon', label: 'Revenue Reconciliation' },
    { value: 'cash-recon', label: 'Cash Reconciliation' },
    { value: 'budget-variance', label: 'Budget Variance' },
  ]

  if (!generatedStatements) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-slate-100 p-6 mb-6">
          <FileText className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Generate Financial Statements
        </h2>
        <p className="text-slate-500 mb-6 max-w-md">
          Save your trial balance first, then generate IPSAS-compliant
          financial statements including the Statement of Financial Performance,
          Balance Sheet, and supporting schedules.
        </p>
        <Button
          onClick={handleGenerate}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Generate Statements
        </Button>
      </div>
    )
  }

  const hasErrors =
    generatedStatements.validationErrors &&
    generatedStatements.validationErrors.length > 0

  return (
    <div className="py-4 space-y-4">
      {/* Validation alerts */}
      {hasErrors ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {generatedStatements.validationErrors.length} Validation
            Issue(s)
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
              {generatedStatements.validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800">
            All checks passed
          </AlertTitle>
          <AlertDescription className="text-emerald-700">
            The generated statements have passed all validation checks.
          </AlertDescription>
        </Alert>
      )}

      {/* Re-generate button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isLoading}
          className="gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Re-generate
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {subTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatementSubTab(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statementSubTab === tab.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statement content */}
      {statementSubTab === 'sfp' && (
        <SFPSection
          data={generatedStatements.sfp}
          currency={entityConfig.currency}
        />
      )}
      {statementSubTab === 'balance-sheet' && (
        <BalanceSheetSection
          data={generatedStatements.balanceSheet}
          currency={entityConfig.currency}
        />
      )}
      {statementSubTab === 'changes-na' && (
        <ChangesNASection
          data={generatedStatements.changesInNA}
          currency={entityConfig.currency}
        />
      )}
      {statementSubTab === 'cash-flow' && (
        <CashFlowSection
          data={generatedStatements.cashFlow}
          currency={entityConfig.currency}
        />
      )}
      {statementSubTab === 'revenue-recon' && (
        <RevenueReconSection
          data={generatedStatements.revenueReconciliation}
          currency={entityConfig.currency}
        />
      )}
      {statementSubTab === 'cash-recon' && (
        <CashReconSection
          data={generatedStatements.cashReconciliation}
          currency={entityConfig.currency}
        />
      )}
      {statementSubTab === 'budget-variance' && (
        <BudgetVarianceSection
          data={generatedStatements.budgetVariance}
          currency={entityConfig.currency}
        />
      )}
    </div>
  )
}

// ─── STATEMENT SUB-SECTIONS ────────────────────────────────────────

function toStatementRow(line: SFPLine | BSLine): StatementRow {
  return {
    label: line.label,
    noteRef: line.noteRef,
    current: line.current,
    prior: line.prior,
    indent: line.indent,
    isBold: line.isBold,
    isSubtotal: line.isSubtotal,
    isTotal: line.isTotal,
    isSection: line.isSection,
  }
}

function SFPSection({
  data,
  currency,
}: {
  data: GeneratedStatements['sfp']
  currency: string
}) {
  const allRows: StatementRow[] = [
    ...data.revenueLines.map(toStatementRow),
    { label: '', noteRef: '', current: 0, prior: 0 },
    ...data.expenseLines.map(toStatementRow),
    { label: '', noteRef: '', current: 0, prior: 0, isSection: true },
    {
      label: 'SURPLUS / (DEFICIT)',
      noteRef: '',
      current: data.surplusCurrent,
      prior: data.surplusPrior,
      isBold: true,
      isTotal: true,
    },
  ]
  return (
    <StatementTable
      title="Statement of Financial Performance"
      rows={allRows}
      currency={currency}
    />
  )
}

function BalanceSheetSection({
  data,
  currency,
}: {
  data: GeneratedStatements['balanceSheet']
  currency: string
}) {
  const allRows: StatementRow[] = [
    ...data.assetLines.map(toStatementRow),
    { label: '', noteRef: '', current: 0, prior: 0 },
    ...data.liabilityLines.map(toStatementRow),
  ]
  return (
    <StatementTable
      title="Statement of Financial Position"
      rows={allRows}
      currency={currency}
    />
  )
}

function ChangesNASection({
  data,
  currency,
}: {
  data: GeneratedStatements['changesInNA']
  currency: string
}) {
  const rows: StatementRow[] = [
    {
      label: 'NET ASSETS',
      noteRef: '',
      current: 0,
      prior: 0,
      isBold: true,
      isSection: true,
    },
    { label: 'Brought forward', noteRef: '', current: data.bfCurrent, prior: data.bfPrior, indent: 1 },
    { label: 'Adjustments', noteRef: '', current: data.adjustmentsCurrent, prior: data.adjustmentsPrior, indent: 1 },
    { label: 'Surplus/(Deficit) for the year', noteRef: '', current: data.surplusCurrent, prior: data.surplusPrior, indent: 1, isBold: true },
    { label: 'Closing Net Assets', noteRef: '', current: data.closingCurrent, prior: data.closingPrior, indent: 1, isBold: true, isTotal: true },
  ]
  return (
    <StatementTable
      title="Statement of Changes in Net Assets"
      rows={rows}
      currency={currency}
    />
  )
}

function CashFlowSection({
  data,
  currency,
}: {
  data: CashFlowData
  currency: string
}) {
  const rows: StatementRow[] = [
    { label: 'CASH FLOWS FROM OPERATING ACTIVITIES', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true },
    { label: 'Operating revenue received', noteRef: '', current: data.operatingRevenueCurrent, prior: data.operatingRevenuePrior, indent: 1 },
    ...data.payments.map(
      (p): StatementRow => ({
        label: `Payments - ${p.label}`,
        noteRef: p.noteRef,
        current: -Math.abs(p.current),
        prior: -Math.abs(p.prior),
        indent: 1,
      })
    ),
    { label: 'Net cash from operating activities', noteRef: '', current: data.netOperatingCurrent, prior: data.netOperatingPrior, isBold: true, isTotal: true },
    { label: '', noteRef: '', current: 0, prior: 0 },
    { label: 'CASH FLOWS FROM INVESTING ACTIVITIES', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true },
    ...data.investing.map(
      (inv): StatementRow => ({
        label: inv.label,
        noteRef: '',
        current: inv.current,
        prior: inv.prior,
        indent: 1,
      })
    ),
    { label: 'Net cash from investing activities', noteRef: '', current: data.netInvestingCurrent, prior: data.netInvestingPrior, isBold: true, isTotal: true },
    { label: '', noteRef: '', current: 0, prior: 0 },
    { label: 'CASH FLOWS FROM FINANCING ACTIVITIES', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true },
    ...(data.financing.length > 0
      ? data.financing.map(
          (f): StatementRow => ({
            label: f.label,
            noteRef: '',
            current: f.current,
            prior: f.prior,
            indent: 1,
          })
        )
      : [{ label: '(None)', noteRef: '', current: 0, prior: 0, indent: 1 } as StatementRow]),
    { label: 'Net cash from financing activities', noteRef: '', current: data.netFinancingCurrent, prior: data.netFinancingPrior, isBold: true, isTotal: true },
    { label: '', noteRef: '', current: 0, prior: 0 },
    { label: 'Net increase/(decrease) in cash', noteRef: '', current: data.netChangeCurrent, prior: data.netChangePrior, isBold: true, isTotal: true },
  ]
  return (
    <StatementTable
      title="Cash Flow Statement"
      rows={rows}
      currency={currency}
    />
  )
}

function RevenueReconSection({
  data,
  currency,
}: {
  data: RevenueReconciliationData
  currency: string
}) {
  const rows: StatementRow[] = [
    { label: 'REVENUE RECONCILIATION', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true },
    { label: 'Revenue per SFP', noteRef: '', current: data.sfpRevenueCurrent, prior: data.sfpRevenuePrior, indent: 1 },
    { label: 'Advances recovered', noteRef: '', current: data.advancesRecoveredCurrent, prior: data.advancesRecoveredPrior, indent: 1 },
    { label: 'Revenue receivable collected during the period', noteRef: '', current: data.revenueReceivableCollectedCurrent, prior: data.revenueReceivableCollectedPrior, indent: 1 },
    { label: 'Deposits received', noteRef: '', current: data.depositsReceivedCurrent, prior: data.depositsReceivedPrior, indent: 1 },
    { label: 'Total Revenue for CF purposes', noteRef: '', current: data.totalRevenueCFCurrent, prior: data.totalRevenueCFPrior, isBold: true, indent: 1 },
    { label: 'Less: Grants in kind', noteRef: '', current: -data.grantsInKindCurrent, prior: -data.grantsInKindPrior, indent: 1 },
    { label: 'Less: Transfers to Treasury', noteRef: '', current: -data.transfersToTreasuryCurrent, prior: -data.transfersToTreasuryPrior, indent: 1 },
    { label: 'Less: Revenue receivable at period end', noteRef: '', current: -data.revenueReceivablePeriodCurrent, prior: -data.revenueReceivablePeriodPrior, indent: 1 },
    { label: 'Total Revenue in Cash Flow Statement', noteRef: '', current: data.totalRevenueCashFlowCurrent, prior: data.totalRevenueCashFlowPrior, isBold: true, isTotal: true },
  ]
  return (
    <StatementTable
      title="Revenue Reconciliation to Cash Flow Statement"
      rows={rows}
      currency={currency}
    />
  )
}

function CashReconSection({
  data,
  currency,
}: {
  data: CashReconciliationData
  currency: string
}) {
  const rows: StatementRow[] = [
    { label: 'CASH RECONCILIATION', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true },
    { label: 'Cash at beginning of period', noteRef: '', current: data.openingCashCurrent, prior: data.openingCashPrior, indent: 1 },
    { label: 'Net increase/(decrease) in cash', noteRef: '', current: data.netChangeCurrent, prior: data.netChangePrior, indent: 1 },
    { label: 'Cash at end of period', noteRef: '', current: data.closingCashCurrent, prior: data.closingCashPrior, isBold: true, isTotal: true },
  ]
  return (
    <StatementTable
      title="Cash and Cash Equivalents Reconciliation"
      rows={rows}
      currency={currency}
    />
  )
}

function BudgetVarianceSection({
  data,
  currency,
}: {
  data: BudgetVarianceData[]
  currency: string
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        No budget data available. Enter budget amounts in the trial balance to
        see variance analysis.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">
        Budget Variance Analysis
      </h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide">
                Line Item
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
                Initial Budget
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
                Adjustments
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
                Revised Budget
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
                Actual
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
                Variance
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
                Var %
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const varPositive = row.variance >= 0
              return (
                <tr
                  key={i}
                  className="border-b border-slate-100 hover:bg-slate-50/50"
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
                      varPositive
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {formatNum(row.variance)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-mono text-xs ${
                      varPositive
                        ? 'text-emerald-700'
                        : 'text-red-700'
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
    </div>
  )
}

// ─── EXPORT TAB ─────────────────────────────────────────────────────
function ExportTab() {
  const { generatedStatements, entityConfig, activeReportId } =
    useFinancialStore()
  const [isExporting, setIsExporting] = React.useState(false)

  const handleDownloadPdf = async () => {
    if (!activeReportId) return
    setIsExporting(true)
    try {
      const res = await fetch(`/api/reports/${activeReportId}/pdf`)
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${entityConfig.name.replace(/\s+/g, '_')}_Financial_Statements.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded successfully')
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="py-6 space-y-6">
      {!activeReportId ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Select a report first to access export options.
        </div>
      ) : !generatedStatements ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Generate statements first before exporting.
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">
              Export to PDF
            </h2>
            <p className="text-sm text-slate-500">
              Preview and export your financial statements for{' '}
              <span className="font-medium text-slate-700">
                {entityConfig.name}
              </span>{' '}
              — {entityConfig.periodLabel}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold font-mono text-slate-800">
                  {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.sfp.totalRevenueCurrent)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Prior: {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.sfp.totalRevenuePrior)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold font-mono text-slate-800">
                  {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.sfp.totalExpensesCurrent)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Prior: {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.sfp.totalExpensesPrior)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Surplus / (Deficit)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p
                  className={`text-2xl font-bold font-mono ${
                    generatedStatements.sfp.surplusCurrent >= 0
                      ? 'text-emerald-700'
                      : 'text-red-700'
                  }`}
                >
                  {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.sfp.surplusCurrent)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Prior: {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.sfp.surplusPrior)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Total Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold font-mono text-slate-800">
                  {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.balanceSheet.totalAssetsCurrent)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Prior: {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.balanceSheet.totalAssetsPrior)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Total Liabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold font-mono text-slate-800">
                  {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.balanceSheet.totalLiabilitiesCurrent)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Prior: {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.balanceSheet.totalLiabilitiesPrior)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Net Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold font-mono text-slate-800">
                  {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.balanceSheet.netAssetsCurrent)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Prior: {entityConfig.currency}{' '}
                  {formatNum(generatedStatements.balanceSheet.netAssetsPrior)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Download Button */}
          <Card>
            <CardContent className="py-8 flex flex-col items-center text-center">
              <Download className="h-10 w-10 text-emerald-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Download Complete Financial Statements
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Generates a professionally formatted PDF with all statements
                including cover page, SFP, Balance Sheet, Cash Flow, and
                supporting reconciliations.
              </p>
              <Button
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? 'Generating PDF...' : 'Download PDF'}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────
export default function Home() {
  const { activeTab, fetchReports } = useFinancialStore()

  const stableFetch = useCallback(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    stableFetch()
  }, [stableFetch])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <TabBar />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'trial-balance' && <TrialBalanceTab />}
        {activeTab === 'statements' && <StatementsTab />}
        {activeTab === 'export' && <ExportTab />}
      </main>
      <footer className="border-t border-slate-100 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>FinStatements Pro — Government Financial Statements Generator</span>
          <span>IPSAS Compliant</span>
        </div>
      </footer>
    </div>
  )
}
