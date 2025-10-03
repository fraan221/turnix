import { auth } from "./auth";
import { NextResponse } from "next/server";
import { hasActiveSubscription } from "@/lib/subscription";
import { Role } from "@prisma/client";

export default auth(async (req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;

  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isOnSubscribePage = nextUrl.pathname.startsWith("/subscribe");
  const isOnSubscriptionInactivePage = nextUrl.pathname.startsWith(
    "/subscription-inactive"
  );
  const isOnCompleteProfile = nextUrl.pathname.startsWith("/complete-profile");
  const isOnConnectPage = nextUrl.pathname.startsWith("/dashboard/connect");
  const isOnAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  if (isLoggedIn) {
    if (!session.user.role) {
      if (isOnCompleteProfile) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/complete-profile", nextUrl));
    }

    const isBarber = session.user.role === Role.BARBER;
    const isUnlinkedBarber = isBarber && !session.user.teamMembership;

    if (isUnlinkedBarber) {
      if (isOnConnectPage) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/dashboard/connect", nextUrl));
    }

    if (!isUnlinkedBarber && isOnConnectPage) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    if (isOnAuthRoute || isOnCompleteProfile) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    const hasAccess = hasActiveSubscription(session);
    if (!hasAccess) {
      if (!isOnSubscribePage && !isOnSubscriptionInactivePage) {
        if (session.user.role === Role.OWNER) {
          return NextResponse.redirect(new URL("/subscribe", nextUrl));
        }
        return NextResponse.redirect(
          new URL("/subscription-inactive", nextUrl)
        );
      }
    } else {
      if (isOnSubscribePage || isOnSubscriptionInactivePage) {
        const reason = nextUrl.searchParams.get("reason");
        if (reason === "trial" && isOnSubscribePage) {
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
    }
  } else {
    const protectedRoutes = [
      isOnDashboard,
      isOnCompleteProfile,
      isOnSubscribePage,
      isOnSubscriptionInactivePage,
    ];
    if (protectedRoutes.some(Boolean)) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/subscribe",
    "/complete-profile",
    "/subscription-inactive",
    "/login",
    "/register",
  ],
};
