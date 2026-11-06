import { createNeonAuth } from "@neon/auth/next/server";

let authInstance: ReturnType<typeof createNeonAuth> | undefined;

export function getAuth() {
  if (authInstance) return authInstance;

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl) throw new Error("Missing required config: NEON_AUTH_BASE_URL.");
  if (!secret || secret.length < 32) {
    throw new Error("Missing or invalid NEON_AUTH_COOKIE_SECRET. Set a stable secret of at least 32 characters in the app's runtime environment.");
  }

  authInstance = createNeonAuth({ baseUrl, cookies: { secret } });
  return authInstance;
}
  