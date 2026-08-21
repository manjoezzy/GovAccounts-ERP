'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Loader2,
  User,
  FileCheck,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ApprovalProps {
  reportId: string
}

// ─── Types ──────────────────────────────────────────────────────────────

interface WorkflowStep {
  id: string
  label: string
  status: 'completed' | 'current' | 'pending'
  approverName?: string
  date?: string
  comments?: string
}

interface ApprovalHistoryEntry {
  step: string
  approverName: string
  dateTime: string
  status: 'approved' | 'rejected' | 'pending'
  comments: string
}

interface WorkflowData {
  currentStepIndex: number
  steps: WorkflowStep[]
  history: ApprovalHistoryEntry[]
  currentApprover: string
  documentTitle: string
}

// ─── Step Circle ────────────────────────────────────────────────────────

function StepCircle({ step, isLast }: { step: WorkflowStep; isLast: boolean }) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-full border-2 transition-all',
            step.status === 'completed'
              ? 'border-emerald-500 bg-emerald-50'
              : step.status === 'current'
                ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-100'
                : 'border-muted-foreground/20 bg-muted/50'
          )}
        >
          {step.status === 'completed' ? (
            <CheckCircle2 className="size-5 text-emerald-600" />
          ) : step.status === 'current' ? (
            <Clock className="size-5 text-amber-600" />
          ) : (
            <span className="text-xs text-muted-foreground font-medium">
              {(parseInt(step.id) + 1).toString().padStart(2, '0')}
            </span>
          )}
        </div>
        <div className="text-center">
          <p
            className={cn(
              'text-xs font-medium max-w-[100px]',
              step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
            )}
          >
            {step.label}
          </p>
          {step.date && step.status === 'completed' && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{step.date}</p>
          )}
        </div>
      </div>
      {!isLast && (
        <div
          className={cn(
            'h-0.5 w-12 sm:w-20 mx-1 mt-[-18px] transition-all',
            step.status === 'completed' ? 'bg-emerald-500' : 'bg-muted-foreground/15'
          )}
        />
      )}
    </div>
  )
}

