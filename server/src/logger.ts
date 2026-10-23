const SENSITIVE_KEY = /^(secret|password|token|key|credential|database_url)$/i;

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "object" && !Array.isArray(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY.test(key)) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = sanitize(val);
      }
    }
    return out;
  }
  if (Array.isArray(value)) return value.map(sanitize);
  return value;
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        ...(meta ? { meta: sanitize(meta) } : {}),
        timestamp: new Date().toISOString(),
      }),
    );
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        ...(meta ? { meta: sanitize(meta) } : {}),
        timestamp: new Date().toISOString(),
      }),
    );
  },
};
