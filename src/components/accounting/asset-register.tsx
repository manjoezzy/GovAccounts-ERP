'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus, Trash2, Edit, Building, DollarSign, TrendingDown,
  AlertTriangle, Package,
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
  DialogDescription,
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

interface AssetEntry {
  id: string
  assetNumber: string
  description: string
  category: string
  location: string
  dateAcquired: string
  acquisitionCost: number
  accumulatedDep: number
  netBookValue: number
  depreciationRate: number
  usefulLife: number
  status: string
}

interface ModuleProps {
  reportId: string
}

type FormState = {
  assetNumber: string
  description: string
  category: string
  location: string
  dateAcquired: string
  acquisitionCost: string
  depreciationRate: string
  usefulLife: string
  status: string
}

const EMPTY_FORM: FormState = {
  assetNumber: '',
  description: '',
  category: 'ppe',
  location: '',
  dateAcquired: '',
  acquisitionCost: '',
  depreciationRate: '',
  usefulLife: '',
  status: 'active',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AssetRegister({ reportId }: ModuleProps) {
  // Data state
  const [entries, setEntries] = useState<AssetEntry[]>([])
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

  const parsedCost = parseFloat(form.acquisitionCost) || 0
  // When editing, we use the stored accumulatedDep from the original entry.
  // When adding new, accumulatedDep is 0.
  const currentAccumDep = editingId
    ? (entries.find((e) => e.id === editingId)?.accumulatedDep ?? 0)
    : 0
  const computedNBV = parsedCost - currentAccumDep

  // ── Summary computation ───────────────────────────────────────────────────

  const totalAssets = entries.length
  const totalCost = entries.reduce((sum, e) => sum + e.acquisitionCost, 0)
  const totalAccumDep = entries.reduce((sum, e) => sum + e.accumulatedDep, 0)
  const totalNBV = entries.reduce((sum, e) => sum + e.netBookValue, 0)

  // ── Fetch entries ─────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=asset&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch asset entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load asset register')
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

  const openEditDialog = (entry: AssetEntry) => {
    setEditingId(entry.id)
    setForm({
      assetNumber: entry.assetNumber,
      description: entry.description,
      category: entry.category,
      location: entry.location,
      dateAcquired: entry.dateAcquired,
      acquisitionCost: String(entry.acquisitionCost),
      depreciationRate: String(entry.depreciationRate),
      usefulLife: String(entry.usefulLife),
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

  // ── Submit (Add / Edit) ──────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.assetNumber.trim() || !form.description.trim()) {
      toast.error('Asset number and description are required')
      return
    }

    const depRate = parseFloat(form.depreciationRate) || 0
    const usefulLife = parseInt(form.usefulLife, 10) || 0
    const nbv = parsedCost - currentAccumDep

    try {
      setSubmitting(true)

      const body = {
        reportId,
        assetNumber: form.assetNumber.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        dateAcquired: form.dateAcquired,
        acquisitionCost: parsedCost,
        accumulatedDep: currentAccumDep,
        netBookValue: nbv,
        depreciationRate: depRate,
        usefulLife,
        status: form.status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=asset&id=${editingId}`
        : `/api/modules?module=asset&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} asset`)

      toast.success(`Asset ${isEditing ? 'updated' : 'added'} successfully`)
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
      const res = await fetch(`/api/modules?module=asset&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete entry')

      toast.success('Asset deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete asset')
    } finally {
      setDeleting(false)
    }
  }

  // ── Category label ────────────────────────────────────────────────────────

  function categoryLabel(cat: string): string {
    switch (cat) {
      case 'ppe': return 'PPE'
      case 'intangible': return 'Intangible'
      case 'investment-property': return 'Investment Property'
      case 'financial': return 'Financial'
      default: return cat
    }
  }

  // ── Status badge ──────────────────────────────────────────────────────────

  function statusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
      case 'disposed':
        return <Badge variant="secondary">Disposed</Badge>
      case 'impaired':
        return <Badge variant="destructive">Impaired</Badge>
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
            Asset Register
          </h2>
          <p className="text-sm text-muted-foreground">
            Fixed assets, depreciation, and net book value tracking
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{totalAssets}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Acquisition Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{formatNum(totalCost)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accum. Depreciation
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatNum(totalAccumDep)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Book Value
            </CardTitle>
            <Building className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">{formatNum(totalNBV)}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="h-5 w-5" />
            Registered Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No assets registered yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Asset&quot; to start tracking fixed assets.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[100px]">Asset #</TableHead>
                    <TableHead className="min-w-[160px]">Description</TableHead>
                    <TableHead className="w-[110px]">Category</TableHead>
                    <TableHead className="w-[100px]">Location</TableHead>
                    <TableHead className="w-[100px]">Acquired</TableHead>
                    <TableHead className="text-right w-[110px]">Cost</TableHead>
                    <TableHead className="text-right w-[100px]">Accum. Dep.</TableHead>
                    <TableHead className="text-right w-[110px]">Net B/V</TableHead>
                    <TableHead className="w-[80px] text-center">Status</TableHead>
                    <TableHead className="w-[80px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        {entry.assetNumber}
                      </TableCell>
                      <TableCell className="text-sm truncate max-w-[160px]">
                        {entry.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {categoryLabel(entry.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {entry.location || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {entry.dateAcquired || '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNum(entry.acquisitionCost)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        ({formatNum(entry.accumulatedDep)})
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-emerald-700">
                        {formatNum(entry.netBookValue)}
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
                            aria-label={`Edit ${entry.assetNumber}`}
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label={`Delete ${entry.assetNumber}`}
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
              {editingId ? 'Edit Asset' : 'Add Asset'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the asset details.'
                : 'Register a new asset in the register.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="asset-number">Asset Number</Label>
                <Input
                  id="asset-number"
                  placeholder="e.g. AST-001"
                  value={form.assetNumber}
                  onChange={(e) => updateField('assetNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => updateField('category', v)}
                >
                  <SelectTrigger id="asset-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ppe">PPE</SelectItem>
                    <SelectItem value="intangible">Intangible</SelectItem>
                    <SelectItem value="investment-property">Investment Property</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset-desc">Description</Label>
              <Input
                id="asset-desc"
                placeholder="e.g. Office Building - Floor 3"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="asset-location">Location</Label>
                <Input
                  id="asset-location"
                  placeholder="e.g. Headquarters"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-date">Date Acquired</Label>
                <Input
                  id="asset-date"
                  type="date"
                  value={form.dateAcquired}
                  onChange={(e) => updateField('dateAcquired', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="asset-cost">Acquisition Cost</Label>
                <Input
                  id="asset-cost"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.acquisitionCost}
                  onChange={(e) => updateField('acquisitionCost', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-dep-rate">Depreciation Rate (%)</Label>
                <Input
                  id="asset-dep-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g. 10"
                  value={form.depreciationRate}
                  onChange={(e) => updateField('depreciationRate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="asset-life">Useful Life (Years)</Label>
                <Input
                  id="asset-life"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 10"
                  value={form.usefulLife}
                  onChange={(e) => updateField('usefulLife', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => updateField('status', v)}
                >
                  <SelectTrigger id="asset-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                    <SelectItem value="impaired">Impaired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auto-computed NBV */}
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Net Book Value
                </span>
                <span className="text-sm font-bold font-mono text-emerald-700">
                  {formatNum(computedNBV)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Auto-calculated: Acquisition Cost − Accumulated Depreciation
              </p>
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
                  ? 'Update Asset'
                  : 'Add Asset'}
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
              Delete Asset
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this asset? This action cannot
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
