import { getSession, unauthorized, badRequest, success } from "@/lib/api-utils";
import { submitIndent } from "@/lib/workflow-engine";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const indent = await submitIndent(params.id, session.user.id);
    return success(indent);
  } catch (error: any) {
    return badRequest(error.message);
  }
}
