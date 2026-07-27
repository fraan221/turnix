# Auditoría del Plan de Implementación — Turnix Bot AI PRO

**Archivo auditado**: `docs/superpowers/plans/2026-07-20-turnix-bot-ai-pro-implementation.md`  
**Spec de referencia**: `docs/superpowers/specs/2026-07-20-turnix-bot-ai-pro-design.md` v0.2  
**Auditoría de design previa**: `docs/superpowers/audits/2026-07-20-turnix-bot-ai-pro-design-audit.md`  
**Fecha de auditoría**: 2026-07-20  
**Veredicto global**: 🛑 **NO APTO PARA IMPLEMENTACIÓN** hasta corregir los 23 issues críticos y añadir las 4 tareas faltantes detectadas.

---

## Resumen ejecutivo

El plan de implementación tiene una estructura sólida (TDD por task, commits granulares, idempotencia FIRST, atomic updates). Sin embargo, contiene **23 issues críticos** que provocarían que el código no compile, no ejecute correctamente, o sea inseguro si se implementa tal cual. También hay **9 issues importantes** y **3 observaciones de diseño** que degradan robustez o claridad operativa.

**Si solo tenés 5 minutos, leé los 7 issues críticos más graves**: C1, C6, C7, C11, C12, C19, C20.

---

## Issues Críticos (C1-C23)

> Deben corregirse **antes** de que cualquier subagente o sesión de implementación ejecute el plan.

---

### C1. `verifyKapsoSignature` consume el body de Next.js antes de `request.json()`

**Severidad**: 🟥 Crítico — no va a funcionar en runtime.
**Ubicación**: Task 9, líneas 1147 y 1152; función en Task 7, líneas 905-915.
**Audit de design**: vinculado a B7 (firma Kapso).

**Problema**: En Next.js 14/15, el `Request` body es un stream que se puede leer UNA sola vez. El plan llama `verifyKapsoSignature(request)` en la línea 1147, y dentro de esa función se hace `await request.text()` (línea 905). Luego, en la línea 1152, el handler intenta `await request.json()` sobre el mismo `request`, pero el body ya fue consumido. Esto produce un error de runtime.

**Código actual** (Task 9, líneas 1145-1155):

```typescript
export async function POST(request: NextRequest) {
  // Step 1: Verify signature
  const isValid = await verifyKapsoSignature(request);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = await request.json(); // ❌ request body ya fue consumido
```

**Código corregido**:

Refactorizar `verifyKapsoSignature` para recibir el body como string, y leer el body UNA sola vez en el handler:

```typescript
// lib/kapso/verify-signature.ts
export function verifyKapsoSignature(body: string, signature: string | null): boolean {
  // ...validación con crypto.timingSafeEqual...
}

// app/api/wa/inbound/route.ts
export async function POST(request: NextRequest) {
  const signature = request.headers.get("X-Kapso-Signature");
  const body = await request.text(); // ✅ leer una sola vez

  const isValid = verifyKapsoSignature(body, signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  // ... resto del handler
}
```

---

### C2. `verifyKapsoSignature` usa comparación directa de strings (`===`) en lugar de `crypto.timingSafeEqual`

**Severidad**: 🟥 Crítico — timing attack vulnerable.
**Ubicación**: Task 7, líneas 909-915.
**Audit de design**: vinculado a B7.

**Problema**: La comparación `signature === expectedSignature` permite ataques de timing. El proyecto ya tiene el patrón correcto en `lib/mercadopago/webhook-security.ts:58-72`.

**Código actual** (Task 7, línea 915):

```typescript
return signature === expectedSignature;
```

**Código corregido**:

```typescript
import crypto from "crypto";

function timingSafeEqualString(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

return timingSafeEqualString(signature, expectedSignature);
```

---

### C3. Task 7 implementa y commitea una verificación de firma con formato no validado

**Severidad**: 🟥 Crítico — la verificación puede ser incorrecta o insegura.
**Ubicación**: Task 7, líneas 885-932; commit message línea 931.

