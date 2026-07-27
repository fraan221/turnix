# Blue Team Audit — Turnix Bot AI PRO Implementation Plan

**Fecha**: 2026-07-26
**Plan auditado**: `docs/superpowers/plans/2026-07-20-turnix-bot-ai-pro-implementation.md` (3289 líneas, 22 tasks)
**Spec de referencia**: `docs/superpowers/specs/2026-07-20-turnix-bot-ai-pro-design.md` v0.2
**Audits previos**:
- `docs/superpowers/audits/2026-07-20-turnix-bot-ai-pro-design-audit.md` (B1-B7, I1-I7, M1-M7, C1-C5)
- `docs/superpowers/audits/2026-07-20-turnix-bot-ai-pro-plan-audit.md` (C1-C25, I1-I9, O1-O3)
- `docs/superpowers/plans/2026-07-20-plan-corrections-status.md` (estado de correcciones)

**Auditor**: Blue Team (mindset defensivo: "¿qué puede salir mal en producción?")
**Veredicto global**: 🛑 **NO APTO PARA IMPLEMENTACIÓN SEGURA** hasta corregir 6 issues bloqueantes nuevos (BT1-BT6) detectados en revisión línea-por-línea, además de los 2 issues residuales confirmados (C1 clone end-to-end, C17 documentación 5min vs 10min).

---

## Resumen ejecutivo

- **El plan NO está listo para implementación segura.** Pese a declararse "ready" con solo 2 issues residuales (C1/C17), el análisis línea-por-línea encuentra **6 issues bloqueantes nuevos** (BT1-BT6) y **9 importantes** (BT7-BT15) que romperán producción o dejarán al OWNER sin rollback limpio.
- **La state machine de `WhatsAppBotState` está rota**: la transición `PENDING_APPROVAL → CONNECTED` nunca se implementa en el lifecycle webhook (Task 9B sólo loguea, no transiciona). Ninguna barbería llegará jamás a `CONNECTED`. Crons y bot inbound quedan muertos por diseño desde el día 1.
- **El kill-switch `TURNIX_BOT_ENABLED` no se chequea en el inbound handler**. El rollback plan prometido (spec §7 I3) no existe en runtime. Si el bot desbarrata en producción, no hay forma de apagarlo sin redeploy.
- **Las tools `confirmBooking` y `requestCancellation` no validan que el `clientId` que reciben coincida con el caller real del inbound**. El LLM puede pasar IDs arbitrarios, cancelar o confirmar turnos de otros clientes. Vector de seguridad (IDOR) + risk de hallucination.
- **El lifecycle webhook (Task 9B) repite el bug de Task 9 original (C8)**: asume `barbershopId` viene en el payload de Kapso, pero Kapso no conoce IDs internos de Turnix. El evento `phone_number.created` fallaría por eso, completando el ciclo del state machine roto.
- **Self-review del plan (líneas 3225-3261) es parcialmente dishonestó**: reclama "no TBD" pero quedan TODOs y "omitida por brevedad"; reclama "no hardcoded ARS/USD" pero el default `ARS_USD_RATE=0.001` es hardcoded; reclama "C19 fixed" pero el default `v24.0` sigue en client.ts L683; reclama "uses actual service.durationInMinutes" pero `|| 60` fallback persiste en Task 13/14.

---

## Tabla de issues

