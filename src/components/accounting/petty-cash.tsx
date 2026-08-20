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
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface PettyCashEntry {
  id: string
  date: string
  description: string
  voucherNo: string
  receipt: number
  payment: number
  balance: number
  category: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  date: string
  description: string
  voucherNo: string
  receipt: string
  payment: string
  category: string
}

const EMPTY_FORM: FormState = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  voucherNo: '',
  receipt: '',
  payment: '',
  category: '',
}

const CATEGORY_OPTIONS = [
  { value: 'office-supplies', label: 'Office Supplies' },
  { value: 'postage', label: 'Postage' },
  { value: 'transport', label: 'Transport' },
  { value: 'refreshments', label: 'Refreshments' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function PettyCash({ reportId }: ModuleProps) {
  // Data state
  const [entries, setEntries] = useState<PettyCashEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Summary computation ─────────────────────────────────────────────────

  const totalReceipts = entries.reduce((sum, e) => sum + e.receipt, 0)
  const totalPayments = entries.reduce((sum, e) => sum + e.payment, 0)
  const currentBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0

  // ── Fetch entries ─────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=petty-cash&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch petty cash entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load petty cash entries')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // ── Form helpers ──────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEditDialog = (entry: PettyCashEntry) => {
    setEditingId(entry.id)
    setForm({
      date: entry.date,
      description: entry.description,
      voucherNo: entry.voucherNo || '',
      receipt: String(entry.receipt),
      payment: String(entry.payment),
      category: entry.category || '',
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

  // ── Submit (Add / Edit) ──────────────────────────────────────────────

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

    if (parsedReceipt > 0 && parsedPayment > 0) {
      toast.error('An entry must be either a receipt OR a payment, not both')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        date: form.date,
        description: form.description.trim(),
        voucherNo: form.voucherNo.trim(),
        receipt: parsedReceipt,
        payment: parsedPayment,
        category: form.category,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=petty-cash&id=${editingId}`
        : `/api/modules?module=petty-cash&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} petty cash entry`)

      toast.success(`Petty cash entry ${isEditing ? 'updated' : 'added'} successfully`)
      setFormOpen(false)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/modules?module=petty-cash&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete petty cash entry')

      toast.success('Petty cash entry deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete petty cash entry')
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Petty Cash Book
          </h2>
          <p className="text-sm text-muted-foreground">
            Track petty cash receipts, payments, and running balance
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              Current Balance
            </CardTitle>
            {currentBalance < 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Wallet className="h-4 w-4 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {currentBalance < 0 ? '(' : ''}
              {formatNum(currentBalance)}
              {currentBalance < 0 ? ')' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5" />
            Petty Cash Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No petty cash transactions yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Transaction&quot; to start recording petty cash movements.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Voucher #</TableHead>
                    <TableHead className="text-right w-[110px]">Receipt</TableHead>
                    <TableHead className="text-right w-[110px]">Payment</TableHead>
                    <TableHead className="text-right w-[120px]">Balance</TableHead>
                    <TableHead className="w-[130px]">Category</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => {
                    const isNeg = entry.balance < 0
                    return (
                      <TableRow
                        key={entry.id}
                        className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                      >
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {entry.date}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {entry.description}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {entry.voucherNo || '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {entry.receipt > 0 ? (
                            <span className="text-emerald-600">
                              {formatNum(entry.receipt)}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {entry.payment > 0 ? (
                            <span className="text-red-600">
                              {formatNum(entry.payment)}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          <span className={isNeg ? 'text-red-600' : 'text-slate-900'}>
                            {isNeg ? '(' : ''}
                            {formatNum(entry.balance)}
                            {isNeg ? ')' : ''}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {CATEGORY_OPTIONS.find((o) => o.value === entry.category)?.label || entry.category || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(entry)}
                              aria-label={`Edit transaction ${entry.voucherNo || entry.description}`}
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(entry.id)}
                              aria-label={`Delete transaction ${entry.voucherNo || entry.description}`}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* ── Add / Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Petty Cash Transaction' : 'Add Petty Cash Transaction'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row: Date + Voucher No */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pc-date">Date</Label>
                <Input
                  id="pc-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pc-voucher">Voucher Number</Label>
                <Input
                  id="pc-voucher"
                  placeholder="e.g. PC-001"
                  value={form.voucherNo}
                  onChange={(e) => updateField('voucherNo', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="pc-desc">Description</Label>
              <Input
                id="pc-desc"
                placeholder="e.g. Photocopy paper purchase"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            {/* Row: Receipt + Payment */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pc-receipt" className="text-emerald-700">
                  Receipt Amount
                </Label>
                <Input
                  id="pc-receipt"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.receipt}
                  onChange={(e) => updateField('receipt', e.target.value)}
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pc-payment" className="text-red-700">
                  Payment Amount
                </Label>
                <Input
                  id="pc-payment"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.payment}
                  onChange={(e) => updateField('payment', e.target.value)}
                  className="border-red-200 focus-visible:ring-red-500"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="pc-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(val) => updateField('category', val)}
              >
                <SelectTrigger id="pc-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  ? 'Update Transaction'
                  : 'Add Transaction'}
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
              Delete Transaction
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this petty cash transaction? The running
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
