# Correcciones Pendientes del Segundo Audit — Plan de Implementación

**Fecha**: 2026-07-20  
**Plan auditado**: `docs/superpowers/plans/2026-07-20-turnix-bot-ai-pro-implementation.md`  
**Audit original**: `docs/superpowers/audits/2026-07-20-turnix-bot-ai-pro-design-audit.md`

---

## ✅ Correcciones Aplicadas

### Críticos
- **C4**: `@kapso/whatsapp-cloud-api@latest` → version pinned a `^1.0.0`
- **C5**: `KAPSO_API_KEY!` con `console.warn` → ahora lanza error si no está configurado
- **C8**: `barbershopId` en payload → ahora usa `phone_number_id` para lookup
- **C19**: `v24.0` hardcoded → ahora usa `KAPSO_API_VERSION` env var

### Importantes
- **I6**: Duplicado de C4 → resuelto

---

## 🔴 Correcciones Críticas Pendientes (21 items)

### C1: verifyKapsoSignature + request.json() (Task 7 L1058 / Task 9 L1309)
**Problema**: Después de `request.clone().text()` en verify-signature, no se puede llamar `request.json()` porque el body ya fue consumido.  
**Fix**: En Task 9, parsear payload DESPUÉS de verificar firma. Ya corregido en la última edición.

### C6: API de ToolLoopAgent asumida (Task 10 L1604-1632)
**Problema**: El plan asume que `ToolLoopAgent` existe en Vercel AI SDK 7, pero la API real puede ser diferente.  
**Fix**: Antes de implementar Task 10, verificar la API real en `node_modules/ai/docs/agents/` o `https://ai-sdk.dev/docs/agents`. Ajustar el código según la API real.

### C7: 6 tools en pseudocódigo (Task 10 L1588-1598)
**Problema**: Task 10 Step 3 dice "Create remaining tools" pero solo muestra pseudocódigo.  
**Fix**: Implementar las 7 tools completas con código real:
- `lib/ai/tools/get-next-bookings.ts` ✅ (mostrado)
- `lib/ai/tools/get-service-catalog.ts` ❌ (falta código completo)
- `lib/ai/tools/get-shop-hours.ts` ❌
- `lib/ai/tools/get-barbers.ts` ❌
- `lib/ai/tools/confirm-booking.ts` ❌
- `lib/ai/tools/request-cancellation.ts` ❌
- `lib/ai/tools/get-public-booking-link.ts` ❌

### C10: ownerId/barberId ficticios en tests (Task 9 L1249 / Task 12 L1777)
**Problema**: Tests usan `"test-owner-id"` y `"test-barber-id"` que no existen en DB.  
**Fix**: Crear fixtures reales en tests:
```typescript
const owner = await prisma.user.create({ data: { name: "Test Owner", email: "test@example.com" } });
const barber = await prisma.user.create({ data: { name: "Test Barber", email: "barber@example.com" } });
// Luego usar owner.id y barber.id en los tests
```

### C11: 60 min hardcoded para duración de servicio (Task 13 L1971-1972)
**Problema**: `endTime.setMinutes(endTime.getMinutes() + 60)` asume 60 min, pero servicios tienen `durationInMinutes` variable.  
**Fix**: Usar `booking.service?.durationInMinutes || 60`:
```typescript
const duration = booking.service?.durationInMinutes || 60;
endTime.setMinutes(endTime.getMinutes() + duration);
```

### C12: 60 min hardcoded en baseline tracker (Task 14 L2077-2078)
**Problema**: Mismo issue que C11.  
**Fix**: Mismo fix que C11.

### C13: owner.phone! sin validar ni fallback push (Task 13 L2008)
**Problema**: `to: booking.barbershop.owner.phone!` asume que owner.phone existe, pero puede ser null.  
**Fix**: Validar y usar fallback:
```typescript
if (booking.barbershop.owner.phone) {
  // Enviar WhatsApp
  await sendReminder({ to: booking.barbershop.owner.phone, ... });
} else {
  // Fallback a push notification
  await sendPushNotification({
    userId: booking.barbershop.ownerId,
    title: "Ausencia detectada",
    body: `El cliente ${booking.client.name} no asistió a su turno.`,
  });
}
```

### C14: absentee condicionado a notifyUnknownClients (Task 13 L1998)
**Problema**: `if (booking.barbershop.notifyUnknownClients)` es incorrecto — `notifyUnknownClients` es para clientes desconocidos, no para ausencias.  
**Fix**: Eliminar el condicional. Siempre notificar al OWNER de ausencias:
```typescript
// Siempre enviar, sin condicional
await sendReminder({ to: ..., ... });
```