| ID | Severidad | Línea plan | Descripción | Fix propuesto (snippet) |
|----|-----------|------------|-------------|--------------------------|
| **BT1** | 🔴 | Task 9 L1383-1430 | `TURNIX_BOT_ENABLED` no se chequea en inbound handler. El rollback lever prometido (spec §7) no funciona. | `if (process.env.TURNIX_BOT_ENABLED === "false") return NextResponse.json({ disabled: true }, { status: 200 });` al inicio del handler, antes de invocar LLM. |
| **BT2** | 🔴 | Task 9B L1548-1556 | El lifecycle webhook usa `barbershopId` del payload (igual que C8 original). Kapso no conoce IDs internos. Onboarding completo falla. | Igual que fix C8: usar `phone_number_id` para lookup. Requiere campo `Barbershop.kapsoCustomerId` (gap de modelado a resolver). |
| **BT3** | 🔴 | Task 9B L1582-1593 | `whatsapp.template.status_update` sólo hace `console.log`. Nunca transiciona `PENDING_APPROVAL → CONNECTED`. La state machine queda colgada en PENDING_APPROVAL para siempre. | `const statuses = await Promise.all(TPL_NAMES.map(n => kapsoClient.getTemplateStatus(wabaId, n))); if (statuses.every(t => t?.status === "APPROVED")) { await prisma.barbershop.update({ where: { id }, data: { whatsappState: "CONNECTED", whatsappConnectedAt: now } }); }` |
| **BT4** | 🔴 | Task 10 L1837-1865, L1880-1914 | `confirmBooking`/`requestCancellation` toman `clientId`, `bookingId`, `barbershopId` como parámetros de la tool (LLM los inventa). No validan que el clientId coincida con el caller real del inbound. Vector de IDOR. | Closure con callerClientId: `export function createConfirmBookingTool(callerClientId: string, barbershopId: string) { return tool({ parameters: z.object({ bookingId: z.string() }), execute: async ({ bookingId }) => prisma.booking.findFirst({ where: { id: bookingId, clientId: callerClientId, barbershopId, status: "SCHEDULED" } }) }); }` |
| **BT5** | 🔴 | Task 9 L1381-1407 | No hay Zod validation del payload del webhook. `metaMessageId` undefined → null en DB → `@@unique([metaMessageId, direction])` permite múltiples nulls en Postgres → idempotency bypass en retries sin metaMessageId. | `const KapsoInboundSchema = z.object({ metaMessageId: z.string().min(1), from: z.string().min(1), body: z.string().optional(), phone_number_id: z.string().min(1) }); const payload = KapsoInboundSchema.parse(await request.json());` |
| **BT6** | 🔴 | Task 12 L2266-2311, Task 13 L2380-2436, Task 9 L1997-2011 | `kapsoFetch` lanza en 5xx. sendReminder/sendBotReply no tienen try/catch. Cron aborta al primer booking que falla. Bot inbound retried por Kapso → bucle de costos OpenAI sin valor al usuario. | Wrap de `sendReminder`/`sendBotReply` con try/catch que loggean en `WhatsAppMessageLog.error` y `continue`. Revertir `reminder24hSentAt` a null para que próxima corrida reintente. Circuit breaker simple en `kapsoFetch`: skip si últimas 5 llamadas fallaron en 1 min. |
| **BT7** | 🟠 | Task 13 L2397-2405, Task 14 L2525-2533 | `AbsenceEvent` no tiene `@@unique([bookingId])` ni check de prev insert. Crons concurrentes (Vercel duplica) insertan duplicados. Baseline contaminado, KPI de "reducir ausencias >20%" inválido. | Añadir en schema: `@@unique([bookingId])`. Insert con catch P2002 → skip. |
| **BT8** | 🟠 | Task 6 L872-890 | `rateLimitBuckets` Map<String, ...> sin TTL/LRU/eviction. Crece sin bound en lifespan del serverless instance. | Eviction periódica: limpiar entries con `lastRefill > 60_000` ms atrás. O usar `lru-cache` (~40 líneas). Documentar: best-effort en Vercel serverless; evaluar Redis Upstash para prod multi-barbería. |
| **BT9** | 🟠 | Task 9B L1596-1626 | Lifecycle handler no tiene idempotency check. `quality_block` retried → OWNER recibe 2x notification + 2x push por retry de Kapso. | Persistir `X-Idempotency-Key` header, o usar `barbershop.whatsappState` como idempotency guard: `if (barbershop.whatsappState === "BLOCKED") return 200;` antes de re-aplicar efectos. |
| **BT10** | 🟠 | Task 10 L1859-1865, L1900-1914 | Las tools modifican `Booking` y crean `Notification` pero ninguna llama `revalidatePath`/`revalidateTag`. OWNER con dashboard abierto no ve cambios (badge confirmation, notification count) hasta manual reload. | `import { revalidatePath } from "next/cache";` y `revalidatePath("/dashboard/bookings")` después de `booking.update`. Considerar `revalidateTag(\`barber-${slug}\`)` para public page data. |
| **BT11** | 🟠 | Self-review L3225-3261 | Dishonestidad: reclama "no TODO" pero hay TODOs en L1342, L1432, L2014, L2313, L2687; reclama "no hardcoded ARS/USD" pero default `0.001` es hardcoded; reclama "C19 fixed" pero default `v24.0` sigue en client.ts L683; reclama "uses actual service.durationInMinutes" pero `|| 60` fallback existe en Task 13/14. | Editar el self-review: marcar "✅ (con limitaciones)" donde aplique, documentar específicamente los TODOs residuales y los defaults hardcoded. |
| **BT12** | 🟠 | Task 13 L2382, Task 14 L2511 | `duration = booking.service?.durationInMinutes \|\| 60` ignores `Booking.durationAtBooking` (campo existente). Legacy bookings sin service → 60 min asumption → baseline de ausencias skeweado 15-30 min para servicios cortos. | `const duration = booking.service?.durationInMinutes ?? booking.durationAtBooking ?? 60;`. Usa `??` no `\|\|` para que 0 sea válido. Warn+skip si duration es null y no hay fallback correcto. |
| **BT13** | 🟠 | Task 10 L1972-1987 | System prompt (`buildSystemPrompt(barbershopName)`) sólo recibe el nombre. No inyecta `callerClientId`, `callerWaId`, ni `barbershopId`. LLM debe adivinar IDs. Tools no están ancladas al caller. | `buildSystemPrompt({ barbershopName, clientName?, callerClientId, barbershopId, waId })`. Pasar valores al cierre de cada tool. Tools no reciben `clientId`/`barbershopId` como parámetros del LLM. |
| **BT14** | 🟠 | Task 4 L589 | `@kapso/whatsapp-cloud-api@^1.0.0` — la versión 1.0.0 NO se verificó contra npm. Si el paquete no existe o su versión real es otra, el install falla. Mismo tipo de bug que I5/I6 sin corregir. | Step 1: `pnpm view @kapso/whatsapp-cloud-api version` y `pnpm view @kapso/whatsapp-cloud-api versions --json`. Si 1.0.0 no existe, ajustar a la real. Documentar el output de `pnpm view` en el plan. |
| **BT15** | 🟡 | Task 13 L2353-2442 | Absentee cron no tiene feature flag. No se puede desactivar sin que afecte reminder churn. | `if (process.env.TURNIX_ABSENTEE_ENABLED === "false") return 200;` al inicio. Análogo a Task 12. Añadir al spec §7. |
| **BT16** | 🟡 | Task 9 L1385-1417 | `findFirst` por barbershop ocurre ANTES del idempotency check. En cada retry duplicado, se hace lookup de barbershop (DB query) innecesariamente. Performance cost bajo pero real si Kapso retra. | Mover idempotency check ANTES del barbershop lookup (con `metaMessageId` global indexado). Alternativa: cache en memoria del runtime para `phone_number_id → barbershopId`. |
| **BT17** | 🟡 | Task 12 L2313-2314 | Logic para reminder 2h "omitida por brevity". Implementador debe reescribir desde cero. Inconsistente con el resto detallado del plan. | Replicar la lógica de 24h para 2h: `window2hStart.setHours(+2); reminder2hSentAt`. Self-review se vuelve honesto. |
| **BT18** | 🟡 | Task 16 L2709-2710 | `ARS_USD_RATE` default `0.001` es hardcoded. Si ARS devalúa (probable), margin % se distorsiona → falsas alarmas de <70% o falsa confianza de >70%. | Documentar: este cálculo es informativo, no financiero. Para prod, integrar API exchangerate.host gratuita o fallback a 30-day mov avg. Spec lo dejó como open question #6. |
| **BT19** | 🟡 | Task 14 L2485 | `new Date("2026-08-01")` parsea como UTC midnight. En ART (UTC-3), equivale a 2026-07-31 21:00. El check `daysSinceLaunch > 30` puede dispararse 3 horas temprano. | `new Date("2026-08-01T00:00:00-03:00")` para forzar ART midnight. O especificar `AI_PRO_LAUNCH_DATE` con offset ya aplicada. |
| **BT20** | 🟡 | Task 17 L2815-2835 | `disconnectWhatsApp` sólo actualiza Barbershop en DB. Kapso/Meta sigue teniendo el número vinculado al WABA. Re-onboarding falla con "número ya existe". OWNER queda atrapado sin reset real. | Llamar a `kapsoClient`/endpoint de unlink del número. Si Kapso no expone endpoint, documentar SOP manual: contactar Kapso support antes de re-onboarding. NO reclamar "WhatsApp desconectado" en UI hasta confirmar unlink real. |
| **BT21** | 🟡 | Task 9 L1391, Task 9B L1399 | `console.error("...phone_number_id:", phone_number_id)` loggea valor externo. Low-impact PII/enum-leak (Kapso phone_number_id es opaque ID). | Mascarar: `phone_number_id: ${phone_number_id?.slice(0,4)}...`. Aceptar tradeoff de debugging. |
| **BT22** | 🟡 | Task 9 L1425-1429, Task 11 L2070-2073 | Idempotency insert usa `toPhone: waId` (raw). Tasks 1 y 11 normalizan phones para Client lookup (B1) pero no para WhatsAppMessageLog. Si un mismo inbound llega en dos formatos, crea 2 rows. | `toPhone: normalizePhoneToE164(waId) ?? waId` en el insert. Garantiza joins con Client performant. |
| **BT23** | 🟡 | Task 5 L702-704, Task 9 L1417 | `kapsoFetch` lanza error con `response.text()` (posible PII de error message de Kapso) y no captura en catch. Vercel expone en logs. `throw error` en handler propaga con mensaje completo. | Capturar `error.response` y redactar antes de log. Devolver 500 con mensaje genérico "Internal server error" al caller (Kapso). |
| **BT24** | 🟡 | Task 9B L1559-1573 | Template creation on lifecycle retry: si Kapso retries `phone_number.created`, `createTemplate` se llama de nuevo. Lanza error de "template name ya existe". Estado queda en PENDING_SETUP.OWNER sin salida. | Idempotency: `if (barbershop.whatsappState === "PENDING_APPROVAL" \|\| barbershop.whatsappState === "CONNECTED") return 200;` antes de re-aplicar. O catch de "already exists" como no-op. |
| **BT25** | 🟡 | Self-review L3240, Task 1 L317-323 | Reclama "✅ Prisma model name note added to verify after prisma generate" — Task 1 L317-323 lo deja como nota al implementador. El plan mismo usa `whatsAppMessageLog` asumiendo nombre. Si Prisma genera `whatsappMessageLog`, todos los crons y handler rompen al implementar. | En Task 1 Step 9, ejecutar `prisma generate` y verificar el nombre REAL. Actualizar todas las referencias (`prisma.whatsAppMessageLog`) según el output. No es "verificar durante implementation" — es "fixear ahora". |

