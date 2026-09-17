'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  CheckCircle2,
  CircleDollarSign,
  Search,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ─── Types ──────────────────────────────────────────────────────────────────

type FundType = 'general' | 'special' | 'trust' | 'capital' | 'project'

type FundStatus = 'active' | 'inactive'

interface Fund {
  id: string
  name: string
  code: string
  fundType: FundType
  description: string
  openingBalance: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface FundFormData {
  name: string
  code: string
  fundType: FundType
  description: string
  openingBalance: number
  isActive: boolean
}

const FUND_TYPE_OPTIONS: { value: FundType; label: string }[] = [
  { value: 'general', label: 'General Fund' },
  { value: 'special', label: 'Special Fund' },
  { value: 'trust', label: 'Trust Fund' },
  { value: 'capital', label: 'Capital Fund' },
  { value: 'project', label: 'Project Fund' },
]

const FUND_TYPE_BADGE: Record<
  FundType,
  { className: string; label: string }
> = {
  general: {
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
    label: 'General',
  },
  special: {
    className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
    label: 'Special',
  },
  trust: {
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    label: 'Trust',
  },
  capital: {
    className: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100',
    label: 'Capital',
  },
  project: {
    className: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100',
    label: 'Project',
  },
}

const EMPTY_FORM: FundFormData = {
  name: '',
  code: '',
  fundType: 'general',
  description: '',
  openingBalance: 0,
  isActive: true,
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_FUNDS: Fund[] = [
  {
    id: '1',
    name: 'Consolidated Fund',
    code: 'GF-001',
    fundType: 'general',
    description: 'Main government consolidated fund for general operations',
    openingBalance: 150_000_000,
    isActive: true,
    createdAt: '2024-07-01',
    updatedAt: '2024-07-01',
  },
  {
    id: '2',
    name: 'Road Maintenance Fund',
    code: 'SF-001',
    fundType: 'special',
    description: 'Dedicated fund for road infrastructure maintenance',
    openingBalance: 45_000_000,
    isActive: true,
    createdAt: '2024-07-01',
    updatedAt: '2024-08-15',
  },
  {
    id: '3',
    name: 'Education Trust Fund',
    code: 'TF-001',
    fundType: 'trust',
    description: 'Trust fund for education sector scholarships',
    openingBalance: 30_000_000,
    isActive: true,
    createdAt: '2024-07-01',
    updatedAt: '2024-07-01',
  },
  {
    id: '4',
    name: 'Capital Development Fund',
    code: 'CF-001',
    fundType: 'capital',
    description: 'Fund for capital development projects and infrastructure',
    openingBalance: 200_000_000,
    isActive: true,
    createdAt: '2024-07-01',
    updatedAt: '2024-09-01',
  },
  {
    id: '5',
    name: 'Health Sector Project Fund',
    code: 'PF-001',
    fundType: 'project',
    description: 'Project fund for health sector improvements',
    openingBalance: 75_000_000,
    isActive: true,
    createdAt: '2024-08-01',
    updatedAt: '2024-08-01',
  },
  {
    id: '6',
    name: 'Legacy Pensions Fund',
    code: 'SF-002',
    fundType: 'special',
    description: 'Legacy pension fund (inactive - transferred)',
    openingBalance: 10_000_000,
    isActive: false,
    createdAt: '2023-07-01',
    updatedAt: '2024-06-30',
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

interface FundSetupProps {
  reportId: string
}

export default function FundSetup({ reportId }: FundSetupProps) {
  const [funds, setFunds] = useState<Fund[]>(MOCK_FUNDS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FundFormData>(EMPTY_FORM)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // ── Summary Calculations ────────────────────────────────────────
  const summary = useMemo(() => {
    const totalFunds = funds.length
    const activeFunds = funds.filter((f) => f.isActive).length
    const totalOpeningBalance = funds.reduce(
      (sum, f) => sum + f.openingBalance,
      0
    )
    return { totalFunds, activeFunds, totalOpeningBalance }
  }, [funds])

  // ── Filtered funds ─────────────────────────────────────────────
  const filteredFunds = useMemo(() => {
    if (!searchQuery.trim()) return funds
    const q = searchQuery.toLowerCase()
    return funds.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.fundType.toLowerCase().includes(q)
    )
  }, [funds, searchQuery])

  // ── CRUD Handlers ──────────────────────────────────────────────

  const handleOpenAdd = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }, [])

  const handleOpenEdit = useCallback((fund: Fund) => {
    setEditingId(fund.id)
    setForm({
      name: fund.name,
      code: fund.code,
      fundType: fund.fundType,
      description: fund.description,
      openingBalance: fund.openingBalance,
      isActive: fund.isActive,
    })
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    if (!form.name.trim() || !form.code.trim()) return

    const now = new Date().toISOString().split('T')[0]

    if (editingId) {
      // Update existing
      setFunds((prev) =>
        prev.map((f) =>
          f.id === editingId
            ? { ...f, ...form, updatedAt: now }
            : f
        )
      )
    } else {
      // Create new
      const newFund: Fund = {
        id: String(Date.now()),
        ...form,
        createdAt: now,
        updatedAt: now,
      }
      setFunds((prev) => [...prev, newFund])
    }

    setDialogOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }, [form, editingId])

  const handleDelete = useCallback((id: string) => {
    setFunds((prev) => prev.filter((f) => f.id !== id))
    setDeleteConfirmId(null)
  }, [])

  // ── Form field updaters ────────────────────────────────────────
  const updateField = useCallback(<K extends keyof FundFormData>(
    key: K,
    value: FundFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Fund Structure Setup
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage government fund accounts (General, Special,
            Trust, Capital)
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="size-4" />
          Add Fund
        </Button>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Wallet className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Funds</p>
                <p className="text-xl font-bold">{summary.totalFunds}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Funds</p>
                <p className="text-xl font-bold">{summary.activeFunds}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"
              >
                <CircleDollarSign className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Opening Balance
                </p>
                <p className="text-xl font-bold">
                  Shs {formatNum(summary.totalOpeningBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search funds by name, code, or type..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── Funds Table ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fund Accounts</CardTitle>
          <CardDescription>
            {filteredFunds.length} fund{filteredFunds.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Opening Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFunds.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {searchQuery
                      ? 'No funds match your search.'
                      : 'No funds configured yet. Click "Add Fund" to create one.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFunds.map((fund) => {
                  const badge = FUND_TYPE_BADGE[fund.fundType]
                  return (
                    <TableRow key={fund.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{fund.name}</p>
                          {fund.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 max-w-[260px] truncate">
                              {fund.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {fund.code}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(badge.className, 'font-normal')}
                        >
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Shs {formatNum(fund.openingBalance)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={fund.isActive ? 'default' : 'secondary'}
                          className={cn(
                            !fund.isActive &&
                              'bg-muted text-muted-foreground'
                          )}
                        >
                          {fund.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleOpenEdit(fund)}
                          >
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit {fund.name}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(fund.id)}
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete {fund.name}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Add / Edit Dialog ────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Fund' : 'Add New Fund'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the fund account details below.'
                : 'Create a new government fund account.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="fund-name">Fund Name</Label>
              <Input
                id="fund-name"
                placeholder="e.g. Consolidated Fund"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>

            {/* Code + Type row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fund-code">Fund Code</Label>
                <Input
                  id="fund-code"
                  placeholder="e.g. GF-001"
                  value={form.code}
                  onChange={(e) => updateField('code', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fund-type">Fund Type</Label>
                <Select
                  value={form.fundType}
                  onValueChange={(v) => updateField('fundType', v as FundType)}
                >
                  <SelectTrigger id="fund-type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUND_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="fund-desc">Description</Label>
              <Textarea
                id="fund-desc"
                placeholder="Brief description of this fund..."
                rows={3}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            {/* Opening Balance */}
            <div className="grid gap-2">
              <Label htmlFor="fund-balance">Opening Balance (Shs)</Label>
              <Input
                id="fund-balance"
                type="number"
                min={0}
                placeholder="0"
                value={form.openingBalance || ''}
                onChange={(e) =>
                  updateField(
                    'openingBalance',
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="fund-active" className="text-sm font-medium">
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive funds are hidden from transactions
                </p>
              </div>
              <Switch
                id="fund-active"
                checked={form.isActive}
                onCheckedChange={(checked) => updateField('isActive', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.code.trim()}
            >
              {editingId ? 'Update Fund' : 'Create Fund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ───────────────────────────────── */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Fund</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this fund? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmId && handleDelete(deleteConfirmId)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
