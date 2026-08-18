'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale, Plus, LayoutDashboard, Table, FileText, Download, Trash2,
  FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, FolderOpen,
  Loader2, Calendar, Banknote, Sun, Moon, X, BarChart3, TrendingUp,
  TrendingDown, Shield, Clock, ClipboardCheck, User, ChevronRight,
  Info, Sparkles, Copy, Eye, GitBranch, Play, AlertCircle, ArrowLeft,
  CircleDot, Save, Wand2, History, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  useFinancialStore,
  type WizardStep, type StatementSubTab,
  type Report, type AuditLogEntry, type ComplianceItem,
  type ApprovalWorkflow, type VersionEntry,
} from '@/components/financials/store'
import { TBEntryRow } from '@/components/financials/tb-entry-row'
import { StatementTable, type StatementRow } from '@/components/financials/statement-table'
import type {
  GeneratedStatements, SFPLine, BSLine, CashFlowData,
  RevenueReconciliationData, CashReconciliationData, BudgetVarianceData,
} from '@/lib/financial-engine'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function statusColor(status: string) {
  switch (status) {
    case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'complete': return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400'
    case 'generated': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'in_review': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'pending_approval': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    default: return 'bg-muted text-muted-foreground'
  }
}

const WIZARD_STEPS = [
  { step: 1, label: 'Entity Setup', icon: <User className="h-4 w-4" /> },
  { step: 2, label: 'Trial Balance', icon: <Table className="h-4 w-4" /> },
  { step: 3, label: 'Supplementary', icon: <ClipboardCheck className="h-4 w-4" /> },
  { step: 4, label: 'Review', icon: <Shield className="h-4 w-4" /> },
  { step: 5, label: 'Generate & Export', icon: <FileText className="h-4 w-4" /> },
]

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

// ═══════════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════════

