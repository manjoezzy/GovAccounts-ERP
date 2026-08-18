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
  createdAt: string
  updatedAt: string
  entries: TBEntryUI[]
}

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

  setActiveTab: (tab: TabType) => void
  setStatementSubTab: (tab: StatementSubTab) => void
  setEntityConfig: (config: Partial<EntityConfig>) => void
  setEntries: (entries: TBEntryUI[]) => void
  updateEntry: (index: number, updates: Partial<TBEntryUI>) => void
  deleteEntry: (index: number) => void
  addEntry: () => void
  loadTemplate: () => void

  fetchReports: () => Promise<void>
  createReport: () => Promise<void>
  loadReport: (id: string) => Promise<void>
  deleteReport: (id: string) => Promise<void>
  saveTrialBalance: () => Promise<void>
  generateStatements: () => Promise<void>
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

  setActiveTab: (tab) => set({ activeTab: tab }),
  setStatementSubTab: (tab) => set({ statementSubTab: tab }),
  setEntityConfig: (config) =>
    set((state) => ({ entityConfig: { ...state.entityConfig, ...config } })),
  setEntries: (entries) => set({ entries }),

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
        activeTab: 'trial-balance',
        entries: [],
        generatedStatements: null,
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
        activeTab: 'trial-balance',
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
        activeTab: state.activeReportId === id ? 'dashboard' : state.activeTab,
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
      // Update entity config first
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
      // Save entries
      const cleanEntries = entries.map(({ _id, _dbId, ...rest }) => rest)
      const res = await fetch(`/api/reports/${activeReportId}/trial-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: cleanEntries }),
      })
      if (!res.ok) throw new Error('Failed to save')
      // Refresh reports list
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
        activeTab: 'statements',
        statementSubTab: 'sfp',
        isLoading: false,
      })
      // Refresh reports for updated status
      await get().fetchReports()
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to generate statements')
    }
  },
}))
