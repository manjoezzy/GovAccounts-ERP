'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Banknote, Plus, Trash2, Upload, Download, Pencil, CheckCircle2,
  ArrowRight, ArrowLeft, AlertTriangle, TrendingUp, TrendingDown,
  RefreshCw, BarChart3, Save, Loader2, X, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useFinancialStore, type BudgetEntry } from './store'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function Step3Budget() {
  const {
    budgets, entries, entityConfig, isLoading, setWizardStep,
    fetchBudgets, saveBudgets, importBudgetFromTB, clearBudgets, activeReportId,
  } = useFinancialStore()
  const [localBudgets, setLocalBudgets] = useState<BudgetEntry[]>([])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const budgetFileRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeReportId) fetchBudgets().then(() => {})
  }, [activeReportId, fetchBudgets])

  useEffect(() => {
    setLocalBudgets([...budgets])
  }, [budgets])

  const updateBudget = (index: number, field: keyof BudgetEntry, value: number | string) => {
    setLocalBudgets(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      const b = updated[index]
      b.revisedBudget = (b.initialBudget || 0) + (b.virementTo || 0) - (b.virementFrom || 0)
      b.variance = (b.revisedBudget || 0) - (b.actualAmount || 0)
      b.variancePercent = b.revisedBudget !== 0 ? (b.variance / b.revisedBudget) * 100 : 0
      return updated
    })
  }

  const addBudgetLine = () => {
    setLocalBudgets(prev => [...prev, {
      category: `custom_${prev.length}`,
      categoryLabel: '',
      lineItem: '',
      initialBudget: 0,
      revisedBudget: 0,
      virementFrom: 0,
      virementTo: 0,
      actualAmount: 0,
      variance: 0,
      variancePercent: 0,
      sortOrder: prev.length,
    }])
  }

  const deleteBudgetLine = (index: number) => {
    setLocalBudgets(prev => prev.filter((_, i) => i !== index))
  }

  const handleClear = () => {
    clearBudgets()
    setLocalBudgets([])
    setShowClearConfirm(false)
  }

  const handleSave = async () => {
    try {
      await saveBudgets(localBudgets)
    } catch {
      toast.error('Failed to save budgets')
    }
  }

  const handleUploadBudgetExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      const parsed: BudgetEntry[] = []
      for (const row of rows) {
        const values = Object.values(row)
        if (values.every(v => v === '' || v === 0 || v === undefined || v === null)) continue
        const pn = (v: unknown): number => {
          if (typeof v === 'number') return v
          if (typeof v === 'string') { const n = parseFloat(v.replace(/[^\d.-]/g, '')); return isNaN(n) ? 0 : n }
          return 0
        }
        const cat = String(row['Category'] ?? row['Line Item'] ?? values[0] ?? '').trim()
        if (!cat) continue
        const initial = pn(row['Initial Budget'] ?? row['Initial'] ?? values[1])
        const vTo = pn(row['Virement To'] ?? row['Adjusted'] ?? values[2])
        const vFrom = pn(row['Virement From'] ?? values[3])
        const actual = pn(row['Actual'] ?? row['Actual Amount'] ?? values[4])
        const revised = initial + vTo - vFrom
        const variance = revised - actual
        const vp = revised !== 0 ? (variance / revised) * 100 : 0
        parsed.push({
          category: cat.toLowerCase().replace(/\s+/g, '_'),
          categoryLabel: cat,
          lineItem: String(row['Sub-line'] ?? ''),
          initialBudget: initial,
          revisedBudget: revised,
          virementFrom: vFrom,
          virementTo: vTo,
          actualAmount: actual,
          variance,
          variancePercent: vp,
          sortOrder: parsed.length,
        })
      }
      if (parsed.length === 0) { toast.error('No valid budget items found in file'); return }
      setLocalBudgets(parsed)
      toast.success(`Imported ${parsed.length} budget items from Excel`)
    } catch {
      toast.error('Failed to parse Excel file')
    }
    e.target.value = ''
  }

  const totalInitial = localBudgets.reduce((s, b) => s + (b.initialBudget || 0), 0)
  const totalRevised = localBudgets.reduce((s, b) => s + (b.revisedBudget || 0), 0)
  const totalActual = localBudgets.reduce((s, b) => s + (b.actualAmount || 0), 0)
  const totalVariance = localBudgets.reduce((s, b) => s + (b.variance || 0), 0)
  const totalVirementTo = localBudgets.reduce((s, b) => s + (b.virementTo || 0), 0)
  const totalVirementFrom = localBudgets.reduce((s, b) => s + (b.virementFrom || 0), 0)
  const overBudgetCount = localBudgets.filter(b => (b.variance || 0) < 0).length

  return (
    <motion.div {...pageVariants} className="py-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Budget Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Set initial budgets, track virements (transfers), and analyze variances against actual amounts.</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Initial Budget', value: `${entityConfig.currency} ${formatNum(totalInitial)}`, icon: <Banknote className="h-4 w-4 text-primary" />, color: 'text-primary' },
          { label: 'Virement To', value: formatNum(totalVirementTo), icon: <TrendingUp className="h-4 w-4 text-sky-500" />, color: 'text-sky-500' },
          { label: 'Virement From', value: formatNum(totalVirementFrom), icon: <TrendingDown className="h-4 w-4 text-orange-500" />, color: 'text-orange-500' },
          { label: 'Revised Budget', value: `${entityConfig.currency} ${formatNum(totalRevised)}`, icon: <RefreshCw className="h-4 w-4 text-foreground" />, color: 'text-foreground' },
          { label: 'Actual', value: `${entityConfig.currency} ${formatNum(totalActual)}`, icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />, color: 'text-foreground' },
          { label: 'Variance', value: `${totalVariance >= 0 ? '+' : '-'}${entityConfig.currency} ${formatNum(Math.abs(totalVariance))}`, icon: totalVariance >= 0 ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" />, color: totalVariance >= 0 ? 'text-primary' : 'text-destructive' },
          { label: 'Over Budget', value: `${overBudgetCount} item${overBudgetCount !== 1 ? 's' : ''}`, icon: <AlertTriangle className={`h-4 w-4 ${overBudgetCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />, color: overBudgetCount > 0 ? 'text-destructive' : 'text-muted-foreground' },
        ].map(kpi => (
          <Card key={kpi.label} className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              {kpi.icon}
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{kpi.label}</span>
            </div>
            <p className={`text-sm font-bold font-mono ${kpi.color}`}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={importBudgetFromTB} disabled={entries.length === 0}>
                <Download className="h-4 w-4" /> Import from TB
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Auto-populate budget lines from trial balance budget columns</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => budgetFileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload Budget
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Upload budget data from Excel (.xlsx, .csv)</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <input ref={budgetFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUploadBudgetExcel} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={addBudgetLine}>
                <Plus className="h-4 w-4" /> Add Line
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Add a custom budget line item</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {localBudgets.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setShowClearConfirm(true)}>
                  <Trash2 className="h-4 w-4" /> Clear Budget
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Clear all budget entries</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <span className="text-xs text-muted-foreground ml-2">{localBudgets.length} items</span>
      </div>

      {/* Clear confirm dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Budget Entries?</DialogTitle>
            <DialogDescription>This will remove all {localBudgets.length} budget line items. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
            <Button variant="destructive" className="gap-2" onClick={handleClear}>
              <Trash2 className="h-4 w-4" /> Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Table */}
      {localBudgets.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-foreground text-background">
                <th className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide w-8">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide">Category / Line Item</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-28">Initial Budget</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-24">Virement To</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-24">Virement From</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-28">Revised</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-28">Actual</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-28">Variance</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide w-20">Var %</th>
                <th className="px-3 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {localBudgets.map((b, i) => {
                const isEditing = editingIdx === i
                const isOver = (b.variance || 0) < 0
                const isUnder = (b.variance || 0) > 0
                return (
                  <tr key={i} className={`border-b border-border hover:bg-muted/30 ${isOver ? 'bg-destructive/5' : ''}`}>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input className="h-7 text-xs" value={b.categoryLabel} onChange={e => updateBudget(i, 'categoryLabel', e.target.value)} placeholder="Category name" />
                          <Input className="h-6 text-[10px]" value={b.lineItem} onChange={e => updateBudget(i, 'lineItem', e.target.value)} placeholder="Sub-line item (optional)" />
                        </div>
                      ) : (
                        <div>
                          <p className="text-foreground font-medium text-xs">{b.categoryLabel || b.category}</p>
                          {b.lineItem && <p className="text-[10px] text-muted-foreground">{b.lineItem}</p>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <Input type="number" className="h-7 text-xs font-mono text-right" value={b.initialBudget || ''} onChange={e => updateBudget(i, 'initialBudget', parseFloat(e.target.value) || 0)} />
                      ) : (
                        <span className="font-mono text-xs text-foreground">{formatNum(b.initialBudget)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <Input type="number" className="h-7 text-xs font-mono text-right" value={b.virementTo || ''} onChange={e => updateBudget(i, 'virementTo', parseFloat(e.target.value) || 0)} />
                      ) : (
                        <span className="font-mono text-xs text-sky-600 dark:text-sky-400">{formatNum(b.virementTo)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <Input type="number" className="h-7 text-xs font-mono text-right" value={b.virementFrom || ''} onChange={e => updateBudget(i, 'virementFrom', parseFloat(e.target.value) || 0)} />
                      ) : (
                        <span className="font-mono text-xs text-orange-600 dark:text-orange-400">{formatNum(b.virementFrom)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-foreground">{formatNum(b.revisedBudget)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-foreground">{formatNum(b.actualAmount)}</td>
                    <td className={`px-3 py-2 font-mono text-xs font-semibold ${isOver ? 'text-destructive' : isUnder ? 'text-primary' : 'text-foreground'}`}>
                      {b.variance > 0 ? '+' : ''}{formatNum(b.variance)}
                      {isOver && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                    </td>
                    <td className={`px-3 py-2 font-mono text-xs ${isOver ? 'text-destructive' : isUnder ? 'text-primary' : 'text-muted-foreground'}`}>
                      {b.variancePercent.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-muted rounded" onClick={() => setEditingIdx(isEditing ? null : i)} title={isEditing ? 'Done editing' : 'Edit row'}>
                          {isEditing ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Pencil className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                        <button className="p-1 hover:bg-destructive/10 rounded" onClick={() => deleteBudgetLine(i)} title="Delete row">
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {/* Totals row */}
              <tr className="bg-muted/50 font-semibold">
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-xs text-foreground">TOTAL</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-foreground">{formatNum(totalInitial)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-sky-600 dark:text-sky-400">{formatNum(totalVirementTo)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-orange-600 dark:text-orange-400">{formatNum(totalVirementFrom)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-foreground">{formatNum(totalRevised)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-foreground">{formatNum(totalActual)}</td>
                <td className={`px-3 py-2 text-right font-mono text-xs ${totalVariance >= 0 ? 'text-primary' : 'text-destructive'}`}>{totalVariance >= 0 ? '+' : ''}{formatNum(totalVariance)}</td>
                <td className={`px-3 py-2 text-right font-mono text-xs ${totalVariance >= 0 ? 'text-primary' : 'text-destructive'}`}>{totalRevised !== 0 ? ((totalVariance / totalRevised) * 100).toFixed(1) : '0.0'}%</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-6 mb-4">
              <Banknote className="h-10 w-10 text-primary/60" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No Budget Data Yet</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-md">Import budget data from your trial balance, upload an Excel file, or add line items manually.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={importBudgetFromTB} disabled={entries.length === 0}>
                <Download className="h-4 w-4" /> Import from TB
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => budgetFileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={() => setWizardStep(7)} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back to Abstract
            </Button>
            <div className="flex gap-2">
              {localBudgets.length > 0 && (
                <Button onClick={handleSave} disabled={isLoading} className="bg-primary text-primary-foreground gap-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Budget
                </Button>
              )}
              <Button onClick={() => setWizardStep(9)} className="bg-primary text-primary-foreground gap-2">
                Continue to Supplementary <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
