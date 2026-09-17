import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const original = await db.financialReport.findUnique({
      where: { id },
      include: { entries: { orderBy: { sortOrder: 'asc' } }, supplementary: true },
    });
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const newVersion = await db.financialReport.create({
      data: {
        entityName: original.entityName,
        periodEnd: original.periodEnd,
        periodLabel: original.periodLabel,
        currency: original.currency,
        status: 'draft',
        version: original.version + 1,
        versionLabel: body.versionLabel || `v${original.version + 1}`,
        parentVersionId: original.parentVersionId || original.id,
        entries: {
          create: original.entries.map((entry, index) => ({
            accountCode: entry.accountCode,
            accountName: entry.accountName,
            classification: entry.classification,
            category: entry.category,
            noteRef: entry.noteRef,
            debitCurrent: entry.debitCurrent,
            creditCurrent: entry.creditCurrent,
            debitPrior: entry.debitPrior,
            creditPrior: entry.creditPrior,
            budgetInitial: entry.budgetInitial,
            budgetAdjusted: entry.budgetAdjusted,
            sortOrder: index,
          })),
        },
        supplementary: original.supplementary
          ? {
              create: {
                advancesRecovered: original.supplementary.advancesRecovered,
                advancesRecoveredPrior: original.supplementary.advancesRecoveredPrior,
                depositsReceived: original.supplementary.depositsReceived,
                depositsReceivedPrior: original.supplementary.depositsReceivedPrior,
                transfersToTreasury: original.supplementary.transfersToTreasury,
                transfersToTreasuryPrior: original.supplementary.transfersToTreasuryPrior,
                revenueInKindTaxWaivers: original.supplementary.revenueInKindTaxWaivers,
                revenueInKindTaxWaiversPrior: original.supplementary.revenueInKindTaxWaiversPrior,
                ppeOpeningCurrent: original.supplementary.ppeOpeningCurrent,
                ppeAdditionsCurrent: original.supplementary.ppeAdditionsCurrent,
                ppeDisposalsCurrent: original.supplementary.ppeDisposalsCurrent,
                ppeOpeningPrior: original.supplementary.ppeOpeningPrior,
                ppeAdditionsPrior: original.supplementary.ppeAdditionsPrior,
                ppeDisposalsPrior: original.supplementary.ppeDisposalsPrior,
                depreciationRate: original.supplementary.depreciationRate,
                depreciationMethod: original.supplementary.depreciationMethod,
                employeeCount: original.supplementary.employeeCount,
                salariesWages: original.supplementary.salariesWages,
                pensionContributions: original.supplementary.pensionContributions,
                payrollTaxes: original.supplementary.payrollTaxes,
                otherEmployeeBenefits: original.supplementary.otherEmployeeBenefits,
                priorYearAdjustments: original.supplementary.priorYearAdjustments,
                revaluationReserves: original.supplementary.revaluationReserves,
                transfersToUCF: original.supplementary.transfersToUCF,
                accountingOfficer: original.supplementary.accountingOfficer,
                chiefFinanceOfficer: original.supplementary.chiefFinanceOfficer,
                internalAuditHead: original.supplementary.internalAuditHead,
                signatoryDate: original.supplementary.signatoryDate,
                ipsasBasis: original.supplementary.ipsasBasis,
                accountingPolicies: original.supplementary.accountingPolicies,
                exchangeRateUSD: original.supplementary.exchangeRateUSD,
                exchangeRateEUR: original.supplementary.exchangeRateEUR,
              },
            }
          : undefined,
      },
    });

    // Audit log on the original report
    await db.auditLog.create({
      data: {
        reportId: id,
        action: 'version_created',
        field: 'version',
        oldValue: String(original.version),
        newValue: String(newVersion.version),
        userId: body.userId || 'system',
      },
    });

    return NextResponse.json(newVersion);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await db.financialReport.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Find the root version (the one without a parentVersionId)
    const rootId = report.parentVersionId || report.id;

    const versions = await db.financialReport.findMany({
      where: {
        OR: [
          { id: rootId },
          { parentVersionId: rootId },
        ],
      },
      orderBy: { version: 'asc' },
      include: {
        _count: { select: { entries: true } },
      },
    });

    return NextResponse.json(versions);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
