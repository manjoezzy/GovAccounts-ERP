'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── Types ────────────────────────────────────────────────────────────────────

interface InterFundTransfer {
  id: string
  fromFund: string
  toFund: string
  amount: number
  description: string
  authBy: string
  transferDate: string
  status: 'pending' | 'approved' | 'rejected'
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  fromFund: string
  toFund: string
  amount: string
  description: string
  authBy: string
  transferDate: string
  status: string
}

const EMPTY_FORM: FormState = {
  fromFund: '',
  toFund: '',
  amount: '',
  description: '',
  authBy: '',
  transferDate: new Date().toISOString().split('T')[0],
  status: 'pending',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function InterFund({ reportId }: ModuleProps) {
  const [entries, setEntries] = useState<InterFundTransfer[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Summary computation ─────────────────────────────────────────────────

  const totalTransferredOut = entries.reduce((s, e) => s + e.amount, 0)
  const totalTransferredIn = entries.reduce((s, e) => s + e.amount, 0)

  // ── Fetch ───────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/modules?module=inter-fund&reportId=${reportId}`,
      )
      if (!res.ok) throw new Error('Failed to fetch inter-fund transfers')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load inter-fund transfers')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // ── Form helpers ────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEditDialog = (entry: InterFundTransfer) => {
    setEditingId(entry.id)
    setForm({
      fromFund: entry.fromFund,
      toFund: entry.toFund,
      amount: String(entry.amount),
      description: entry.description,
      authBy: entry.authBy,
      transferDate: entry.transferDate,
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

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.fromFund.trim() || !form.toFund.trim()) {
      toast.error('From fund and To fund are required')
      return
    }

    const amount = parseFloat(form.amount) || 0
    if (amount <= 0) {
      toast.error('Amount must be greater than zero')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        fromFund: form.fromFund.trim(),
        toFund: form.toFund.trim(),
        amount,
        description: form.description.trim(),
        authBy: form.authBy.trim(),
        transferDate: form.transferDate,
        status: form.status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=inter-fund&id=${editingId}`
        : `/api/modules?module=inter-fund&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} transfer`)

      toast.success(`Transfer ${isEditing ? 'updated' : 'created'} successfully`)
      setFormOpen(false)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/modules?module=inter-fund&id=${deletingId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete transfer')
      toast.success('Transfer deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete transfer')
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Inter-Fund Transfers
          </h2>
          <p className="text-sm text-muted-foreground">
            Movement of resources between government funds
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Transfer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transferred Out
            </CardTitle>
            <ArrowLeft className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatNum(totalTransferredOut)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transferred In
            </CardTitle>
            <ArrowRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(totalTransferredIn)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowLeftRight className="h-5 w-5" />
            Transfer Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ArrowLeftRight className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No inter-fund transfers yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;New Transfer&quot; to move resources between funds.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[130px]">From Fund</TableHead>
                    <TableHead className="w-[130px]">To Fund</TableHead>
                    <TableHead className="text-right w-[110px]">Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[140px]">Authorized By</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
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
                      <TableCell className="text-sm text-red-600 whitespace-nowrap">
                        {entry.fromFund}
                      </TableCell>
                      <TableCell className="text-sm text-emerald-600 whitespace-nowrap">
                        {entry.toFund}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {formatNum(entry.amount)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {entry.description || '—'}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {entry.authBy || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {entry.transferDate}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={STATUS_VARIANTS[entry.status] || 'secondary'}>
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
                            aria-label="Edit transfer"
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label="Delete transfer"
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

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Transfer' : 'New Transfer'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="if-from" className="text-red-700">
                  From Fund
                </Label>
                <Input
                  id="if-from"
                  placeholder="e.g. General Fund"
                  value={form.fromFund}
                  onChange={(e) => updateField('fromFund', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="if-to" className="text-emerald-700">
                  To Fund
                </Label>
                <Input
                  id="if-to"
                  placeholder="e.g. Special Revenue Fund"
                  value={form.toFund}
                  onChange={(e) => updateField('toFund', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="if-amount">Amount</Label>
              <Input
                id="if-amount"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="if-desc">Description</Label>
              <Textarea
                id="if-desc"
                placeholder="Describe the purpose of this transfer..."
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="if-auth">Authorized By</Label>
                <Input
                  id="if-auth"
                  placeholder="e.g. Accountant General"
                  value={form.authBy}
                  onChange={(e) => updateField('authBy', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="if-date">Transfer Date</Label>
                <Input
                  id="if-date"
                  type="date"
                  value={form.transferDate}
                  onChange={(e) => updateField('transferDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="if-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => updateField('status', val)}
              >
                <SelectTrigger id="if-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
                  ? 'Update Transfer'
                  : 'Create Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Transfer
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this inter-fund transfer? This action cannot be undone.
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
