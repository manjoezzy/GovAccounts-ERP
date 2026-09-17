'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { toast, Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import {
  Sun, Moon, Menu, Landmark, Plus, Bell, X, LogOut, User, ArrowRight,
} from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useIsMobile } from '@/hooks/use-mobile'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import AccountingSidebar from '@/components/accounting/sidebar'

// ═══════════════════════════════════════════════════════════════════
// MODULE IMPORTS
// ═══════════════════════════════════════════════════════════════════
import Dashboard from '@/components/accounting/dashboard'
import FundSetup from '@/components/accounting/fund-setup'
import Votebook from '@/components/accounting/votebook'
import Warrants from '@/components/accounting/warrants'
import Virements from '@/components/accounting/virements'
import CommitmentRegister from '@/components/accounting/commitment-register'
import Procurement from '@/components/accounting/procurement'
import JournalBook from '@/components/accounting/journal-book'
import PurchasesJournal from '@/components/accounting/purchases-journal'
import RevenueJournal from '@/components/accounting/revenue-journal'
import Cashbook from '@/components/accounting/cashbook'
import PettyCash from '@/components/accounting/petty-cash'
import ImprestRegister from '@/components/accounting/imprest-register'
import GeneralLedger from '@/components/accounting/ledger'
import DebtorsLedger from '@/components/accounting/debtors-ledger'
import CreditorsLedger from '@/components/accounting/creditors-ledger'
import AssetRegister from '@/components/accounting/asset-register'
import InventoryLedger from '@/components/accounting/inventory'
import RevenueCapture from '@/components/accounting/revenue-capture'
import ExpenditureCapture from '@/components/accounting/expenditure-capture'
import ChequeRegister from '@/components/accounting/cheque-register'
import SuspenseAccounts from '@/components/accounting/suspense-accounts'
import TaxRegister from '@/components/accounting/tax-register'
import GrantRegister from '@/components/accounting/grant-register'
import DebtRegister from '@/components/accounting/debt-register'
import TrialBalance from '@/components/accounting/trial-balance'
import Appropriation from '@/components/accounting/appropriation'
import InterFund from '@/components/accounting/inter-fund'
import BankRecon from '@/components/accounting/bank-recon'
import ClosingEntries from '@/components/accounting/closing-entries'
import YearEndChecklist from '@/components/accounting/year-end-checklist'
import Statements from '@/components/accounting/statements'
import KPIDashboard from '@/components/accounting/kpi-dashboard'
import AuditTrail from '@/components/accounting/audit-trail'
import Compliance from '@/components/accounting/compliance'
import Approval from '@/components/accounting/approval'
import ExportCenter from '@/components/accounting/export'

// ═══════════════════════════════════════════════════════════════════
// MODULE LABELS
// ═══════════════════════════════════════════════════════════════════

const MODULE_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'fund-setup': 'Fund Setup',
  'votebook': 'Votebook',
  'warrants': 'Warrants',
  'virements': 'Virements',
  'commitments': 'Commitments',
  'procurement': 'Procurement',
  'journal': 'Journal Book',
  'purchases-journal': 'Purchases Journal',
  'revenue-journal': 'Revenue Journal',
  'cashbook': 'Cashbook',
  'petty-cash': 'Petty Cash',
  'imprest': 'Imprest Register',
  'ledger': 'General Ledger',
  'debtors': 'Debtors Ledger',
  'creditors': 'Creditors Ledger',
  'asset-register': 'Asset Register',
  'inventory': 'Inventory Ledger',
  'revenue-capture': 'Revenue Capture',
  'expenditure-capture': 'Expenditure Capture',
  'cheque-register': 'Cheque Register',
  'suspense': 'Suspense Accounts',
  'tax-register': 'Tax Register',
  'grant-register': 'Grant Register',
  'debt-register': 'Debt Register',
  'trial-balance': 'Trial Balance',
  'appropriation': 'Appropriation',
  'inter-fund': 'Inter-Fund Transfers',
  'bank-recon': 'Bank Reconciliation',
  'closing-entries': 'Closing Entries',
  'year-end': 'Year-End Checklist',
  'statements': 'Financial Statements',
  'kpi-dashboard': 'KPI Dashboard',
  'audit-trail': 'Audit Trail',
  'compliance': 'Compliance',
  'approval': 'Approval',
  'export': 'Export Center',
}

