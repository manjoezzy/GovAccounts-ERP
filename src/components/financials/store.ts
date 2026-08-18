'use client'

import { create } from 'zustand'
import type { GeneratedStatements, TBEntry } from '@/lib/financial-engine'
import { DEFAULT_TB_TEMPLATE, NOTE_REFS } from '@/lib/account-templates'

export interface TBEntryUI extends TBEntry {
  _id?: string
  _dbId?: string
}

export interface EntityConfig {
  name: string
  periodEnd: string
  periodLabel: string
  currency: string
}

export interface Report {
  id: string
  entityName: string
  periodEnd: string
  periodLabel: string
  currency: string
  status: string
  version?: number
  versionLabel?: string
  createdAt: string
  updatedAt: string
  entries: TBEntryUI[]
}

export interface SupplementaryData {
  [key: string]: string | number
  id?: string
  reportId?: string
  advancesRecovered: number
  advancesRecoveredPrior: number
  depositsReceived: number
  depositsReceivedPrior: number
  transfersToTreasury: number
  transfersToTreasuryPrior: number
  revenueInKindTaxWaivers: number
  revenueInKindTaxWaiversPrior: number
  ppeOpeningCurrent: number
  ppeAdditionsCurrent: number
  ppeDisposalsCurrent: number
  ppeOpeningPrior: number
  ppeAdditionsPrior: number
  ppeDisposalsPrior: number
  depreciationRate: number
  depreciationMethod: string
  employeeCount: number
  salariesWages: number
  pensionContributions: number
  payrollTaxes: number
  otherEmployeeBenefits: number
  priorYearAdjustments: number
  revaluationReserves: number
  transfersToUCF: number
  accountingOfficer: string
  chiefFinanceOfficer: string
  internalAuditHead: string
  signatoryDate: string
  ipsasBasis: string
  accountingPolicies: string
  exchangeRateUSD: number
  exchangeRateEUR: number
}

export interface AuditLogEntry {
  id: string
  action: string
  field: string
  oldValue: string
  newValue: string
  userId: string
  timestamp: string
}

export interface ComplianceItem {
  id: string
  requirement: string
  ipsasReference: string
  status: 'met' | 'not_met' | 'partial' | 'not_applicable'
  details: string
}

export interface ComplianceData {
  score: number
  metCount: number
  totalCount: number
  checklist: ComplianceItem[]
}

export interface AnalyticsData {
  ratios: Record<string, number>
  trends: Record<string, number>
  anomalies: { type: string; severity: 'info' | 'warning' | 'critical'; description: string; detail: string }[]
}

export interface ApprovalWorkflow {
  id: string
  reportId: string
  currentStep: string
  preparerName: string
  preparerApprovedAt: string | null
  reviewerName: string
  reviewerApprovedAt: string | null
  cfoName: string
  cfoApprovedAt: string | null
  comments: string
  createdAt: string
  updatedAt: string
}

export interface VersionEntry {
  id: string
  entityName: string
  periodLabel: string
  status: string
  version: number
  versionLabel: string
  createdAt: string
  _count: { entries: number }
}

export type WizardStep = 1 | 2 | 3 | 4 | 5

export type TabType = 'dashboard' | 'trial-balance' | 'statements' | 'export'

export type StatementSubTab =
  | 'sfp'
  | 'balance-sheet'
  | 'changes-na'
  | 'cash-flow'
  | 'revenue-recon'
  | 'cash-recon'
  | 'budget-variance'

interface FinancialStore {
  reports: Report[]
  activeReportId: string | null
  entries: TBEntryUI[]
  entityConfig: EntityConfig
  generatedStatements: GeneratedStatements | null
  activeTab: TabType
  statementSubTab: StatementSubTab
  isLoading: boolean
  wizardStep: WizardStep
  supplementaryData: SupplementaryData | null
  auditLog: AuditLogEntry[]
  complianceData: ComplianceData | null
  analyticsData: AnalyticsData | null
  approvalWorkflow: ApprovalWorkflow | null
  versions: VersionEntry[]
  showAnalytics: boolean

