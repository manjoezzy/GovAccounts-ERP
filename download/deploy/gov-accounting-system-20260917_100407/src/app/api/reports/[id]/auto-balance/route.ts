import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(
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

    const entries = report.entries;

    // Calculate totals
    const totalDebitCurrent = entries.reduce((s, e) => s + e.debitCurrent, 0);
    const totalCreditCurrent = entries.reduce((s, e) => s + e.creditCurrent, 0);
    const totalDebitPrior = entries.reduce((s, e) => s + e.debitPrior, 0);
    const totalCreditPrior = entries.reduce((s, e) => s + e.creditPrior, 0);

    const diffCurrent = totalDebitCurrent - totalCreditCurrent;
    const diffPrior = totalDebitPrior - totalCreditPrior;

    const addedEntries: { accountCode: string; accountName: string; side: string; amount: number }[] = [];

    // Fix current year if needed
    if (Math.abs(diffCurrent) > 0.01) {
      const maxSort = entries.length > 0 ? Math.max(...entries.map(e => e.sortOrder)) : -1;
      await db.trialBalanceEntry.create({
        data: {
          reportId: id,
          accountCode: '9999',
          accountName: 'Auto-Balance Suspense',
          classification: diffCurrent > 0 ? 'liability-current' : 'asset-current',
          category: diffCurrent > 0 ? 'payables_current' : 'cash',
          debitCurrent: diffCurrent > 0 ? 0 : Math.abs(diffCurrent),
          creditCurrent: diffCurrent > 0 ? Math.abs(diffCurrent) : 0,
          sortOrder: maxSort + 1,
        },
      });
      addedEntries.push({
        accountCode: '9999',
        accountName: 'Auto-Balance Suspense',
        side: diffCurrent > 0 ? 'credit' : 'debit',
        amount: Math.abs(diffCurrent),
      });
    }

    // Fix prior year if needed
    if (Math.abs(diffPrior) > 0.01) {
      const updatedEntries = await db.trialBalanceEntry.findMany({
        where: { reportId: id },
        orderBy: { sortOrder: 'asc' },
      });
      const maxSort = updatedEntries.length > 0 ? Math.max(...updatedEntries.map(e => e.sortOrder)) : -1;
      await db.trialBalanceEntry.create({
        data: {
          reportId: id,
          accountCode: '9999',
          accountName: 'Auto-Balance Suspense',
          classification: diffPrior > 0 ? 'liability-current' : 'asset-current',
          category: diffPrior > 0 ? 'payables_current' : 'cash',
          debitPrior: diffPrior > 0 ? 0 : Math.abs(diffPrior),
          creditPrior: diffPrior > 0 ? Math.abs(diffPrior) : 0,
          sortOrder: maxSort + 1,
        },
      });
      addedEntries.push({
        accountCode: '9999',
        accountName: 'Auto-Balance Suspense',
        side: diffPrior > 0 ? 'credit' : 'debit',
        amount: Math.abs(diffPrior),
      });
    }

    // Audit log
    if (addedEntries.length > 0) {
      await db.auditLog.create({
        data: {
          reportId: id,
          action: 'auto_balance',
          field: 'trial_balance',
          oldValue: `Debits: ${totalDebitCurrent}, Credits: ${totalCreditCurrent} (Current) | Debits: ${totalDebitPrior}, Credits: ${totalCreditPrior} (Prior)`,
          newValue: `Auto-balance applied: ${addedEntries.length} entry(ies) added`,
          userId: 'system',
        },
      });
    }

    // Return updated entries
    const updatedEntries = await db.trialBalanceEntry.findMany({
      where: { reportId: id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      originalDiff: { current: diffCurrent, prior: diffPrior },
      addedEntries,
      entries: updatedEntries,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
