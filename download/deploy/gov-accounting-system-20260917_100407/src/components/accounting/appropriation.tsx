'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  BarChart3,
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
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── Types ────────────────────────────────────────────────────────────────────

interface AppropriationEntry {
  id: string
  voteCode: string
  voteName: string
  initialAppropriation: number
  supplementaryAppropriation: number
  virementIn: number
  virementOut: number
  revisedAppropriation: number
  actualExpenditure: number
  savingsOverSpent: number
  status: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  voteCode: string
  voteName: string
  initialAppropriation: string
  supplementaryAppropriation: string
  virementIn: string
  virementOut: string
  actualExpenditure: string
}

const EMPTY_FORM: FormState = {
  voteCode: '',
  voteName: '',
  initialAppropriation: '',
  supplementaryAppropriation: '',
  virementIn: '',
  virementOut: '',
  actualExpenditure: '',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Appropriation({ reportId }: ModuleProps) {
  const [entries, setEntries] = useState<AppropriationEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Computed form values ────────────────────────────────────────────────

  const computedRevised =
    (parseFloat(form.initialAppropriation) || 0) +
    (parseFloat(form.supplementaryAppropriation) || 0) +
    (parseFloat(form.virementIn) || 0) -
    (parseFloat(form.virementOut) || 0)

  const computedSavings =
    computedRevised - (parseFloat(form.actualExpenditure) || 0)

  // ── Summary computation ─────────────────────────────────────────────────

  const totalInitial = entries.reduce((s, e) => s + e.initialAppropriation, 0)
  const totalRevised = entries.reduce((s, e) => s + e.revisedAppropriation, 0)
  const totalActual = entries.reduce((s, e) => s + e.actualExpenditure, 0)
  const netSavings = entries.reduce((s, e) => s + e.savingsOverSpent, 0)

  // ── Fetch ───────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/modules?module=appropriation&reportId=${reportId}`,
      )
      if (!res.ok) throw new Error('Failed to fetch appropriation entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load appropriation entries')
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

  const openEditDialog = (entry: AppropriationEntry) => {
    setEditingId(entry.id)
    setForm({
      voteCode: entry.voteCode,
      voteName: entry.voteName,
      initialAppropriation: String(entry.initialAppropriation),
      supplementaryAppropriation: String(entry.supplementaryAppropriation),
      virementIn: String(entry.virementIn),
      virementOut: String(entry.virementOut),
      actualExpenditure: String(entry.actualExpenditure),
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
    if (!form.voteCode.trim() || !form.voteName.trim()) {
      toast.error('Vote code and vote name are required')
      return
    }

    const initialAppropriation = parseFloat(form.initialAppropriation) || 0
    const supplementaryAppropriation = parseFloat(form.supplementaryAppropriation) || 0
    const virementIn = parseFloat(form.virementIn) || 0
    const virementOut = parseFloat(form.virementOut) || 0
    const actualExpenditure = parseFloat(form.actualExpenditure) || 0

    const revisedAppropriation = initialAppropriation + supplementaryAppropriation + virementIn - virementOut
    const savingsOverSpent = revisedAppropriation - actualExpenditure

    const status = savingsOverSpent >= 0 ? 'savings' : 'over-expenditure'

    try {
      setSubmitting(true)

      const body = {
        reportId,
        voteCode: form.voteCode.trim(),
        voteName: form.voteName.trim(),
        initialAppropriation,
        supplementaryAppropriation,
        virementIn,
        virementOut,
        revisedAppropriation,
        actualExpenditure,
        savingsOverSpent,
        status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=appropriation&id=${editingId}`
        : `/api/modules?module=appropriation&reportId=${reportId}`

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
      const res = await fetch(`/api/modules?module=appropriation&id=${deletingId}`, {
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

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Appropriation Account
          </h2>
          <p className="text-sm text-muted-foreground">
            Budget versus actual expenditure analysis by vote
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Initial
            </CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalInitial)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revised
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatNum(totalRevised)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Actual
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatNum(totalActual)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Savings/(Over)
            </CardTitle>
            {netSavings >= 0 ? (
              <TrendingDown className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                netSavings >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {netSavings < 0 ? '(' : ''}{formatNum(netSavings)}{netSavings < 0 ? ')' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-5 w-5" />
            Appropriation Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSpreadsheet className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No appropriation entries yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Entry&quot; to start recording budget allocations.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[90px]">Vote Code</TableHead>
                    <TableHead className="w-[140px]">Vote Name</TableHead>
                    <TableHead className="text-right w-[90px]">Initial</TableHead>
                    <TableHead className="text-right w-[90px]">Suppl.</TableHead>
                    <TableHead className="text-right w-[80px]">Vir. In</TableHead>
                    <TableHead className="text-right w-[80px]">Vir. Out</TableHead>
                    <TableHead className="text-right w-[90px]">Revised</TableHead>
                    <TableHead className="text-right w-[90px]">Actual</TableHead>
                    <TableHead className="text-right w-[100px]">Savings/(Over)</TableHead>
                    <TableHead className="w-[80px] text-center">Status</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => {
                    const isSavings = entry.savingsOverSpent >= 0
                    return (
                      <TableRow
                        key={entry.id}
                        className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                      >
                        <TableCell className="font-mono text-sm font-medium whitespace-nowrap">
                          {entry.voteCode}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {entry.voteName}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(entry.initialAppropriation)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(entry.supplementaryAppropriation)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-emerald-600">
                          {formatNum(entry.virementIn)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-red-600">
                          {formatNum(entry.virementOut)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {formatNum(entry.revisedAppropriation)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(entry.actualExpenditure)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          <span className={isSavings ? 'text-emerald-600' : 'text-red-600'}>
                            {!isSavings ? '(' : ''}{formatNum(entry.savingsOverSpent)}{!isSavings ? ')' : ''}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={isSavings ? 'default' : 'destructive'}>
                            {isSavings ? 'Savings' : 'Over'}
                          </Badge>
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

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Appropriation Entry' : 'Add Appropriation Entry'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ap-code">Vote Code</Label>
                <Input
                  id="ap-code"
                  placeholder="V-101"
                  value={form.voteCode}
                  onChange={(e) => updateField('voteCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-name">Vote Name</Label>
                <Input
                  id="ap-name"
                  placeholder="Personnel Emoluments"
                  value={form.voteName}
                  onChange={(e) => updateField('voteName', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ap-initial">Initial Appropriation</Label>
                <Input
                  id="ap-initial"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.initialAppropriation}
                  onChange={(e) => updateField('initialAppropriation', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-suppl">Supplementary</Label>
                <Input
                  id="ap-suppl"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.supplementaryAppropriation}
                  onChange={(e) => updateField('supplementaryAppropriation', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-actual">Actual Expenditure</Label>
                <Input
                  id="ap-actual"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.actualExpenditure}
                  onChange={(e) => updateField('actualExpenditure', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ap-vir-in" className="text-emerald-700">
                  Virement In
                </Label>
                <Input
                  id="ap-vir-in"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.virementIn}
                  onChange={(e) => updateField('virementIn', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-vir-out" className="text-red-700">
                  Virement Out
                </Label>
                <Input
                  id="ap-vir-out"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.virementOut}
                  onChange={(e) => updateField('virementOut', e.target.value)}
                />
              </div>
            </div>

            {/* Auto-computed display */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Computed Revised Appropriation</Label>
                <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 font-mono text-sm font-bold">
                  {formatNum(computedRevised)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Computed Savings/(Over)</Label>
                <div
                  className={`flex h-10 items-center rounded-md border px-3 font-mono text-sm font-bold ${
                    computedSavings >= 0
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                      : 'border-red-200 bg-red-50 text-red-600'
                  }`}
                >
                  {computedSavings < 0 ? '(' : ''}{formatNum(computedSavings)}{computedSavings < 0 ? ')' : ''}
                </div>
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
            Are you sure you want to delete this appropriation entry? This action cannot be undone.
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
