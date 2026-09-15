import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";
const PUBLIC_PATHS = ["/login", "/register"];

type AuthResult = { authed: false } | { authed: true; role: "user" | "admin" };

async function checkAuth(request: NextRequest): Promise<AuthResult> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return { authed: false };

  const secret = process.env.AUTH_SECRET;
  if (!secret) return { authed: false };

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return { authed: true, role: payload.role as "user" | "admin" };
  } catch {
    return { authed: false };
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/api/auth");

  const auth = await checkAuth(request);

  if (!auth.authed && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (auth.authed && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/training";
    return NextResponse.redirect(url);
  }

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (auth.authed && auth.role !== "admin" && isAdminApi) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  if (auth.authed && auth.role !== "admin" && isAdminPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/training";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
