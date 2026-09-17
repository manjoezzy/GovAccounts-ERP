'use client'

import { useState, useCallback } from 'react'
import {
  FileText,
  FileSpreadsheet,
  Database,
  Download,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowDownToLine,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ExportProps {
  reportId: string
}

// ─── Types ──────────────────────────────────────────────────────────────

type ExportStatus = 'idle' | 'loading' | 'success' | 'error'

interface ExportOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  buttonText: string
  colorClass: string
  iconBg: string
}

// ─── Export Option Card ─────────────────────────────────────────────────

function ExportCard({
  option,
  status,
  onExport,
}: {
  option: ExportOption
  status: ExportStatus
  onExport: () => void
}) {
  return (
    <Card className="gap-0 py-0 transition-all hover:shadow-md hover:border-foreground/20">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-xl',
              option.iconBg,
              option.colorClass
            )}
          >
            {option.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">{option.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {option.description}
            </p>
          </div>
        </div>
        <div className="mt-auto pt-4">
          <Button
            onClick={onExport}
            disabled={status === 'loading'}
            variant="outline"
            className={cn(
              'w-full gap-2 transition-all',
              status === 'success' &&
                'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
            )}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle2 className="size-4" />
                Downloaded
              </>
            ) : (
              <>
                <Download className="size-4" />
                {option.buttonText}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function Export({ reportId }: ExportProps) {
  const [statusMap, setStatusMap] = useState<Record<string, ExportStatus>>({})

  const getStatus = useCallback((id: string) => statusMap[id] || 'idle', [statusMap])
  const setStatus = useCallback(
    (id: string, status: ExportStatus) =>
      setStatusMap((prev) => ({ ...prev, [id]: status })),
    []
  )

  // ── Export: Financial Statements PDF ──
  const exportPDF = async () => {
    setStatus('pdf', 'loading')
    try {
      const res = await fetch(`/api/reports/${reportId}/pdf`)
      if (!res.ok) throw new Error('PDF export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setStatus('pdf', 'success')
      toast.success('Financial Statements PDF opened in a new tab')
      // Revoke after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 60000)
    } catch {
      toast.error('Failed to export PDF. Please try again.')
      setStatus('pdf', 'error')
      setTimeout(() => setStatus('pdf', 'idle'), 3000)
    }
  }

  // ── Export: Trial Balance Excel ──
  const exportExcel = async () => {
    setStatus('excel', 'loading')
    try {
      const res = await fetch(`/api/reports/${reportId}/export/excel`)
      if (!res.ok) throw new Error('Excel export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `TrialBalance_${reportId}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setStatus('excel', 'success')
      toast.success('Trial Balance Excel file downloaded')
    } catch {
      toast.error('Failed to export Excel. Please try again.')
      setStatus('excel', 'error')
      setTimeout(() => setStatus('excel', 'idle'), 3000)
    }
  }

  // ── Export: Data Backup JSON ──
  const exportJSON = async () => {
    setStatus('json', 'loading')
    try {
      // Fetch all module data for a comprehensive backup
      const endpoints = [
        `/api/reports/${reportId}`,
        `/api/reports/${reportId}/trial-balance`,
        `/api/reports/${reportId}/approval`,
      ]
      const results = await Promise.allSettled(
        endpoints.map((url) => fetch(url).then((r) => (r.ok ? r.json() : null)))
      )
      const backup = {
        exportDate: new Date().toISOString(),
        reportId,
        modules: {
          report: results[0].status === 'fulfilled' ? results[0].value : null,
          trialBalance: results[1].status === 'fulfilled' ? results[1].value : null,
          approval: results[2].status === 'fulfilled' ? results[2].value : null,
        },
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DataBackup_${reportId}_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setStatus('json', 'success')
      toast.success('Data backup JSON downloaded')
    } catch {
      toast.error('Failed to export JSON backup. Please try again.')
      setStatus('json', 'error')
      setTimeout(() => setStatus('json', 'idle'), 3000)
    }
  }

  // ── Export: Audit Report ──
  const exportAudit = async () => {
    setStatus('audit', 'loading')
    try {
      const [auditRes, complianceRes] = await Promise.allSettled([
        fetch(`/api/reports/${reportId}/audit-trail`).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch(`/api/reports/${reportId}/compliance`).then((r) =>
          r.ok ? r.json() : null
        ),
      ])
      const report = {
        exportDate: new Date().toISOString(),
        reportId,
        auditTrail:
          auditRes.status === 'fulfilled' ? auditRes.value : null,
        compliance:
          complianceRes.status === 'fulfilled' ? complianceRes.value : null,
      }
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AuditReport_${reportId}_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setStatus('audit', 'success')
      toast.success('Audit report downloaded')
    } catch {
      toast.error('Failed to export audit report. Please try again.')
      setStatus('audit', 'error')
      setTimeout(() => setStatus('audit', 'idle'), 3000)
    }
  }

  // ── Export Options ──
  const exportOptions: ExportOption[] = [
    {
      id: 'pdf',
      title: 'Financial Statements PDF',
      description:
        'Generate IPSAS-compliant PDF with all 24 tables including Statement of Financial Position, Statement of Financial Performance, and Cash Flow Statement.',
      icon: <FileText className="size-6" />,
      buttonText: 'Export PDF',
      colorClass: 'text-rose-600',
      iconBg: 'bg-rose-50',
    },
    {
      id: 'excel',
      title: 'Trial Balance Excel',
      description:
        'Export trial balance data to spreadsheet with all account codes, descriptions, debit and credit balances for the reporting period.',
      icon: <FileSpreadsheet className="size-6" />,
      buttonText: 'Export Excel',
      colorClass: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      id: 'json',
      title: 'Data Backup',
      description:
        'Download complete data backup as JSON including all module data, trial balance, approval workflow, and configuration.',
      icon: <Database className="size-6" />,
      buttonText: 'Download JSON',
      colorClass: 'text-violet-600',
      iconBg: 'bg-violet-50',
    },
    {
      id: 'audit',
      title: 'Audit Report',
      description:
        'Export audit trail and compliance report covering all journal entries, approvals, and IPSAS compliance status.',
      icon: <ShieldCheck className="size-6" />,
      buttonText: 'Export Audit',
      colorClass: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
  ]

  const handlers: Record<string, () => Promise<void>> = {
    pdf: exportPDF,
    excel: exportExcel,
    json: exportJSON,
    audit: exportAudit,
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and download reports, data backups, and compliance documents
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Report ID: {reportId}
        </p>
      </div>

      {/* ── Export Options Grid (2x2) ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exportOptions.map((option) => (
          <ExportCard
            key={option.id}
            option={option}
            status={getStatus(option.id)}
            onExport={() => handlers[option.id]()}
          />
        ))}
      </div>

      {/* ── Quick Info ──────────────────────────────────────────────── */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ArrowDownToLine className="size-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Export Notes</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>PDF reports open in a new browser tab for preview before saving</li>
                <li>Excel and JSON files download directly to your device</li>
                <li>Large exports may take a few moments to generate</li>
                <li>All exports include the report ID and timestamp for traceability</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}