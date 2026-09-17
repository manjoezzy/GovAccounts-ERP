'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  Landmark,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Reconciliation {
  id: string
  bankAccount: string
  periodEnd: string
  balancePerBooks: number
  balancePerBank: number
  outstandingDeposits: number
  outstandingCheques: number
  bankCharges: number
  bankInterest: number
  otherAdjustments: number
  adjustedBalance: number
  difference: number
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  bankAccount: string
  periodEnd: string
  balancePerBooks: string
  balancePerBank: string
  outstandingDeposits: string
  outstandingCheques: string
  bankCharges: string
  bankInterest: string
  otherAdjustments: string
}

const EMPTY_FORM: FormState = {
  bankAccount: 'main',
  periodEnd: new Date().toISOString().split('T')[0],
  balancePerBooks: '',
  balancePerBank: '',
  outstandingDeposits: '',
  outstandingCheques: '',
  bankCharges: '',
  bankInterest: '',
  otherAdjustments: '',
}

const BANK_ACCOUNT_OPTIONS = [
  { value: 'main', label: 'Main Account' },
  { value: 'secondary', label: 'Secondary Account' },
  { value: 'petty', label: 'Petty Cash' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function BankReconciliation({ reportId }: ModuleProps) {
  // Data state
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [loading, setLoading] = useState(true)

  // Form state (inline card, not dialog)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Computed form values ──────────────────────────────────────────────────

  const parsed = {
    books: parseFloat(form.balancePerBooks) || 0,
    bank: parseFloat(form.balancePerBank) || 0,
    deposits: parseFloat(form.outstandingDeposits) || 0,
    cheques: parseFloat(form.outstandingCheques) || 0,
    charges: parseFloat(form.bankCharges) || 0,
    interest: parseFloat(form.bankInterest) || 0,
    other: parseFloat(form.otherAdjustments) || 0,
  }

  // Adjusted Balance = Books + Outstanding Deposits - Outstanding Cheques - Bank Charges + Bank Interest + Other
  const adjustedBalance =
    parsed.books +
    parsed.deposits -
    parsed.cheques -
    parsed.charges +
    parsed.interest +
    parsed.other

  const difference = adjustedBalance - parsed.bank

  // ── Fetch reconciliations ─────────────────────────────────────────────────

  const fetchReconciliations = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=bank-recon&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch reconciliations')
      const data = await res.json()
      setReconciliations(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load reconciliations')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchReconciliations()
  }, [fetchReconciliations])

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openNewForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEditForm = (recon: Reconciliation) => {
    setEditingId(recon.id)
    setForm({
      bankAccount: recon.bankAccount,
      periodEnd: recon.periodEnd,
      balancePerBooks: String(recon.balancePerBooks),
      balancePerBank: String(recon.balancePerBank),
      outstandingDeposits: String(recon.outstandingDeposits),
      outstandingCheques: String(recon.outstandingCheques),
      bankCharges: String(recon.bankCharges),
      bankInterest: String(recon.bankInterest),
      otherAdjustments: String(recon.otherAdjustments),
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const openDeleteDialog = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // ── Submit (Create / Update) ────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.periodEnd) {
      toast.error('Period end date is required')
      return
    }

    try {
      setSubmitting(true)

      const body = {
        reportId,
        bankAccount: form.bankAccount,
        periodEnd: form.periodEnd,
        balancePerBooks: parsed.books,
        balancePerBank: parsed.bank,
        outstandingDeposits: parsed.deposits,
        outstandingCheques: parsed.cheques,
        bankCharges: parsed.charges,
        bankInterest: parsed.interest,
        otherAdjustments: parsed.other,
        adjustedBalance,
        difference,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=bank-recon&id=${editingId}`
        : `/api/modules?module=bank-recon&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} reconciliation`)

      toast.success(`Reconciliation ${isEditing ? 'updated' : 'saved'} successfully`)
      resetForm()
      fetchReconciliations()
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
      const res = await fetch(`/api/modules?module=bank-recon&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete reconciliation')

      toast.success('Reconciliation deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
      fetchReconciliations()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete reconciliation')
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
            Bank Reconciliation
          </h2>
          <p className="text-sm text-muted-foreground">
            Reconcile cashbook balance with bank statement
          </p>
        </div>
        <div className="flex gap-2">
          {showForm && (
            <Button variant="outline" size="sm" onClick={resetForm}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          <Button onClick={openNewForm} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Reconciliation
          </Button>
        </div>
      </div>

      {/* ── Reconciliation Form (Card layout, NOT dialog) ──────────────── */}
      {showForm && (
        <Card className="border-slate-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-5 w-5" />
              {editingId ? 'Edit Reconciliation' : 'New Reconciliation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* Row: Bank Account + Period End */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="br-bank-account">Bank Account</Label>
                  <Select
                    value={form.bankAccount}
                    onValueChange={(val) => updateField('bankAccount', val)}
                  >
                    <SelectTrigger id="br-bank-account">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANK_ACCOUNT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="br-period-end">Period End Date</Label>
                  <Input
                    id="br-period-end"
                    type="date"
                    value={form.periodEnd}
                    onChange={(e) => updateField('periodEnd', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Balances Section */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="br-books">Balance per Books</Label>
                  <Input
                    id="br-books"
                    type="number"
                    step="1"
                    placeholder="0"
                    value={form.balancePerBooks}
                    onChange={(e) => updateField('balancePerBooks', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="br-bank">Balance per Bank</Label>
                  <Input
                    id="br-bank"
                    type="number"
                    step="1"
                    placeholder="0"
                    value={form.balancePerBank}
                    onChange={(e) => updateField('balancePerBank', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Adjustments Section */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="br-deposits">Outstanding Deposits</Label>
                  <Input
                    id="br-deposits"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.outstandingDeposits}
                    onChange={(e) => updateField('outstandingDeposits', e.target.value)}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                  <p className="text-xs text-muted-foreground">Deposits not yet recorded by bank</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="br-cheques">Outstanding Cheques</Label>
                  <Input
                    id="br-cheques"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.outstandingCheques}
                    onChange={(e) => updateField('outstandingCheques', e.target.value)}
                    className="border-red-200 focus-visible:ring-red-500"
                  />
                  <p className="text-xs text-muted-foreground">Cheques not yet cleared by bank</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="br-charges">Bank Charges</Label>
                  <Input
                    id="br-charges"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.bankCharges}
                    onChange={(e) => updateField('bankCharges', e.target.value)}
                    className="border-orange-200 focus-visible:ring-orange-500"
                  />
                  <p className="text-xs text-muted-foreground">Fees and charges deducted by bank</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="br-interest">Bank Interest</Label>
                  <Input
                    id="br-interest"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.bankInterest}
                    onChange={(e) => updateField('bankInterest', e.target.value)}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                  <p className="text-xs text-muted-foreground">Interest earned on bank balance</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="br-other">Other Adjustments</Label>
                  <Input
                    id="br-other"
                    type="number"
                    step="1"
                    placeholder="0"
                    value={form.otherAdjustments}
                    onChange={(e) => updateField('otherAdjustments', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional adjustments (positive or negative)
                  </p>
                </div>
              </div>

              <Separator />

              {/* Auto-computed Results */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Adjusted Balance */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Adjusted Balance
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {adjustedBalance < 0 ? '(' : ''}
                      {formatNum(adjustedBalance)}
                      {adjustedBalance < 0 ? ')' : ''}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Books + Deposits − Cheques − Charges + Interest + Other
                  </p>
                </div>

                {/* Difference */}
                <div
                  className={`rounded-lg border px-4 py-3 ${
                    difference === 0
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Difference
                    </span>
                    <div className="flex items-center gap-2">
                      {difference === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-bold font-mono ${
                          difference === 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {difference < 0 ? '(' : ''}
                        {formatNum(difference)}
                        {difference < 0 ? ')' : ''}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Adjusted Balance − Balance per Bank
                  </p>
                  {difference === 0 && (
                    <p className="mt-1 text-xs font-medium text-emerald-600">
                      ✓ Reconciled — balances match
                    </p>
                  )}
                  {difference !== 0 && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      ✗ Unreconciled — difference of {formatNum(difference)}
                    </p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={submitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {submitting
                    ? 'Saving...'
                    : editingId
                      ? 'Update Reconciliation'
                      : 'Save Reconciliation'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Saved Reconciliations List ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="h-5 w-5" />
            Saved Reconciliations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : reconciliations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Landmark className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No reconciliations saved yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;New Reconciliation&quot; to start reconciling your bank accounts.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[120px]">Period End</TableHead>
                    <TableHead className="w-[130px]">Bank Account</TableHead>
                    <TableHead className="text-right">Balance per Books</TableHead>
                    <TableHead className="text-right">Balance per Bank</TableHead>
                    <TableHead className="text-right">Adjusted Balance</TableHead>
                    <TableHead className="text-right w-[100px]">Difference</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliations.map((recon, index) => {
                    const isMatch = recon.difference === 0
                    const isNegDiff = recon.difference < 0
                    return (
                      <TableRow
                        key={recon.id}
                        className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                      >
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {recon.periodEnd}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {BANK_ACCOUNT_OPTIONS.find(
                              (o) => o.value === recon.bankAccount
                            )?.label || recon.bankAccount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(recon.balancePerBooks)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNum(recon.balancePerBank)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {recon.adjustedBalance < 0 ? '(' : ''}
                          {formatNum(recon.adjustedBalance)}
                          {recon.adjustedBalance < 0 ? ')' : ''}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          <span
                            className={
                              isMatch
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }
                          >
                            {isNegDiff ? '(' : ''}
                            {formatNum(recon.difference)}
                            {isNegDiff ? ')' : ''}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isMatch ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-300 text-emerald-700 bg-emerald-50"
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Matched
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="bg-red-50 text-red-700 border border-red-300"
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Unmatched
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditForm(recon)}
                              aria-label={`Edit reconciliation for ${recon.periodEnd}`}
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(recon.id)}
                              aria-label={`Delete reconciliation for ${recon.periodEnd}`}
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

      {/* ── Delete Confirmation Dialog ─────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Reconciliation
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this reconciliation? This action cannot
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
