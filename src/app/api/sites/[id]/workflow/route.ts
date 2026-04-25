import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, success, badRequest } from "@/lib/api-utils";
import { hasRole } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const steps = await prisma.approvalWorkflowStep.findMany({
    where: { siteId: params.id },
    orderBy: { stepOrder: "asc" },
  });

  return success(steps);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "SUPER_ADMIN")) return forbidden();

  const body = await request.json();
  const { steps } = body as { steps: { stepOrder: number; role: string }[] };

  if (!steps || !Array.isArray(steps)) {
    return badRequest("Steps array is required");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.approvalWorkflowStep.deleteMany({ where: { siteId: params.id } });

    const created = await Promise.all(
      steps.map((step) =>
        tx.approvalWorkflowStep.create({
          data: {
            siteId: params.id,
            stepOrder: step.stepOrder,
            role: step.role as any,
          },
        })
      )
    );

    return created;
  });

  return success(result);
}
