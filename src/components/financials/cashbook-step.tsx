'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useFinancialStore, type CashbookEntryUI } from '@/components/financials/store'

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
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Filter,
  BookOpen,
  Wallet,
  CircleDollarSign,
  Search,
  X,
} from 'lucide-react'

{/* ---------------------------------------------------------------- */}
// CONSTANTS
{/* ---------------------------------------------------------------- */}

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

{/* ---------------------------------------------------------------- */}
// FORM DEFAULTS
{/* ---------------------------------------------------------------- */}

interface FormData {
  entryDate: string
  type: 'receipt' | 'payment'
  reference: string
  description: string
  accountCode: string
  accountName: string
  debitAmount: string
  creditAmount: string
  bankAccount: string
  chequeNo: string
  payeePayer: string
}

const emptyForm: FormData = {
  entryDate: '',
  type: 'receipt',
  reference: '',
  description: '',
  accountCode: '',
  accountName: '',
  debitAmount: '',
  creditAmount: '',
  bankAccount: '',
  chequeNo: '',
  payeePayer: '',
}

{/* ---------------------------------------------------------------- */}
// COMPONENT
{/* ---------------------------------------------------------------- */}

export default function CashbookStep() {
  const {
    cashbookEntries,
    entityConfig,
    transactions,
    isLoading,
    addCashbookEntry,
    deleteCashbookEntry,
    saveCashbookEntries,
    clearCashbookEntries,
    postTransactionsToCashbook,
    setWizardStep,
  } = useFinancialStore()

  // ── Local state ──────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [filterType, setFilterType] = useState<'all' | 'receipt' | 'payment'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)

  // ── Running balance calculation ──────────────────────────────
  const entriesWithBalance = useMemo(() => {
    let running = 0
    return cashbookEntries.map((entry) => {
      running += entry.debitAmount - entry.creditAmount
      return { ...entry, runningBalance: running }
    })
  }, [cashbookEntries])

  // ── Filtered entries ─────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    let result = entriesWithBalance

    if (filterType !== 'all') {
      result = result.filter((e) => e.type === filterType)
    }

    if (dateFrom) {
      result = result.filter((e) => e.entryDate >= dateFrom)
    }

    if (dateTo) {
      result = result.filter((e) => e.entryDate <= dateTo)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.description?.toLowerCase().includes(q) ||
          e.reference?.toLowerCase().includes(q) ||
          e.accountName?.toLowerCase().includes(q) ||
          e.accountCode?.toLowerCase().includes(q) ||
          e.payeePayer?.toLowerCase().includes(q) ||
          e.bankAccount?.toLowerCase().includes(q)
      )
    }

    return result
  }, [entriesWithBalance, filterType, dateFrom, dateTo, searchQuery])

  // ── Summary calculations ─────────────────────────────────────
  const openingBalance = cashbookEntries.length > 0 ? 0 : 0

  const totalReceipts = useMemo(
    () => cashbookEntries.reduce((sum, e) => sum + (e.type === 'receipt' ? e.debitAmount : 0), 0),
    [cashbookEntries]
  )

  const totalPayments = useMemo(
    () => cashbookEntries.reduce((sum, e) => sum + (e.type === 'payment' ? e.creditAmount : 0), 0),
    [cashbookEntries]
  )

  const closingBalance = totalReceipts - totalPayments

  // ── Unposted transaction count ───────────────────────────────
  const unpostedCount = transactions.filter((t) => !t.postedToCashbook).length

  // ── Handlers ─────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setForm(emptyForm)
    setShowForm(false)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!form.entryDate) {
      toast.error('Entry date is required')
      return
    }
    if (!form.description.trim()) {
      toast.error('Description is required')
      return
    }
    if (form.type === 'receipt' && !parseFloat(form.debitAmount)) {
      toast.error('Receipt must have a debit amount')
      return
    }
    if (form.type === 'payment' && !parseFloat(form.creditAmount)) {
      toast.error('Payment must have a credit amount')
      return
    }

    const entry: CashbookEntryUI = {
      entryDate: form.entryDate,
      type: form.type,
      reference: form.reference.trim(),
      description: form.description.trim(),
      accountCode: form.accountCode.trim(),
      accountName: form.accountName.trim(),
      debitAmount: form.type === 'receipt' ? parseFloat(form.debitAmount) || 0 : 0,
      creditAmount: form.type === 'payment' ? parseFloat(form.creditAmount) || 0 : 0,
      balance: 0,
      bankAccount: form.bankAccount.trim(),
      chequeNo: form.chequeNo.trim(),
      payeePayer: form.payeePayer.trim(),
    }

    addCashbookEntry(entry)
    toast.success(`${form.type === 'receipt' ? 'Receipt' : 'Payment'} entry added`)
    resetForm()
  }, [form, addCashbookEntry, resetForm])

  const handleDelete = useCallback(
    (index: number) => {
      deleteCashbookEntry(index)
      toast.success('Entry deleted')
    },
    [deleteCashbookEntry]
  )

  const handleSave = useCallback(async () => {
    if (cashbookEntries.length === 0) {
      toast.error('No entries to save')
      return
    }
    setSaving(true)
    try {
      await saveCashbookEntries()
      toast.success('Cashbook saved successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save cashbook')
    } finally {
      setSaving(false)
    }
  }, [cashbookEntries, saveCashbookEntries])

  const handleClearAll = useCallback(() => {
    clearCashbookEntries()
    setClearDialogOpen(false)
    toast.success('All cashbook entries cleared')
  }, [clearCashbookEntries])

  const handleImport = useCallback(async () => {
    const unposted = transactions.filter((t) => !t.postedToCashbook)
    if (unposted.length === 0) {
      toast.info('No unposted transactions to import')
      return
    }
    setImporting(true)
    try {
      await postTransactionsToCashbook()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import transactions')
    } finally {
      setImporting(false)
    }
  }, [transactions, postTransactionsToCashbook])

  const clearFilters = useCallback(() => {
    setFilterType('all')
    setSearchQuery('')
    setDateFrom('')
    setDateTo('')
  }, [])

  const hasActiveFilters =
    filterType !== 'all' || searchQuery.trim() !== '' || dateFrom !== '' || dateTo !== ''

  // ── Summary cards data ───────────────────────────────────────
  const summaryCards = [
    {
      label: 'Opening Balance',
      value: `${entityConfig.currency} ${formatNum(openingBalance)}`,
      icon: <Wallet className="h-5 w-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-800/50',
    },
    {
      label: 'Total Receipts',
      value: `${entityConfig.currency} ${formatNum(totalReceipts)}`,
      icon: <ArrowDownCircle className="h-5 w-5" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800/50',
    },
    {
      label: 'Total Payments',
      value: `${entityConfig.currency} ${formatNum(totalPayments)}`,
      icon: <ArrowUpCircle className="h-5 w-5" />,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-200 dark:border-red-800/50',
    },
    {
      label: 'Closing Balance',
      value: `${entityConfig.currency} ${formatNum(closingBalance)}`,
      icon: <CircleDollarSign className="h-5 w-5" />,
      color: closingBalance >= 0 ? 'text-emerald-600' : 'text-red-600',
      bg: closingBalance >= 0
        ? 'bg-emerald-50 dark:bg-emerald-950/40'
        : 'bg-red-50 dark:bg-red-950/40',
      border: closingBalance >= 0
        ? 'border-emerald-200 dark:border-emerald-800/50'
        : 'border-red-200 dark:border-red-800/50',
    },
    {
      label: 'Entry Count',
      value: String(cashbookEntries.length),
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      border: 'border-violet-200 dark:border-violet-800/50',
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
        {/* ---------------------------------------------------------------- */}
        {/* HEADER */}
        {/* --------------------------------------------------------- */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Cashbook
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Record all cash receipts and payments in chronological order. The running balance is
              auto-calculated to maintain an accurate picture of your cash position throughout the
              financial period.
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit text-xs font-medium shrink-0 mt-2 sm:mt-0"
          >
            Step 3 of 10
          </Badge>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* SUMMARY CARDS */}
        {/* --------------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              className={`${card.bg} ${card.border} border`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={card.color}>{card.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </span>
                </div>
                <p className={`text-lg font-bold font-mono ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* ACTION BAR */}
        {/* --------------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setShowForm((prev) => !prev)}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'Hide Form' : 'Add Entry'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving || cashbookEntries.length === 0}
            className="gap-1.5"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            disabled={cashbookEntries.length === 0}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={importing || unpostedCount === 0}
            className="gap-1.5"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowDownCircle className="h-4 w-4" />
            )}
            Import from Transactions
            {unpostedCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {unpostedCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* INLINE ADD-ENTRY FORM (COLLAPSIBLE) */}
        {/* --------------------------------------------------------- */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-primary/20 bg-muted/30">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">New Cashbook Entry</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Fill in the details below and submit to add to the cashbook.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={resetForm}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-date" className="text-xs font-medium">
                      Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="cb-date"
                      type="date"
                      value={form.entryDate}
                      onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
                      className="h-9"
                    />
                  </div>

                  {/* Type Toggle */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Type</Label>
                    <div className="flex rounded-md border overflow-hidden h-9">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            type: 'receipt',
                            debitAmount: f.creditAmount || '',
                            creditAmount: '',
                          }))
                        }
                        className={`flex-1 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                          form.type === 'receipt'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <ArrowDownCircle className="h-3.5 w-3.5" />
                        Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            type: 'payment',
                            creditAmount: f.debitAmount || '',
                            debitAmount: '',
                          }))
                        }
                        className={`flex-1 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                          form.type === 'payment'
                            ? 'bg-red-600 text-white'
                            : 'bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                        Payment
                      </button>
                    </div>
                  </div>

                  {/* Reference */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-ref" className="text-xs font-medium">
                      Reference
                    </Label>
                    <Input
                      id="cb-ref"
                      placeholder="e.g. RCV-001"
                      value={form.reference}
                      onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                      className="h-9"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-desc" className="text-xs font-medium">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="cb-desc"
                      placeholder="Narrative"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="h-9"
                    />
                  </div>

                  {/* Account Code */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-acct-code" className="text-xs font-medium">
                      Account Code
                    </Label>
                    <Input
                      id="cb-acct-code"
                      placeholder="e.g. 1001"
                      value={form.accountCode}
                      onChange={(e) => setForm((f) => ({ ...f, accountCode: e.target.value }))}
                      className="h-9 font-mono"
                    />
                  </div>

                  {/* Account Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-acct-name" className="text-xs font-medium">
                      Account Name
                    </Label>
                    <Input
                      id="cb-acct-name"
                      placeholder="e.g. Cash at Bank"
                      value={form.accountName}
                      onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                      className="h-9"
                    />
                  </div>

                  {/* Debit Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-debit" className="text-xs font-medium">
                      {form.type === 'receipt' ? (
                        <span className="text-emerald-600">
                          Debit (Receipt) <span className="text-destructive">*</span>
                        </span>
                      ) : (
                        'Debit'
                      )}
                    </Label>
                    <Input
                      id="cb-debit"
                      type="number"
                      placeholder="0.00"
                      value={form.debitAmount}
                      onChange={(e) => setForm((f) => ({ ...f, debitAmount: e.target.value }))}
                      disabled={form.type === 'payment'}
                      className={`h-9 font-mono ${form.type === 'receipt' ? 'border-emerald-300 focus-visible:ring-emerald-500/30' : ''}`}
                    />
                  </div>

                  {/* Credit Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-credit" className="text-xs font-medium">
                      {form.type === 'payment' ? (
                        <span className="text-red-600">
                          Credit (Payment) <span className="text-destructive">*</span>
                        </span>
                      ) : (
                        'Credit'
                      )}
                    </Label>
                    <Input
                      id="cb-credit"
                      type="number"
                      placeholder="0.00"
                      value={form.creditAmount}
                      onChange={(e) => setForm((f) => ({ ...f, creditAmount: e.target.value }))}
                      disabled={form.type === 'receipt'}
                      className={`h-9 font-mono ${form.type === 'payment' ? 'border-red-300 focus-visible:ring-red-500/30' : ''}`}
                    />
                  </div>

                  {/* Bank Account */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-bank" className="text-xs font-medium">
                      Bank Account
                    </Label>
                    <Select
                      value={form.bankAccount}
                      onValueChange={(v) => setForm((f) => ({ ...f, bankAccount: v }))}
                    >
                      <SelectTrigger id="cb-bank" className="h-9">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main Account</SelectItem>
                        <SelectItem value="operations">Operations Account</SelectItem>
                        <SelectItem value="development">Development Fund</SelectItem>
                        <SelectItem value="retention">Retention Account</SelectItem>
                        <SelectItem value="petty-cash">Petty Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cheque No */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-cheque" className="text-xs font-medium">
                      Cheque No
                    </Label>
                    <Input
                      id="cb-cheque"
                      placeholder="e.g. CHQ-1234"
                      value={form.chequeNo}
                      onChange={(e) => setForm((f) => ({ ...f, chequeNo: e.target.value }))}
                      className="h-9 font-mono"
                    />
                  </div>

                  {/* Payee/Payer */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="cb-payee" className="text-xs font-medium">
                      Payee / Payer
                    </Label>
                    <Input
                      id="cb-payee"
                      placeholder="Name of payee or payer"
                      value={form.payeePayer}
                      onChange={(e) => setForm((f) => ({ ...f, payeePayer: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    className="text-muted-foreground"
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSubmit} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Add to Cashbook
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* FILTER BAR */}
        {/* --------------------------------------------------------- */}
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v as 'all' | 'receipt' | 'payment')}
              >
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="receipt">Receipts</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 w-[140px] text-xs"
                placeholder="From date"
              />

              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 w-[140px] text-xs"
                placeholder="To date"
              />

              <div className="relative flex-1 min-w-[180px] max-w-[280px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search description, ref, account, payee…"
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
                {filteredEntries.length} of {cashbookEntries.length} entries
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* DATA TABLE */}
        {/* --------------------------------------------------------- */}
        <Card>
          <CardContent className="p-0">
            {cashbookEntries.length === 0 ? (
              /* ── EMPTY STATE ──────────────────────────────────────── */
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">No cashbook entries yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Add entries manually or import from your captured revenue and expenditure
                  transactions to populate the cashbook.
                </p>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowForm(true)}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Add Entry
                  </Button>
                  {unpostedCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImport}
                      className="gap-1.5"
                    >
                      <ArrowDownCircle className="h-4 w-4" />
                      Import {unpostedCount} Transactions
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* ── TABLE ─────────────────────────────────────────────── */
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Date
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Type
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Ref
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap min-w-[160px]">
                        Description
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Account
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Debit
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Credit
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Running Bal.
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Bank
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Payee/Payer
                      </th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, idx) => {
                      const isEven = idx % 2 === 0
                      const isReceipt = entry.type === 'receipt'
                      return (
                        <tr
                          key={entry._id ?? idx}
                          className={`
                            border-b transition-colors hover:bg-muted/40
                            ${isEven ? 'bg-background' : 'bg-muted/20'}
                          `}
                        >
                          {/* Date */}
                          <td className="px-3 py-2 whitespace-nowrap font-mono">
                            {entry.entryDate}
                          </td>

                          {/* Type Badge */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Badge
                              variant="secondary"
                              className={`
                                text-[10px] font-semibold uppercase tracking-wider
                                ${
                                  isReceipt
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                                }
                              `}
                            >
                              {isReceipt ? (
                                <span className="flex items-center gap-1">
                                  <ArrowDownCircle className="h-3 w-3" />
                                  RCP
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <ArrowUpCircle className="h-3 w-3" />
                                  PAY
                                </span>
                              )}
                            </Badge>
                          </td>

                          {/* Reference */}
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-muted-foreground">
                            {entry.reference || '—'}
                          </td>

                          {/* Description */}
                          <td className="px-3 py-2">
                            <span className={`font-medium ${isReceipt ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                              {entry.description}
                            </span>
                          </td>

                          {/* Account */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="font-mono text-muted-foreground">
                              {entry.accountCode}
                            </span>
                            {entry.accountName && (
                              <span className="ml-1.5 text-muted-foreground">
                                {entry.accountName}
                              </span>
                            )}
                          </td>

                          {/* Debit */}
                          <td className={`px-3 py-2 text-right font-mono font-medium whitespace-nowrap ${entry.debitAmount > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                            {entry.debitAmount > 0 ? formatNum(entry.debitAmount) : '—'}
                          </td>

                          {/* Credit */}
                          <td className={`px-3 py-2 text-right font-mono font-medium whitespace-nowrap ${entry.creditAmount > 0 ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground'}`}>
                            {entry.creditAmount > 0 ? formatNum(entry.creditAmount) : '—'}
                          </td>

                          {/* Running Balance */}
                          <td
                            className={`px-3 py-2 text-right font-mono font-bold whitespace-nowrap ${
                              entry.runningBalance < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-foreground'
                            }`}
                          >
                            {entry.runningBalance < 0 ? '(' : ''}
                            {formatNum(Math.abs(entry.runningBalance))}
                            {entry.runningBalance < 0 ? ')' : ''}
                          </td>

                          {/* Bank */}
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                            {entry.bankAccount ? (
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {entry.bankAccount}
                              </Badge>
                            ) : (
                              '—'
                            )}
                          </td>

                          {/* Payee/Payer */}
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground max-w-[140px] truncate">
                            {entry.payeePayer || '—'}
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    const originalIndex = cashbookEntries.findIndex(
                                      (e) => e._id === entry._id
                                    )
                                    if (originalIndex !== -1) handleDelete(originalIndex)
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete entry</TooltipContent>
                            </Tooltip>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>

                  {/* ── FOOTER TOTALS ────────────────────────────────────── */}
                  <tfoot>
                    <tr className="border-t-2 border-foreground/10 bg-muted/50 font-semibold">
                      <td colSpan={5} className="px-3 py-2.5 text-right">
                        Totals
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400">
                        {formatNum(totalReceipts)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-red-700 dark:text-red-400">
                        {formatNum(totalPayments)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-mono font-bold ${
                          closingBalance < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-foreground'
                        }`}
                      >
                        {closingBalance < 0 ? '(' : ''}
                        {formatNum(Math.abs(closingBalance))}
                        {closingBalance < 0 ? ')' : ''}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* NAVIGATION */}
        {/* --------------------------------------------------------- */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => setWizardStep(2)}
            className="gap-2"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Rev / Exp Capture
          </Button>

          <Button
            onClick={() => setWizardStep(4)}
            className="gap-2"
            disabled={isLoading}
          >
            Continue to Ledger
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* CLEAR CONFIRMATION DIALOG */}
        {/* --------------------------------------------------------- */}
        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear All Cashbook Entries?</DialogTitle>
              <DialogDescription>
                This will permanently remove all {cashbookEntries.length} cashbook entry
                {cashbookEntries.length !== 1 ? 'ies' : 'y'}. This action cannot be undone.
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