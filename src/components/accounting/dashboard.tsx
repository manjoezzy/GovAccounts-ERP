'use client'

import { useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  BookOpen,
  Wallet,
  BookPlus,
  CircleDollarSign,
  Table,
  FileBarChart,
  AlertTriangle,
  Info,
  ArrowRight,
  Activity,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface DashboardProps {
  reportId: string
  onNavigate: (module: string) => void
}

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ─── KPI Data ───────────────────────────────────────────────────────────────

interface KpiData {
  label: string
  value: string
  rawValue: number
  icon: React.ReactNode
  color: string
  bgColor: string
  subtext?: string
}

// ─── Progress Ring ───────────────────────────────────────────────────────────

function ProgressRing({
  percentage,
  size = 72,
  strokeWidth = 6,
}: {
  percentage: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn(
          'transition-all duration-700 ease-out',
          percentage >= 90
            ? 'text-red-500'
            : percentage >= 70
              ? 'text-amber-500'
              : 'text-emerald-500'
        )}
      />
    </svg>
  )
}

// ─── Quick Access Items ──────────────────────────────────────────────────────

interface QuickAccessItem {
  label: string
  description: string
  icon: React.ReactNode
  module: string
  color: string
}

const quickAccessItems: QuickAccessItem[] = [
  {
    label: 'Votebook',
    description: 'Manage vote allocations',
    icon: <BookOpen className="size-5" />,
    module: 'votebook',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    label: 'Cashbook',
    description: 'Track cash transactions',
    icon: <Wallet className="size-5" />,
    module: 'cashbook',
    color: 'text-sky-600 bg-sky-50',
  },
  {
    label: 'Journal Book',
    description: 'Post journal entries',
    icon: <BookPlus className="size-5" />,
    module: 'journal',
    color: 'text-violet-600 bg-violet-50',
  },
  {
    label: 'Revenue Capture',
    description: 'Record revenue receipts',
    icon: <CircleDollarSign className="size-5" />,
    module: 'revenue-capture',
    color: 'text-teal-600 bg-teal-50',
  },
  {
    label: 'Trial Balance',
    description: 'View trial balance report',
    icon: <Table className="size-5" />,
    module: 'trial-balance',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    label: 'Financial Statements',
    description: 'Generated financial reports',
    icon: <FileBarChart className="size-5" />,
    module: 'statements',
    color: 'text-rose-600 bg-rose-50',
  },
]

// ─── Recent Activity ─────────────────────────────────────────────────────────

const recentActivities = [
  {
    text: 'Journal entry JE-001 posted',
    time: '2 hours ago',
    icon: <BookPlus className="size-4" />,
  },
  {
    text: 'Revenue of Shs 5,000,000 recorded',
    time: '4 hours ago',
    icon: <DollarSign className="size-4" />,
  },
  {
    text: 'Votebook updated for Vote 101',
    time: 'yesterday',
    icon: <BookOpen className="size-4" />,
  },
  {
    text: 'Bank reconciliation completed',
    time: '2 days ago',
    icon: <Wallet className="size-4" />,
  },
]

// ─── Alerts ──────────────────────────────────────────────────────────────────

const alerts = [
  {
    title: 'Imprest Overdue',
    description: '3 imprests overdue for surrender',
    variant: 'warning' as const,
  },
  {
    title: 'Suspense Threshold',
    description: 'Suspense account balance exceeds threshold',
    variant: 'warning' as const,
  },
  {
    title: 'Budget Utilization',
    description: 'Budget utilization at 92%',
    variant: 'info' as const,
  },
]

// ─── Dashboard Component ─────────────────────────────────────────────────────

