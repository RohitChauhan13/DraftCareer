import { NextResponse, type NextRequest } from "next/server";

const RESUME_VIEWER_COOKIE = "draftcareer_viewer_id";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.toLowerCase().startsWith("/icon.svg%3f")) {
    const url = request.nextUrl.clone();
    url.pathname = "/icon.svg";
    url.search = "";
    return NextResponse.rewrite(url);
  }

  const response = NextResponse.next();
  if (pathname.startsWith("/share/") && !request.cookies.get(RESUME_VIEWER_COOKIE)?.value) {
    response.cookies.set(RESUME_VIEWER_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  return response;
}

export const config = {
  matcher: ["/:path*"]
};