---

## Top 5 issues más críticos (análisis profundo)

### 1. BT3 — State Machine `PENDING_APPROVAL → CONNECTED` nunca transiciona

**Línea del plan**: Task 9B, líneas 1582-1593.

**Lo que el código hace**:
```typescript
if (event === "whatsapp.template.status_update") {
  const { template_name, status, barbershopId } = payload;
  if (status === "APPROVED") {
    console.log("Template approved:", template_name);  // <-- SOLO LOG
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
```

**Impacto en producción**: Cada barbería que complete el onboarding queda atrapada en `PENDING_APPROVAL` indefinidamente. Crons verifican `whatsappState === CONNECTED` (Task 12 L2255, Task 13 L2365) → nunca disparan. Bot inbound fallbacka (Task 9 L1420). Toda la funcionalidad de AI PRO queda inerte desde el día 1. OWNER paga $19.900/mes sin recibir nada.

**Por qué falla la fix**: El plan auditó B4 (separar PENDING_SETUP y PENDING_APPROVAL) pero no cerró el loop. Falta (a) `getTemplateStatus` para los 3 templates, (b) chequear que TODOS están APPROVED (no sólo uno), (c) ejecutar el `update` a CONNECTED.

**Fix completo**:
```typescript
if (event === "whatsapp.template.status_update") {
  const { phone_number_id } = payload;
  const barbershop = await prisma.barbershop.findFirst({
    where: { whatsappPhoneNumberId: phone_number_id }
  });
  if (!barbershop?.whatsappWabaId) return NextResponse.json({ success: true });

  const required = ["reminder_24h", "reminder_2h", "absentee_report"];
  const statuses = await Promise.all(
    required.map(name => kapsoClient.getTemplateStatus(barbershop.whatsappWabaId, name))
  );

  if (statuses.every(t => t?.status === "APPROVED")) {
    await prisma.barbershop.update({
      where: { id: barbershop.id },
      data: { whatsappState: "CONNECTED", whatsappConnectedAt: new Date() }
    });
  }
  return NextResponse.json({ success: true });
}
```

