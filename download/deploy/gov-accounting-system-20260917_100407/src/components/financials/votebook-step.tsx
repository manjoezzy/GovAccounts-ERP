'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useFinancialStore, type VotebookEntryUI } from '@/components/financials/store'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Progress } from '@/components/ui/progress'

import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Filter,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  Vote,
  ShieldAlert,
  PieChart,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

const formatNum = (n: number) =>
  Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

type VoteStatus = VotebookEntryUI['status']

const STATUS_CONFIG: Record<
  VoteStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  active: {
    label: 'Active',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/50',
  },
  exhausted: {
    label: 'Exhausted',
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800/50',
  },
  suspended: {
    label: 'Suspended',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/50',
  },
  lapsed: {
    label: 'Lapsed',
    bg: 'bg-gray-100 dark:bg-gray-800/40',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700/50',
  },
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

// ═══════════════════════════════════════════════════════════════════
// FORM DEFAULTS
// ═══════════════════════════════════════════════════════════════════

interface FormData {
  voteCode: string
  voteDescription: string
  annualAppropriation: string
  supplementaryAppropriation: string
  commitments: string
  expenditures: string
  encumbrances: string
  quarter: string
  status: VoteStatus
  notes: string
}

const emptyForm: FormData = {
  voteCode: '',
  voteDescription: '',
  annualAppropriation: '',
  supplementaryAppropriation: '',
  commitments: '',
  expenditures: '',
  encumbrances: '',
  quarter: '',
  status: 'active',
  notes: '',
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function VotebookStep() {
  const {
    votebookEntries,
    entityConfig,
    isLoading,
    addVotebookEntry,
    deleteVotebookEntry,
    saveVotebookEntries,
    clearVotebookEntries,
    recalculateVotebook,
    importVotesFromBudget,
    setWizardStep,
  } = useFinancialStore()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterQuarter, setFilterQuarter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  const formTotalAppr = useMemo(
    () =>
      (parseFloat(form.annualAppropriation) || 0) +
      (parseFloat(form.supplementaryAppropriation) || 0),
    [form.annualAppropriation, form.supplementaryAppropriation],
  )

  const totalAppropriation = useMemo(
    () => votebookEntries.reduce((s, v) => s + (v.totalAppropriation || 0), 0),
    [votebookEntries],
  )
  const totalCommitments = useMemo(
    () => votebookEntries.reduce((s, v) => s + (v.commitments || 0), 0),
    [votebookEntries],
  )
  const totalExpenditures = useMemo(
    () => votebookEntries.reduce((s, v) => s + (v.expenditures || 0), 0),
    [votebookEntries],
  )
  const totalAvailableBalance = useMemo(
    () => votebookEntries.reduce((s, v) => s + (v.availableBalance || 0), 0),
    [votebookEntries],
  )
  const totalEncumbrances = useMemo(
    () => votebookEntries.reduce((s, v) => s + (v.encumbrances || 0), 0),
    [votebookEntries],
  )
  const exhaustedCount = useMemo(
    () => votebookEntries.filter((v) => v.status === 'exhausted').length,
    [votebookEntries],
  )

  const filteredEntries = useMemo(() => {
    let result = votebookEntries
    if (filterStatus !== 'all') {
      result = result.filter((v) => v.status === filterStatus)
    }
    if (filterQuarter !== 'all') {
      result = result.filter((v) => v.quarter === filterQuarter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (v) =>
          v.voteCode?.toLowerCase().includes(q) ||
          v.voteDescription?.toLowerCase().includes(q) ||
          v.notes?.toLowerCase().includes(q),
      )
    }
    return result
  }, [votebookEntries, filterStatus, filterQuarter, searchQuery])

  const resetForm = useCallback(() => {
    setForm(emptyForm)
    setShowForm(false)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!form.voteCode.trim()) {
      toast.error('Vote Code is required')
      return
    }
    if (!form.voteDescription.trim()) {
      toast.error('Vote Description is required')
      return
    }

    const annual = parseFloat(form.annualAppropriation) || 0
    const suppl = parseFloat(form.supplementaryAppropriation) || 0
    const total = annual + suppl
    const commitments = parseFloat(form.commitments) || 0
    const expenditures = parseFloat(form.expenditures) || 0
    const encumbrances = parseFloat(form.encumbrances) || 0
    const unspent = Math.max(0, total - expenditures - commitments - encumbrances)
    const available = Math.max(0, total - commitments - encumbrances)

    const entry: VotebookEntryUI = {
      voteCode: form.voteCode.trim(),
      voteDescription: form.voteDescription.trim(),
      annualAppropriation: annual,
      supplementaryAppropriation: suppl,
      totalAppropriation: total,
      commitments,
      expenditures,
      unspentBalance: unspent,
      encumbrances,
      availableBalance: available,
      quarter: form.quarter,
      status: unspent <= 0 ? 'exhausted' : form.status,
      notes: form.notes.trim(),
    }

    addVotebookEntry(entry)
    toast.success(`Vote ${form.voteCode} added successfully`)
    resetForm()
  }, [form, addVotebookEntry, resetForm])

  const handleDelete = useCallback(
    (index: number) => {
      deleteVotebookEntry(index)
      toast.success('Vote entry deleted')
    },
    [deleteVotebookEntry],
  )

  const handleSave = useCallback(async () => {
    if (votebookEntries.length === 0) {
      toast.error('No vote entries to save')
      return
    }
    setSaving(true)
    try {
      await saveVotebookEntries()
      toast.success('Votebook saved successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save votebook')
    } finally {
      setSaving(false)
    }
  }, [votebookEntries, saveVotebookEntries])

  const handleClearAll = useCallback(() => {
    clearVotebookEntries()
    setClearDialogOpen(false)
    toast.success('All vote entries cleared')
  }, [clearVotebookEntries])

  const handleImport = useCallback(() => {
    setImporting(true)
    try {
      importVotesFromBudget()
      toast.success('Votes imported from budget')
    } catch {
      toast.error('Failed to import votes from budget')
    } finally {
      setImporting(false)
    }
  }, [importVotesFromBudget])

  const handleRecalculate = useCallback(() => {
    setRecalculating(true)
    try {
      recalculateVotebook()
      toast.success('Votebook recalculated')
    } catch {
      toast.error('Failed to recalculate votebook')
    } finally {
      setRecalculating(false)
    }
  }, [recalculateVotebook])

  const clearFilters = useCallback(() => {
    setFilterStatus('all')
    setFilterQuarter('all')
    setSearchQuery('')
  }, [])

  const hasActiveFilters =
    filterStatus !== 'all' || filterQuarter !== 'all' || searchQuery.trim() !== ''

  const getExpenditurePercent = (entry: VotebookEntryUI) => {
    if (!entry.totalAppropriation) return 0
    return Math.min(100, (entry.expenditures / entry.totalAppropriation) * 100)
  }

  const getProgressColor = (pct: number) => {
    if (pct >= 95) return '[&>div]:bg-red-500'
    if (pct >= 80) return '[&>div]:bg-amber-500'
    return '[&>div]:bg-emerald-500'
  }

  const getWarningIcon = (pct: number) => {
    if (pct >= 95) return <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" />
    if (pct >= 80) return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
    return null
  }

  // ── Summary cards data ───────────────────────────────────────
  const summaryCards = [
    {
      label: 'Total Appropriation',
      value: `${entityConfig.currency} ${formatNum(totalAppropriation)}`,
      icon: <PieChart className="h-5 w-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-800/50',
    },
    {
      label: 'Total Commitments',
      value: `${entityConfig.currency} ${formatNum(totalCommitments)}`,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-200 dark:border-indigo-800/50',
    },
    {
      label: 'Total Expenditures',
      value: `${entityConfig.currency} ${formatNum(totalExpenditures)}`,
      icon: <Vote className="h-5 w-5" />,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      border: 'border-orange-200 dark:border-orange-800/50',
    },
    {
      label: 'Available Balance',
      value: `${entityConfig.currency} ${formatNum(totalAvailableBalance)}`,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: totalAvailableBalance >= 0 ? 'text-emerald-600' : 'text-red-600',
      bg:
        totalAvailableBalance >= 0
          ? 'bg-emerald-50 dark:bg-emerald-950/40'
          : 'bg-red-50 dark:bg-red-950/40',
      border:
        totalAvailableBalance >= 0
          ? 'border-emerald-200 dark:border-emerald-800/50'
          : 'border-red-200 dark:border-red-800/50',
    },
    {
      label: 'Total Encumbrances',
      value: `${entityConfig.currency} ${formatNum(totalEncumbrances)}`,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800/50',
    },
    {
      label: 'Exhausted Votes',
      value: String(exhaustedCount),
      icon: <ShieldAlert className="h-5 w-5" />,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-200 dark:border-red-800/50',
    },
  ]

  // ── Render ───────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="space-y-6"
      >
        {/* HEADER */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Votebook
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Track budget appropriations against commitments, expenditures, and
              available balances for each vote/item. Monitor utilisation rates and
              identify exhausted or at-risk allocations across all government
              entities.
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit text-xs font-medium shrink-0 mt-2 sm:mt-0"
          >
            Step 6 of 10
          </Badge>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              className={`${card.bg} ${card.border} border`}
            >
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[11px] font-medium uppercase tracking-wider ${card.color}`}
                  >
                    {card.label}
                  </span>
                  <span className={card.color}>{card.icon}</span>
                </div>
                <p className="text-base font-bold text-foreground truncate">
                  {card.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm((p) => !p)}
            className="gap-1.5"
            disabled={isLoading}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Add Vote'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={isLoading || importing}
            className="gap-1.5"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            Import from Budget
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={isLoading || recalculating || votebookEntries.length === 0}
            className="gap-1.5"
          >
            {recalculating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PieChart className="h-4 w-4" />
            )}
            Recalculate
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading || saving || votebookEntries.length === 0}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            disabled={isLoading || votebookEntries.length === 0}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>

        {/* ADD VOTE INLINE FORM */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">New Vote Entry</CardTitle>
                <CardDescription>
                  Enter the vote details below. Total Appropriation is
                  auto-calculated from Annual + Supplementary.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="voteCode"
                      className="text-xs font-medium"
                    >
                      Vote Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="voteCode"
                      value={form.voteCode}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, voteCode: e.target.value }))
                      }
                      placeholder="e.g. V-101"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                    <Label
                      htmlFor="voteDesc"
                      className="text-xs font-medium"
                    >
                      Vote Description{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="voteDesc"
                      value={form.voteDescription}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          voteDescription: e.target.value,
                        }))
                      }
                      placeholder="e.g. Personnel Emoluments"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="annualAppr"
                      className="text-xs font-medium"
                    >
                      Annual Appropriation
                    </Label>
                    <Input
                      id="annualAppr"
                      type="number"
                      min="0"
                      value={form.annualAppropriation}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          annualAppropriation: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="h-9 text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="supplAppr"
                      className="text-xs font-medium"
                    >
                      Supplementary Appropriation
                    </Label>
                    <Input
                      id="supplAppr"
                      type="number"
                      min="0"
                      value={form.supplementaryAppropriation}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          supplementaryAppropriation: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="h-9 text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Total Appropriation (auto)
                    </Label>
                    <div className="h-9 rounded-md border bg-muted/60 px-3 flex items-center text-sm font-mono font-semibold text-foreground">
                      {entityConfig.currency} {formatNum(formTotalAppr)}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="commitments"
                      className="text-xs font-medium"
                    >
                      Commitments
                    </Label>
                    <Input
                      id="commitments"
                      type="number"
                      min="0"
                      value={form.commitments}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          commitments: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="h-9 text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="expenditures"
                      className="text-xs font-medium"
                    >
                      Expenditures
                    </Label>
                    <Input
                      id="expenditures"
                      type="number"
                      min="0"
                      value={form.expenditures}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          expenditures: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="h-9 text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="encumbrances"
                      className="text-xs font-medium"
                    >
                      Encumbrances
                    </Label>
                    <Input
                      id="encumbrances"
                      type="number"
                      min="0"
                      value={form.encumbrances}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          encumbrances: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="h-9 text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Quarter</Label>
                    <Select
                      value={form.quarter}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, quarter: v }))
                      }
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select quarter" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUARTERS.map((q) => (
                          <SelectItem key={q} value={q}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, status: v as VoteStatus }))
                      }
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="exhausted">Exhausted</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="lapsed">Lapsed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                    <Label htmlFor="notes" className="text-xs font-medium">
                      Notes
                    </Label>
                    <Input
                      id="notes"
                      value={form.notes}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, notes: e.target.value }))
                      }
                      placeholder="Optional notes or remarks"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    className="gap-1.5"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Add Vote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* FILTER BAR */}
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="exhausted">Exhausted</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="lapsed">Lapsed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterQuarter} onValueChange={setFilterQuarter}>
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quarters</SelectItem>
                  {QUARTERS.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-[180px] max-w-[280px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search code, description, notes..."
                  className="h-8 text-xs pl-7 pr-7"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}

              <span className="text-xs text-muted-foreground ml-auto">
                {filteredEntries.length} of {votebookEntries.length} votes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* DATA TABLE */}
        <Card>
          <CardContent className="p-0">
            {votebookEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Vote className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  No vote entries yet
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Add vote entries manually or import from your approved budget
                  to populate the votebook with appropriation and expenditure
                  tracking data.
                </p>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowForm(true)}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Add Vote
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImport}
                    disabled={importing}
                    className="gap-1.5"
                  >
                    {importing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                    Import from Budget
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Vote Code
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap min-w-[140px]">
                        Description
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Annual Appr.
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Suppl. Appr.
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Total Appr.
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Commitments
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Expenditures
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Unspent Bal.
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Available Bal.
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Encumbrances
                      </th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Quarter
                      </th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Status
                      </th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap min-w-[100px]">
                        Utilisation
                      </th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, idx) => {
                      const isEven = idx % 2 === 0
                      const pct = getExpenditurePercent(entry)
                      const sc = STATUS_CONFIG[entry.status]
                      return (
                        <tr
                          key={entry._id ?? idx}
                          className={`border-b transition-colors hover:bg-muted/40 ${isEven ? 'bg-background' : 'bg-muted/20'}`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap font-mono font-semibold">
                            {entry.voteCode}
                          </td>

                          <td className="px-3 py-2">
                            <span className="font-medium">
                              {entry.voteDescription}
                            </span>
                            {entry.notes && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-1.5 text-muted-foreground cursor-help">
                                    {'\u2139'}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                  <p className="text-xs">{entry.notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </td>

                          <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                            {formatNum(entry.annualAppropriation)}
                          </td>

                          <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                            {entry.supplementaryAppropriation > 0
                              ? formatNum(entry.supplementaryAppropriation)
                              : '\u2014'}
                          </td>

                          <td className="px-3 py-2 text-right font-mono font-semibold whitespace-nowrap">
                            {formatNum(entry.totalAppropriation)}
                          </td>

                          <td className="px-3 py-2 text-right font-mono whitespace-nowrap text-indigo-600 dark:text-indigo-400">
                            {entry.commitments > 0
                              ? formatNum(entry.commitments)
                              : '\u2014'}
                          </td>

                          <td className="px-3 py-2 text-right font-mono whitespace-nowrap text-orange-600 dark:text-orange-400">
                            {formatNum(entry.expenditures)}
                          </td>

                          <td
                            className={`px-3 py-2 text-right font-mono whitespace-nowrap font-medium ${entry.unspentBalance <= 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                          >
                            {entry.unspentBalance < 0 ? '(' : ''}
                            {formatNum(entry.unspentBalance)}
                            {entry.unspentBalance < 0 ? ')' : ''}
                          </td>

                          <td
                            className={`px-3 py-2 text-right font-mono whitespace-nowrap font-semibold ${entry.availableBalance <= 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}
                          >
                            {formatNum(entry.availableBalance)}
                          </td>

                          <td className="px-3 py-2 text-right font-mono whitespace-nowrap text-amber-600 dark:text-amber-400">
                            {entry.encumbrances > 0
                              ? formatNum(entry.encumbrances)
                              : '\u2014'}
                          </td>

                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {entry.quarter ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono"
                              >
                                {entry.quarter}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">{'\u2014'}</span>
                            )}
                          </td>

                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-semibold uppercase tracking-wider border ${sc.bg} ${sc.text} ${sc.border}`}
                            >
                              {sc.label}
                            </Badge>
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 justify-center">
                              {getWarningIcon(pct)}
                              <div className="w-16">
                                <Progress
                                  value={pct}
                                  className={`h-1.5 ${getProgressColor(pct)}`}
                                />
                              </div>
                              <span
                                className={`text-[10px] font-mono font-medium min-w-[28px] text-right ${pct >= 95 ? 'text-red-600 dark:text-red-400' : pct >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
                              >
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    const originalIndex = votebookEntries.findIndex(
                                      (e) => e._id === entry._id,
                                    )
                                    if (originalIndex !== -1) handleDelete(originalIndex)
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete vote entry</TooltipContent>
                            </Tooltip>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>

                  <tfoot>
                    <tr className="border-t-2 border-foreground/10 bg-muted/50 font-semibold">
                      <td className="px-3 py-2.5" colSpan={2}>
                        Totals ({filteredEntries.length} votes)
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {formatNum(
                          filteredEntries.reduce(
                            (s, v) => s + (v.annualAppropriation || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {formatNum(
                          filteredEntries.reduce(
                            (s, v) => s + (v.supplementaryAppropriation || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {formatNum(
                          filteredEntries.reduce(
                            (s, v) => s + (v.totalAppropriation || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-indigo-600 dark:text-indigo-400">
                        {formatNum(
                          filteredEntries.reduce(
                            (s, v) => s + (v.commitments || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-orange-600 dark:text-orange-400">
                        {formatNum(
                          filteredEntries.reduce(
                            (s, v) => s + (v.expenditures || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {formatNum(
                          filteredEntries.reduce(
                            (s, v) => s + (v.unspentBalance || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {formatNum(
                          filteredEntries.reduce(
                            (s, v) => s + (v.availableBalance || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400">
                        {formatNum(
                          filteredEntries.reduce(
                            (s, v) => s + (v.encumbrances || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NAVIGATION */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => setWizardStep(5)}
            className="gap-2"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trial Balance
          </Button>

          <Button
            onClick={() => setWizardStep(7)}
            className="gap-2"
            disabled={isLoading}
          >
            Continue to Abstract
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* CLEAR CONFIRMATION DIALOG */}
        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear All Vote Entries?</DialogTitle>
              <DialogDescription>
                This will permanently remove all {votebookEntries.length} vote
                entr{votebookEntries.length !== 1 ? 'ies' : 'y'}. This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setClearDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAll}
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Yes, Clear All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  )
}
