'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  FileCheck2,
  Wallet,
  TrendingUp,
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
import { Progress } from '@/components/ui/progress'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── Types ────────────────────────────────────────────────────────────────────

interface CommitmentEntry {
  id: string
  poNumber: string
  voteCode: string
  supplier: string
  description: string
  commitDate: string
  committedAmount: number
  expendedAmount: number
  balance: number
  status: string
  createdAt: string
  updatedAt: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  poNumber: string
  voteCode: string
  supplier: string
  description: string
  commitDate: string
  committedAmount: string
  expendedAmount: string
  status: string
}

const EMPTY_FORM: FormState = {
  poNumber: '',
  voteCode: '',
  supplier: '',
  description: '',
  commitDate: new Date().toISOString().split('T')[0],
  committedAmount: '',
  expendedAmount: '',
  status: 'open',
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'partial', label: 'Partial' },
  { value: 'fully-expended', label: 'Fully Expended' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function CommitmentRegister({ reportId }: ModuleProps) {
  const [entries, setEntries] = useState<CommitmentEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Summary computation ───────────────────────────────────────────────────

  const totalCommitted = entries.reduce((sum, e) => sum + e.committedAmount, 0)
  const totalExpended = entries.reduce((sum, e) => sum + e.expendedAmount, 0)
  const unexpendedCommitments = entries.reduce((sum, e) => sum + e.balance, 0)

  // Auto-computed balance from form
  const committed = parseFloat(form.committedAmount) || 0
  const expended = parseFloat(form.expendedAmount) || 0
  const formBalance = committed - expended

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=commitment&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch commitment entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load commitment entries')
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

  const openEditDialog = (entry: CommitmentEntry) => {
    setEditingId(entry.id)
    setForm({
      poNumber: entry.poNumber,
      voteCode: entry.voteCode,
      supplier: entry.supplier,
      description: entry.description,
      commitDate: entry.commitDate,
      committedAmount: String(entry.committedAmount),
      expendedAmount: String(entry.expendedAmount),
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

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.poNumber.trim()) {
      toast.error('PO number is required')
      return
    }

    const parsedCommitted = parseFloat(form.committedAmount)
    if (!parsedCommitted || parsedCommitted <= 0) {
      toast.error('A valid positive committed amount is required')
      return
    }

    const parsedExpended = parseFloat(form.expendedAmount) || 0
    const balance = parsedCommitted - parsedExpended

    if (parsedExpended < 0) {
      toast.error('Expended amount must be non-negative')
      return
    }

    if (parsedExpended > parsedCommitted) {
      toast.error('Expended amount cannot exceed committed amount')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        poNumber: form.poNumber.trim(),
        voteCode: form.voteCode.trim(),
        supplier: form.supplier.trim(),
        description: form.description.trim(),
        commitDate: form.commitDate,
        committedAmount: parsedCommitted,
        expendedAmount: parsedExpended,
        balance,
        status: form.status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=commitment&id=${editingId}`
        : `/api/modules?module=commitment&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} commitment`)

      toast.success(`Commitment ${isEditing ? 'updated' : 'added'} successfully`)
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
      const res = await fetch(`/api/modules?module=commitment&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete commitment')

      toast.success('Commitment deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete commitment')
    } finally {
      setDeleting(false)
    }
  }

  // ── Status badge helper ───────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Open</Badge>
      case 'partial':
        return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">Partial</Badge>
      case 'fully-expended':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Fully Expended</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Commitment Register
          </h2>
          <p className="text-sm text-muted-foreground">
            Track purchase order commitments and expenditure progress
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Commitment
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Committed
            </CardTitle>
            <FileCheck2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalCommitted)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expended
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatNum(totalExpended)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">
              Unexpended Commitments
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(unexpendedCommitments)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck2 className="h-5 w-5" />
            Commitment Register Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileCheck2 className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No commitments recorded yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Commitment&quot; to start tracking purchase orders.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[110px]">PO #</TableHead>
                    <TableHead className="w-[100px]">Vote Code</TableHead>
                    <TableHead className="min-w-[120px]">Supplier</TableHead>
                    <TableHead className="min-w-[140px]">Description</TableHead>
                    <TableHead className="text-right w-[110px]">Committed</TableHead>
                    <TableHead className="text-right w-[110px]">Expended</TableHead>
                    <TableHead className="text-right w-[100px]">Balance</TableHead>
                    <TableHead className="w-[160px]">Expenditure Progress</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[110px] text-center">Status</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => {
                    const expPct = entry.committedAmount > 0
                      ? Math.min(100, Math.round((entry.expendedAmount / entry.committedAmount) * 100))
                      : 0
                    return (
                      <TableRow
                        key={entry.id}
                        className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          {entry.poNumber}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {entry.voteCode || '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.supplier || '—'}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                          {entry.description || '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(entry.committedAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-amber-600">
                          {entry.expendedAmount > 0 ? formatNum(entry.expendedAmount) : <span className="text-slate-300">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium text-emerald-600">
                          {formatNum(entry.balance)}
                        </TableCell>
                        <TableCell className="min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <Progress value={expPct} className="h-2 flex-1" />
                            <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                              {expPct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {entry.commitDate || '—'}
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
                              aria-label={`Edit commitment ${entry.poNumber}`}
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(entry.id)}
                              aria-label={`Delete commitment ${entry.poNumber}`}
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
              {editingId ? 'Edit Commitment' : 'Add New Commitment'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row: PO Number + Vote Code */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cmt-po">PO Number</Label>
                <Input
                  id="cmt-po"
                  placeholder="e.g. PO-2025-001"
                  value={form.poNumber}
                  onChange={(e) => updateField('poNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmt-vote">Vote Code</Label>
                <Input
                  id="cmt-vote"
                  placeholder="e.g. V-201"
                  value={form.voteCode}
                  onChange={(e) => updateField('voteCode', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Supplier + Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cmt-supplier">Supplier</Label>
                <Input
                  id="cmt-supplier"
                  placeholder="Supplier name"
                  value={form.supplier}
                  onChange={(e) => updateField('supplier', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmt-date">Commitment Date</Label>
                <Input
                  id="cmt-date"
                  type="date"
                  value={form.commitDate}
                  onChange={(e) => updateField('commitDate', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="cmt-desc">Description</Label>
              <Input
                id="cmt-desc"
                placeholder="Brief description of goods/services"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            {/* Row: Committed Amount + Expended Amount */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cmt-committed" className="text-primary">Committed Amount</Label>
                <Input
                  id="cmt-committed"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.committedAmount}
                  onChange={(e) => updateField('committedAmount', e.target.value)}
                  className="border-primary/30 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmt-expended" className="text-amber-700">Expended Amount</Label>
                <Input
                  id="cmt-expended"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.expendedAmount}
                  onChange={(e) => updateField('expendedAmount', e.target.value)}
                  className="border-amber-200 focus-visible:ring-amber-500"
                />
              </div>
            </div>

            {/* Auto-computed balance display */}
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Computed Balance (Committed − Expended): </span>
              <span className="font-mono font-bold text-emerald-600">
                {formatNum(formBalance)}
              </span>
              {committed > 0 && (
                <>
                  <span className="ml-3 text-muted-foreground">Expenditure: </span>
                  <span className="font-mono font-bold">
                    {Math.min(100, Math.round((expended / committed) * 100))}%
                  </span>
                </>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="cmt-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => updateField('status', val)}
              >
                <SelectTrigger id="cmt-status">
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? 'Saving...'
                : editingId
                  ? 'Update Commitment'
                  : 'Add Commitment'}
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
              Delete Commitment
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this commitment? This action cannot be undone.
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