**Problema**: El plan propone commitear una función `verifyKapsoSignature` con un TODO que dice "Verify exact Kapso signature format (audit B7)". Esto es un anti-patrón: se acepta código de seguridad inseguro/planteado en producción. El commit message "(format TBD)" lo hace explícito.

**Fix**: No mergear Task 7 hasta no validar el formato exacto de la firma de Kapso (consultar docs oficiales o inspeccionar `node_modules/@kapso/whatsapp-cloud-api`). La implementación del handler debería quedar bloqueada hasta resolver el audit B7.

**Recomendación de orden**:
1. Task 4: instalar dependencias y leer el SDK de Kapso para confirmar el formato de firma.
2. Task 7: implementar `verify-signature.ts` con el formato real y timing-safe.

---

### C4. Task 4 instala `@kapso/whatsapp-cloud-api@latest` a pesar de la constraint "No latest"

**Severidad**: 🟥 Crítico — versionado impredecible.
**Ubicación**: Task 4, línea 467.

**Problema**: Las Global Constraints (línea 19) dicen "No `latest` in package.json". Sin embargo, el comando `pnpm add` en Task 4 usa `@kapso/whatsapp-cloud-api@latest`. Aunque el `package.json` final podría quedar resuelto, el comando en sí viola la propia regla y es difícil de reproducir.

**Código actual**:

```bash
pnpm add ai@^7.0.0 @ai-sdk/openai@^2.0.0 @kapso/whatsapp-cloud-api@latest
```

**Código corregido**:

```bash
pnpm view ai version
pnpm view @ai-sdk/openai version
pnpm view @kapso/whatsapp-cloud-api version
# luego reemplazar x.y.z con los valores reales
pnpm add ai@^x.y.z @ai-sdk/openai@^x.y.z @kapso/whatsapp-cloud-api@^x.y.z
```

---

### C5. `kapsoFetch` usa `KAPSO_API_KEY!` sin validar realmente

**Severidad**: 🟥 Crítico — runtime failure opaco.
**Ubicación**: Task 5, líneas 562-572.

**Problema**: El cliente verifica `!KAPSO_API_KEY` con un `console.warn` pero no frena. Luego en `kapsoFetch` usa `KAPSO_API_KEY!` con el operador `!`, lo que le miente al compilador. Si la variable es undefined, el header se envía como `X-API-Key: undefined`, generando un 401 sin contexto.

**Código actual**:

```typescript
if (!KAPSO_API_KEY) {
  console.warn("KAPSO_API_KEY not set — Kapso client will fail on send operations");
}

// ...
headers: {
  "X-API-Key": KAPSO_API_KEY!, // ❌
  ...
}
```

**Código corregido**:

```typescript
async function kapsoFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!KAPSO_API_KEY) {
    throw new Error("KAPSO_API_KEY is not configured");
  }

  const response = await fetch(`${KAPSO_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": KAPSO_API_KEY,
      ...options.headers,
    },
  });
  // ...
}
```

---

### C6. `ToolLoopAgent` API asumida sin validar

**Severidad**: 🟥 Crítico — la implementación del agente no va a compilar si la API no existe.
**Ubicación**: Task 10, líneas 1326, 1346.

**Problema**: El plan usa `new ToolLoopAgent({...})` y luego `agent.run({ prompt: ... })`. Esto **no es la API de Vercel AI SDK 7**. El agente se crea con `createToolLoopAgent` o similar, y la ejecución es `generate`, `stream`, o `run` con una estructura distinta. Si el plan se ejecuta sin validar, el Task 10 no compila.

**Fix**: Antes de Task 10, confirmar la API real del SDK instalado en `node_modules/ai`. Ejemplo de la API actual (sujeto a verificación):

```typescript
import { createToolLoopAgent } from "ai";
import { openai } from "@ai-sdk/openai";

const agent = createToolLoopAgent({
  model: openai("gpt-4o-mini"),
  system: buildSystemPrompt(...),
  tools: { ... },
  maxSteps: 5,
});

