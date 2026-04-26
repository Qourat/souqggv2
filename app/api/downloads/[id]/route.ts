import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/core/logger";
import { downloadsService } from "@/modules/downloads";
import { getSessionUser } from "@/shared/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = logger("api.downloads");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const result = await downloadsService.mintSignedUrl(id, user.id);
  if (!result.ok) {
    log.warn("mint failed", {
      code: result.error.code,
      downloadId: id,
      userId: user.id,
    });
    return NextResponse.json(
      { error: result.error.message, code: result.error.code },
      { status: result.error.status },
    );
  }

  return NextResponse.redirect(result.value.url, { status: 302 });
}
