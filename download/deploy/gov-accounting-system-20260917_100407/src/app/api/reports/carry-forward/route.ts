import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// CARRY-FORWARD API — Creates a new financial period from an
// existing report, carrying forward all opening balances.
//
// Rules:
//   - Balance Sheet accounts (assets/liabilities/equity):
//     current balances become opening balances in new period
//   - Nominal accounts (revenue/expense):
//     current → prior year column, new current = 0
//   - Cashbook, Funds, Ledger, Votebook, Warrants, Assets,
//     Grants, Debt, Appropriation, Inventory all carry forward
//   - Journal entries, transactions, audit logs do NOT carry
//     forward (they are period-specific activity records)
// ═══════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceReportId, newPeriodEnd, newPeriodLabel, newFiscalYear } = body;

    if (!sourceReportId || !newPeriodEnd || !newPeriodLabel) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceReportId, newPeriodEnd, newPeriodLabel' },
        { status: 400 }
      );
    }

    // ── Fetch source report with all trial balance entries ──────
    const sourceReport = await db.financialReport.findUnique({
      where: { id: sourceReportId },
      include: { entries: true, supplementary: true },
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
        fiscalYear: newFiscalYear || '',
        parentVersionId: sourceReport.id,
      },
    });

    // ════════════════════════════════════════════════════════════
    // 1. TRIAL BALANCE ENTRIES
    // ════════════════════════════════════════════════════════════
    const tbEntries = sourceReport.entries.map((entry) => {
      const isBalanceSheet =
        entry.classification === 'asset' ||
        entry.classification === 'liability' ||
        entry.classification === 'equity';

      if (isBalanceSheet) {
        // Balance sheet: current balances carry forward as current
        // prior stays as prior (for comparative)
        return {
          reportId: newReport.id,
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          classification: entry.classification,
          category: entry.category,
          noteRef: entry.noteRef,
          debitCurrent: entry.debitCurrent,   // carried forward
          creditCurrent: entry.creditCurrent, // carried forward
          debitPrior: entry.debitCurrent,     // current becomes prior
          creditPrior: entry.creditCurrent,   // current becomes prior
          budgetInitial: entry.budgetInitial, // budget carries forward
          budgetAdjusted: entry.budgetAdjusted,
          sortOrder: entry.sortOrder,
        };
      } else {
        // Revenue/Expense (nominal): current → prior, new current = 0
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
          budgetInitial: entry.budgetInitial, // budget carries forward
          budgetAdjusted: entry.budgetAdjusted,
          sortOrder: entry.sortOrder,
        };
      }
    });

    await db.trialBalanceEntry.createMany({ data: tbEntries });

    // ════════════════════════════════════════════════════════════
    // 2. SUPPLEMENTARY DATA
    // ════════════════════════════════════════════════════════════
    if (sourceReport.supplementary) {
      const s = sourceReport.supplementary;
      await db.supplementaryData.create({
        data: {
          reportId: newReport.id,
          // PPE movements: current becomes prior
          ppeOpeningCurrent: s.ppeOpeningCurrent + s.ppeAdditionsCurrent - s.ppeDisposalsCurrent,
          ppeAdditionsCurrent: 0,
          ppeDisposalsCurrent: 0,
          ppeOpeningPrior: s.ppeOpeningCurrent,
          ppeAdditionsPrior: s.ppeAdditionsCurrent,
          ppeDisposalsPrior: s.ppeDisposalsCurrent,
          depreciationRate: s.depreciationRate,
          depreciationMethod: s.depreciationMethod,
          // Employee data carries forward
          employeeCount: s.employeeCount,
          salariesWages: 0, // fresh period
          pensionContributions: 0,
          payrollTaxes: 0,
          otherEmployeeBenefits: 0,
          // Advances/deposits: current → prior
          advancesRecovered: 0,
          advancesRecoveredPrior: s.advancesRecovered,
          depositsReceived: 0,
          depositsReceivedPrior: s.depositsReceived,
          transfersToTreasury: 0,
          transfersToTreasuryPrior: s.transfersToTreasury,
          revenueInKindTaxWaivers: 0,
          revenueInKindTaxWaiversPrior: s.revenueInKindTaxWaivers,
          // Adjustments reset
          priorYearAdjustments: 0,
          revaluationReserves: s.revaluationReserves, // carries forward
          transfersToUCF: 0,
          // Signatories carry forward
          accountingOfficer: s.accountingOfficer,
          chiefFinanceOfficer: s.chiefFinanceOfficer,
          internalAuditHead: s.internalAuditHead,
          signatoryDate: '',
          ipsasBasis: s.ipsasBasis,
          accountingPolicies: s.accountingPolicies,
          exchangeRateUSD: s.exchangeRateUSD,
          exchangeRateEUR: s.exchangeRateEUR,
        },
      });
    }

    // ════════════════════════════════════════════════════════════
    // 3. CASHBOOK OPENING BALANCES
    // ════════════════════════════════════════════════════════════
    const sourceOpeningBalances = await db.cashbookOpeningBalance.findMany({
      where: { reportId: sourceReportId },
    });

    for (const ob of sourceOpeningBalances) {
      // Closing balance = last cashbook entry balance, or opening if no entries
      const cashEntries = await db.cashbookEntry.findMany({
        where: { reportId: sourceReportId, bankAccount: ob.bankAccount },
        orderBy: { createdAt: 'desc' },
      });

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

    // ════════════════════════════════════════════════════════════
    // 4. FUNDS — opening balances carry forward
    // ════════════════════════════════════════════════════════════
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

    // ════════════════════════════════════════════════════════════
    // 5. VOTEBOOK — appropriations carry forward, expenditure = 0
    // ════════════════════════════════════════════════════════════
    const sourceVotebook = await db.votebookEntry.findMany({
      where: { reportId: sourceReportId },
    });

    for (const v of sourceVotebook) {
      await db.votebookEntry.create({
        data: {
          reportId: newReport.id,
          voteCode: v.voteCode,
          voteName: v.voteName,
          originalAppropriation: v.totalAppropriation, // new appropriation = previous total
          supplementaryAppropriation: 0,
          totalAppropriation: v.totalAppropriation,
          actualExpenditure: 0, // fresh period
          balance: v.totalAppropriation,
          commitDate: '',
          notes: `Carried forward from previous period. Previous expenditure: ${v.actualExpenditure}`,
        },
      });
    }

    // ════════════════════════════════════════════════════════════
    // 6. WARRANTS — active warrants carry forward
    // ════════════════════════════════════════════════════════════
    const sourceWarrants = await db.warrant.findMany({
      where: { reportId: sourceReportId, status: 'active' },
    });

    for (const w of sourceWarrants) {
      await db.warrant.create({
        data: {
          reportId: newReport.id,
          warrantNo: w.warrantNo,
          voteCode: w.voteCode,
          amount: w.balance, // remaining balance
          authority: w.authority,
          issueDate: w.issueDate,
          expiryDate: w.expiryDate,
          status: 'active',
          utilized: 0,
          balance: w.balance,
        },
      });
    }

    // ════════════════════════════════════════════════════════════
    // 7. LEDGER ACCOUNTS — closing balances become opening
    // ════════════════════════════════════════════════════════════
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

    // ════════════════════════════════════════════════════════════
    // 8. ASSET REGISTER — active assets carry forward
    // ════════════════════════════════════════════════════════════
    const sourceAssets = await db.assetRegister.findMany({
      where: { reportId: sourceReportId, status: 'active' },
    });

    for (const a of sourceAssets) {
      await db.assetRegister.create({
        data: {
          reportId: newReport.id,
          assetNumber: a.assetNumber,
          description: a.description,
          category: a.category,
          location: a.location,
          dateAcquired: a.dateAcquired,
          acquisitionCost: a.acquisitionCost,
          accumulatedDep: a.accumulatedDep, // carried forward
          netBookValue: a.netBookValue,     // carried forward
          depreciationRate: a.depreciationRate,
          usefulLife: a.usefulLife,
          status: 'active',
        },
      });
    }

    // ════════════════════════════════════════════════════════════
    // 9. GRANTS — active grants carry forward
    // ════════════════════════════════════════════════════════════
    const sourceGrants = await db.grantEntry.findMany({
      where: { reportId: sourceReportId, status: 'active' },
    });

    for (const g of sourceGrants) {
      await db.grantEntry.create({
        data: {
          reportId: newReport.id,
          grantName: g.grantName,
          donor: g.donor,
          grantType: g.grantType,
          totalAmount: g.totalAmount,
          drawnDown: g.drawnDown,       // cumulative
          expended: g.expended,         // cumulative
          balance: g.balance,           // remaining
          conditions: g.conditions,
          startDate: g.startDate,
          endDate: g.endDate,
          status: 'active',
        },
      });
    }

    // ════════════════════════════════════════════════════════════
    // 10. DEBT — active loans carry forward
    // ════════════════════════════════════════════════════════════
    const sourceDebt = await db.debtEntry.findMany({
      where: { reportId: sourceReportId, status: 'active' },
    });

    for (const d of sourceDebt) {
      await db.debtEntry.create({
        data: {
          reportId: newReport.id,
          lender: d.lender,
          loanType: d.loanType,
          principalAmount: d.principalAmount,
          interestRate: d.interestRate,
          outstandingPrincipal: d.outstandingPrincipal,
          totalServiceCost: 0, // fresh period service cost
          repaymentsMade: 0,
          balance: d.balance,
          disbursementDate: d.disbursementDate,
          maturityDate: d.maturityDate,
          status: 'active',
        },
      });
    }

    // ════════════════════════════════════════════════════════════
    // 11. APPROPRIATION ACCOUNTS — carry forward with 0 expenditure
    // ════════════════════════════════════════════════════════════
    const sourceAppropriation = await db.appropriationAccount.findMany({
      where: { reportId: sourceReportId },
    });

    for (const ap of sourceAppropriation) {
      await db.appropriationAccount.create({
        data: {
          reportId: newReport.id,
          voteCode: ap.voteCode,
          voteName: ap.voteName,
          initialAppropriation: ap.revisedAppropriation, // last revised = new initial
          supplementaryAppropriation: 0,
          virementIn: 0,
          virementOut: 0,
          revisedAppropriation: ap.revisedAppropriation,
          actualExpenditure: 0,
          savingsOverSpent: ap.revisedAppropriation, // = revised - 0
          status: 'draft',
        },
      });
    }

    // ════════════════════════════════════════════════════════════
    // 12. INVENTORY — closing balances become opening
    // ════════════════════════════════════════════════════════════
    const sourceInventory = await db.inventoryItem.findMany({
      where: { reportId: sourceReportId },
    });

    for (const inv of sourceInventory) {
      await db.inventoryItem.create({
        data: {
          reportId: newReport.id,
          itemCode: inv.itemCode,
          itemDescription: inv.itemDescription,
          unitOfMeasure: inv.unitOfMeasure,
          unitCost: inv.unitCost,
          openingQty: inv.closingQty,
          openingValue: inv.closingValue,
          receivedQty: 0,
          receivedValue: 0,
          issuedQty: 0,
          issuedValue: 0,
          closingQty: inv.closingQty,
          closingValue: inv.closingValue,
        },
      });
    }

    // ════════════════════════════════════════════════════════════
    // 13. DEBTORS & CREDITORS — outstanding items carry forward
    // ════════════════════════════════════════════════════════════
    const sourceDebtors = await db.debtorAccount.findMany({
      where: { reportId: sourceReportId, status: { in: ['outstanding', 'overdue'] } },
    });

    for (const dr of sourceDebtors) {
      await db.debtorAccount.create({
        data: {
          reportId: newReport.id,
          name: dr.name,
          accountCode: dr.accountCode,
          invoiceNumber: dr.invoiceNumber,
          invoiceAmount: dr.balance, // outstanding balance
          amountPaid: 0,
          balance: dr.balance,
          invoiceDate: dr.invoiceDate,
          dueDate: dr.dueDate,
          agingDays: 0,
          status: 'outstanding',
        },
      });
    }

    const sourceCreditors = await db.creditorAccount.findMany({
      where: { reportId: sourceReportId, status: { in: ['outstanding', 'overdue'] } },
    });

    for (const cr of sourceCreditors) {
      await db.creditorAccount.create({
        data: {
          reportId: newReport.id,
          name: cr.name,
          accountCode: cr.accountCode,
          invoiceNumber: cr.invoiceNumber,
          invoiceAmount: cr.balance,
          amountPaid: 0,
          balance: cr.balance,
          invoiceDate: cr.invoiceDate,
          dueDate: cr.dueDate,
          agingDays: 0,
          status: 'outstanding',
        },
      });
    }

    // ════════════════════════════════════════════════════════════
    // 14. APPROVAL WORKFLOW — create fresh draft workflow
    // ════════════════════════════════════════════════════════════
    await db.approvalWorkflow.create({
      data: {
        reportId: newReport.id,
        currentStep: 'draft',
        preparerName: '',
        reviewerName: '',
        cfoName: '',
        comments: `Carried forward from period: ${sourceReport.periodLabel}`,
      },
    });

    // ════════════════════════════════════════════════════════════
    // 15. AUDIT LOG — log the carry-forward action
    // ════════════════════════════════════════════════════════════
    await db.auditLog.create({
      data: {
        reportId: newReport.id,
        action: 'carry_forward',
        field: 'report',
        oldValue: sourceReportId,
        newValue: newReport.id,
        userId: 'system',
      },
    });

    // ── Return the new report with entries ───────────────────────
    const result = await db.financialReport.findUnique({
      where: { id: newReport.id },
      include: {
        entries: { orderBy: { sortOrder: 'asc' } },
        supplementary: true,
        approvalWorkflow: true,
      },
    });

    // Count carried-forward records
    const counts = {
      trialBalance: tbEntries.length,
      funds: sourceFunds.length,
      votebook: sourceVotebook.length,
      warrants: sourceWarrants.length,
      ledgerAccounts: sourceLedgerAccounts.length,
      assets: sourceAssets.length,
      grants: sourceGrants.length,
      debt: sourceDebt.length,
      appropriation: sourceAppropriation.length,
      inventory: sourceInventory.length,
      debtors: sourceDebtors.length,
      creditors: sourceCreditors.length,
      cashbookOpeningBalances: sourceOpeningBalances.length,
    };

    return NextResponse.json({
      report: result,
      carryForwardSummary: counts,
      message: `Carried forward ${Object.values(counts).reduce((a, b) => a + b, 0)} records from period ${sourceReport.periodLabel} to ${newPeriodLabel}`,
    });
  } catch (error) {
    console.error('Carry-forward error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
