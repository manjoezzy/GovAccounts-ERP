'use client'

export interface StatementRow {
  label: string
  noteRef?: string
  current: number
  prior: number
  indent?: number
  isBold?: boolean
  isSubtotal?: boolean
  isTotal?: boolean
  isSection?: boolean
}

interface StatementTableProps {
  title?: string
  rows: StatementRow[]
  currency?: string
  showHeader?: boolean
  extraColumns?: { header: string; current: number; prior: number }[]
}

function formatNum(n: number): string {
  return Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function StatementTable({
  title,
  rows,
  currency = 'Shs',
  showHeader = true,
  extraColumns,
}: StatementTableProps) {
  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          {showHeader && (
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide">
                  Description
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide w-16">
                  Note
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
                  Current Year ({currency})
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide">
                  Prior Year ({currency})
                </th>
                {extraColumns?.map((col, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, i) => {
              const isSection = row.isSection
              const isTotal = row.isTotal
              const isBold = row.isBold
              const indent = row.indent || 0

              let rowClass = 'border-b border-slate-100 '
              if (isSection) {
                rowClass += 'bg-slate-50 '
              } else if (isTotal) {
                rowClass += 'bg-slate-100 font-bold '
              }

              const labelClass = isSection
                ? 'text-xs font-semibold uppercase tracking-wide text-slate-500'
                : isBold || isTotal
                  ? 'font-semibold text-slate-800'
                  : 'text-slate-600'

              const numClass = isSection
                ? 'text-xs uppercase tracking-wide text-slate-500'
                : isBold || isTotal
                  ? 'font-semibold text-slate-800 font-mono'
                  : 'text-slate-700 font-mono'

              return (
                <tr key={i} className={rowClass}>
                  <td
                    className={`px-4 py-2 ${labelClass}`}
                    style={{ paddingLeft: `${16 + indent * 24}px` }}
                  >
                    {row.label}
                  </td>
                  <td className="px-4 py-2 text-center text-xs text-slate-500 font-mono">
                    {row.noteRef || ''}
                  </td>
                  <td className={`px-4 py-2 text-right ${numClass}`}>
                    {isSection ? '' : formatNum(row.current)}
                  </td>
                  <td className={`px-4 py-2 text-right ${numClass}`}>
                    {isSection ? '' : formatNum(row.prior)}
                  </td>
                  {extraColumns?.map((col, j) => {
                    const val =
                      j === 0
                        ? formatNum(col.current)
                        : j === 1
                          ? formatNum(col.prior)
                          : ''
                    return (
                      <td
                        key={j}
                        className={`px-4 py-2 text-right ${numClass}`}
                      >
                        {isSection ? '' : val}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
