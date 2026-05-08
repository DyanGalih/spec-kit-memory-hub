import { createHash } from "crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function shortId(input: string): string {
  return sha256(input).slice(0, 16);
}
