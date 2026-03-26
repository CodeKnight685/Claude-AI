import { NextResponse } from "next/server";

export function middleware(request) {
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "ALLOWALL");
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://*.zoho.com https://*.zohocdn.com https://*.zoho.com.au"
  );
  return response;
}

export const config = {
  matcher: "/(.*)",
};