// ═══════════════════════════════════════════════════════════════════
// MODULE ROUTER
// ═══════════════════════════════════════════════════════════════════

function ModuleRenderer({ activeModule, reportId, onNavigate }: { activeModule: string; reportId: string; onNavigate: (mod: string) => void }) {
  const commonProps = { reportId }

  switch (activeModule) {
    case 'dashboard':
      return <Dashboard reportId={reportId} onNavigate={onNavigate} />
    case 'fund-setup':
      return <FundSetup {...commonProps} />
    case 'votebook':
      return <Votebook {...commonProps} />
    case 'warrants':
      return <Warrants {...commonProps} />
    case 'virements':
      return <Virements {...commonProps} />
    case 'commitments':
      return <CommitmentRegister {...commonProps} />
    case 'procurement':
      return <Procurement {...commonProps} />
    case 'journal':
      return <JournalBook {...commonProps} />
    case 'purchases-journal':
      return <PurchasesJournal {...commonProps} />
    case 'revenue-journal':
      return <RevenueJournal {...commonProps} />
    case 'cashbook':
      return <Cashbook {...commonProps} />
    case 'petty-cash':
      return <PettyCash {...commonProps} />
    case 'imprest':
      return <ImprestRegister {...commonProps} />
    case 'ledger':
      return <GeneralLedger {...commonProps} />
    case 'debtors':
      return <DebtorsLedger {...commonProps} />
    case 'creditors':
      return <CreditorsLedger {...commonProps} />
    case 'asset-register':
      return <AssetRegister {...commonProps} />
    case 'inventory':
      return <InventoryLedger {...commonProps} />
    case 'revenue-capture':
      return <RevenueCapture {...commonProps} />
    case 'expenditure-capture':
      return <ExpenditureCapture {...commonProps} />
    case 'cheque-register':
      return <ChequeRegister {...commonProps} />
    case 'suspense':
      return <SuspenseAccounts {...commonProps} />
    case 'tax-register':
      return <TaxRegister {...commonProps} />
    case 'grant-register':
      return <GrantRegister {...commonProps} />
    case 'debt-register':
      return <DebtRegister {...commonProps} />
    case 'trial-balance':
      return <TrialBalance {...commonProps} />
    case 'appropriation':
      return <Appropriation {...commonProps} />
    case 'inter-fund':
      return <InterFund {...commonProps} />
    case 'bank-recon':
      return <BankRecon {...commonProps} />
    case 'closing-entries':
      return <ClosingEntries {...commonProps} />
    case 'year-end':
      return <YearEndChecklist {...commonProps} />
    case 'statements':
      return <Statements {...commonProps} />
    case 'kpi-dashboard':
      return <KPIDashboard {...commonProps} />
    case 'audit-trail':
      return <AuditTrail {...commonProps} />
    case 'compliance':
      return <Compliance {...commonProps} />
    case 'approval':
      return <Approval {...commonProps} />
    case 'export':
      return <ExportCenter {...commonProps} />
    default:
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <Landmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">{MODULE_LABELS[activeModule] || 'Unknown Module'}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            This module is currently being developed.
          </p>
        </div>
      )
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════

export default function AccountingERPPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const isMobile = useIsMobile()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeModule, setActiveModule] = useState('dashboard')
  const [reportId, setReportId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gov-erp-report-id') || 'default-report'
    }
    return 'default-report'
  })
  const [reportIdInput, setReportIdInput] = useState('')
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, title: '3 imprests overdue', read: false },
    { id: 2, title: 'Budget at 92% utilization', read: false },
    { id: 3, title: 'Bank recon pending', read: true },
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [reports, setReports] = useState<Array<{id: string; entityName: string; periodLabel: string; status: string}>>([])
  const [carryForwardDialogOpen, setCarryForwardDialogOpen] = useState(false)
  const [carryForwardPeriodEnd, setCarryForwardPeriodEnd] = useState('2026-06-30')
  const [carryForwardPeriodLabel, setCarryForwardPeriodLabel] = useState('30 June 2026')
  const [carryForwardLoading, setCarryForwardLoading] = useState(false)

  // Fetch available reports
  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const handleSetReport = () => {
    if (!reportIdInput.trim()) {
      toast.error('Please enter a report ID')
      return
    }
    const id = reportIdInput.trim()
    setReportId(id)
    localStorage.setItem('gov-erp-report-id', id)
    setReportDialogOpen(false)
    setReportIdInput('')
    toast.success(`Switched to report: ${id}`)
  }

  const handleModuleChange = useCallback((mod: string) => {
    setActiveModule(mod)
    setMobileMenuOpen(false)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <TooltipProvider>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen flex flex-col bg-background">
        {/* ── Top Bar ──────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Landmark className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-base tracking-tight hidden sm:inline">
                  GovAccounts <span className="text-primary">ERP</span>
                </span>
              </div>
              <Separator orientation="vertical" className="h-6 hidden md:block" />
              <span className="text-sm font-medium text-foreground hidden md:inline">
                {MODULE_LABELS[activeModule] || ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Report switcher */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex h-8 text-xs font-mono gap-1.5"
                    onClick={() => setReportDialogOpen(true)}
                  >
                    <Landmark className="h-3 w-3" />
                    {reports.length > 0
                      ? reports.find(r => r.id === reportId)?.entityName || reportId
                      : reportId}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Switch Report / Period</p></TooltipContent>
              </Tooltip>
              {/* New report button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hidden sm:flex"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/reports', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            entityName: 'Government Entity',
                            periodEnd: '2025-06-30',
                            periodLabel: '30 June 2025',
                            currency: 'Shs',
                          }),
                        })
                        if (!res.ok) throw new Error()
                        const report = await res.json()
                        setReportId(report.id)
                        localStorage.setItem('gov-erp-report-id', report.id)
                        setReports(prev => [report, ...prev])
                        toast.success('New report created')
                      } catch {
                        toast.error('Failed to create report')
                      }
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>New Report</p></TooltipContent>
              </Tooltip>
              {/* Carry Forward button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex h-8 text-xs gap-1.5"
                    onClick={() => setCarryForwardDialogOpen(true)}
                    disabled={reports.length === 0}
                  >
                    <ArrowRight className="h-3 w-3" />
                    <span className="hidden md:inline">Carry Forward</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>New Period (Carry Forward)</p></TooltipContent>
              </Tooltip>
              {/* Notifications */}
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 relative"
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Notifications</p></TooltipContent>
                </Tooltip>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                      <span className="text-sm font-semibold">Notifications</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNotifications(false)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <ScrollArea className="max-h-60">
                      {notifications.map(n => (
                        <div
                          key={n.id}
                          className={`px-3 py-2 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                          onClick={() => {
                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {!n.read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                            <span className={`text-sm ${!n.read ? 'font-medium' : 'text-muted-foreground'}`}>{n.title}</span>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>
              {/* User Menu */ }
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {session?.user?.name
                          ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          : <User className="h-3.5 w-3.5" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{session?.user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{session?.user?.email || ''}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                    Role: {(session?.user as any)?.role || 'accountant'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Theme toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    {mounted && (theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Toggle theme</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* ── Body ──────────────────────────────────────────── */}
        <div className="flex flex-1">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <AccountingSidebar
              activeModule={activeModule}
              onModuleChange={handleModuleChange}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
          {/* Mobile Sidebar */}
          <div className="lg:hidden">
            <AccountingSidebar
              activeModule={activeModule}
              onModuleChange={handleModuleChange}
              isCollapsed={!mobileMenuOpen}
              onToggleCollapse={() => setMobileMenuOpen(false)}
            />
          </div>
          {/* Main Content */}
          <motion.main
            className="flex-1 min-w-0"
            animate={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 64 : 256) }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModule}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <ModuleRenderer
                    activeModule={activeModule}
                    reportId={reportId}
                    onNavigate={handleModuleChange}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.main>
        </div>

        {/* ── Footer — matches sidebar margin so nothing is overlaid ── */}
        <footer
          className="border-t border-border mt-auto transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 64 : 256) }}
        >
          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>GovAccounts ERP — Government Accounting System</span>
            <div className="flex items-center gap-3">
              <span>IPSAS Compliant</span>
              <Badge variant="outline" className="text-[10px]">v2.0</Badge>
            </div>
          </div>
        </footer>
      </div>

      {/* ── Carry Forward Dialog ────────────────────────────── */}
      <Dialog open={carryForwardDialogOpen} onOpenChange={setCarryForwardDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>New Period (Carry Forward)</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <p className="text-sm text-muted-foreground">
              Carry forward balances from the current report into a new reporting period.
              Revenue &amp; expense accounts reset to zero; assets &amp; liabilities carry forward.
            </p>
            <div className="space-y-2">
              <Label htmlFor="cf-source">Source Report</Label>
              <div className="text-sm font-medium px-3 py-2 rounded-md bg-muted">
                {reports.find(r => r.id === reportId)?.entityName || 'Current'} — {reports.find(r => r.id === reportId)?.periodLabel || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-period-end">New Period End Date</Label>
              <Input
                id="cf-period-end"
                placeholder="2026-06-30"
                value={carryForwardPeriodEnd}
                onChange={(e) => setCarryForwardPeriodEnd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-period-label">New Period Label</Label>
              <Input
                id="cf-period-label"
                placeholder="30 June 2026"
                value={carryForwardPeriodLabel}
                onChange={(e) => setCarryForwardPeriodLabel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCarryForwardDialogOpen(false)} disabled={carryForwardLoading}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!carryForwardPeriodEnd.trim() || !carryForwardPeriodLabel.trim()) {
                  toast.error('Please fill in all fields')
                  return
                }
                setCarryForwardLoading(true)
                try {
                  const res = await fetch('/api/reports/carry-forward', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sourceReportId: reportId,
                      newPeriodEnd: carryForwardPeriodEnd.trim(),
                      newPeriodLabel: carryForwardPeriodLabel.trim(),
                    }),
                  })
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(err.error || 'Carry forward failed')
                  }
                  const newReport = await res.json()
                  setReportId(newReport.id)
                  localStorage.setItem('gov-erp-report-id', newReport.id)
                  // Refresh the report list
                  const listRes = await fetch('/api/reports')
                  const listData = await listRes.json()
                  if (Array.isArray(listData)) setReports(listData)
                  setCarryForwardDialogOpen(false)
                  toast.success(`Carry forward complete: ${carryForwardPeriodLabel}`)
                } catch (err: any) {
                  toast.error(err.message || 'Carry forward failed')
                } finally {
                  setCarryForwardLoading(false)
                }
              }}
              disabled={carryForwardLoading}
            >
              {carryForwardLoading ? 'Processing...' : 'Carry Forward'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Report Switcher Dialog ──────────────────────────── */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Switch Report</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            {reports.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Existing Reports</Label>
                <ScrollArea className="max-h-40">
                  {reports.map(r => (
                    <button
                      key={r.id}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between hover:bg-muted/50 transition-colors ${r.id === reportId ? 'bg-primary/10 border border-primary/20' : ''}`}
                      onClick={() => {
                        setReportId(r.id)
                        localStorage.setItem('gov-erp-report-id', r.id)
                        setReportDialogOpen(false)
                        toast.success(`Switched to: ${r.entityName}`)
                      }}
                    >
                      <div>
                        <div className="font-medium">{r.entityName}</div>
                        <div className="text-xs text-muted-foreground">{r.periodLabel}</div>
                      </div>
                      <Badge variant={r.id === reportId ? 'default' : 'outline'} className="text-[10px]">
                        {r.status}
                      </Badge>
                    </button>
                  ))}
                </ScrollArea>
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="report-id-input">Or enter Report ID manually</Label>
              <Input
                id="report-id-input"
                placeholder="Enter report ID"
                value={reportIdInput}
                onChange={(e) => setReportIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetReport()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSetReport}>Switch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
