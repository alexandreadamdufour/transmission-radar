import crypto from "crypto";

type Purpose = "confirm" | "unsubscribe";

function sign(payload: string): string {
  const secret = process.env.ALERTS_TOKEN_SECRET;
  if (!secret) throw new Error("ALERTS_TOKEN_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAlertToken(subscriptionId: string, purpose: Purpose): string {
  const payload = `${subscriptionId}.${purpose}`;
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  return `${payloadB64}.${sign(payload)}`;
}

export function verifyAlertToken(token: string, purpose: Purpose): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const [id, p] = payload.split(".");
  if (p !== purpose || !id) return null;
  return id;
}
