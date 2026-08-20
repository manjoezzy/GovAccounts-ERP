'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  Receipt,
  Send,
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

interface TaxEntry {
  id: string
  taxType: string
  taxPeriod: string
  collected: number
  remitted: number
  balance: number
  dueDate: string
  remittanceDate: string
  status: string
  createdAt: string
  updatedAt: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  taxType: string
  taxPeriod: string
  collected: string
  remitted: string
  dueDate: string
  remittanceDate: string
  status: string
}

const EMPTY_FORM: FormState = {
  taxType: 'paye',
  taxPeriod: '',
  collected: '',
  remitted: '',
  dueDate: '',
  remittanceDate: '',
  status: 'pending',
}

const TAX_TYPE_OPTIONS = [
  { value: 'paye', label: 'PAYE' },
  { value: 'vat', label: 'VAT' },
  { value: 'withholding-tax', label: 'Withholding Tax' },
  { value: 'income-tax', label: 'Income Tax' },
  { value: 'other', label: 'Other' },
] as const

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'remitted', label: 'Remitted' },
  { value: 'overdue', label: 'Overdue' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function TaxRegister({ reportId }: ModuleProps) {
  const [entries, setEntries] = useState<TaxEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Summary computation ───────────────────────────────────────────────────

  const totalCollected = entries.reduce((sum, e) => sum + e.collected, 0)
  const totalRemitted = entries.reduce((sum, e) => sum + e.remitted, 0)
  const balanceDue = entries.reduce((sum, e) => sum + e.balance, 0)

  // Auto-computed balance from form
  const formBalance = (parseFloat(form.collected) || 0) - (parseFloat(form.remitted) || 0)

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=tax&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch tax entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load tax entries')
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

  const openEditDialog = (entry: TaxEntry) => {
    setEditingId(entry.id)
    setForm({
      taxType: entry.taxType,
      taxPeriod: entry.taxPeriod,
      collected: String(entry.collected),
      remitted: String(entry.remitted),
      dueDate: entry.dueDate,
      remittanceDate: entry.remittanceDate,
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
    if (!form.taxPeriod.trim()) {
      toast.error('Tax period is required')
      return
    }

    const collected = parseFloat(form.collected) || 0
    const remitted = parseFloat(form.remitted) || 0
    const balance = collected - remitted

    if (collected === 0 && remitted === 0) {
      toast.error('Either collected or remitted amount is required')
      return
    }

    if (collected < 0 || remitted < 0) {
      toast.error('Amounts must be non-negative')
      return
    }

    if (remitted > collected) {
      toast.error('Remitted amount cannot exceed collected amount')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        taxType: form.taxType,
        taxPeriod: form.taxPeriod.trim(),
        collected,
        remitted,
        balance,
        dueDate: form.dueDate,
        remittanceDate: form.remittanceDate,
        status: form.status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=tax&id=${editingId}`
        : `/api/modules?module=tax&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} tax entry`)

      toast.success(`Tax entry ${isEditing ? 'updated' : 'added'} successfully`)
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
      const res = await fetch(`/api/modules?module=tax&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete tax entry')

      toast.success('Tax entry deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete tax entry')
    } finally {
      setDeleting(false)
    }
  }

  // ── Status badge helper ───────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Pending</Badge>
      case 'remitted':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Remitted</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const taxTypeLabel = (type: string) => {
    return TAX_TYPE_OPTIONS.find((o) => o.value === type)?.label || type
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Tax Register
          </h2>
          <p className="text-sm text-muted-foreground">
            Track tax collections, remittances, and outstanding obligations
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collected
            </CardTitle>
            <Receipt className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(totalCollected)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Remitted
            </CardTitle>
            <Send className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalRemitted)}
            </p>
          </CardContent>
        </Card>

        <Card className={balanceDue > 0 ? 'border-red-200 bg-red-50/40' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${balanceDue > 0 ? 'text-red-700' : 'text-muted-foreground'}`}>
              Balance Due
            </CardTitle>
            {balanceDue > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Receipt className="h-4 w-4 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatNum(balanceDue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-5 w-5" />
            Tax Register Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No tax entries yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Entry&quot; to start recording tax obligations.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[130px]">Tax Type</TableHead>
                    <TableHead className="w-[120px]">Period</TableHead>
                    <TableHead className="text-right w-[110px]">Collected</TableHead>
                    <TableHead className="text-right w-[110px]">Remitted</TableHead>
                    <TableHead className="text-right w-[110px]">Balance</TableHead>
                    <TableHead className="w-[110px]">Due Date</TableHead>
                    <TableHead className="w-[130px]">Remittance Date</TableHead>
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
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {taxTypeLabel(entry.taxType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {entry.taxPeriod || '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-600">
                        {formatNum(entry.collected)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {entry.remitted > 0 ? formatNum(entry.remitted) : <span className="text-slate-300">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        <span className={entry.balance > 0 ? 'text-red-600' : 'text-emerald-600'}>
                          {formatNum(entry.balance)}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {entry.dueDate || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {entry.remittanceDate || '—'}
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
                            aria-label={`Edit tax entry ${entry.taxPeriod}`}
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label={`Delete tax entry ${entry.taxPeriod}`}
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
              {editingId ? 'Edit Tax Entry' : 'Add Tax Entry'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row: Tax Type + Tax Period */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tax-type">Tax Type</Label>
                <Select
                  value={form.taxType}
                  onValueChange={(val) => updateField('taxType', val)}
                >
                  <SelectTrigger id="tax-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-period">Tax Period</Label>
                <Input
                  id="tax-period"
                  placeholder="e.g. 2025-Q1"
                  value={form.taxPeriod}
                  onChange={(e) => updateField('taxPeriod', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Collected + Remitted */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tax-collected" className="text-emerald-700">Collected Amount</Label>
                <Input
                  id="tax-collected"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.collected}
                  onChange={(e) => updateField('collected', e.target.value)}
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-remitted">Remitted Amount</Label>
                <Input
                  id="tax-remitted"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.remitted}
                  onChange={(e) => updateField('remitted', e.target.value)}
                />
              </div>
            </div>

            {/* Auto-computed balance display */}
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Computed Balance Due: </span>
              <span className={`font-mono font-bold ${formBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatNum(formBalance)}
              </span>
            </div>

            {/* Row: Due Date + Remittance Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tax-due">Due Date</Label>
                <Input
                  id="tax-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-rem-date">Remittance Date</Label>
                <Input
                  id="tax-rem-date"
                  type="date"
                  value={form.remittanceDate}
                  onChange={(e) => updateField('remittanceDate', e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="tax-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => updateField('status', val)}
              >
                <SelectTrigger id="tax-status">
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
              Delete Tax Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this tax entry? This action cannot be undone.
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
