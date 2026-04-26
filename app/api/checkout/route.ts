import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/core/logger";
import { ordersService } from "@/modules/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = logger("api.checkout");

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await ordersService.createCheckout(payload);
  if (!result.ok) {
    log.warn("checkout failed", {
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

  return NextResponse.json(result.value, { status: 200 });
}
