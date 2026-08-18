import { db } from '@/lib/db';
import { generateStatements } from '@/lib/financial-engine';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await db.financialReport.findUnique({
      where: { id },
      include: { entries: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const tbEntries = report.entries.map(e => ({
      accountCode: e.accountCode,
      accountName: e.accountName,
      classification: e.classification,
      category: e.category,
      noteRef: e.noteRef,
      debitCurrent: e.debitCurrent,
      creditCurrent: e.creditCurrent,
      debitPrior: e.debitPrior,
      creditPrior: e.creditPrior,
      budgetInitial: e.budgetInitial,
      budgetAdjusted: e.budgetAdjusted,
    }));

    const statements = generateStatements(tbEntries);

    await db.financialReport.update({
      where: { id },
      data: { status: 'generated' },
    });

    return NextResponse.json({ report, statements });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
