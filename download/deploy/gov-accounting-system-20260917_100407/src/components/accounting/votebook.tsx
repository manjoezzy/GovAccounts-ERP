'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Edit, BookOpen, DollarSign, TrendingDown, AlertTriangle } from 'lucide-react'

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

interface VotebookEntry {
  id: string
  voteCode: string
  voteName: string
  originalAppropriation: number
  supplementaryAppropriation: number
  totalAppropriation: number
  actualExpenditure: number
  balance: number
  notes: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
 voteCode: string
  voteName: string
  originalAppropriation: string
  supplementaryAppropriation: string
  actualExpenditure: string
  notes: string
}

const EMPTY_FORM: FormState = {
  voteCode: '',
  voteName: '',
  originalAppropriation: '',
  supplementaryAppropriation: '',
  actualExpenditure: '',
  notes: '',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Votebook({ reportId }: ModuleProps) {
  // Data state
  const [entries, setEntries] = useState<VotebookEntry[]>([])
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

  const parsedOriginal = parseFloat(form.originalAppropriation) || 0
  const parsedSupplementary = parseFloat(form.supplementaryAppropriation) || 0
  const parsedActual = parseFloat(form.actualExpenditure) || 0
  const computedTotal = parsedOriginal + parsedSupplementary
  const computedBalance = computedTotal - parsedActual

  // ── Summary computation ───────────────────────────────────────────────────

  const totalAppropriation = entries.reduce((sum, e) => sum + e.totalAppropriation, 0)
  const totalActual = entries.reduce((sum, e) => sum + e.actualExpenditure, 0)
  const totalBalance = entries.reduce((sum, e) => sum + e.balance, 0)

  // ── Fetch entries ─────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=votebook&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch votebook entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load votebook entries')
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

  const openEditDialog = (entry: VotebookEntry) => {
    setEditingId(entry.id)
    setForm({
      voteCode: entry.voteCode,
      voteName: entry.voteName,
      originalAppropriation: String(entry.originalAppropriation),
      supplementaryAppropriation: String(entry.supplementaryAppropriation),
      actualExpenditure: String(entry.actualExpenditure),
      notes: entry.notes || '',
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
    if (!form.voteCode.trim() || !form.voteName.trim()) {
      toast.error('Vote code and name are required')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        voteCode: form.voteCode.trim(),
        voteName: form.voteName.trim(),
        originalAppropriation: parsedOriginal,
        supplementaryAppropriation: parsedSupplementary,
        totalAppropriation: computedTotal,
        actualExpenditure: parsedActual,
        balance: computedBalance,
        notes: form.notes.trim(),
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=votebook&id=${editingId}`
        : `/api/modules?module=votebook&reportId=${reportId}`

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

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/modules?module=votebook&id=${deletingId}`, {
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Votebook
          </h2>
          <p className="text-sm text-muted-foreground">
            Budget allocation tracking by vote/code
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
              Total Appropriation
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalAppropriation)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Actual
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalActual)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
            {totalBalance < 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <DollarSign className="h-4 w-4 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                totalBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatNum(totalBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5" />
            Vote Entries
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
                No votebook entries yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Entry&quot; to start tracking budget allocations.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[120px]">Vote Code</TableHead>
                    <TableHead>Vote Name</TableHead>
                    <TableHead className="text-right">Original Appr.</TableHead>
                    <TableHead className="text-right">Supplementary</TableHead>
                    <TableHead className="text-right">Total Appr.</TableHead>
                    <TableHead className="text-right">Actual Exp.</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
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
                        <TableCell className="font-mono text-sm font-medium">
                          {entry.voteCode}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {entry.voteName}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(entry.originalAppropriation)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(entry.supplementaryAppropriation)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {formatNum(entry.totalAppropriation)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(entry.actualExpenditure)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          <span
                            className={
                              isNeg
                                ? 'text-red-600'
                                : 'text-emerald-600'
                            }
                          >
                            {isNeg ? '(' : ''}
                            {formatNum(entry.balance)}
                            {isNeg ? ')' : ''}
                          </span>
                          {isNeg && (
                            <Badge
                              variant="destructive"
                              className="ml-2 text-[10px] px-1.5 py-0"
                            >
                              Over
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(entry)}
                              aria-label={`Edit ${entry.voteCode}`}
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(entry.id)}
                              aria-label={`Delete ${entry.voteCode}`}
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Vote Entry' : 'Add Vote Entry'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row: Vote Code + Vote Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="voteCode">Vote Code</Label>
                <Input
                  id="voteCode"
                  placeholder="e.g. V-101"
                  value={form.voteCode}
                  onChange={(e) => updateField('voteCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voteName">Vote Name</Label>
                <Input
                  id="voteName"
                  placeholder="e.g. Personnel Emoluments"
                  value={form.voteName}
                  onChange={(e) => updateField('voteName', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Original + Supplementary Appropriation */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="originalAppropriation">Original Appropriation</Label>
                <Input
                  id="originalAppropriation"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.originalAppropriation}
                  onChange={(e) => updateField('originalAppropriation', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplementaryAppropriation">Supplementary</Label>
                <Input
                  id="supplementaryAppropriation"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.supplementaryAppropriation}
                  onChange={(e) =>
                    updateField('supplementaryAppropriation', e.target.value)
                  }
                />
              </div>
            </div>

            {/* Auto-computed: Total Appropriation */}
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Appropriation
                </span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {formatNum(computedTotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Auto-calculated: Original + Supplementary
              </p>
            </div>

            {/* Actual Expenditure */}
            <div className="space-y-2">
              <Label htmlFor="actualExpenditure">Actual Expenditure</Label>
              <Input
                id="actualExpenditure"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.actualExpenditure}
                onChange={(e) => updateField('actualExpenditure', e.target.value)}
              />
            </div>

            {/* Auto-computed: Balance */}
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Balance
                </span>
                <span
                  className={`text-sm font-bold font-mono ${
                    computedBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {computedBalance < 0 ? '(' : ''}
                  {formatNum(computedBalance)}
                  {computedBalance < 0 ? ')' : ''}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Auto-calculated: Total Appropriation − Actual Expenditure
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Optional notes..."
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
              />
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
              Delete Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this votebook entry? This action cannot
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
