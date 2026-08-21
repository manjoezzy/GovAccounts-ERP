'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  AlertTriangle,
  CalendarDays,
  PencilLine,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── Types ────────────────────────────────────────────────────────────────────

interface CashbookEntry {
  id: string
  date: string
  description: string
  reference: string
  receipt: number
  payment: number
  balance: number
  accountCode: string
  bankAccount: string
}

interface OpeningBalance {
  id: string
  reportId: string
  bankAccount: string
  amount: number
  asOfDate: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  date: string
  description: string
  reference: string
  receipt: string
  payment: string
  accountCode: string
  bankAccount: string
}

const EMPTY_FORM: FormState = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  reference: '',
  receipt: '',
  payment: '',
  accountCode: '',
  bankAccount: 'main',
}

const BANK_ACCOUNT_OPTIONS = [
  { value: 'main', label: 'Main Account' },
  { value: 'secondary', label: 'Secondary Account' },
  { value: 'petty', label: 'Petty Cash' },
] as const

type BankAccountKey = (typeof BANK_ACCOUNT_OPTIONS)[number]['value']

// ── Component ────────────────────────────────────────────────────────────────

export default function Cashbook({ reportId }: ModuleProps) {
  // Data state
  const [entries, setEntries] = useState<CashbookEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Opening balances state
  const [openingBalances, setOpeningBalances] = useState<Record<string, OpeningBalance>>({})
  const [openingDialogOpen, setOpeningDialogOpen] = useState(false)
  const [openingForm, setOpeningForm] = useState<Record<string, string>>({})
  const [savingOpening, setSavingOpening] = useState(false)

  // Active bank account filter
  const [activeBank, setActiveBank] = useState<string>('all')

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Fetch entries ─────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=cashbook&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch cashbook entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load cashbook entries')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  // ── Fetch opening balances ────────────────────────────────────────────────

  const fetchOpeningBalances = useCallback(async () => {
    try {
      const res = await fetch(`/api/modules?module=cashbook-opening&reportId=${reportId}`)
      if (!res.ok) return
      const data = await res.json()
      const map: Record<string, OpeningBalance> = {}
      for (const ob of Array.isArray(data) ? data : []) {
        map[ob.bankAccount] = ob
      }
      setOpeningBalances(map)
    } catch (err) {
      console.error(err)
    }
  }, [reportId])

  useEffect(() => {
    fetchEntries()
    fetchOpeningBalances()
  }, [fetchEntries, fetchOpeningBalances])

  // ── Computed: filtered entries + running balances with opening ─────────────

  const filteredEntries = activeBank === 'all'
    ? entries
    : entries.filter((e) => e.bankAccount === activeBank)

  // Build a map of bankAccount → opening balance amount
  const getOpening = (bankAccount: string): number => {
    return openingBalances[bankAccount]?.amount ?? 0
  }

  // Compute running balance for each entry, incorporating opening balance.
  // When filter is 'all', each bank account track gets its own opening balance.
  // We pre-compute running totals per bank account then assign.
  const entriesWithBalance = (() => {
    if (activeBank !== 'all') {
      // Single bank: simple running total from opening
      const ob = getOpening(activeBank)
      let running = ob
      return filteredEntries.map((e) => {
        running += e.receipt - e.payment
        return { ...e, computedBalance: running }
      })
    }
    // All banks: track running per bank account
    const runningMap: Record<string, number> = {}
    for (const opt of BANK_ACCOUNT_OPTIONS) {
      runningMap[opt.value] = getOpening(opt.value)
    }
    return filteredEntries.map((e) => {
      const prev = runningMap[e.bankAccount] ?? 0
      const next = prev + e.receipt - e.payment
      runningMap[e.bankAccount] = next
      return { ...e, computedBalance: next }
    })
  })()

  // ── Summary computation ───────────────────────────────────────────────────

  const totalReceipts = filteredEntries.reduce((sum, e) => sum + e.receipt, 0)
  const totalPayments = filteredEntries.reduce((sum, e) => sum + e.payment, 0)

  // Closing balance = opening + receipts - payments
  const totalOpening = (() => {
    if (activeBank !== 'all') return getOpening(activeBank)
    let total = 0
    for (const opt of BANK_ACCOUNT_OPTIONS) total += getOpening(opt.value)
    return total
  })()
  const closingBalance = totalOpening + totalReceipts - totalPayments

  // ── Opening balance dialog helpers ────────────────────────────────────────

  const openOpeningDialog = () => {
    const initial: Record<string, string> = {}
    for (const opt of BANK_ACCOUNT_OPTIONS) {
      const existing = openingBalances[opt.value]
      initial[`${opt.value}-amount`] = existing ? String(existing.amount) : ''
      initial[`${opt.value}-date`] = existing?.asOfDate || ''
    }
    setOpeningForm(initial)
    setOpeningDialogOpen(true)
  }

  const saveOpeningBalances = async () => {
    try {
      setSavingOpening(true)
      for (const opt of BANK_ACCOUNT_OPTIONS) {
        const amount = parseFloat(openingForm[`${opt.value}-amount`]) || 0
        const asOfDate = openingForm[`${opt.value}-date`] || ''
        const existing = openingBalances[opt.value]

        if (existing) {
          // Update
          await fetch(`/api/modules?module=cashbook-opening&id=${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, asOfDate }),
          })
        } else if (amount !== 0) {
          // Create
          await fetch(`/api/modules?module=cashbook-opening&reportId=${reportId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reportId,
              bankAccount: opt.value,
              amount,
              asOfDate,
            }),
          })
        }
      }
      toast.success('Opening balances saved')
      setOpeningDialogOpen(false)
      fetchOpeningBalances()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save opening balances')
    } finally {
      setSavingOpening(false)
    }
  }

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, bankAccount: activeBank !== 'all' ? activeBank : 'main' })
    setFormOpen(true)
  }

  const openEditDialog = (entry: CashbookEntry) => {
    setEditingId(entry.id)
    setForm({
      date: entry.date,
      description: entry.description,
      reference: entry.reference,
      receipt: String(entry.receipt),
      payment: String(entry.payment),
      accountCode: entry.accountCode || '',
      bankAccount: entry.bankAccount || 'main',
    })
    setFormOpen(true)
  }

  const openDeleteDialog = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // ── Submit (Add / Edit) ──────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.date || !form.description.trim()) {
      toast.error('Date and description are required')
      return
    }

    const parsedReceipt = parseFloat(form.receipt) || 0
    const parsedPayment = parseFloat(form.payment) || 0

    if (parsedReceipt === 0 && parsedPayment === 0) {
      toast.error('Either a receipt or payment amount is required')
      return
    }

    if (parsedReceipt < 0 || parsedPayment < 0) {
      toast.error('Receipt and payment amounts must be positive')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        date: form.date,
        description: form.description.trim(),
        reference: form.reference.trim(),
        receipt: parsedReceipt,
        payment: parsedPayment,
        accountCode: form.accountCode.trim(),
        bankAccount: form.bankAccount,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=cashbook&id=${editingId}`
        : `/api/modules?module=cashbook&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} entry`)

      toast.success(`Entry ${isEditing ? 'updated' : 'added'} successfully`)
      setFormOpen(false)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/modules?module=cashbook&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete entry')

      toast.success('Entry deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete entry')
    } finally {
      setDeleting(false)
    }
  }

  // ── Bank account badge variant helper ─────────────────────────────────────

  const bankBadgeVariant = (account: string) => {
    switch (account) {
      case 'main':
        return 'default' as const
      case 'secondary':
        return 'secondary' as const
      case 'petty':
        return 'outline' as const
      default:
        return 'secondary' as const
    }
  }

  // ── Check if any opening balance is set ───────────────────────────────────

  const hasAnyOpening = Object.values(openingBalances).some((ob) => ob.amount !== 0)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Cashbook
          </h2>
          <p className="text-sm text-muted-foreground">
            Daily cash receipts and payments with running balance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openOpeningDialog}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Opening Balances
          </Button>
          <Button onClick={openAddDialog} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* ── Bank Account Filter Tabs ──────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          variant={activeBank === 'all' ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setActiveBank('all')}
        >
          All Accounts
        </Button>
        {BANK_ACCOUNT_OPTIONS.map((opt) => {
          const ob = openingBalances[opt.value]
          const obAmt = ob?.amount ?? 0
          return (
            <Button
              key={opt.value}
              variant={activeBank === opt.value ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setActiveBank(opt.value)}
            >
              {opt.label}
              {obAmt !== 0 && (
                <span className="text-[10px] opacity-70">
                  OB: {formatNum(obAmt)}
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opening Balance
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatNum(totalOpening)}
            </p>
            {hasAnyOpening && (
              <p className="text-[11px] text-muted-foreground mt-1">
                As at {Object.values(openingBalances).find((o) => o.asOfDate)?.asOfDate || 'N/A'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Receipts
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(totalReceipts)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payments
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatNum(totalPayments)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Closing Balance
            </CardTitle>
            {closingBalance < 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Wallet className="h-4 w-4 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                closingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {closingBalance < 0 ? '(' : ''}
              {formatNum(closingBalance)}
              {closingBalance < 0 ? ')' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5" />
            Cashbook Entries
            {hasAnyOpening && (
              <Badge variant="secondary" className="ml-auto text-xs font-normal">
                Opening balances applied
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                No cashbook entries yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {hasAnyOpening
                  ? 'Opening balance(s) set. Click "Add Entry" to start recording transactions.'
                  : 'Set opening balances first, then click "Add Entry" to record transactions.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-muted hover:bg-muted">
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Reference</TableHead>
                    <TableHead className="text-right w-[110px]">Receipt</TableHead>
                    <TableHead className="text-right w-[110px]">Payment</TableHead>
                    <TableHead className="text-right w-[120px]">Balance</TableHead>
                    <TableHead className="w-[120px] text-center">Bank Account</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Opening balance row (shown for single-bank filter or when first entry per bank appears) */}
                  {activeBank !== 'all' && getOpening(activeBank) !== 0 && (
                    <TableRow className="bg-blue-50/50 dark:bg-blue-950/20 font-medium">
                      <TableCell className="font-mono text-sm">
                        {openingBalances[activeBank]?.asOfDate || ''}
                      </TableCell>
                      <TableCell className="italic text-muted-foreground">
                        Opening Balance (b/f)
                      </TableCell>
                      <TableCell>—</TableCell>
                      <TableCell className="text-right font-mono text-sm">—</TableCell>
                      <TableCell className="text-right font-mono text-sm">—</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-blue-600">
                        {formatNum(getOpening(activeBank))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={bankBadgeVariant(activeBank)}>
                          {BANK_ACCOUNT_OPTIONS.find((o) => o.value === activeBank)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                  {entriesWithBalance.map((entry, index) => {
                    const bal = entry.computedBalance ?? entry.balance
                    const isNeg = bal < 0
                    return (
                      <TableRow
                        key={entry.id}
                        className={index % 2 === 1 ? 'bg-muted/30' : ''}
                      >
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {entry.date}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {entry.description}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {entry.reference || '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {entry.receipt > 0 ? (
                            <span className="text-emerald-600">
                              {formatNum(entry.receipt)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {entry.payment > 0 ? (
                            <span className="text-red-600">
                              {formatNum(entry.payment)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          <span className={isNeg ? 'text-red-600' : ''}>
                            {isNeg ? '(' : ''}
                            {formatNum(bal)}
                            {isNeg ? ')' : ''}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={bankBadgeVariant(entry.bankAccount)}>
                            {BANK_ACCOUNT_OPTIONS.find(
                              (o) => o.value === entry.bankAccount
                            )?.label || entry.bankAccount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(entry)}
                              aria-label={`Edit entry ${entry.reference || entry.description}`}
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(entry.id)}
                              aria-label={`Delete entry ${entry.reference || entry.description}`}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {/* Totals row */}
                  <TableRow className="border-t-2 border-border font-semibold bg-muted/50">
                    <TableCell colSpan={3} className="text-sm">
                      Totals
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600">
                      {formatNum(totalReceipts)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">
                      {formatNum(totalPayments)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      <span className={closingBalance < 0 ? 'text-red-600' : ''}>
                        {closingBalance < 0 ? '(' : ''}
                        {formatNum(closingBalance)}
                        {closingBalance < 0 ? ')' : ''}
                      </span>
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* ── Opening Balances Dialog ───────────────────────────────────── */}
      <Dialog open={openingDialogOpen} onOpenChange={setOpeningDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilLine className="h-5 w-5" />
              Set Opening Balances
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-5">
            <p className="text-sm text-muted-foreground">
              Enter the opening (brought forward) balance for each bank account as at the start of the period. These balances are used to compute the running balance in the cashbook.
            </p>

            {BANK_ACCOUNT_OPTIONS.map((opt) => {
              const amtKey = `${opt.value}-amount`
              const dateKey = `${opt.value}-date`
              const existing = openingBalances[opt.value]
              const currentAmt = existing?.amount ?? 0

              return (
                <div key={opt.value} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{opt.label}</Label>
                    {currentAmt !== 0 && (
                      <span className="text-xs text-muted-foreground">
                        Current: {formatNum(currentAmt)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Balance Amount</Label>
                      <Input
                        type="number"
                        step="1"
                        placeholder="0"
                        value={openingForm[amtKey] || ''}
                        onChange={(e) =>
                          setOpeningForm((prev) => ({ ...prev, [amtKey]: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">As at Date</Label>
                      <Input
                        type="date"
                        value={openingForm[dateKey] || ''}
                        onChange={(e) =>
                          setOpeningForm((prev) => ({ ...prev, [dateKey]: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpeningDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveOpeningBalances} disabled={savingOpening}>
              {savingOpening ? 'Saving...' : 'Save Opening Balances'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Cashbook Entry' : 'Add Cashbook Entry'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row: Date + Reference */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cb-date">Date</Label>
                <Input
                  id="cb-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cb-reference">Reference</Label>
                <Input
                  id="cb-reference"
                  placeholder="e.g. CHQ-001"
                  value={form.reference}
                  onChange={(e) => updateField('reference', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="cb-description">Description</Label>
              <Input
                id="cb-description"
                placeholder="e.g. Office supplies payment"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            {/* Row: Receipt + Payment */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cb-receipt" className="text-emerald-700 dark:text-emerald-400">
                  Receipt Amount
                </Label>
                <Input
                  id="cb-receipt"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.receipt}
                  onChange={(e) => updateField('receipt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cb-payment" className="text-red-700 dark:text-red-400">
                  Payment Amount
                </Label>
                <Input
                  id="cb-payment"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.payment}
                  onChange={(e) => updateField('payment', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Account Code + Bank Account */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cb-account-code">Account Code</Label>
                <Input
                  id="cb-account-code"
                  placeholder="e.g. 1100"
                  value={form.accountCode}
                  onChange={(e) => updateField('accountCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cb-bank-account">Bank Account</Label>
                <Select
                  value={form.bankAccount}
                  onValueChange={(val) => updateField('bankAccount', val)}
                >
                  <SelectTrigger id="cb-bank-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_ACCOUNT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? 'Saving...'
                : editingId
                  ? 'Update Entry'
                  : 'Add Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this cashbook entry? The running
            balance will be recalculated automatically.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}