const result = await agent.generate(messageBody);
```

**Recomendación**: mover la verificación de API a Task 4 y no implementar Task 10 hasta tener el SDK instalado y la API confirmada.

---

### C7. Los 6 tools restantes del agente están en pseudocódigo

**Severidad**: 🟥 Crítico — el plan promete 7 tools pero solo detalla 1.
**Ubicación**: Task 10, líneas 1302-1312.

**Problema**: El plan dice "Create similar files for the other 6 tools" sin incluir el código real. Esto no es un plan desglosado: es un TODO disfrazado. La otra sesión de implementación va a tener que inventar las firmas, parámetros y comportamiento de 6 tools, con riesgo de inconsistencia con el spec.

**Fix**: Detallar cada uno de los 7 tools con su firma completa, schema Zod, y lógica. Ejemplo para `confirmBooking`:

```typescript
import { tool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const confirmBooking = tool({
  description: "Confirm an upcoming booking when the client explicitly says yes",
  parameters: z.object({
    bookingId: z.string().describe("The booking ID to confirm"),
  }),
  execute: async ({ bookingId }) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { barbershop: true },
    });

    if (!booking || booking.status !== "SCHEDULED") {
      return { error: "No se encontró el turno o ya no está activo." };
    }

    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() + booking.barbershop.confirmationCutoffMinutes);
    if (booking.startTime < cutoff) {
      return { error: "El turno es muy pronto. Llamá a la barbería directamente." };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        botConfirmedAt: new Date(),
        botConfirmationType: "CONFIRM",
      },
    });

    return { success: "Turno confirmado. Te esperamos." };
  },
});
```

Repetir para `getNextBookings`, `getServiceCatalog`, `getShopHours`, `getBarbers`, `requestCancellation`, `getPublicBookingLink`.

---

### C8. Task 9 asume que el payload de Kapso incluye `barbershopId` interno

**Severidad**: 🟥 Crítico — no va a funcionar con el payload real de Kapso.
**Ubicación**: Task 9, líneas 1153, 1160, 1180.

**Problema**: Kapso envía el payload del webhook con `phone_number_id` (o `waba_id`), no con el `barbershopId` de Turnix. El plan asume que `barbershopId` viene en el JSON del webhook. Eso no es realista: Kapso no conoce el ID interno de la barbería.

**Código actual**:

```typescript
const { metaMessageId, from: waId, body: messageBody, barbershopId } = payload;

await prisma.whatsAppMessageLog.create({
  data: {
    barbershopId,
    // ...
  },
});

const barbershop = await prisma.barbershop.findUnique({
  where: { id: barbershopId },
});
```

**Código corregido**:

```typescript
const { metaMessageId, from: waId, body: messageBody, phone_number_id: phoneNumberId } = payload;

if (!phoneNumberId) {
  return NextResponse.json({ error: "Missing phone_number_id" }, { status: 400 });
}

const barbershop = await prisma.barbershop.findUnique({
  where: { whatsappPhoneNumberId: phoneNumberId },
  include: { owner: true },
});

if (!barbershop || barbershop.whatsappState !== "CONNECTED") {
  return NextResponse.json({ error: "Barbershop not connected" }, { status: 400 });
}

await prisma.whatsAppMessageLog.create({
  data: {
    barbershopId: barbershop.id,
    // ...
  },
});
```

**Nota**: esto también implica que el payload type en `lib/kapso/types.ts` debe incluir `phone_number_id`.

---

### C9. El test de idempotencia en Task 9 fallará porque la firma es inválida

**Severidad**: 🟥 Crítico — test que no prueba lo que dice probar.
**Ubicación**: Task 9, líneas 1108-1118.

**Problema**: El test simula un retry con `X-Kapso-Signature: "valid-signature"`, pero con la implementación de `verifyKapsoSignature` (HMAC sobre el body), esa firma no va a calzar. El test va a retornar 401 antes de llegar al path de idempotencia.

**Fix**: Generar una firma HMAC válida en el test, o mockear `verifyKapsoSignature` para la prueba de idempotencia.

**Código corregido** (mock):

```typescript
import { vi } from "vitest";
vi.mock("@/lib/kapso/verify-signature", () => ({
  verifyKapsoSignature: vi.fn(() => true),
}));
```

O generar firma real:

```typescript
import crypto from "crypto";

