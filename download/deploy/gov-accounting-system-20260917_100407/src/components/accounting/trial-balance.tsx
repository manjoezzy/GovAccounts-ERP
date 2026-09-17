'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Wand2, Trash2, Plus, Save, Loader2, FileSpreadsheet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useToast } from '@/hooks/use-toast'
import { useFinancialStore, type TBEntryUI } from '@/components/financials/store'
import { fmtNum } from '@/lib/financial-engine'
import { DEFAULT_TB_TEMPLATE, NOTE_REFS, CLASSIFICATION_OPTIONS, CATEGORY_OPTIONS } from '@/lib/account-templates'

interface TrialBalanceProps {
  reportId: string
}

export default function TrialBalance({ reportId }: TrialBalanceProps) {
  const {
    entries,
    setEntries,
    addEntry,
    deleteEntry,
    updateEntry,
    loadTemplate,
    saveTrialBalance,
    autoBalance,
    isLoading,
    entityConfig,
  } = useFinancialStore()

  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [balancing, setBalancing] = useState(false)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Load entries when report changes
  useEffect(() => {
    async function load() {
      if (!reportId) return
      try {
        const res = await fetch(`/api/reports/${reportId}`)
        if (!res.ok) return
        const report = await res.json()
        if (report.entries && report.entries.length > 0) {
          const loaded: TBEntryUI[] = report.entries.map(
            (e: Record<string, unknown>) => ({
              accountCode: e.accountCode ?? '',
              accountName: e.accountName ?? '',
              classification: e.classification ?? 'revenue-non-exchange',
              category: e.category ?? '',
              noteRef: e.noteRef ?? '',
              debitCurrent: e.debitCurrent ?? 0,
              creditCurrent: e.creditCurrent ?? 0,
              debitPrior: e.debitPrior ?? 0,
              creditPrior: e.creditPrior ?? 0,
              budgetInitial: e.budgetInitial ?? 0,
              budgetAdjusted: e.budgetAdjusted ?? 0,
              _dbId: e.id,
            })
          )
          setEntries(loaded)
        }
      } catch {
        // silent
      }
    }
    load()
  }, [reportId, setEntries])

  // Computed summaries
  const totals = useMemo(() => {
    let totalDebitCurrent = 0
    let totalCreditCurrent = 0
    let totalDebitPrior = 0
    let totalCreditPrior = 0
    let totalBudgetInitial = 0
    let totalBudgetAdjusted = 0

    for (const e of entries) {
      totalDebitCurrent += e.debitCurrent || 0
      totalCreditCurrent += e.creditCurrent || 0
      totalDebitPrior += e.debitPrior || 0
      totalCreditPrior += e.creditPrior || 0
      totalBudgetInitial += e.budgetInitial || 0
      totalBudgetAdjusted += e.budgetAdjusted || 0
    }

    const difference = totalDebitCurrent - totalCreditCurrent

    return {
      totalDebitCurrent,
      totalCreditCurrent,
      totalDebitPrior,
      totalCreditPrior,
      totalBudgetInitial,
      totalBudgetAdjusted,
      difference,
      entryCount: entries.length,
    }
  }, [entries])

  const handleLoadTemplate = useCallback(() => {
    if (entries.length > 0) {
      const confirmMsg =
        'This will append the standard accounts template to the existing entries. Continue?'
      if (!window.confirm(confirmMsg)) return
    }
    loadTemplate()
    toast({
      title: 'Template Loaded',
      description: `${DEFAULT_TB_TEMPLATE.length} standard accounts added.`,
    })
  }, [entries.length, loadTemplate, toast])

  const handleAutoBalance = useCallback(async () => {
    if (totals.difference === 0) {
      toast({
        title: 'Already Balanced',
        description: 'The trial balance is already in balance.',
      })
      return
    }
    setBalancing(true)
    try {
      // Try API auto-balance first
      await autoBalance()
      toast({
        title: 'Auto-Balanced',
        description: 'Suspense/adjustment entry added to balance the trial balance.',
      })
    } catch {
      // Fallback: add local suspense entry
      const diff = totals.difference
      const suspenseEntry: TBEntryUI = {
        accountCode: 'S001',
        accountName: 'Suspense / Balance Adjustment',
        classification: diff > 0 ? 'liability' : 'asset',
        category: '',
        noteRef: '',
        debitCurrent: diff < 0 ? Math.abs(diff) : 0,
        creditCurrent: diff > 0 ? Math.abs(diff) : 0,
        debitPrior: 0,
        creditPrior: 0,
        budgetInitial: 0,
        budgetAdjusted: 0,
      }
      setEntries([...entries, suspenseEntry])
      toast({
        title: 'Auto-Balanced (Local)',
        description: `Suspense entry of ${fmtNum(Math.abs(diff))} added.`,
      })
    } finally {
      setBalancing(false)
    }
  }, [totals.difference, autoBalance, entries, setEntries, toast])

  const handleClearAll = useCallback(() => {
    if (entries.length === 0) return
    if (!window.confirm('Are you sure you want to clear all trial balance entries?')) return
    setEntries([])
    toast({ title: 'Cleared', description: 'All entries removed.' })
  }, [entries.length, setEntries, toast])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const cleanEntries = entries.map(({ _id, _dbId, ...rest }) => rest)
      const res = await fetch(`/api/reports/${reportId}/trial-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: cleanEntries }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Saved', description: 'Trial balance saved successfully.' })
    } catch {
      toast({
        title: 'Save Failed',
        description: 'Could not save trial balance. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [reportId, entries, toast])

  const handleAddRow = useCallback(() => {
    addEntry()
  }, [addEntry])

  const handleEntryUpdate = useCallback(
    (index: number, updates: Partial<TBEntryUI>) => {
      // If classification changes, auto-set category if only one option
      if (updates.classification && updates.classification !== entries[index].classification) {
        const cats = CATEGORY_OPTIONS[updates.classification] || []
        if (cats.length === 1) {
          updates.category = cats[0].value
          updates.noteRef = NOTE_REFS[cats[0].value] || ''
        } else {
          updates.category = ''
          updates.noteRef = ''
        }
      }
      // If category changes, auto-set note ref
      if (updates.category && updates.category !== entries[index].category) {
        updates.noteRef = NOTE_REFS[updates.category] || ''
      }
      updateEntry(index, updates)
    },
    [entries, updateEntry]
  )

  const handleDeleteRow = useCallback(
    (index: number) => {
      deleteEntry(index)
    },
    [deleteEntry]
  )

  const numInputClass =
    'h-8 w-[110px] text-xs font-mono text-right tabular-nums'
  const textInputClass = 'h-8 text-xs'
  const codeInputClass = 'h-8 w-[100px] text-xs font-mono'
  const nameInputClass = 'h-8 min-w-[150px] text-xs'
  const noteInputClass = 'h-8 w-[60px] text-xs font-mono text-center'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Trial Balance</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {entityConfig.name} — {entityConfig.periodLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadTemplate}
            className="gap-1.5"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Load Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoBalance}
            disabled={balancing || isLoading}
            className="gap-1.5"
          >
            {balancing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            Auto Balance
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || isLoading}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Debit (Current)
            </p>
            <p className="text-lg font-bold text-slate-900 font-mono mt-1">
              {fmtNum(totals.totalDebitCurrent)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Credit (Current)
            </p>
            <p className="text-lg font-bold text-slate-900 font-mono mt-1">
              {fmtNum(totals.totalCreditCurrent)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Difference
            </p>
            <p
              className={`text-lg font-bold font-mono mt-1 ${
                totals.difference === 0
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }`}
            >
              {totals.difference === 0
                ? 'Balanced'
                : `${fmtNum(totals.difference)}`}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Entry Count
            </p>
            <p className="text-lg font-bold text-slate-900 font-mono mt-1">
              {totals.entryCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spreadsheet Grid */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div
            ref={tableContainerRef}
            className="overflow-x-auto max-h-[60vh] overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-800 text-white">
                  <th className="px-1 py-2.5 text-center font-medium w-8">#</th>
                  <th className="px-1 py-2.5 text-left font-medium min-w-[100px]">
                    Account Code
                  </th>
                  <th className="px-1 py-2.5 text-left font-medium min-w-[150px]">
                    Account Name
                  </th>
                  <th className="px-1 py-2.5 text-left font-medium min-w-[150px]">
                    Classification
                  </th>
                  <th className="px-1 py-2.5 text-left font-medium min-w-[180px]">
                    Category
                  </th>
                  <th className="px-1 py-2.5 text-center font-medium w-[60px]">
                    Note Ref
                  </th>
                  <th className="px-1 py-2.5 text-right font-medium min-w-[110px]">
                    Debit Current
                  </th>
                  <th className="px-1 py-2.5 text-right font-medium min-w-[110px]">
                    Credit Current
                  </th>
                  <th className="px-1 py-2.5 text-right font-medium min-w-[110px]">
                    Debit Prior
                  </th>
                  <th className="px-1 py-2.5 text-right font-medium min-w-[110px]">
                    Credit Prior
                  </th>
                  <th className="px-1 py-2.5 text-right font-medium min-w-[110px]">
                    Budget Initial
                  </th>
                  <th className="px-1 py-2.5 text-right font-medium min-w-[110px]">
                    Budget Adjusted
                  </th>
                  <th className="px-1 py-2.5 text-center font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const categoryOptions =
                    CATEGORY_OPTIONS[entry.classification] || []

                  return (
                    <tr
                      key={entry._id || index}
                      className="group border-b border-slate-100 hover:bg-amber-50/30 transition-colors"
                    >
                      {/* Row number */}
                      <td className="px-1 py-1">
                        <span className="text-[10px] text-slate-400 font-mono w-6 inline-block text-center">
                          {index + 1}
                        </span>
                      </td>

                      {/* Account Code */}
                      <td className="px-1 py-1">
                        <Input
                          className={codeInputClass}
                          value={entry.accountCode}
                          onChange={(e) =>
                            handleEntryUpdate(index, {
                              accountCode: e.target.value,
                            })
                          }
                          placeholder="Code"
                        />
                      </td>

                      {/* Account Name */}
                      <td className="px-1 py-1">
                        <Input
                          className={nameInputClass}
                          value={entry.accountName}
                          onChange={(e) =>
                            handleEntryUpdate(index, {
                              accountName: e.target.value,
                            })
                          }
                          placeholder="Account Name"
                        />
                      </td>

                      {/* Classification */}
                      <td className="px-1 py-1">
                        <Select
                          value={entry.classification}
                          onValueChange={(val) =>
                            handleEntryUpdate(index, { classification: val })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Class" />
                          </SelectTrigger>
                          <SelectContent>
                            {CLASSIFICATION_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Category */}
                      <td className="px-1 py-1">
                        <Select
                          value={entry.category}
                          onValueChange={(val) =>
                            handleEntryUpdate(index, { category: val })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Note Ref */}
                      <td className="px-1 py-1">
                        <Input
                          className={noteInputClass}
                          value={entry.noteRef}
                          onChange={(e) =>
                            handleEntryUpdate(index, {
                              noteRef: e.target.value,
                            })
                          }
                          placeholder="-"
                        />
                      </td>

                      {/* Debit Current */}
                      <td className="px-1 py-1">
                        <Input
                          type="number"
                          className={numInputClass}
                          value={entry.debitCurrent || ''}
                          onChange={(e) =>
                            handleEntryUpdate(index, {
                              debitCurrent: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </td>

                      {/* Credit Current */}
                      <td className="px-1 py-1">
                        <Input
                          type="number"
                          className={numInputClass}
                          value={entry.creditCurrent || ''}
                          onChange={(e) =>
                            handleEntryUpdate(index, {
                              creditCurrent: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </td>

                      {/* Debit Prior */}
                      <td className="px-1 py-1">
                        <Input
                          type="number"
                          className={numInputClass}
                          value={entry.debitPrior || ''}
                          onChange={(e) =>
                            handleEntryUpdate(index, {
                              debitPrior: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </td>

                      {/* Credit Prior */}
                      <td className="px-1 py-1">
                        <Input
                          type="number"
                          className={numInputClass}
                          value={entry.creditPrior || ''}
                          onChange={(e) =>
                            handleEntryUpdate(index, {
                              creditPrior: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </td>

                      {/* Budget Initial */}
                      <td className="px-1 py-1">
                        <Input
                          type="number"
                          className={numInputClass}
                          value={entry.budgetInitial || ''}
                          onChange={(e) =>
                            handleEntryUpdate(index, {
                              budgetInitial: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </td>

                      {/* Budget Adjusted */}
                      <td className="px-1 py-1">
                        <Input
                          type="number"
                          className={numInputClass}
                          value={entry.budgetAdjusted || ''}
                          onChange={(e) =>
                            handleEntryUpdate(index, {
                              budgetAdjusted: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </td>

                      {/* Delete */}
                      <td className="px-1 py-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteRow(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}

                {/* Totals row */}
                {entries.length > 0 && (
                  <tr className="bg-slate-100 font-semibold border-t-2 border-slate-300">
                    <td colSpan={6} className="px-2 py-2 text-xs text-slate-600">
                      TOTALS
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-mono text-slate-800">
                      {fmtNum(totals.totalDebitCurrent)}
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-mono text-slate-800">
                      {fmtNum(totals.totalCreditCurrent)}
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-mono text-slate-800">
                      {fmtNum(totals.totalDebitPrior)}
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-mono text-slate-800">
                      {fmtNum(totals.totalCreditPrior)}
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-mono text-slate-800">
                      {fmtNum(totals.totalBudgetInitial)}
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-mono text-slate-800">
                      {fmtNum(totals.totalBudgetAdjusted)}
                    </td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Row */}
          <div className="border-t border-slate-200 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddRow}
              className="gap-1.5 text-slate-600 hover:text-slate-900"
            >
              <Plus className="h-4 w-4" />
              Add Row
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
