import { test as base, expect, type BrowserContext } from "@playwright/test";

type TestLoginScenario =
  | "incomplete-profile"
  | "owner"
  | "owner-with-team"
  | "barber-with-team";

type TestLoginResponse = {
  session: {
    name: string;
    value: string;
  };
  scenario: TestLoginScenario;
  user?: {
    id: string;
    name: string;
    email: string | null;
    role: "OWNER" | "BARBER" | null;
  };
  barbershop?: {
    id: string;
    name: string;
    slug: string;
  };
  ownerService?: {
    id: string;
    name: string;
  };
  teamMember?: {
    id: string;
    name: string;
    email: string | null;
    role: "BARBER";
    service: {
      id: string;
      name: string;
    };
  };
};

type SessionFixture = {
  context: BrowserContext;
  scenario: TestLoginScenario;
};

type TestFixtures = {
  loginAsScenario: (scenario: TestLoginScenario) => Promise<TestLoginResponse>;
};

async function applySessionCookie(
  context: BrowserContext,
  cookie: { name: string; value: string },
) {
  await context.addCookies([
    {
      name: cookie.name,
      value: cookie.value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

export const test = base.extend<TestFixtures>({
  loginAsScenario: async ({ request, context }, use) => {
    const login = async (scenario: TestLoginScenario) => {
      const response = await request.post("/api/test/login", {
        data: { scenario },
      });

      expect(response.ok()).toBeTruthy();

      const payload = (await response.json()) as TestLoginResponse;
      await applySessionCookie(context, payload.session);
      return payload;
    };

    await use(login);
  },
});

export { expect };
