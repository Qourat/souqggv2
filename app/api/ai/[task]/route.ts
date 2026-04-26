import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/core/logger";
import { aiService } from "@/modules/ai/ai.service";
import { AGENT_IDS } from "@/modules/ai/agents";
import { requireAdmin } from "@/shared/auth/session";

import type { AiAgentId } from "@/modules/ai/ai.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = logger("api.ai");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ task: string }> },
) {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "Admin required" },
      { status: 401 },
    );
  }

  const { task } = await params;
  if (!AGENT_IDS.includes(task as AiAgentId)) {
    return NextResponse.json(
      { error: `Unknown agent: ${task}` },
      { status: 404 },
    );
  }

  let body: { input?: unknown; model?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await aiService.run(
    { agent: task as AiAgentId, input: body.input ?? {}, model: body.model },
    { id: user.id },
  );

  if (!result.ok) {
    log.warn("ai.run failed", {
      agent: task,
      code: result.error.code,
      message: result.error.message,
    });
    return NextResponse.json(
      {
        error: result.error.message,
        code: result.error.code,
        details: result.error.details ?? null,
      },
      { status: result.error.status },
    );
  }

  return NextResponse.json(result.value);
}
