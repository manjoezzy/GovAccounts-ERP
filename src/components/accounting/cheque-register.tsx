'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  FileText,
  Send,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowUpDown,
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

interface ChequeEntry {
  id: string
  chequeNumber: string
  payee: string
  amount: number
  voteCode: string
  issueDate: string
  bankAccount: string
  status: string
  presentedDate: string
  cancelledReason: string
  createdAt: string
  updatedAt: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  chequeNumber: string
  payee: string
  amount: string
  voteCode: string
  issueDate: string
  bankAccount: string
  status: string
  presentedDate: string
  cancelledReason: string
}

const EMPTY_FORM: FormState = {
  chequeNumber: '',
  payee: '',
  amount: '',
  voteCode: '',
  issueDate: new Date().toISOString().split('T')[0],
  bankAccount: 'main',
  status: 'issued',
  presentedDate: '',
  cancelledReason: '',
}

const BANK_ACCOUNT_OPTIONS = [
  { value: 'main', label: 'Main Account' },
  { value: 'secondary', label: 'Secondary Account' },
] as const

const STATUS_OPTIONS = [
  { value: 'issued', label: 'Issued' },
  { value: 'presented', label: 'Presented' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'bounced', label: 'Bounced' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function ChequeRegister({ reportId }: ModuleProps) {
  const [entries, setEntries] = useState<ChequeEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Summary computation ───────────────────────────────────────────────────

  const totalIssued = entries
    .filter((e) => e.status === 'issued' || e.status === 'presented' || e.status === 'bounced')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalPresented = entries
    .filter((e) => e.status === 'presented')
    .reduce((sum, e) => sum + e.amount, 0)

  const outstanding = entries
    .filter((e) => e.status === 'issued')
    .reduce((sum, e) => sum + e.amount, 0)

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=cheque&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch cheque entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load cheque entries')
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

  const openEditDialog = (entry: ChequeEntry) => {
    setEditingId(entry.id)
    setForm({
      chequeNumber: entry.chequeNumber,
      payee: entry.payee,
      amount: String(entry.amount),
      voteCode: entry.voteCode,
      issueDate: entry.issueDate,
      bankAccount: entry.bankAccount,
      status: entry.status,
      presentedDate: entry.presentedDate,
      cancelledReason: entry.cancelledReason,
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
    if (!form.chequeNumber.trim() || !form.payee.trim()) {
      toast.error('Cheque number and payee are required')
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
        chequeNumber: form.chequeNumber.trim(),
        payee: form.payee.trim(),
        amount: parsedAmount,
        voteCode: form.voteCode.trim(),
        issueDate: form.issueDate,
        bankAccount: form.bankAccount,
        status: form.status,
        presentedDate: form.presentedDate,
        cancelledReason: form.cancelledReason.trim(),
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=cheque&id=${editingId}`
        : `/api/modules?module=cheque&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} cheque`)

      toast.success(`Cheque ${isEditing ? 'updated' : 'issued'} successfully`)
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
      const res = await fetch(`/api/modules?module=cheque&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete cheque')

      toast.success('Cheque entry deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete cheque entry')
    } finally {
      setDeleting(false)
    }
  }

  // ── Status badge helper ───────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <Badge variant="default">Issued</Badge>
      case 'presented':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Presented</Badge>
      case 'cancelled':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">Cancelled</Badge>
      case 'bounced':
        return <Badge variant="destructive">Bounced</Badge>
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
            Cheque/Payment Register
          </h2>
          <p className="text-sm text-muted-foreground">
            Track all issued cheques, presentation status, and outstanding payments
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Issue Cheque
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Issued
            </CardTitle>
            <Send className="h-4 w-4 text-primary" />
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
              Total Presented
            </CardTitle>
            <FileText className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(totalPresented)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
            {outstanding > 0 ? (
              <Clock className="h-4 w-4 text-amber-500" />
            ) : (
              <Clock className="h-4 w-4 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${outstanding > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatNum(outstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpDown className="h-5 w-5" />
            Cheque Register Entries
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
                No cheque entries yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Issue Cheque&quot; to start recording payments.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[120px]">Cheque #</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead className="text-right w-[110px]">Amount</TableHead>
                    <TableHead className="w-[100px]">Vote Code</TableHead>
                    <TableHead className="w-[110px]">Issue Date</TableHead>
                    <TableHead className="w-[130px]">Bank Account</TableHead>
                    <TableHead className="w-[110px] text-center">Status</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {entry.chequeNumber || '—'}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {entry.payee}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNum(entry.amount)}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {entry.voteCode || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {entry.issueDate || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {BANK_ACCOUNT_OPTIONS.find((o) => o.value === entry.bankAccount)?.label || entry.bankAccount}
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
                            aria-label={`Edit cheque ${entry.chequeNumber}`}
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label={`Delete cheque ${entry.chequeNumber}`}
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
              {editingId ? 'Edit Cheque' : 'Issue New Cheque'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row: Cheque Number + Payee */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="chq-number">Cheque Number</Label>
                <Input
                  id="chq-number"
                  placeholder="e.g. CHQ-0001"
                  value={form.chequeNumber}
                  onChange={(e) => updateField('chequeNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chq-payee">Payee</Label>
                <Input
                  id="chq-payee"
                  placeholder="Payee name"
                  value={form.payee}
                  onChange={(e) => updateField('payee', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Amount + Vote Code */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="chq-amount">Amount</Label>
                <Input
                  id="chq-amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chq-vote">Vote Code</Label>
                <Input
                  id="chq-vote"
                  placeholder="e.g. V-101"
                  value={form.voteCode}
                  onChange={(e) => updateField('voteCode', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Issue Date + Bank Account */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="chq-date">Issue Date</Label>
                <Input
                  id="chq-date"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => updateField('issueDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chq-bank">Bank Account</Label>
                <Select
                  value={form.bankAccount}
                  onValueChange={(val) => updateField('bankAccount', val)}
                >
                  <SelectTrigger id="chq-bank">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_ACCOUNT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row: Status + Presented Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="chq-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => updateField('status', val)}
                >
                  <SelectTrigger id="chq-status">
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
              <div className="space-y-2">
                <Label htmlFor="chq-presented">Presented Date</Label>
                <Input
                  id="chq-presented"
                  type="date"
                  value={form.presentedDate}
                  onChange={(e) => updateField('presentedDate', e.target.value)}
                />
              </div>
            </div>

            {/* Cancelled Reason — shown when status is cancelled or bounced */}
            {(form.status === 'cancelled' || form.status === 'bounced') && (
              <div className="space-y-2">
                <Label htmlFor="chq-reason" className="text-red-700">
                  {form.status === 'cancelled' ? 'Cancellation Reason' : 'Bounce Reason'}
                </Label>
                <Input
                  id="chq-reason"
                  placeholder="Reason for cancellation/bounce"
                  value={form.cancelledReason}
                  onChange={(e) => updateField('cancelledReason', e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? 'Saving...'
                : editingId
                  ? 'Update Cheque'
                  : 'Issue Cheque'}
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
              Delete Cheque Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this cheque entry? This action cannot be undone.
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
