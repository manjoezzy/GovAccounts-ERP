import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const budgets = await db.budget.findMany({
      where: { reportId: id },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(budgets)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { budgets: items } = body as { budgets: Record<string, unknown>[] }

    // Delete existing budgets for this report
    await db.budget.deleteMany({ where: { reportId: id } })

    // Create new budgets
    const created = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const budget = await db.budget.create({
        data: {
          reportId: id,
          category: String(item.category || ''),
          categoryLabel: String(item.categoryLabel || ''),
          lineItem: String(item.lineItem || ''),
          initialBudget: Number(item.initialBudget || 0),
          revisedBudget: Number(item.revisedBudget || 0),
          virementFrom: Number(item.virementFrom || 0),
          virementTo: Number(item.virementTo || 0),
          actualAmount: Number(item.actualAmount || 0),
          variance: Number(item.variance || 0),
          variancePercent: Number(item.variancePercent || 0),
          sortOrder: Number(item.sortOrder ?? i),
        },
      })
      created.push(budget)
    }

    return NextResponse.json(created)
  } catch (error) {
    console.error('Budget save error:', error)
    return NextResponse.json({ error: 'Failed to save budgets' }, { status: 500 })
  }
}