### C15: rate limit sin barbershopId (Task 11 L1690-1696)
**Problema**: `checkUnknownClientRateLimit(waId)` no filtra por barbershop, entonces un cliente desconocido en una barbería bloquea mensajes en otra.  
**Fix**: Añadir `barbershopId`:
```typescript
export async function checkUnknownClientRateLimit(
  waId: string,
  barbershopId: string
): Promise<boolean> {
  const count = await prisma.whatsAppMessageLog.count({
    where: {
      toPhone: waId,
      barbershopId, // Añadir este filtro
      direction: "inbound",
      createdAt: { gte: last24h },
    },
  });
  return count < 1;
}
```

### C16: cuenta todos los inbound, no solo unknown (Task 11 L1690-1696)
**Problema**: El rate limit cuenta TODOS los inbound, incluyendo clientes conocidos. Debería contar solo clientes desconocidos (sin `clientId`).  
**Fix**: Filtrar por `clientId IS NULL`:
```typescript
const count = await prisma.whatsAppMessageLog.count({
  where: {
    toPhone: waId,
    barbershopId,
    direction: "inbound",
    clientId: null, // Solo clientes desconocidos
    createdAt: { gte: last24h },
  },
});
```

### C17: ventana 10 min vs cron 5 min (Task 12 L1835-1839)
**Problema**: Ventana `[+24h, +24h10m]` es de 10 minutos, pero cron corre cada 5 minutos. Si un booking cae en el minuto 7, el cron del minuto 5 no lo ve, y el del minuto 10 ya pasó la ventana.  
**Fix**: Ajustar ventana a `[+24h, +24h5m]` para que coincida con la frecuencia del cron:
```typescript
const window24hEnd = new Date(window24hStart);
window24hEnd.setMinutes(window24hEnd.getMinutes() + 5); // 5 min, no 10
```

### C18: doble semántica de confirmationCutoffMinutes (Task 12 L1878)
**Problema**: `confirmationCutoffMinutes` se usa para dos cosas:
1. Skip reminder si cliente confirmó recientemente
2. Cutoff para confirmar turno (en `confirmBooking`)

Esto es confuso.  
**Fix**: Clarificar en el schema y código que es SOLO para (1). Para (2), usar una validación separada o un campo diferente si es necesario.

### C20: test barberId ficticio (Task 12 L1777)
**Problema**: Mismo issue que C10.  
**Fix**: Mismo fix que C10.

### C21: prisma.whatsAppMessageLog nombre no verificado (Task 6/9/11/16)
**Problema**: Prisma genera nombres camelCase desde el modelo. `WhatsAppMessageLog` → `whatsAppMessageLog` (con A mayúscula). Verificar que el nombre es correcto.  
**Fix**: Ejecutar `pnpm dlx prisma generate` y verificar en `node_modules/@prisma/client/index.d.ts` el nombre exacto del modelo.

### C22: ADMIN_SECRET no documentado en spec (Task 16/20)
**Problema**: `ADMIN_SECRET` se usa en Task 16 pero no está en el spec ni en la lista de env vars.  
**Fix**: Añadir al spec §7 y al plan Task 20B:
```bash
ADMIN_SECRET=<random_64_chars>  # Para autenticar /api/admin/* endpoints
```

### C23: X-Admin-Secret sin sesión NextAuth (Task 16 L2199-2200)
**Problema**: `/api/admin/ai-pro-metrics` usa `X-Admin-Secret` header, pero debería usar NextAuth session para verificar que el usuario es co-fundador.  
**Fix**: Implementar auth con NextAuth:
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== "cofoundador@turnix.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

### C24: conversión ARS/USD hardcoded 1000 (Task 16 L2254)
**Problema**: `const revenueUSD = revenue / 1000` es una conversión hardcoded e incorrecta.  
**Fix**: Eliminar conversión o usar API de exchange rate. Para v0.1, mantener todo en ARS:
```typescript
const revenue = barbershop.owner.subscription?.tier === "AI_PRO" ? 19900 : 0; // ARS
// No convertir a USD, mantener en ARS para consistencia
```

