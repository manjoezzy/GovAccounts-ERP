'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  History,
  Filter,
  Clock,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatTimestamp(ts: string): string {
  if (!ts) return '—'
  try {
    const d = new Date(ts)
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  } catch {
    return ts
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string
  timestamp: string
  action: string
  user: string
  field: string
  oldValue: string
  newValue: string
}

interface AuditTrailProps {
  reportId: string
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AuditTrail({ reportId }: AuditTrailProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/reports/${reportId}/audit`)
      if (!res.ok) throw new Error('Failed to fetch audit trail')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load audit trail')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // ── Local filtering ───────────────────────────────────────────────────────

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Action filter
      if (actionFilter !== 'all' && entry.action !== actionFilter) {
        return false
      }

      // Date range filter
      if (dateFrom) {
        const entryDate = new Date(entry.timestamp).toISOString().split('T')[0]
        if (entryDate < dateFrom) return false
      }

      if (dateTo) {
        const entryDate = new Date(entry.timestamp).toISOString().split('T')[0]
        if (entryDate > dateTo) return false
      }

      return true
    })
  }, [entries, actionFilter, dateFrom, dateTo])

  // ── Badge helpers ─────────────────────────────────────────────────────────

  const actionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Create
          </Badge>
        )
      case 'update':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Update
          </Badge>
        )
      case 'delete':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Delete
          </Badge>
        )
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit Trail
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete history of all changes
          </p>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Action Type Filter */}
            <div className="space-y-1.5">
              <Label htmlFor="audit-action" className="text-xs">
                Action Type
              </Label>
              <Select
                value={actionFilter}
                onValueChange={setActionFilter}
              >
                <SelectTrigger id="audit-action" className="h-9">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <Label htmlFor="audit-from" className="text-xs">
                Date From
              </Label>
              <Input
                id="audit-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <Label htmlFor="audit-to" className="text-xs">
                Date To
              </Label>
              <Input
                id="audit-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Audit Log
            <Badge variant="secondary" className="ml-2 text-xs">
              {filteredEntries.length} of {entries.length} entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                {entries.length === 0
                  ? 'No audit entries recorded yet'
                  : 'No entries match the current filters'}
              </p>
              {entries.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  Try adjusting your filter criteria.
                </p>
              )}
            </div>
          ) : (
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[200px]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Timestamp
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                    <TableHead className="w-[120px]">User</TableHead>
                    <TableHead className="w-[140px]">Field</TableHead>
                    <TableHead className="min-w-[120px]">Old Value</TableHead>
                    <TableHead className="min-w-[120px]">New Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={index % 2 === 1 ? 'bg-slate-50/60' : ''}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </TableCell>
                      <TableCell>{actionBadge(entry.action)}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {entry.user || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {entry.field || '—'}
                      </TableCell>
                      <TableCell
                        className={`max-w-[160px] truncate text-sm ${
                          entry.action === 'delete'
                            ? 'text-red-500 line-through'
                            : 'text-muted-foreground'
                        }`}
                        title={entry.oldValue || ''}
                      >
                        {entry.oldValue || '—'}
                      </TableCell>
                      <TableCell
                        className={`max-w-[160px] truncate text-sm ${
                          entry.action === 'create'
                            ? 'text-emerald-600 font-medium'
                            : entry.action === 'update'
                              ? 'text-blue-600 font-medium'
                              : 'text-muted-foreground'
                        }`}
                        title={entry.newValue || ''}
                      >
                        {entry.newValue || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