const body = JSON.stringify({ metaMessageId, from: "+541112345678", ... });
const signature = crypto.createHmac("sha256", process.env.KAPSO_WEBHOOK_SECRET!).update(body).digest("hex");
```

---

### C10. Task 9 crea un `Barbershop` con `ownerId` ficticio

**Severidad**: 🟥 Crítico — test va a fallar por FK constraint.
**Ubicación**: Task 9, líneas 1085-1092.

**Problema**: `ownerId: "test-owner-id"` no existe en la tabla `User`. El `create` de `Barbershop` fallará con `P2003` (FK constraint).

**Fix**: Crear un `User` real en el setup del test, o usar `prisma.user.create({ data: { id: "test-owner-id", name: "Owner", ... } })`.

---

### C11. Task 13 (absentee cron) asume duración de 60 min para calcular `endTime`

**Severidad**: 🟥 Crítico — falsos positivos/negativos de ausencia.
**Ubicación**: Task 13, líneas 1685-1692.

**Problema**: Turnix tiene `Booking.durationAtBooking` y `Service.durationInMinutes`. Asumir 60 minutos sesga el cálculo de ausencia. Un servicio de 30 min se marcará como ausente 30 min antes de tiempo; uno de 90 min se marcará tarde.

**Código actual**:

```typescript
const endTime = new Date(booking.startTime);
endTime.setMinutes(endTime.getMinutes() + 60); // ❌ hardcoded
```

**Código corregido**:

```typescript
const duration = booking.durationAtBooking ?? booking.service?.durationInMinutes ?? 60;
const endTime = new Date(booking.startTime);
endTime.setMinutes(endTime.getMinutes() + duration);
```

**Fix adicional**: si no hay duración, no reportar ausencia (o loggear con warning). No asumir.

---

### C12. Task 14 (baseline tracker) repite el mismo error de 60 min

**Severidad**: 🟥 Crítico — el baseline de ausencias está sesgado.
**Ubicación**: Task 14, líneas 1791-1797.

**Problema**: Igual que C11. El baseline de 30 días es la métrica de éxito ("reducir ausencias >20%"). Si el baseline está mal, la medición de impacto del producto está mal.

**Fix**: Aplicar el mismo código corregido de C11. Es crucial que la medición sea correcta.

---

### C13. Task 13 envía el absentee report al `owner.phone` personal en lugar de al WABA de la barbería

**Severidad**: 🟥 Crítico — el OWNER puede no recibir el reporte, o peor, puede enviarse desde el número de la barbería a un teléfono personal no configurado.
**Ubicación**: Task 13, líneas 1712-1727.

**Problema**: `booking.barbershop.owner.phone!` asume que el OWNER tiene `phone` en `User`. El campo es opcional (`String?`). Además, el flujo debería enviar el reporte desde el WABA de la barbería (número conectado) al OWNER. El `to` debería ser el `owner.phone` verificado, pero también debería validarse. Si no existe, fallback a `sendPushNotification`.

**Código actual**:

```typescript
await sendReminder({
  phoneNumberId: booking.barbershop.whatsappPhoneNumberId!,
  to: booking.barbershop.owner.phone!, // ❌ puede ser null
  ...
});
```

**Código corregido**:

```typescript
const ownerPhone = booking.barbershop.owner?.phone;

if (!ownerPhone || !ownerPhone.startsWith("+")) {
  // fallback a push notification (spec §3)
  await sendPushNotification(booking.barbershop.ownerId, {
    title: "Cliente no asistió",
    body: `El cliente ${booking.client.name} no asistió a su turno del ${date}.`,
  });
  return;
}

