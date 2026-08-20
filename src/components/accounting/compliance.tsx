'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  ShieldCheck,
  CircleCheck,
  CircleX,
  CircleDot,
  CircleMinus,
  Save,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── Types ────────────────────────────────────────────────────────────────────

type ComplianceStatus = 'met' | 'not_met' | 'partial' | 'not_applicable'

interface ComplianceItem {
  id: string
  requirement: string
  ipsasReference: string
  status: ComplianceStatus
  details: string
}

interface ComplianceProps {
  reportId: string
}

// Status cycling order
const STATUS_CYCLE: ComplianceStatus[] = [
  'met',
  'partial',
  'not_met',
  'not_applicable',
]

const NEXT_STATUS: Record<ComplianceStatus, ComplianceStatus> = {
  met: 'partial',
  partial: 'not_met',
  not_met: 'not_applicable',
  not_applicable: 'met',
}

const STATUS_LABELS: Record<ComplianceStatus, string> = {
  met: 'Met',
  partial: 'Partial',
  not_met: 'Not Met',
  not_applicable: 'N/A',
}

// ── Score Ring Component ────────────────────────────────────────────────────

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (pct / 100) * circumference

  const color =
    pct >= 80
      ? 'text-emerald-500'
      : pct >= 50
        ? 'text-amber-500'
        : 'text-red-500'

  const strokeColor =
    pct >= 80
      ? 'stroke-emerald-500'
      : pct >= 50
        ? 'stroke-amber-500'
        : 'stroke-red-500'

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-24 w-24">
        <svg
          className="h-24 w-24 -rotate-90 transform"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            className="stroke-slate-200"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            className={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold ${color}`}>{pct}%</span>
          <span className="text-[10px] text-muted-foreground">
            {score}/{total}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  onClick,
}: {
  status: ComplianceStatus
  onClick?: () => void
}) {
  const config: Record<
    ComplianceStatus,
    { className: string; icon: React.ReactNode }
  > = {
    met: {
      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer',
      icon: <CircleCheck className="mr-1 h-3 w-3" />,
    },
    partial: {
      className: 'bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer',
      icon: <CircleDot className="mr-1 h-3 w-3" />,
    },
    not_met: {
      className: 'bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer',
      icon: <CircleX className="mr-1 h-3 w-3" />,
    },
    not_applicable: {
      className: 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer',
      icon: <CircleMinus className="mr-1 h-3 w-3" />,
    },
  }

  const cfg = config[status]

  return (
    <Badge
      className={cfg.className}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      title="Click to cycle status"
    >
      {cfg.icon}
      {STATUS_LABELS[status]}
    </Badge>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Compliance({ reportId }: ComplianceProps) {
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/reports/${reportId}/compliance`)
      if (!res.ok) throw new Error('Failed to fetch compliance checklist')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load compliance checklist')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // ── Summary computation ───────────────────────────────────────────────────

  const applicableItems = useMemo(
    () => items.filter((i) => i.status !== 'not_applicable'),
    [items]
  )

  const metCount = items.filter((i) => i.status === 'met').length
  const notMetCount = items.filter((i) => i.status === 'not_met').length
  const partialCount = items.filter((i) => i.status === 'partial').length

  // Score is based on applicable items (excluding N/A)
  const score = applicableItems.filter((i) => i.status === 'met').length
  const total = applicableItems.length

  // ── Toggle expanded row ───────────────────────────────────────────────────

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // ── Cycle status ─────────────────────────────────────────────────────────

  const cycleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: NEXT_STATUS[item.status] }
          : item
      )
    )
    setHasChanges(true)
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/reports/${reportId}/compliance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!res.ok) throw new Error('Failed to save compliance checklist')

      toast.success('Compliance checklist saved successfully')
      setHasChanges(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save compliance checklist')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            IPSAS Compliance Checklist
          </h2>
          <p className="text-sm text-muted-foreground">
            Assess and track compliance with International Public Sector
            Accounting Standards
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* ── Summary ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Score Ring */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compliance Score
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="flex justify-center py-2">
            <ScoreRing score={score} total={total} />
          </CardContent>
        </Card>

        {/* Met */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Met
            </CardTitle>
            <CircleCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{metCount}</p>
          </CardContent>
        </Card>

        {/* Not Met */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not Met
            </CardTitle>
            <CircleX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{notMetCount}</p>
          </CardContent>
        </Card>

        {/* Partial */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partial
            </CardTitle>
            <CircleDot className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{partialCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Checklist Table ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5" />
            Compliance Requirements
            <Badge variant="secondary" className="ml-2 text-xs">
              {items.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No compliance requirements loaded
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Compliance items will appear here once configured for this
                report.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[36px]"></TableHead>
                    <TableHead className="min-w-[200px]">
                      Requirement
                    </TableHead>
                    <TableHead className="w-[130px]">
                      IPSAS Reference
                    </TableHead>
                    <TableHead className="w-[130px]">
                      <div className="flex items-center gap-1">
                        Status
                        <span className="text-[10px] font-normal text-muted-foreground">
                          (click to cycle)
                        </span>
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[200px]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const isExpanded = expandedRows.has(item.id)
                    return (
                      <>
                        <TableRow
                          key={item.id}
                          className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                        >
                          {/* Expand/collapse */}
                          <TableCell className="w-[36px] p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleRow(item.id)}
                              aria-label={
                                isExpanded
                                  ? 'Collapse details'
                                  : 'Expand details'
                              }
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              )}
                            </Button>
                          </TableCell>
                          {/* Requirement */}
                          <TableCell className="text-sm font-medium">
                            {item.requirement || '—'}
                          </TableCell>
                          {/* IPSAS Reference */}
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {item.ipsasReference || '—'}
                          </TableCell>
                          {/* Status (clickable) */}
                          <TableCell>
                            <StatusBadge
                              status={item.status}
                              onClick={() => cycleStatus(item.id)}
                            />
                          </TableCell>
                          {/* Details preview */}
                          <TableCell className="text-sm text-muted-foreground">
                            {isExpanded || !item.details ? (
                              <span className={item.details ? '' : 'text-slate-300'}>
                                {item.details
                                  ? item.details.length > 80
                                    ? item.details.slice(0, 80) + '...'
                                    : item.details
                                  : '—'}
                              </span>
                            ) : (
                              <span>
                                {item.details.length > 80
                                  ? item.details.slice(0, 80) + '...'
                                  : item.details}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                        {/* Expanded details row */}
                        {isExpanded && item.details && (
                          <TableRow
                            key={`${item.id}-detail`}
                            className="bg-slate-50/40"
                          >
                            <TableCell className="w-[36px]"></TableCell>
                            <TableCell
                              colSpan={4}
                              className="py-3"
                            >
                              <div className="rounded-lg border bg-white p-3 text-sm text-slate-700 leading-relaxed">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Details
                                </span>
                                <p className="mt-1 whitespace-pre-wrap">
                                  {item.details}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
