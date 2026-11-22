import { afterEach, describe, expect, it, vi } from "vitest";
import { signSession, verifySession } from "./session";

const payload = { userId: "user-1", email: "dev@example.com", role: "user" };
const originalNodeEnv = process.env.NODE_ENV;
const originalSecret = process.env.SESSION_SECRET;

afterEach(() => {
  vi.unstubAllEnvs();
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = originalSecret;
});

describe("session secret safety", () => {
  it("rejects missing secrets in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.SESSION_SECRET;
    await expect(signSession(payload)).rejects.toThrow(/SESSION_SECRET/);
  });

  it("rejects short secrets in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "short");
    await expect(signSession(payload)).rejects.toThrow(/at least 32 characters/);
  });

  it("signs and verifies sessions with a configured production secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "a-valid-production-secret-with-32-plus-characters");
    const token = await signSession(payload);
    expect(await verifySession(token)).toMatchObject(payload);
  });

  it("rejects tokens when the configured secret changes", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "first-production-secret-32-characters-long");
    const token = await signSession(payload);
    vi.stubEnv("SESSION_SECRET", "second-production-secret-32-characters-long");
    expect(await verifySession(token)).toBeNull();
  });
});
