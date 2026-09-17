'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  CalendarDays,
  FileText,
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
  accountCode: string
  accountName: string
  description: string
  reference: string
  amount: number
  status: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  date: string
  accountCode: string
  accountName: string
  description: string
  reference: string
  amount: string
  status: string
}

const EMPTY_FORM: FormState = {
  date: new Date().toISOString().split('T')[0],
  accountCode: '',
  accountName: '',
  description: '',
  reference: '',
  amount: '',
  status: 'pending',
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'recognised', label: 'Recognised' },
  { value: 'collected', label: 'Collected' },
  { value: 'reversed', label: 'Reversed' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function RevenueJournal({ reportId: _reportId }: ModuleProps) {
  // Local state management — no API calls
  const [entries, setEntries] = useState<RevenueEntry[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Summary computation ───────────────────────────────────────────────────

  const totalRevenue = entries.reduce((sum, e) => sum + e.amount, 0)

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

  const entriesCount = entries.length

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEditDialog = (entry: RevenueEntry) => {
    setEditingId(entry.id)
    setForm({
      date: entry.date,
      accountCode: entry.accountCode,
      accountName: entry.accountName,
      description: entry.description,
      reference: entry.reference,
      amount: String(entry.amount),
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
    if (!form.accountCode.trim()) {
      toast.error('Account code is required')
      return
    }

    if (!form.accountName.trim()) {
      toast.error('Account name is required')
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
                accountCode: form.accountCode.trim(),
                accountName: form.accountName.trim(),
                description: form.description.trim(),
                reference: form.reference.trim(),
                amount: parsedAmount,
                status: form.status,
              }
            : e
        )
      )
      toast.success('Revenue entry updated successfully')
    } else {
      const newEntry: RevenueEntry = {
        id: crypto.randomUUID(),
        date: form.date,
        accountCode: form.accountCode.trim(),
        accountName: form.accountName.trim(),
        description: form.description.trim(),
        reference: form.reference.trim(),
        amount: parsedAmount,
        status: form.status,
      }
      setEntries((prev) => [...prev, newEntry])
      toast.success('Revenue entry recorded successfully')
    }

    setFormOpen(false)
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = () => {
    if (!deletingId) return
    setEntries((prev) => prev.filter((e) => e.id !== deletingId))
    toast.success('Revenue entry deleted successfully')
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
      case 'recognised':
        return (
          <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
            Recognised
          </Badge>
        )
      case 'collected':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Collected
          </Badge>
        )
      case 'reversed':
        return <Badge variant="destructive">Reversed</Badge>
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
            Revenue Journal
          </h2>
          <p className="text-sm text-muted-foreground">
            Record and track all revenue transactions
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Record Entry
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
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
              Entries Count
            </CardTitle>
            <FileText className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {entriesCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5" />
            Revenue Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No revenue entries recorded yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Record Entry&quot; to add your first revenue entry.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead className="min-w-[160px]">Account</TableHead>
                    <TableHead className="min-w-[140px]">Description</TableHead>
                    <TableHead className="w-[120px]">Reference</TableHead>
                    <TableHead className="text-right w-[120px]">
                      Amount
                    </TableHead>
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
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs text-muted-foreground">
                            {entry.accountCode}
                          </span>
                          <span className="text-sm font-medium">
                            {entry.accountName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                        {entry.description || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {entry.reference || '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-emerald-600">
                        {formatNum(entry.amount)}
                      </TableCell>
                      <TableCell>{statusBadge(entry.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(entry)}
                            aria-label={`Edit revenue entry ${entry.reference}`}
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label={`Delete revenue entry ${entry.reference}`}
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
              {editingId ? 'Edit Revenue Entry' : 'Record New Revenue Entry'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Date + Account Code */}
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
                <Label htmlFor="rev-code">Account Code</Label>
                <Input
                  id="rev-code"
                  placeholder="e.g. R-101"
                  value={form.accountCode}
                  onChange={(e) => updateField('accountCode', e.target.value)}
                />
              </div>
            </div>

            {/* Account Name + Reference */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rev-name">Account Name</Label>
                <Input
                  id="rev-name"
                  placeholder="e.g. Tax Revenue"
                  value={form.accountName}
                  onChange={(e) => updateField('accountName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rev-ref">Reference</Label>
                <Input
                  id="rev-ref"
                  placeholder="e.g. REC-2025-001"
                  value={form.reference}
                  onChange={(e) => updateField('reference', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="rev-desc">Description</Label>
              <Input
                id="rev-desc"
                placeholder="Brief description of revenue entry"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            {/* Amount + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rev-amount" className="text-emerald-700">
                  Amount
                </Label>
                <Input
                  id="rev-amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                  className="border-emerald-200 focus-visible:ring-emerald-500"
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
            <Button onClick={handleSubmit}>
              {editingId ? 'Update Entry' : 'Record Entry'}
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
            Are you sure you want to delete this revenue entry? This action
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
