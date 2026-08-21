'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Landmark,
  BookOpen,
  ShieldCheck,
  ArrowLeftRight,
  FileCheck,
  ShoppingCart,
  BookPlus,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Coins,
  UserCheck,
  BookMarked,
  Users,
  Building2,
  Building,
  Package,
  CircleDollarSign,
  CircleMinus,
  FileText,
  HelpCircle,
  Receipt,
  Gift,
  Table,
  Scale,
  ArrowRightLeft,
  CheckSquare,
  ClipboardList,
  FileBarChart,
  BarChart3,
  History,
  Shield,
  CheckCircle2,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

interface NavItem {
  label: string
  module: string
  icon: LucideIcon
  badge?: number
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// ─── Navigation Data ─────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Setup',
    items: [
      { label: 'Dashboard', module: 'dashboard', icon: LayoutDashboard },
      { label: 'Fund Setup', module: 'fund-setup', icon: Landmark },
    ],
  },
  {
    label: 'Budget Control',
    items: [
      { label: 'Votebook', module: 'votebook', icon: BookOpen },
      { label: 'Warrants', module: 'warrants', icon: ShieldCheck },
      { label: 'Virements', module: 'virements', icon: ArrowLeftRight },
      { label: 'Commitments', module: 'commitments', icon: FileCheck },
      { label: 'Procurement', module: 'procurement', icon: ShoppingCart },
    ],
  },
  {
    label: 'Books of Entry',
    items: [
      { label: 'Journal Book', module: 'journal', icon: BookPlus },
      { label: 'Purchases Journal', module: 'purchases-journal', icon: ShoppingBag },
      { label: 'Revenue Journal', module: 'revenue-journal', icon: TrendingUp },
      { label: 'Cashbook', module: 'cashbook', icon: Wallet },
      { label: 'Petty Cash', module: 'petty-cash', icon: Coins },
      { label: 'Imprest Register', module: 'imprest', icon: UserCheck },
    ],
  },
  {
    label: 'Ledgers',
    items: [
      { label: 'General Ledger', module: 'ledger', icon: BookMarked },
      { label: 'Debtors Ledger', module: 'debtors', icon: Users, badge: 0 },
      { label: 'Creditors Ledger', module: 'creditors', icon: Building2, badge: 0 },
      { label: 'Asset Register', module: 'asset-register', icon: Building },
      { label: 'Inventory Ledger', module: 'inventory', icon: Package },
    ],
  },
  {
    label: 'Revenue & Expenditure',
    items: [
      { label: 'Revenue Capture', module: 'revenue-capture', icon: CircleDollarSign },
      { label: 'Expenditure Capture', module: 'expenditure-capture', icon: CircleMinus },
    ],
  },
  {
    label: 'Control Accounts',
    items: [
      { label: 'Cheque Register', module: 'cheque-register', icon: FileText },
      { label: 'Suspense Accounts', module: 'suspense', icon: HelpCircle, badge: 0 },
      { label: 'Tax Register', module: 'tax-register', icon: Receipt },
      { label: 'Grant Register', module: 'grant-register', icon: Gift },
      { label: 'Debt Register', module: 'debt-register', icon: Landmark },
    ],
  },
  {
    label: 'Period-End',
    items: [
      { label: 'Trial Balance', module: 'trial-balance', icon: Table },
      { label: 'Appropriation', module: 'appropriation', icon: Scale },
      { label: 'Inter-Fund Transfers', module: 'inter-fund', icon: ArrowRightLeft },
      { label: 'Bank Reconciliation', module: 'bank-recon', icon: ArrowLeftRight },
      { label: 'Closing Entries', module: 'closing-entries', icon: CheckSquare },
      { label: 'Year-End Checklist', module: 'year-end', icon: ClipboardList },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Financial Statements', module: 'statements', icon: FileBarChart },
      { label: 'KPI Dashboard', module: 'kpi-dashboard', icon: BarChart3 },
      { label: 'Audit Trail', module: 'audit-trail', icon: History },
      { label: 'Compliance', module: 'compliance', icon: Shield },
      { label: 'Approval', module: 'approval', icon: CheckCircle2 },
      { label: 'Export', module: 'export', icon: Download },
    ],
  },
]

// ─── Nav Item Component ─────────────────────────────────────────────────────