Adicionalmente, hace falta un cron de recovery que, para barbershops en `PENDING_APPROVAL > 48h`, reconstruya el estado consultando Kapso (en caso de que se haya perdido un webhook).

---

### 2. BT4 — AI agent tools no validan caller identity (IDOR)

**Líneas del plan**: Task 10, `confirm-booking.ts` (1837-1869) y `request-cancellation.ts` (1880-1914).

**El problema**: Las tools aceptan `clientId`, `bookingId`, `barbershopId` como **parámetros del LLM** (`parameters: z.object({ clientId: z.string(), ... })`). El LLM genera estos valores. No hay validación de que el `clientId` del parámetro coincida con el `client` encontrado en el inbound (Step 6 del handler, línea 1428).

**Escenario de ataque/bug**:
1. Cliente con phone +54 11 1111-1111 escribe al bot.
2. Handler encuentra su Client con id `client_A_id`.
3. Se invoca `agent.run` con `prompt: messageBody`. System prompt **no incluye `callerClientId`**.
4. LLM alucina: pasa `clientId: "client_B_id"` (otro cliente de la misma barbería, ID filtrado por Next.js devtools o listing previo).
5. `confirmBooking` ejecuta `findFirst where: { id: bookingId, clientId: "client_B_id", status: "SCHEDULED" }` → encuentra el turno de otro cliente.
6. `booking.update` muta `bookingId` de cliente B → confirma su turno. Cliente A "beneficiado", Cliente B sin saber que confirmó.

