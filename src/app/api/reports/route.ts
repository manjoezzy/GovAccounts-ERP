import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const report = await db.financialReport.create({
      data: {
        entityName: body.entityName || 'Government Entity',
        periodEnd: body.periodEnd || '2025-06-30',
        periodLabel: body.periodLabel || '30 June 2025',
        currency: body.currency || 'Shs',
        status: 'draft',
      },
    });
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const reports = await db.financialReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: { entries: true },
    });
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
