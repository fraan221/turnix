# Turnix Bot AI PRO — Design Spec v0.2

**Fecha**: 2026-07-20
**Estado**: Aprobado con auditoría incorporada (audit findings B1-B7, I1-I7, M1-M7, C1-C5)
**Autor**: Co-fundador técnico Turnix
**Auditoría**: `docs/superpowers/audits/2026-07-20-turnix-bot-ai-pro-design-audit.md`

---

## 1. Contexto y Objetivo

Turnix es un SaaS B2B para barberías independientes en Argentina. Actualmente tiene un único plan PRO ($9.900 ARS/mes) sin features de IA.

**Objetivo v0.1**: Lanzar "Turnix Bot Anti-Ausentismo" — un agente conversacional de WhatsApp que reduce ausencias mediante recordatorios automáticos, confirmación por bot, Q&A cerrado sobre datos de la barbería, y reporte de ausencias al OWNER.

**Filosofía del producto**: "Turnix es un producto tan simple de utilizar que no se requieren tutoriales."

---

## 2. Decisiones Bloqueantes (Resueltas)

### 2.1 Arquitectura de Número WhatsApp
**Decisión**: WABA por barbería (marca blanca real).

**Razón**: Cada barbería conecta su propio WABA vía Kapso setup link (embedded signup de Meta). El cliente ve el nombre de la barbería, no "Turnix". Cumple el diferenciador "marca blanca no negociable" del AGENTS.md.

**Implicaciones**:
- Onboarding del OWNER incluye flow "Conectar WhatsApp" → `kapso setup --customer <owner>`.
- Costos Meta los absorbe el barbero vía plan AI PRO.
- `phone_number_id` y `waba_id` se guardan en `Barbershop`.

### 2.2 Proveedor de IA
**Decisión**: Arquitectura mixta — Vercel AI SDK 7 en Turnix backend + Kapso como pasarela.

**Razón**:
- Vercel AI SDK 7 ofrece `ToolLoopAgent` (patrón actual), MCP support, Skills upload, Telemetry nativa.
- El agente vive en código de Turnix (versionado en git, observable via DevTools).
- Kapso queda como pasarela: onboarding WABA, webhooks inbound, send API outbound.
- Prompt editable por desarrolladores (no por OWNER en v0.1).

**Flujo**:
1. Kapso recibe inbound WhatsApp → webhook firmado a Turnix.
2. Turnix route handler normaliza `wa_id` → E.164, busca `Client` por phone.
3. `ToolLoopAgent` (Vercel AI SDK 7) ejecuta con tools internas (getNextBookings, confirmBooking, etc.).
4. Reply se envía vía Kapso send API (dentro de ventana 24h, texto libre).

### 2.3 Scope del MVP
**Decisión**: Corte vertical "Turnix Bot Anti-Ausentismo".

**Incluye**:
- Recordatorios automáticos 24h y 2h antes del turno.
- Confirmación por bot (reply "confirmo" / "sí").
- Q&A cerrado: horarios, servicios, barberos, próximos turnos.
- Reporte de ausencia al OWNER (push + WhatsApp si tiene WABA conectado).
- Nuevo plan `AI_PRO` ($19.900/mes · $191.040/año).
- Baseline de ausencias (30 días pre-launch con tracking silencioso).
- Dashboard interno de costos AI PRO por barbershop.

**Excluye (post-MVP)**:
- Mensajes masivos con templates editables por OWNER.
- Alta/baja de turnos por bot.
- Reseñas post-turno.
- Multi-sucursal.
- Token metering en tiempo real (solo tracking de tokens en `WhatsAppMessageLog.tokensUsed`).
- Planes PRO MAX / AI PRO MAX.

### 2.4 Pricing
**Decisión**:
- **AI PRO**: $19.900/mes · $191.040/año ($15.920/mes equivalente, 20% descuento anual).
- **PRO actual**: sin suba (protege base activa de 10+ barberías).
- **Trial**: 14 días de trial aplican **exclusivamente al plan PRO**. AI PRO requiere suscripción activa desde el día 1 — sin período de prueba. Un OWNER en trial de PRO puede upgrade a AI PRO en cualquier momento, pero al hacerlo se cobra inmediatamente (prorateo del primer mes).

**Razón**: Duplicar el precio refleja costo Meta + LLM + valor del anti-ausentismo (cada ausencia evitada ya paga el plan). Subir el PRO actual generaría churn en la base activa. AI PRO sin trial porque Turnix no subvenciona costos de IA (Meta + LLM).

