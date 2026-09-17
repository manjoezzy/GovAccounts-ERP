import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceReportId, newPeriodEnd, newPeriodLabel } = body;

    if (!sourceReportId || !newPeriodEnd || !newPeriodLabel) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceReportId, newPeriodEnd, newPeriodLabel' },
        { status: 400 }
      );
    }

    // ── Fetch source report with all trial balance entries ──────
    const sourceReport = await db.financialReport.findUnique({
      where: { id: sourceReportId },
      include: { entries: true },
    });

    if (!sourceReport) {
      return NextResponse.json(
        { error: 'Source report not found' },
        { status: 404 }
      );
    }

    // ── Create the new financial report ──────────────────────────
    const newReport = await db.financialReport.create({
      data: {
        entityName: sourceReport.entityName,
        periodEnd: newPeriodEnd,
        periodLabel: newPeriodLabel,
        currency: sourceReport.currency,
        status: 'draft',
        version: 1,
        versionLabel: 'Original',
        fiscalYear: '', // new period — user can set later
        parentVersionId: sourceReport.id,
      },
    });

    // ── Carry forward trial balance entries ──────────────────────
    // Rules:
    //   Revenue/Expense (nominal accounts): current becomes prior; new current = 0
    //   Assets/Liabilities (balance sheet):  current stays as current; prior = old prior
    //   Budget copies from source
    const tbEntries = sourceReport.entries.map((entry) => {
      const isBalanceSheet =
        entry.classification === 'asset' ||
        entry.classification === 'liability' ||
        entry.classification === 'equity';

      if (isBalanceSheet) {
        // Balance sheet items: current balances carry forward
        return {
          reportId: newReport.id,
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          classification: entry.classification,
          category: entry.category,
          noteRef: entry.noteRef,
          debitCurrent: entry.debitCurrent,   // carried forward
          creditCurrent: entry.creditCurrent, // carried forward
          debitPrior: entry.debitPrior,       // prior stays as prior
          creditPrior: entry.creditPrior,     // prior stays as prior
          budgetInitial: entry.budgetInitial,
          budgetAdjusted: entry.budgetAdjusted,
          sortOrder: entry.sortOrder,
        };
      } else {
        // Revenue/Expense (nominal accounts): current → prior, new current = 0
        return {
          reportId: newReport.id,
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          classification: entry.classification,
          category: entry.category,
          noteRef: entry.noteRef,
          debitCurrent: 0,                // fresh period
          creditCurrent: 0,               // fresh period
          debitPrior: entry.debitCurrent, // current becomes prior
          creditPrior: entry.creditCurrent, // current becomes prior
          budgetInitial: entry.budgetInitial,
          budgetAdjusted: entry.budgetAdjusted,
          sortOrder: entry.sortOrder,
        };
      }
    });

    await db.trialBalanceEntry.createMany({ data: tbEntries });

    // ── Carry forward CashbookOpeningBalance ─────────────────────
    const sourceOpeningBalances = await db.cashbookOpeningBalance.findMany({
      where: { reportId: sourceReportId },
    });

    for (const ob of sourceOpeningBalances) {
      // The opening balance for the new period = closing cash position
      // from the source period. We compute it from cashbook entries.
      const cashEntries = await db.cashbookEntry.findMany({
        where: { reportId: sourceReportId, bankAccount: ob.bankAccount },
        orderBy: { createdAt: 'desc' },
      });

      // Closing balance = last entry's balance, or opening if no entries
      const closingBalance =
        cashEntries.length > 0
          ? cashEntries[0].balance
          : ob.amount;

      await db.cashbookOpeningBalance.create({
        data: {
          reportId: newReport.id,
          bankAccount: ob.bankAccount,
          amount: closingBalance,
          asOfDate: newPeriodEnd,
        },
      });
    }

    // ── Carry forward Fund opening balances ──────────────────────
    const sourceFunds = await db.fund.findMany({
      where: { reportId: sourceReportId },
    });

    for (const fund of sourceFunds) {
      await db.fund.create({
        data: {
          reportId: newReport.id,
          name: fund.name,
          fundType: fund.fundType,
          code: fund.code,
          description: fund.description,
          isActive: fund.isActive,
          openingBalance: fund.openingBalance, // carried forward
        },
      });
    }

    // ── Carry forward LedgerAccount opening balances ─────────────
    const sourceLedgerAccounts = await db.ledgerAccount.findMany({
      where: { reportId: sourceReportId },
    });

    for (const la of sourceLedgerAccounts) {
      await db.ledgerAccount.create({
        data: {
          reportId: newReport.id,
          accountCode: la.accountCode,
          accountName: la.accountName,
          accountType: la.accountType,
          openingDebit: la.closingDebit,   // closing becomes opening
          openingCredit: la.closingCredit, // closing becomes opening
          totalDebit: 0,
          totalCredit: 0,
          closingDebit: la.closingDebit,   // initially same as opening
          closingCredit: la.closingCredit,
        },
      });
    }

    // ── Return the new report with entries ───────────────────────
    const result = await db.financialReport.findUnique({
      where: { id: newReport.id },
      include: { entries: { orderBy: { sortOrder: 'asc' } } },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Carry-forward error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