function NavItemButton({
  item,
  isActive,
  isCollapsed,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  onClick: () => void
}) {
  const Icon = item.icon

  const buttonContent = (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150',
        isActive
          ? 'bg-primary/10 font-medium text-primary border-l-2 border-primary'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        <Icon className={cn('h-4 w-4', isActive && 'text-primary')} />
      </span>

      <AnimatePresence mode="wait" initial={false}>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="truncate whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {!isCollapsed && item.badge !== undefined && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="ml-auto"
          >
            <Badge
              variant="secondary"
              className="h-5 min-w-5 px-1.5 text-[10px] font-semibold"
            >
              {item.badge}
            </Badge>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          <p className="text-xs font-medium">{item.label}</p>
          {item.badge !== undefined && (
            <p className="text-[10px] text-muted-foreground">
              Pending: {item.badge}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return buttonContent
}

// ─── Nav Group Component ────────────────────────────────────────────────────

function NavGroupSection({
  group,
  activeModule,
  isCollapsed,
  onModuleChange,
}: {
  group: NavGroup
  activeModule: string
  isCollapsed: boolean
  onModuleChange: (module: string) => void
}) {
  return (
    <div className="mb-2">
      <AnimatePresence mode="wait" initial={false}>
        {!isCollapsed ? (
          <motion.div
            key="expanded-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="px-3 pb-1.5 pt-4"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed-separator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex justify-center py-2"
          >
            <Separator className="w-6" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-0.5">
        {group.items.map((item) => (
          <NavItemButton
            key={item.module}
            item={item}
            isActive={activeModule === item.module}
            isCollapsed={isCollapsed}
            onClick={() => onModuleChange(item.module)}
          />
        ))}
      </div>
    </div>
  )
}
// ─── Sidebar Content (shared between desktop and mobile) ─────────────────────

function SidebarContent({
  activeModule,
  onModuleChange,
  isCollapsed,
  onToggleCollapse,
  isMobile = false,
}: {
  activeModule: string
  onModuleChange: (module: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobile?: boolean
}) {
  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center border-b border-border px-3">
          <AnimatePresence mode="wait" initial={false}>
            {!isCollapsed ? (
              <motion.div
                key="expanded-header"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex items-center gap-2.5 overflow-hidden"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary">
                  <Landmark className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="truncate text-sm font-bold tracking-tight">
                  GovAccounts
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-header"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex w-full justify-center"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <Landmark className="h-4 w-4 text-primary-foreground" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Scroll Area — overflow-hidden ensures Radix ScrollArea can compute height */}
        <ScrollArea className="flex-1 px-2 py-1 overflow-hidden">
          <nav className="flex flex-col" role="navigation" aria-label="Accounting modules">
            {NAV_GROUPS.map((group) => (
              <NavGroupSection
                key={group.label}
                group={group}
                activeModule={activeModule}
                isCollapsed={isCollapsed}
                onModuleChange={onModuleChange}
              />
            ))}
          </nav>
        </ScrollArea>

        {/* Footer with Collapse Toggle */}
        <div className="shrink-0 border-t border-border p-2">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className={cn(
                  'w-full justify-center',
                  !isCollapsed && 'justify-start gap-2'
                )}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4 shrink-0" />
                    <span className="text-sm">Collapse</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={12}>
                <p className="text-xs font-medium">Expand sidebar</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}

// ─── Main Sidebar Component ─────────────────────────────────────────────────

export default function AccountingSidebar({
  activeModule,
  onModuleChange,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const isMobile = useIsMobile()

  // Mobile: render as a Sheet overlay
  if (isMobile) {
    return (
      <Sheet
        open={!isCollapsed}
        onOpenChange={(open) => {
          if (!open) onToggleCollapse()
        }}
      >
        <SheetContent
          side="left"
          className="w-72 p-0"
        >
          <SheetTitle className="sr-only">Accounting Navigation</SheetTitle>
          <SidebarContent
            activeModule={activeModule}
            onModuleChange={(module) => {
              onModuleChange(module)
              onToggleCollapse()
            }}
            isCollapsed={false}
            onToggleCollapse={onToggleCollapse}
            isMobile
          />
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: fixed sidebar with collapse animation
  return (
    <motion.aside
      className="fixed inset-y-0 left-0 z-30 flex flex-col bg-card border-r border-border"
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      role="complementary"
      aria-label="Accounting sidebar"
    >
      <SidebarContent
        activeModule={activeModule}
        onModuleChange={onModuleChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </motion.aside>
  )
}
