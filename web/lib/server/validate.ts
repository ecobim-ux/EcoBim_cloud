import "server-only";
import { NextResponse } from "next/server";
import { z, type ZodType } from "zod";

/** A required, trimmed string field with one friendly message for every way
    it can be missing — undefined, null, wrong type, or empty/whitespace —
    instead of zod's default "expected string, received undefined" for the
    undefined case and a separate custom message only for the empty case. */
export function requiredString(message: string, maxLength = 500) {
  return z.preprocess(
    (v) => (typeof v === "string" ? v : ""),
    z.string().trim().min(1, message).max(maxLength, `That's too long (max ${maxLength} characters).`),
  );
}

/** Parses and validates a request body against a zod schema, replacing the
    `(await req.json().catch(() => null)) as {...} | null` + manual .trim()
    pattern every route previously used — that pattern only ever checked
    "is this field present," never its type, format, or length, so malformed
    input reached Postgres before anything caught it. Returns a friendly
    400 with the first validation issue instead of a raw DB error. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<{ data: T } | { error: NextResponse }> {
  const raw = await req.json().catch(() => null);
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { error: NextResponse.json({ error: issue?.message || "That request wasn't formatted correctly." }, { status: 400 }) };
  }
  return { data: result.data };
}