await sendReminder({
  phoneNumberId: booking.barbershop.whatsappPhoneNumberId!,
  to: ownerPhone,
  ...
});
```

---

### C14. Task 13 condiciona el absentee report a `notifyUnknownClients`

**Severidad**: 🟥 Crítico — confunde semántica y puede causar que el OWNER no reciba reportes de sus propios clientes.
**Ubicación**: Task 13, línea 1712.

**Problema**: `notifyUnknownClients` es el flag para notificar al OWNER sobre clientes desconocidos que dejan su nombre (spec §2.5). No tiene nada que ver con los absentee reports. El plan la usa para decidir si se envía el absentee report. Esto es un bug semántico.

**Fix**: No condicionar el absentee report a `notifyUnknownClients`. Debería enviarse siempre (a menos que haya un flag separado `notifyAbsenteeReports`). Si no existe ese flag, enviar siempre.

**Código corregido**:

```typescript
// El absentee report NO depende de notifyUnknownClients
if (!ownerPhone) {
  // fallback a push
  return;
}

await sendReminder({ ... });
```

---

### C15. Task 11 (unknown client rate limit) filtra por `toPhone` sin `barbershopId`

**Severidad**: 🟥 Crítico — rate limit global entre barberías.
**Ubicación**: Task 11, líneas 1400-1413.

**Problema**: El count se hace por `toPhone` sin restringir a la barbería. Un cliente que escribe a barbería A y a barbería B en 24h será rate-limitado en una de ellas.

**Código actual**:

```typescript
const count = await prisma.whatsAppMessageLog.count({
  where: {
    toPhone: waId,
    direction: "inbound",
    createdAt: { gte: last24h },
  },
});
```

**Código corregido**:

```typescript
const count = await prisma.whatsAppMessageLog.count({
  where: {
    barbershopId: barbershop.id,
    toPhone: waId,
    direction: "inbound",
    createdAt: { gte: last24h },
  },
});
```

---

### C16. Task 11 cuenta todos los inbound, no solo los de clientes desconocidos

**Severidad**: 🟥 Crítico — rate limit aplica a clientes conocidos.
**Ubicación**: Task 11, líneas 1404-1408.

**Problema**: Un cliente conocido que confirma 5 turnos en 24h contará 5 inbound, y luego será rate-limitado como "desconocido". Eso no tiene sentido.

**Fix**: El rate limit debe aplicar solo cuando el cliente NO existe. Si el cliente existe, no se aplica este rate limit.

**Código corregido** (en el handler):

```typescript
if (!client) {
  const allowed = await checkUnknownClientRateLimit(waId, barbershop.id);
  if (!allowed) {
    return NextResponse.json({ rateLimited: true }, { status: 200 });
  }
  // ... enviar saludo genérico
}
```

---

### C17. Task 12 ventana de 10 minutos para cron que corre cada 5 minutos

**Severidad**: 🟥 Crítico — riesgo de duplicación innecesaria (aunque el atomic updateMany lo mitiga, es confuso).
**Ubicación**: Task 12, líneas 1549-1553.

**Problema**: Si el cron corre cada 5 minutos, una ventana de 10 minutos implica que cada booking puede matchear en 2 ejecuciones consecutivas. El atomic updateMany lo frena, pero es ineficiente.

**Fix**: Usar ventana de 5 minutos alineada con el cron: `[+24h, +24h5m]` y `[+2h, +2h5m]`.

---

### C18. Task 12 usa `booking.botConfirmedAt` con `confirmationCutoffMinutes` para decidir si skip reminder

**Severidad**: 🟥 Crítico — confusión semántica del campo.
**Ubicación**: Task 12, líneas 1588-1595.

**Problema**: `confirmationCutoffMinutes` es el cutoff mínimo para que un cliente pueda confirmar un turno (spec §4). Aquí se usa como "ventana post-confirmación para no enviar recordatorio". Un campo no puede tener dos significados sin documentación clara.

**Fix**: Añadir un campo separado o documentar la doble semántica. Opción recomendada: añadir `skipReminderAfterConfirmationMinutes` default 60.

**Código corregido** (si se añade campo):

```typescript
const skipMinutes = booking.barbershop.skipReminderAfterConfirmationMinutes ?? 60;

