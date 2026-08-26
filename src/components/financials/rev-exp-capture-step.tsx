'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useFinancialStore, type TransactionEntry } from '@/components/financials/store'

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
  Upload,
  BookOpen,
  ArrowDownCircle,
  ArrowUpCircle,
  Send,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

const CLASSIFICATION_OPTIONS = [
  { value: 'revenue-non-exchange', label: 'Revenue – Non-Exchange (Taxes, Grants)' },
  { value: 'revenue-exchange', label: 'Revenue – Exchange (Fees, Charges)' },
  { value: 'expense-employee', label: 'Expense – Employee Benefits' },
  { value: 'expense-goods-services', label: 'Expense – Goods & Services' },
  { value: 'expense-depreciation', label: 'Expense – Depreciation & Amortisation' },
  { value: 'expense-grants', label: 'Expense – Grants & Transfers' },
  { value: 'expense-transfers', label: 'Expense – Inter-entity Transfers' },
  { value: 'asset-current', label: 'Asset – Current' },
  { value: 'asset-non-current', label: 'Asset – Non-Current' },
  { value: 'liability-current', label: 'Liability – Current' },
  { value: 'liability-non-current', label: 'Liability – Non-Current' },
  { value: 'equity', label: 'Equity / Net Assets' },
] as const

const REVENUE_CATEGORIES = [
  'Tax Revenue',
  'Non-Tax Revenue',
  'Grants – Unrestricted',
  'Grants – Restricted',
  'Fees & Charges',
  'Fines & Penalties',
  'Investment Income',
  'Rental Income',
  'Other Revenue',
] as const

const EXPENSE_CATEGORIES = [
  'Compensation of Employees',
  'Goods & Services',
  'Use of Goods & Services',
  'Consumption of Fixed Capital',
  'Interest Expense',
  'Grants & Subsidies',
  'Social Benefits',
  'Other Expenses',
  'Depreciation',
  'Impairment Losses',
] as const

const formatNum = (n: number) =>
  Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

// ═══════════════════════════════════════════════════════════════════
// FORM DEFAULTS
// ═══════════════════════════════════════════════════════════════════

interface FormData {
  transactionDate: string
  reference: string
  description: string
  accountCode: string
  accountName: string
  classification: string
  category: string
  amount: string
  taxAmount: string
  payeePayer: string
  voucherNo: string
  invoiceNo: string
  receiptNo: string
  fundSource: string
}

