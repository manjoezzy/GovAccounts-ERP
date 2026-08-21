'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  TrendingDown,
  Vote,
  Clock,
  CheckCircle2,
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

interface ExpenditureEntry {
  id: string
  date: string
  expenditureType: string
  accountCode: string
  voteCode: string
  description: string
  amount: number
  supplier: string
  invoiceNumber: string
  paymentRef: string
  status: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  date: string
  expenditureType: string
  accountCode: string
  voteCode: string
  description: string
  amount: string
  supplier: string
  invoiceNumber: string
  paymentRef: string
  status: string
}

const EMPTY_FORM: FormState = {
  date: new Date().toISOString().split('T')[0],
  expenditureType: '',
  accountCode: '',
  voteCode: '',
  description: '',
  amount: '',
  supplier: '',
  invoiceNumber: '',
  paymentRef: '',
  status: 'recorded',
}

const EXPENDITURE_TYPE_OPTIONS = [
  { value: 'compensation', label: 'Compensation of Employees' },
  { value: 'goods-services', label: 'Goods & Services' },
  { value: 'depreciation', label: 'Depreciation' },
  { value: 'grants-transfers', label: 'Grants & Transfers' },
  { value: 'finance-costs', label: 'Finance Costs' },
  { value: 'other', label: 'Other Expenditure' },
] as const

