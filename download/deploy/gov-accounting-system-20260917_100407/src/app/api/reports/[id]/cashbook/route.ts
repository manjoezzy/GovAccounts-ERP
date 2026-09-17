import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await db.cashbookEntry.findMany({ where: { reportId: id }, orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { entries } = body as { entries: Record<string, unknown>[] }

  await db.cashbookEntry.deleteMany({ where: { reportId: id } })

  if (entries.length > 0) {
    await db.cashbookEntry.createMany({
      data: entries.map((e, i) => ({
        reportId: id,
        entryDate: String(e.entryDate || ''),
        type: String(e.type || 'receipt'),
        reference: String(e.reference || ''),
        description: String(e.description || ''),
        accountCode: String(e.accountCode || ''),
        accountName: String(e.accountName || ''),
        debitAmount: Number(e.debitAmount || 0),
        creditAmount: Number(e.creditAmount || 0),
        balance: Number(e.balance || 0),
        bankAccount: String(e.bankAccount || ''),
        chequeNo: String(e.chequeNo || ''),
        payeePayer: String(e.payeePayer || ''),
        sortOrder: i,
      })),
    })
  }

  const data = await db.cashbookEntry.findMany({ where: { reportId: id }, orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(data)
}
