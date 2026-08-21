'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  Receipt,
  DollarSign,
  Hash,
  Filter,
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

interface RevenueEntry {
  id: string
  date: string
  revenueType: string
  accountCode: string
  description: string
  amount: number
  taxComponent: number
  netAmount: number
  collectedBy: string
  receiptNumber: string
  status: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  date: string
  revenueType: string
  accountCode: string
  description: string
  amount: string
  taxComponent: string
  collectedBy: string
  receiptNumber: string
  status: string
}

const EMPTY_FORM: FormState = {
  date: new Date().toISOString().split('T')[0],
  revenueType: '',
  accountCode: '',
  description: '',
  amount: '',
  taxComponent: '',
  collectedBy: '',
  receiptNumber: '',
  status: 'recorded',
}

const REVENUE_TYPE_OPTIONS = [
  { value: 'tax', label: 'Tax Revenue' },
  { value: 'non-tax-exchange', label: 'Non-Tax (Exchange)' },
  { value: 'non-tax-non-exchange', label: 'Non-Tax (Non-Exchange)' },
  { value: 'grants', label: 'Grants' },
  { value: 'fees', label: 'Fees & Charges' },
  { value: 'fines', label: 'Fines & Penalties' },
  { value: 'other', label: 'Other Revenue' },
] as const

const STATUS_OPTIONS = [
  { value: 'recorded', label: 'Recorded' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'reversed', label: 'Reversed' },
] as const

const TYPE_BADGE_MAP: Record<string, string> = {
  tax: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'non-tax-exchange': 'bg-sky-100 text-sky-800 border-sky-200',
  'non-tax-non-exchange': 'bg-amber-100 text-amber-800 border-amber-200',
  grants: 'bg-violet-100 text-violet-800 border-violet-200',
  fees: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  fines: 'bg-rose-100 text-rose-800 border-rose-200',
  other: 'bg-slate-100 text-slate-800 border-slate-200',
}

