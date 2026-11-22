import { SignJWT, jwtVerify } from "jose";

// Never sign production sessions with a public, predictable development key.
function getSessionSecret(): Uint8Array {
  const configured = process.env.SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && (!configured || configured.length < 32)) {
    throw new Error("SESSION_SECRET must contain at least 32 characters in production");
  }
  return new TextEncoder().encode(configured || "dev-only-secret-change-me");
}
const COOKIE_NAME = "tradeix_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return payload as unknown as SessionPayload;
  } catch {
    // Expired or tampered token — caller treats this exactly like "logged out",
    // never as an error state. Auth failures degrade to "please log in".
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