**Vector más grave con `requestCancellation`**: Un atacante podría testear IDs conocidos (cuid IDs son semi-secuenciales pero opacos) y generar `Notification` fake al OWNER de cualquier barbería donde sepa barbershopId.

**Fix completo**: Cerrar las tools con el callerId conocido en el handler:

```typescript
// lib/ai/tools/confirm-booking.ts
import { tool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";

export function createConfirmBookingTool(callerClientId: string, barbershopId: string) {
  return tool({
    description: "Confirm an upcoming booking for the current client",
    parameters: z.object({ bookingId: z.string() }),
    execute: async ({ bookingId }) => {
      // server-enforced: clientId y barbershopId no vienen del LLM
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          clientId: callerClientId,
          barbershopId,
          status: "SCHEDULED",
          startTime: { gt: new Date() },
        },
      });
      if (!booking) return { error: "Turno no encontrado o ya pasó" };
      await prisma.booking.update({
        where: { id: bookingId },
        data: { botConfirmedAt: new Date(), botConfirmationType: "CONFIRM" },
      });
      return { success: true, message: "Turno confirmado" };
    },
  });
}
```

```typescript
// app/api/wa/inbound/route.ts
const tools = client
  ? {
      getNextBookings: createGetNextBookingsTool(client.id, barbershop.id),
      confirmBooking: createConfirmBookingTool(client.id, barbershop.id),
      requestCancellation: createRequestCancellationTool(client.id, barbershop.id),
      getServiceCatalog,  // read-only, no callerId needed
      getShopHours,
      getBarbers,
      getPublicBookingLink: createGetPublicBookingLinkTool(barbershop.id),
    }
  : /* unknown client: only read-only tools */;
```

También el system prompt debe informar al LLM: "No recibí tu clientId; el sistema ya sabe quién sos. Pasá sólo `bookingId` a las tools." (ver BT13).

---

### 3. BT1 — `TURNIX_BOT_ENABLED` no existe en runtime

**Línea del plan**: Task 9 (`app/api/wa/inbound/route.ts`), todo el handler.