### C25: revenue constante $19.900 ignora billingPeriod (Task 16 L2253)
**Problema**: `revenue = 19900` asume monthly, pero si el cliente paga annual ($191.040), el revenue mensual es diferente.  
**Fix**: Calcular revenue mensual según billingPeriod:
```typescript
const subscription = barbershop.owner.subscription;
let revenue = 0;
if (subscription?.tier === "AI_PRO") {
  if (subscription.billingPeriod === "annual") {
    revenue = 191040 / 12; // $15.920/mes
  } else {
    revenue = 19900;
  }
}
```

---

## 🟧 Correcciones Importantes Pendientes (7 items)

### I1: UI sin código (Task 17-18)
**Problema**: Task 17 dice "Create WhatsApp dashboard page" pero no muestra código de los componentes.  
**Fix**: Añadir código completo para:
- `components/whatsapp/ConnectWhatsAppCard.tsx`
- `components/whatsapp/WhatsAppStatusBadge.tsx` (ya mostrado, verificar)
- `components/whatsapp/WhatsAppSettingsForm.tsx`
- `app/dashboard/whatsapp/page.tsx`

### I4: rate limit 20/min no implementado
**Problema**: El spec menciona "20 outbound/min por phone_number_id" pero no hay implementación.  
**Fix**: Añadir en `lib/kapso/send.ts`:
```typescript
// In-memory token bucket (aceptable para v0.1 en Vercel serverless)
const rateLimitBuckets = new Map<string, { tokens: number; lastRefill: number }>();

function checkRateLimit(phoneNumberId: string): boolean {
  const bucket = rateLimitBuckets.get(phoneNumberId) || { tokens: 20, lastRefill: Date.now() };
  
  // Refill tokens (1 token per 3 seconds = 20/min)
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(20, bucket.tokens + elapsed / 3000);
  bucket.lastRefill = now;
  
  if (bucket.tokens < 1) {
    return false; // Rate limited
  }
  
  bucket.tokens -= 1;
  rateLimitBuckets.set(phoneNumberId, bucket);
  return true;
}
```

### I5: sin test del 80% threshold (Task 6 L794-829)
**Problema**: Task 6 menciona "Al 80%: notification al OWNER" pero no hay test.  
**Fix**: Añadir test en `lib/kapso/send.test.ts`:
```typescript
it("notifies owner at 80% quota", async () => {
  vi.mocked(prisma.whatsAppMessageLog.count).mockResolvedValue(800);
  
  await sendReminder({ ... });
  
  expect(prisma.notification.create).toHaveBeenCalledWith({
    data: {
      userId: expect.any(String),
      message: "Te quedan 200 mensajes este mes en tu plan AI PRO.",
    },
  });
});
```

### I7: self-review miente + 6 TODOs abiertos
**Problema**: Self-review dice "No 'TBD', 'TODO'" pero hay 6 TODOs en el plan.  
**Fix**: Resolver todos los TODOs o marcarlos explícitamente como "Resolver en implementation":
- Task 9 L1359: "TODO — Invoke ToolLoopAgent"
- Task 9B L1439: "TODO: Create templates via Kapso API"
- Task 10 L1648: "TODO: Verify exact ToolLoopAgent API"
- Task 16 L2197: "TODO: Add co-fundador auth check"
- Task 16 L2244: "TODO: Verify actual Meta UTILITY tariff"

### I8: user.barbershop.id sin check de ownedBarbershop (Task 17 L2329)
**Problema**: `where: { id: user.barbershop.id }` asume que `user.barbershop` existe, pero puede ser null si el usuario no es OWNER.  
**Fix**: Validar:
```typescript
if (!user.ownedBarbershop) {
  return { error: "Solo el dueño puede modificar estos settings." };
}

await prisma.barbershop.update({
  where: { id: user.ownedBarbershop.id },
  data: validated.data,
});
```

### I9: disconnectWhatsApp no limpia en Kapso (Task 17 L2341-2366)
**Problema**: `disconnectWhatsApp` solo limpia en Turnix DB, pero no desconecta el WABA en Kapso.  
**Fix**: Añadir cleanup en Kapso (si la API lo permite):
```typescript
// Opcional: desconectar en Kapso si la API lo soporta
// await kapsoClient.disconnectPhoneNumber(barbershop.whatsappPhoneNumberId!);
```

---

## 🟦 Observaciones Pendientes (2 items)

