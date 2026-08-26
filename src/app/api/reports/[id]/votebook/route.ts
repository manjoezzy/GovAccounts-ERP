import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await db.votebookEntry.findMany({ where: { reportId: id }, orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { entries } = body as { entries: Record<string, unknown>[] }

  await db.votebookEntry.deleteMany({ where: { reportId: id } })

  if (entries.length > 0) {
    await db.votebookEntry.createMany({
      data: entries.map((e, i) => ({
        reportId: id,
        voteCode: String(e.voteCode || ''),
        voteDescription: String(e.voteDescription || ''),
        annualAppropriation: Number(e.annualAppropriation || 0),
        supplementaryAppropriation: Number(e.supplementaryAppropriation || 0),
        totalAppropriation: Number(e.totalAppropriation || 0),
        commitments: Number(e.commitments || 0),
        expenditures: Number(e.expenditures || 0),
        unspentBalance: Number(e.unspentBalance || 0),
        encumbrances: Number(e.encumbrances || 0),
        availableBalance: Number(e.availableBalance || 0),
        quarter: String(e.quarter || ''),
        status: String(e.status || 'active'),
        notes: String(e.notes || ''),
        sortOrder: i,
      })),
    })
  }

  const data = await db.votebookEntry.findMany({ where: { reportId: id }, orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(data)
}
