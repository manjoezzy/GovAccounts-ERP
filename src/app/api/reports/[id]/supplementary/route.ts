import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await db.financialReport.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let supplementary = await db.supplementaryData.findUnique({
      where: { reportId: id },
    });

    if (!supplementary) {
      supplementary = await db.supplementaryData.create({
        data: { reportId: id },
      });
    }

    return NextResponse.json(supplementary);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const report = await db.financialReport.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let supplementary = await db.supplementaryData.findUnique({
      where: { reportId: id },
    });

    // Build audit log entries for changed fields
    const numericFields = [
      'advancesRecovered', 'advancesRecoveredPrior',
      'depositsReceived', 'depositsReceivedPrior',
      'transfersToTreasury', 'transfersToTreasuryPrior',
      'revenueInKindTaxWaivers', 'revenueInKindTaxWaiversPrior',
      'ppeOpeningCurrent', 'ppeAdditionsCurrent', 'ppeDisposalsCurrent',
      'ppeOpeningPrior', 'ppeAdditionsPrior', 'ppeDisposalsPrior',
      'depreciationRate',
      'employeeCount', 'salariesWages', 'pensionContributions',
      'payrollTaxes', 'otherEmployeeBenefits',
      'priorYearAdjustments', 'revaluationReserves', 'transfersToUCF',
      'exchangeRateUSD', 'exchangeRateEUR',
    ] as const;

    const stringFields = [
      'depreciationMethod', 'accountingOfficer', 'chiefFinanceOfficer',
      'internalAuditHead', 'signatoryDate', 'ipsasBasis', 'accountingPolicies',
    ] as const;

    const auditEntries: { action: string; field: string; oldValue: string; newValue: string; userId: string }[] = [];

    for (const field of numericFields) {
      if (body[field] !== undefined) {
        const oldVal = supplementary ? String(supplementary[field]) : '0';
        const newVal = String(body[field]);
        if (oldVal !== newVal) {
          auditEntries.push({
            action: 'update_supplementary',
            field,
            oldValue: oldVal,
            newValue: newVal,
            userId: body.userId || 'system',
          });
        }
      }
    }

    for (const field of stringFields) {
      if (body[field] !== undefined) {
        const oldVal = supplementary ? String(supplementary[field]) : '';
        const newVal = String(body[field]);
        if (oldVal !== newVal) {
          auditEntries.push({
            action: 'update_supplementary',
            field,
            oldValue: oldVal,
            newValue: newVal,
            userId: body.userId || 'system',
          });
        }
      }
    }

    // Update or create supplementary data
    const updateData: Record<string, unknown> = {};
    for (const field of numericFields) {
      if (body[field] !== undefined) updateData[field] = Number(body[field]);
    }
    for (const field of stringFields) {
      if (body[field] !== undefined) updateData[field] = String(body[field]);
    }

    if (supplementary) {
      supplementary = await db.supplementaryData.update({
        where: { reportId: id },
        data: updateData,
      });
    } else {
      supplementary = await db.supplementaryData.create({
        data: { reportId: id, ...updateData } as Record<string, never>,
      });
    }

    // Create audit log entries
    if (auditEntries.length > 0) {
      await db.auditLog.createMany({
        data: auditEntries.map((entry) => ({
          reportId: id,
          ...entry,
        })),
      });
    }

    return NextResponse.json({ supplementary, auditEntriesCount: auditEntries.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