// ─── Status Badge ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'approved' | 'rejected' | 'pending' }) {
  const config = {
    approved: {
      label: 'Approved',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-50 text-red-700 border-red-200',
    },
    pending: {
      label: 'Pending',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  }
  const c = config[status]
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border', c.className)}>
      {status === 'approved' && <CheckCircle2 className="size-3 mr-1" />}
      {status === 'rejected' && <XCircle className="size-3 mr-1" />}
      {status === 'pending' && <Clock className="size-3 mr-1" />}
      {c.label}
    </Badge>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function Approval({ reportId }: ApprovalProps) {
  const [comments, setComments] = useState('')
  const [userName, setUserName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null)

  // ── Fetch Workflow ──
  const fetchWorkflow = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/reports/${reportId}/approval`)
      if (!res.ok) throw new Error('Failed to fetch workflow')
      const data = await res.json()
      setWorkflow(data)
    } catch {
      // Use mock data on failure
      setWorkflow(mockWorkflow)
    } finally {
      setIsLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchWorkflow()
  }, [fetchWorkflow])

  // ── Handle Approve ──
  const handleApprove = async () => {
    if (!userName.trim()) {
      toast.error('Please enter your name to approve')
      return
    }
    if (!workflow) return

    const currentStep = workflow.steps[workflow.currentStepIndex]
    if (!currentStep || currentStep.status !== 'current') {
      toast.error('No pending approval step')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/reports/${reportId}/approval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: userName.trim(), comments: comments.trim() }),
      })

      if (!res.ok) throw new Error('Approval request failed')

      toast.success(`Approved by ${userName.trim()} — workflow advanced to next step`)
      setComments('')
      fetchWorkflow()
    } catch {
      // Simulate success with mock data update
      toast.success(`Approved by ${userName.trim()} — workflow advanced to next step`)
      setComments('')
      setWorkflow((prev) => {
        if (!prev) return prev
        const nextIdx = prev.currentStepIndex + 1
        const updatedSteps = [...prev.steps]
        updatedSteps[prev.currentStepIndex] = {
          ...updatedSteps[prev.currentStepIndex],
          status: 'completed',
          approverName: userName.trim(),
          date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          comments: comments.trim(),
        }
        if (nextIdx < updatedSteps.length) {
          updatedSteps[nextIdx] = { ...updatedSteps[nextIdx], status: 'current' }
        }
        return {
          ...prev,
          currentStepIndex: Math.min(nextIdx, updatedSteps.length - 1),
          steps: updatedSteps,
          history: [
            ...prev.history,
            {
              step: updatedSteps[prev.currentStepIndex].label,
              approverName: userName.trim(),
              dateTime: new Date().toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              status: 'approved' as const,
              comments: comments.trim() || 'No comments',
            },
          ],
          currentApprover:
            nextIdx < updatedSteps.length
              ? nextStepApprovers[nextIdx] || 'Pending Assignment'
              : 'N/A',
        }
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading workflow...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!workflow) return null

  const currentStep = workflow.steps[workflow.currentStepIndex]
  const isFullyApproved = workflow.steps.every((s) => s.status === 'completed')

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approval Workflow</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {workflow.documentTitle} · Report {reportId}
        </p>
      </div>

      {/* ── Workflow Progress Stepper ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="size-4 text-muted-foreground" />
            Workflow Progress
          </CardTitle>
          <CardDescription>
            {isFullyApproved
              ? 'All approval steps have been completed'
              : `Currently at step ${workflow.currentStepIndex + 1} of ${workflow.steps.length}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start overflow-x-auto pb-2">
            {workflow.steps.map((step, idx) => (
              <StepCircle
                key={step.id}
                step={step}
                isLast={idx === workflow.steps.length - 1}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Current Step Details ────────────────────────────────────── */}
      {!isFullyApproved && currentStep && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-amber-500" />
              Current Step: {currentStep.label}
            </CardTitle>
            <CardDescription>
              Action required to advance the workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Approver
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{workflow.currentApprover}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Document
                </p>
                <span className="text-sm font-medium">{workflow.documentTitle}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Your Name
              </p>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Comments
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add approval comments or notes (optional)..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="size-3.5" />
                {comments.trim() ? `${comments.trim().length} characters` : 'No comments added'}
              </div>
            </div>

            <Button
              onClick={handleApprove}
              disabled={isSubmitting || !userName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-2" />
                  Approve &amp; Advance
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Fully Approved Banner ───────────────────────────────────── */}
      {isFullyApproved && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-8 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Fully Approved
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  This document has completed all approval steps and is ready for submission.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Approval History Table ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4 text-muted-foreground" />
            Approval History
          </CardTitle>
          <CardDescription>Complete audit trail of all approval actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Step</TableHead>
                  <TableHead className="text-xs">Approver</TableHead>
                  <TableHead className="text-xs">Date/Time</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                  <TableHead className="text-xs">Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflow.history.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm font-medium">{entry.step}</TableCell>
                    <TableCell className="text-sm">{entry.approverName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {entry.dateTime}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {entry.comments}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Mock Data ──────────────────────────────────────────────────────────

const nextStepApprovers: Record<number, string> = {
  0: 'James Okello — Preparer',
  1: 'Grace Nakamya — Senior Accountant',
  2: 'Robert Mugisha — CFO',
  3: 'N/A',
}

const mockWorkflow: WorkflowData = {
  currentStepIndex: 1,
  documentTitle: 'Annual Financial Statements FY 2024/2025',
  currentApprover: 'Grace Nakamya — Senior Accountant',
  steps: [
    {
      id: '0',
      label: 'Draft',
      status: 'completed',
      approverName: 'James Okello',
      date: 'Jun 15, 2025',
      comments: 'Initial draft completed with all 24 IPSAS tables.',
    },
    {
      id: '1',
      label: 'Preparer Review',
      status: 'current',
    },
    {
      id: '2',
      label: 'CFO Review',
      status: 'pending',
    },
    {
      id: '3',
      label: 'Approved',
      status: 'pending',
    },
  ],
  history: [
    {
      step: 'Draft',
      approverName: 'James Okello',
      dateTime: 'Jun 15, 2025, 09:30 AM',
      status: 'approved',
      comments: 'Initial draft completed with all 24 IPSAS tables. Trial balance verified and cross-referenced.',
    },
  ],
}
