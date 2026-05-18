import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");
  const isProtected =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/settings") ||
    req.nextUrl.pathname.startsWith("/history");

  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/history/:path*", "/login", "/register"],
};