export default function Dashboard({ reportId, onNavigate }: DashboardProps) {
  // Mock KPI data
  const kpis: KpiData[] = useMemo(
    () => [
      {
        label: 'Total Revenue',
        value: `Shs ${formatNum(485_000_000)}`,
        rawValue: 485_000_000,
        icon: <TrendingUp className="size-5" />,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        subtext: '+12.5% from last period',
      },
      {
        label: 'Total Expenditure',
        value: `Shs ${formatNum(412_000_000)}`,
        rawValue: 412_000_000,
        icon: <TrendingDown className="size-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        subtext: '+8.2% from last period',
      },
      {
        label: 'Net Surplus/(Deficit)',
        value: `Shs ${formatNum(73_000_000)}`,
        rawValue: 73_000_000,
        icon: <BarChart3 className="size-5" />,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        subtext: 'Surplus this period',
      },
      {
        label: 'Budget Utilization',
        value: '92%',
        rawValue: 92,
        icon: <DollarSign className="size-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        subtext: 'Shs 460M of Shs 500M',
      },
      {
        label: 'Open Commitments',
        value: `Shs ${formatNum(28_500_000)}`,
        rawValue: 28_500_000,
        icon: <Activity className="size-5" />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        subtext: '12 pending commitments',
      },
      {
        label: 'Outstanding Suspense',
        value: `Shs ${formatNum(5_200_000)}`,
        rawValue: 5_200_000,
        icon: <AlertTriangle className="size-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        subtext: '3 unresolved items',
      },
    ],
    []
  )

  // Determine surplus/deficit color dynamically
  const netSurplusKpi = kpis[2]
  const isSurplus = netSurplusKpi.rawValue >= 0

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Accounting Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Ministry of Finance &amp; Economic Planning — FY 2024/2025
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">
          Report ID: {reportId} · Period: July 2024 – June 2025
        </p>
      </div>

      {/* ── KPI Cards (2x3 grid) ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => {
          // Special rendering for Budget Utilization with progress ring
          const isBudgetUtil = idx === 3

          return (
            <Card key={kpi.label} className="gap-4">
              <CardHeader className="pb-0 pt-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </CardTitle>
                  <div
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg',
                      kpi.bgColor,
                      kpi.color
                    )}
                  >
                    {kpi.icon}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-0">
                <div className="flex items-end justify-between gap-2">
                  <div className="space-y-1">
                    {/* Dynamic color for net surplus/deficit */}
                    <p
                      className={cn(
                        'text-2xl font-bold tracking-tight',
                        idx === 2
                          ? isSurplus
                            ? 'text-emerald-600'
                            : 'text-red-600'
                          : kpi.color
                      )}
                    >
                      {idx === 2 && !isSurplus ? '(' : ''}
                      {kpi.value}
                      {idx === 2 && !isSurplus ? ')' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kpi.subtext}
                    </p>
                  </div>
                  {isBudgetUtil && (
                    <div className="relative flex items-center justify-center">
                      <ProgressRing percentage={kpi.rawValue} />
                      <span className="absolute text-xs font-semibold">
                        {kpi.rawValue}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Quick Access Grid (3x2) ─────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccessItems.map((item) => (
            <Card
              key={item.module}
              className="cursor-pointer gap-0 py-0 transition-all hover:shadow-md hover:border-foreground/20 group"
              onClick={() => onNavigate(item.module)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-lg',
                      item.color
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate">
                        {item.label}
                      </p>
                      <ArrowRight className="size-3.5 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Bottom Grid: Recent Activity + Alerts ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {recentActivities.map((activity, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground mt-0.5">
                    {activity.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">
                      {activity.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-500" />
              Alerts &amp; Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <Alert
                  key={idx}
                  className={cn(
                    alert.variant === 'warning' &&
                      'border-amber-200 bg-amber-50 text-amber-800 [&>svg]:text-amber-500',
                    alert.variant === 'info' &&
                      'border-sky-200 bg-sky-50 text-sky-800 [&>svg]:text-sky-500'
                  )}
                >
                  {alert.variant === 'warning' ? (
                    <AlertTriangle className="size-4" />
                  ) : (
                    <Info className="size-4" />
                  )}
                  <AlertTitle className="text-sm font-semibold">
                    {alert.title}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {alert.description}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