### O1: sin auto-disable del baseline a 30 días (Task 14 L2059)
**Problema**: Baseline tracker corre indefinidamente, no se auto-desactiva después de 30 días.  
**Fix**: Añadir lógica de auto-disable:
```typescript
// En absence-tracker/route.ts
const launchDate = new Date("2026-08-01"); // Fecha de lanzamiento AI PRO
const daysSinceLaunch = (Date.now() - launchDate.getTime()) / (1000 * 60 * 60 * 24);

if (daysSinceLaunch > 30) {
  return NextResponse.json({ disabled: true, reason: "Baseline period ended" }, { status: 200 });
}
```

### O2: createTemplate nunca se invoca en onboarding (Task 9B L1439)
**Problema**: Task 9B dice "TODO: Create templates via Kapso API" pero nunca se implementa.  
**Fix**: Añadir en Task 9B o crear Task 9C:
```typescript
// En lifecycle webhook, después de phone_number.created:
import { kapsoClient } from "@/lib/kapso/client";
import { TEMPLATE_DEFINITIONS } from "@/lib/kapso/templates";

for (const template of TEMPLATE_DEFINITIONS) {
  await kapsoClient.createTemplate(business_account_id, template);
}

// Luego transicionar a PENDING_APPROVAL
await prisma.barbershop.update({
  where: { id: barbershopId },
  data: { whatsappState: "PENDING_APPROVAL" },
});
```

---

## 📋 Checklist de Correcciones

### Críticos (21 items)
- [ ] C1: verifyKapsoSignature + request.json() ✅ (corregido)
- [ ] C4: @kapso/whatsapp-cloud-api@latest ✅ (corregido)
- [ ] C5: KAPSO_API_KEY! ✅ (corregido)
- [ ] C6: API de ToolLoopAgent asumida ❌ (verificar antes de Task 10)
- [ ] C7: 6 tools en pseudocódigo ❌ (implementar código completo)
- [ ] C8: barbershopId no viene en payload ✅ (corregido)
- [ ] C10: ownerId/barberId ficticios ❌ (crear fixtures)
- [ ] C11: 60 min hardcoded ❌ (usar service.durationInMinutes)
- [ ] C12: 60 min hardcoded (baseline) ❌ (usar service.durationInMinutes)
- [ ] C13: owner.phone! sin validar ❌ (añadir null check + fallback)
- [ ] C14: absentee condicionado a notifyUnknownClients ❌ (eliminar condicional)
- [ ] C15: rate limit sin barbershopId ❌ (añadir filtro)
- [ ] C16: cuenta todos los inbound ❌ (filtrar clientId IS NULL)
- [ ] C17: ventana 10 min vs cron 5 min ❌ (ajustar a 5 min)
- [ ] C18: doble semántica confirmationCutoffMinutes ❌ (clarificar)
- [ ] C19: v24.0 hardcoded ✅ (corregido)
- [ ] C20: test barberId ficticio ❌ (crear fixtures)
- [ ] C21: prisma.whatsAppMessageLog nombre ❌ (verificar con prisma generate)
- [ ] C22: ADMIN_SECRET no documentado ❌ (añadir a spec)
- [ ] C23: X-Admin-Secret sin NextAuth ❌ (usar session auth)
- [ ] C24: conversión ARS/USD hardcoded ❌ (eliminar o usar API)
- [ ] C25: revenue constante ignora billingPeriod ❌ (calcular según billingPeriod)

### Importantes (7 items)
- [ ] I1: UI sin código ❌ (añadir código completo)
- [ ] I4: rate limit 20/min no implementado ❌ (añadir token bucket)
- [ ] I5: sin test del 80% ❌ (añadir test)
- [ ] I6: duplicado de C4 ✅ (resuelto)
- [ ] I7: self-review miente + TODOs ❌ (resolver TODOs)
- [ ] I8: user.barbershop.id sin check ❌ (validar ownedBarbershop)
- [ ] I9: disconnectWhatsApp no limpia en Kapso ❌ (añadir cleanup)

### Observaciones (2 items)
- [ ] O1: sin auto-disable baseline ❌ (añadir lógica)
- [ ] O2: createTemplate nunca se invoca ❌ (implementar en onboarding)

---

## 🎯 Recomendación

**Total**: 30 correcciones pendientes (21 críticos + 7 importantes + 2 observaciones).

**Opción 1**: Aplicar todas las correcciones ahora (recomendado si querés un plan 100% completo antes de implementar).

**Opción 2**: Proceder con implementación y aplicar correcciones sobre la marcha (más rápido, pero riesgo de retrabajo).

**Opción 3**: Aplicar solo los 21 críticos ahora, dejar importantes y observaciones para implementación.

¿Cuál preferís?