### 2.5 Identificación de Cliente
**Decisión**: Matching exacto phone E.164 → `Client`, fallback cliente desconocido con rate limiting.

**Flujo**:
1. Inbound WhatsApp llega con `wa_id` (formato E.164).
2. Turnix busca `Client` donde `phone === wa_id` (normalizado, indexado `@@index([barbershopId, phone])`).
3. Si matchea → contexto completo (próximos turnos, historial).
4. Si no matchea → cliente desconocido:
   - Bot responde con saludo + ofrece link público de reservas.
   - Si el cliente deja su nombre, se genera `Notification` al OWNER **solo si** `Barbershop.notifyUnknownClients === true` (default ON, OWNER puede desactivar en settings).
   - Rate limit: 1 mensaje cada 24h por `wa_id` desconocido (evita spam).
   - Mensaje claro al OWNER: "Este número no está en tu agenda: {name} +54 11 1234-5678".

---

## 3. Arquitectura End-to-End

```
┌────────────────────────────────────────────────────────────────┐
│                     Barbería (OWNER + BARBER)                   │
│                                                                 │
│  WABA propio (dedicated + provisioning via Kapso setup link)    │
│   ↓ phone_number_id                                             │
│  Kapso (pasarela)                                               │
│   ├─ inbound_message trigger → webhook → Turnix /api/wa/inbound │
│   └─ send API ← Turnix (cron + bot replies)                     │
└────────────────────────────────────────────────────────────────┘
                              ↕
┌────────────────────────────────────────────────────────────────┐
│                      Turnix backend (Next.js)                   │
│                                                                 │
│  /api/wa/inbound  (route handler, firma Kapso verificada)      │
│        ├─ [PRIMERO] Idempotency check (P2002 catch)            │
│        ├─ normalize wa_id → E.164                               │
│        ├─ Client.findByPhone()  → context                      │
│        └─ Vercel AI SDK 7 ToolLoopAgent                         │
│            tools: getNextBookings, getServiceCatalog,           │
│                   getShopHours, getBarbers, confirmBooking,     │
│                   requestCancellation, getPublicBookingLink     │
│                                                                 │
│  /api/cron/whatsapp-reminders (*/5 * * * *)                     │
│        ├─ Booking where start in [+24h, +24h10m] or [+2h, +2h10m]│
│        ├─ Atomic updateMany where reminderSentAt IS NULL        │
│        └─ Kapso send API (template aprobado "reminder_24h")     │
│           Gate: whatsappState === CONNECTED                     │
│                                                                 │
│  /api/cron/whatsapp-absentee (*/5 * * * *)                      │
│        ├─ Booking where status=SCHEDULED && endTime < now-grace │
│        ├─ Insert AbsenceEvent (baseline tracking)               │
│        └─ Kapso send API (template "absentee_report" al OWNER)  │
│           O fallback sendPushNotification existente             │
│           Gate: whatsappState === CONNECTED                     │
│                                                                 │
│  /api/cron/absence-tracker (pre-launch, 30 días)                │
│        └─ Solo INSERT AbsenceEvent sin enviar mensajes          │
│                                                                 │
│  /api/admin/ai-pro-metrics (dashboard interno)                  │
│        └─ Agrega WhatsAppMessageLog + tokensUsed por barbershop │
│                                                                 │
│  AI PRO feature gate (isAiPro(session))                         │
└────────────────────────────────────────────────────────────────┘
```

### State Machine de WhatsAppBotState

```
DISCONNECTED ──(OWNER inicia setup)──► PENDING_SETUP
                                            │
                                            │ (templates enviados a Meta)
                                            ▼
                                      PENDING_APPROVAL
                                            │
                                            │ (todos los templates APPROVED)
                                            ▼
                                       CONNECTED ◄──(recovery)──┐
                                            │                   │
                                            │ (quality block /  │
                                            │  policy violation)│
                                            ▼                   │
                                         BLOCKED ───────────────┘
                                            │
                                            │ (OWNER desconecta)
                                            ▼
                                       DISCONNECTED
```

**Transiciones**:
- `DISCONNECTED → PENDING_SETUP`: OWNER inicia flow "Conectar WhatsApp".
- `PENDING_SETUP → PENDING_APPROVAL`: Turnix envía los 3 templates a Meta (reminder_24h, reminder_2h, absentee_report).
- `PENDING_APPROVAL → CONNECTED`: Todos los templates tienen status `APPROVED` en Meta.
- `CONNECTED → BLOCKED`: Webhook Kapso `whatsapp.phone_number.quality_block` o `whatsapp.messaging.product_policy_violation`.
- `BLOCKED → DISCONNECTED`: OWNER desconecta manualmente o re-vincula vía nuevo setup link.
- Cualquier estado → `DISCONNECTED`: OWNER desconecta manualmente.

