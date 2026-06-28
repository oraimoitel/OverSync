import cors from "cors";
import type { RequestHandler } from "express";

export function parseCorsOrigins(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[]
): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes("*")) return true;
  return allowedOrigins.includes(origin);
}

export function createCorsMiddleware(
  allowedOrigins: string[]
): RequestHandler {
  return cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });
}
