'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  ShoppingCart,
  Package,
  Gavel,
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

interface ProcurementItem {
  id: string
  itemDescription: string
  voteCode: string
  estimatedCost: number
  procurementMethod: string
  plannedDate: string
  status: string
  createdAt: string
  updatedAt: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  itemDescription: string
  voteCode: string
  estimatedCost: string
  procurementMethod: string
  plannedDate: string
  status: string
}

const EMPTY_FORM: FormState = {
  itemDescription: '',
  voteCode: '',
  estimatedCost: '',
  procurementMethod: 'open',
  plannedDate: new Date().toISOString().split('T')[0],
  status: 'planned',
}

const METHOD_OPTIONS = [
  { value: 'open', label: 'Open Tender' },
  { value: 'restricted', label: 'Restricted Tender' },
  { value: 'direct', label: 'Direct Procurement' },
  { value: 'quotation', label: 'Request for Quotation' },
] as const

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'deferred', label: 'Deferred' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function Procurement({ reportId }: ModuleProps) {
  const [items, setItems] = useState<ProcurementItem[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Summary computation ───────────────────────────────────────────────────

  const totalPlanned = items.reduce((sum, i) => sum + i.estimatedCost, 0)
  const totalItems = items.length
  const openMethodCount = items.filter(
    (i) => i.procurementMethod === 'open'
  ).length

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/modules?module=procurement&reportId=${reportId}`
      )
      if (!res.ok) throw new Error('Failed to fetch procurement items')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load procurement plan')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEditDialog = (item: ProcurementItem) => {
    setEditingId(item.id)
    setForm({
      itemDescription: item.itemDescription,
      voteCode: item.voteCode,
      estimatedCost: String(item.estimatedCost),
      procurementMethod: item.procurementMethod,
      plannedDate: item.plannedDate,
      status: item.status,
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
    if (!form.itemDescription.trim()) {
      toast.error('Item description is required')
      return
    }

    const parsedCost = parseFloat(form.estimatedCost)
    if (!parsedCost || parsedCost <= 0) {
      toast.error('A valid positive estimated cost is required')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        itemDescription: form.itemDescription.trim(),
        voteCode: form.voteCode.trim(),
        estimatedCost: parsedCost,
        procurementMethod: form.procurementMethod,
        plannedDate: form.plannedDate,
        status: form.status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=procurement&id=${editingId}`
        : `/api/modules?module=procurement&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok)
        throw new Error(
          `Failed to ${isEditing ? 'update' : 'create'} procurement item`
        )

      toast.success(
        `Procurement item ${isEditing ? 'updated' : 'added'} successfully`
      )
      setFormOpen(false)
      fetchItems()
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
      const res = await fetch(
        `/api/modules?module=procurement&id=${deletingId}`,
        { method: 'DELETE' }
      )

      if (!res.ok) throw new Error('Failed to delete procurement item')

      toast.success('Procurement item deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchItems()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete procurement item')
    } finally {
      setDeleting(false)
    }
  }

  // ── Badge helpers ─────────────────────────────────────────────────────────

  const methodBadge = (method: string) => {
    switch (method) {
      case 'open':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Open Tender
          </Badge>
        )
      case 'restricted':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            Restricted
          </Badge>
        )
      case 'direct':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Direct
          </Badge>
        )
      case 'quotation':
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
            Quotation
          </Badge>
        )
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">
            Planned
          </Badge>
        )
      case 'in-progress':
        return (
          <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
            In Progress
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Completed
          </Badge>
        )
      case 'deferred':
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            Deferred
          </Badge>
        )
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
            Procurement Plan
          </h2>
          <p className="text-sm text-muted-foreground">
            Plan and track procurement activities for the fiscal year
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Planned
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalPlanned)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{totalItems}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              By Open Method
            </CardTitle>
            <Gavel className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {openMethodCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-5 w-5" />
            Procurement Plan Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No procurement items planned yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Item&quot; to start building your procurement plan.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="min-w-[180px]">
                      Item Description
                    </TableHead>
                    <TableHead className="w-[100px]">Vote Code</TableHead>
                    <TableHead className="text-right w-[120px]">
                      Est. Cost
                    </TableHead>
                    <TableHead className="w-[140px]">
                      Procurement Method
                    </TableHead>
                    <TableHead className="w-[120px]">Planned Date</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[90px] text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                    >
                      <TableCell className="text-sm font-medium">
                        {item.itemDescription || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.voteCode || '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNum(item.estimatedCost)}
                      </TableCell>
                      <TableCell>{methodBadge(item.procurementMethod)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {item.plannedDate || '—'}
                      </TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(item)}
                            aria-label={`Edit ${item.itemDescription}`}
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(item.id)}
                            aria-label={`Delete ${item.itemDescription}`}
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
              {editingId ? 'Edit Procurement Item' : 'Add New Procurement Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Item Description */}
            <div className="space-y-2">
              <Label htmlFor="proc-desc">Item Description</Label>
              <Input
                id="proc-desc"
                placeholder="e.g. Office Furniture and Equipment"
                value={form.itemDescription}
                onChange={(e) => updateField('itemDescription', e.target.value)}
              />
            </div>

            {/* Vote Code + Estimated Cost */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="proc-vote">Vote Code</Label>
                <Input
                  id="proc-vote"
                  placeholder="e.g. V-301"
                  value={form.voteCode}
                  onChange={(e) => updateField('voteCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proc-cost" className="text-primary">
                  Estimated Cost
                </Label>
                <Input
                  id="proc-cost"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.estimatedCost}
                  onChange={(e) => updateField('estimatedCost', e.target.value)}
                  className="border-primary/30 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Procurement Method + Planned Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="proc-method">Procurement Method</Label>
                <Select
                  value={form.procurementMethod}
                  onValueChange={(val) => updateField('procurementMethod', val)}
                >
                  <SelectTrigger id="proc-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proc-date">Planned Date</Label>
                <Input
                  id="proc-date"
                  type="date"
                  value={form.plannedDate}
                  onChange={(e) => updateField('plannedDate', e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="proc-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => updateField('status', val)}
              >
                <SelectTrigger id="proc-status">
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? 'Saving...'
                : editingId
                  ? 'Update Item'
                  : 'Add Item'}
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
              Delete Procurement Item
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this procurement item? This action
            cannot be undone.
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