**Gating**:
- Crons (reminders, absentee) solo envían si `whatsappState === CONNECTED`.
- Bot inbound solo responde si `whatsappState === CONNECTED`.
- UI muestra mensajes explicativos:
  - `PENDING_SETUP`: "Estamos configurando tu WhatsApp. Esto puede tardar unos minutos."
  - `PENDING_APPROVAL`: "Tus plantillas están en revisión por Meta. Esto puede tardar 24-48 horas."
  - `BLOCKED`: "Tu número de WhatsApp fue bloqueado por Meta. Contactá a soporte para recuperar el acceso."

### Flujos Principales

**1. Onboarding WhatsApp del OWNER**:
- Dashboard → botón "Conectar WhatsApp" (gate `isAiPro(session)`).
- `kapso setup --customer <owner>` → embedded signup Meta → provisioning número dedicated.
- Webhook `whatsapp.phone_number.created` → Turnix guarda `phone_number_id` + `waba_id` en `Barbershop`, estado → `PENDING_SETUP`.
- Turnix envía los 3 templates a Meta → estado → `PENDING_APPROVAL`.
- Webhook Kapso `whatsapp.template.status_update` (todos `APPROVED`) → estado → `CONNECTED`.

**2. Reminder 24h** (cron `*/5 * * * *`):
- Busca bookings con `startTime` en ventana `[+24h, +24h10m]`, `status=SCHEDULED`, `reminder24hSentAt IS NULL`, barbershop con `whatsappState === CONNECTED` y `isAiPro(session)`.
- **Atomic updateMany**: `updateMany where { id: booking.id, reminder24hSentAt: null }` → marca `reminder24hSentAt = now`.
- Si `updated.count === 0` → skip (ya fue procesado por otro worker).
- Llama Kapso send API con template `reminder_24h` (categoría `UTILITY`, variables: nombre del cliente, barbero, servicio, fecha, hora).
- Skip si `botConfirmedAt` reciente (últimas `confirmationCutoffMinutes`, default 60min).

**3. Reminder 2h** (cron `*/5 * * * *`):
- Mismo flujo, template `reminder_2h`, ventana `[+2h, +2h10m]`.

**4. Inbound conversacional**:
- Kapso firmado → Turnix route.
- **[PRIMERO] Idempotency check**: intentar insert `WhatsAppMessageLog` con `metaMessageId` + `direction=inbound`. Si `P2002` (unique constraint violation) → return 200 inmediato (ya procesado).
- Normaliza phone → busca Client.
- Si cliente desconocido: rate limit check (1 mensaje cada 24h por `wa_id`). Si excede → return 200 sin procesar.
- ToolLoopAgent ejecuta con tools cerradas → reply por Kapso send dentro de ventana 24h (texto libre, sin template).

**5. Reporte de ausencia al OWNER** (cron `*/5 * * * *`):
- Busca bookings con `status === SCHEDULED` y `endTime < now - reminderGraceMinutes` (default 15min).
- Inserta `AbsenceEvent` (baseline tracking).
- Envía template `absentee_report` al OWNER (si `whatsappState === CONNECTED`) O fallback `sendPushNotification` existente.

**6. Baseline tracker** (cron pre-launch, 30 días):
- Solo INSERT `AbsenceEvent` sin enviar mensajes.
- Genera baseline de ausencias por barbershop antes de activar AI PRO.
- Se desactiva automáticamente después de 30 días (o manualmente via env `TURNIX_BASELINE_TRACKER_ENABLED=false`).

**7. Admin metrics dashboard**:
- `/api/admin/ai-pro-metrics` (auth: co-fundador Turnix, no barberos).
- Agrega `WhatsAppMessageLog` por barbershop: messages outbound, tokensUsed, costo estimado.
- Costo Meta = messages * tarifa UTILITY (a verificar en etapa 3).
- Costo LLM = tokensUsed * costo del provider.
- Revenue AI PRO = $19.900 (o prorrateado si trial).
- UI: tabla con barbershop, messages, tokens, estimated cost, revenue, margin %.

---

## 4. Modelo de Datos

### Migración: `add_whatsapp_ai_pro`

**Enums nuevos**:
```prisma
enum SubscriptionTier {
  PRO       // plan actual ($9.900/mes)
  AI_PRO    // nuevo plan ($19.900/mes)
}

enum WhatsAppBotState {
  DISCONNECTED
  PENDING_SETUP
  PENDING_APPROVAL
  CONNECTED
  BLOCKED
}

enum BotConfirmationType {
  CONFIRM
  CANCEL_REQUEST
}
```

