'use client'

import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CLASSIFICATION_OPTIONS, CATEGORY_OPTIONS, NOTE_REFS } from '@/lib/account-templates'
import type { TBEntryUI } from './store'

interface TBEntryRowProps {
  entry: TBEntryUI
  index: number
  onEntryChange: (index: number, updates: Partial<TBEntryUI>) => void
  onDelete: (index: number) => void
}

export function TBEntryRow({ entry, index, onEntryChange, onDelete }: TBEntryRowProps) {
  const categoryOptions = CATEGORY_OPTIONS[entry.classification] || []

  const handleClassificationChange = (value: string) => {
    const newCategoryOptions = CATEGORY_OPTIONS[value] || []
    const newNoteRef = newCategoryOptions.length === 1
      ? (NOTE_REFS[newCategoryOptions[0].value] || '')
      : ''
    onEntryChange(index, {
      classification: value,
      category: newCategoryOptions.length === 1 ? newCategoryOptions[0].value : '',
      noteRef: newNoteRef,
    })
  }

  const handleCategoryChange = (value: string) => {
    onEntryChange(index, {
      category: value,
      noteRef: NOTE_REFS[value] || '',
    })
  }

  return (
    <tr className="group border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-1 py-0.5">
        <span className="text-xs text-slate-400 font-mono w-6 inline-block text-center">
          {index + 1}
        </span>
      </td>
      <td className="px-1 py-0.5">
        <Input
          className="h-8 w-24 text-xs font-mono"
          value={entry.accountCode}
          onChange={(e) => onEntryChange(index, { accountCode: e.target.value })}
          placeholder="Code"
        />
      </td>
      <td className="px-1 py-0.5">
        <Input
          className="h-8 min-w-[140px] text-xs"
          value={entry.accountName}
          onChange={(e) => onEntryChange(index, { accountName: e.target.value })}
          placeholder="Account Name"
        />
      </td>
      <td className="px-1 py-0.5">
        <Select
          value={entry.classification}
          onValueChange={handleClassificationChange}
        >
          <SelectTrigger className="h-8 w-[160px] text-xs" size="sm">
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
      <td className="px-1 py-0.5">
        <Select
          value={entry.category}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="h-8 w-[200px] text-xs" size="sm">
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
      <td className="px-1 py-0.5">
        <Input
          className="h-8 w-16 text-xs font-mono text-center"
          value={entry.noteRef}
          onChange={(e) => onEntryChange(index, { noteRef: e.target.value })}
          placeholder="-"
        />
      </td>
      <td className="px-1 py-0.5">
        <Input
          type="number"
          className="h-8 w-32 text-xs font-mono text-right"
          value={entry.debitCurrent || ''}
          onChange={(e) =>
            onEntryChange(index, { debitCurrent: parseFloat(e.target.value) || 0 })
          }
          placeholder="0"
        />
      </td>
      <td className="px-1 py-0.5">
        <Input
          type="number"
          className="h-8 w-32 text-xs font-mono text-right"
          value={entry.creditCurrent || ''}
          onChange={(e) =>
            onEntryChange(index, { creditCurrent: parseFloat(e.target.value) || 0 })
          }
          placeholder="0"
        />
      </td>
      <td className="px-1 py-0.5">
        <Input
          type="number"
          className="h-8 w-32 text-xs font-mono text-right"
          value={entry.debitPrior || ''}
          onChange={(e) =>
            onEntryChange(index, { debitPrior: parseFloat(e.target.value) || 0 })
          }
          placeholder="0"
        />
      </td>
      <td className="px-1 py-0.5">
        <Input
          type="number"
          className="h-8 w-32 text-xs font-mono text-right"
          value={entry.creditPrior || ''}
          onChange={(e) =>
            onEntryChange(index, { creditPrior: parseFloat(e.target.value) || 0 })
          }
          placeholder="0"
        />
      </td>
      <td className="px-1 py-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(index)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  )
}