if (
  booking.botConfirmedAt &&
  new Date(booking.botConfirmedAt).getTime() > now.getTime() - skipMinutes * 60 * 1000
) {
  continue;
}
```

---

### C19. Task 5 hardcodea `v24.0` en la URL de send API de Kapso

**Severidad**: 🟥 Crítico — URL incorrecta probable.
**Ubicación**: Task 5, líneas 588, 607, 634, 647.

**Problema**: El cliente usa rutas tipo `/meta/whatsapp/v24.0/${phoneNumberId}/messages`. Si Kapso es un wrapper de la API de Meta, probablemente expone una URL propia sin versión, o con un path diferente. Hardcodear `v24.0` es asumir detalles de Meta que Kapso abstrae.

**Fix**: Validar contra la documentación de Kapso o el SDK. Si la URL de Kapso es distinta, corregirla.

---

### C20. Task 12 test no crea un `barberId` válido

**Severidad**: 🟥 Crítico — test falla por FK constraint.
**Ubicación**: Task 12, líneas 1488-1496.

**Problema**: `barberId: "test-barber-id"` no existe en `User`. Igual que C10.

**Fix**: Crear un `User` real para el barbero en el setup del test.

---

### C21. Task 6 y Task 9 usan `prisma.whatsAppMessageLog` sin verificar el nombre exacto

**Severidad**: 🟥 Crítico — Prisma puede generar un nombre diferente.
**Ubicación**: Task 6, líneas 750, 772; Task 9, línea 1157.

**Problema**: El plan asume que el cliente Prisma expone `prisma.whatsAppMessageLog` (camelCase). Depende de la convención de Prisma. El modelo se llama `WhatsAppMessageLog`; Prisma puede pluralizarlo a `whatsAppMessageLogs` o `whatsAppMessageLog`. Hay que verificar tras `prisma generate`.

**Fix**: Después de Task 1 (migration + generate), verificar el nombre exacto en el cliente generado. Ajustar el plan si es necesario.

---

### C22. Task 16 (admin metrics) usa `ADMIN_SECRET` no documentado en el spec

**Severidad**: 🟥 Crítico — env var no documentada.
**Ubicación**: Task 16, línea 1914; Task 20, líneas 2224-2237.

**Problema**: El spec v0.2 no lista `ADMIN_SECRET` en Variables de Entorno (líneas 514-527). El plan lo introduce sin actualizar el spec.

**Fix**: Añadir `ADMIN_SECRET` al spec v0.2 y al `.env.example`.

---

### C23. Task 16 (admin metrics) usa auth por header custom en lugar de sesión de NextAuth

**Severidad**: 🟥 Crítico — superficie de ataque amplia si el secret se filtra.
**Ubicación**: Task 16, líneas 1910-1916.

**Problema**: `X-Admin-Secret` contra un env var es un único punto de fallo. Si el secret se filtra, un atacante puede ver costos de todos los clientes. No hay revocación, no hay audit log de quién consultó.

**Fix**: Usar sesión de NextAuth y verificar que el usuario sea un co-fundador (por email o role).

**Código corregido**:

```typescript
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}

function isAdminEmail(email: string): boolean {
  const admins = process.env.ADMIN_EMAILS?.split(",") ?? [];
  return admins.includes(email);
}
```

---

### C24. Task 16 conversión ARS/USD hardcodeada a 1000

**Severidad**: 🟥 Crítico — métricas financieras incorrectas.
**Ubicación**: Task 16, línea 1968.

**Problema**: `const revenueUSD = revenue / 1000; // Rough conversion`. El tipo de cambio real fluctúa. El margen del 70% se mide con datos incorrectos.

**Fix**: Usar una API de tipo de cambio real o mostrar métricas en ARS sin conversión.

---

### C25. Task 16 margen calculado contra revenue constante de $19.900

**Severidad**: 🟥 Crítico — margin % incorrecto para suscriptores anuales.
**Ubicación**: Task 16, línea 1967.

**Problema**: `barbershop.owner.subscription?.tier === "AI_PRO" ? 19900 : 0`. No considera si el plan es anual ($191.040/año = $15.920/mes equivalente).

**Fix**: usar `billingPeriod` para calcular el revenue real del período.

**Código corregido**:

```typescript
const revenue = subscription?.tier === "AI_PRO"
  ? subscription.billingPeriod === "annual"
    ? 191040 / 12
    : 19900
  : 0;
```

---