**Campos en `Subscription`**:
```prisma
tier SubscriptionTier @default(PRO)
```
- Backfill: todas las subscriptions existentes → `tier = PRO`.

**Campos en `Barbershop`**:
```prisma
model Barbershop {
  // ... existing
  whatsappState              WhatsAppBotState @default(DISCONNECTED)
  whatsappPhoneNumberId      String?
  whatsappWabaId             String?
  whatsappConnectedAt        DateTime?
  reminderGraceMinutes       Int      @default(15)
  confirmationCutoffMinutes  Int      @default(60)
  notifyUnknownClients       Boolean  @default(true)
}
```

**Campos en `Booking`**:
```prisma
model Booking {
  // ... existing
  reminder24hSentAt   DateTime?
  reminder2hSentAt    DateTime?
  botConfirmedAt      DateTime?
  botConfirmationType BotConfirmationType?
}
```
- No se añade `attended` — la ausencia se infiere de `status === "SCHEDULED" && endTime < now - graceMinutes`.
- Eliminado `botConversationId` (YAGNI, M2).

**Índice nuevo en `Client`** (B1):
```prisma
model Client {
  // ... existing
  @@index([barbershopId, phone])
}
```

**Nuevo modelo `WhatsAppMessageLog`**:
```prisma
model WhatsAppMessageLog {
  id             String   @id @default(cuid())
  barbershopId   String
  bookingId      String?
  clientId       String?
  toPhone        String   // E.164 format (validación Zod)
  direction      String   // "inbound" | "outbound"
  type           String   // "template" | "text" | "interactive" | "system"
  templateName   String?
  status         String?  // "queued" | "sent" | "delivered" | "read" | "failed"
  metaMessageId  String?
  body           String?  // sólo outbound (PII: inbound body=null)
  tokensUsed     Int?     // para cálculo económico (I7)
  error          String?
  createdAt      DateTime @default(now())

  barbershop Barbershop @relation(fields: [barbershopId], references: [id])
  booking    Booking?   @relation(fields: [bookingId], references: [id])
  client     Client?    @relation(fields: [clientId], references: [id])

  @@unique([metaMessageId, direction])  // B3 idempotency
  @@index([barbershopId, createdAt])
  @@index([bookingId, createdAt])
}
```

**Nuevo modelo `AbsenceEvent`** (M7 baseline):
```prisma
model AbsenceEvent {
  id           String   @id @default(cuid())
  bookingId    String
  barbershopId String
  clientId     String?
  detectedAt   DateTime @default(now())
  graceMinutes Int

  booking    Booking    @relation(fields: [bookingId], references: [id])
  barbershop Barbershop @relation(fields: [barbershopId], references: [id])

  @@index([barbershopId, detectedAt])
}
```

**Índices nuevos en `Booking`**:
```prisma
@@index([barbershopId, status, startTime, reminder24hSentAt])
@@index([barbershopId, status, startTime, reminder2hSentAt])
```

---

## 5. Flujos Conversacionales

### Arquitectura del Agente (Vercel AI SDK 7)

- **Ubicación**: `app/api/wa/inbound/route.ts`, runtime `nodejs`.
- **Stack**: `ai` 7.x con `ToolLoopAgent`. Multi-provider configurable por env.
- **Estado**: stateless por request. Context del cliente se inyecta como system prompt dinámico.
- **Sistema de prompt** (`lib/ai/prompts/turnix-bot-system.ts`):
  - Identidad: "Sos el bot de WhatsApp de {barbershop.name}. Hablás como un barbero amigo, en rioplatense, corto y claro."
  - **Timezone**: "Todas las fechas y horas que le indiques al cliente están en hora de Argentina (ART, UTC-3)." (I2)
  - Hard rules: "No inventes horarios. No prometas promociones. No cancelás turnos — derivás al OWNER. Si el cliente pregunta algo fuera de scope, respondés 'no puedo ayudarte con eso' + ofrece link público de reservas."
  - Datos contextuales inyectados:
    - `barbershop.name`, `barbershop.address`, `barbershop.hours`
    - `services[]` (nombre, duración, precio en ARS, barbero)
    - `barbers[]` (nombre del OWNER + teamMembers activos)
    - `client.name` (si matcheo phone)
    - `client.nextBookings[]` (hasta 3 próximos, `status === SCHEDULED`)
    - `client.lastCompletedBooking` (uno, si existe)

### Tools del Agente v0.1 (lista consolidada, I4)

