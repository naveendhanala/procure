import { getSession, unauthorized, forbidden, badRequest, success } from "@/lib/api-utils";
import { hasRole } from "@/lib/permissions";
import { assignIndentToPTM } from "@/lib/workflow-engine";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "HEAD_OF_PROCUREMENT")) return forbidden();

  const body = await request.json();
  const { assignedToId } = body;

  if (!assignedToId) return badRequest("Assignee is required");

  try {
    const indent = await assignIndentToPTM(
      params.id,
      assignedToId,
      session.user.id
    );
    return success(indent);
  } catch (error: any) {
    return badRequest(error.message);
  }
}
