'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
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

interface SuspenseEntry {
  id: string
  description: string
  debitAmount: number
  creditAmount: number
  balance: number
  date: string
  reason: string
  resolution: string
  resolutionDate: string
  status: string
  createdAt: string
  updatedAt: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  description: string
  debitAmount: string
  creditAmount: string
  date: string
  reason: string
  resolution: string
  resolutionDate: string
  status: string
}

const EMPTY_FORM: FormState = {
  description: '',
  debitAmount: '',
  creditAmount: '',
  date: new Date().toISOString().split('T')[0],
  reason: '',
  resolution: '',
  resolutionDate: '',
  status: 'open',
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'partial', label: 'Partial' },
  { value: 'resolved', label: 'Resolved' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function SuspenseAccounts({ reportId }: ModuleProps) {
  const [entries, setEntries] = useState<SuspenseEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Summary computation ───────────────────────────────────────────────────

  const openItems = entries.filter((e) => e.status === 'open' || e.status === 'partial')
  const totalOpenBalance = openItems.reduce((sum, e) => sum + Math.abs(e.balance), 0)
  const hasOpenItems = openItems.length > 0

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=suspense&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch suspense entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load suspense entries')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEditDialog = (entry: SuspenseEntry) => {
    setEditingId(entry.id)
    setForm({
      description: entry.description,
      debitAmount: String(entry.debitAmount),
      creditAmount: String(entry.creditAmount),
      date: entry.date,
      reason: entry.reason,
      resolution: entry.resolution,
      resolutionDate: entry.resolutionDate,
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

  // Auto-computed balance from form
  const formBalance = (parseFloat(form.creditAmount) || 0) - (parseFloat(form.debitAmount) || 0)

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      toast.error('Description is required')
      return
    }

    const debit = parseFloat(form.debitAmount) || 0
    const credit = parseFloat(form.creditAmount) || 0
    const balance = credit - debit

    if (debit === 0 && credit === 0) {
      toast.error('Either a debit or credit amount is required')
      return
    }

    if (debit < 0 || credit < 0) {
      toast.error('Amounts must be positive')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        description: form.description.trim(),
        debitAmount: debit,
        creditAmount: credit,
        balance,
        date: form.date,
        reason: form.reason.trim(),
        resolution: form.resolution.trim(),
        resolutionDate: form.resolutionDate,
        status: form.status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=suspense&id=${editingId}`
        : `/api/modules?module=suspense&reportId=${reportId}`

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
      const res = await fetch(`/api/modules?module=suspense&id=${deletingId}`, {
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

  // ── Status badge helper ───────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Open</Badge>
      case 'partial':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Partial</Badge>
      case 'resolved':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Resolved</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Suspense Accounts
            </h2>
            <p className="text-sm text-muted-foreground">
              Track unresolved transactions pending investigation
            </p>
          </div>
          {hasOpenItems && (
            <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {openItems.length} Open
            </Badge>
          )}
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Open Items
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {openItems.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Total Open Balance
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatNum(totalOpenBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-5 w-5" />
            Suspense Account Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldAlert className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No suspense entries yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Entry&quot; to record unresolved transactions.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[110px]">Debit</TableHead>
                    <TableHead className="text-right w-[110px]">Credit</TableHead>
                    <TableHead className="text-right w-[110px]">Balance</TableHead>
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead className="max-w-[160px]">Reason</TableHead>
                    <TableHead className="max-w-[160px]">Resolution</TableHead>
                    <TableHead className="w-[100px] text-center">Status</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => {
                    const isOpen = entry.status === 'open'
                    const isPartial = entry.status === 'partial'
                    return (
                      <TableRow
                        key={entry.id}
                        className={
                          isOpen
                            ? 'bg-red-50/80 hover:bg-red-50'
                            : isPartial
                              ? 'bg-orange-50/60 hover:bg-orange-50/60'
                              : index % 2 === 1
                                ? 'bg-slate-50/60'
                                : ''
                        }
                      >
                        <TableCell className="max-w-[180px] truncate font-medium">
                          {entry.description}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {entry.debitAmount > 0 ? (
                            <span className="text-red-600">{formatNum(entry.debitAmount)}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {entry.creditAmount > 0 ? (
                            <span className="text-emerald-600">{formatNum(entry.creditAmount)}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          <span
                            className={
                              entry.balance !== 0
                                ? entry.balance > 0
                                  ? 'text-emerald-600'
                                  : 'text-red-600'
                                : 'text-slate-400'
                            }
                          >
                            {entry.balance < 0 ? '(' : ''}
                            {formatNum(entry.balance)}
                            {entry.balance < 0 ? ')' : ''}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {entry.date || '—'}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">
                          {entry.reason || '—'}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">
                          {entry.resolution || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          {statusBadge(entry.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(entry)}
                              aria-label={`Edit entry ${entry.description}`}
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(entry.id)}
                              aria-label={`Delete entry ${entry.description}`}
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
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Suspense Entry' : 'Add Suspense Entry'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="sp-desc">Description</Label>
              <Input
                id="sp-desc"
                placeholder="Describe the unresolved transaction"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            {/* Row: Debit + Credit */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sp-debit" className="text-red-700">Debit Amount</Label>
                <Input
                  id="sp-debit"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.debitAmount}
                  onChange={(e) => updateField('debitAmount', e.target.value)}
                  className="border-red-200 focus-visible:ring-red-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp-credit" className="text-emerald-700">Credit Amount</Label>
                <Input
                  id="sp-credit"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.creditAmount}
                  onChange={(e) => updateField('creditAmount', e.target.value)}
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {/* Auto-computed balance display */}
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Computed Balance: </span>
              <span className={`font-mono font-bold ${formBalance !== 0 ? (formBalance > 0 ? 'text-emerald-600' : 'text-red-600') : 'text-slate-500'}`}>
                {formBalance < 0 ? '(' : ''}{formatNum(formBalance)}{formBalance < 0 ? ')' : ''}
              </span>
            </div>

            {/* Row: Date + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sp-date">Date</Label>
                <Input
                  id="sp-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => updateField('status', val)}
                >
                  <SelectTrigger id="sp-status">
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

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="sp-reason">Reason for Suspense</Label>
              <Input
                id="sp-reason"
                placeholder="Why is this item in suspense?"
                value={form.reason}
                onChange={(e) => updateField('reason', e.target.value)}
              />
            </div>

            {/* Resolution + Resolution Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sp-resolution">Resolution</Label>
                <Input
                  id="sp-resolution"
                  placeholder="How was it resolved?"
                  value={form.resolution}
                  onChange={(e) => updateField('resolution', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp-res-date">Resolution Date</Label>
                <Input
                  id="sp-res-date"
                  type="date"
                  value={form.resolutionDate}
                  onChange={(e) => updateField('resolutionDate', e.target.value)}
                />
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
              Delete Suspense Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this suspense entry? This action cannot be undone.
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
