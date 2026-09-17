'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  HandCoins,
  TrendingDown,
  TrendingUp,
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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── Types ────────────────────────────────────────────────────────────────────

interface GrantEntry {
  id: string
  grantName: string
  donor: string
  grantType: string
  totalAmount: number
  drawnDown: number
  expended: number
  balance: number
  conditions: string
  startDate: string
  endDate: string
  status: string
  createdAt: string
  updatedAt: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  grantName: string
  donor: string
  grantType: string
  totalAmount: string
  drawnDown: string
  expended: string
  conditions: string
  startDate: string
  endDate: string
  status: string
}

const EMPTY_FORM: FormState = {
  grantName: '',
  donor: '',
  grantType: 'development',
  totalAmount: '',
  drawnDown: '',
  expended: '',
  conditions: '',
  startDate: '',
  endDate: '',
  status: 'active',
}

const GRANT_TYPE_OPTIONS = [
  { value: 'development', label: 'Development' },
  { value: 'project', label: 'Project' },
  { value: 'programme', label: 'Programme' },
  { value: 'technical-assistance', label: 'Technical Assistance' },
  { value: 'other', label: 'Other' },
] as const

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function GrantRegister({ reportId }: ModuleProps) {
  const [entries, setEntries] = useState<GrantEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Summary computation ───────────────────────────────────────────────────

  const totalGrants = entries.reduce((sum, e) => sum + e.totalAmount, 0)
  const totalDrawnDown = entries.reduce((sum, e) => sum + e.drawnDown, 0)
  const totalExpended = entries.reduce((sum, e) => sum + e.expended, 0)
  const availableBalance = entries.reduce((sum, e) => sum + e.balance, 0)

  // Auto-computed balance from form
  const total = parseFloat(form.totalAmount) || 0
  const drawn = parseFloat(form.drawnDown) || 0
  const expended = parseFloat(form.expended) || 0
  const formBalance = total - drawn

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=grant&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch grant entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load grant entries')
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

  const openEditDialog = (entry: GrantEntry) => {
    setEditingId(entry.id)
    setForm({
      grantName: entry.grantName,
      donor: entry.donor,
      grantType: entry.grantType,
      totalAmount: String(entry.totalAmount),
      drawnDown: String(entry.drawnDown),
      expended: String(entry.expended),
      conditions: entry.conditions,
      startDate: entry.startDate,
      endDate: entry.endDate,
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
    if (!form.grantName.trim() || !form.donor.trim()) {
      toast.error('Grant name and donor are required')
      return
    }

    const parsedTotal = parseFloat(form.totalAmount)
    if (!parsedTotal || parsedTotal <= 0) {
      toast.error('A valid positive total amount is required')
      return
    }

    const drawn = parseFloat(form.drawnDown) || 0
    const expended = parseFloat(form.expended) || 0
    const balance = parsedTotal - drawn

    if (drawn < 0 || expended < 0) {
      toast.error('Drawn down and expended amounts must be non-negative')
      return
    }

    if (drawn > parsedTotal) {
      toast.error('Drawn down cannot exceed total amount')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        grantName: form.grantName.trim(),
        donor: form.donor.trim(),
        grantType: form.grantType,
        totalAmount: parsedTotal,
        drawnDown: drawn,
        expended,
        balance,
        conditions: form.conditions.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=grant&id=${editingId}`
        : `/api/modules?module=grant&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} grant`)

      toast.success(`Grant ${isEditing ? 'updated' : 'added'} successfully`)
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
      const res = await fetch(`/api/modules?module=grant&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete grant')

      toast.success('Grant deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete grant')
    } finally {
      setDeleting(false)
    }
  }

  // ── Badge helpers ─────────────────────────────────────────────────────────

  const grantTypeBadge = (type: string) => {
    switch (type) {
      case 'development':
        return <Badge variant="default">Development</Badge>
      case 'project':
        return <Badge variant="secondary">Project</Badge>
      case 'programme':
        return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">Programme</Badge>
      case 'technical-assistance':
        return <Badge variant="outline">Tech. Assistance</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
      case 'completed':
        return <Badge variant="default">Completed</Badge>
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Suspended</Badge>
      case 'closed':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">Closed</Badge>
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
            Grant Register
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage donor grants, drawdowns, and expenditure tracking
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Grant
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Grants
            </CardTitle>
            <HandCoins className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalGrants)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Drawn Down
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatNum(totalDrawnDown)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expended
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(totalExpended)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(availableBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HandCoins className="h-5 w-5" />
            Grant Register Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HandCoins className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No grants recorded yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Grant&quot; to start tracking donor funding.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="min-w-[160px]">Grant Name</TableHead>
                    <TableHead className="w-[120px]">Donor</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="text-right w-[110px]">Total</TableHead>
                    <TableHead className="text-right w-[100px]">Drawn</TableHead>
                    <TableHead className="text-right w-[100px]">Expended</TableHead>
                    <TableHead className="text-right w-[100px]">Balance</TableHead>
                    <TableHead className="w-[180px]">Drawdown Progress</TableHead>
                    <TableHead className="w-[110px]">Dates</TableHead>
                    <TableHead className="w-[100px] text-center">Status</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => {
                    const drawdownPct = entry.totalAmount > 0
                      ? Math.min(100, Math.round((entry.drawnDown / entry.totalAmount) * 100))
                      : 0
                    return (
                      <TableRow
                        key={entry.id}
                        className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                      >
                        <TableCell className="font-medium max-w-[160px] truncate">
                          {entry.grantName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.donor}
                        </TableCell>
                        <TableCell>
                          {grantTypeBadge(entry.grantType)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(entry.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-amber-600">
                          {formatNum(entry.drawnDown)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {entry.expended > 0 ? formatNum(entry.expended) : <span className="text-slate-300">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium text-emerald-600">
                          {formatNum(entry.balance)}
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <Progress value={drawdownPct} className="h-2 flex-1" />
                            <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                              {drawdownPct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {entry.startDate && entry.endDate
                            ? `${entry.startDate} — ${entry.endDate}`
                            : entry.startDate || entry.endDate || '—'}
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
                              aria-label={`Edit grant ${entry.grantName}`}
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(entry.id)}
                              aria-label={`Delete grant ${entry.grantName}`}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Grant' : 'Add New Grant'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row: Grant Name + Donor */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grt-name">Grant Name</Label>
                <Input
                  id="grt-name"
                  placeholder="e.g. Education Sector Support"
                  value={form.grantName}
                  onChange={(e) => updateField('grantName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grt-donor">Donor</Label>
                <Input
                  id="grt-donor"
                  placeholder="e.g. World Bank"
                  value={form.donor}
                  onChange={(e) => updateField('donor', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Grant Type + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grt-type">Grant Type</Label>
                <Select
                  value={form.grantType}
                  onValueChange={(val) => updateField('grantType', val)}
                >
                  <SelectTrigger id="grt-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRANT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grt-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => updateField('status', val)}
                >
                  <SelectTrigger id="grt-status">
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

            {/* Row: Total Amount + Drawn Down */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grt-total">Total Amount</Label>
                <Input
                  id="grt-total"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.totalAmount}
                  onChange={(e) => updateField('totalAmount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grt-drawn">Drawn Down</Label>
                <Input
                  id="grt-drawn"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.drawnDown}
                  onChange={(e) => updateField('drawnDown', e.target.value)}
                  className="border-amber-200 focus-visible:ring-amber-500"
                />
              </div>
            </div>

            {/* Expended */}
            <div className="space-y-2">
              <Label htmlFor="grt-expended">Expended</Label>
              <Input
                id="grt-expended"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.expended}
                onChange={(e) => updateField('expended', e.target.value)}
              />
            </div>

            {/* Auto-computed balance display */}
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Computed Balance (Total − Drawn): </span>
              <span className="font-mono font-bold text-emerald-600">
                {formatNum(formBalance)}
              </span>
              {total > 0 && (
                <span className="ml-3 text-muted-foreground">Drawdown: </span>
              )}
              {total > 0 && (
                <span className="font-mono font-bold">
                  {Math.min(100, Math.round((drawn / total) * 100))}%
                </span>
              )}
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <Label htmlFor="grt-conditions">Conditions / Covenants</Label>
              <Textarea
                id="grt-conditions"
                placeholder="Any conditions attached to this grant..."
                value={form.conditions}
                onChange={(e) => updateField('conditions', e.target.value)}
                rows={3}
              />
            </div>

            {/* Row: Start Date + End Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grt-start">Start Date</Label>
                <Input
                  id="grt-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grt-end">End Date</Label>
                <Input
                  id="grt-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
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
                  ? 'Update Grant'
                  : 'Add Grant'}
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
              Delete Grant
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this grant? This action cannot be undone.
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
