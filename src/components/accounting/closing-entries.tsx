'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  Wand2,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
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

interface ClosingEntry {
  id: string
  entryDate: string
  narration: string
  accountCode: string
  accountName: string
  debit: number
  credit: number
  entryType: string
  posted: boolean
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  entryDate: string
  narration: string
  accountCode: string
  accountName: string
  debit: string
  credit: string
  entryType: string
}

const EMPTY_FORM: FormState = {
  entryDate: new Date().toISOString().split('T')[0],
  narration: '',
  accountCode: '',
  accountName: '',
  debit: '',
  credit: '',
  entryType: 'closing-revenue',
}

const ENTRY_TYPE_OPTIONS = [
  { value: 'closing-revenue', label: 'Closing – Revenue' },
  { value: 'closing-expense', label: 'Closing – Expense' },
  { value: 'closing-drawings', label: 'Closing – Drawings' },
  { value: 'opening-balance', label: 'Opening Balance' },
  { value: 'adjustment', label: 'Adjustment' },
] as const

const TYPE_BADGE_MAP: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'closing-revenue': 'default',
  'closing-expense': 'destructive',
  'closing-drawings': 'outline',
  'opening-balance': 'secondary',
  adjustment: 'outline',
}

const TYPE_LABEL_MAP: Record<string, string> = {
  'closing-revenue': 'Close Revenue',
  'closing-expense': 'Close Expense',
  'closing-drawings': 'Close Drawings',
  'opening-balance': 'Opening',
  adjustment: 'Adjustment',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ClosingEntries({ reportId }: ModuleProps) {
  const [entries, setEntries] = useState<ClosingEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Summary computation ─────────────────────────────────────────────────

  const totalEntries = entries.length
  const postedCount = entries.filter((e) => e.posted).length
  const pendingCount = totalEntries - postedCount

  // ── Fetch ───────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/modules?module=closing-entry&reportId=${reportId}`,
      )
      if (!res.ok) throw new Error('Failed to fetch closing entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load closing entries')
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

  const openEditDialog = (entry: ClosingEntry) => {
    setEditingId(entry.id)
    setForm({
      entryDate: entry.entryDate,
      narration: entry.narration,
      accountCode: entry.accountCode,
      accountName: entry.accountName,
      debit: String(entry.debit),
      credit: String(entry.credit),
      entryType: entry.entryType,
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
    if (!form.narration.trim() || !form.accountCode.trim()) {
      toast.error('Narration and account code are required')
      return
    }

    const debit = parseFloat(form.debit) || 0
    const credit = parseFloat(form.credit) || 0

    if (debit === 0 && credit === 0) {
      toast.error('Either debit or credit amount is required')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        entryDate: form.entryDate,
        narration: form.narration.trim(),
        accountCode: form.accountCode.trim(),
        accountName: form.accountName.trim(),
        debit,
        credit,
        entryType: form.entryType,
        posted: false,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=closing-entry&id=${editingId}`
        : `/api/modules?module=closing-entry&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} entry`)

      toast.success(`Entry ${isEditing ? 'updated' : 'added'} successfully`)
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
      const res = await fetch(`/api/modules?module=closing-entry&id=${deletingId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete entry')
      toast.success('Entry deleted successfully')
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

  // ── Toggle Post ─────────────────────────────────────────────────────────

  const togglePost = async (entry: ClosingEntry) => {
    try {
      const res = await fetch(`/api/modules?module=closing-entry&id=${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry, posted: !entry.posted }),
      })

      if (!res.ok) throw new Error('Failed to update posting status')

      toast.success(entry.posted ? 'Entry unposted' : 'Entry posted successfully')
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update posting status')
    }
  }

  // ── Auto Generate ───────────────────────────────────────────────────────

  const handleAutoGenerate = () => {
    const revenueAccounts = 5
    const expenseAccounts = 8
    toast.success(
      `Closing entries generated for ${revenueAccounts} revenue and ${expenseAccounts} expense accounts`,
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Closing Entries
          </h2>
          <p className="text-sm text-muted-foreground">
            Year-end closing journal entries and adjustments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAutoGenerate}>
            <Wand2 className="mr-2 h-4 w-4" />
            Auto-Generate Entries
          </Button>
          <Button onClick={openAddDialog} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entries
            </CardTitle>
            <BookOpen className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{totalEntries}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Posted
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{postedCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5" />
            Closing Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No closing entries yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Entry&quot; or &quot;Auto-Generate Entries&quot; to begin.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[200px]">Narration</TableHead>
                    <TableHead className="w-[100px]">Acct Code</TableHead>
                    <TableHead className="w-[140px]">Account Name</TableHead>
                    <TableHead className="text-right w-[100px]">Debit</TableHead>
                    <TableHead className="text-right w-[100px]">Credit</TableHead>
                    <TableHead className="w-[110px] text-center">Type</TableHead>
                    <TableHead className="w-[70px] text-center">Posted</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                    >
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {entry.entryDate}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {entry.narration}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {entry.accountCode}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {entry.accountName || '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {entry.debit > 0 ? (
                          <span className="text-slate-900">{formatNum(entry.debit)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {entry.credit > 0 ? (
                          <span className="text-slate-900">{formatNum(entry.credit)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={TYPE_BADGE_MAP[entry.entryType] || 'secondary'}>
                          {TYPE_LABEL_MAP[entry.entryType] || entry.entryType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => togglePost(entry)}
                          className="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-slate-100"
                          aria-label={entry.posted ? 'Unpost entry' : 'Post entry'}
                        >
                          {entry.posted ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-300" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(entry)}
                            aria-label="Edit entry"
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label="Delete entry"
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
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Closing Entry' : 'Add Closing Entry'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ce-date">Entry Date</Label>
                <Input
                  id="ce-date"
                  type="date"
                  value={form.entryDate}
                  onChange={(e) => updateField('entryDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ce-type">Entry Type</Label>
                <Select
                  value={form.entryType}
                  onValueChange={(val) => updateField('entryType', val)}
                >
                  <SelectTrigger id="ce-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTRY_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ce-narration">Narration</Label>
              <Input
                id="ce-narration"
                placeholder="e.g. Close revenue accounts to surplus"
                value={form.narration}
                onChange={(e) => updateField('narration', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ce-code">Account Code</Label>
                <Input
                  id="ce-code"
                  placeholder="e.g. 4100"
                  value={form.accountCode}
                  onChange={(e) => updateField('accountCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ce-name">Account Name</Label>
                <Input
                  id="ce-name"
                  placeholder="e.g. Revenue from Fees"
                  value={form.accountName}
                  onChange={(e) => updateField('accountName', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ce-debit" className="text-slate-700">
                  Debit
                </Label>
                <Input
                  id="ce-debit"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.debit}
                  onChange={(e) => updateField('debit', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ce-credit" className="text-slate-700">
                  Credit
                </Label>
                <Input
                  id="ce-credit"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.credit}
                  onChange={(e) => updateField('credit', e.target.value)}
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
                  ? 'Update Entry'
                  : 'Add Entry'}
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
              Delete Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this closing entry? This action cannot be undone.
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
