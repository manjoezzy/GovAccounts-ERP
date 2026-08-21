'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus, Trash2, Edit, BookMarked, ArrowLeft, Filter,
  AlertTriangle, CirclePlus,
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
import { Separator } from '@/components/ui/separator'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── Types ────────────────────────────────────────────────────────────────────

interface LedgerAccount {
  id: string
  accountCode: string
  accountName: string
  accountType: string
  openingDebit: number
  openingCredit: number
  totalDebit: number
  totalCredit: number
  closingDebit: number
  closingCredit: number
}

interface LedgerTransaction {
  id: string
  date: string
  narration: string
  reference: string
  debit: number
  credit: number
  balance: number
}

interface ModuleProps {
  reportId: string
}

const ACCOUNT_TYPES = ['all', 'asset', 'liability', 'equity', 'revenue', 'expense'] as const

type AccountFormState = {
  accountCode: string
  accountName: string
  accountType: string
  openingDebit: string
  openingCredit: string
}

type TxFormState = {
  date: string
  narration: string
  reference: string
  debit: string
  credit: string
}

const EMPTY_ACCOUNT_FORM: AccountFormState = {
  accountCode: '',
  accountName: '',
  accountType: 'asset',
  openingDebit: '',
  openingCredit: '',
}

const EMPTY_TX_FORM: TxFormState = {
  date: '',
  narration: '',
  reference: '',
  debit: '',
  credit: '',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GeneralLedger({ reportId }: ModuleProps) {
  // Data state
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)

  // Selection / filter state
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Account dialog state
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [accountForm, setAccountForm] = useState<AccountFormState>(EMPTY_ACCOUNT_FORM)
  const [submitting, setSubmitting] = useState(false)

  // Transaction dialog state
  const [txDialogOpen, setTxDialogOpen] = useState(false)
  const [txForm, setTxForm] = useState<TxFormState>(EMPTY_TX_FORM)
  const [txSubmitting, setTxSubmitting] = useState(false)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<'account' | 'tx'>('account')

  // ── Derived state ─────────────────────────────────────────────────────────

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null

  const filteredAccounts = typeFilter === 'all'
    ? accounts
    : accounts.filter((a) => a.accountType === typeFilter)

  const openingBalance = selectedAccount
    ? selectedAccount.openingDebit - selectedAccount.openingCredit
    : 0

  // ── Fetch accounts ────────────────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/modules?module=ledger-account&reportId=${reportId}`)
      if (!res.ok) throw new Error('Failed to fetch accounts')
      const data = await res.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load ledger accounts')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  // ── Fetch transactions for selected account ───────────────────────────────

  const fetchTransactions = useCallback(async (accountId: string) => {
    try {
      setTxLoading(true)
      const res = await fetch(`/api/modules?module=ledger-tx&accountId=${accountId}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      const data = await res.json()
      // Reverse to chronological order (API returns newest first)
      setTransactions(Array.isArray(data) ? [...data].reverse() : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load transactions')
    } finally {
      setTxLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    if (selectedAccountId) {
      fetchTransactions(selectedAccountId)
    } else {
      setTransactions([])
    }
  }, [selectedAccountId, fetchTransactions])

  // ── Account form helpers ─────────────────────────────────────────────────

  const openAddAccount = () => {
    setAccountForm(EMPTY_ACCOUNT_FORM)
    setAccountDialogOpen(true)
  }

  const openAddTx = () => {
    setTxForm(EMPTY_TX_FORM)
    setTxDialogOpen(true)
  }

  const openDeleteDialog = (id: string, target: 'account' | 'tx') => {
    setDeletingId(id)
    setDeleteTarget(target)
    setDeleteOpen(true)
  }

  const updateAccountField = (field: keyof AccountFormState, value: string) => {
    setAccountForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateTxField = (field: keyof TxFormState, value: string) => {
    setTxForm((prev) => ({ ...prev, [field]: value }))
  }

  // ── Submit Account ───────────────────────────────────────────────────────

  const handleAccountSubmit = async () => {
    if (!accountForm.accountCode.trim() || !accountForm.accountName.trim()) {
      toast.error('Account code and name are required')
      return
    }

    const oDebit = parseFloat(accountForm.openingDebit) || 0
    const oCredit = parseFloat(accountForm.openingCredit) || 0

    try {
      setSubmitting(true)
      const body = {
        reportId,
        accountCode: accountForm.accountCode.trim(),
        accountName: accountForm.accountName.trim(),
        accountType: accountForm.accountType,
        openingDebit: oDebit,
        openingCredit: oCredit,
        closingDebit: oDebit,
        closingCredit: oCredit,
        totalDebit: 0,
        totalCredit: 0,
      }

      const res = await fetch(`/api/modules?module=ledger-account&reportId=${reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to create account')

      toast.success('Account added successfully')
      setAccountDialogOpen(false)
      fetchAccounts()
    } catch (err) {
      console.error(err)
      toast.error('Failed to add account')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Submit Transaction ───────────────────────────────────────────────────

  const handleTxSubmit = async () => {
    if (!selectedAccountId) return
    if (!txForm.date) {
      toast.error('Date is required')
      return
    }

    const debit = parseFloat(txForm.debit) || 0
    const credit = parseFloat(txForm.credit) || 0

    if (debit === 0 && credit === 0) {
      toast.error('Enter a debit or credit amount')
      return
    }

    // Calculate running balance for the new transaction
    const lastTx = transactions.length > 0 ? transactions[transactions.length - 1] : null
    const prevBalance = lastTx ? lastTx.balance : openingBalance
    const newBalance = prevBalance + debit - credit

    try {
      setTxSubmitting(true)
      const body = {
        accountId: selectedAccountId,
        date: txForm.date,
        narration: txForm.narration.trim(),
        reference: txForm.reference.trim(),
        debit,
        credit,
        balance: newBalance,
      }

      const res = await fetch(`/api/modules?module=ledger-tx&accountId=${selectedAccountId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to create transaction')

      // Update account totals
      if (selectedAccount) {
        const updatedAccount = {
          ...selectedAccount,
          totalDebit: selectedAccount.totalDebit + debit,
          totalCredit: selectedAccount.totalCredit + credit,
          closingDebit: Math.max(0, (selectedAccount.openingDebit - selectedAccount.openingCredit) + debit - credit),
          closingCredit: Math.max(0, -((selectedAccount.openingDebit - selectedAccount.openingCredit) + debit - credit)),
        }
        setAccounts((prev) => prev.map((a) => (a.id === selectedAccountId ? updatedAccount : a)))
      }

      toast.success('Transaction added successfully')
      setTxDialogOpen(false)
      fetchTransactions(selectedAccountId)
    } catch (err) {
      console.error(err)
      toast.error('Failed to add transaction')
    } finally {
      setTxSubmitting(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingId) return

    const mod = deleteTarget === 'account' ? 'ledger-account' : 'ledger-tx'

    try {
      setDeleting(true)
      const res = await fetch(`/api/modules?module=${mod}&id=${deletingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      toast.success(`${deleteTarget === 'account' ? 'Account' : 'Transaction'} deleted successfully`)
      setDeleteOpen(false)
      setDeletingId(null)

      if (deleteTarget === 'account') {
        if (deletingId === selectedAccountId) {
          setSelectedAccountId(null)
        }
        fetchAccounts()
      } else {
        if (selectedAccountId) fetchTransactions(selectedAccountId)
      }
    } catch (err) {
      console.error(err)
      toast.error(`Failed to delete ${deleteTarget}`)
    } finally {
      setDeleting(false)
    }
  }

  // ── Compute closing balance for an account card ───────────────────────────

  const getClosingBalance = (acc: LedgerAccount): { amount: number; isDebit: boolean } => {
    const net = acc.closingDebit - acc.closingCredit
    if (net >= 0) return { amount: net, isDebit: true }
    return { amount: Math.abs(net), isDebit: false }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            General Ledger
          </h2>
          <p className="text-sm text-muted-foreground">
            Chart of accounts with transaction drill-down
          </p>
        </div>
        <Button onClick={openAddAccount} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* ── Type Filter ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Two Panel Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* ── Left Panel: Account List ──────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookMarked className="h-5 w-5" />
              Accounts
              <Badge variant="secondary" className="ml-auto text-xs">
                {filteredAccounts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <BookMarked className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No accounts found</p>
                <p className="mt-1 text-xs text-slate-400">
                  Click &quot;Add Account&quot; to create one.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[520px]">
                <div className="flex flex-col gap-1 p-3">
                  {filteredAccounts.map((acc) => {
                    const { amount, isDebit } = getClosingBalance(acc)
                    const isSelected = acc.id === selectedAccountId
                    return (
                      <button
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`
                          group rounded-lg border p-3 text-left transition-colors
                          ${isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent hover:bg-muted/50 hover:border-border'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-slate-600">
                                {acc.accountCode}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                                {acc.accountType}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm font-medium text-slate-900 truncate">
                              {acc.accountName}
                            </p>
                          </div>
                          <span
                            className={`
                              shrink-0 font-mono text-sm font-bold
                              ${isDebit ? 'text-emerald-600' : 'text-red-600'}
                            `}
                          >
                            {formatNum(amount)}
                            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                              {isDebit ? 'Dr' : 'Cr'}
                            </span>
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* ── Right Panel: Transaction Detail ────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            {selectedAccount ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="font-mono text-sm text-muted-foreground">
                      {selectedAccount.accountCode}
                    </span>
                    {selectedAccount.accountName}
                  </CardTitle>
                  <div className="mt-1 flex items-center gap-3">
                    <Badge variant="outline" className="capitalize text-xs">
                      {selectedAccount.accountType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Opening: {formatNum(Math.abs(openingBalance))}
                      {openingBalance >= 0 ? ' Dr' : ' Cr'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedAccountId(null)}>
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                    Back
                  </Button>
                  <Button size="sm" onClick={openAddTx}>
                    <CirclePlus className="mr-1 h-3.5 w-3.5" />
                    Add Transaction
                  </Button>
                </div>
              </div>
            ) : (
              <CardTitle className="text-base text-muted-foreground">
                Select an account to view transactions
              </CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {!selectedAccount ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <BookMarked className="mb-4 h-12 w-12 text-slate-200" />
                <p className="text-sm text-muted-foreground">
                  Choose an account from the list to see its transactions.
                </p>
              </div>
            ) : txLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CirclePlus className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No transactions yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Click &quot;Add Transaction&quot; to record one.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[480px]">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead className="w-[100px]">Reference</TableHead>
                      <TableHead className="w-[100px] text-right">Debit</TableHead>
                      <TableHead className="w-[100px] text-right">Credit</TableHead>
                      <TableHead className="w-[120px] text-right">Balance</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx, index) => {
                      const balIsDebit = tx.balance >= 0
                      return (
                        <TableRow
                          key={tx.id}
                          className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                        >
                          <TableCell className="font-mono text-xs">
                            {tx.date}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {tx.narration || '—'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {tx.reference || '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {tx.debit > 0 ? formatNum(tx.debit) : ''}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {tx.credit > 0 ? formatNum(tx.credit) : ''}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium">
                            <span className={balIsDebit ? 'text-emerald-600' : 'text-red-600'}>
                              {formatNum(tx.balance)}
                            </span>
                            <span className="ml-0.5 text-[10px] text-muted-foreground">
                              {balIsDebit ? 'Dr' : 'Cr'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openDeleteDialog(tx.id, 'tx')}
                              aria-label="Delete transaction"
                            >
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </Button>
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
      </div>

      {/* ── Add Account Dialog ──────────────────────────────────────── */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
            <DialogDescription>
              Create a new ledger account with its opening balance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="acc-code">Account Code</Label>
                <Input
                  id="acc-code"
                  placeholder="e.g. 1001"
                  value={accountForm.accountCode}
                  onChange={(e) => updateAccountField('accountCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-type">Account Type</Label>
                <Select
                  value={accountForm.accountType}
                  onValueChange={(v) => updateAccountField('accountType', v)}
                >
                  <SelectTrigger id="acc-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="acc-name">Account Name</Label>
              <Input
                id="acc-name"
                placeholder="e.g. Cash at Bank"
                value={accountForm.accountName}
                onChange={(e) => updateAccountField('accountName', e.target.value)}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="acc-opening-dr">Opening Debit</Label>
                <Input
                  id="acc-opening-dr"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={accountForm.openingDebit}
                  onChange={(e) => updateAccountField('openingDebit', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-opening-cr">Opening Credit</Label>
                <Input
                  id="acc-opening-cr"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={accountForm.openingCredit}
                  onChange={(e) => updateAccountField('openingCredit', e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAccountSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Transaction Dialog ─────────────────────────────────── */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Record a new transaction for{' '}
              <span className="font-semibold text-foreground">
                {selectedAccount?.accountCode} — {selectedAccount?.accountName}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tx-date">Date</Label>
                <Input
                  id="tx-date"
                  type="date"
                  value={txForm.date}
                  onChange={(e) => updateTxField('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-ref">Reference</Label>
                <Input
                  id="tx-ref"
                  placeholder="e.g. INV-001"
                  value={txForm.reference}
                  onChange={(e) => updateTxField('reference', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-narr">Narration</Label>
              <Input
                id="tx-narr"
                placeholder="Description of the transaction"
                value={txForm.narration}
                onChange={(e) => updateTxField('narration', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tx-debit">Debit</Label>
                <Input
                  id="tx-debit"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={txForm.debit}
                  onChange={(e) => updateTxField('debit', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-credit">Credit</Label>
                <Input
                  id="tx-credit"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={txForm.credit}
                  onChange={(e) => updateTxField('credit', e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTxSubmit} disabled={txSubmitting}>
              {txSubmitting ? 'Saving...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete {deleteTarget === 'account' ? 'Account' : 'Transaction'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget === 'account'
              ? 'Are you sure? This will also delete all transactions for this account. This action cannot be undone.'
              : 'Are you sure you want to delete this transaction? This action cannot be undone.'
            }
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