  setActiveTab: (tab: TabType) => void
  setStatementSubTab: (tab: StatementSubTab) => void
  setEntityConfig: (config: Partial<EntityConfig>) => void
  setEntries: (entries: TBEntryUI[]) => void
  updateEntry: (index: number, updates: Partial<TBEntryUI>) => void
  deleteEntry: (index: number) => void
  addEntry: () => void
  loadTemplate: () => void
  setWizardStep: (step: WizardStep) => void
  setShowAnalytics: (show: boolean) => void
  setSupplementaryData: (data: SupplementaryData | null) => void

  fetchReports: () => Promise<void>
  createReport: () => Promise<void>
  loadReport: (id: string) => Promise<void>
  deleteReport: (id: string) => Promise<void>
  saveTrialBalance: () => Promise<void>
  generateStatements: () => Promise<void>
  fetchSupplementary: () => Promise<void>
  saveSupplementary: (data: Record<string, unknown>) => Promise<void>
  fetchAuditLog: () => Promise<void>
  fetchCompliance: () => Promise<void>
  fetchAnalytics: () => Promise<void>
  fetchApprovalWorkflow: () => Promise<void>
  advanceApproval: (userName: string) => Promise<void>
  createVersion: (label: string) => Promise<void>
  fetchVersions: () => Promise<void>
  autoBalance: () => Promise<void>
}

const DEFAULT_SUPPLEMENTARY: SupplementaryData = {
  advancesRecovered: 0, advancesRecoveredPrior: 0,
  depositsReceived: 0, depositsReceivedPrior: 0,
  transfersToTreasury: 0, transfersToTreasuryPrior: 0,
  revenueInKindTaxWaivers: 0, revenueInKindTaxWaiversPrior: 0,
  ppeOpeningCurrent: 0, ppeAdditionsCurrent: 0, ppeDisposalsCurrent: 0,
  ppeOpeningPrior: 0, ppeAdditionsPrior: 0, ppeDisposalsPrior: 0,
  depreciationRate: 0, depreciationMethod: 'straight-line',
  employeeCount: 0, salariesWages: 0, pensionContributions: 0,
  payrollTaxes: 0, otherEmployeeBenefits: 0,
  priorYearAdjustments: 0, revaluationReserves: 0, transfersToUCF: 0,
  accountingOfficer: '', chiefFinanceOfficer: '', internalAuditHead: '',
  signatoryDate: '', ipsasBasis: 'IPSAS Accrual Basis', accountingPolicies: '',
  exchangeRateUSD: 1, exchangeRateEUR: 1,
}

