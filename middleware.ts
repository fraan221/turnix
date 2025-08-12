import { auth } from "./auth";
import { NextResponse } from "next/server";
import { hasActiveSubscription } from "@/lib/subscription";

export default auth(async (req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;

  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isOnSubscribePage = nextUrl.pathname.startsWith("/subscribe");
  const isOnCompleteProfile = nextUrl.pathname.startsWith("/complete-profile");
  const isOnAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  if (isLoggedIn) {
    if (!session.user.role) {
      if (isOnCompleteProfile) return NextResponse.next();
      return NextResponse.redirect(new URL("/complete-profile", nextUrl));
    }

    if (isOnAuthRoute || isOnCompleteProfile) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    if (isOnDashboard && !isOnSubscribePage) {
      const hasAccess = hasActiveSubscription(session);
      if (!hasAccess) {
        return NextResponse.redirect(new URL("/subscribe", nextUrl));
      }
    }
  } else {
    if (isOnDashboard || isOnCompleteProfile || isOnSubscribePage) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
