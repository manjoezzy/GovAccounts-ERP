import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const STEP_ORDER = [
  'draft',
  'preparer_review',
  'management_review',
  'cfo_approval',
  'final',
] as const;

type ApprovalStep = (typeof STEP_ORDER)[number];

const STEP_STATUS_MAP: Record<ApprovalStep, string> = {
  draft: 'draft',
  preparer_review: 'in_review',
  management_review: 'in_review',
  cfo_approval: 'pending_approval',
  final: 'approved',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await db.financialReport.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let workflow = await db.approvalWorkflow.findUnique({
      where: { reportId: id },
    });

    if (!workflow) {
      workflow = await db.approvalWorkflow.create({
        data: { reportId: id },
      });
    }

    return NextResponse.json(workflow);
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

    let workflow = await db.approvalWorkflow.findUnique({
      where: { reportId: id },
    });

    if (!workflow) {
      workflow = await db.approvalWorkflow.create({
        data: { reportId: id },
      });
    }

    const currentIdx = STEP_ORDER.indexOf(workflow.currentStep as ApprovalStep);
    if (currentIdx === -1) {
      return NextResponse.json({ error: 'Invalid current step' }, { status: 400 });
    }

    if (currentIdx >= STEP_ORDER.length - 1) {
      return NextResponse.json({ error: 'Already at final step' }, { status: 400 });
    }

    const nextStep = STEP_ORDER[currentIdx + 1];
    const now = new Date();

    const updateData: Record<string, unknown> = {
      currentStep: nextStep,
      comments: body.comments ?? workflow.comments,
    };

    // Record who approved based on the step being advanced FROM
    const userId = body.userId || body.userName || 'system';

    if (workflow.currentStep === 'draft' && nextStep === 'preparer_review') {
      updateData.preparerName = userId;
      updateData.preparerApprovedAt = now;
    } else if (workflow.currentStep === 'preparer_review' && nextStep === 'management_review') {
      updateData.reviewerName = userId;
      updateData.reviewerApprovedAt = now;
    } else if (workflow.currentStep === 'management_review' && nextStep === 'cfo_approval') {
      updateData.cfoName = userId;
      updateData.cfoApprovedAt = now;
    }

    const updatedWorkflow = await db.approvalWorkflow.update({
      where: { reportId: id },
      data: updateData,
    });

    // Update report status to match
    await db.financialReport.update({
      where: { id },
      data: { status: STEP_STATUS_MAP[nextStep] },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        reportId: id,
        action: 'approval_step',
        field: 'currentStep',
        oldValue: workflow.currentStep,
        newValue: nextStep,
        userId,
      },
    });

    return NextResponse.json({
      workflow: updatedWorkflow,
      reportStatus: STEP_STATUS_MAP[nextStep],
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
