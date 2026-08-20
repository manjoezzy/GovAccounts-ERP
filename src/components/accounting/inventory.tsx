'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  Warehouse,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calculator,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface InventoryItem {
  id: string
  itemCode: string
  itemDescription: string
  unitOfMeasure: string
  unitCost: number
  openingQty: number
  openingValue: number
  receivedQty: number
  receivedValue: number
  issuedQty: number
  issuedValue: number
  closingQty: number
  closingValue: number
  createdAt: string
  updatedAt: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  itemCode: string
  itemDescription: string
  unitOfMeasure: string
  unitCost: string
  openingQty: string
  openingValue: string
  receivedQty: string
  receivedValue: string
  issuedQty: string
  issuedValue: string
}

const EMPTY_FORM: FormState = {
  itemCode: '',
  itemDescription: '',
  unitOfMeasure: 'units',
  unitCost: '',
  openingQty: '0',
  openingValue: '0',
  receivedQty: '0',
  receivedValue: '0',
  issuedQty: '0',
  issuedValue: '0',
}

const UOM_OPTIONS = [
  { value: 'units', label: 'Units' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'litres', label: 'Litres' },
  { value: 'meters', label: 'Meters' },
  { value: 'reams', label: 'Reams' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'sets', label: 'Sets' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function Inventory({ reportId }: ModuleProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Computed values from form ─────────────────────────────────────────────

  const formUnitCost = parseFloat(form.unitCost) || 0
  const formOpeningQty = parseFloat(form.openingQty) || 0
  const formReceivedQty = parseFloat(form.receivedQty) || 0
  const formIssuedQty = parseFloat(form.issuedQty) || 0

  const autoOpeningValue = formUnitCost * formOpeningQty
  const autoReceivedValue = formUnitCost * formReceivedQty
  const autoIssuedValue = formUnitCost * formIssuedQty
  const autoClosingQty = formOpeningQty + formReceivedQty - formIssuedQty
  const autoClosingValue = autoOpeningValue + autoReceivedValue - autoIssuedValue

  // ── Summary computation ───────────────────────────────────────────────────

  const totalItems = items.length
  const totalOpeningValue = items.reduce((sum, i) => sum + i.openingValue, 0)
  const totalReceivedValue = items.reduce(
    (sum, i) => sum + i.receivedValue,
    0
  )
  const totalClosingValue = items.reduce(
    (sum, i) => sum + i.closingValue,
    0
  )

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/modules?module=inventory&reportId=${reportId}`
      )
      if (!res.ok) throw new Error('Failed to fetch inventory items')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load inventory')
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

  const openEditDialog = (item: InventoryItem) => {
    setEditingId(item.id)
    setForm({
      itemCode: item.itemCode,
      itemDescription: item.itemDescription,
      unitOfMeasure: item.unitOfMeasure,
      unitCost: String(item.unitCost),
      openingQty: String(item.openingQty),
      openingValue: String(item.openingValue),
      receivedQty: String(item.receivedQty),
      receivedValue: String(item.receivedValue),
      issuedQty: String(item.issuedQty),
      issuedValue: String(item.issuedValue),
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
    if (!form.itemCode.trim()) {
      toast.error('Item code is required')
      return
    }

    if (!form.itemDescription.trim()) {
      toast.error('Item description is required')
      return
    }

    const unitCost = parseFloat(form.unitCost)
    if (!unitCost || unitCost < 0) {
      toast.error('A valid non-negative unit cost is required')
      return
    }

    try {
      setSubmitting(true)

      const oQty = parseFloat(form.openingQty) || 0
      const rQty = parseFloat(form.receivedQty) || 0
      const iQty = parseFloat(form.issuedQty) || 0

      const oVal = unitCost * oQty
      const rVal = unitCost * rQty
      const iVal = unitCost * iQty
      const cQty = oQty + rQty - iQty
      const cVal = oVal + rVal - iVal

      const body = {
        reportId,
        itemCode: form.itemCode.trim(),
        itemDescription: form.itemDescription.trim(),
        unitOfMeasure: form.unitOfMeasure,
        unitCost,
        openingQty: oQty,
        openingValue: oVal,
        receivedQty: rQty,
        receivedValue: rVal,
        issuedQty: iQty,
        issuedValue: iVal,
        closingQty: cQty,
        closingValue: cVal,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=inventory&id=${editingId}`
        : `/api/modules?module=inventory&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok)
        throw new Error(
          `Failed to ${isEditing ? 'update' : 'create'} inventory item`
        )

      toast.success(
        `Inventory item ${isEditing ? 'updated' : 'added'} successfully`
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
        `/api/modules?module=inventory&id=${deletingId}`,
        { method: 'DELETE' }
      )

      if (!res.ok) throw new Error('Failed to delete inventory item')

      toast.success('Inventory item deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchItems()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete inventory item')
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
            Inventory / Stores Ledger
          </h2>
          <p className="text-sm text-muted-foreground">
            Track inventory items with opening, received, issued, and closing
            balances
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Opening Value
            </CardTitle>
            <Warehouse className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-600">
              {formatNum(totalOpeningValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Received Value
            </CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-sky-600">
              {formatNum(totalReceivedValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">
              Total Closing Value
            </CardTitle>
            <Calculator className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(totalClosingValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Warehouse className="h-5 w-5" />
            Inventory Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Warehouse className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No inventory items recorded yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Item&quot; to start building your stores ledger.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[100px]">Item Code</TableHead>
                    <TableHead className="min-w-[140px]">Description</TableHead>
                    <TableHead className="w-[70px]">UOM</TableHead>
                    <TableHead className="text-right w-[90px]">
                      Unit Cost
                    </TableHead>
                    <TableHead className="text-center w-[90px]">
                      Open Qty
                    </TableHead>
                    <TableHead className="text-right w-[100px]">
                      Open Val
                    </TableHead>
                    <TableHead className="text-center w-[90px]">
                      Recv Qty
                    </TableHead>
                    <TableHead className="text-right w-[100px]">
                      Recv Val
                    </TableHead>
                    <TableHead className="text-center w-[90px]">
                      Issued Qty
                    </TableHead>
                    <TableHead className="text-right w-[100px]">
                      Issued Val
                    </TableHead>
                    <TableHead className="text-center w-[90px]">
                      Close Qty
                    </TableHead>
                    <TableHead className="text-right w-[100px]">
                      Close Val
                    </TableHead>
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
                      <TableCell className="font-mono text-sm font-medium">
                        {item.itemCode}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm">
                        {item.itemDescription || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">
                        {item.unitOfMeasure}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNum(item.unitCost)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm text-muted-foreground">
                        {item.openingQty}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNum(item.openingValue)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm text-sky-600">
                        {item.receivedQty > 0
                          ? item.receivedQty
                          : <span className="text-slate-300">0</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-sky-600">
                        {item.receivedValue > 0
                          ? formatNum(item.receivedValue)
                          : <span className="text-slate-300">—</span>}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm text-amber-600">
                        {item.issuedQty > 0
                          ? item.issuedQty
                          : <span className="text-slate-300">0</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-amber-600">
                        {item.issuedValue > 0
                          ? formatNum(item.issuedValue)
                          : <span className="text-slate-300">—</span>}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm font-medium text-emerald-600">
                        {item.closingQty}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-emerald-600">
                        {formatNum(item.closingValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(item)}
                            aria-label={`Edit ${item.itemCode}`}
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(item.id)}
                            aria-label={`Delete ${item.itemCode}`}
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
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Item Code + Description */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="inv-code">Item Code</Label>
                <Input
                  id="inv-code"
                  placeholder="e.g. ST-001"
                  value={form.itemCode}
                  onChange={(e) => updateField('itemCode', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="inv-desc">Description</Label>
                <Input
                  id="inv-desc"
                  placeholder="Item description"
                  value={form.itemDescription}
                  onChange={(e) =>
                    updateField('itemDescription', e.target.value)
                  }
                />
              </div>
            </div>

            {/* UOM + Unit Cost */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inv-uom">Unit of Measure</Label>
                <Select
                  value={form.unitOfMeasure}
                  onValueChange={(val) => updateField('unitOfMeasure', val)}
                >
                  <SelectTrigger id="inv-uom">
                    <SelectValue placeholder="Select UOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {UOM_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-cost" className="text-primary">
                  Unit Cost
                </Label>
                <Input
                  id="inv-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.unitCost}
                  onChange={(e) => updateField('unitCost', e.target.value)}
                  className="border-primary/30 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Opening */}
            <div className="rounded-lg border bg-slate-50/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Opening Balance
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="inv-oqty" className="text-xs">
                    Quantity
                  </Label>
                  <Input
                    id="inv-oqty"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.openingQty}
                    onChange={(e) => updateField('openingQty', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Value{' '}
                    <span className="text-muted-foreground font-normal">
                      (auto: qty × cost)
                    </span>
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formatNum(autoOpeningValue)}
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Received */}
            <div className="rounded-lg border bg-sky-50/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-600">
                Received During Period
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="inv-rqty" className="text-xs">
                    Quantity
                  </Label>
                  <Input
                    id="inv-rqty"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.receivedQty}
                    onChange={(e) => updateField('receivedQty', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Value{' '}
                    <span className="text-muted-foreground font-normal">
                      (auto: qty × cost)
                    </span>
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formatNum(autoReceivedValue)}
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Issued */}
            <div className="rounded-lg border bg-amber-50/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600">
                Issued During Period
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="inv-iqty" className="text-xs">
                    Quantity
                  </Label>
                  <Input
                    id="inv-iqty"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.issuedQty}
                    onChange={(e) => updateField('issuedQty', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Value{' '}
                    <span className="text-muted-foreground font-normal">
                      (auto: qty × cost)
                    </span>
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formatNum(autoIssuedValue)}
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Closing (auto-computed) */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Closing Balance (auto-computed)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">
                    Quantity{' '}
                    <span className="text-muted-foreground font-normal">
                      (opening + received − issued)
                    </span>
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={String(autoClosingQty)}
                    className="bg-emerald-100/50 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Value{' '}
                    <span className="text-muted-foreground font-normal">
                      (opening + received − issued)
                    </span>
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formatNum(autoClosingValue)}
                    className="bg-emerald-100/50 font-mono font-bold"
                  />
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
              Delete Inventory Item
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this inventory item? This action
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