export const useFinancialStore = create<FinancialStore>((set, get) => ({
  reports: [],
  activeReportId: null,
  entries: [],
  entityConfig: {
    name: 'Government Entity',
    periodEnd: '2025-06-30',
    periodLabel: '30 June 2025',
    currency: 'Shs',
  },
  generatedStatements: null,
  activeTab: 'dashboard',
  statementSubTab: 'sfp',
  isLoading: false,
  wizardStep: 1,
  supplementaryData: null,
  auditLog: [],
  complianceData: null,
  analyticsData: null,
  approvalWorkflow: null,
  versions: [],
  showAnalytics: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setStatementSubTab: (tab) => set({ statementSubTab: tab }),
  setEntityConfig: (config) =>
    set((state) => ({ entityConfig: { ...state.entityConfig, ...config } })),
  setEntries: (entries) => set({ entries }),
  setWizardStep: (step) => set({ wizardStep: step }),
  setShowAnalytics: (show) => set({ showAnalytics: show }),
  setSupplementaryData: (data) => set({ supplementaryData: data }),

  updateEntry: (index, updates) =>
    set((state) => {
      const newEntries = [...state.entries]
      newEntries[index] = { ...newEntries[index], ...updates }
      return { entries: newEntries }
    }),

  deleteEntry: (index) =>
    set((state) => ({
      entries: state.entries.filter((_, i) => i !== index),
    })),

  addEntry: () =>
    set((state) => ({
      entries: [
        ...state.entries,
        {
          accountCode: '',
          accountName: '',
          classification: 'revenue-non-exchange',
          category: '',
          noteRef: '',
          debitCurrent: 0,
          creditCurrent: 0,
          debitPrior: 0,
          creditPrior: 0,
          budgetInitial: 0,
          budgetAdjusted: 0,
        },
      ],
    })),

  loadTemplate: () => {
    const template = DEFAULT_TB_TEMPLATE.map((item) => ({
      ...item,
      noteRef: NOTE_REFS[item.category] || '',
      _id: Math.random().toString(36).substring(2, 9),
    }))
    set((state) => ({
      entries: state.entries.length > 0 ? [...state.entries, ...template] : template,
    }))
  },

  fetchReports: async () => {
    try {
      const res = await fetch('/api/reports')
      if (!res.ok) throw new Error('Failed to fetch reports')
      const data = await res.json()
      set({ reports: data })
    } catch {
      // silent
    }
  },

  createReport: async () => {
    const { entityConfig } = get()
    set({ isLoading: true })
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityName: entityConfig.name,
          periodEnd: entityConfig.periodEnd,
          periodLabel: entityConfig.periodLabel,
          currency: entityConfig.currency,
        }),
      })
      if (!res.ok) throw new Error('Failed to create report')
      const report = await res.json()
      set((state) => ({
        reports: [report, ...state.reports],
        activeReportId: report.id,
        wizardStep: 1,
        entries: [],
        generatedStatements: null,
        supplementaryData: null,
        complianceData: null,
        analyticsData: null,
        approvalWorkflow: null,
        auditLog: [],
        versions: [],
        isLoading: false,
      }))
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to create report')
    }
  },

  loadReport: async (id) => {
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/reports/${id}`)
      if (!res.ok) throw new Error('Report not found')
      const report = await res.json()
      const entries: TBEntryUI[] = report.entries.map((e: Record<string, unknown>) => ({
        accountCode: e.accountCode,
        accountName: e.accountName,
        classification: e.classification,
        category: e.category,
        noteRef: e.noteRef,
        debitCurrent: e.debitCurrent,
        creditCurrent: e.creditCurrent,
        debitPrior: e.debitPrior,
        creditPrior: e.creditPrior,
        budgetInitial: e.budgetInitial,
        budgetAdjusted: e.budgetAdjusted,
        _dbId: e.id,
      }))
      set({
        activeReportId: id,
        entries,
        entityConfig: {
          name: report.entityName,
          periodEnd: report.periodEnd,
          periodLabel: report.periodLabel,
          currency: report.currency,
        },
        wizardStep: entries.length > 0 ? 2 : 1,
        generatedStatements: null,
        supplementaryData: null,
        complianceData: null,
        analyticsData: null,
        approvalWorkflow: null,
        auditLog: [],
        versions: [],
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to load report')
    }
  },

  deleteReport: async (id) => {
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
        activeReportId:
          state.activeReportId === id ? null : state.activeReportId,
        entries: state.activeReportId === id ? [] : state.entries,
        generatedStatements: state.activeReportId === id ? null : state.generatedStatements,
        wizardStep: state.activeReportId === id ? 1 : state.wizardStep,
        supplementaryData: state.activeReportId === id ? null : state.supplementaryData,
      }))
    } catch {
      throw new Error('Failed to delete report')
    }
  },

  saveTrialBalance: async () => {
    const { activeReportId, entries, entityConfig } = get()
    if (!activeReportId) throw new Error('No active report')
    set({ isLoading: true })
    try {
      await fetch(`/api/reports/${activeReportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityName: entityConfig.name,
          periodEnd: entityConfig.periodEnd,
          periodLabel: entityConfig.periodLabel,
          currency: entityConfig.currency,
        }),
      })
      const cleanEntries = entries.map(({ _id, _dbId, ...rest }) => rest)
      const res = await fetch(`/api/reports/${activeReportId}/trial-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: cleanEntries }),
      })
      if (!res.ok) throw new Error('Failed to save')
      await get().fetchReports()
      set({ isLoading: false })
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to save trial balance')
    }
  },

  generateStatements: async () => {
    const { activeReportId } = get()
    if (!activeReportId) throw new Error('No active report')
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/reports/${activeReportId}/generate`)
      if (!res.ok) throw new Error('Failed to generate')
      const data = await res.json()
      set({
        generatedStatements: data.statements,
        statementSubTab: 'sfp',
        isLoading: false,
      })
      await get().fetchReports()
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to generate statements')
    }
  },

  fetchSupplementary: async () => {
    const { activeReportId } = get()
    if (!activeReportId) return
    try {
      const res = await fetch(`/api/reports/${activeReportId}/supplementary`)
      if (!res.ok) return
      const data = await res.json()
      set({ supplementaryData: { ...DEFAULT_SUPPLEMENTARY, ...data } as SupplementaryData })
    } catch {
      // silent
    }
  },

  saveSupplementary: async (data) => {
    const { activeReportId } = get()
    if (!activeReportId) throw new Error('No active report')
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/reports/${activeReportId}/supplementary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save')
      const result = await res.json()
      set({ supplementaryData: { ...DEFAULT_SUPPLEMENTARY, ...result.supplementary } as SupplementaryData, isLoading: false })
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to save supplementary data')
    }
  },

  fetchAuditLog: async () => {
    const { activeReportId } = get()
    if (!activeReportId) return
    try {
      const res = await fetch(`/api/reports/${activeReportId}/audit`)
      if (!res.ok) return
      const data = await res.json()
      set({ auditLog: data })
    } catch {
      // silent
    }
  },

  fetchCompliance: async () => {
    const { activeReportId } = get()
    if (!activeReportId) return
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/reports/${activeReportId}/compliance`)
      if (!res.ok) throw new Error('Failed to fetch compliance')
      const data = await res.json()
      set({ complianceData: data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchAnalytics: async () => {
    const { activeReportId } = get()
    if (!activeReportId) return
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/reports/${activeReportId}/analytics`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const data = await res.json()
      set({ analyticsData: data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchApprovalWorkflow: async () => {
    const { activeReportId } = get()
    if (!activeReportId) return
    try {
      const res = await fetch(`/api/reports/${activeReportId}/approval`)
      if (!res.ok) return
      const data = await res.json()
      set({ approvalWorkflow: data })
    } catch {
      // silent
    }
  },

  advanceApproval: async (userName) => {
    const { activeReportId } = get()
    if (!activeReportId) throw new Error('No active report')
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/reports/${activeReportId}/approval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName }),
      })
      if (!res.ok) throw new Error('Failed to advance approval')
      const data = await res.json()
      set({ approvalWorkflow: data.workflow, isLoading: false })
      await get().fetchReports()
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to advance approval')
    }
  },

  createVersion: async (label) => {
    const { activeReportId } = get()
    if (!activeReportId) throw new Error('No active report')
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/reports/${activeReportId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionLabel: label }),
      })
      if (!res.ok) throw new Error('Failed to create version')
      set({ isLoading: false })
      await get().fetchVersions()
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to create version')
    }
  },

  fetchVersions: async () => {
    const { activeReportId } = get()
    if (!activeReportId) return
    try {
      const res = await fetch(`/api/reports/${activeReportId}/versions`)
      if (!res.ok) return
      const data = await res.json()
      set({ versions: data })
    } catch {
      // silent
    }
  },

  autoBalance: async () => {
    const { activeReportId } = get()
    if (!activeReportId) throw new Error('No active report')
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/reports/${activeReportId}/auto-balance`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to auto-balance')
      const data = await res.json()
      await get().loadReport(activeReportId)
      return data
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to auto-balance')
    }
  },
}))

