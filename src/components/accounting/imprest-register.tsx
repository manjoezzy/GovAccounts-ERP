'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
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

function isOverdue(dueDate: string, status: string): boolean {
  if (status === 'surrendered') return false
  return new Date(dueDate) < new Date(new Date().toISOString().split('T')[0])
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ImprestEntry {
  id: string
  imprestNo: string
  holderName: string
  purpose: string
  amountIssued: number
  amountSurrendered: number
  balance: number
  issueDate: string
  dueDate: string
  surrenderDate: string
  status: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  imprestNo: string
  holderName: string
  purpose: string
  amountIssued: string
  amountSurrendered: string
  issueDate: string
  dueDate: string
  surrenderDate: string
  status: string
}

const EMPTY_FORM: FormState = {
  imprestNo: '',
  holderName: '',
  purpose: '',
  amountIssued: '',
  amountSurrendered: '',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  surrenderDate: '',
  status: 'outstanding',
}

const STATUS_OPTIONS = [
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'surrendered', label: 'Surrendered' },
  { value: 'overdue', label: 'Overdue' },
] as const

const STATUS_BADGE_CLASSES: Record<string, string> = {
  outstanding: 'bg-orange-100 text-orange-800 border-orange-200',
  surrendered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ImprestRegister({ reportId }: ModuleProps) {
  // Data state
  const [entries, setEntries] = useState<ImprestEntry[]>([])
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

  // ── Computed balance ───────────────────────────────────────────────────

  const computedBalance = ((): number => {
    const issued = parseFloat(form.amountIssued) || 0
    const surrendered = parseFloat(form.amountSurrendered) || 0
    return issued - surrendered
  })()

  // ── Summary computation ─────────────────────────────────────────────────

  const totalIssued = entries.reduce((sum, e) => sum + e.amountIssued, 0)
  const totalSurrendered = entries.reduce((sum, e) => sum + e.amountSurrendered, 0)
  const outstandingBalance = entries.reduce((sum, e) => sum + e.balance, 0)

  // ── Fetch entries ─────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=imprest&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch imprest entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load imprest entries')
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

  const openEditDialog = (entry: ImprestEntry) => {
    setEditingId(entry.id)
    setForm({
      imprestNo: entry.imprestNo,
      holderName: entry.holderName,
      purpose: entry.purpose,
      amountIssued: String(entry.amountIssued),
      amountSurrendered: String(entry.amountSurrendered),
      issueDate: entry.issueDate,
      dueDate: entry.dueDate,
      surrenderDate: entry.surrenderDate || '',
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
    if (!form.imprestNo.trim() || !form.holderName.trim() || !form.purpose.trim()) {
      toast.error('Imprest number, holder name, and purpose are required')
      return
    }

    const parsedIssued = parseFloat(form.amountIssued)
    if (!parsedIssued || parsedIssued <= 0) {
      toast.error('A valid positive issued amount is required')
      return
    }

    const parsedSurrendered = parseFloat(form.amountSurrendered) || 0
    if (parsedSurrendered < 0) {
      toast.error('Surrendered amount cannot be negative')
      return
    }
    if (parsedSurrendered > parsedIssued) {
      toast.error('Surrendered amount cannot exceed the issued amount')
      return
    }

    if (!form.issueDate) {
      toast.error('Issue date is required')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        imprestNo: form.imprestNo.trim(),
        holderName: form.holderName.trim(),
        purpose: form.purpose.trim(),
        amountIssued: parsedIssued,
        amountSurrendered: parsedSurrendered,
        balance: parsedIssued - parsedSurrendered,
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        surrenderDate: form.surrenderDate,
        status: form.status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=imprest&id=${editingId}`
        : `/api/modules?module=imprest&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} imprest entry`)

      toast.success(`Imprest ${isEditing ? 'updated' : 'issued'} successfully`)
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
      const res = await fetch(`/api/modules?module=imprest&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete imprest entry')

      toast.success('Imprest entry deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete imprest entry')
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
            Imprest Register
          </h2>
          <p className="text-sm text-muted-foreground">
            Track imprest issues, surrenders, and outstanding balances
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Issue Imprest
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Issued
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalIssued)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Surrendered
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(totalSurrendered)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
            {outstandingBalance > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <FileText className="h-4 w-4 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {formatNum(outstandingBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Imprest Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No imprest records yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Issue Imprest&quot; to start tracking imprest advances.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[110px]">Imprest #</TableHead>
                    <TableHead className="w-[130px]">Holder</TableHead>
                    <TableHead className="max-w-[160px]">Purpose</TableHead>
                    <TableHead className="text-right w-[110px]">Issued</TableHead>
                    <TableHead className="text-right w-[120px]">Surrendered</TableHead>
                    <TableHead className="text-right w-[110px]">Balance</TableHead>
                    <TableHead className="w-[100px]">Issue Date</TableHead>
                    <TableHead className="w-[100px]">Due Date</TableHead>
                    <TableHead className="w-[110px] text-center">Status</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => {
                    const overdue = isOverdue(entry.dueDate, entry.status)
                    const displayStatus = overdue && entry.status !== 'surrendered' ? 'overdue' : entry.status
                    return (
                      <TableRow
                        key={entry.id}
                        className={`
                          ${index % 2 === 1 ? 'bg-slate-50/60' : ''}
                          ${overdue && entry.status !== 'surrendered' ? 'bg-red-50/60' : ''}
                        `}
                      >
                        <TableCell className="font-mono text-sm font-medium whitespace-nowrap">
                          {entry.imprestNo}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.holderName}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-sm">
                          {entry.purpose}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {formatNum(entry.amountIssued)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-emerald-600">
                          {entry.amountSurrendered > 0 ? formatNum(entry.amountSurrendered) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          <span className={entry.balance > 0 ? 'text-red-600' : 'text-emerald-600'}>
                            {entry.balance > 0 ? formatNum(entry.balance) : '—'}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {entry.issueDate}
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          <span className={overdue && entry.status !== 'surrendered' ? 'text-red-600 font-medium' : ''}>
                            {entry.dueDate}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={STATUS_BADGE_CLASSES[displayStatus] || ''}
                            variant="outline"
                          >
                            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(entry)}
                              aria-label={`Edit imprest ${entry.imprestNo}`}
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(entry.id)}
                              aria-label={`Delete imprest ${entry.imprestNo}`}
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
              {editingId ? 'Edit Imprest' : 'Issue Imprest'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row: Imprest No + Holder Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="imp-no">Imprest Number</Label>
                <Input
                  id="imp-no"
                  placeholder="e.g. IMP-2025-001"
                  value={form.imprestNo}
                  onChange={(e) => updateField('imprestNo', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imp-holder">Holder Name</Label>
                <Input
                  id="imp-holder"
                  placeholder="e.g. J. Mwangi"
                  value={form.holderName}
                  onChange={(e) => updateField('holderName', e.target.value)}
                />
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="imp-purpose">Purpose</Label>
              <Input
                id="imp-purpose"
                placeholder="e.g. Travel advance for field inspection"
                value={form.purpose}
                onChange={(e) => updateField('purpose', e.target.value)}
              />
            </div>

            {/* Row: Amount Issued + Amount Surrendered */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="imp-issued">Amount Issued</Label>
                <Input
                  id="imp-issued"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.amountIssued}
                  onChange={(e) => updateField('amountIssued', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imp-surrendered">Amount Surrendered</Label>
                <Input
                  id="imp-surrendered"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.amountSurrendered}
                  onChange={(e) => updateField('amountSurrendered', e.target.value)}
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {/* Auto-computed Balance */}
            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Outstanding Balance (auto-computed)
                </span>
                <span
                  className={`text-lg font-bold ${
                    computedBalance > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {formatNum(computedBalance)}
                </span>
              </div>
            </div>

            {/* Row: Issue Date + Due Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="imp-issue-date">Issue Date</Label>
                <Input
                  id="imp-issue-date"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => updateField('issueDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imp-due-date">Due Date</Label>
                <Input
                  id="imp-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Surrender Date + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="imp-surr-date">Surrender Date</Label>
                <Input
                  id="imp-surr-date"
                  type="date"
                  value={form.surrenderDate}
                  onChange={(e) => updateField('surrenderDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imp-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => updateField('status', val)}
                >
                  <SelectTrigger id="imp-status">
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
                  ? 'Update Imprest'
                  : 'Issue Imprest'}
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
              Delete Imprest Record
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this imprest record? This action cannot
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
