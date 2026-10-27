import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "jvmodas_admin_auth";
const ADMIN_TOKEN = process.env.ADMIN_SECRET || "jvmodas_fitness_secret_token_2026";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME);
  return session?.value === ADMIN_TOKEN;
}

export async function createAdminSession(req?: Request): Promise<void> {
  const cookieStore = await cookies();
  let isHttps = false;
  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https://") ? "https" : "http");
    isHttps = proto === "https";
  } else {
    isHttps = process.env.COOKIE_SECURE === "true" || (process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https://");
  }
  cookieStore.set(ADMIN_COOKIE_NAME, ADMIN_TOKEN, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
