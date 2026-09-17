'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useFinancialStore, type LedgerEntryUI } from '@/components/financials/store'

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

import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Filter,
  BookOpen,
  Table,
  FileText,
  Wand2,
  X,
  Search,
} from 'lucide-react'

// ----------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------

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

const CLASSIFICATION_OPTIONS = [
  'revenue-non-exchange',
  'revenue-exchange',
  'expense-employee',
  'expense-goods-services',
  'expense-depreciation',
  'expense-grants',
  'expense-transfers',
  'asset-current',
  'asset-non-current',
  'liability-current',
  'liability-non-current',
  'equity',
] as const

const JOURNAL_TYPE_OPTIONS = [
  { value: 'general', label: 'General', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'adjustment', label: 'Adjustment', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'closing', label: 'Closing', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  { value: 'opening', label: 'Opening', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
] as const

const JOURNAL_TYPE_FILTERS = ['all', 'general', 'adjustment', 'closing', 'opening'] as const
type JournalTypeFilter = (typeof JOURNAL_TYPE_FILTERS)[number]

// ----------------------------------------------------------------
// FORM DEFAULTS
// ----------------------------------------------------------------

interface FormData {
  entryDate: string
  accountCode: string
  accountName: string
  classification: string
  category: string
  debit: string
  credit: string
  reference: string
  description: string
  journalType: 'general' | 'adjustment' | 'closing' | 'opening'
}

const emptyForm: FormData = {
  entryDate: '',
  accountCode: '',
  accountName: '',
  classification: '',
  category: '',
  debit: '',
  credit: '',
  reference: '',
  description: '',
  journalType: 'general',
}

// ----------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------

function getJournalBadge(type: string) {
  const found = JOURNAL_TYPE_OPTIONS.find((j) => j.value === type)
  return found ? found : JOURNAL_TYPE_OPTIONS[0]
}

function formatClassificationLabel(val: string) {
  return val
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ----------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------

export default function LedgerStep() {
  const {
    ledgerEntries,
    entityConfig,
    isLoading,
    addLedgerEntry,
    deleteLedgerEntry,
    saveLedgerEntries,
    clearLedgerEntries,
    generateTBFromLedger,
    setWizardStep,
  } = useFinancialStore()

  // -- Local state --
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [journalFilter, setJournalFilter] = useState<JournalTypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  // -- Unique accounts list (from ledgerEntries) --
  const uniqueAccounts = useMemo(() => {
    const map = new Map<string, string>()
    ledgerEntries.forEach((e) => {
      const key = e.accountCode || '--'
      if (!map.has(key)) {
        map.set(key, e.accountName || 'Unnamed Account')
      }
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [ledgerEntries])

  // -- Filtered entries by account, journal type, search --
  const filteredEntries = useMemo(() => {
    let result = [...ledgerEntries]

    if (selectedAccount !== 'all') {
      result = result.filter((e) => e.accountCode === selectedAccount)
    }

    if (journalFilter !== 'all') {
      result = result.filter((e) => e.journalType === journalFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.description?.toLowerCase().includes(q) ||
          e.reference?.toLowerCase().includes(q) ||
          e.accountName?.toLowerCase().includes(q) ||
          e.accountCode?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      const dCmp = (a.entryDate || '').localeCompare(b.entryDate || '')
      return dCmp !== 0 ? dCmp : 0
    })

    return result
  }, [ledgerEntries, selectedAccount, journalFilter, searchQuery])

  // -- Running balance per filtered account --
  const entriesWithBalance = useMemo(() => {
    let running = 0
    return filteredEntries.map((entry) => {
      running = running + entry.debit - entry.credit
      return { ...entry, computedBalance: running }
    })
  }, [filteredEntries])

  // -- Summary for selected account --
  const accountSummary = useMemo(() => {
    const target =
      selectedAccount === 'all'
        ? ledgerEntries
        : ledgerEntries.filter((e) => e.accountCode === selectedAccount)

    const totalDebits = target.reduce((s, e) => s + e.debit, 0)
    const totalCredits = target.reduce((s, e) => s + e.credit, 0)
    const netBalance = totalDebits - totalCredits

    const code = selectedAccount === 'all' ? 'All' : selectedAccount
    const name =
      selectedAccount === 'all'
        ? `${uniqueAccounts.length} account(s)`
        : uniqueAccounts.find(([c]) => c === selectedAccount)?.[1] || '--'

    return {
      accountCode: code,
      accountName: name,
      totalDebits,
      totalCredits,
      netBalance,
      entryCount: target.length,
    }
  }, [ledgerEntries, selectedAccount, uniqueAccounts])

  // -- Handlers --
  const resetForm = useCallback(() => {
    setForm(emptyForm)
    setShowForm(false)
  }, [])

  const handleFormChange = useCallback(
    (field: keyof FormData, value: string) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
        ...(field === 'accountCode'
          ? {
              accountName:
                uniqueAccounts.find(([c]) => c === value)?.[1] || prev.accountName,
            }
          : {}),
      }))
    },
    [uniqueAccounts]
  )

  const handleSubmit = useCallback(() => {
    if (!form.entryDate) {
      toast.error('Entry date is required')
      return
    }
    if (!form.accountCode.trim()) {
      toast.error('Account code is required')
      return
    }
    if (!form.accountName.trim()) {
      toast.error('Account name is required')
      return
    }
    const debitVal = parseFloat(form.debit) || 0
    const creditVal = parseFloat(form.credit) || 0
    if (debitVal === 0 && creditVal === 0) {
      toast.error('Either a debit or credit amount is required')
      return
    }
    if (debitVal > 0 && creditVal > 0) {
      toast.error('An entry cannot have both debit and credit amounts')
      return
    }

    const entry: LedgerEntryUI = {
      entryDate: form.entryDate,
      accountCode: form.accountCode.trim(),
      accountName: form.accountName.trim(),
      classification: form.classification,
      category: form.category.trim(),
      debit: debitVal,
      credit: creditVal,
      runningBalance: 0,
      reference: form.reference.trim(),
      description: form.description.trim(),
      journalType: form.journalType,
    }

    addLedgerEntry(entry)
    toast.success('Ledger entry added')
    resetForm()
  }, [form, addLedgerEntry, resetForm])

  const handleDelete = useCallback(
    (index: number) => {
      const originalIndex = ledgerEntries.indexOf(filteredEntries[index])
      if (originalIndex !== -1) {
        deleteLedgerEntry(originalIndex)
        toast.success('Entry deleted')
      }
    },
    [ledgerEntries, filteredEntries, deleteLedgerEntry]
  )

  const handleSave = useCallback(async () => {
    if (ledgerEntries.length === 0) {
      toast.error('No entries to save')
      return
    }
    setSaving(true)
    try {
      await saveLedgerEntries()
      toast.success('Ledger saved successfully')
    } catch (err) {
      toast.error('Failed to save ledger')
    } finally {
      setSaving(false)
    }
  }, [ledgerEntries, saveLedgerEntries])

  const handleClearAll = useCallback(() => {
    clearLedgerEntries()
    setClearDialogOpen(false)
    setSelectedAccount('all')
    toast.success('All ledger entries cleared')
  }, [clearLedgerEntries])

  const handleGenerateTB = useCallback(() => {
    if (ledgerEntries.length === 0) {
      toast.error('No ledger entries to generate trial balance from')
      return
    }
    setGenerating(true)
    try {
      generateTBFromLedger()
      toast.success('Trial balance generated from ledger entries')
    } catch (err) {
      toast.error('Failed to generate trial balance')
    } finally {
      setGenerating(false)
    }
  }, [ledgerEntries, generateTBFromLedger])

  // ================================================================
  // RENDER
  // ================================================================

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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                General Ledger
              </h1>
              <p className="text-sm text-muted-foreground">
                Double-entry bookkeeping with account-level tracking. Record, classify, and
                review every journal entry before generating the trial balance.
              </p>
            </div>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Entry
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new journal entry</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateTB}
                disabled={generating || ledgerEntries.length === 0}
                className="gap-1.5"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Generate TB from Ledger
              </Button>
            </TooltipTrigger>
            <TooltipContent>Summarize ledger entries into trial balance</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-1.5"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save ledger entries</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  ledgerEntries.length > 0
                    ? setClearDialogOpen(true)
                    : toast.error('Nothing to clear')
                }
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Clear All
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove all ledger entries</TooltipContent>
          </Tooltip>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="text-[11px] uppercase tracking-wider">
                Account Code
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-lg font-semibold truncate">{accountSummary.accountCode}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="text-[11px] uppercase tracking-wider">
                Account Name
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-lg font-semibold truncate">{accountSummary.accountName}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="text-[11px] uppercase tracking-wider">
                Total Debits
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {entityConfig.currency} {formatNum(accountSummary.totalDebits)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="text-[11px] uppercase tracking-wider">
                Total Credits
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {entityConfig.currency} {formatNum(accountSummary.totalCredits)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="text-[11px] uppercase tracking-wider">
                Net Balance
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p
                className={`text-lg font-semibold ${
                  accountSummary.netBalance < 0
                    ? 'text-red-600 dark:text-red-400'
                    : accountSummary.netBalance > 0
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                }`}
              >
                {accountSummary.netBalance < 0 ? '(': ''}
                {entityConfig.currency} {formatNum(accountSummary.netBalance)}
                {accountSummary.netBalance < 0 ? ')': ''}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="text-[11px] uppercase tracking-wider">
                Entry Count
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-lg font-semibold">{accountSummary.entryCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* FILTER BAR */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search description, reference, account..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Account selector */}
              <div className="flex items-center gap-2 min-w-[200px]">
                <Label className="text-xs font-medium whitespace-nowrap flex items-center gap-1">
                  <Table className="h-3.5 w-3.5" /> Account
                </Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {uniqueAccounts.map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {code} -- {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Journal type filter */}
              <div className="flex items-center gap-2 min-w-[160px]">
                <Label className="text-xs font-medium whitespace-nowrap flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> Journal
                </Label>
                <Select
                  value={journalFilter}
                  onValueChange={(v) => setJournalFilter(v as JournalTypeFilter)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOURNAL_TYPE_FILTERS.map((jt) => (
                      <SelectItem key={jt} value={jt}>
                        {jt === 'all' ? 'All Types' : jt.charAt(0).toUpperCase() + jt.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ADD ENTRY COLLAPSIBLE FORM */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20">
              <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    <CardTitle className="text-base">New Journal Entry</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Enter debit or credit -- not both. Classification is optional.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Date *</Label>
                    <Input
                      type="date"
                      value={form.entryDate}
                      onChange={(e) => handleFormChange('entryDate', e.target.value)}
                      className="h-9"
                    />
                  </div>

                  {/* Account Code */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Account Code *</Label>
                    <Input
                      placeholder="e.g. 1100"
                      value={form.accountCode}
                      onChange={(e) => handleFormChange('accountCode', e.target.value)}
                      className="h-9"
                    />
                  </div>

                  {/* Account Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Account Name *</Label>
                    <Input
                      placeholder="e.g. Cash & Cash Equivalents"
                      value={form.accountName}
                      onChange={(e) => handleFormChange('accountName', e.target.value)}
                      className="h-9"
                    />
                  </div>

                  {/* Classification */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Classification</Label>
                    <Select
                      value={form.classification}
                      onValueChange={(v) => handleFormChange('classification', v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select classification" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSIFICATION_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {formatClassificationLabel(c)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Category</Label>
                    <Input
                      placeholder="e.g. Personnel Costs"
                      value={form.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      className="h-9"
                    />
                  </div>

                  {/* Debit */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      Debit
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="1"
                      value={form.debit}
                      onChange={(e) => handleFormChange('debit', e.target.value)}
                      className="h-9 border-blue-200 dark:border-blue-800 focus-visible:ring-blue-400"
                    />
                  </div>

                  {/* Credit */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Credit
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="1"
                      value={form.credit}
                      onChange={(e) => handleFormChange('credit', e.target.value)}
                      className="h-9 border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-400"
                    />
                  </div>

                  {/* Reference */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Reference</Label>
                    <Input
                      placeholder="e.g. JV-001"
                      value={form.reference}
                      onChange={(e) => handleFormChange('reference', e.target.value)}
                      className="h-9"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium">Description</Label>
                    <Input
                      placeholder="Narrative for this entry"
                      value={form.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      className="h-9"
                    />
                  </div>

                  {/* Journal Type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Journal Type</Label>
                    <Select
                      value={form.journalType}
                      onValueChange={(v) => handleFormChange('journalType', v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JOURNAL_TYPE_OPTIONS.map((j) => (
                          <SelectItem key={j.value} value={j.value}>
                            {j.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Form actions */}
                <div className="mt-4 flex items-center gap-2 border-t pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="gap-1.5"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" /> Add Entry
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* DATA TABLE */}
        <Card className="border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Table className="h-4 w-4 text-muted-foreground" />
                  Ledger Entries
                  <Badge variant="secondary" className="font-normal">
                    {entriesWithBalance.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Running balance recalculated per filtered view (prev + debit - credit)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {entriesWithBalance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No ledger entries</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md">
                  {ledgerEntries.length === 0
                    ? 'Start by adding journal entries manually or posting transactions from the Revenue and Expenditure step.'
                    : 'No entries match the current filters. Try adjusting your search or account selection.'}
                </p>
                {ledgerEntries.length === 0 && (
                  <Button
                    onClick={() => setShowForm(true)}
                    size="sm"
                    className="mt-4 gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add First Entry
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Code</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Name</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Debit</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Credit</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Running Bal.</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Journal Type</th>
                      <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entriesWithBalance.map((entry, idx) => {
                      const badge = getJournalBadge(entry.journalType)
                      const isZebra = idx % 2 === 1
                      const balance = entry.computedBalance ?? 0

                      return (
                        <tr
                          key={entry._id ?? idx}
                          className={
                            'border-b transition-colors hover:bg-muted/30 ' +
                            (isZebra ? 'bg-muted/20' : 'bg-transparent')
                          }
                        >
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                            {entry.entryDate || '--'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs font-medium">
                            {entry.accountCode || '--'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 font-medium">
                            {entry.accountName || '--'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono">
                            {entry.debit > 0 ? (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {entityConfig.currency} {formatNum(entry.debit)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">--</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono">
                            {entry.credit > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {entityConfig.currency} {formatNum(entry.credit)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">--</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono">
                            <span
                              className={
                                'font-semibold ' +
                                (balance < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : balance > 0
                                    ? 'text-foreground'
                                    : 'text-muted-foreground')
                              }
                            >
                              {balance < 0 ? '(' : ''}
                              {entityConfig.currency} {formatNum(balance)}
                              {balance < 0 ? ')' : ''}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                            {entry.reference || '--'}
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-2.5">
                            {entry.description || '--'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <Badge
                              variant="secondary"
                              className={'text-[11px] font-medium px-2 py-0 ' + badge.color}
                            >
                              {badge.label}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(idx)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete this entry</TooltipContent>
                            </Tooltip>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>

                  {/* TABLE FOOTER TOTALS */}
                  <tfoot>
                    <tr className="border-t-2 border-foreground/10 bg-muted/50 font-semibold">
                      <td colSpan={3} className="px-4 py-2.5 text-right uppercase text-xs tracking-wider">
                        Totals
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-blue-600 dark:text-blue-400">
                        {entityConfig.currency}{' '}
                        {formatNum(entriesWithBalance.reduce((s, e) => s + e.debit, 0))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {entityConfig.currency}{' '}
                        {formatNum(entriesWithBalance.reduce((s, e) => s + e.credit, 0))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono">
                        <span
                          className={
                            entriesWithBalance.length > 0 &&
                            (entriesWithBalance[entriesWithBalance.length - 1].computedBalance ?? 0) < 0
                              ? 'text-red-600 dark:text-red-400'
                              : ''
                          }
                        >
                          {entityConfig.currency}{' '}
                          {formatNum(
                            entriesWithBalance.length > 0
                              ? entriesWithBalance[entriesWithBalance.length - 1].computedBalance ?? 0
                              : 0
                          )}
                        </span>
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
            onClick={() => setWizardStep(3)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Cashbook
          </Button>
          <Button
            onClick={() => setWizardStep(5)}
            className="gap-2"
          >
            Continue to Trial Balance <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* CLEAR ALL DIALOG */}
        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear All Ledger Entries?</DialogTitle>
              <DialogDescription>
                This will permanently remove all {ledgerEntries.length} ledger entr{ledgerEntries.length !== 1 ? 'ies' : 'y'}. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setClearDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClearAll}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Clear All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  )
}