import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await db.ledgerEntry.findMany({ where: { reportId: id }, orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { entries } = body as { entries: Record<string, unknown>[] }

  await db.ledgerEntry.deleteMany({ where: { reportId: id } })

  if (entries.length > 0) {
    await db.ledgerEntry.createMany({
      data: entries.map((e, i) => ({
        reportId: id,
        entryDate: String(e.entryDate || ''),
        accountCode: String(e.accountCode || ''),
        accountName: String(e.accountName || ''),
        classification: String(e.classification || ''),
        category: String(e.category || ''),
        debit: Number(e.debit || 0),
        credit: Number(e.credit || 0),
        runningBalance: Number(e.runningBalance || 0),
        reference: String(e.reference || ''),
        description: String(e.description || ''),
        journalType: String(e.journalType || 'general'),
        sortOrder: i,
      })),
    })
  }

  const data = await db.ledgerEntry.findMany({ where: { reportId: id }, orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(data)
}