| Tool | Propósito | Implementación |
|---|---|---|
| `getNextBookings` | Próximos turnos del cliente | `Booking` where `clientId`, `status=SCHEDULED`, `startTime > now`, limit 3 |
| `getServiceCatalog` | Servicios activos | `Service` where `barbershopId` |
| `getShopHours` | Horarios por día | `WorkingHours` + blocks del barbero/owner |
| `getBarbers` | Barberos disponibles | `User` OWNER + `Team` members |
| `confirmBooking` | Cliente confirma turno | Valida `clientId === caller.id`, `status === SCHEDULED`, `startTime > now + confirmationCutoffMinutes`. Setea `botConfirmedAt = now`, `botConfirmationType = CONFIRM`. NO cambia `status`. |
| `requestCancellation` | Cliente pide cancelar | Setea `botConfirmationType = CANCEL_REQUEST`. Genera `Notification` al OWNER con mensaje "El cliente {name} pidió cancelar el turno del {fecha} a las {hora}." Devuelve "Avisamos al barbero". |
| `getPublicBookingLink` | Link público de reserva | Devuelve `${BASE_URL}/${barbershop.slug}` |

### Flujos Conversacionales (Ejemplos)

**A. Cliente confirma turno**:
```
Cliente: "Hola, quiero confirmar el turno"
Bot: "Hola {name}! Tenés turno el {fecha} a las {hora} con {barber} para {service}. Confirmo?"
Cliente: "Sí"
Bot: [tool confirmBooking] "Listo, confirmado. Te esperamos!"
```

**B. Cliente pregunta horarios**:
```
Cliente: "Atienden los sábados?"
Bot: [tool getShopHours] "Sí, sábado de 10 a 18. Podés reservar acá: {link}"
```

**C. Cliente pregunta fuera de scope**:
```
Cliente: "¿Hacen depilación?"
Bot: "No, ese servicio no lo ofrecemos. Acá ver los disponibles: {link}"
```

**D. Cliente desconocido** (con rate limiting B5):
```
Bot: "Hola! Soy el bot de {barbershop}. No te identifico en nuestra agenda. Podés reservar acá: {link}. Si querés que el barbero te contacte, decime tu nombre."
Cliente: "Soy Juan Pérez"
Bot: "Gracias Juan! Le aviso a {barber} que te contacte."
→ Si notifyUnknownClients === true: Genera Notification al OWNER "Este número no está en tu agenda: Juan Pérez +54 11 1234-5678"
→ Rate limit: 1 mensaje cada 24h por wa_id desconocido
```

### Templates Meta Aprobados

| Template | Categoría | Variables | Cuándo |
|---|---|---|---|
| `reminder_24h` | UTILITY | `{{client_name}}`, `{{barber_name}}`, `{{service_name}}`, `{{date}}`, `{{time}}` | Cron 24h antes |
| `reminder_2h` | UTILITY | mismo | Cron 2h antes |
| `absentee_report` | UTILITY | `{{client_name}}`, `{{date}}` | Cron post-grace (al OWNER) |

**Flujo de aprobación** (B4):
1. Durante onboarding WABA, Turnix crea los 3 templates vía Kapso API.
2. Estado → `PENDING_APPROVAL`.
3. Webhook Kapso `whatsapp.template.status_update` → Turnix verifica que todos están `APPROVED`.
4. Estado → `CONNECTED`.
5. **Crons solo envían si `whatsappState === CONNECTED`** (no envían en `PENDING_SETUP` ni `PENDING_APPROVAL`).
6. UI muestra: "Tus plantillas están en revisión por Meta. Esto puede tardar 24-48 horas."

### Rate Limiting y Costos (centralizado en `lib/kapso/send.ts`, I6)

- **Cap mensual**: 1000 mensajes salientes / mes por barbershop.
  - Medición: `count(WhatsAppMessageLog where barbershopId AND direction=outbound AND createdAt >= startOfMonth)`.
  - Enforce: pre-send check en `lib/kapso/send.ts`. Si excede → throw `QuotaExceeded`.
  - Al 80%: notification al OWNER.
  - Al 100%: respondes con "Excediste el cupo de AI PRO. Esperá al mes que viene" (v0.1 no hay upgrade over-token).
- **Rate limit por minuto**: 20 outbound/min por phone_number_id (limite blando de Meta).
  - Enforce: in-memory token bucket en `lib/kapso/send.ts` (aceptable para v0.1, Vercel serverless).
  - Si excede → delay o error controlado (no drop silencioso).