function Header() {
  const { theme, setTheme } = useTheme()
  const { entityConfig, activeReportId, isLoading, createReport, showAnalytics, setShowAnalytics } = useFinancialStore()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const handleNew = async () => {
    try {
      await createReport()
      toast.success('Report created successfully')
    } catch {
      toast.error('Failed to create report')
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight">
              FinStatements <span className="text-primary">Pro</span>
            </span>
          </div>
          {activeReportId && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{entityConfig.name}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{entityConfig.periodLabel}</span>
                <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" />{entityConfig.currency}</span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeReportId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAnalytics(!showAnalytics)}>
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Analytics Panel</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {mounted && (theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Toggle theme</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button size="sm" onClick={handleNew} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="hidden sm:inline">New Report</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════
// WIZARD PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════

function WizardProgressBar() {
  const { wizardStep, setWizardStep, entries, supplementaryData, complianceData, generatedStatements } = useFinancialStore()

  const stepComplete = (s: number): boolean => {
    if (s === 1) return true
    if (s === 2) return entries.length > 0
    if (s === 3) return supplementaryData !== null
    if (s === 4) return supplementaryData !== null
    if (s === 5) return complianceData !== null || generatedStatements !== null
    return false
  }

  return (
    <div className="bg-muted/50 border-b border-border">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 py-2 overflow-x-auto">
          {WIZARD_STEPS.map(({ step, label, icon }) => {
            const isActive = wizardStep === step
            const isComplete = step < wizardStep || stepComplete(step)
            const canNavigate = isComplete && step !== wizardStep
            return (
              <React.Fragment key={step}>
                {step > 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />}
                <button
                  onClick={() => canNavigate ? setWizardStep(step as WizardStep) : undefined}
                  disabled={!canNavigate && !isActive}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isComplete
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'
                        : 'text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold border current:border-current">
                    {isComplete && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : icon}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STATUS BAR
// ═══════════════════════════════════════════════════════════════════

function StatusBar() {
  const { entries, supplementaryData, complianceData, approvalWorkflow } = useFinancialStore()
  const totalDr = entries.reduce((s, e) => s + (e.debitCurrent || 0), 0)
  const totalCr = entries.reduce((s, e) => s + (e.creditCurrent || 0), 0)
  const tbBalanced = Math.abs(totalDr - totalCr) < 0.01

  const suppFields = supplementaryData
    ? ['accountingOfficer', 'chiefFinanceOfficer', 'internalAuditHead', 'depreciationRate', 'employeeCount']
        .filter(k => { const v = supplementaryData[k as keyof typeof supplementaryData]; return v !== '' && v !== 0 })
    : []
  const suppComplete = suppFields.length

  const approvalStep = approvalWorkflow?.currentStep || 'draft'

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 sm:px-6 py-2 text-[11px] text-muted-foreground bg-card border-b border-border">
      <span className="flex items-center gap-1">
        Trial Balance: {tbBalanced ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-destructive" />}
        <span className={tbBalanced ? 'text-primary font-medium' : 'text-destructive font-medium'}>{tbBalanced ? 'Balanced' : 'Unbalanced'}</span>
      </span>
      <span className="flex items-center gap-1">
        Supplementary: <span className="font-medium text-foreground">{suppComplete}/5</span>
      </span>
      <span className="flex items-center gap-1">
        Validation: {complianceData ? <span className="font-medium text-primary">{complianceData.score}% compliant</span> : <span className="font-medium">Not run</span>}
      </span>
      <span className="flex items-center gap-1">
        Approval: <Badge variant="outline" className="h-5 text-[10px] px-1.5 font-mono">{approvalStep}</Badge>
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STEP 1: ENTITY SETUP
// ═══════════════════════════════════════════════════════════════════

function Step1EntitySetup() {
  const { entityConfig, setEntityConfig, wizardStep, setWizardStep, entries, activeReportId } = useFinancialStore()

  const canProceed = entityConfig.name.trim() !== '' && entityConfig.periodEnd !== ''

  return (
    <motion.div {...pageVariants} className="py-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Entity Setup</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure the reporting entity details and period information.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entity Information</CardTitle>
          <CardDescription>These details appear on all generated financial statements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      Entity Name <Info className="h-3 w-3" />
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent><p>The name of the government entity (e.g., Ministry of Finance)</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input className="h-9 text-sm" value={entityConfig.name} onChange={(e) => setEntityConfig({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      Period End Date <Info className="h-3 w-3" />
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent><p>The last day of the reporting period (e.g., 2025-06-30)</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input type="date" className="h-9 text-sm" value={entityConfig.periodEnd} onChange={(e) => setEntityConfig({ periodEnd: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      Period Label <Info className="h-3 w-3" />
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent><p>Human-readable period label displayed on statements (e.g., &quot;30 June 2025&quot;)</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input className="h-9 text-sm" value={entityConfig.periodLabel} onChange={(e) => setEntityConfig({ periodLabel: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      Currency <Info className="h-3 w-3" />
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent><p>The reporting currency symbol (e.g., Shs, UGX, USD)</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input className="h-9 text-sm" value={entityConfig.currency} onChange={(e) => setEntityConfig({ currency: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>
      {activeReportId && (
        <div className="flex justify-end">
          <Button onClick={() => setWizardStep(2)} disabled={!canProceed} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            Continue to Trial Balance <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STEP 2: TRIAL BALANCE
// ═══════════════════════════════════════════════════════════════════

function Step2TrialBalance() {
  const {
    entries, entityConfig, setEntityConfig, updateEntry, deleteEntry, addEntry,
    loadTemplate, saveTrialBalance, isLoading, wizardStep, setWizardStep, autoBalance,
  } = useFinancialStore()
  const [autoBalancing, setAutoBalancing] = useState(false)
  const [showAutoBalanceDialog, setShowAutoBalanceDialog] = useState(false)

  const totalDebitCurrent = entries.reduce((s, e) => s + (e.debitCurrent || 0), 0)
  const totalCreditCurrent = entries.reduce((s, e) => s + (e.creditCurrent || 0), 0)
  const totalDebitPrior = entries.reduce((s, e) => s + (e.debitPrior || 0), 0)
  const totalCreditPrior = entries.reduce((s, e) => s + (e.creditPrior || 0), 0)
  const diffCurrent = totalDebitCurrent - totalCreditCurrent
  const diffPrior = totalDebitPrior - totalCreditPrior
  const isBalancedCurrent = Math.abs(diffCurrent) < 0.01
  const isBalancedPrior = Math.abs(diffPrior) < 0.01
  const isBalanced = isBalancedCurrent && isBalancedPrior

  const handleSave = async () => {
    try {
      await saveTrialBalance()
      toast.success('Trial balance saved and validated')
    } catch {
      toast.error('Failed to save trial balance')
    }
  }

  const handleAutoBalance = async () => {
    setAutoBalancing(true)
    try {
      await autoBalance()
      toast.success('Trial balance auto-balanced')
      setShowAutoBalanceDialog(false)
    } catch {
      toast.error('Failed to auto-balance')
    } finally {
      setAutoBalancing(false)
    }
  }

  return (
    <motion.div {...pageVariants} className="py-4 space-y-4">
      {/* Balance Indicator Banner */}
      <Card className={`border-l-4 ${isBalanced ? 'border-l-primary bg-primary/5' : 'border-l-destructive bg-destructive/5'}`}>
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isBalanced
                ? <CheckCircle2 className="h-5 w-5 text-primary" />
                : <AlertCircle className="h-5 w-5 text-destructive" />}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isBalanced ? 'Trial Balance is Balanced' : 'Trial Balance is NOT Balanced'}
                </p>
                {!isBalanced && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Current diff: {entityConfig.currency} {formatNum(diffCurrent)}
                    {diffPrior !== 0 && ` | Prior diff: ${entityConfig.currency} ${formatNum(diffPrior)}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isBalanced && (
                <Dialog open={showAutoBalanceDialog} onOpenChange={setShowAutoBalanceDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5" disabled={entries.length === 0}>
                      <Wand2 className="h-4 w-4" /> Auto-Balance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Auto-Balance Trial Balance</DialogTitle>
                      <DialogDescription>
                        This will create a &quot;Suspense&quot; entry to zero out the difference between debits and credits.
                        Current difference: {entityConfig.currency} {formatNum(diffCurrent)}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAutoBalanceDialog(false)}>Cancel</Button>
                      <Button onClick={handleAutoBalance} disabled={autoBalancing} className="bg-primary text-primary-foreground gap-2">
                        {autoBalancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        Auto-Balance
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { loadTemplate(); toast.success('Template loaded') }}>
                <FileSpreadsheet className="h-4 w-4" /> Load Template
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Load the standard IPSAS chart of accounts template</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={addEntry}>
                <Plus className="h-4 w-4" /> Add Row
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Add a new blank trial balance entry</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                navigator.clipboard.writeText('Paste from Excel: select cells in Excel, copy, then paste into the table')
                toast.info('Tip: Copy cells from Excel and paste directly into the account fields')
              }}>
                <Copy className="h-4 w-4" /> Paste from Excel
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Copy cells from Excel and paste into account fields</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-xs text-muted-foreground ml-2">{entries.length} entries</span>
        <div className="ml-auto flex items-center gap-3 text-xs font-mono">
          <span className="text-muted-foreground">Dr: <span className="text-foreground font-semibold">{formatNum(totalDebitCurrent)}</span></span>
          <span className="text-muted-foreground">Cr: <span className="text-foreground font-semibold">{formatNum(totalCreditCurrent)}</span></span>
          <Badge variant={isBalanced ? 'default' : 'destructive'} className="text-[10px]">
            {isBalanced ? '✓ Balanced' : `Δ ${formatNum(diffCurrent)}`}
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm min-w-[1400px]">
          <thead>
            <tr className="bg-foreground text-background">
              <th className="px-1 py-2.5 text-center text-xs font-medium uppercase tracking-wide w-8">#</th>
              <th className="px-1 py-2.5 text-left text-xs font-medium uppercase tracking-wide w-24">Code</th>
              <th className="px-1 py-2.5 text-left text-xs font-medium uppercase tracking-wide">Account Name</th>
              <th className="px-1 py-2.5 text-left text-xs font-medium uppercase tracking-wide w-[160px]">Classification</th>
              <th className="px-1 py-2.5 text-left text-xs font-medium uppercase tracking-wide w-[200px]">Category</th>
              <th className="px-1 py-2.5 text-center text-xs font-medium uppercase tracking-wide w-12">Note</th>
              <th className="px-1 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-28">Dr. Current</th>
              <th className="px-1 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-28">Cr. Current</th>
              <th className="px-1 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-28">Dr. Prior</th>
              <th className="px-1 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-28">Cr. Prior</th>
              <th className="px-1 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-24">Budget Init</th>
              <th className="px-1 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-24">Budget Adj</th>
              <th className="px-1 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <TBEntryRow key={(entry._id || entry._dbId) ?? index} entry={entry} index={index} onEntryChange={updateEntry} onDelete={deleteEntry} />
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={13} className="py-16 text-center text-muted-foreground text-sm">
                  <div className="flex flex-col items-center gap-3">
                    <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
                    <p>No entries yet. Click &quot;Load Template&quot; or &quot;Add Row&quot; to begin.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Actions */}
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setWizardStep(1)} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSave} disabled={isLoading || entries.length === 0} className="bg-primary text-primary-foreground gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save & Validate
              </Button>
            </div>
            <Button onClick={() => setWizardStep(3)} className="bg-primary text-primary-foreground gap-2">
              Continue to Supplementary <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STEP 3: SUPPLEMENTARY DATA
// ═══════════════════════════════════════════════════════════════════

function Step3Supplementary() {
  const { supplementaryData, setSupplementaryData, saveSupplementary, isLoading, fetchSupplementary, wizardStep, setWizardStep, activeReportId } = useFinancialStore()
  const [saving, setSaving] = useState(false)
  const [localData, setLocalData] = useState<Record<string, string | number>>({})

  useEffect(() => {
    if (activeReportId) fetchSupplementary()
  }, [activeReportId, fetchSupplementary])

  useEffect(() => {
    if (supplementaryData) {
      setLocalData({ ...supplementaryData })
    }
  }, [supplementaryData])

  const update = (key: string, value: string | number) => {
    setLocalData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSupplementary(localData)
      toast.success('Supplementary data saved')
    } catch {
      toast.error('Failed to save supplementary data')
    } finally {
      setSaving(false)
    }
  }

  const d = localData

  const FieldGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )

  const YearInput = ({ label, currentKey, priorKey, tooltip }: { label: string; currentKey: string; priorKey: string; tooltip: string }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <TooltipProvider><Tooltip><TooltipTrigger asChild>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">{label} (Current) <Info className="h-3 w-3" /></Label>
          <Input type="number" className="h-8 text-sm font-mono" value={d[currentKey] ?? 0} onChange={e => update(currentKey, parseFloat(e.target.value) || 0)} />
        </div>
      </TooltipTrigger><TooltipContent><p>{tooltip}</p></TooltipContent></Tooltip></TooltipProvider>
      <TooltipProvider><Tooltip><TooltipTrigger asChild>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{label} (Prior)</Label>
          <Input type="number" className="h-8 text-sm font-mono" value={d[priorKey] ?? 0} onChange={e => update(priorKey, parseFloat(e.target.value) || 0)} />
        </div>
      </TooltipTrigger><TooltipContent><p>{tooltip}</p></TooltipContent></Tooltip></TooltipProvider>
    </div>
  )

  return (
    <motion.div {...pageVariants} className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Supplementary Data</h2>
          <p className="text-sm text-muted-foreground mt-1">Additional data for cash flow reconciliation, PPE schedules, and disclosures.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || isLoading} className="bg-primary text-primary-foreground gap-2">
          {saving || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>

      <div className="grid gap-4">
        <FieldGroup title="Cash Flow Adjustments">
          <div className="grid gap-3">
            <YearInput label="Advances Recovered" currentKey="advancesRecovered" priorKey="advancesRecoveredPrior" tooltip="Amount recovered from advances made in prior periods, added back to revenue for cash flow" />
            <YearInput label="Deposits Received" currentKey="depositsReceived" priorKey="depositsReceivedPrior" tooltip="Refundable deposits received during the period - not revenue" />
            <YearInput label="Transfers to Treasury" currentKey="transfersToTreasury" priorKey="transfersToTreasuryPrior" tooltip="Amounts transferred to the Consolidated Fund - deducted from cash flow revenue" />
            <YearInput label="Revenue in Kind / Tax Waivers" currentKey="revenueInKindTaxWaivers" priorKey="revenueInKindTaxWaiversPrior" tooltip="Non-cash revenue such as tax waivers and in-kind grants - deducted from cash flow revenue" />
          </div>
        </FieldGroup>

        <FieldGroup title="PPE Movement Schedule">
          <div className="grid gap-3">
            <YearInput label="Opening Balance (PPE)" currentKey="ppeOpeningCurrent" priorKey="ppeOpeningPrior" tooltip="Opening balance of property, plant and equipment" />
            <YearInput label="Additions (PPE)" currentKey="ppeAdditionsCurrent" priorKey="ppeAdditionsPrior" tooltip="New PPE acquired during the period" />
            <YearInput label="Disposals (PPE)" currentKey="ppeDisposalsCurrent" priorKey="ppeDisposalsPrior" tooltip="PPE disposed of during the period at cost" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">Depreciation Rate (%) <Info className="h-3 w-3" /></Label>
                  <Input type="number" className="h-8 text-sm font-mono" value={d.depreciationRate ?? 0} onChange={e => update('depreciationRate', parseFloat(e.target.value) || 0)} />
                </div>
              </TooltipTrigger><TooltipContent><p>Annual depreciation rate as a percentage</p></TooltipContent></Tooltip></TooltipProvider>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Depreciation Method</Label>
                <Select value={d.depreciationMethod as string || 'straight-line'} onValueChange={v => update('depreciationMethod', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="straight-line">Straight-Line</SelectItem>
                    <SelectItem value="reducing-balance">Reducing Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </FieldGroup>

        <FieldGroup title="Employee Costs (Note 9)">
          <div className="grid gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">Employee Headcount <Info className="h-3 w-3" /></Label>
                  <Input type="number" className="h-8 text-sm font-mono" value={d.employeeCount ?? 0} onChange={e => update('employeeCount', parseInt(e.target.value) || 0)} />
                </div>
              </TooltipTrigger><TooltipContent><p>Total number of employees at period end</p></TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Salaries & Wages</Label>
                  <Input type="number" className="h-8 text-sm font-mono" value={d.salariesWages ?? 0} onChange={e => update('salariesWages', parseFloat(e.target.value) || 0)} />
                </div>
              </TooltipTrigger><TooltipContent><p>Total gross salaries and wages for the period</p></TooltipContent></Tooltip></TooltipProvider>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pension Contributions</Label>
                  <Input type="number" className="h-8 text-sm font-mono" value={d.pensionContributions ?? 0} onChange={e => update('pensionContributions', parseFloat(e.target.value) || 0)} />
                </div>
              </TooltipTrigger><TooltipContent><p>Employer pension contributions for the period</p></TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Payroll Taxes</Label>
                  <Input type="number" className="h-8 text-sm font-mono" value={d.payrollTaxes ?? 0} onChange={e => update('payrollTaxes', parseFloat(e.target.value) || 0)} />
                </div>
              </TooltipTrigger><TooltipContent><p>PAYE and other payroll taxes paid</p></TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Other Benefits</Label>
                  <Input type="number" className="h-8 text-sm font-mono" value={d.otherEmployeeBenefits ?? 0} onChange={e => update('otherEmployeeBenefits', parseFloat(e.target.value) || 0)} />
                </div>
              </TooltipTrigger><TooltipContent><p>Medical, housing, transport, and other employee benefits</p></TooltipContent></Tooltip></TooltipProvider>
            </div>
          </div>
        </FieldGroup>

        <FieldGroup title="Prior Year Adjustments & Reserves">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">Adjustments <Info className="h-3 w-3" /></Label>
                <Input type="number" className="h-8 text-sm font-mono" value={d.priorYearAdjustments ?? 0} onChange={e => update('priorYearAdjustments', parseFloat(e.target.value) || 0)} />
              </div>
            </TooltipTrigger><TooltipContent><p>Prior year error corrections and adjustments</p></TooltipContent></Tooltip></TooltipProvider>
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Revaluation Reserves</Label>
                <Input type="number" className="h-8 text-sm font-mono" value={d.revaluationReserves ?? 0} onChange={e => update('revaluationReserves', parseFloat(e.target.value) || 0)} />
              </div>
            </TooltipTrigger><TooltipContent><p>Asset revaluation surplus/deficit for the period</p></TooltipContent></Tooltip></TooltipProvider>
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Transfers to UCF</Label>
                <Input type="number" className="h-8 text-sm font-mono" value={d.transfersToUCF ?? 0} onChange={e => update('transfersToUCF', parseFloat(e.target.value) || 0)} />
              </div>
            </TooltipTrigger><TooltipContent><p>Transfers to the Uniform Clearing Fund</p></TooltipContent></Tooltip></TooltipProvider>
          </div>
        </FieldGroup>

        <FieldGroup title="Signatory Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">Accounting Officer <Info className="h-3 w-3" /></Label>
                <Input className="h-8 text-sm" value={d.accountingOfficer ?? ''} onChange={e => update('accountingOfficer', e.target.value)} />
              </div>
            </TooltipTrigger><TooltipContent><p>Name of the Accounting Officer who signs off the statements</p></TooltipContent></Tooltip></TooltipProvider>
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Chief Finance Officer</Label>
                <Input className="h-8 text-sm" value={d.chiefFinanceOfficer ?? ''} onChange={e => update('chiefFinanceOfficer', e.target.value)} />
              </div>
            </TooltipTrigger><TooltipContent><p>Name of the CFO</p></TooltipContent></Tooltip></TooltipProvider>
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Internal Audit Head</Label>
                <Input className="h-8 text-sm" value={d.internalAuditHead ?? ''} onChange={e => update('internalAuditHead', e.target.value)} />
              </div>
            </TooltipTrigger><TooltipContent><p>Name of the Head of Internal Audit</p></TooltipContent></Tooltip></TooltipProvider>
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Signatory Date</Label>
                <Input type="date" className="h-8 text-sm" value={d.signatoryDate ?? ''} onChange={e => update('signatoryDate', e.target.value)} />
              </div>
            </TooltipTrigger><TooltipContent><p>Date the statements are signed</p></TooltipContent></Tooltip></TooltipProvider>
          </div>
        </FieldGroup>

        <FieldGroup title="Accounting Policies & Exchange Rates">
          <div className="grid gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">IPSAS Basis <Info className="h-3 w-3" /></Label>
                  <Select value={d.ipsasBasis as string || 'IPSAS Accrual Basis'} onValueChange={v => update('ipsasBasis', v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IPSAS Accrual Basis">IPSAS Accrual Basis</SelectItem>
                      <SelectItem value="IPSAS Cash Basis">IPSAS Cash Basis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger><TooltipContent><p>The basis of accounting used</p></TooltipContent></Tooltip></TooltipProvider>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">USD Exchange Rate</Label>
                <Input type="number" className="h-8 text-sm font-mono" step="0.0001" value={d.exchangeRateUSD ?? 1} onChange={e => update('exchangeRateUSD', parseFloat(e.target.value) || 1)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">EUR Exchange Rate</Label>
                <Input type="number" className="h-8 text-sm font-mono" step="0.0001" value={d.exchangeRateEUR ?? 1} onChange={e => update('exchangeRateEUR', parseFloat(e.target.value) || 1)} />
              </div>
            </div>
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">Accounting Policies (free text) <Info className="h-3 w-3" /></Label>
                <Textarea className="min-h-[80px] text-sm" value={d.accountingPolicies ?? ''} onChange={e => update('accountingPolicies', e.target.value)} placeholder="Describe the entity's significant accounting policies..." />
              </div>
            </TooltipTrigger><TooltipContent><p>Disclosure of significant accounting policies per IPSAS 1</p></TooltipContent></Tooltip></TooltipProvider>
          </div>
        </FieldGroup>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={() => setWizardStep(2)} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={async () => { await handleSave(); setWizardStep(4); }} className="bg-primary text-primary-foreground gap-2">
              Continue to Review <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STEP 4: REVIEW & VALIDATE
// ═══════════════════════════════════════════════════════════════════

function Step4Review() {
  const { entries, complianceData, fetchCompliance, auditLog, fetchAuditLog, activeReportId, autoBalance, isLoading, wizardStep, setWizardStep, saveTrialBalance } = useFinancialStore()
  const [loadingCompliance, setLoadingCompliance] = useState(false)
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [autoBalancing, setAutoBalancing] = useState(false)

  const totalDr = entries.reduce((s, e) => s + (e.debitCurrent || 0), 0)
  const totalCr = entries.reduce((s, e) => s + (e.creditCurrent || 0), 0)
  const tbBalanced = Math.abs(totalDr - totalCr) < 0.01
  const allMapped = entries.every(e => e.category && e.category.trim() !== '')
  const hasBudget = entries.some(e => e.budgetInitial > 0 || e.budgetAdjusted > 0)
  const hasPrior = entries.some(e => e.debitPrior !== 0 || e.creditPrior !== 0)

  const handleRunCompliance = async () => {
    setLoadingCompliance(true)
    try {
      await saveTrialBalance()
      await fetchCompliance()
      toast.success('Compliance check completed')
    } catch {
      toast.error('Failed to run compliance check')
    } finally {
      setLoadingCompliance(false)
    }
  }

  const handleLoadAudit = async () => {
    setLoadingAudit(true)
    try {
      await fetchAuditLog()
    } catch {
      // silent
    } finally {
      setLoadingAudit(false)
    }
  }

  const handleAutoBalance = async () => {
    setAutoBalancing(true)
    try {
      await autoBalance()
      toast.success('Auto-balanced successfully')
    } catch {
      toast.error('Failed to auto-balance')
    } finally {
      setAutoBalancing(false)
    }
  }

  useEffect(() => {
    if (activeReportId) handleLoadAudit()
  }, [activeReportId])

  const validationItems = [
    { label: 'Trial Balance balanced', pass: tbBalanced },
    { label: 'All categories mapped', pass: allMapped },
    { label: 'Budget data provided', pass: hasBudget },
    { label: 'Prior year data present', pass: hasPrior },
    { label: `Entries count: ${entries.length}`, pass: entries.length > 0 },
  ]

  const complianceScore = complianceData?.score ?? 0

  return (
    <motion.div {...pageVariants} className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Review & Validate</h2>
          <p className="text-sm text-muted-foreground mt-1">Validate your data and check IPSAS compliance before generating statements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleLoadAudit} disabled={loadingAudit} className="gap-1.5">
            {loadingAudit ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
            Refresh Audit Log
          </Button>
          <Button onClick={handleRunCompliance} disabled={loadingCompliance || isLoading} className="bg-primary text-primary-foreground gap-2">
            {loadingCompliance || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Run Compliance Check
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Validation Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Validation Status</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-2">
            {validationItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {item.pass
                  ? <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  : <X className="h-4 w-4 text-destructive flex-shrink-0" />}
                <span className={item.pass ? 'text-foreground' : 'text-destructive'}>{item.label}</span>
              </div>
            ))}
            {!tbBalanced && (
              <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5" onClick={handleAutoBalance} disabled={autoBalancing}>
                {autoBalancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Auto-Balance
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Compliance Score + Checklist */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">IPSAS Compliance</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {complianceData ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className="relative h-24 w-24">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className={complianceScore >= 80 ? 'text-primary' : complianceScore >= 50 ? 'text-yellow-500' : 'text-destructive'}
                        strokeDasharray={`${complianceScore * 2.64} 264`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">{complianceScore}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{complianceData.metCount}/{complianceData.totalCount} requirements met</p>
                </div>
                <ScrollArea className="h-48 custom-scrollbar">
                  <div className="space-y-1.5 pr-2">
                    {complianceData.checklist.map((item: ComplianceItem) => (
                      <div key={item.id} className="flex items-start gap-2 text-xs">
                        {item.status === 'met'
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                          : item.status === 'partial'
                            ? <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            : <X className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />}
                        <div>
                          <p className="text-foreground font-medium">{item.requirement}</p>
                          <p className="text-muted-foreground">{item.ipsasReference}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                <Shield className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Click &quot;Run Compliance Check&quot; to validate IPSAS requirements.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Trail */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Audit Trail</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {auditLog.length > 0 ? (
              <ScrollArea className="h-64 custom-scrollbar">
                <div className="space-y-3 pr-2">
                  {auditLog.slice(0, 15).map((entry: AuditLogEntry) => (
                    <div key={entry.id} className="flex items-start gap-2 text-xs">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium truncate">{entry.action.replace(/_/g, ' ')}</p>
                        <p className="text-muted-foreground">{entry.field} {entry.oldValue && `— ${entry.oldValue} → ${entry.newValue}`}</p>
                        <p className="text-muted-foreground/60">{new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                <History className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No audit entries yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={() => setWizardStep(3)} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setWizardStep(5)} className="bg-primary text-primary-foreground gap-2">
              Continue to Generate <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STEP 5: GENERATE & EXPORT
// ═══════════════════════════════════════════════════════════════════

function Step5Generate() {
  const {
    generatedStatements, entityConfig, activeReportId, generateStatements,
    statementSubTab, setStatementSubTab, isLoading, wizardStep, setWizardStep,
    approvalWorkflow, fetchApprovalWorkflow, advanceApproval,
    versions, fetchVersions, createVersion,
  } = useFinancialStore()
  const [isExporting, setIsExporting] = useState(false)
  const [approverName, setApproverName] = useState('')
  const [versionLabel, setVersionLabel] = useState('')
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [showPdfPreview, setShowPdfPreview] = useState(false)

  useEffect(() => {
    if (activeReportId) {
      fetchApprovalWorkflow()
      fetchVersions()
    }
  }, [activeReportId, fetchApprovalWorkflow, fetchVersions])

  const handleGenerate = async () => {
    try {
      await generateStatements()
      toast.success('Statements generated successfully')
    } catch {
      toast.error('Failed to generate statements')
    }
  }

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

  const handleDownloadExcel = async () => {
    if (!activeReportId) return
    setIsExporting(true)
    try {
      const res = await fetch(`/api/reports/${activeReportId}/export/excel`)
      if (!res.ok) throw new Error('Excel generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${entityConfig.name.replace(/\s+/g, '_')}_Financial_Statements.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Excel downloaded successfully')
    } catch {
      toast.error('Failed to generate Excel')
    } finally {
      setIsExporting(false)
    }
  }

  const handleAdvanceApproval = async () => {
    try {
      await advanceApproval(approverName || 'system')
      setApproverName('')
      toast.success('Approval advanced')
    } catch {
      toast.error('Failed to advance approval')
    }
  }

  const handleCreateVersion = async () => {
    try {
      await createVersion(versionLabel)
      setShowVersionDialog(false)
      setVersionLabel('')
      toast.success('Version created successfully')
    } catch {
      toast.error('Failed to create version')
    }
  }

  const subTabs: { value: StatementSubTab; label: string }[] = [
    { value: 'sfp', label: 'Fin. Performance' },
    { value: 'balance-sheet', label: 'Fin. Position' },
    { value: 'changes-na', label: 'Changes in NA' },
    { value: 'cash-flow', label: 'Cash Flow' },
    { value: 'revenue-recon', label: 'Revenue Recon' },
    { value: 'cash-recon', label: 'Cash Recon' },
    { value: 'budget-variance', label: 'Budget Variance' },
  ]

  const approvalSteps = ['draft', 'preparer_review', 'management_review', 'cfo_approval', 'final']
  const currentStepIdx = approvalSteps.indexOf(approvalWorkflow?.currentStep || 'draft')

  if (!generatedStatements) {
    return (
      <motion.div {...pageVariants} className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Generate & Export</h2>
            <p className="text-sm text-muted-foreground mt-1">Generate financial statements and export to PDF or Excel.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setWizardStep(4)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-primary/10 p-6 mb-6">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Generate Financial Statements</h2>
          <p className="text-muted-foreground mb-6 max-w-md">Generate IPSAS-compliant financial statements including the SFP, Balance Sheet, Cash Flow, and supporting schedules.</p>
          <Button onClick={handleGenerate} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" size="lg">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            Generate Financial Statements
          </Button>
        </div>

        {/* Version History */}
        {versions.length > 1 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Version History</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {versions.map((v: VersionEntry) => (
                  <div key={v.id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${v.id === activeReportId ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{v.versionLabel || `Version ${v.version}`}</p>
                        <p className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()} · {v._count.entries} entries</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColor(v.status)}>{v.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    )
  }

  const hasErrors = generatedStatements.validationErrors && generatedStatements.validationErrors.length > 0

  return (
    <motion.div {...pageVariants} className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Generate & Export</h2>
          <p className="text-sm text-muted-foreground mt-1">Review generated statements and export.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <GitBranch className="h-4 w-4" /> Save Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Version</DialogTitle>
                <DialogDescription>Save a snapshot of the current report as a new version.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Version Label</Label>
                  <Input value={versionLabel} onChange={e => setVersionLabel(e.target.value)} placeholder="e.g., v2 - Draft revisions" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVersionDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateVersion} disabled={isLoading} className="bg-primary text-primary-foreground">Create Version</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isLoading} className="gap-1.5">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Re-generate
          </Button>
        </div>
      </div>

      {/* Validation alerts */}
      {hasErrors ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{generatedStatements.validationErrors.length} Validation Issue(s)</AlertTitle>
          <AlertDescription><ul className="mt-2 space-y-1 list-disc list-inside text-sm">{generatedStatements.validationErrors.map((err, i) => <li key={i}>{err}</li>)}</ul></AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-primary/30 bg-primary/5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">All checks passed</AlertTitle>
          <AlertDescription className="text-muted-foreground">The generated statements have passed all validation checks.</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Revenue', value: generatedStatements.sfp.totalRevenueCurrent, prior: generatedStatements.sfp.totalRevenuePrior },
          { label: 'Expenses', value: generatedStatements.sfp.totalExpensesCurrent, prior: generatedStatements.sfp.totalExpensesPrior },
          { label: 'Surplus', value: generatedStatements.sfp.surplusCurrent, prior: generatedStatements.sfp.surplusPrior, color: generatedStatements.sfp.surplusCurrent >= 0 ? 'text-primary' : 'text-destructive' },
          { label: 'Assets', value: generatedStatements.balanceSheet.totalAssetsCurrent, prior: generatedStatements.balanceSheet.totalAssetsPrior },
          { label: 'Liabilities', value: generatedStatements.balanceSheet.totalLiabilitiesCurrent, prior: generatedStatements.balanceSheet.totalLiabilitiesPrior },
          { label: 'Net Assets', value: generatedStatements.balanceSheet.netAssetsCurrent, prior: generatedStatements.balanceSheet.netAssetsPrior },
        ].map((item) => (
          <Card key={item.label} className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{item.label}</p>
            <p className={`text-lg font-bold font-mono ${item.color || 'text-foreground'}`}>{entityConfig.currency} {formatNum(item.value)}</p>
            <p className="text-[10px] text-muted-foreground">Prior: {formatNum(item.prior)}</p>
          </Card>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {subTabs.map((tab) => (
            <button key={tab.value} onClick={() => setStatementSubTab(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${statementSubTab === tab.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statement content */}
      {statementSubTab === 'sfp' && <SFPSection data={generatedStatements.sfp} currency={entityConfig.currency} />}
      {statementSubTab === 'balance-sheet' && <BalanceSheetSection data={generatedStatements.balanceSheet} currency={entityConfig.currency} />}
      {statementSubTab === 'changes-na' && <ChangesNASection data={generatedStatements.changesInNA} currency={entityConfig.currency} />}
      {statementSubTab === 'cash-flow' && <CashFlowSection data={generatedStatements.cashFlow} currency={entityConfig.currency} />}
      {statementSubTab === 'revenue-recon' && <RevenueReconSection data={generatedStatements.revenueReconciliation} currency={entityConfig.currency} />}
      {statementSubTab === 'cash-recon' && <CashReconSection data={generatedStatements.cashReconciliation} currency={entityConfig.currency} />}
      {statementSubTab === 'budget-variance' && <BudgetVarianceSection data={generatedStatements.budgetVariance} currency={entityConfig.currency} />}

      {/* Export & Approval Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Export Card */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Export</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex gap-2">
              <Button onClick={handleDownloadPdf} disabled={isExporting} className="flex-1 bg-primary text-primary-foreground gap-2">
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF
              </Button>
              <Button onClick={handleDownloadExcel} disabled={isExporting} variant="outline" className="flex-1 gap-2">
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Excel
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full gap-1.5" onClick={() => setShowPdfPreview(!showPdfPreview)}>
              <Eye className="h-4 w-4" /> {showPdfPreview ? 'Hide' : 'Show'} PDF Preview
            </Button>
            {showPdfPreview && activeReportId && (
              <div className="border border-border rounded-lg overflow-hidden">
                <iframe src={`/api/reports/${activeReportId}/pdf`} className="w-full h-[600px]" title="PDF Preview" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Workflow Card */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Approval Workflow</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center gap-1">
              {approvalSteps.map((step, i) => (
                <React.Fragment key={step}>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${i <= currentStepIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {i < currentStepIdx ? <CheckCircle2 className="h-3 w-3" /> : <CircleDot className="h-3 w-3" />}
                    {step.replace(/_/g, ' ')}
                  </div>
                  {i < approvalSteps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                </React.Fragment>
              ))}
            </div>
            {approvalWorkflow && (
              <div className="text-xs text-muted-foreground space-y-1">
                {approvalWorkflow.preparerName && <p>Preparer: {approvalWorkflow.preparerName} {approvalWorkflow.preparerApprovedAt && `· ${new Date(approvalWorkflow.preparerApprovedAt).toLocaleDateString()}`}</p>}
                {approvalWorkflow.reviewerName && <p>Reviewer: {approvalWorkflow.reviewerName} {approvalWorkflow.reviewerApprovedAt && `· ${new Date(approvalWorkflow.reviewerApprovedAt).toLocaleDateString()}`}</p>}
                {approvalWorkflow.cfoName && <p>CFO: {approvalWorkflow.cfoName} {approvalWorkflow.cfoApprovedAt && `· ${new Date(approvalWorkflow.cfoApprovedAt).toLocaleDateString()}`}</p>}
              </div>
            )}
            <div className="flex gap-2">
              <Input placeholder="Approver name" value={approverName} onChange={e => setApproverName(e.target.value)} className="h-8 text-sm flex-1" />
              <Button onClick={handleAdvanceApproval} disabled={currentStepIdx >= approvalSteps.length - 1 || isLoading} size="sm" className="bg-primary text-primary-foreground gap-1">
                <ArrowRight className="h-3.5 w-3.5" /> Advance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Version History */}
      {versions.length > 1 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Version History</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {versions.map((v: VersionEntry) => (
                <div key={v.id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${v.id === activeReportId ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}>
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{v.versionLabel || `Version ${v.version}`}</p>
                      <p className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()} · {v._count.entries} entries</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColor(v.status)}>{v.status}</Badge>
                    {v.id !== activeReportId && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={async () => {
                        const { loadReport } = useFinancialStore.getState()
                        try { await loadReport(v.id); toast.success('Version loaded') } catch { toast.error('Failed to load version') }
                      }}>Load</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <Button variant="outline" size="sm" onClick={() => setWizardStep(4)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Review
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS PANEL (Sheet)
// ═══════════════════════════════════════════════════════════════════

function AnalyticsPanel() {
  const { analyticsData, fetchAnalytics, entries, activeReportId, generatedStatements, entityConfig } = useFinancialStore()
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try { await fetchAnalytics() } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => {
    if (activeReportId && !analyticsData) load()
  }, [activeReportId])

  const gs = generatedStatements
  const totalRevenue = gs?.sfp.totalRevenueCurrent ?? 0
  const totalExpenses = gs?.sfp.totalExpensesCurrent ?? 0
  const surplus = gs?.sfp.surplusCurrent ?? 0
  const cashBalance = entries.reduce((s, e) => e.category === 'cash' ? s + e.debitCurrent - e.creditCurrent : s, 0)

  // Build bar chart data
  const barData = analyticsData?.trends ? [
    { name: 'Revenue', current: totalRevenue, prior: gs?.sfp.totalRevenuePrior ?? 0, change: analyticsData.trends.revenueChange },
    { name: 'Expenses', current: totalExpenses, prior: gs?.sfp.totalExpensesPrior ?? 0, change: analyticsData.trends.expenseChange },
  ] : []

  const ratios = analyticsData?.ratios

  return (
    <Sheet open={true} onOpenChange={(open) => useFinancialStore.getState().setShowAnalytics(open)}>
      <SheetContent side="right" className="w-[400px] sm:w-[480px] overflow-y-auto custom-scrollbar">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Analytics Dashboard
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !analyticsData ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Generate statements first to see analytics.</p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Revenue', value: `${entityConfig.currency} ${formatNum(totalRevenue)}`, icon: <TrendingUp className="h-4 w-4 text-primary" /> },
                  { label: 'Total Expenses', value: `${entityConfig.currency} ${formatNum(totalExpenses)}`, icon: <TrendingDown className="h-4 w-4 text-destructive" /> },
                  { label: 'Net Surplus', value: `${entityConfig.currency} ${formatNum(surplus)}`, icon: surplus >= 0 ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" /> },
                  { label: 'Cash Balance', value: `${entityConfig.currency} ${formatNum(cashBalance)}`, icon: <Banknote className="h-4 w-4 text-primary" /> },
                ].map(kpi => (
                  <Card key={kpi.label} className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {kpi.icon}
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{kpi.label}</span>
                    </div>
                    <p className="text-sm font-bold font-mono text-foreground">{kpi.value}</p>
                  </Card>
                ))}
              </div>

              {/* Key Ratios */}
              {ratios && (
                <Card className="p-4">
                  <p className="text-xs font-semibold text-foreground mb-3">Key Financial Ratios</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Surplus Ratio', value: `${ratios.surplusRatio?.toFixed(1)}%` },
                      { label: 'Expense Ratio', value: `${ratios.expenseRatio?.toFixed(1)}%` },
                      { label: 'Current Ratio', value: `${ratios.currentRatio?.toFixed(2)}x` },
                      { label: 'Cash Ratio', value: `${ratios.cashRatio?.toFixed(2)}x` },
                      { label: 'Receivables Days', value: `${ratios.receivablesDays?.toFixed(0)}d` },
                      { label: 'Payables Days', value: `${ratios.payablesDays?.toFixed(0)}d` },
                      { label: 'Dependency Ratio', value: `${ratios.dependencyRatio?.toFixed(1)}%` },
                      { label: 'Personnel Ratio', value: `${ratios.personnelRatio?.toFixed(1)}%` },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between text-xs p-1.5 rounded bg-muted/50">
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className="font-mono font-medium text-foreground">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Bar Chart: Revenue vs Expense */}
              {barData.length > 0 && (
                <Card className="p-4">
                  <p className="text-xs font-semibold text-foreground mb-3">Revenue vs Expenses (Current / Prior)</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                      <Bar dataKey="current" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Current" />
                      <Bar dataKey="prior" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} name="Prior" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Trend Indicators */}
              {analyticsData.trends && (
                <Card className="p-4">
                  <p className="text-xs font-semibold text-foreground mb-3">Year-over-Year Trends</p>
                  <div className="space-y-2">
                    {Object.entries(analyticsData.trends).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className={`flex items-center gap-1 font-mono font-medium ${value >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {value >= 0 ? '+' : ''}{value.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Anomaly Alerts */}
              {analyticsData.anomalies.length > 0 && (
                <Card className="p-4">
                  <p className="text-xs font-semibold text-foreground mb-3">Anomaly Alerts</p>
                  <div className="space-y-2">
                    {analyticsData.anomalies.map((a, i) => (
                      <Alert key={i} variant={a.severity === 'critical' ? 'destructive' : 'default'} className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-xs">{a.description}</AlertTitle>
                        <AlertDescription className="text-xs text-muted-foreground">{a.detail}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </Card>
              )}

              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={load}>
                <RefreshCw className="h-4 w-4" /> Refresh Analytics
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════

function DashboardView() {
  const { reports, loadReport, deleteReport, isLoading, createReport } = useFinancialStore()

  const handleLoad = async (id: string) => {
    try { await loadReport(id); toast.success('Report loaded') } catch { toast.error('Failed to load report') }
  }
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try { await deleteReport(id); toast.success('Report deleted') } catch { toast.error('Failed to delete report') }
  }
  const handleNew = async () => {
    try { await createReport(); toast.success('Report created successfully') } catch { toast.error('Failed to create report') }
  }

  const totalReports = reports.length
  const generatedReports = reports.filter(r => r.status === 'generated' || r.status === 'approved').length
  const draftReports = reports.filter(r => r.status === 'draft').length

  const recentActivity = reports.slice(0, 5).map(r => ({
    id: r.id,
    action: `Report ${r.entityName} — ${r.status}`,
    date: r.updatedAt || r.createdAt,
  }))

  if (reports.length === 0) {
    return (
      <motion.div {...pageVariants} className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <FolderOpen className="h-12 w-12 text-primary/60" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">No Reports Yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">Create your first financial report to get started. Set up entity details, enter trial balance data, and generate IPSAS-compliant statements.</p>
        <Button onClick={handleNew} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" size="lg">
          <Plus className="h-4 w-4" /> Create Your First Report
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div {...pageVariants} className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Welcome to FinStatements Pro. Manage your financial reports here.</p>
        </div>
        <Button onClick={handleNew} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-4 w-4" /> New Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalReports}</p>
              <p className="text-xs text-muted-foreground">Total Reports</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{generatedReports}</p>
              <p className="text-xs text-muted-foreground">Generated</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{draftReports}</p>
              <p className="text-xs text-muted-foreground">Draft</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Report Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Financial Reports</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {reports.map((report: Report) => (
              <Card key={report.id} className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group" onClick={() => handleLoad(report.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground leading-snug">{report.entityName}</CardTitle>
                    <Badge variant="secondary" className={`text-[10px] ${statusColor(report.status)}`}>{report.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{report.periodLabel}</div>
                    <div className="flex items-center gap-2"><Table className="h-3.5 w-3.5" />{report.entries?.length || 0} entries</div>
                    <div className="flex items-center justify-between pt-1">
                      <span>{new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDelete(report.id, e)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 text-xs">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground">{item.action}</p>
                      <p className="text-muted-foreground">{new Date(item.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STATEMENT SUB-SECTIONS (reused from original)
// ═══════════════════════════════════════════════════════════════════

function toStatementRow(line: SFPLine | BSLine): StatementRow {
  return { label: line.label, noteRef: line.noteRef, current: line.current, prior: line.prior, indent: line.indent, isBold: line.isBold, isSubtotal: line.isSubtotal, isTotal: line.isTotal, isSection: line.isSection }
}

function SFPSection({ data, currency }: { data: GeneratedStatements['sfp']; currency: string }) {
  const allRows: StatementRow[] = [
    ...data.revenueLines.map(toStatementRow),
    { label: '', noteRef: '', current: 0, prior: 0 },
    ...data.expenseLines.map(toStatementRow),
    { label: '', noteRef: '', current: 0, prior: 0, isSection: true },
    { label: 'SURPLUS / (DEFICIT)', noteRef: '', current: data.surplusCurrent, prior: data.surplusPrior, isBold: true, isTotal: true },
  ]
  return <StatementTable title="Statement of Financial Performance" rows={allRows} currency={currency} />
}

function BalanceSheetSection({ data, currency }: { data: GeneratedStatements['balanceSheet']; currency: string }) {
  const allRows: StatementRow[] = [...data.assetLines.map(toStatementRow), { label: '', noteRef: '', current: 0, prior: 0 }, ...data.liabilityLines.map(toStatementRow)]
  return <StatementTable title="Statement of Financial Position" rows={allRows} currency={currency} />
}

function ChangesNASection({ data, currency }: { data: GeneratedStatements['changesInNA']; currency: string }) {
  const rows: StatementRow[] = [
    { label: 'NET ASSETS', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true },
    { label: 'Brought forward', noteRef: '', current: data.bfCurrent, prior: data.bfPrior, indent: 1 },
    { label: 'Adjustments', noteRef: '', current: data.adjustmentsCurrent, prior: data.adjustmentsPrior, indent: 1 },
    { label: 'Surplus/(Deficit) for the year', noteRef: '', current: data.surplusCurrent, prior: data.surplusPrior, indent: 1, isBold: true },
    { label: 'Closing Net Assets', noteRef: '', current: data.closingCurrent, prior: data.closingPrior, indent: 1, isBold: true, isTotal: true },
  ]
  return <StatementTable title="Statement of Changes in Net Assets" rows={rows} currency={currency} />
}

function CashFlowSection({ data, currency }: { data: CashFlowData; currency: string }) {
  const rows: StatementRow[] = [
    { label: 'CASH FLOWS FROM OPERATING ACTIVITIES', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true },
    { label: 'Operating revenue received', noteRef: '', current: data.operatingRevenueCurrent, prior: data.operatingRevenuePrior, indent: 1 },
    ...data.payments.map((p): StatementRow => ({ label: `Payments - ${p.label}`, noteRef: p.noteRef, current: -Math.abs(p.current), prior: -Math.abs(p.prior), indent: 1 })),
    { label: 'Net cash from operating activities', noteRef: '', current: data.netOperatingCurrent, prior: data.netOperatingPrior, isBold: true, isTotal: true },
    { label: '', noteRef: '', current: 0, prior: 0 },
    { label: 'CASH FLOWS FROM INVESTING ACTIVITIES', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true },
    ...data.investing.map((inv): StatementRow => ({ label: inv.label, noteRef: '', current: inv.current, prior: inv.prior, indent: 1 })),
    { label: 'Net cash from investing activities', noteRef: '', current: data.netInvestingCurrent, prior: data.netInvestingPrior, isBold: true, isTotal: true },
    { label: '', noteRef: '', current: 0, prior: 0 },
    { label: 'CASH FLOWS FROM FINANCING ACTIVITIES', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true },
    ...(data.financing.length > 0 ? data.financing.map((f): StatementRow => ({ label: f.label, noteRef: '', current: f.current, prior: f.prior, indent: 1 })) : [{ label: '(None)', noteRef: '', current: 0, prior: 0, indent: 1 } as StatementRow]),
    { label: 'Net cash from financing activities', noteRef: '', current: data.netFinancingCurrent, prior: data.netFinancingPrior, isBold: true, isTotal: true },
    { label: '', noteRef: '', current: 0, prior: 0 },
    { label: 'Net increase/(decrease) in cash', noteRef: '', current: data.netChangeCurrent, prior: data.netChangePrior, isBold: true, isTotal: true },
  ]
  return <StatementTable title="Cash Flow Statement" rows={rows} currency={currency} />
}

function RevenueReconSection({ data, currency }: { data: RevenueReconciliationData; currency: string }) {
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
  return <StatementTable title="Revenue Reconciliation to Cash Flow Statement" rows={rows} currency={currency} />
}

function CashReconSection({ data, currency }: { data: CashReconciliationData; currency: string }) {
  const rows: StatementRow[] = [
    { label: 'CASH RECONCILIATION', noteRef: '', current: 0, prior: 0, isBold: true, isSection: true },
    { label: 'Cash at beginning of period', noteRef: '', current: data.openingCashCurrent, prior: data.openingCashPrior, indent: 1 },
    { label: 'Net increase/(decrease) in cash', noteRef: '', current: data.netChangeCurrent, prior: data.netChangePrior, indent: 1 },
    { label: 'Cash at end of period', noteRef: '', current: data.closingCashCurrent, prior: data.closingCashPrior, isBold: true, isTotal: true },
  ]
  return <StatementTable title="Cash and Cash Equivalents Reconciliation" rows={rows} currency={currency} />
}

function BudgetVarianceSection({ data, currency }: { data: BudgetVarianceData[]; currency: string }) {
  if (data.length === 0) return <div className="text-center py-12 text-muted-foreground text-sm">No budget data available. Enter budget amounts in the trial balance to see variance analysis.</div>
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Budget Variance Analysis</h3>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead><tr className="bg-foreground text-background">
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide">Line Item</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">Initial</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">Adjusted</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">Revised</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">Actual</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">Variance</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">Var %</th>
          </tr></thead>
          <tbody>{data.map((row, i) => {
            const vp = row.variance >= 0
            return (<tr key={i} className="border-b border-border hover:bg-muted/30">
              <td className="px-4 py-2 text-foreground">{row.label}</td>
              <td className="px-4 py-2 text-right font-mono text-foreground">{formatNum(row.initialBudget)}</td>
              <td className="px-4 py-2 text-right font-mono text-foreground">{formatNum(row.adjustments)}</td>
              <td className="px-4 py-2 text-right font-mono font-semibold text-foreground">{formatNum(row.revisedBudget)}</td>
              <td className="px-4 py-2 text-right font-mono text-foreground">{formatNum(row.actual)}</td>
              <td className={`px-4 py-2 text-right font-mono font-semibold ${vp ? 'text-primary' : 'text-destructive'}`}>{formatNum(row.variance)}</td>
              <td className={`px-4 py-2 text-right font-mono text-xs ${vp ? 'text-primary' : 'text-destructive'}`}>{row.variancePercent.toFixed(1)}%</td>
            </tr>)
          })}</tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════

export default function Home() {
  const { activeReportId, wizardStep, fetchReports, showAnalytics } = useFinancialStore()

  const stableFetch = useCallback(() => { fetchReports() }, [fetchReports])
  useEffect(() => { stableFetch() }, [stableFetch])

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        {activeReportId && <WizardProgressBar />}
        {activeReportId && <StatusBar />}
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6">
          <AnimatePresence mode="wait">
            {!activeReportId ? (
              <DashboardView key="dashboard" />
            ) : (
              <>
                {wizardStep === 1 && <Step1EntitySetup key="step1" />}
                {wizardStep === 2 && <Step2TrialBalance key="step2" />}
                {wizardStep === 3 && <Step3Supplementary key="step3" />}
                {wizardStep === 4 && <Step4Review key="step4" />}
                {wizardStep === 5 && <Step5Generate key="step5" />}
              </>
            )}
          </AnimatePresence>
        </main>
        <footer className="border-t border-border mt-auto">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>FinStatements Pro — Government Financial Statements Generator</span>
            <span>IPSAS Compliant</span>
          </div>
        </footer>
        {showAnalytics && activeReportId && <AnalyticsPanel />}
      </div>
    </TooltipProvider>
  )
}