## Issues Importantes (I1-I9)

> No bloquean la ejecución, pero deberían corregirse en el plan v0.3.

---

### I1. Tareas 17 y 18 de UI no están detalladas

**Ubicación**: Task 17 Step 3, Task 18 Step 1.
**Problema**: El plan dice "Create dashboard page with state machine UI" y muestra solo un fragmento de badge. No hay código de la página completa, ni del formulario de settings, ni de `ConnectWhatsAppCard`.
**Fix**: Incluir el código de la página y los componentes, o al menos un pseudocódigo detallado con props, handlers, y estados por defecto.

---

### I2. No hay task para actualizar `vercel.json` con los nuevos crons

**Ubicación**: No existe en el plan.
**Problema**: Implementar las routes `/api/cron/whatsapp-reminders`, `/api/cron/whatsapp-absentee`, `/api/cron/absence-tracker` sin añadirlas a `vercel.json` significa que **los crons no corren en producción**.
**Fix**: Añadir una tarea dedicada:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-subscriptions",
      "schedule": "0 5 * * *"
    },
    {
      "path": "/api/cron/cleanup-pending-bookings",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/generate-recurring-bookings",
      "schedule": "0 3 * * 0"
    },
    {
      "path": "/api/cron/whatsapp-reminders",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/whatsapp-absentee",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/absence-tracker",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

### I3. No hay endpoint para webhooks de eventos de sistema de Kapso

**Ubicación**: No existe en el plan.
**Problema**: El spec v0.2 define transiciones de estado basadas en webhooks de Kapso: `whatsapp.phone_number.created`, `whatsapp.template.status_update`, `whatsapp.phone_number.quality_block`, `whatsapp.messaging.product_policy_violation`. El plan solo implementa el inbound handler (`/api/wa/inbound`), no un endpoint para estos eventos de sistema.
**Fix**: Añadir `POST /api/wa/events` (o `webhooks/kapso`) que reciba eventos de Kapso y actualice el `whatsappState` de `Barbershop` según el spec.

---

### I4. No se implementa el rate limit por minuto (20 outbound/min)

**Ubicación**: No existe en el plan.
**Problema**: El spec §5 y audit I6 piden rate limit de 20 mensajes outbound/minuto por `phone_number_id`. El plan solo implementa `checkMonthlyQuota`.
**Fix**: Añadir un token bucket en `lib/kapso/send.ts` (in-memory, aceptado para v0.1 por Vercel serverless) y testearlo.

---

### I5. No hay test para el umbral del 80% de quota mensual

**Ubicación**: Task 6.
**Problema**: El spec §5 dice "Al 80%: notification al OWNER". El plan solo testea el 100% y el under-cap.
**Fix**: Añadir test y función `notifyAt80Percent` que genere una `Notification` cuando el count llega a 800.

---

### I6. Task 4 no valida versiones antes de instalar (la constraint lo dice pero el comando no refleja)

**Ubicación**: Task 4, líneas 454-467.
**Problema**: La Global Constraint dice "validate npm versions in Task 3.1 before installing". El plan muestra los comandos `pnpm view` pero el `pnpm add` usa `^7.0.0` y `^2.0.0` sin confirmar que existan. El audit I5 del design ya lo marcó.
**Fix**: Especificar que los `x.y.z` de `pnpm add` deben ser el resultado exacto de los `pnpm view`.

---

### I7. Self-review del plan miente sobre placeholders

**Ubicación**: Task 20, líneas 2264-2273.
**Problema**: Dice "✅ Placeholder scan: No 'TBD', 'TODO', or incomplete steps". Hay múltiples TODOs y placeholders: Task 7 (línea 913), Task 9 (línea 1197), Task 10 (línea 1302), Task 16 (línea 1911, 1958).
**Fix**: Actualizar el self-review para reflejar honestidad o cerrar todos los TODOs antes de marcarlo.

---

### I8. Task 17 Server Action `updateWhatsAppSettings` usa `user.barbershop.id` pero `getUserForSettings` no siempre devuelve `barbershop`

**Ubicación**: Task 17, líneas 2041-2045.
**Problema**: `getUserForSettings` puede retornar `null` si el usuario no está autenticado, o no tiene `ownedBarbershop` si es BARBER. El plan checkea `user.role !== "OWNER"` pero no `user.ownedBarbershop`.
**Fix**: 

```typescript
if (user.role !== "OWNER" || !user.ownedBarbershop) {
  return { error: "Solo el dueño puede modificar estos settings." };
}

await prisma.barbershop.update({
  where: { id: user.ownedBarbershop.id },
  data: validated.data,
});
```

---

### I9. Task 17 `disconnectWhatsApp` no limpia templates ni notifica a Kapso

**Ubicación**: Task 17, líneas 2055-2080.
**Problema**: Desconectar WhatsApp solo actualiza el estado en Turnix. No desconecta el WABA en Kapso/Meta. El OWNER puede reconectar sin saber que el número sigue vinculado a Kapso.
**Fix**: Llamar a Kapso API para desvincular el número, o al menos documentar que la desconexión es "lógica" (solo en Turnix).

---

## Observaciones de Diseño (O1-O3)

---

### O1. Baseline tracker no se desactiva automáticamente a los 30 días

**Ubicación**: Task 14, líneas 1773-1775.
**Problema**: El spec v0.2 dice "Se desactiva automáticamente después de 30 días (o manualmente via env)". El plan solo checkea el env var. No hay lógica de 30 días.
**Sugerencia**: Añadir lógica de auto-disable. Opción simple: almacenar `baselineTrackingStartedAt` en `Barbershop` y al crear el primer `AbsenceEvent`, si han pasado >30 días, no insertar más.

```typescript
if (barbershop.baselineTrackingStartedAt && daysSince(barbershop.baselineTrackingStartedAt) >= 30) {
  return NextResponse.json({ disabled: true, reason: "30-day baseline completed" }, { status: 200 });
}
```

---

### O2. No hay task que llame a `createTemplate` durante el onboarding

**Ubicación**: Task 17 (onboarding UI).
**Problema**: Task 5 implementa `createTemplate` pero ningún task lo invoca. El spec v0.2 dice que los templates se crean durante el onboarding y el state pasa a `PENDING_APPROVAL`.
**Sugerencia**: Añadir un step en `actions/whatsapp.actions.ts` o en el webhook handler que cree los 3 templates vía `kapsoClient.createTemplate` y actualice `whatsappState` a `PENDING_APPROVAL`.

---

### O3. No hay normalización de teléfonos existentes a E.164

**Ubicación**: Task 1 (migración).
**Problema**: El audit de design B1 pidió normalizar teléfonos al guardar. Los clientes existentes pueden tener teléfonos en formatos no-E.164. El plan solo añade el índice, no normaliza.
**Sugerencia**: Añadir una migración SQL o un script de data migration que normalice `Client.phone` y `User.phone` a E.164. Si no es posible, documentar el trade-off: "en v0.1, solo los clientes con teléfono ya en E.164 matchearán inbound".

---

## Recomendación final

**El plan de implementación v0.1 NO está listo para ser ejecutado por una sesión de agentes.** Requiere una iteración v0.2 que:

1. Corrija los **23 issues críticos** (especialmente C1, C2, C3, C6, C7, C8, C11, C12, C13, C14, C19, C23, C24, C25).
2. Añada las **4 tareas faltantes**:
   - Actualizar `vercel.json` con los 3 crons nuevos.
   - Implementar `POST /api/wa/events` para webhooks de sistema de Kapso.
   - Implementar rate limit 20/min en `lib/kapso/send.ts`.
   - Crear templates durante el onboarding.
3. Complete el código de los 6 tools restantes del agente.
4. Cierre todos los TODOs antes de declarar "self-review passed".
5. Defina claramente el formato de firma de Kapso (audit B7) antes de commitear código de verificación.

Solo después de eso, el plan v0.2 debería ser auditado por Blue Team y Red Team antes de ejecutar la implementación.

---

**Archivo creado por**: auditor general (sesión actual)  
**Para ser consumido por**: sesión creadora del spec/plan, para iterar a `v0.2` del plan.