- **Cliente desconocido**: 1 mensaje cada 24h por `wa_id` (B5).
  - Enforce: DB count en `lib/ai/whatsapp-limits.ts`.
  - Si excede → return 200 sin procesar.

### Webhook Inbound

- `app/api/wa/inbound/route.ts` verifica `X-Kapso-Signature` (HMAC SHA256, secret `KAPSO_WEBHOOK_SECRET`).
- **Formato exacto**: a verificar en etapa 5 contra docs oficiales de Kapso (`references/webhooks-reference.md` de skill `integrate-whatsapp`) o inspeccionando `node_modules/@kapso/whatsapp-cloud-api/src/` (B7).
- **Idempotencia PRIMERO** (B3):
  1. Intentar insert `WhatsAppMessageLog` con `metaMessageId` + `direction=inbound`.
  2. Si `P2002` (unique constraint violation) → return 200 inmediato (ya procesado).
  3. Si success → continuar con lógica de negocio.
- Error handling: si LLM call falla, respondes "En este momento no puedo procesar tu mensaje. Probá de nuevo en unos minutos o contactate con {OWNER phone}".

---

## 6. Logging & Observability (I7)

### Política de Logging

**Se persiste en `WhatsAppMessageLog`**:
- **Outbound**: `body`, `templateName`, `tokensUsed`, `status`, `metaMessageId`, `error`.
- **Inbound**: `direction=inbound`, `body=null` (no PII silver), `metaMessageId`, `status`.

**Se loggea en aplicación**:
- `console.error` con redacción de PII (no loggear body del LLM response, sólo IDs).
- AI SDK Telemetry: traces a stdout (en prod) o Vercel DevTools (en dev).

**No se loggea**:
- Texto completo de mensajes inbound del cliente (PII).
- Tokens LLM en logs de aplicación (solo en `WhatsAppMessageLog.tokensUsed`).

### Métricas Económicas (Dashboard Interno)

- `/api/admin/ai-pro-metrics` (auth: co-fundador Turnix).
- Agrega por barbershop:
  - Messages outbound (count `WhatsAppMessageLog where direction=outbound`).
  - Tokens LLM (sum `WhatsAppMessageLog.tokensUsed`).
  - Costo estimado Meta = messages * tarifa UTILITY (a verificar en etapa 3).
  - Costo estimado LLM = tokensUsed * costo del provider.
  - Revenue AI PRO = $19.900 (o prorrateado si trial).
  - Margin % = (revenue - costo Meta - costo LLM) / revenue.
- UI: tabla con barbershop, messages, tokens, estimated cost, revenue, margin %.

### Criterio de Éxito de Margen

- **Costo Meta + LLM por barbershop < 30% del revenue AI_PRO** (margen > 70%).
- Medición: dashboard interno `/api/admin/ai-pro-metrics`.
- Alerta: si margen < 70% para alguna barbershop → notification al co-fundador.

---

## 7. Plan de Implementación

### Orden de Etapas (~4-5 semanas)

