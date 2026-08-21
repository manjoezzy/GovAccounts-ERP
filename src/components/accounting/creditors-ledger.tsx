'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus, Trash2, Edit, Building2, DollarSign,
  AlertTriangle, Clock, CalendarX,
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
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function computeAgingDays(dueDate: string): number {
  if (!dueDate) return 0
  const due = new Date(dueDate)
  const now = new Date()
  const diffMs = now.getTime() - due.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function getAgingLabel(days: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (days > 90) return { label: '90+ Days', variant: 'destructive' }
  if (days > 60) return { label: '60-90 Days', variant: 'destructive' }
  if (days > 30) return { label: '30-60 Days', variant: 'secondary' }
  return { label: 'Current', variant: 'outline' }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface CreditorEntry {
  id: string
  name: string
  accountCode: string
  invoiceNumber: string
  invoiceAmount: number
  amountPaid: number
  balance: number
  invoiceDate: string
  dueDate: string
  agingDays: number
  status: string
}

interface ModuleProps {
  reportId: string
}

type FormState = {
  name: string
  accountCode: string
  invoiceNumber: string
  invoiceAmount: string
  amountPaid: string
  invoiceDate: string
  dueDate: string
}

const EMPTY_FORM: FormState = {
  name: '',
  accountCode: '',
  invoiceNumber: '',
  invoiceAmount: '',
  amountPaid: '',
  invoiceDate: '',
  dueDate: '',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CreditorsLedger({ reportId }: ModuleProps) {
  // Data state
  const [entries, setEntries] = useState<CreditorEntry[]>([])
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

  // ── Computed form values ──────────────────────────────────────────────────

  const parsedInvoiceAmount = parseFloat(form.invoiceAmount) || 0
  const parsedAmountPaid = parseFloat(form.amountPaid) || 0
  const computedBalance = parsedInvoiceAmount - parsedAmountPaid

  // ── Aging summary ────────────────────────────────────────────────────────

  const totalPayable = entries.reduce((sum, e) => sum + e.balance, 0)
  const over30 = entries.filter((e) => e.agingDays > 30).reduce((sum, e) => sum + e.balance, 0)
  const over60 = entries.filter((e) => e.agingDays > 60).reduce((sum, e) => sum + e.balance, 0)
  const over90 = entries.filter((e) => e.agingDays > 90).reduce((sum, e) => sum + e.balance, 0)

  // ── Fetch entries ─────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=creditor&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch creditor entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load creditors ledger')
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

  const openEditDialog = (entry: CreditorEntry) => {
    setEditingId(entry.id)
    setForm({
      name: entry.name,
      accountCode: entry.accountCode,
      invoiceNumber: entry.invoiceNumber,
      invoiceAmount: String(entry.invoiceAmount),
      amountPaid: String(entry.amountPaid),
      invoiceDate: entry.invoiceDate,
      dueDate: entry.dueDate,
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
    if (!form.name.trim() || !form.invoiceNumber.trim()) {
      toast.error('Name and invoice number are required')
      return
    }

    const aging = computeAgingDays(form.dueDate)
    const balance = parsedInvoiceAmount - parsedAmountPaid
    const status = balance <= 0 ? 'paid' : aging > 90 ? 'overdue' : 'outstanding'

    try {
      setSubmitting(true)

      const body = {
        reportId,
        name: form.name.trim(),
        accountCode: form.accountCode.trim(),
        invoiceNumber: form.invoiceNumber.trim(),
        invoiceAmount: parsedInvoiceAmount,
        amountPaid: parsedAmountPaid,
        balance,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        agingDays: aging,
        status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=creditor&id=${editingId}`
        : `/api/modules?module=creditor&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} entry`)

      toast.success(`Creditor entry ${isEditing ? 'updated' : 'added'} successfully`)
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
      const res = await fetch(`/api/modules?module=creditor&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete entry')

      toast.success('Creditor entry deleted successfully')
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

  // ── Status badge ──────────────────────────────────────────────────────────

  function statusBadge(status: string) {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Paid</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
      default:
        return <Badge variant="secondary">Outstanding</Badge>
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Creditors Ledger
          </h2>
          <p className="text-sm text-muted-foreground">
            Track payables and aging analysis
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Creditor
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payable
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalPayable)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Over 30 Days
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatNum(over30)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Over 60 Days
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatNum(over60)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Over 90 Days
            </CardTitle>
            <CalendarX className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-800">
              {formatNum(over90)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5" />
            Creditor Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No creditor entries yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Creditor&quot; to start tracking payables.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="min-w-[140px]">Name</TableHead>
                    <TableHead className="w-[100px]">Invoice #</TableHead>
                    <TableHead className="text-right w-[110px]">Invoice Amt</TableHead>
                    <TableHead className="text-right w-[90px]">Paid</TableHead>
                    <TableHead className="text-right w-[110px]">Balance</TableHead>
                    <TableHead className="w-[90px]">Inv. Date</TableHead>
                    <TableHead className="w-[90px]">Due Date</TableHead>
                    <TableHead className="w-[100px] text-center">Aging</TableHead>
                    <TableHead className="w-[90px] text-center">Status</TableHead>
                    <TableHead className="w-[80px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => {
                    const aging = getAgingLabel(entry.agingDays)
                    return (
                      <TableRow
                        key={entry.id}
                        className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                      >
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-slate-900 truncate max-w-[140px]">
                              {entry.name}
                            </p>
                            {entry.accountCode && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {entry.accountCode}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {entry.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(entry.invoiceAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-emerald-600">
                          {formatNum(entry.amountPaid)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {formatNum(entry.balance)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {entry.invoiceDate || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {entry.dueDate || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={aging.variant} className="text-[10px] px-1.5 py-0">
                            {aging.label}
                          </Badge>
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
                              aria-label={`Edit ${entry.name}`}
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(entry.id)}
                              aria-label={`Delete ${entry.name}`}
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
              {editingId ? 'Edit Creditor' : 'Add Creditor'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the creditor invoice details.'
                : 'Record a new creditor invoice.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="creditor-name">Name</Label>
                <Input
                  id="creditor-name"
                  placeholder="Creditor name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditor-code">Account Code</Label>
                <Input
                  id="creditor-code"
                  placeholder="e.g. CR-001"
                  value={form.accountCode}
                  onChange={(e) => updateField('accountCode', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditor-inv">Invoice Number</Label>
              <Input
                id="creditor-inv"
                placeholder="e.g. INV-2025-001"
                value={form.invoiceNumber}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="creditor-amount">Invoice Amount</Label>
                <Input
                  id="creditor-amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.invoiceAmount}
                  onChange={(e) => updateField('invoiceAmount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditor-paid">Amount Paid</Label>
                <Input
                  id="creditor-paid"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.amountPaid}
                  onChange={(e) => updateField('amountPaid', e.target.value)}
                />
              </div>
            </div>

            {/* Auto-computed balance */}
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Balance Payable
                </span>
                <span
                  className={`text-sm font-bold font-mono ${
                    computedBalance > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {formatNum(computedBalance)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Auto-calculated: Invoice Amount − Amount Paid
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="creditor-inv-date">Invoice Date</Label>
                <Input
                  id="creditor-inv-date"
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => updateField('invoiceDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditor-due-date">Due Date</Label>
                <Input
                  id="creditor-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
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
                  ? 'Update Creditor'
                  : 'Add Creditor'}
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
              Delete Creditor Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this creditor entry? This action cannot
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
