import { db } from '@/lib/db';
import { generateStatements } from '@/lib/financial-engine';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const versionLabel = searchParams.get('versionLabel') || '';

    const report = await db.financialReport.findUnique({
      where: { id },
      include: { entries: { orderBy: { sortOrder: 'asc' } }, supplementary: true },
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

    // Incorporate supplementary data into generation context
    const supp = report.supplementary;
    const statements = generateStatements(tbEntries, supp ? {
      advancesRecovered: supp.advancesRecovered,
      advancesRecoveredPrior: supp.advancesRecoveredPrior,
      depositsReceived: supp.depositsReceived,
      depositsReceivedPrior: supp.depositsReceivedPrior,
      transfersToTreasury: supp.transfersToTreasury,
      transfersToTreasuryPrior: supp.transfersToTreasuryPrior,
      revenueInKindTaxWaivers: supp.revenueInKindTaxWaivers,
      revenueInKindTaxWaiversPrior: supp.revenueInKindTaxWaiversPrior,
    } : undefined);

    // Update report status and version label
    const updateData: Record<string, unknown> = { status: 'generated' };
    if (versionLabel) {
      updateData.versionLabel = versionLabel;
    }
    await db.financialReport.update({
      where: { id },
      data: updateData,
    });

    // Audit log for statement generation
    await db.auditLog.create({
      data: {
        reportId: id,
        action: 'statements_generated',
        field: 'status',
        oldValue: report.status,
        newValue: 'generated',
        userId: 'system',
      },
    });

    return NextResponse.json({ report, statements, supplementary: supp });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
