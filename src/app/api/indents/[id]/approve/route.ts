import { getSession, unauthorized, badRequest, success } from "@/lib/api-utils";
import { processApproval } from "@/lib/workflow-engine";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await request.json();
  const { remarks } = body;

  try {
    const indent = await processApproval(
      params.id,
      session.user.id,
      "APPROVED",
      remarks
    );
    return success(indent);
  } catch (error: any) {
    return badRequest(error.message);
  }
}
