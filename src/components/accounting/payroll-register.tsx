'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  Users,
  Banknote,
  TrendingDown,
  Wallet,
  AlertTriangle,
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

interface PayrollEntry {
  id: string
  employeeName: string
  employeeNumber: string
  department: string
  payPeriod: string
  grossPay: number
  payeTax: number
  pensionEmployee: number
  pensionEmployer: number
  nssf: number
  otherDeductions: number
  netPay: number
  bankAccount: string
}

interface ModuleProps {
  reportId: string
}

interface FormState {
  employeeName: string
  employeeNumber: string
  department: string
  payPeriod: string
  grossPay: string
  payeTax: string
  pensionEmployee: string
  pensionEmployer: string
  nssf: string
  otherDeductions: string
  bankAccount: string
}

const EMPTY_FORM: FormState = {
  employeeName: '',
  employeeNumber: '',
  department: '',
  payPeriod: new Date().toISOString().slice(0, 7),
  grossPay: '',
  payeTax: '',
  pensionEmployee: '',
  pensionEmployer: '',
  nssf: '',
  otherDeductions: '',
  bankAccount: 'main',
}

const DEPARTMENT_OPTIONS = [
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'it', label: 'IT' },
  { value: 'admin', label: 'Administration' },
  { value: 'legal', label: 'Legal' },
  { value: 'operations', label: 'Operations' },
  { value: 'planning', label: 'Planning' },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export default function PayrollRegister({ reportId }: ModuleProps) {
  const [entries, setEntries] = useState<PayrollEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Computed net pay from form ─────────────────────────────────────────

  const computedNetPay =
    (parseFloat(form.grossPay) || 0) -
    (parseFloat(form.payeTax) || 0) -
    (parseFloat(form.pensionEmployee) || 0) -
    (parseFloat(form.nssf) || 0) -
    (parseFloat(form.otherDeductions) || 0)

  // ── Summary computation ─────────────────────────────────────────────────

  const totalGross = entries.reduce((s, e) => s + e.grossPay, 0)
  const totalDeductions = entries.reduce(
    (s, e) => s + e.payeTax + e.pensionEmployee + e.nssf + e.otherDeductions,
    0,
  )
  const totalNet = entries.reduce((s, e) => s + e.netPay, 0)
  const employeeCount = entries.length

  // ── Fetch ───────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/modules?module=payroll&reportId=${reportId}`,
      )
      if (!res.ok) throw new Error('Failed to fetch payroll entries')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load payroll entries')
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

  const openEditDialog = (entry: PayrollEntry) => {
    setEditingId(entry.id)
    setForm({
      employeeName: entry.employeeName,
      employeeNumber: entry.employeeNumber,
      department: entry.department,
      payPeriod: entry.payPeriod,
      grossPay: String(entry.grossPay),
      payeTax: String(entry.payeTax),
      pensionEmployee: String(entry.pensionEmployee),
      pensionEmployer: String(entry.pensionEmployer),
      nssf: String(entry.nssf),
      otherDeductions: String(entry.otherDeductions),
      bankAccount: entry.bankAccount || 'main',
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
    if (!form.employeeName.trim() || !form.employeeNumber.trim()) {
      toast.error('Employee name and number are required')
      return
    }

    const grossPay = parseFloat(form.grossPay) || 0
    if (grossPay <= 0) {
      toast.error('Gross pay must be greater than zero')
      return
    }

    const payeTax = parseFloat(form.payeTax) || 0
    const pensionEmployee = parseFloat(form.pensionEmployee) || 0
    const pensionEmployer = parseFloat(form.pensionEmployer) || 0
    const nssf = parseFloat(form.nssf) || 0
    const otherDeductions = parseFloat(form.otherDeductions) || 0
    const netPay = grossPay - payeTax - pensionEmployee - nssf - otherDeductions

    try {
      setSubmitting(true)

      const body = {
        reportId,
        employeeName: form.employeeName.trim(),
        employeeNumber: form.employeeNumber.trim(),
        department: form.department,
        payPeriod: form.payPeriod,
        grossPay,
        payeTax,
        pensionEmployee,
        pensionEmployer,
        nssf,
        otherDeductions,
        netPay,
        bankAccount: form.bankAccount,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/modules?module=payroll&id=${editingId}`
        : `/api/modules?module=payroll&reportId=${reportId}`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} entry`)

      toast.success(`Employee ${isEditing ? 'updated' : 'added'} successfully`)
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
      const res = await fetch(`/api/modules?module=payroll&id=${deletingId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete entry')
      toast.success('Employee removed successfully')
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
            Payroll Register
          </h2>
          <p className="text-sm text-muted-foreground">
            Employee compensation with statutory deductions
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gross Pay
            </CardTitle>
            <Banknote className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNum(totalGross)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deductions
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatNum(totalDeductions)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Net Pay
            </CardTitle>
            <Wallet className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatNum(totalNet)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Employee Count
            </CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{employeeCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Payroll Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No payroll entries yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click &quot;Add Employee&quot; to start recording payroll data.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead>Employee Name</TableHead>
                    <TableHead className="w-[100px]">Emp #</TableHead>
                    <TableHead className="w-[110px]">Department</TableHead>
                    <TableHead className="w-[100px]">Period</TableHead>
                    <TableHead className="text-right w-[100px]">Gross</TableHead>
                    <TableHead className="text-right w-[80px]">PAYE</TableHead>
                    <TableHead className="text-right w-[80px]">Pension (E/E)</TableHead>
                    <TableHead className="text-right w-[70px]">NSSF</TableHead>
                    <TableHead className="text-right w-[80px]">Other Ded.</TableHead>
                    <TableHead className="text-right w-[100px]">Net Pay</TableHead>
                    <TableHead className="w-[90px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {entry.employeeName}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {entry.employeeNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {DEPARTMENT_OPTIONS.find((d) => d.value === entry.department)
                          ?.label || entry.department || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {entry.payPeriod}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNum(entry.grossPay)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {formatNum(entry.payeTax)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {formatNum(entry.pensionEmployee)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {formatNum(entry.nssf)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {formatNum(entry.otherDeductions)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        {formatNum(entry.netPay)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(entry)}
                            aria-label={`Edit ${entry.employeeName}`}
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(entry.id)}
                            aria-label={`Delete ${entry.employeeName}`}
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
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Employee' : 'Add Employee'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pr-name">Employee Name</Label>
                <Input
                  id="pr-name"
                  placeholder="John Doe"
                  value={form.employeeName}
                  onChange={(e) => updateField('employeeName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-number">Employee Number</Label>
                <Input
                  id="pr-number"
                  placeholder="EMP-001"
                  value={form.employeeNumber}
                  onChange={(e) => updateField('employeeNumber', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pr-dept">Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(val) => updateField('department', val)}
                >
                  <SelectTrigger id="pr-dept">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-period">Pay Period</Label>
                <Input
                  id="pr-period"
                  type="month"
                  value={form.payPeriod}
                  onChange={(e) => updateField('payPeriod', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="pr-gross" className="text-emerald-700">
                  Gross Pay
                </Label>
                <Input
                  id="pr-gross"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.grossPay}
                  onChange={(e) => updateField('grossPay', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-paye" className="text-red-700">
                  PAYE Tax
                </Label>
                <Input
                  id="pr-paye"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.payeTax}
                  onChange={(e) => updateField('payeTax', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-pension-ee" className="text-red-700">
                  Pension (E/E)
                </Label>
                <Input
                  id="pr-pension-ee"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.pensionEmployee}
                  onChange={(e) => updateField('pensionEmployee', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="pr-pension-er">Pension (E/R)</Label>
                <Input
                  id="pr-pension-er"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.pensionEmployer}
                  onChange={(e) => updateField('pensionEmployer', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-nssf" className="text-red-700">
                  NSSF
                </Label>
                <Input
                  id="pr-nssf"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.nssf}
                  onChange={(e) => updateField('nssf', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-other" className="text-red-700">
                  Other Deductions
                </Label>
                <Input
                  id="pr-other"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.otherDeductions}
                  onChange={(e) => updateField('otherDeductions', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pr-bank">Bank Account</Label>
                <Input
                  id="pr-bank"
                  placeholder="e.g. 1234567890"
                  value={form.bankAccount}
                  onChange={(e) => updateField('bankAccount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Computed Net Pay</Label>
                <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 font-mono text-sm font-bold">
                  {computedNetPay < 0 ? '(' : ''}{formatNum(computedNetPay)}{computedNetPay < 0 ? ')' : ''}
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
                  ? 'Update Employee'
                  : 'Add Employee'}
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
              Remove Employee
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this employee from the payroll register?
            This action cannot be undone.
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
