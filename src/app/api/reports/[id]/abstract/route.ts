import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await db.abstractEntry.findMany({ where: { reportId: id }, orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { entries } = body as { entries: Record<string, unknown>[] }

  await db.abstractEntry.deleteMany({ where: { reportId: id } })

  if (entries.length > 0) {
    await db.abstractEntry.createMany({
      data: entries.map((e, i) => ({
        reportId: id,
        itemCode: String(e.itemCode || ''),
        itemDescription: String(e.itemDescription || ''),
        type: String(e.type || 'revenue'),
        budgetEstimate: Number(e.budgetEstimate || 0),
        actualAmount: Number(e.actualAmount || 0),
        variance: Number(e.variance || 0),
        variancePercent: Number(e.variancePercent || 0),
        priorYearActual: Number(e.priorYearActual || 0),
        sortOrder: i,
      })),
    })
  }

  const data = await db.abstractEntry.findMany({ where: { reportId: id }, orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(data)
}
