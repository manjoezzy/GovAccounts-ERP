'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  BookPlus,
  CheckCircle,
  FileText,
  AlertCircle,
  X,
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
import { Textarea } from '@/components/ui/textarea'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── Types ────────────────────────────────────────────────────────────────────

interface JournalLine {
  accountCode: string
  accountName: string
  debit: string
  credit: string
}

interface JournalEntry {
  id: string
  entryNo: string
  entryDate: string
  entryType: string
  narration: string
  reference: string
  status: string
  debitTotal: number
  creditTotal: number
  lines: JournalLine[]
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  entryNo: string
  entryDate: string
  entryType: string
  narration: string
  reference: string
  lines: JournalLine[]
}

const EMPTY_LINE: JournalLine = {
  accountCode: '',
  accountName: '',
  debit: '',
  credit: '',
}

const EMPTY_FORM: FormState = {
  entryNo: '',
  entryDate: new Date().toISOString().split('T')[0],
  entryType: 'general',
  narration: '',
  reference: '',
  lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }],
}

const ENTRY_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'adjusting', label: 'Adjusting' },
  { value: 'closing', label: 'Closing' },
  { value: 'correction', label: 'Correction' },
]

const TYPE_BADGE_CLASSES: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  adjusting: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
  closing: 'bg-violet-50 text-violet-700 hover:bg-violet-50',
  correction: 'bg-rose-50 text-rose-700 hover:bg-rose-50',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function JournalBook({ reportId }: ModuleProps) {
  // Data state
  const [entries, setEntries] = useState<JournalEntry[]>([])
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

  // ── Computed values ───────────────────────────────────────────────────────

  const totalDebit = form.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0)
  const totalCredit = form.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.005

  // ── Summary computation ───────────────────────────────────────────────────

  const totalEntries = entries.length
  const postedCount = entries.filter((e) => e.status === 'posted').length
  const draftCount = entries.filter((e) => e.status === 'draft').length

  // ── Fetch entries ─────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=journal&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch journal entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load journal entries')
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
    setForm({ ...EMPTY_FORM, lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }] })
    setFormOpen(true)
  }

  const openEditDialog = (entry: JournalEntry) => {
    setEditingId(entry.id)
    setForm({
      entryNo: entry.entryNo,
      entryDate: entry.entryDate,
      entryType: entry.entryType,
      narration: entry.narration || '',
      reference: entry.reference || '',
      lines: entry.lines && entry.lines.length > 0
        ? entry.lines.map((l) => ({
            accountCode: l.accountCode || '',
            accountName: l.accountName || '',
            debit: l.debit != null ? String(l.debit) : '',
            credit: l.credit != null ? String(l.credit) : '',
          }))
        : [{ ...EMPTY_LINE }, { ...EMPTY_LINE }],
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

  // ── Line management ───────────────────────────────────────────────────────

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { ...EMPTY_LINE }],
    }))
  }

  const removeLine = (index: number) => {
    if (form.lines.length <= 2) {
      toast.error('A journal entry must have at least 2 lines')
      return
    }
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }))
  }

  const updateLine = (index: number, field: keyof JournalLine, value: string) => {
    setForm((prev) => {
      const updatedLines = [...prev.lines]
      updatedLines[index] = { ...updatedLines[index], [field]: value }
      return { ...prev, lines: updatedLines }
    })
  }

  // ── Submit (Add / Edit) ──────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.entryNo.trim()) {
      toast.error('Entry number is required')
      return
    }
    if (!form.entryDate) {
      toast.error('Entry date is required')
      return
    }

    const hasEmptyAccount = form.lines.some(
      (l) => !l.accountCode.trim() || !l.accountName.trim()
    )
    if (hasEmptyAccount) {
      toast.error('All lines must have an account code and name')
      return
    }

    if (!isBalanced) {
      toast.error('Journal entry must be balanced (Debits = Credits)')
      return
    }

    try {
      setSubmitting(true)

      const lines = form.lines.map((l) => ({
        accountCode: l.accountCode.trim(),
        accountName: l.accountName.trim(),
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
      }))

      const body = {
        reportId,
        entryNo: form.entryNo.trim(),
        entryDate: form.entryDate,
        entryType: form.entryType,
        narration: form.narration.trim(),
        reference: form.reference.trim(),
        status: 'draft',
        debitTotal: totalDebit,
        creditTotal: totalCredit,
        lines,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=journal&id=${editingId}`
        : `/api/modules?module=journal&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} entry`)

      toast.success(`Journal entry ${isEditing ? 'updated' : 'added'} successfully`)
      setFormOpen(false)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Post ─────────────────────────────────────────────────────────────────

  const handlePost = async (entry: JournalEntry) => {
    try {
      const res = await fetch(`/api/modules?module=journal&id=${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entry,
          status: 'posted',
          reportId,
        }),
      })

      if (!res.ok) throw new Error('Failed to post entry')

      toast.success(`Entry ${entry.entryNo} posted successfully`)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to post entry')
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/modules?module=journal&id=${deletingId}`, {
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

  // ── Status badge renderer ─────────────────────────────────────────────────

  const renderStatusBadge = (status: string) => {
    if (status === 'posted') {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          Posted
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">
        <FileText className="mr-1 h-3 w-3" />
        Draft
      </Badge>
    )
  }

  // ── Truncate narration ────────────────────────────────────────────────────

  const truncate = (text: string, max: number = 40) => {
    if (!text) return '—'
    return text.length > max ? text.slice(0, max) + '…' : text
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Journal Book
          </h2>
          <p className="text-sm text-muted-foreground">
            Record adjusting entries, corrections, and non-routine transactions
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entries
            </CardTitle>
            <BookPlus className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {totalEntries}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Posted
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {postedCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft
            </CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {draftCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Entry List Table ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookPlus className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No journal entries yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;New Entry&quot; to record your first journal entry.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[110px]">Entry No</TableHead>
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead>Narration</TableHead>
                    <TableHead className="w-[110px]">Type</TableHead>
                    <TableHead className="text-right w-[110px]">Debit Total</TableHead>
                    <TableHead className="text-right w-[110px]">Credit Total</TableHead>
                    <TableHead className="w-[100px] text-center">Status</TableHead>
                    <TableHead className="w-[120px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {entry.entryNo}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {entry.entryDate}
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate text-sm"
                        title={entry.narration || ''}
                      >
                        {truncate(entry.narration)}
                      </TableCell>
                      <TableCell>
                        <Badge className={TYPE_BADGE_CLASSES[entry.entryType] || TYPE_BADGE_CLASSES.general}>
                          {ENTRY_TYPES.find((t) => t.value === entry.entryType)?.label || entry.entryType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNum(entry.debitTotal)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNum(entry.creditTotal)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderStatusBadge(entry.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {entry.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handlePost(entry)}
                              aria-label={`Post ${entry.entryNo}`}
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(entry)}
                            disabled={entry.status === 'posted'}
                            aria-label={`Edit ${entry.entryNo}`}
                          >
                            <Edit className={`h-3.5 w-3.5 ${entry.status === 'posted' ? 'text-slate-300' : 'text-slate-500'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label={`Delete ${entry.entryNo}`}
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Journal Entry' : 'New Journal Entry'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 overflow-y-auto flex-1">
            {/* Row: Entry No + Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entryNo">Entry No</Label>
                <Input
                  id="entryNo"
                  placeholder="e.g. JE-001"
                  value={form.entryNo}
                  onChange={(e) => updateField('entryNo', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entryDate">Date</Label>
                <Input
                  id="entryDate"
                  type="date"
                  value={form.entryDate}
                  onChange={(e) => updateField('entryDate', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Entry Type + Reference */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entryType">Entry Type</Label>
                <Select
                  value={form.entryType}
                  onValueChange={(val) => updateField('entryType', val)}
                >
                  <SelectTrigger id="entryType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTRY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  placeholder="e.g. INV-2024-0042"
                  value={form.reference}
                  onChange={(e) => updateField('reference', e.target.value)}
                />
              </div>
            </div>

            {/* Narration */}
            <div className="space-y-2">
              <Label htmlFor="narration">Narration</Label>
              <Textarea
                id="narration"
                placeholder="Describe the purpose of this journal entry..."
                rows={2}
                value={form.narration}
                onChange={(e) => updateField('narration', e.target.value)}
              />
            </div>

            {/* ── Dynamic Lines Section ────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-700">
                  Journal Lines
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLine}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Line
                </Button>
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_100px_100px_36px] gap-0 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                  <span>Account Code</span>
                  <span>Account Name</span>
                  <span className="text-right">Debit</span>
                  <span className="text-right">Credit</span>
                  <span />
                </div>

                <ScrollArea className="max-h-[240px]">
                  {form.lines.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        idx % 2 === 1
                          ? 'grid grid-cols-[1fr_1fr_100px_100px_36px] gap-1 bg-slate-50/60 px-3 py-2 items-center'
                          : 'grid grid-cols-[1fr_1fr_100px_100px_36px] gap-1 px-3 py-2 items-center'
                      }
                    >
                      <Input
                        className="h-8 text-sm"
                        placeholder="Code"
                        value={line.accountCode}
                        onChange={(e) => updateLine(idx, 'accountCode', e.target.value)}
                      />
                      <Input
                        className="h-8 text-sm"
                        placeholder="Account name"
                        value={line.accountName}
                        onChange={(e) => updateLine(idx, 'accountName', e.target.value)}
                      />
                      <Input
                        className="h-8 text-sm text-right font-mono"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={line.debit}
                        onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                      />
                      <Input
                        className="h-8 text-sm text-right font-mono"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={line.credit}
                        onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeLine(idx)}
                        aria-label={`Remove line ${idx + 1}`}
                      >
                        <X className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* ── Totals & Balance Indicator ─────────────────────────── */}
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-xs text-muted-foreground">Total Debit</span>
                      <p className="text-sm font-bold font-mono text-slate-900">
                        {formatNum(totalDebit)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Total Credit</span>
                      <p className="text-sm font-bold font-mono text-slate-900">
                        {formatNum(totalCredit)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isBalanced ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600">
                          Balanced
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium text-red-600">
                          Unbalanced (diff: {formatNum(totalDebit - totalCredit)})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !isBalanced}
            >
              {submitting
                ? 'Saving...'
                : editingId
                  ? 'Update Entry'
                  : 'Save Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete Journal Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this journal entry? This action cannot
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
