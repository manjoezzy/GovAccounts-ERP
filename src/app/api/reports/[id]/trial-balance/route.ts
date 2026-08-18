import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Delete existing entries for this report
    await db.trialBalanceEntry.deleteMany({ where: { reportId: id } });

    // Create new entries
    const entries = body.entries.map((entry: Record<string, unknown>, index: number) => ({
      reportId: id,
      accountCode: String(entry.accountCode || ''),
      accountName: String(entry.accountName || ''),
      classification: String(entry.classification || 'revenue-non-exchange'),
      category: String(entry.category || ''),
      noteRef: String(entry.noteRef || ''),
      debitCurrent: Number(entry.debitCurrent || 0),
      creditCurrent: Number(entry.creditCurrent || 0),
      debitPrior: Number(entry.debitPrior || 0),
      creditPrior: Number(entry.creditPrior || 0),
      budgetInitial: Number(entry.budgetInitial || 0),
      budgetAdjusted: Number(entry.budgetAdjusted || 0),
      sortOrder: index,
    }));

    if (entries.length > 0) {
      await db.trialBalanceEntry.createMany({ data: entries });
    }

    // Update report status
    await db.financialReport.update({
      where: { id },
      data: { status: 'complete' },
    });

    return NextResponse.json({ success: true, count: entries.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
