'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Types ────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string
  task: string
  completed: boolean
  completedBy: string
  completedAt: string
  notes: string
  category: 'pre-closing' | 'closing' | 'post-closing'
}

interface ModuleProps {
  reportId: string
}

// ── Default Checklist Data ──────────────────────────────────────────────────

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Pre-Closing
  {
    id: 'pre-1',
    task: 'Post all outstanding transactions',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'pre-closing',
  },
  {
    id: 'pre-2',
    task: 'Reconcile all bank accounts',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'pre-closing',
  },
  {
    id: 'pre-3',
    task: 'Verify suspense accounts cleared',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'pre-closing',
  },
  {
    id: 'pre-4',
    task: 'Complete bank reconciliations',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'pre-closing',
  },
  {
    id: 'pre-5',
    task: 'Verify all imprests surrendered',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'pre-closing',
  },
  // Closing
  {
    id: 'close-1',
    task: 'Post closing journal entries',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'closing',
  },
  {
    id: 'close-2',
    task: 'Close revenue accounts',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'closing',
  },
  {
    id: 'close-3',
    task: 'Close expense accounts',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'closing',
  },
  {
    id: 'close-4',
    task: 'Update retained earnings',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'closing',
  },
  {
    id: 'close-5',
    task: 'Post depreciation',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'closing',
  },
  // Post-Closing
  {
    id: 'post-1',
    task: 'Prepare trial balance',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'post-closing',
  },
  {
    id: 'post-2',
    task: 'Generate financial statements',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'post-closing',
  },
  {
    id: 'post-3',
    task: 'Complete compliance checklist',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'post-closing',
  },
  {
    id: 'post-4',
    task: 'Obtain approvals',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'post-closing',
  },
  {
    id: 'post-5',
    task: 'Archive working papers',
    completed: false,
    completedBy: '',
    completedAt: '',
    notes: '',
    category: 'post-closing',
  },
]

const CATEGORY_CONFIG: Record<
  string,
  { label: string; description: string; accentClass: string }
> = {
  'pre-closing': {
    label: 'Pre-Closing',
    description: 'Tasks to complete before closing the books',
    accentClass: 'border-l-amber-400',
  },
  closing: {
    label: 'Closing',
    description: 'Core year-end closing procedures',
    accentClass: 'border-l-blue-400',
  },
  'post-closing': {
    label: 'Post-Closing',
    description: 'Final steps after closing entries are posted',
    accentClass: 'border-l-emerald-400',
  },
}

// ── Component ────────────────────────────────────────────────────────────────

export default function YearEndChecklist({ reportId }: ModuleProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // ── Summary ─────────────────────────────────────────────────────────────

  const totalTasks = items.length
  const completedTasks = items.filter((i) => i.completed).length
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // ── Fetch ───────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/modules?module=year-end-checklist&reportId=${reportId}`,
      )
      if (!res.ok) throw new Error('Failed to fetch checklist')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setItems(data)
      } else {
        // Initialize with defaults if no data
        setItems(DEFAULT_CHECKLIST)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load year-end checklist')
      setItems(DEFAULT_CHECKLIST)
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // ── Toggle completion ───────────────────────────────────────────────────

  const handleToggle = async (item: ChecklistItem) => {
    const newCompleted = !item.completed
    const updated = {
      ...item,
      completed: newCompleted,
      completedBy: newCompleted ? 'Current User' : '',
      completedAt: newCompleted ? new Date().toISOString().split('T')[0] : '',
    }

    setTogglingId(item.id)

    try {
      const res = await fetch(
        `/api/modules?module=year-end-checklist&id=${item.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        },
      )

      if (!res.ok) throw new Error('Failed to update checklist item')

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? updated : i)),
      )
      toast.success(
        newCompleted
          ? `"${item.task}" marked as complete`
          : `"${item.task}" marked as incomplete`,
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to update checklist item')
    } finally {
      setTogglingId(null)
    }
  }

  // ── Update notes ────────────────────────────────────────────────────────

  const handleNotesChange = async (id: string, notes: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, notes } : i)),
    )

    try {
      const item = items.find((i) => i.id === id)
      if (!item) return

      await fetch(`/api/modules?module=year-end-checklist&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, notes }),
      })
    } catch {
      // Silent save, user won't notice minor failures
    }
  }

  // ── Toggle expanded notes ───────────────────────────────────────────────

  const toggleExpanded = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // ── Group items by category ─────────────────────────────────────────────

  const categories: Array<{
    key: string
    config: (typeof CATEGORY_CONFIG)[string]
    items: ChecklistItem[]
  }> = [
    'pre-closing',
    'closing',
    'post-closing',
  ].map((key) => ({
    key,
    config: CATEGORY_CONFIG[key],
    items: items.filter((i) => i.category === key),
  }))

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Year-End Procedures
        </h2>
        <p className="text-sm text-muted-foreground">
          Comprehensive checklist for financial year-end closing
        </p>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-6 w-6 text-slate-700" />
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {completedTasks} of {totalTasks} completed
                </p>
                <p className="text-xs text-muted-foreground">
                  {completionPct}% overall progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:w-64">
              <Progress value={completionPct} className="h-2" />
              <span className="text-sm font-bold text-slate-700 min-w-[40px] text-right">
                {completionPct}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const catCompleted = cat.items.filter((i) => i.completed).length
            const catTotal = cat.items.length
            return (
              <Card key={cat.key} className={`border-l-4 ${cat.config.accentClass}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{cat.config.label}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cat.config.description}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {catCompleted}/{catTotal}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {cat.items.map((item) => {
                      const isExpanded = expandedNotes.has(item.id)
                      const isToggling = togglingId === item.id
                      return (
                        <div
                          key={item.id}
                          className={`rounded-lg border transition-colors ${
                            item.completed
                              ? 'border-emerald-200 bg-emerald-50/50'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          {/* Main row */}
                          <div className="flex items-center gap-3 p-3">
                            <Checkbox
                              checked={item.completed}
                              disabled={isToggling}
                              onCheckedChange={() => handleToggle(item)}
                              aria-label={item.task}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${
                                  item.completed
                                    ? 'text-slate-400 line-through'
                                    : 'text-slate-700'
                                }`}
                              >
                                {item.task}
                              </p>
                              {item.completed && item.completedBy && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  by {item.completedBy}
                                  {item.completedAt && ` · ${item.completedAt}`}
                                </p>
                              )}
                            </div>
                            {item.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                            )}
                            {/* Expand notes button */}
                            <button
                              onClick={() => toggleExpanded(item.id)}
                              className="shrink-0 rounded p-1 transition-colors hover:bg-slate-100"
                              aria-label="Toggle notes"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              )}
                            </button>
                          </div>

                          {/* Expandable notes section */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 px-3 pb-3 pt-2">
                              <Label htmlFor={`notes-${item.id}`} className="text-xs text-muted-foreground">
                                Notes
                              </Label>
                              <Input
                                id={`notes-${item.id}`}
                                className="mt-1 text-sm"
                                placeholder="Add notes about this task..."
                                value={item.notes}
                                onChange={(e) =>
                                  handleNotesChange(item.id, e.target.value)
                                }
                                onBlur={(e) =>
                                  handleNotesChange(item.id, e.target.value)
                                }
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
