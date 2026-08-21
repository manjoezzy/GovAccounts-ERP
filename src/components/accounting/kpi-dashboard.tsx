'use client'

import { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  Info,
  Activity,
  BarChart3,
  Target,
  ChevronDown,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface KpiDashboardProps {
  reportId: string
}

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ─── Financial Health Gauge ──────────────────────────────────────────────

function HealthGauge({ score }: { score: number }) {
  const size = 200
  const strokeWidth = 16
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score > 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-500'
  const bgColor =
    score > 70
      ? 'stroke-emerald-100'
      : score >= 40
        ? 'stroke-amber-100'
        : 'stroke-red-100'
  const label =
    score > 70 ? 'Healthy' : score >= 40 ? 'Caution' : 'Critical'
  const labelColor =
    score > 70
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : score >= 40
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-red-600 bg-red-50 border-red-200'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={bgColor}
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
            className={cn('transition-all duration-1000 ease-out', color)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-4xl font-bold tracking-tight', color.replace('text-', 'text-'))}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">out of 100</span>
        </div>
      </div>
      <Badge variant="outline" className={cn('text-xs font-medium px-3 py-0.5 border', labelColor)}>
        {label}
      </Badge>
    </div>
  )
}

// ─── Key Ratio Card ─────────────────────────────────────────────────────

interface RatioData {
  label: string
  value: string
  rawValue: number
  priorValue: number
  description: string
}

function RatioCard({ ratio }: { ratio: RatioData }) {
  const change = ratio.rawValue - ratio.priorValue
  const isUp = change >= 0

  return (
    <Card className="gap-3 py-4">
      <CardContent className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {ratio.label}
        </p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold tracking-tight">{ratio.value}</span>
          <div
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium mb-1',
              isUp ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {isUp ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            <span>{isUp ? '+' : ''}{change.toFixed(1)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {ratio.description}
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Trend Bar Chart (pure div bars) ────────────────────────────────────

interface TrendBarData {
  month: string
  revenue: number
  expenditure: number
}

function TrendBarChart({ data }: { data: TrendBarData[] }) {
  const maxVal = Math.max(...data.flatMap((d) => [d.revenue, d.expenditure]))

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-6 mb-2">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-sm bg-emerald-500" />
          <span className="text-xs text-muted-foreground">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-sm bg-red-400" />
          <span className="text-xs text-muted-foreground">Expenditure</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {data.map((d) => (
          <div key={d.month} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
              {d.month}
            </span>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 rounded-sm bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(d.revenue / maxVal) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground shrink-0 w-14 text-right">
                  {formatNum(d.revenue)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 rounded-sm bg-red-400 transition-all duration-500"
                  style={{ width: `${(d.expenditure / maxVal) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground shrink-0 w-14 text-right">
                  {formatNum(d.expenditure)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Anomaly Alert Item ─────────────────────────────────────────────────

interface Anomaly {
  severity: 'critical' | 'warning' | 'info'
  message: string
  detail: string
}

const severityConfig = {
  critical: {
    icon: <AlertCircle className="size-4 text-red-500" />,
    badge: 'Critical',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    border: 'border-l-4 border-l-red-500',
  },
  warning: {
    icon: <AlertTriangle className="size-4 text-amber-500" />,
    badge: 'Warning',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    border: 'border-l-4 border-l-amber-500',
  },
  info: {
    icon: <Info className="size-4 text-sky-500" />,
    badge: 'Info',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    border: 'border-l-4 border-l-sky-500',
  },
}

// ─── Benchmark Row ──────────────────────────────────────────────────────

interface BenchmarkRow {
  metric: string
  entity: number
  peerAvg: number
  sectorBench: number
  unit: string
  higherIsBetter: boolean
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function KpiDashboard({ reportId }: KpiDashboardProps) {
  const [period, setPeriod] = useState('fy2024-25')

  // ── Financial Health Score ──
  const healthScore = 74

  // ── Key Ratios ──
  const ratios: RatioData[] = useMemo(
    () => [
      {
        label: 'Current Ratio',
        value: '1.82',
        rawValue: 1.82,
        priorValue: 1.65,
        description: 'Current assets divided by current liabilities',
      },
      {
        label: 'Surplus Margin',
        value: '15.1%',
        rawValue: 15.1,
        priorValue: 12.3,
        description: 'Surplus as a percentage of total revenue',
      },
      {
        label: 'Budget Utilization',
        value: '87.4%',
        rawValue: 87.4,
        priorValue: 82.1,
        description: 'Actual expenditure vs revised budget',
      },
      {
        label: 'Collection Rate',
        value: '91.6%',
        rawValue: 91.6,
        priorValue: 88.2,
        description: 'Cash collected vs revenue billed',
      },
      {
        label: 'Expenditure Coverage',
        value: '117.8%',
        rawValue: 117.8,
        priorValue: 112.4,
        description: 'Revenue as a percentage of expenditure',
      },
      {
        label: 'Debt Service Ratio',
        value: '8.3%',
        rawValue: 8.3,
        priorValue: 9.7,
        description: 'Debt service as a percentage of revenue',
      },
    ],
    []
  )

  // ── Trend Data (12 months) ──
  const trendData: TrendBarData[] = useMemo(
    () => [
      { month: 'Jul', revenue: 38_000_000, expenditure: 32_000_000 },
      { month: 'Aug', revenue: 42_000_000, expenditure: 35_000_000 },
      { month: 'Sep', revenue: 39_000_000, expenditure: 37_000_000 },
      { month: 'Oct', revenue: 45_000_000, expenditure: 34_000_000 },
      { month: 'Nov', revenue: 41_000_000, expenditure: 38_000_000 },
      { month: 'Dec', revenue: 36_000_000, expenditure: 40_000_000 },
      { month: 'Jan', revenue: 44_000_000, expenditure: 36_000_000 },
      { month: 'Feb', revenue: 40_000_000, expenditure: 39_000_000 },
      { month: 'Mar', revenue: 43_000_000, expenditure: 35_000_000 },
      { month: 'Apr', revenue: 38_000_000, expenditure: 37_000_000 },
      { month: 'May', revenue: 41_000_000, expenditure: 42_000_000 },
      { month: 'Jun', revenue: 38_000_000, expenditure: 37_000_000 },
    ],
    []
  )

  // ── Anomalies ──
  const anomalies: Anomaly[] = useMemo(
    () => [
      {
        severity: 'warning',
        message: 'Revenue variance exceeds 15%',
        detail:
          'May 2025 revenue of Shs 41M fell 15.2% below the projected Shs 48.4M target for the month.',
      },
      {
        severity: 'critical',
        message: 'Cash balance declining for 3 consecutive months',
        detail:
          'Cash at bank has decreased from Shs 125M (Mar) to Shs 98M (Jun), a 21.6% decline over the quarter.',
      },
      {
        severity: 'info',
        message: 'Budget utilization above 95% with 2 months remaining',
        detail:
          'Personnel expenditure vote has consumed 96.2% of the revised budget with 2 months left in the fiscal year.',
      },
    ],
    []
  )

  // ── Benchmarking Data ──
  const benchmarks: BenchmarkRow[] = useMemo(
    () => [
      {
        metric: 'Current Ratio',
        entity: 1.82,
        peerAvg: 1.65,
        sectorBench: 1.50,
        unit: 'x',
        higherIsBetter: true,
      },
      {
        metric: 'Surplus Margin',
        entity: 15.1,
        peerAvg: 11.8,
        sectorBench: 10.0,
        unit: '%',
        higherIsBetter: true,
      },
      {
        metric: 'Collection Rate',
        entity: 91.6,
        peerAvg: 87.3,
        sectorBench: 85.0,
        unit: '%',
        higherIsBetter: true,
      },
      {
        metric: 'Budget Utilization',
        entity: 87.4,
        peerAvg: 84.2,
        sectorBench: 90.0,
        unit: '%',
        higherIsBetter: true,
      },
      {
        metric: 'Debt Service Ratio',
        entity: 8.3,
        peerAvg: 10.5,
        sectorBench: 12.0,
        unit: '%',
        higherIsBetter: false,
      },
      {
        metric: 'Expenditure Coverage',
        entity: 117.8,
        peerAvg: 110.2,
        sectorBench: 108.0,
        unit: '%',
        higherIsBetter: true,
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">KPI Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Financial performance analytics · Report {reportId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fy2024-25">FY 2024/2025</SelectItem>
              <SelectItem value="fy2023-24">FY 2023/2024</SelectItem>
              <SelectItem value="q4-2024">Q4 2024</SelectItem>
              <SelectItem value="q3-2024">Q3 2024</SelectItem>
              <SelectItem value="q2-2024">Q2 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Financial Health Score ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-muted-foreground" />
            Financial Health Score
          </CardTitle>
          <CardDescription>
            Composite score based on liquidity, solvency, efficiency, and budgetary performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-4">
            <HealthGauge score={healthScore} />
            <div className="grid grid-cols-3 gap-6 mt-6 w-full max-w-md">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Liquidity</p>
                <p className="text-lg font-semibold text-emerald-600">82</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Solvency</p>
                <p className="text-lg font-semibold text-emerald-600">68</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Efficiency</p>
                <p className="text-lg font-semibold text-amber-600">71</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Key Ratios Grid (2x3) ───────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Target className="size-4 text-muted-foreground" />
          Key Financial Ratios
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ratios.map((ratio) => (
            <RatioCard key={ratio.label} ratio={ratio} />
          ))}
        </div>
      </div>

      {/* ── Trend Section ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-muted-foreground" />
            Revenue vs Expenditure Trend
          </CardTitle>
          <CardDescription>Monthly comparison for the selected fiscal period (in Shs millions)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <TrendBarChart data={trendData} />
          </div>
        </CardContent>
      </Card>

      {/* ── Anomaly Alerts ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          Anomaly Alerts
        </h2>
        <div className="space-y-3">
          {anomalies.map((anomaly, idx) => {
            const config = severityConfig[anomaly.severity]
            return (
              <Card key={idx} className={cn('gap-0 py-0', config.border)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{config.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{anomaly.message}</p>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] px-1.5 py-0 border', config.badgeClass)}
                        >
                          {config.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {anomaly.detail}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ── Benchmarking ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4 text-muted-foreground" />
            Benchmarking Comparison
          </CardTitle>
          <CardDescription>
            Entity performance vs peer group average and sector benchmark
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Metric</TableHead>
                  <TableHead className="text-xs text-right">This Entity</TableHead>
                  <TableHead className="text-xs text-right">Peer Average</TableHead>
                  <TableHead className="text-xs text-right">Sector Benchmark</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benchmarks.map((b) => {
                  const abovePeer = b.higherIsBetter
                    ? b.entity >= b.peerAvg
                    : b.entity <= b.peerAvg
                  const aboveBench = b.higherIsBetter
                    ? b.entity >= b.sectorBench
                    : b.entity <= b.sectorBench

                  return (
                    <TableRow key={b.metric}>
                      <TableCell className="text-sm font-medium">{b.metric}</TableCell>
                      <TableCell className="text-sm text-right font-semibold">
                        {b.entity}{b.unit}
                      </TableCell>
                      <TableCell className="text-sm text-right text-muted-foreground">
                        {b.peerAvg}{b.unit}
                      </TableCell>
                      <TableCell className="text-sm text-right text-muted-foreground">
                        {b.sectorBench}{b.unit}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 border',
                              abovePeer
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            )}
                          >
                            {abovePeer ? 'Above' : 'Below'} Peer
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 border',
                              aboveBench
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            )}
                          >
                            {aboveBench ? 'Above' : 'Below'} Benchmark
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}