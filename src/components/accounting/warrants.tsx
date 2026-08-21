'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  ScrollText,
  TrendingUp,
  TrendingDown,
  Wallet,
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

interface Warrant {
  id: string
  warrantNo: string
  voteCode: string
  amount: number
  authority: string
  issueDate: string
  expiryDate: string
  utilized: number
  balance: number
  status: 'active' | 'expired' | 'utilized' | 'cancelled'
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  warrantNo: string
  voteCode: string
  amount: string
  authority: string
  issueDate: string
  expiryDate: string
  status: string
}

const EMPTY_FORM: FormState = {
  warrantNo: '',
  voteCode: '',
  amount: '',
  authority: '',
  issueDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  status: 'active',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  expired: 'secondary',
  utilized: 'outline',
  cancelled: 'destructive',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Warrants({ reportId }: ModuleProps) {
  const [entries, setEntries] = useState<Warrant[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Summary computation ─────────────────────────────────────────────────

  const totalIssued = entries.reduce((s, e) => s + e.amount, 0)
  const totalUtilized = entries.reduce((s, e) => s + e.utilized, 0)
  const availableBalance = totalIssued - totalUtilized

  // ── Fetch ───────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/modules?module=warrant&reportId=${reportId}`,
      )
      if (!res.ok) throw new Error('Failed to fetch warrants')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load warrants')
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

  const openEditDialog = (entry: Warrant) => {
    setEditingId(entry.id)
    setForm({
      warrantNo: entry.warrantNo,
      voteCode: entry.voteCode,
      amount: String(entry.amount),
      authority: entry.authority,
      issueDate: entry.issueDate,
      expiryDate: entry.expiryDate,
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
    if (!form.warrantNo.trim() || !form.voteCode.trim()) {
      toast.error('Warrant number and vote code are required')
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
        warrantNo: form.warrantNo.trim(),
        voteCode: form.voteCode.trim(),
        amount,
        authority: form.authority.trim(),
        issueDate: form.issueDate,
        expiryDate: form.expiryDate,
        status: form.status,
        utilized: 0,
        balance: amount,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=warrant&id=${editingId}`
        : `/api/modules?module=warrant&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} warrant`)

      toast.success(`Warrant ${isEditing ? 'updated' : 'issued'} successfully`)
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
      const res = await fetch(`/api/modules?module=warrant&id=${deletingId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete warrant')
      toast.success('Warrant deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete warrant')
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
            Warrant Authority Register
          </h2>
          <p className="text-sm text-muted-foreground">
            Track warrant issuance, utilization, and balances
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Issue Warrant
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Issued
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(totalIssued)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Utilized
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatNum(totalUtilized)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                availableBalance >= 0 ? 'text-slate-900' : 'text-red-600'
              }`}
            >
              {availableBalance < 0 ? '(' : ''}
              {formatNum(availableBalance)}
              {availableBalance < 0 ? ')' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="h-5 w-5" />
            Warrant Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScrollText className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No warrants issued yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Issue Warrant&quot; to authorize expenditure.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[120px]">Warrant #</TableHead>
                    <TableHead className="w-[100px]">Vote Code</TableHead>
                    <TableHead className="text-right w-[110px]">Amount</TableHead>
                    <TableHead className="w-[140px]">Authority</TableHead>
                    <TableHead className="w-[100px]">Issue Date</TableHead>
                    <TableHead className="w-[100px]">Expiry Date</TableHead>
                    <TableHead className="text-right w-[100px]">Utilized</TableHead>
                    <TableHead className="text-right w-[100px]">Balance</TableHead>
                    <TableHead className="w-[100px] text-center">Status</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => {
                    const isNeg = entry.balance < 0
                    return (
                      <TableRow
                        key={entry.id}
                        className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                      >
                        <TableCell className="font-mono text-sm font-medium whitespace-nowrap">
                          {entry.warrantNo}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {entry.voteCode}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(entry.amount)}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {entry.authority || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {entry.issueDate}
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {entry.expiryDate || '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-amber-600">
                          {formatNum(entry.utilized)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          <span className={isNeg ? 'text-red-600' : 'text-slate-900'}>
                            {isNeg ? '(' : ''}
                            {formatNum(entry.balance)}
                            {isNeg ? ')' : ''}
                          </span>
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
                              aria-label={`Edit warrant ${entry.warrantNo}`}
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(entry.id)}
                              aria-label={`Delete warrant ${entry.warrantNo}`}
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

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Warrant' : 'Issue Warrant'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wr-no">Warrant Number</Label>
                <Input
                  id="wr-no"
                  placeholder="WRT-001"
                  value={form.warrantNo}
                  onChange={(e) => updateField('warrantNo', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wr-vote">Vote Code</Label>
                <Input
                  id="wr-vote"
                  placeholder="V-101"
                  value={form.voteCode}
                  onChange={(e) => updateField('voteCode', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wr-amount">Amount</Label>
                <Input
                  id="wr-amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wr-authority">Authority</Label>
                <Input
                  id="wr-authority"
                  placeholder="e.g. Permanent Secretary"
                  value={form.authority}
                  onChange={(e) => updateField('authority', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wr-issue">Issue Date</Label>
                <Input
                  id="wr-issue"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => updateField('issueDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wr-expiry">Expiry Date</Label>
                <Input
                  id="wr-expiry"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => updateField('expiryDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wr-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => updateField('status', val)}
              >
                <SelectTrigger id="wr-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="utilized">Utilized</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  ? 'Update Warrant'
                  : 'Issue Warrant'}
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
              Delete Warrant
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this warrant? This action cannot be undone.
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
