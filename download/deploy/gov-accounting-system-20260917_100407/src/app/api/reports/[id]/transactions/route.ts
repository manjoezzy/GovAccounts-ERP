import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await db.transaction.findMany({ where: { reportId: id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { transactions } = body as { transactions: Record<string, unknown>[] }

  await db.transaction.deleteMany({ where: { reportId: id } })

  if (transactions.length > 0) {
    await db.transaction.createMany({
      data: transactions.map((t) => ({
        reportId: id,
        transactionDate: String(t.transactionDate || ''),
        type: String(t.type || 'revenue'),
        reference: String(t.reference || ''),
        description: String(t.description || ''),
        accountCode: String(t.accountCode || ''),
        accountName: String(t.accountName || ''),
        classification: String(t.classification || ''),
        category: String(t.category || ''),
        amount: Number(t.amount || 0),
        taxAmount: Number(t.taxAmount || 0),
        netAmount: Number(t.netAmount || 0),
        payeePayer: String(t.payeePayer || ''),
        voucherNo: String(t.voucherNo || ''),
        invoiceNo: String(t.invoiceNo || ''),
        receiptNo: String(t.receiptNo || ''),
        fundSource: String(t.fundSource || ''),
        postedToLedger: Boolean(t.postedToLedger),
        postedToCashbook: Boolean(t.postedToCashbook),
      })),
    })
  }

  const data = await db.transaction.findMany({ where: { reportId: id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(data)
}
