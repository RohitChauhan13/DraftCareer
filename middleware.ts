import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.toLowerCase().startsWith("/icon.svg%3f")) {
    const url = request.nextUrl.clone();
    url.pathname = "/icon.svg";
    url.search = "";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
};