| # | Etapa | Archivos | Verificación |
|---|---|---|---|
| 1 | Migración Prisma + tipos | `prisma/schema.prisma` (todos los nuevos models + enums), `types/next-auth.d.ts` (añadir `tier` a `SubscriptionInfo`), `lib/auth.ts` (propagar tier al JWT) | `prisma migrate dev` + `tsc --noEmit` |
| 2 | Helper subscription tier | `lib/subscription.ts` (añadir `isAiPro(session)` que incluye `trialEndsAt > now`), `lib/data.ts` (exponer `tier` en `getCurrentUser`) | `tsc --noEmit` + test manual |
| 3 | Cliente Kapso + tipos | `lib/kapso/client.ts`, `lib/kapso/types.ts`, `lib/kapso/templates.ts`, `lib/kapso/send.ts` (con rate limiting centralizado I6), `lib/kapso/verify-signature.ts` (formato verificado B7) | Unit tests con mock fetch, **validar versiones npm** (I5): `pnpm view ai version`, `pnpm view @ai-sdk/openai version`, `pnpm view @kapso/whatsapp-cloud-api version` |
| 4 | Onboarding WhatsApp OWNER | `app/dashboard/whatsapp/page.tsx`, `actions/whatsapp.actions.ts` (Server Action pattern AGENTS.md C3), `components/whatsapp/ConnectWhatsAppCard.tsx`, state machine con `PENDING_SETUP/PENDING_APPROVAL/CONNECTED/BLOCKED` (B4) | Playwright test |
| 5 | Webhook inbound + firma | `app/api/wa/inbound/route.ts` (idempotencia PRIMERO B3), `lib/kapso/verify-signature.ts` (formato verificado B7) | curl con POST mock + firma válida → 200; con firma mala → 401; replay → 2xx sin side effect |
| 6 | Agente Vercel AI SDK 7 + tools | `lib/ai/turnix-bot-agent.ts` (ToolLoopAgent), `lib/ai/prompts/turnix-bot-system.ts` (con timezone I2), `lib/ai/tools/*.ts` (7 tools consolidadas I4), `lib/ai/whatsapp-limits.ts` (rate limit cliente desconocido B5) | Playwright e2e con LLM mock |
| 7 | Cron reminders 24h y 2h | `app/api/cron/whatsapp-reminders/route.ts` (`*/5 * * * *` I1, atomic `updateMany` B6, gate `whatsappState === CONNECTED`) | Playwright test con booking fixture |
| 8 | Cron absentee report | `app/api/cron/whatsapp-absentee/route.ts` (insert `AbsenceEvent`, fallback push existente, gating `notifyUnknownClients`) | Playwright test |
| 9 | Cron baseline tracker **(NUEVO, M7)** | `app/api/cron/absence-tracker/route.ts` (solo INSERT `AbsenceEvent` sin enviar, 30 días pre-launch) | Playwright test |
| 10 | Gate AI PRO en billing | `lib/mercadopago/subscription-types.ts` (`PLAN_PRICES.AI_PRO_MONTHLY = 19900`, `AI_PRO_ANNUAL = 191040`), `actions/subscription.actions.ts` (setea `tier = AI_PRO`, upgrade inmediato sin trial), `components/billing/*` | Playwright test upgrade flow |
| 11 | Admin dashboard metrics **(NUEVO, I7)** | `app/api/admin/ai-pro-metrics/route.ts` (auth co-fundador), UI simple con tabla de barbershops + costos + margen | Playwright test |
| 12 | UI `/dashboard/whatsapp` | Página conectada, pendiente (PENDING_SETUP/PENDING_APPROVAL con mensajes explicativos B4), bloqueada (CTA a support), settings `reminderGraceMinutes`, `confirmationCutoffMinutes`, `notifyUnknownClients` (B5), badge "sin teléfono" en `/dashboard/clients` | Playwright test states |

### Dependencias npm Nuevas (validar versiones en etapa 3, I5)

```json
{
  "dependencies": {
    "ai": "^7.0.0",
    "@ai-sdk/openai": "^2.0.0",
    "@kapso/whatsapp-cloud-api": "^x.y.z"
  }
}
```
**Importante**: en etapa 3, ejecutar `pnpm view ai version`, `pnpm view @ai-sdk/openai version`, `pnpm view @kapso/whatsapp-cloud-api version` y fijar versiones reales (no `latest`).

### Variables de Entorno Nuevas

```bash
KAPSO_API_BASE_URL=https://api.kapso.ai
KAPSO_API_KEY=<your_kapso_key>
KAPSO_WEBHOOK_SECRET=<random_64_chars>
TURNIX_AI_PROVIDER=openai
OPENAI_API_KEY=<key>
TURNIX_AI_MODEL=gpt-4o-mini
TURNIX_AI_MAX_TOKENS_PER_REPLY=400
TURNIX_BOT_ENABLED=true
TURNIX_REMINDERS_ENABLED=true
TURNIX_BASELINE_TRACKER_ENABLED=true
```

### Rollback Plan (I3)

**Destructivo con backup DB previo a migrate** (no `_deprecated` fields, YAGNI):
1. **Rollback schema**: revertir migración con `prisma migrate resolve --rolled-back`. Backup DB antes de migrate.
2. **Rollback bot inbound**: env `TURNIX_BOT_ENABLED=false` → route handler retorna 200 pero no invoca LLM.
3. **Rollback reminders**: gate `TURNIX_REMINDERS_ENABLED=true` por barbershop.OWNER puede desactivar individualmente.
4. **Rollback pricing**: revertir cambios en `subscription-types.ts`; subscribers AI_PRO existentes se mantienen.
5. **Datos WhatsAppMessageLog**: nunca dropear (historial auditable).

---

## 8. Testing Strategy

