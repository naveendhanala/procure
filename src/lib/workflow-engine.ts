import { prisma } from "./prisma";
import { ApprovalAction, Role } from "@prisma/client";

export async function getWorkflowForSite(siteId: string) {
  return prisma.approvalWorkflowStep.findMany({
    where: { siteId },
    orderBy: { stepOrder: "asc" },
  });
}

export async function submitIndent(indentId: string, submitterId: string) {
  return prisma.$transaction(async (tx) => {
    const indent = await tx.materialIndent.findUnique({
      where: { id: indentId },
      include: { site: true },
    });

    if (!indent) throw new Error("Indent not found");
    if (indent.createdById !== submitterId) throw new Error("Only the creator can submit");
    if (indent.status !== "DRAFT") throw new Error("Only draft indents can be submitted");

    const workflow = await tx.approvalWorkflowStep.findMany({
      where: { siteId: indent.siteId },
      orderBy: { stepOrder: "asc" },
    });

    if (workflow.length === 0) {
      throw new Error("No approval workflow configured for this site");
    }

    return tx.materialIndent.update({
      where: { id: indentId },
      data: {
        status: "PENDING_APPROVAL",
        currentApprovalStep: 1,
      },
    });
  });
}

export async function processApproval(
  indentId: string,
  userId: string,
  action: ApprovalAction,
  remarks?: string
) {
  return prisma.$transaction(async (tx) => {
    const indent = await tx.materialIndent.findUnique({
      where: { id: indentId },
      include: {
        items: true,
        site: true,
      },
    });

    if (!indent) throw new Error("Indent not found");
    if (
      indent.status !== "PENDING_APPROVAL" &&
      indent.status !== "PARTIALLY_APPROVED"
    ) {
      throw new Error("Indent is not pending approval");
    }

    const workflow = await tx.approvalWorkflowStep.findMany({
      where: { siteId: indent.siteId },
      orderBy: { stepOrder: "asc" },
    });

    const currentStep = workflow.find(
      (s) => s.stepOrder === indent.currentApprovalStep
    );
    if (!currentStep) throw new Error("Invalid workflow step");

    const userAssignment = await tx.userSiteAssignment.findFirst({
      where: {
        userId,
        siteId: indent.siteId,
        role: currentStep.role,
      },
    });
    if (!userAssignment) {
      throw new Error("You are not authorized to approve at this step");
    }

    const inventorySnapshot: Record<string, number> = {};
    for (const item of indent.items) {
      const inv = await tx.inventory.findUnique({
        where: {
          siteId_materialId: {
            siteId: indent.siteId,
            materialId: item.materialId,
          },
        },
      });
      inventorySnapshot[item.materialId] = inv ? Number(inv.quantity) : 0;
    }

    await tx.indentApproval.create({
      data: {
        indentId,
        userId,
        stepOrder: indent.currentApprovalStep,
        role: currentStep.role,
        action,
        remarks,
        inventorySnapshot,
      },
    });

    if (action === "REJECTED") {
      return tx.materialIndent.update({
        where: { id: indentId },
        data: { status: "REJECTED" },
      });
    }

    const isLastStep =
      indent.currentApprovalStep === workflow[workflow.length - 1].stepOrder;

    if (isLastStep) {
      return tx.materialIndent.update({
        where: { id: indentId },
        data: { status: "APPROVED" },
      });
    }

    const nextStep = workflow.find(
      (s) => s.stepOrder > indent.currentApprovalStep
    );

    return tx.materialIndent.update({
      where: { id: indentId },
      data: {
        status: "PARTIALLY_APPROVED",
        currentApprovalStep: nextStep!.stepOrder,
      },
    });
  });
}

export async function getCurrentApproverRole(
  indentId: string
): Promise<Role | null> {
  const indent = await prisma.materialIndent.findUnique({
    where: { id: indentId },
  });

  if (
    !indent ||
    (indent.status !== "PENDING_APPROVAL" &&
      indent.status !== "PARTIALLY_APPROVED")
  ) {
    return null;
  }

  const step = await prisma.approvalWorkflowStep.findFirst({
    where: {
      siteId: indent.siteId,
      stepOrder: indent.currentApprovalStep,
    },
  });

  return step?.role || null;
}

export async function canUserApprove(
  userId: string,
  indentId: string
): Promise<boolean> {
  const indent = await prisma.materialIndent.findUnique({
    where: { id: indentId },
  });

  if (
    !indent ||
    (indent.status !== "PENDING_APPROVAL" &&
      indent.status !== "PARTIALLY_APPROVED")
  ) {
    return false;
  }

  const step = await prisma.approvalWorkflowStep.findFirst({
    where: {
      siteId: indent.siteId,
      stepOrder: indent.currentApprovalStep,
    },
  });

  if (!step) return false;

  const assignment = await prisma.userSiteAssignment.findFirst({
    where: {
      userId,
      siteId: indent.siteId,
      role: step.role,
    },
  });

  return !!assignment;
}

export async function assignIndentToPTM(
  indentId: string,
  assignedToId: string,
  assignedById: string
) {
  return prisma.$transaction(async (tx) => {
    const indent = await tx.materialIndent.findUnique({
      where: { id: indentId },
    });

    if (!indent) throw new Error("Indent not found");
    if (indent.status !== "APPROVED") {
      throw new Error("Only approved indents can be assigned");
    }

    const ptmAssignment = await tx.userSiteAssignment.findFirst({
      where: {
        userId: assignedToId,
        role: "PROCUREMENT_TEAM_MEMBER",
      },
    });
    if (!ptmAssignment) {
      throw new Error("Assigned user is not a Procurement Team Member");
    }

    return tx.materialIndent.update({
      where: { id: indentId },
      data: {
        status: "ASSIGNED",
        assignedToId,
        assignedById,
        assignedAt: new Date(),
      },
    });
  });
}
