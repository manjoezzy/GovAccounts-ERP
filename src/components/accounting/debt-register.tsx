'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  Landmark,
  TrendingDown,
  Percent,
  CreditCard,
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

interface DebtEntry {
  id: string
  lender: string
  loanType: string
  principalAmount: number
  interestRate: number
  outstandingPrincipal: number
  totalServiceCost: number
  repaymentsMade: number
  balance: number
  disbursementDate: string
  maturityDate: string
  status: string
  createdAt: string
  updatedAt: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  lender: string
  loanType: string
  principalAmount: string
  interestRate: string
  outstandingPrincipal: string
  totalServiceCost: string
  repaymentsMade: string
  disbursementDate: string
  maturityDate: string
  status: string
}

const EMPTY_FORM: FormState = {
  lender: '',
  loanType: 'external-domestic',
  principalAmount: '',
  interestRate: '',
  outstandingPrincipal: '',
  totalServiceCost: '',
  repaymentsMade: '',
  disbursementDate: '',
  maturityDate: '',
  status: 'active',
}

const LOAN_TYPE_OPTIONS = [
  { value: 'external-domestic', label: 'External (Domestic)' },
  { value: 'external-foreign', label: 'External (Foreign)' },
  { value: 'internal', label: 'Internal' },
  { value: 'overdraft', label: 'Overdraft' },
] as const

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'repaid', label: 'Repaid' },
  { value: 'restructured', label: 'Restructured' },
  { value: 'defaulted', label: 'Defaulted' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function DebtRegister({ reportId }: ModuleProps) {
  const [entries, setEntries] = useState<DebtEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Summary computation ───────────────────────────────────────────────────

  const totalBorrowing = entries.reduce((sum, e) => sum + e.principalAmount, 0)
  const outstandingPrincipal = entries.reduce((sum, e) => sum + e.outstandingPrincipal, 0)
  const totalServiceCost = entries.reduce((sum, e) => sum + e.totalServiceCost, 0)
  const repaymentsMade = entries.reduce((sum, e) => sum + e.repaymentsMade, 0)

  // Auto-computed balance from form
  const principal = parseFloat(form.principalAmount) || 0
  const repaid = parseFloat(form.repaymentsMade) || 0
  const formBalance = principal - repaid

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=debt&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch debt entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load debt entries')
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

  const openEditDialog = (entry: DebtEntry) => {
    setEditingId(entry.id)
    setForm({
      lender: entry.lender,
      loanType: entry.loanType,
      principalAmount: String(entry.principalAmount),
      interestRate: String(entry.interestRate),
      outstandingPrincipal: String(entry.outstandingPrincipal),
      totalServiceCost: String(entry.totalServiceCost),
      repaymentsMade: String(entry.repaymentsMade),
      disbursementDate: entry.disbursementDate,
      maturityDate: entry.maturityDate,
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
    if (!form.lender.trim()) {
      toast.error('Lender name is required')
      return
    }

    const parsedPrincipal = parseFloat(form.principalAmount)
    if (!parsedPrincipal || parsedPrincipal <= 0) {
      toast.error('A valid positive principal amount is required')
      return
    }

    const outstanding = parseFloat(form.outstandingPrincipal) || 0
    const serviceCost = parseFloat(form.totalServiceCost) || 0
    const repayments = parseFloat(form.repaymentsMade) || 0
    const rate = parseFloat(form.interestRate) || 0
    const balance = parsedPrincipal - repayments

    if (outstanding < 0 || repayments < 0) {
      toast.error('Outstanding and repayments must be non-negative')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        lender: form.lender.trim(),
        loanType: form.loanType,
        principalAmount: parsedPrincipal,
        interestRate: rate,
        outstandingPrincipal: outstanding,
        totalServiceCost: serviceCost,
        repaymentsMade: repayments,
        balance,
        disbursementDate: form.disbursementDate,
        maturityDate: form.maturityDate,
        status: form.status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=debt&id=${editingId}`
        : `/api/modules?module=debt&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} loan`)

      toast.success(`Loan ${isEditing ? 'updated' : 'added'} successfully`)
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
      const res = await fetch(`/api/modules?module=debt&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete loan')

      toast.success('Loan deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchEntries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete loan')
    } finally {
      setDeleting(false)
    }
  }

  // ── Badge helpers ─────────────────────────────────────────────────────────

  const loanTypeBadge = (type: string) => {
    switch (type) {
      case 'external-domestic':
        return <Badge variant="default">Ext. Domestic</Badge>
      case 'external-foreign':
        return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">Ext. Foreign</Badge>
      case 'internal':
        return <Badge variant="secondary">Internal</Badge>
      case 'overdraft':
        return <Badge variant="outline">Overdraft</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
      case 'repaid':
        return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">Repaid</Badge>
      case 'restructured':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Restructured</Badge>
      case 'defaulted':
        return <Badge variant="destructive">Defaulted</Badge>
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
            Debt Register
          </h2>
          <p className="text-sm text-muted-foreground">
            Track government loans, interest obligations, and repayment schedules
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Loan
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Borrowing
            </CardTitle>
            <Landmark className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalBorrowing)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Principal
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatNum(outstandingPrincipal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Service Cost
            </CardTitle>
            <Percent className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatNum(totalServiceCost)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Repayments Made
            </CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(repaymentsMade)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="h-5 w-5" />
            Debt Register Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Landmark className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No loans recorded yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Loan&quot; to start tracking government debt.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="min-w-[120px]">Lender</TableHead>
                    <TableHead className="w-[120px]">Loan Type</TableHead>
                    <TableHead className="text-right w-[110px]">Principal</TableHead>
                    <TableHead className="text-right w-[90px]">Rate %</TableHead>
                    <TableHead className="text-right w-[110px]">Outstanding</TableHead>
                    <TableHead className="text-right w-[110px]">Service Cost</TableHead>
                    <TableHead className="text-right w-[110px]">Repayments</TableHead>
                    <TableHead className="w-[110px]">Maturity</TableHead>
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
                      <TableCell className="font-medium">
                        {entry.lender}
                      </TableCell>
                      <TableCell>
                        {loanTypeBadge(entry.loanType)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNum(entry.principalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-amber-600">
                        {entry.interestRate > 0 ? `${entry.interestRate}%` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-red-600">
                        {formatNum(entry.outstandingPrincipal)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-amber-600">
                        {entry.totalServiceCost > 0 ? formatNum(entry.totalServiceCost) : <span className="text-slate-300">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-600">
                        {entry.repaymentsMade > 0 ? formatNum(entry.repaymentsMade) : <span className="text-slate-300">—</span>}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {entry.maturityDate || '—'}
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
                            aria-label={`Edit loan from ${entry.lender}`}
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label={`Delete loan from ${entry.lender}`}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Loan' : 'Add New Loan'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row: Lender + Loan Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dbt-lender">Lender</Label>
                <Input
                  id="dbt-lender"
                  placeholder="e.g. IMF, World Bank"
                  value={form.lender}
                  onChange={(e) => updateField('lender', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dbt-type">Loan Type</Label>
                <Select
                  value={form.loanType}
                  onValueChange={(val) => updateField('loanType', val)}
                >
                  <SelectTrigger id="dbt-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row: Principal + Interest Rate */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dbt-principal">Principal Amount</Label>
                <Input
                  id="dbt-principal"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.principalAmount}
                  onChange={(e) => updateField('principalAmount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dbt-rate">Interest Rate (%)</Label>
                <Input
                  id="dbt-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0.0"
                  value={form.interestRate}
                  onChange={(e) => updateField('interestRate', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Outstanding Principal + Service Cost */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dbt-outstanding">Outstanding Principal</Label>
                <Input
                  id="dbt-outstanding"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.outstandingPrincipal}
                  onChange={(e) => updateField('outstandingPrincipal', e.target.value)}
                  className="border-red-200 focus-visible:ring-red-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dbt-service">Total Service Cost</Label>
                <Input
                  id="dbt-service"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.totalServiceCost}
                  onChange={(e) => updateField('totalServiceCost', e.target.value)}
                  className="border-amber-200 focus-visible:ring-amber-500"
                />
              </div>
            </div>

            {/* Repayments Made */}
            <div className="space-y-2">
              <Label htmlFor="dbt-repayments">Repayments Made</Label>
              <Input
                id="dbt-repayments"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.repaymentsMade}
                onChange={(e) => updateField('repaymentsMade', e.target.value)}
                className="border-emerald-200 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Auto-computed balance display */}
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Computed Balance (Principal − Repayments): </span>
              <span className={`font-mono font-bold ${formBalance > 0 ? 'text-amber-600' : formBalance === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formBalance < 0 ? '(' : ''}{formatNum(formBalance)}{formBalance < 0 ? ')' : ''}
              </span>
            </div>

            {/* Row: Disbursement Date + Maturity Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dbt-disb">Disbursement Date</Label>
                <Input
                  id="dbt-disb"
                  type="date"
                  value={form.disbursementDate}
                  onChange={(e) => updateField('disbursementDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dbt-maturity">Maturity Date</Label>
                <Input
                  id="dbt-maturity"
                  type="date"
                  value={form.maturityDate}
                  onChange={(e) => updateField('maturityDate', e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="dbt-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => updateField('status', val)}
              >
                <SelectTrigger id="dbt-status">
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
                  ? 'Update Loan'
                  : 'Add Loan'}
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
              Delete Loan
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this loan entry? This action cannot be undone.
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