const STATUS_OPTIONS = [
  { value: 'recorded', label: 'Recorded' },
  { value: 'verified', label: 'Verified' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
] as const

const TYPE_BADGE_MAP: Record<string, string> = {
  compensation: 'bg-rose-100 text-rose-800 border-rose-200',
  'goods-services': 'bg-amber-100 text-amber-800 border-amber-200',
  depreciation: 'bg-slate-100 text-slate-800 border-slate-200',
  'grants-transfers': 'bg-violet-100 text-violet-800 border-violet-200',
  'finance-costs': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  other: 'bg-orange-100 text-orange-800 border-orange-200',
}

const STATUS_BADGE_MAP: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  recorded: 'outline',
  verified: 'secondary',
  approved: 'default',
  paid: 'default',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ExpenditureCapture({ reportId }: ModuleProps) {
  // Data state
  const [entries, setEntries] = useState<ExpenditureEntry[]>([])
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

  const totalExpenditure = entries.reduce((sum, e) => sum + e.amount, 0)
  const byVote = entries.filter((e) => e.voteCode).length
  const pendingApproval = entries.filter(
    (e) => e.status === 'recorded' || e.status === 'verified'
  ).length
  const approvedCount = entries.filter(
    (e) => e.status === 'approved' || e.status === 'paid'
  ).length

  // ── Fetch entries ─────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=expenditure&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch expenditure entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load expenditure entries')
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

  const openEditDialog = (entry: ExpenditureEntry) => {
    setEditingId(entry.id)
    setForm({
      date: entry.date,
      expenditureType: entry.expenditureType,
      accountCode: entry.accountCode || '',
      voteCode: entry.voteCode || '',
      description: entry.description,
      amount: String(entry.amount),
      supplier: entry.supplier || '',
      invoiceNumber: entry.invoiceNumber || '',
      paymentRef: entry.paymentRef || '',
      status: entry.status,
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
    if (!form.date || !form.expenditureType || !form.description.trim()) {
      toast.error('Date, expenditure type, and description are required')
      return
    }

    const parsedAmount = parseFloat(form.amount)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('A valid positive amount is required')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        date: form.date,
        expenditureType: form.expenditureType,
        accountCode: form.accountCode.trim(),
        voteCode: form.voteCode.trim(),
        description: form.description.trim(),
        amount: parsedAmount,
        supplier: form.supplier.trim(),
        invoiceNumber: form.invoiceNumber.trim(),
        paymentRef: form.paymentRef.trim(),
        status: form.status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=expenditure&id=${editingId}`
        : `/api/modules?module=expenditure&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} expenditure entry`)

      toast.success(`Expenditure entry ${isEditing ? 'updated' : 'added'} successfully`)
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
      const res = await fetch(`/api/modules?module=expenditure&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete expenditure entry')

      toast.success('Expenditure entry deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete expenditure entry')
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
            Expenditure Capture
          </h2>
          <p className="text-sm text-muted-foreground">
            Record and manage all government expenditures and payments
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Record Expenditure
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenditure
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatNum(totalExpenditure)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              By Vote
            </CardTitle>
            <Vote className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {byVote}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {pendingApproval}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {approvedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-5 w-5" />
            Expenditure Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingDown className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No expenditure entries yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Record Expenditure&quot; to start recording government expenditures.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[150px]">Type</TableHead>
                    <TableHead className="w-[100px]">Account Code</TableHead>
                    <TableHead className="w-[100px]">Vote Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[120px]">Amount</TableHead>
                    <TableHead className="w-[130px]">Supplier</TableHead>
                    <TableHead className="w-[100px]">Invoice #</TableHead>
                    <TableHead className="w-[100px] text-center">Status</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                    >
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {entry.date}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={TYPE_BADGE_MAP[entry.expenditureType] || 'bg-slate-100 text-slate-800 border-slate-200'}
                          variant="outline"
                        >
                          {EXPENDITURE_TYPE_OPTIONS.find((o) => o.value === entry.expenditureType)?.label || entry.expenditureType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {entry.accountCode || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {entry.voteCode || '—'}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-red-600">
                        {formatNum(entry.amount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.supplier || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {entry.invoiceNumber || '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={STATUS_BADGE_MAP[entry.status] || 'outline'}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(entry)}
                            aria-label={`Edit entry ${entry.invoiceNumber || entry.description}`}
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label={`Delete entry ${entry.invoiceNumber || entry.description}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* ── Add / Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Expenditure Entry' : 'Record Expenditure'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row: Date + Expenditure Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-date">Date</Label>
                <Input
                  id="exp-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-type">Expenditure Type</Label>
                <Select
                  value={form.expenditureType}
                  onValueChange={(val) => updateField('expenditureType', val)}
                >
                  <SelectTrigger id="exp-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENDITURE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row: Account Code + Vote Code */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-account">Account Code</Label>
                <Input
                  id="exp-account"
                  placeholder="e.g. 5100"
                  value={form.accountCode}
                  onChange={(e) => updateField('accountCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-vote">Vote Code</Label>
                <Input
                  id="exp-vote"
                  placeholder="e.g. V-003"
                  value={form.voteCode}
                  onChange={(e) => updateField('voteCode', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="exp-desc">Description</Label>
              <Input
                id="exp-desc"
                placeholder="e.g. Office furniture procurement"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="exp-amount">Amount</Label>
              <Input
                id="exp-amount"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                className="border-red-200 focus-visible:ring-red-500"
              />
            </div>

            {/* Row: Supplier + Invoice Number */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-supplier">Supplier</Label>
                <Input
                  id="exp-supplier"
                  placeholder="e.g. ABC Suppliers Ltd"
                  value={form.supplier}
                  onChange={(e) => updateField('supplier', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-invoice">Invoice Number</Label>
                <Input
                  id="exp-invoice"
                  placeholder="e.g. INV-2025-001"
                  value={form.invoiceNumber}
                  onChange={(e) => updateField('invoiceNumber', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Payment Ref + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-payment-ref">Payment Reference</Label>
                <Input
                  id="exp-payment-ref"
                  placeholder="e.g. CHQ-001"
                  value={form.paymentRef}
                  onChange={(e) => updateField('paymentRef', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => updateField('status', val)}
                >
                  <SelectTrigger id="exp-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
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
                  : 'Record Expenditure'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Expenditure Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this expenditure entry? This action cannot
            be undone.
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