const emptyForm: FormData = {
  transactionDate: '',
  reference: '',
  description: '',
  accountCode: '',
  accountName: '',
  classification: '',
  category: '',
  amount: '',
  taxAmount: '',
  payeePayer: '',
  voucherNo: '',
  invoiceNo: '',
  receiptNo: '',
  fundSource: '',
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function RevExpCaptureStep() {
  const {
    transactions,
    entityConfig,
    addTransaction,
    deleteTransaction,
    postTransactionsToLedger,
    postTransactionsToCashbook,
    saveTransactions,
    clearTransactions,
    setWizardStep,
  } = useFinancialStore()

  // ── Local state ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'revenue' | 'expenditure'>('revenue')
  const [formVisible, setFormVisible] = useState(false)
  const [formData, setFormData] = useState<FormData>({ ...emptyForm })
  const [searchTerm, setSearchTerm] = useState('')
  const [isPostingLedger, setIsPostingLedger] = useState(false)
  const [isPostingCashbook, setIsPostingCashbook] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // ── Computed summaries ───────────────────────────────────────
  const revenueItems = useMemo(
    () => transactions.filter((t) => t.type === 'revenue'),
    [transactions]
  )
  const expenditureItems = useMemo(
    () => transactions.filter((t) => t.type === 'expenditure'),
    [transactions]
  )

  const totalRevenueAmount = useMemo(
    () => revenueItems.reduce((sum, t) => sum + t.amount, 0),
    [revenueItems]
  )
  const totalExpenditureAmount = useMemo(
    () => expenditureItems.reduce((sum, t) => sum + t.amount, 0),
    [expenditureItems]
  )
  const netPosition = totalRevenueAmount - totalExpenditureAmount
  const postedToLedgerCount = useMemo(
    () => transactions.filter((t) => t.postedToLedger).length,
    [transactions]
  )
  const postedToCashbookCount = useMemo(
    () => transactions.filter((t) => t.postedToCashbook).length,
    [transactions]
  )

  // ── Filtered table data ──────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    let list = transactions.filter((t) => t.type === activeTab)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(
        (t) =>
          t.reference.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.accountCode.toLowerCase().includes(q) ||
          t.accountName.toLowerCase().includes(q) ||
          t.payeePayer.toLowerCase().includes(q) ||
          t.classification.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
    }
    return list
  }, [transactions, activeTab, searchTerm])

  // ── Category options based on tab ────────────────────────────
  const categoryOptions =
    activeTab === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES

  // ── Auto-calculate net amount ────────────────────────────────
  const netAmount = useMemo(() => {
    const gross = parseFloat(formData.amount) || 0
    const tax = parseFloat(formData.taxAmount) || 0
    return gross - tax
  }, [formData.amount, formData.taxAmount])

  // ── Form handlers ────────────────────────────────────────────
  const handleFieldChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const resetForm = useCallback(() => {
    setFormData({ ...emptyForm })
  }, [])

  const toggleForm = useCallback(() => {
    setFormVisible((prev) => {
      if (!prev) resetForm()
      return !prev
    })
  }, [resetForm])

  const handleSubmit = useCallback(() => {
    if (!formData.transactionDate) {
      toast.error('Transaction date is required')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Description is required')
      return
    }
    if (!formData.accountCode.trim()) {
      toast.error('Account code is required')
      return
    }
    if (!formData.classification) {
      toast.error('Classification is required')
      return
    }
    if (!(parseFloat(formData.amount) > 0)) {
      toast.error('Gross amount must be greater than zero')
      return
    }

    const entry: TransactionEntry = {
      _id: crypto.randomUUID(),
      transactionDate: formData.transactionDate,
      type: activeTab,
      reference: formData.reference.trim(),
      description: formData.description.trim(),
      accountCode: formData.accountCode.trim(),
      accountName: formData.accountName.trim(),
      classification: formData.classification,
      category: formData.category,
      amount: parseFloat(formData.amount),
      taxAmount: parseFloat(formData.taxAmount) || 0,
      netAmount,
      payeePayer: formData.payeePayer.trim(),
      voucherNo: formData.voucherNo.trim(),
      invoiceNo: formData.invoiceNo.trim(),
      receiptNo: formData.receiptNo.trim(),
      fundSource: formData.fundSource.trim(),
      postedToLedger: false,
      postedToCashbook: false,
    }

    addTransaction(entry)
    toast.success(`${activeTab === 'revenue' ? 'Revenue' : 'Expenditure'} transaction added`)
    resetForm()
    setFormVisible(false)
  }, [formData, activeTab, netAmount, addTransaction, resetForm])

  const handleDelete = useCallback(
    (index: number) => {
      deleteTransaction(index)
      toast.success('Transaction deleted')
    },
    [deleteTransaction]
  )

  const handlePostToLedger = useCallback(async () => {
    if (transactions.length === 0) {
      toast.error('No transactions to post')
      return
    }
    setIsPostingLedger(true)
    try {
      await postTransactionsToLedger()
      toast.success('All transactions posted to General Ledger')
    } catch {
      toast.error('Failed to post to ledger')
    } finally {
      setIsPostingLedger(false)
    }
  }, [transactions, postTransactionsToLedger])

  const handlePostToCashbook = useCallback(async () => {
    if (transactions.length === 0) {
      toast.error('No transactions to post')
      return
    }
    setIsPostingCashbook(true)
    try {
      await postTransactionsToCashbook()
      toast.success('All transactions posted to Cashbook')
    } catch {
      toast.error('Failed to post to cashbook')
    } finally {
      setIsPostingCashbook(false)
    }
  }, [transactions, postTransactionsToCashbook])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await saveTransactions()
      toast.success('Transactions saved successfully')
    } catch {
      toast.error('Failed to save transactions')
    } finally {
      setIsSaving(false)
    }
  }, [saveTransactions])

  const handleClearAll = useCallback(() => {
    clearTransactions()
    setClearDialogOpen(false)
    toast.success('All transactions cleared')
  }, [clearTransactions])

  // ── Keyboard shortcuts ───────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N → Add new transaction
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        if (!formVisible) {
          setFormVisible(true)
          resetForm()
        }
      }
      // Ctrl+S → Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      // Ctrl+F or / → Focus search
      if (((e.ctrlKey || e.metaKey) && e.key === 'f') || (e.key === '/' && !formVisible)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
      // Escape → Close form or dialog
      if (e.key === 'Escape') {
        if (formVisible) setFormVisible(false)
        if (clearDialogOpen) setClearDialogOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formVisible, clearDialogOpen, handleSave, resetForm])

  // ── Class label helper ───────────────────────────────────────
  const getClassLabel = (val: string) =>
    CLASSIFICATION_OPTIONS.find((c) => c.value === val)?.label ?? val

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <TooltipProvider>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mx-auto w-full max-w-[1400px] space-y-6 p-4 md:p-6"
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Revenue &amp; Expenditure Capture
          </h1>
          <p className="text-sm text-muted-foreground">
            Step 2 &mdash; Record and classify all revenue and expenditure
            transactions for{' '}
            <span className="font-medium text-foreground">
              {entityConfig.name}
            </span>{' '}
            ({entityConfig.periodLabel}). IPSAS-compliant classification required for every
            entry.
          </p>
        </div>

        {/* ── Tab Toggle ──────────────────────────────────────── */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
          <Button
            variant={activeTab === 'revenue' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('revenue')}
            className={
              activeTab === 'revenue'
                ? 'gap-2 shadow-sm'
                : 'gap-2 text-muted-foreground hover:text-foreground'
            }
          >
            <ArrowUpCircle className="h-4 w-4" />
            Revenue
            <Badge
              variant="secondary"
              className={
                activeTab === 'revenue'
                  ? 'ml-1 bg-background/20 text-background'
                  : 'ml-1'
              }
            >
              {revenueItems.length}
            </Badge>
          </Button>
          <Button
            variant={activeTab === 'expenditure' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('expenditure')}
            className={
              activeTab === 'expenditure'
                ? 'gap-2 shadow-sm'
                : 'gap-2 text-muted-foreground hover:text-foreground'
            }
          >
            <ArrowDownCircle className="h-4 w-4" />
            Expenditure
            <Badge
              variant="secondary"
              className={
                activeTab === 'expenditure'
                  ? 'ml-1 bg-background/20 text-background'
                  : 'ml-1'
              }
            >
              {expenditureItems.length}
            </Badge>
          </Button>
        </div>

        {/* ── Summary Cards ───────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {/* Total Revenue */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Revenue
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-600">
                {entityConfig.currency} {formatNum(totalRevenueAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {revenueItems.length} {revenueItems.length === 1 ? 'entry' : 'entries'}
              </p>
            </CardContent>
          </Card>

          {/* Total Expenditure */}
          <Card className="border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Expenditure
              </p>
              <p className="mt-1 text-lg font-bold text-rose-600">
                {entityConfig.currency} {formatNum(totalExpenditureAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {expenditureItems.length}{' '}
                {expenditureItems.length === 1 ? 'entry' : 'entries'}
              </p>
            </CardContent>
          </Card>

          {/* Net Position */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Net Position
              </p>
              <p
                className={`mt-1 text-lg font-bold ${
                  netPosition >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}
              >
                {netPosition >= 0 ? '+' : '-'}{' '}
                {entityConfig.currency} {formatNum(netPosition)}
              </p>
              <p className="text-xs text-muted-foreground">
                {netPosition >= 0 ? 'Surplus' : 'Deficit'}
              </p>
            </CardContent>
          </Card>

          {/* Posted to Ledger */}
          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Posted to Ledger
              </p>
              <p className="mt-1 text-lg font-bold text-violet-600">
                {postedToLedgerCount}
              </p>
              <p className="text-xs text-muted-foreground">
                of {transactions.length} total
              </p>
            </CardContent>
          </Card>

          {/* Posted to Cashbook */}
          <Card className="col-span-2 border-l-4 border-l-amber-500 md:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Posted to Cashbook
              </p>
              <p className="mt-1 text-lg font-bold text-amber-600">
                {postedToCashbookCount}
              </p>
              <p className="text-xs text-muted-foreground">
                of {transactions.length} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Action Bar: Add + Bulk Actions ──────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={toggleForm} className="gap-2">
            {formVisible ? (
              <X className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {formVisible ? 'Cancel' : 'Add Transaction'}
          </Button>

          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />\n
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePostToLedger}
                disabled={isPostingLedger || transactions.length === 0}
                className="gap-2"
              >
                {isPostingLedger ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
                Post All to Ledger
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Post all transactions to the General Ledger</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePostToCashbook}
                disabled={isPostingCashbook || transactions.length === 0}
                className="gap-2"
              >
                {isPostingCashbook ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Post All to Cashbook
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Post all transactions to the Cashbook</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save transactions (Ctrl+S)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClearDialogOpen(true)}
                disabled={transactions.length === 0}
                className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove all transactions</p>
            </TooltipContent>
          </Tooltip>

          <div className="ml-auto hidden text-xs text-muted-foreground md:block">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl+N
            </kbd>{' '}
            New &nbsp;
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl+S
            </kbd>{' '}
            Save &nbsp;
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              /
            </kbd>{' '}
            Search
          </div>
        </div>

        {/* ── Inline Add Form (Collapsible) ───────────────────── */}
        {formVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-2 border-dashed border-primary/30 bg-primary/[0.02]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4 text-primary" />
                  New{' '}
                  {activeTab === 'revenue' ? 'Revenue' : 'Expenditure'}{' '}
                  Transaction
                </CardTitle>
                <CardDescription>
                  Fill in the details below. Fields marked * are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  ref={formRef}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                >
                  {/* Date */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txDate">
                      Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="txDate"
                      type="date"
                      value={formData.transactionDate}
                      onChange={(e) =>
                        handleFieldChange('transactionDate', e.target.value)
                      }
                    />
                  </div>

                  {/* Reference */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txRef">Reference</Label>
                    <Input
                      id="txRef"
                      placeholder="e.g. RV-001"
                      value={formData.reference}
                      onChange={(e) =>
                        handleFieldChange('reference', e.target.value)
                      }
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txDesc">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="txDesc"
                      placeholder="Transaction description"
                      value={formData.description}
                      onChange={(e) =>
                        handleFieldChange('description', e.target.value)
                      }
                    />
                  </div>

                  {/* Account Code */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txAcctCode">
                      Account Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="txAcctCode"
                      placeholder="e.g. 4101"
                      value={formData.accountCode}
                      onChange={(e) =>
                        handleFieldChange('accountCode', e.target.value)
                      }
                    />
                  </div>

                  {/* Account Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txAcctName">Account Name</Label>
                    <Input
                      id="txAcctName"
                      placeholder="Account name"
                      value={formData.accountName}
                      onChange={(e) =>
                        handleFieldChange('accountName', e.target.value)
                      }
                    />
                  </div>

                  {/* Classification */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txClass">
                      Classification <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.classification}
                      onValueChange={(val) =>
                        handleFieldChange('classification', val)
                      }
                    >
                      <SelectTrigger id="txClass">
                        <SelectValue placeholder="Select classification" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSIFICATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txCat">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) =>
                        handleFieldChange('category', val)
                      }
                    >
                      <SelectTrigger id="txCat">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Gross Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txGross">
                      Gross Amount <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="txGross"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) =>
                        handleFieldChange('amount', e.target.value)
                      }
                    />
                  </div>

                  {/* Tax Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txTax">Tax Amount</Label>
                    <Input
                      id="txTax"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.taxAmount}
                      onChange={(e) =>
                        handleFieldChange('taxAmount', e.target.value)
                      }
                    />
                  </div>

                  {/* Net Amount (auto) */}
                  <div className="space-y-1.5">
                    <Label>Net Amount</Label>
                    <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm font-medium">
                      {entityConfig.currency}{' '}
                      {formatNum(netAmount)}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Auto-calculated (Gross &minus; Tax)
                    </p>
                  </div>

                  {/* Payee / Payer */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txPayee">Payee / Payer</Label>
                    <Input
                      id="txPayee"
                      placeholder="Name of payee or payer"
                      value={formData.payeePayer}
                      onChange={(e) =>
                        handleFieldChange('payeePayer', e.target.value)
                      }
                    />
                  </div>

                  {/* Voucher No */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txVoucher">Voucher No</Label>
                    <Input
                      id="txVoucher"
                      placeholder="Voucher number"
                      value={formData.voucherNo}
                      onChange={(e) =>
                        handleFieldChange('voucherNo', e.target.value)
                      }
                    />
                  </div>

                  {/* Invoice No */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txInvoice">Invoice No</Label>
                    <Input
                      id="txInvoice"
                      placeholder="Invoice number"
                      value={formData.invoiceNo}
                      onChange={(e) =>
                        handleFieldChange('invoiceNo', e.target.value)
                      }
                    />
                  </div>

                  {/* Receipt No */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txReceipt">Receipt No</Label>
                    <Input
                      id="txReceipt"
                      placeholder="Receipt number"
                      value={formData.receiptNo}
                      onChange={(e) =>
                        handleFieldChange('receiptNo', e.target.value)
                      }
                    />
                  </div>

                  {/* Fund Source */}
                  <div className="space-y-1.5">
                    <Label htmlFor="txFund">Fund Source</Label>
                    <Input
                      id="txFund"
                      placeholder="e.g. Consolidated Fund"
                      value={formData.fundSource}
                      onChange={(e) =>
                        handleFieldChange('fundSource', e.target.value)
                      }
                    />
                  </div>

                  {/* Submit button spans to fill row */}
                  <div className="col-span-full flex justify-end gap-2 border-t pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        resetForm()
                      }}
                    >
                      Reset
                    </Button>
                    <Button onClick={handleSubmit} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add {activeTab === 'revenue' ? 'Revenue' : 'Expenditure'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Filter / Search Bar ─────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Search by reference, description, account, payee/payer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="shrink-0 gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {filteredTransactions.length}{' '}
            {filteredTransactions.length === 1 ? 'result' : 'results'}
          </Badge>
        </div>

        {/* ── Data Table ──────────────────────────────────────── */}
        <Card>
          <CardContent className="p-0">
            {filteredTransactions.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="rounded-full bg-muted p-4">
                  {activeTab === 'revenue' ? (
                    <ArrowUpCircle className="h-10 w-10 text-muted-foreground" />
                  ) : (
                    <ArrowDownCircle className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    No {activeTab} transactions yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {searchTerm
                      ? 'Try adjusting your search terms.'
                      : 'Click "Add Transaction" or press Ctrl+N to get started.'}
                  </p>
                </div>
                {!searchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormVisible(true)
                      resetForm()
                    }}
                    className="mt-1 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Transaction
                  </Button>
                )}
              </div>
            ) : (
              /* Scrollable table */
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Date
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Ref
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Description
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Account
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Classification
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Gross
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Net
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Payee/Payer
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Ledger
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Cashbook
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx, idx) => {
                      // Find actual index in the master array
                      const realIndex = transactions.indexOf(tx)
                      return (
                        <tr
                          key={tx._id ?? idx}
                          className={
                            idx % 2 === 0
                              ? 'border-b transition-colors hover:bg-muted/40'
                              : 'border-b bg-muted/20 transition-colors hover:bg-muted/40'
                          }
                        >
                          <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                            {tx.transactionDate}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 font-medium">
                            {tx.reference || '—'}
                          </td>
                          <td className="max-w-[220px] truncate px-4 py-2.5">
                            {tx.description}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <span className="font-mono text-xs">
                              {tx.accountCode}
                            </span>
                            {tx.accountName && (
                              <span className="ml-1.5 text-muted-foreground">
                                {tx.accountName}
                              </span>
                            )}
                          </td>
                          <td className="max-w-[180px] truncate px-4 py-2.5 text-xs text-muted-foreground">
                            {getClassLabel(tx.classification)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums font-medium">
                            {entityConfig.currency} {formatNum(tx.amount)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                            {entityConfig.currency} {formatNum(tx.netAmount)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                            {tx.payeePayer || '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-center">
                            {tx.postedToLedger ? (
                              <Badge
                                variant="default"
                                className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Posted
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="gap-1 text-muted-foreground"
                              >
                                <AlertCircle className="h-3 w-3" />
                                Unposted
                              </Badge>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-center">
                            {tx.postedToCashbook ? (
                              <Badge
                                variant="default"
                                className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Posted
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="gap-1 text-muted-foreground"
                              >
                                <AlertCircle className="h-3 w-3" />
                                Unposted
                              </Badge>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => handleDelete(realIndex)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete this transaction</TooltipContent>
                            </Tooltip>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Navigation ──────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => setWizardStep(1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Entity Setup
          </Button>
          <Button
            onClick={() => setWizardStep(3)}
            className="gap-2"
          >
            Continue to Cashbook
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* ── Clear Confirmation Dialog ───────────────────────── */}
        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Clear All Transactions
              </DialogTitle>
              <DialogDescription>
                This will permanently remove all {transactions.length} transaction(s) from
                the current session. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setClearDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAll}
                className="gap-2"
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