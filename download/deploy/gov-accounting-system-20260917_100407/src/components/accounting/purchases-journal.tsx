'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  Receipt,
  Users,
  CalendarDays,
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

interface PurchaseEntry {
  id: string
  date: string
  supplier: string
  invoiceNumber: string
  description: string
  amount: number
  accountCode: string
  status: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  date: string
  supplier: string
  invoiceNumber: string
  description: string
  amount: string
  accountCode: string
  status: string
}

const EMPTY_FORM: FormState = {
  date: new Date().toISOString().split('T')[0],
  supplier: '',
  invoiceNumber: '',
  description: '',
  amount: '',
  accountCode: '',
  status: 'pending',
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function PurchasesJournal({ reportId: _reportId }: ModuleProps) {
  // Local state management — no API calls
  const [entries, setEntries] = useState<PurchaseEntry[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Summary computation ───────────────────────────────────────────────────

  const totalPurchases = entries.reduce((sum, e) => sum + e.amount, 0)

  const thisMonth = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    return entries
      .filter((e) => {
        const d = new Date(e.date)
        return d.getFullYear() === y && d.getMonth() === m
      })
      .reduce((sum, e) => sum + e.amount, 0)
  }, [entries])

  const suppliersCount = useMemo(() => {
    const suppliers = new Set(entries.map((e) => e.supplier).filter(Boolean))
    return suppliers.size
  }, [entries])

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEditDialog = (entry: PurchaseEntry) => {
    setEditingId(entry.id)
    setForm({
      date: entry.date,
      supplier: entry.supplier,
      invoiceNumber: entry.invoiceNumber,
      description: entry.description,
      amount: String(entry.amount),
      accountCode: entry.accountCode,
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

  const handleSubmit = () => {
    if (!form.supplier.trim()) {
      toast.error('Supplier is required')
      return
    }

    if (!form.invoiceNumber.trim()) {
      toast.error('Invoice number is required')
      return
    }

    const parsedAmount = parseFloat(form.amount)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('A valid positive amount is required')
      return
    }

    if (editingId !== null) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                date: form.date,
                supplier: form.supplier.trim(),
                invoiceNumber: form.invoiceNumber.trim(),
                description: form.description.trim(),
                amount: parsedAmount,
                accountCode: form.accountCode.trim(),
                status: form.status,
              }
            : e
        )
      )
      toast.success('Purchase updated successfully')
    } else {
      const newEntry: PurchaseEntry = {
        id: crypto.randomUUID(),
        date: form.date,
        supplier: form.supplier.trim(),
        invoiceNumber: form.invoiceNumber.trim(),
        description: form.description.trim(),
        amount: parsedAmount,
        accountCode: form.accountCode.trim(),
        status: form.status,
      }
      setEntries((prev) => [...prev, newEntry])
      toast.success('Purchase recorded successfully')
    }

    setFormOpen(false)
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = () => {
    if (!deletingId) return
    setEntries((prev) => prev.filter((e) => e.id !== deletingId))
    toast.success('Purchase deleted successfully')
    setDeleteOpen(false)
    setDeletingId(null)
  }

  // ── Status badge helper ───────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">
            Pending
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
            Approved
          </Badge>
        )
      case 'paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Paid
          </Badge>
        )
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
            Purchases Journal
          </h2>
          <p className="text-sm text-muted-foreground">
            Record and track all purchase transactions
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Record Purchase
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Purchases
            </CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalPurchases)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatNum(thisMonth)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suppliers Count
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {suppliersCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-5 w-5" />
            Purchase Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No purchases recorded yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Record Purchase&quot; to add your first entry.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead className="min-w-[120px]">Supplier</TableHead>
                    <TableHead className="w-[120px]">Invoice #</TableHead>
                    <TableHead className="min-w-[140px]">Description</TableHead>
                    <TableHead className="text-right w-[120px]">
                      Amount
                    </TableHead>
                    <TableHead className="w-[100px]">Account Code</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[90px] text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {entry.date || '—'}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {entry.supplier || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {entry.invoiceNumber || '—'}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                        {entry.description || '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNum(entry.amount)}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {entry.accountCode || '—'}
                      </TableCell>
                      <TableCell>{statusBadge(entry.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(entry)}
                            aria-label={`Edit purchase ${entry.invoiceNumber}`}
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label={`Delete purchase ${entry.invoiceNumber}`}
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
              {editingId ? 'Edit Purchase' : 'Record New Purchase'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Date + Supplier */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purch-date">Date</Label>
                <Input
                  id="purch-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purch-supplier">Supplier</Label>
                <Input
                  id="purch-supplier"
                  placeholder="Supplier name"
                  value={form.supplier}
                  onChange={(e) => updateField('supplier', e.target.value)}
                />
              </div>
            </div>

            {/* Invoice # + Account Code */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purch-invoice">Invoice #</Label>
                <Input
                  id="purch-invoice"
                  placeholder="e.g. INV-2025-001"
                  value={form.invoiceNumber}
                  onChange={(e) => updateField('invoiceNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purch-account">Account Code</Label>
                <Input
                  id="purch-account"
                  placeholder="e.g. A-501"
                  value={form.accountCode}
                  onChange={(e) => updateField('accountCode', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="purch-desc">Description</Label>
              <Input
                id="purch-desc"
                placeholder="Brief description of purchase"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            {/* Amount + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purch-amount" className="text-primary">
                  Amount
                </Label>
                <Input
                  id="purch-amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                  className="border-primary/30 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purch-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => updateField('status', val)}
                >
                  <SelectTrigger id="purch-status">
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
            <Button onClick={handleSubmit}>
              {editingId ? 'Update Purchase' : 'Record Purchase'}
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
              Delete Purchase
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this purchase entry? This action
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
