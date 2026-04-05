# E2E Test Strategy (Playwright)

This project uses two E2E suites:

- `@smoke`: Fast PR suite (target: under 10 minutes)
- `@critical`: Broader nightly coverage

## Run suites

```bash
# Full suite
npx playwright test

# PR suite
npx playwright test --grep @smoke

# Nightly critical suite
npx playwright test --grep @critical
```

## Current suite composition

### Smoke (`@smoke`)

- `tests/registration-flow.spec.ts`
- `tests/booking.spec.ts`
- `tests/smoke/dashboard-owner-services.spec.ts`
- `tests/smoke/dashboard-owner-schedule.spec.ts`
- `tests/smoke/dashboard-barber-services.spec.ts`

### Critical (`@critical`)

- `tests/registration-flow.spec.ts`
- `tests/booking.spec.ts`
- `tests/critical/owner-services-role-assignment.spec.ts`
- `tests/critical/owner-schedule-team-authorization.spec.ts`
- `tests/critical/barber-service-scope.spec.ts`

## Test data and auth helpers

Use `tests/fixtures/test-session.ts` and `/api/test/login` scenarios:

- `incomplete-profile`
- `owner`
- `owner-with-team`
- `barber-with-team`

These scenarios create isolated users/barbershops and return a valid session cookie.