- **Unit tests** (vitest): `lib/kapso/verify-signature.test.ts`, `lib/ai/tools/*.test.ts`, `lib/subscription.test.ts` (añadir tests para `isAiPro`).
- **Integration tests**: cron routes con Prisma transactional rollback, mocked fetch a Kapso API.
- **E2E Playwright**:
  1. `tests/whatsapp-onboarding.spec.ts` — flow Kapso setup + state transitions (DISCONNECTED → PENDING_SETUP → PENDING_APPROVAL → CONNECTED).
  2. `tests/billing-ai-pro-upgrade.spec.ts` — upgrade PRO → AI_PRO con MercadoPago sandbox (sin trial, pago inmediato).
  3. `tests/whatsapp-reminders-cron.spec.ts` — disparo cron con booking fixture, atomic updateMany.
  4. `tests/whatsapp-inbound-bot.spec.ts` — webhook mock con reply del bot, idempotencia PRIMERO.
  5. `tests/whatsapp-absentee-detection.spec.ts` — booking SCHEDULED vencido → absentee report + AbsenceEvent.
  6. `tests/whatsapp-baseline-tracker.spec.ts` — 30 días pre-launch, solo INSERT AbsenceEvent sin enviar.
  7. `tests/whatsapp-unknown-client-rate-limit.spec.ts` — 1 mensaje cada 24h por wa_id desconocido.

---

## 9. Skills Activadas Durante Implementación

| Etapa | Skill |
|---|---|
| Todas | `verification-before-completion`, `receiving-code-review` |
| 1-2 | `prisma-cli`, `prisma-client-api`, `prisma-database-setup`, `prisma-postgres`, `supabase-postgres-best-practices` |
| 3 | `nodejs-backend-patterns`, `nodejs-best-practices`, `pnpm` |
| 4 | `next-best-practices`, `shadcn`, `tailwind-css-patterns`, `vercel-react-best-practices` |
| 5 | `integrate-whatsapp`, `systematic-debugging` |
| 6 | `ai-sdk` (instalada), `npx skills use https://github.com/vercel/ai --skill ai-sdk` |
| 7-8 | `playwright-best-practices`, `requesting-code-review` |
| 9 | `playwright-best-practices` |
| 10 | `integrations-mercadopago` (docs existentes en `lib/mercadopago/`) |
| 11 | `nodejs-backend-patterns` |
| 12 | `accessibility`, `shadcn`, `frontend-design` |

---

## 10. Open Questions (Definir Post-Brainstorm)

1. **Provider LLM default**: abierto (recomendado `gpt-4o-mini` por costo + español rioplatense).
2. **Display name WhatsApp del barbershop**: v0.1 auto-asignado por defecto, editable post-onboarding via Kapso CLI.
3. **Política PII mensajería**: inbound no se persiste en texto libre en v0.1. Post-MVP evaluar hashed partial con consentimiento.
4. **Suba de precio PRO**: decidí NO subirlo en v0.1. Revisar post-AI PRO adoption (3-6 meses) con datos de churn.
5. **Formato exacto de firma Kapso**: a verificar en etapa 3 contra docs oficiales o inspeccionando SDK.
6. **Tarifa UTILITY de Meta en LATAM**: a verificar en etapa 3 para cálculo de costos en dashboard.
7. **Límite real de mensajes outbound/mes para WABA nuevos**: a verificar en etapa 4 (Meta puede tener límites iniciales para WABA nuevos).

---

## 11. Fuera de Scope v0.1 (Post-MVP)

- `MessageTemplate` model (templates editables por OWNER).
- `BotConversationContext` (memoria persistente por `wa_id`).
- `WhatsAppUsageLog` (token metering en tiempo real — v0.1 solo trackea `tokensUsed` en `WhatsAppMessageLog`).
- `BranchOffice` / multi-sucursal.
- Campos para "AI PRO MAX".
- Alta/baja de turnos por bot.
- Reseñas post-turno.
- Mensajes masivos con dashboard de templates.
- Planes PRO MAX / AI PRO MAX.

---

## 12. Criterios de Éxito

- **Adopción**: 3+ barberías activan AI PRO en primer mes.
- **Reducción de ausencias**: >20% reducción en ausencias vs. baseline (medido en 3 meses).
  - **Baseline**: 30 días pre-launch con tracking silencioso (`AbsenceEvent` sin enviar mensajes).
- **Satisfacción OWNER**: NPS > 50 en encuesta post-activación.
- **Costos**: costo Meta + LLM por barbershop < 30% del revenue AI_PRO (margen > 70%).
  - **Medición**: dashboard interno `/api/admin/ai-pro-metrics`.

---

## 13. Próximos Pasos

1. Invocar `writing-plans` skill para generar plan de implementación detallado por etapa.
2. Ejecutar plan secuencialmente (etapas 1-12).
3. Cada etapa: implementar → lint + typecheck → tests → review → merge.
4. Deploy a Vercel preview → QA con barberías beta → production.

---

**Fin del spec v0.2.**
