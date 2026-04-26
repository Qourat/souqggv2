/**
 * Tiny structured logger. JSON-line in production for log aggregators,
 * pretty in development. Replaceable with pino/winston when you need it.
 */

type Level = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV !== "production";

function emit(level: Level, scope: string, message: string, meta?: unknown) {
  const payload = {
    t: new Date().toISOString(),
    level,
    scope,
    message,
    ...(meta && typeof meta === "object" ? { meta } : {}),
  };
  if (isDev) {
    const tag = `[${scope}]`;
    const fn =
      level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`${level.toUpperCase()} ${tag} ${message}`, meta ?? "");
    return;
  }
  process.stdout.write(JSON.stringify(payload) + "\n");
}

export function logger(scope: string) {
  return {
    debug: (msg: string, meta?: unknown) => emit("debug", scope, msg, meta),
    info: (msg: string, meta?: unknown) => emit("info", scope, msg, meta),
    warn: (msg: string, meta?: unknown) => emit("warn", scope, msg, meta),
    error: (msg: string, meta?: unknown) => emit("error", scope, msg, meta),
  };
}