**Lo que el spec dice** (§7 Rollback #2, línea 534):
> env `TURNIX_BOT_ENABLED=false` → route handler retorna 200 pero no invoca LLM.

**Lo que el plan implementa**: nada. Spec v0.2 lista la env var (línea 524), Task 20 Step 1 la "documenta" (línea 2988), pero el handler no la lee. El `if (process.env.TURNIX_REMINDERS_ENABLED === "false")` SÍ existe en Task 12 (L2236-2238) y Task 14 (L2480-2482). Es una inconsistencia: el kill switch de reminders funciona, el del bot no.

**Impacto**: Si el bot empieza a decir tonterías (prompt injection, OpenAI outage, alucinación masiva), único remedio en el plan es `vercel --prod` con deploy de un stub de handler.OWNER no puede apagarlo por env var ni por dashboard.

**Fix mínimo**: En Task 9, al inicio del handler:

```typescript
export async function POST(request: NextRequest) {
  // Kill switch (spec §7 rollout). cheapest path to recovery.
  if (process.env.TURNIX_BOT_ENABLED === "false") {
    return NextResponse.json({ disabled: true }, { status: 200 });
  }

  // Verificación de firma, idempotency, etc. (resto del handler)
}
```

**Fix mejor**: añadir un kill switch per-barbershop `barbershop.botEnabled: Boolean @default(true)` para que el OWNER pueda apagar el bot desde `/dashboard/whatsapp` sin tocar env vars globales. Volver a la filosofía "sin tutoriales" del AGENTS.md — dashboard debe ofrecer el toggle.

---

### 4. BT6 — Sin retry/circuit breaker ante Kapso outage

**Líneas del plan**: Task 5 (kapsoFetch L700), Task 12 (cron loop L2266+), Task 9 (inbound L1997-2011), Task 13 (absentee L2411).

**El problema en runtime**:
1. Kapso (pasarela WhatsApp) tiene un incidente → `fetch` devuelve 500.
2. `kapsoFetch` lanza `Error("Kapso API error: 500 ...")`.
3. `sendReminder` en Task 12 propagación: no try/catch en el loop del cron (L2266-2311). El `for (const booking of bookings24h)` aborta en la primera iteración que llama `sendReminder` y falla.
4. Los demás bookings en esa ventana de 5 min no reciben reminder. La próxima corrida del cron → `updateMany where reminder24hSentAt: null` ya marcó algunos, los duplicados no impactan, pero los no-procesados no se retoman automáticamente si la ventana expira (record moments: el cron marca el timestamp ANTES de enviar).
5. Bot inbound (Task 9 Step invoke agent L1997): `sendBotReply` lanza. Error => 500 al caller Kapso. Kapso retries con backoff → misma falla → OpenAI bills sin valor al usuario. Bucle costoso.

**Fix mínimo**:

```typescript
// app/api/cron/whatsapp-reminders/route.ts
for (const booking of bookings24h) {
  const updated = await prisma.booking.updateMany({ ... });
  if (updated.count === 0) continue;
  // ... skip if confirmed ...
  try {
    await sendReminder({ ... });
  } catch (error) {
    console.error(`Reminder failed for booking ${booking.id}:`, error);
    // Revertir la marca para que próxima corrida reintente
    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminder24hSentAt: null },
    }).catch(() => {}); // best-effort rollback
    continue; // seguimos con los demás bookings
  }
}
```

Para inbound bot reply:

```typescript
try {
  await sendBotReply({ ... });
} catch (error) {
  if (isKapsoOutage(error)) {
    // No reintentar ahora (Kapso seguirá tirando 5xx). Responder 5xx a Kapso
    // para que retrase con backoff. Loggear y opcionalmente push al OWNER.
    return NextResponse.json({ error: "Downstream bottleneck" }, { status: 503 });
  }
  // Error de negocio: 200 para que Kapso NO retreintente.
  return NextResponse.json({ success: false }, { status: 200 });
}
```

**Circuit breaker simple en `lib/kapso/send.ts`**:

```typescript
let kapsoFailureCount = 0;
let kapsoOpenUntil = 0;

async function kapsoFetchWithCB<T>(path: string, options: RequestInit): Promise<T> {
  if (Date.now() < kapsoOpenUntil) {
    throw new Error("Kapso circuit open (recent failures)");
  }
  try {
    const result = await kapsoFetch<T>(path, options);
    kapsoFailureCount = 0;
    return result;
  } catch (e) {
    kapsoFailureCount++;
    if (kapsoFailureCount >= 5) {
      kapsoOpenUntil = Date.now() + 60_000; // 1 min
      kapsoFailureCount = 0;
      console.error("[Kapso] circuit breaker open for 60s");
    }
    throw e;
  }
}
```

---

### 5. BT2 + BT24 — Lifecycle webhook repite bug C8 y no es idempotente

**Líneas**: Task 9B L1548-1577 (phone_number.created) y L1596-1626 (quality_block).

**El primer sub-bug (BT2)**: El handler hace:
```typescript
const { phone_number_id, business_account_id, barbershopId } = payload;
await prisma.barbershop.update({
  where: { id: barbershopId },  // <-- Kapso NO envía barbershopId
  data: { whatsappState: "PENDING_SETUP", ... },
});
```

Pero Kapso sólo conoce `phone_number_id` y `waba_id` (que es `business_account_id`). El `where: { id: barbershopId }` con `barbershopId: undefined` Prisma lo rechaza con error P2009. La update falla y la barbería NO transiciona a `PENDING_SETUP`. Stay `DISCONNECTED`. **Onboarding completo falla en el primer paso del lifecycle**.

**Fix**: igual que Task 9 (fix C8 aplicado):

```typescript
const { phone_number_id, business_account_id } = payload;

// Lookup por phone_number_id (si es una re-notificación) o por kapsoCustomerId
const barbershop = await prisma.barbershop.findFirst({
  where: {
    OR: [
      { whatsappPhoneNumberId: phone_number_id },  // re-notificación
      { kapsoCustomerId: payload.kapso_customer_id },  // primer onboarding
    ]
  },
});
if (!barbershop) return NextResponse.json({ error: "No barbershop" }, { status: 404 });

await prisma.barbershop.update({
  where: { id: barbershop.id },
  data: { whatsappState: "PENDING_SETUP", whatsappPhoneNumberId: phone_number_id, whatsappWabaId: business_account_id },
});
```

Esto requiere añadir **campo `Barbershop.kapsoCustomerId`** al schema (gap de modelado). OWNER durante setup link recibe un `kapso_customer_id` que Turnix debe guardar. Si no existe este campo, onboarding se rompe: Turnix no puede correlacionar el evento con la barbería.

**El segundo sub-bug (BT24)**: Si Kapso retrías `phone_number.created` (redelivery, network blip), el handler se ejecuta de nuevo:
1. (con BT2 fix) `barbershop.update({ whatsappState: "PENDING_SETUP" })` — idempotent update, OK.
2. `kapsoClient.createTemplate(template)` × 3 — Meta ya tiene estos templates, responde 400 "name already exists". El catch en L1573 captura y deja state en PENDING_SETUP.OWNER awaita approvement de templates que ya existen pero Turnix no los cuenta como aprobados.

**Fix**: Idempotency via checkeo de estado:

```typescript
// Skip if ya estamos más avanzados en el flujo
if (barbershop.whatsappState === "PENDING_APPROVAL" || barbershop.whatsappState === "CONNECTED") {
  return NextResponse.json({ success: true, already: true });
}

try {
  for (const template of TEMPLATE_DEFINITIONS) {
    await createTemplateIdempotent(business_account_id, template);
  }
  await prisma.barbershop.update({
    where: { id: barbershop.id },
    data: { whatsappState: "PENDING_APPROVAL" },
  });
} catch (error) {
  console.error("Error creating templates:", error);
}

async function createTemplateIdempotent(wabaId: string, template) {
  try {
    return await kapsoClient.createTemplate(wabaId, template);
  } catch (e) {
    if (e.message.includes("already exist") || e.message.includes("\"code\":100")) return null;
    throw e;
  }
}
```

---

## Preguntas abiertas que necesitan decisión de producto

1. **¿Quién recibe absentee reports?** Plan envía al `owner.phone` personal desde WABA de la barbería.OWNER recibiendo N WhatsApp por día puede tener fatiga de notif. ¿Reporte agregado diario a las 17:00 hs sería mejor? ¿O push internos del dashboard sin WhatsApp? Impacto: UX al OWNER vs costos Meta.

2. **¿`isAiPro` durante trial de PRO?** Spec §2.4 dice AI PRO no tiene trial, pero `isAiPro` (Task 3 L527-546) no incluye `trialEndsAt > now`. ¿Un OWNER en trial de PRO que upgradeara a AI_PRO en trial de PRO podría probar AI_PRO sin pago? Re-verificar el flujo.

3. **¿Política de privacidad con OpenAI?** Cliente `messageBody` viaja a OpenAI como prompt text. Es PII del cliente. La spec v0.2 §6 dice "no se loggea inbound body" en DB pero **NO aclara que sí se envía a OpenAI**. ¿Es aceptable? ¿Legal política de Argentina para PII procesada en EEUU? ¿Falta disclosure al OWNER en Términos de servicio?

4. **`confirmBooking` y `reminderGraceMinutes` vs `confirmationCutoffMinutes`**. Audit C18 dice "confirmationCutoffMinutes sólo para skip reminder". Pero Spec M1 decía "añadir confirmationCutoffMinutes con default 60" específicamente para el corte de confirmación. Hay tensión: ¿se permite confirmar 10 segundos antes del turno? Si es sí, está mal. Si es no, falta un campo nuevo. Definir la regla de negocio.

5. **¿Dashboard de ausencias visible para OWNER?** Plan crea `AbsenceEvent` pero no expone UI para que OWNER los vea. Sólo llegan WhatsApp push.OWNER no puede ver histórico de ausencias, ni por barbero, ni por día. ¿Es esto parte de v0.1 o post-MVP?

6. **Auto-disable baseline tracker: ¿desde qué fecha?** Task 14 L2485 usa `AI_PRO_LAUNCH_DATE` env or "2026-08-01". Si el baseline trackea por 30 días antes del launch, debería apagarse el día del launch, no empezar a contar desde el launch. ¿Es pre-launch o launch? Ambiguo en spec §3 Flujo 6 y plan Task 14. Aclarar: "se apaga 30 días después de la primera barbería con AI_PRO activo" o "se apaga en la fecha X hardcodeada".

7. **¿Las tools del agent pueden correr concurrentemente?** `ToolLoopAgent` puede invocar tools en paralelo. Si el LLM decide llamar `confirmBooking` 2 veces en paralelo (alucinación), dos `booking.update` corren concurrentes → race en `botConfirmedAt`. Definir: `parallelToolCalls: false` (recomendado) o implementar lock vía `findAndUpdate`/`updateMany where botConfirmedAt: null`.

8. **¿Modelo de datos para `KapsoCustomerId`?** BT2 expone que Turnix no tiene forma de mapear `phone_number_id`/`waba_id` a una Barbershop durante el flow de `phone_number.created`. Necesitaríamos un campo `Barbershop.kapsoCustomerId` (mandado al `kapso setup --customer <owner>`). Sin esto, onboarding se rompe. **Decisión de schema requerida antes de Task 1.**

---

## Skills activadas durante esta auditoría

- `verification-before-completion` — no asumir, verificar línea por línea contra los 5 documentos (spec, 2 audits, plan, status doc).
- `systematic-debugging` — para reproducir problemas antes de proponer fixes, especialmente en state machine (dibujar el grafo y verificar que cada arista tiene código que la ejecuta).
- `prisma-client-api` — para validar uso de `prisma.updateMany`, `findFirst`, `aggregate`, unique constraints behavior con nulls.
- `nodejs-backend-patterns` — para detectar anti-patterns (no retry, no circuit breaker, swallow errors, sync llamadas a outage sin fallback).
- (`accessibility` no se invocó: Tasks 17-18 son placeholders sin código de UI real para auditar; reclamar accesibilidad sobre un "to be implemented" sería especular.)

---

## Recomendación final

**El plan NO está listo para implementación segura.** Antes de dispatchar una sesión de subagentes hay que:

1. **Bloqueantes**: aplicar fixes de BT1–BT6 en el plan (no en implementation). BT3 y BT2 son showstoppers absolutos (el feature jamás funciona).
2. **Honestizar el self-review** del plan: marcar los TODOs residuales y los defaults hardcoded como pendientes. No reclamar "ready for implementation" con issues estructurales sin resolver.
3. **Re-alinear spec con plan**: el spec v0.2 §2.4 I3 (rollback plan) y §7 (env vars) están desincronizados con el plan. Actualizar el spec para reflejar el modelo de `KapsoCustomerId`, el flag `TURNIX_ABSENTEE_ENABLED`, y la política real de envío de messageBody a OpenAI.
4. **Verificar versiones de paquete** (BT14) ANTES de Task 4. No `@^1.0.0` sin confirmar.
5. **Cierre de state machine completo**: dibujar el grafo, listar todas las transiciones del spec, asegurarse de que por cada arista hay una línea de código en el plan que la ejecuta (incluyendo recovery BLOCKED → CONNECTED existente en spec pero no en plan).

Tras esos fixes, ejecutar Red Team (attacker mindset) y Blue Team (este audit) iterativamente hasta que todos los 🔴 estén resueltos. Solo entonces, "ready for implementation" será honesto.

---

**Archivo creado por**: Blue Team defensive audit
**Para ser consumido por**: sesión creadora del plan, para iterar a `v0.3` del plan antes de dispatchar subagentes de implementación.
**NO modificar el plan ni el spec**: este audit es de solo reporte.