const STATUS_BADGE_MAP: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  recorded: 'outline',
  confirmed: 'default',
  reversed: 'destructive',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RevenueCapture({ reportId }: ModuleProps) {
  // Data state
  const [entries, setEntries] = useState<RevenueEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Computed net amount ─────────────────────────────────────────────────

  const computedNet = ((): number => {
    const amt = parseFloat(form.amount) || 0
    const tax = parseFloat(form.taxComponent) || 0
    return amt - tax
  })()

  // ── Summary computation ─────────────────────────────────────────────────

  const totalRevenue = entries.reduce((sum, e) => sum + e.amount, 0)
  const totalTax = entries.reduce((sum, e) => sum + e.taxComponent, 0)
  const totalNet = entries.reduce((sum, e) => sum + e.netAmount, 0)
  const transactionCount = entries.length

  // ── Filtered entries ───────────────────────────────────────────────────

  const filteredEntries = entries.filter((e) => {
    if (filterType !== 'all' && e.revenueType !== filterType) return false
    if (filterStatus !== 'all' && e.status !== filterStatus) return false
    return true
  })

  // ── Fetch entries ─────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=revenue&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch revenue entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load revenue entries')
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

  const openEditDialog = (entry: RevenueEntry) => {
    setEditingId(entry.id)
    setForm({
      date: entry.date,
      revenueType: entry.revenueType,
      accountCode: entry.accountCode || '',
      description: entry.description,
      amount: String(entry.amount),
      taxComponent: String(entry.taxComponent),
      collectedBy: entry.collectedBy || '',
      receiptNumber: entry.receiptNumber || '',
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
    if (!form.date || !form.revenueType || !form.description.trim()) {
      toast.error('Date, revenue type, and description are required')
      return
    }

    const parsedAmount = parseFloat(form.amount)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('A valid positive amount is required')
      return
    }

    const parsedTax = parseFloat(form.taxComponent) || 0
    if (parsedTax < 0) {
      toast.error('Tax component cannot be negative')
      return
    }
    if (parsedTax > parsedAmount) {
      toast.error('Tax component cannot exceed the total amount')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        date: form.date,
        revenueType: form.revenueType,
        accountCode: form.accountCode.trim(),
        description: form.description.trim(),
        amount: parsedAmount,
        taxComponent: parsedTax,
        netAmount: parsedAmount - parsedTax,
        collectedBy: form.collectedBy.trim(),
        receiptNumber: form.receiptNumber.trim(),
        status: form.status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=revenue&id=${editingId}`
        : `/api/modules?module=revenue&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} revenue entry`)

      toast.success(`Revenue entry ${isEditing ? 'updated' : 'added'} successfully`)
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
      const res = await fetch(`/api/modules?module=revenue&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete revenue entry')

      toast.success('Revenue entry deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete revenue entry')
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
            Revenue Capture
          </h2>
          <p className="text-sm text-muted-foreground">
            Record and manage all government revenue collections
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Record Revenue
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tax Component
            </CardTitle>
            <Receipt className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatNum(totalTax)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalNet)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
            <Hash className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {transactionCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              Revenue Entries
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 w-[170px] text-xs">
                  <SelectValue placeholder="Revenue Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {REVENUE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                {entries.length === 0
                  ? 'No revenue entries yet'
                  : 'No entries match the selected filters'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {entries.length === 0
                  ? 'Click "Record Revenue" to start recording revenue collections.'
                  : 'Try adjusting the filter criteria above.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[140px]">Type</TableHead>
                    <TableHead className="w-[100px]">Account Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[110px]">Amount</TableHead>
                    <TableHead className="text-right w-[100px]">Tax</TableHead>
                    <TableHead className="text-right w-[110px]">Net Amount</TableHead>
                    <TableHead className="w-[120px]">Collected By</TableHead>
                    <TableHead className="w-[100px]">Receipt #</TableHead>
                    <TableHead className="w-[100px] text-center">Status</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                    >
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {entry.date}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={TYPE_BADGE_MAP[entry.revenueType] || 'bg-slate-100 text-slate-800 border-slate-200'}
                          variant="outline"
                        >
                          {REVENUE_TYPE_OPTIONS.find((o) => o.value === entry.revenueType)?.label || entry.revenueType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {entry.accountCode || '—'}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {formatNum(entry.amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-amber-600">
                        {entry.taxComponent > 0 ? formatNum(entry.taxComponent) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-emerald-700">
                        {formatNum(entry.netAmount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.collectedBy || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {entry.receiptNumber || '—'}
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
                            aria-label={`Edit entry ${entry.receiptNumber || entry.description}`}
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label={`Delete entry ${entry.receiptNumber || entry.description}`}
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
              {editingId ? 'Edit Revenue Entry' : 'Record Revenue'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row: Date + Revenue Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rev-date">Date</Label>
                <Input
                  id="rev-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rev-type">Revenue Type</Label>
                <Select
                  value={form.revenueType}
                  onValueChange={(val) => updateField('revenueType', val)}
                >
                  <SelectTrigger id="rev-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVENUE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row: Account Code + Receipt Number */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rev-account">Account Code</Label>
                <Input
                  id="rev-account"
                  placeholder="e.g. 4100"
                  value={form.accountCode}
                  onChange={(e) => updateField('accountCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rev-receipt">Receipt Number</Label>
                <Input
                  id="rev-receipt"
                  placeholder="e.g. RCT-001"
                  value={form.receiptNumber}
                  onChange={(e) => updateField('receiptNumber', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="rev-desc">Description</Label>
              <Input
                id="rev-desc"
                placeholder="e.g. Property tax payment - Q1 2025"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            {/* Row: Amount + Tax Component */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rev-amount">Amount</Label>
                <Input
                  id="rev-amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rev-tax">Tax Component</Label>
                <Input
                  id="rev-tax"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.taxComponent}
                  onChange={(e) => updateField('taxComponent', e.target.value)}
                />
              </div>
            </div>

            {/* Auto-computed Net Amount */}
            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Net Amount (auto-computed)
                </span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatNum(computedNet)}
                </span>
              </div>
            </div>

            {/* Row: Collected By + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rev-collector">Collected By</Label>
                <Input
                  id="rev-collector"
                  placeholder="e.g. J. Mwangi"
                  value={form.collectedBy}
                  onChange={(e) => updateField('collectedBy', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rev-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => updateField('status', val)}
                >
                  <SelectTrigger id="rev-status">
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
                  : 'Record Revenue'}
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
              Delete Revenue Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this revenue entry? This action cannot be
            undone.
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
