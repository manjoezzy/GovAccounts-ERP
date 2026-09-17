'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Filter,
  BookOpen,
  FileText,
  Wand2,
  X,
  Search,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useFinancialStore, type AbstractEntryUI } from '@/components/financials/store'

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const formatNum = (n: number) =>
  Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

type FormState = {
  itemCode: string
  itemDescription: string
  type: 'revenue' | 'expenditure' | 'adjustment'
  budgetEstimate: number
  actualAmount: number
  priorYearActual: number
}

const EMPTY_FORM: FormState = {
  itemCode: '',
  itemDescription: '',
  type: 'revenue',
  budgetEstimate: 0,
  actualAmount: 0,
  priorYearActual: 0,
}

const TYPE_LABELS = {
  revenue: 'Revenue',
  expenditure: 'Expenditure',
  adjustment: 'Adjustment',
} as const

const TYPE_ORDER: Array<'revenue' | 'expenditure' | 'adjustment'> = [
  'revenue',
  'expenditure',
  'adjustment',
]

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

function AbstractStep() {
  const {
    abstractEntries,
    addAbstractEntry,
    deleteAbstractEntry,
    clearAbstractEntries,
    saveAbstractEntries,
    generateAbstract,
    setWizardStep,
    isLoading,
  } = useFinancialStore()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [confirmClear, setConfirmClear] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  // ════════════════ Derived data ════════════════

  const filtered = useMemo(() => {
    let list = abstractEntries
    if (typeFilter !== 'all') list = list.filter((e) => e.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          e.itemCode.toLowerCase().includes(q) ||
          e.itemDescription.toLowerCase().includes(q),
      )
    }
    return list
  }, [abstractEntries, typeFilter, search])

  const grouped = useMemo(() => {
    const g: Record<string, AbstractEntryUI[]> = {
      revenue: [],
      expenditure: [],
      adjustment: [],
    }
    for (const e of abstractEntries) {
      if (TYPE_ORDER.includes(e.type)) g[e.type].push(e)
    }
    return g
  }, [abstractEntries])

  const sums = useMemo(() => {
    const rev = abstractEntries.filter((e) => e.type === 'revenue')
    const exp = abstractEntries.filter((e) => e.type === 'expenditure')
    const adj = abstractEntries.filter((e) => e.type === 'adjustment')

    const sumField = (arr: AbstractEntryUI[], field: 'budgetEstimate' | 'actualAmount') =>
      arr.reduce((s, e) => s + e[field], 0)

    const revenueBudget = sumField(rev, 'budgetEstimate')
    const revenueActual = sumField(rev, 'actualAmount')
    const expenditureBudget = sumField(exp, 'budgetEstimate')
    const expenditureActual = sumField(exp, 'actualAmount')
    const adjustmentTotal = adj.reduce((s, e) => s + e.actualAmount, 0)

    const surplusDeficit = revenueActual - expenditureActual + adjustmentTotal
    const totalBudget = revenueBudget - expenditureBudget
    const variancePercent =
      totalBudget !== 0
        ? Math.round((surplusDeficit / Math.abs(totalBudget)) * 10000) / 100
        : 0

    return {
      revenueBudget,
      revenueActual,
      expenditureBudget,
      expenditureActual,
      adjustmentTotal,
      surplusDeficit,
      variancePercent,
    }
  }, [abstractEntries])

  // ══════════════ Handlers ════════════════

  const handleAdd = () => {
    if (!form.itemCode.trim() || !form.itemDescription.trim()) {
      toast.error('Item code and description are required')
      return
    }
    const variance = form.actualAmount - form.budgetEstimate
    const variancePercent =
      form.budgetEstimate !== 0
        ? Math.round((variance / Math.abs(form.budgetEstimate)) * 10000) / 100
        : 0
    addAbstractEntry({ ...form, variance, variancePercent })
    setForm(EMPTY_FORM)
    setShowForm(false)
    toast.success('Entry added')
  }

  const handleRemove = (idx: number) => {
    deleteAbstractEntry(idx)
    toast.success('Entry removed')
  }

  const handleClear = () => {
    clearAbstractEntries()
    setConfirmClear(false)
    toast.success('All entries cleared')
  }

  const handleSave = async () => {
    try {
      await saveAbstractEntries()
      toast.success('Abstract saved successfully')
    } catch {
      toast.error('Failed to save abstract')
    }
  }

  const handleGenerate = () => {
    generateAbstract()
    toast.success('Abstract generated from transactions')
  }

  // ══════════════ Variance helpers ════════════════

  const isFavorable = (type: string, variance: number) =>
    (type === 'revenue' && variance > 0) || (type === 'expenditure' && variance < 0)

  const varianceColor = (type: string, variance: number) => {
    if (variance === 0) return 'text-muted-foreground'
    return isFavorable(type, variance) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
  }

  const subtotal = (arr: AbstractEntryUI[], field: 'budgetEstimate' | 'actualAmount' | 'variance') =>
    arr.reduce((s, e) => s + (e[field] ?? 0), 0)

  // ══════════════ Render helpers ════════════════

  const summaryCards = [
    {
      label: 'Revenue Budget',
      value: formatNum(sums.revenueBudget),
      icon: TrendingUp,
      accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Revenue Actual',
      value: formatNum(sums.revenueActual),
      icon: TrendingUp,
      accent: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Expenditure Budget',
      value: formatNum(sums.expenditureBudget),
      icon: TrendingDown,
      accent: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40',
    },
    {
      label: 'Expenditure Actual',
      value: formatNum(sums.expenditureActual),
      icon: TrendingDown,
      accent: 'text-red-600 bg-red-50 dark:bg-red-950/40',
    },
    {
      label: 'Surplus / Deficit',
      value: `${sums.surplusDeficit >= 0 ? '+' : '-'}${formatNum(sums.surplusDeficit)}`,
      icon: FileText,
      accent:
        sums.surplusDeficit >= 0
          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
          : 'text-red-600 bg-red-50 dark:bg-red-950/40',
    },
    {
      label: 'Variance %',
      value: `${sums.variancePercent >= 0 ? '+' : ''}${sums.variancePercent}%`,
      icon: Filter,
      accent:
        sums.variancePercent >= 0
          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
          : 'text-red-600 bg-red-50 dark:bg-red-950/40',
    },
  ]

  // ══════════════ Table section ════════════════

  const renderRow = (entry: AbstractEntryUI, globalIdx: number) => {
    const vc = varianceColor(entry.type, entry.variance)
    return (
      <tr
        key={entry._id ?? globalIdx}
        className="border-b border-muted transition-colors hover:bg-muted/40"
      >
        <td className="px-3 py-2 font-mono text-sm whitespace-nowrap">
          {entry.itemCode}
        </td>
        <td className="px-3 py-2 text-sm">{entry.itemDescription}</td>
        <td className="px-3 py-2 text-sm text-right tabular-nums">
          {formatNum(entry.budgetEstimate)}
        </td>
        <td className="px-3 py-2 text-sm text-right tabular-nums">
          {formatNum(entry.actualAmount)}
        </td>
        <td className={`px-3 py-2 text-sm text-right tabular-nums font-medium ${vc}`}>
          {entry.variance >= 0 ? '+' : '-'}{formatNum(entry.variance)}
        </td>
        <td className={`px-3 py-2 text-sm text-right tabular-nums ${vc}`}>
          {entry.variancePercent >= 0 ? '+' : ''}{entry.variancePercent}%
        </td>
        <td className="px-3 py-2 text-sm text-right tabular-nums text-muted-foreground">
          {formatNum(entry.priorYearActual)}
        </td>
        <td className="px-3 py-2 text-right">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(globalIdx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove entry</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>
      </tr>
    )
  }

  const renderSection = (type: 'revenue' | 'expenditure' | 'adjustment') => {
    const entries = grouped[type]
    const filteredInSection = filtered.filter((e) => e.type === type)
    if (entries.length === 0) return null

    // Build a lookup for global index
    const indices = new Map<string, number>()
    abstractEntries.forEach((e, i) => indices.set(e._id ?? `__${i}`, i))

    return (
      <>
        <tr className="bg-muted/60">
          <td colSpan={8} className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {TYPE_LABELS[type]}
          </td>
        </tr>
        {filteredInSection.map((entry) => {
          const gi = indices.get(entry._id ?? '') ?? abstractEntries.indexOf(entry)
          return renderRow(entry, gi)
        })}
        <tr className="border-b-2 border-muted-foreground/20 font-semibold">
          <td colSpan={2} className="px-3 py-2 text-sm">
            Subtotal — {TYPE_LABELS[type]}
          </td>
          <td className="px-3 py-2 text-sm text-right tabular-nums">
            {formatNum(subtotal(entries, 'budgetEstimate'))}
          </td>
          <td className="px-3 py-2 text-sm text-right tabular-nums">
            {formatNum(subtotal(entries, 'actualAmount'))}
          </td>
          <td className={`px-3 py-2 text-sm text-right tabular-nums ${varianceColor(type, subtotal(entries, 'variance'))}`}>
            {(() => {
              const v = subtotal(entries, 'variance')
              return `${v >= 0 ? '+' : '-'}${formatNum(v)}`
            })()}
          </td>
          <td className="px-3 py-2 text-sm text-right tabular-nums text-muted-foreground">
            —
          </td>
          <td className="px-3 py-2 text-sm text-right tabular-nums text-muted-foreground">
            {formatNum(entries.reduce((s, e) => s + e.priorYearActual, 0))}
          </td>
          <td />
        </tr>
      </>
    )
  }

  // ══════════════ Main render ════════════════

  return (
    <TooltipProvider>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-6"
      >
        {/* ─── Header ─── */}
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <BookOpen className="h-6 w-6 text-primary" />
            Abstract of Accounts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Step 7 — Consolidate revenue, expenditure, and adjustments into a
            summary abstract for the financial year.
          </p>
        </div>

        {/* ─── Summary Cards ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {summaryCards.map((c) => (
            <Card key={c.label} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                <CardDescription className="text-[11px] leading-tight">
                  {c.label}
                </CardDescription>
                <div className={`rounded-md p-1.5 ${c.accent}`}>
                  <c.icon className="h-3.5 w-3.5" />
                </div>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <p className="text-lg font-bold tabular-nums">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── Actions Bar ─── */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={showForm ? 'secondary' : 'default'}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {showForm ? 'Cancel' : 'Add Entry'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleGenerate}>
            <Wand2 className="mr-1.5 h-4 w-4" />
            Generate from Transactions
          </Button>
          <Button size="sm" variant="outline" onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => abstractEntries.length > 0 && setConfirmClear(true)}
            disabled={abstractEntries.length === 0}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Clear All
          </Button>
        </div>

        {/* ─── Add-Entry Form ─── */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">New Abstract Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ab-code">Item Code</Label>
                    <Input
                      id="ab-code"
                      placeholder="e.g. 1010"
                      value={form.itemCode}
                      onChange={(e) => setForm((f) => ({ ...f, itemCode: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ab-desc">Item Description</Label>
                    <Input
                      id="ab-desc"
                      placeholder="e.g. Tax Revenue"
                      value={form.itemDescription}
                      onChange={(e) => setForm((f) => ({ ...f, itemDescription: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, type: v as AbstractEntryUI['type'] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="expenditure">Expenditure</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ab-budget">Budget Estimate</Label>
                    <Input
                      id="ab-budget"
                      type="number"
                      placeholder="0"
                      value={form.budgetEstimate || ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          budgetEstimate: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ab-actual">Actual Amount</Label>
                    <Input
                      id="ab-actual"
                      type="number"
                      placeholder="0"
                      value={form.actualAmount || ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          actualAmount: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ab-prior">Prior Year Actual</Label>
                    <Input
                      id="ab-prior"
                      type="number"
                      placeholder="0"
                      value={form.priorYearActual || ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          priorYearActual: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleAdd}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Filters ─── */}
        {abstractEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search code or description…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44">
                <Filter className="mr-1.5 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expenditure">Expenditure</SelectItem>
                <SelectItem value="adjustment">Adjustments</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="tabular-nums">
              {filtered.length} of {abstractEntries.length} entries
            </Badge>
          </div>
        )}

        {/* ─── Table ─── */}
        {abstractEntries.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-muted p-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No abstract entries yet.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Add entries manually or generate from your transactions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Code
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Description
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                      Budget
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                      Actual
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                      Variance
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                      Var %
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                      Prior Year
                    </th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {TYPE_ORDER.map((type) => renderSection(type))}
                  {/* Grand Total */}
                  <tr className="bg-primary/5 font-bold">
                    <td colSpan={2} className="px-3 py-2.5 text-sm">
                      GRAND TOTAL
                    </td>
                    <td className="px-3 py-2.5 text-sm text-right tabular-nums">
                      {formatNum(sums.revenueBudget - sums.expenditureBudget)}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-right tabular-nums">
                      {formatNum(sums.revenueActual - sums.expenditureActual)}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-sm text-right tabular-nums ${
                        sums.surplusDeficit >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {sums.surplusDeficit >= 0 ? '+' : '-'}
                      {formatNum(sums.surplusDeficit)}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-sm text-right tabular-nums ${
                        sums.variancePercent >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {sums.variancePercent >= 0 ? '+' : ''}
                      {sums.variancePercent}%
                    </td>
                    <td className="px-3 py-2.5 text-sm text-right tabular-nums text-muted-foreground">
                      {formatNum(
                        abstractEntries.reduce((s, e) => s + e.priorYearActual, 0),
                      )}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ─── Navigation ─── */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => setWizardStep(6)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Votebook
          </Button>
          <Button onClick={() => setWizardStep(8)}>
            Continue to Budget
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>

        {/* ─── Clear-All Confirm Dialog ─── */}
        <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear All Entries?</DialogTitle>
              <DialogDescription>
                This will permanently remove all {abstractEntries.length} abstract entries.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClear}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Clear All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  )
}

export default AbstractStep
