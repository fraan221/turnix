# Turnix Bot AI PRO — Design Spec v0.1

**Fecha**: 2026-07-20
**Estado**: Aprobado (brainstorming completado)
**Autor**: Co-fundador técnico Turnix

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

**Excluye (post-MVP)**:
- Mensajes masivos con templates editables por OWNER.
- Alta/baja de turnos por bot.
- Reseñas post-turno.
- Multi-sucursal.
- Token metering en tiempo real.
- Planes PRO MAX / AI PRO MAX.

### 2.4 Pricing
**Decisión**:
- **AI PRO**: $19.900/mes · $191.040/año ($15.920/mes equivalente, 20% descuento anual).
- **PRO actual**: sin suba (protege base activa de 10+ barberías).

**Razón**: Duplicar el precio refleja costo Meta + LLM + valor del anti-ausentismo (cada ausencia evitada ya paga el plan). Subir el PRO actual generaría churn en la base activa.

### 2.5 Identificación de Cliente
**Decisión**: Matching exacto phone E.164 → `Client`, fallback cliente desconocido.

**Flujo**:
1. Inbound WhatsApp llega con `wa_id` (formato E.164).
2. Turnix busca `Client` donde `phone === wa_id` (normalizado).
3. Si matchea → contexto completo (próximos turnos, historial).
4. Si no matchea → cliente desconocido, bot responde con saludo + ofrece link público de reservas.

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
│        ├─ normalize wa_id → E.164                               │
│        ├─ Client.findByPhone()  → context                      │
│        └─ Vercel AI SDK 7 ToolLoopAgent                         │
│            tools: getNextBookings, getShopInfo, confirmBooking, │
│                   requestCancellation, getServices, getBarbers, │
│                   getShopHours                                  │
│                                                                 │
│  /api/cron/whatsapp-reminders (cron existente)                  │
│        ├─ Booking where start in 24h/2h and reminderPending     │
│        └─ Kapso send API (template aprobado "reminder_24h")     │
│                                                                 │
│  /api/cron/whatsapp-absentee (cron existente)                   │
│        ├─ Booking where status=SCHEDULED && endTime < now-grace │
│        └─ Kapso send API (template "absentee_report" al OWNER)  │
│           O fallback sendPushNotification existente             │
│                                                                 │
│  AI PRO feature gate (subscriptionTier === 'AI_PRO')            │
└────────────────────────────────────────────────────────────────┘
```

### Flujos Principales

**1. Onboarding WhatsApp del OWNER**:
- Dashboard → botón "Conectar WhatsApp" → `kapso setup --customer <owner>`.
- Embedded signup Meta → provisioning número dedicated.
- Webhook `whatsapp.phone_number.created` → Turnix guarda `phone_number_id` + `waba_id` en `Barbershop`.
- Estado: `WhatsAppBotState = { DISCONNECTED, PENDING, CONNECTED, BLOCKED }`.

**2. Reminder 24h** (cron):
- Busca bookings con `startTime` en ventana [+24h, +25h], `status=SCHEDULED`, `reminder24hSentAt IS NULL`, barbershop con `whatsappState === CONNECTED` y `tier === AI_PRO`.
- Llama Kapso send API con template `reminder_24h` (categoría `UTILITY`, variables: nombre del cliente, barbero, servicio, fecha, hora).
- Marca `reminder24hSentAt`.
- Skip si `botConfirmedAt` reciente (últimas 2h).

**3. Reminder 2h** (cron):
- Mismo flujo, template `reminder_2h`, ventana [+2h, +2h30m].

**4. Inbound conversacional**:
- Kapso firmado → Turnix route → normaliza phone → busca Client → ToolLoopAgent ejecuta con tools cerradas → reply por Kapso send dentro de ventana 24h (texto libre, sin template).

**5. Reporte de ausencia al OWNER** (cron):
- Busca bookings con `status === SCHEDULED` y `endTime < now - reminderGraceMinutes` (default 15min).
- Envía template `absentee_report` al OWNER (si `whatsappState === CONNECTED`) O fallback `sendPushNotification` existente.

---

## 4. Modelo de Datos

### Migración: `add_whatsapp_ai_pro`

**Enum nuevo `SubscriptionTier`**:
```prisma
enum SubscriptionTier {
  PRO       // plan actual ($9.900/mes)
  AI_PRO    // nuevo plan ($19.900/mes)
}
```

**Campos en `Subscription`**:
```prisma
tier SubscriptionTier @default(PRO)
```
- Backfill: todas las subscriptions existentes → `tier = PRO`.

**Enum nuevo `WhatsAppBotState`** + campos en `Barbershop`:
```prisma
enum WhatsAppBotState {
  DISCONNECTED
  PENDING
  CONNECTED
  BLOCKED
}

model Barbershop {
  // ... existing
  whatsappState       WhatsAppBotState @default(DISCONNECTED)
  whatsappPhoneNumberId String?
  whatsappWabaId      String?
  whatsappConnectedAt DateTime?
  reminderGraceMinutes Int      @default(15)
}
```

**Campos en `Booking`**:
```prisma
model Booking {
  // ... existing
  reminder24hSentAt   DateTime?
  reminder2hSentAt    DateTime?
  botConfirmedAt      DateTime?
  botConfirmationType String?   // "confirm" | "cancel_request"
  botConversationId   String?   // Kapso execution_id (opcional v0.1)
}
```
- No se añade `attended` — la ausencia se infiere de `status === "SCHEDULED" && endTime < now - graceMinutes`.

**Nuevo modelo `WhatsAppMessageLog`**:
```prisma
model WhatsAppMessageLog {
  id             String   @id @default(cuid())
  barbershopId   String
  bookingId      String?
  clientId       String?
  toPhone        String   // E.164
  direction      String   // "inbound" | "outbound"
  type           String   // "template" | "text" | "interactive" | "system"
  templateName   String?
  status         String?  // "queued" | "sent" | "delivered" | "read" | "failed"
  metaMessageId  String?
  body           String?  // sólo outbound (PII: inbound no se persiste en texto libre)
  error          String?
  createdAt      DateTime @default(now())

  barbershop Barbershop @relation(fields: [barbershopId], references: [id])
  booking    Booking?   @relation(fields: [bookingId], references: [id])
  client     Client?    @relation(fields: [clientId], references: [id])

  @@index([barbershopId, createdAt])
  @@index([bookingId, createdAt])
  @@index([metaMessageId])
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
  - Hard rules: "No inventes horarios. No prometas promociones. No cancelás turnos — derivás al OWNER. Si el cliente pregunta algo fuera de scope, respondés 'no puedo ayudarte con eso' + ofrece link público de reservas."
  - Datos contextuales inyectados:
    - `barbershop.name`, `barbershop.address`, `barbershop.hours`
    - `services[]` (nombre, duración, precio en ARS, barbero)
    - `barbers[]` (nombre del OWNER + teamMembers activos)
    - `client.name` (si matcheo phone)
    - `client.nextBookings[]` (hasta 3 próximos, `status === SCHEDULED`)
    - `client.lastCompletedBooking` (uno, si existe)

### Tools del Agente v0.1

| Tool | Propósito | Implementación |
|---|---|---|
| `getNextBookings` | Próximos turnos del cliente | `Booking` where `clientId`, `status=SCHEDULED`, `startTime > now`, limit 3 |
| `getServiceCatalog` | Servicios activos | `Service` where `barbershopId` |
| `getShopHours` | Horarios por día | `WorkingHours` + blocks del barbero/owner |
| `getBarbers` | Barberos disponibles | `User` OWNER + `Team` members |
| `confirmBooking` | Cliente confirma turno | Valida `clientId === caller.id`, `status === SCHEDULED`, `startTime > now + 1h`. Setea `botConfirmedAt = now`, `botConfirmationType = "confirm"`. NO cambia `status`. |
| `requestCancellation` | Cliente pide cancelar | Setea `botConfirmationType = "cancel_request"`. Genera `Notification` al OWNER. Devuelve "Avisamos al barbero". |
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

**D. Cliente desconocido**:
```
Bot: "Hola! Soy el bot de {barbershop}. No te identifico en nuestra agenda. Podés reservar acá: {link}. Si querés que el barbero te contacte, decime tu nombre."
Cliente: "Soy Juan Pérez"
Bot: "Gracias Juan! Le aviso a {barber} que te contacte."
→ Genera Notification al OWNER
```

### Templates Meta Aprobados

| Template | Categoría | Variables | Cuándo |
|---|---|---|---|
| `reminder_24h` | UTILITY | `{{client_name}}`, `{{barber_name}}`, `{{service_name}}`, `{{date}}`, `{{time}}` | Cron 24h antes |
| `reminder_2h` | UTILITY | mismo | Cron 2h antes |
| `absentee_report` | UTILITY | `{{client_name}}`, `{{date}}` | Cron post-grace (al OWNER) |

Creación inicial: durante onboarding WABA, Turnix llama a Kapso API para crear los 3 templates.

### Rate Limiting y Costos

- Cap v0.1: **1000 mensajes salientes / mes** por barbershop.
- Medición: `count(WhatsAppMessageLog where barbershopId AND direction=outbound AND createdAt >= startOfMonth)`.
- Al 80%: notification al OWNER.
- Al 100%: Kapso send raises `QuotaExceeded` → respondes con upsell (en v0.1 no hay upgrade over-token, sólo "esperá al mes que viene").
- Rate limit por minuto: 20 outbound/min por phone_number_id (limite blando de Meta).

### Webhook Inbound

- `app/api/wa/inbound/route.ts` verifica `X-Kapso-Signature` (HMAC SHA256, secret `KAPSO_WEBHOOK_SECRET`).
- Idempotencia: persiste `metaMessageId` en `WhatsAppMessageLog`; si llega duplicado (Meta retry), se ignora.
- Error handling: si LLM call falla, respondes "En este momento no puedo procesar tu mensaje. Probá de nuevo en unos minutos o contactate con {OWNER phone}".

---

## 6. Plan de Implementación

### Orden de Etapas (~3-4 semanas)

| # | Etapa | Archivos | Verificación |
|---|---|---|---|
| 1 | Migración Prisma + tipos | `prisma/schema.prisma`, `types/next-auth.d.ts`, `lib/auth.ts` | `prisma migrate dev` + `tsc --noEmit` |
| 2 | Helper subscription tier | `lib/subscription.ts`, `lib/data.ts` | `tsc --noEmit` + test manual |
| 3 | Cliente Kapso + tipos | `lib/kapso/client.ts`, `lib/kapso/types.ts`, `lib/kapso/templates.ts`, `lib/kapso/send.ts` | Unit tests con mock fetch |
| 4 | Onboarding WhatsApp OWNER | `app/dashboard/whatsapp/page.tsx`, `actions/whatsapp.actions.ts`, `components/whatsapp/ConnectWhatsAppCard.tsx` | Playwright test |
| 5 | Webhook inbound + firma | `app/api/wa/inbound/route.ts`, `lib/kapso/verify-signature.ts` | curl con POST mock |
| 6 | Agente Vercel AI SDK 7 + tools | `lib/ai/turnix-bot-agent.ts`, `lib/ai/prompts/turnix-bot-system.ts`, `lib/ai/tools/*.ts`, `lib/ai/whatsapp-limits.ts` | Playwright e2e con LLM mock |
| 7 | Cron reminders 24h y 2h | `app/api/cron/whatsapp-reminders/route.ts` | Playwright test con booking fixture |
| 8 | Cron absentee report | `app/api/cron/whatsapp-absentee/route.ts` | Playwright test |
| 9 | Gate AI PRO en billing | `lib/mercadopago/subscription-types.ts`, `actions/subscription.actions.ts`, `components/billing/*` | Playwright test upgrade flow |
| 10 | UI `/dashboard/whatsapp` | Página conectada, pendiente, bloqueada, settings `reminderGraceMinutes`, badge "sin teléfono" en `/dashboard/clients` | Playwright test states |

### Dependencias npm Nuevas

```json
{
  "dependencies": {
    "ai": "^7.0.0",
    "@ai-sdk/openai": "^2.0.0",
    "@kapso/whatsapp-cloud-api": "latest"
  }
}
```

### Variables de Entorno Nuevas

```bash
KAPSO_API_BASE_URL=https://api.kapso.ai
KAPSO_API_KEY=<your_kapso_key>
KAPSO_WEBHOOK_SECRET=<random_64_chars>
TURNIX_AI_PROVIDER=openai
OPENAI_API_KEY=<key>
TURNIX_AI_MODEL=gpt-4o-mini
TURNIX_AI_MAX_TOKENS_PER_REPLY=400
```

### Rollback Plan

1. **Rollback schema**: revertir migración con `prisma migrate resolve --rolled-back`, renombrar campos a `*_deprecated` por 30 días.
2. **Rollback bot inbound**: env `TURNIX_BOT_ENABLED=false` → route handler retorna 200 pero no invoca LLM.
3. **Rollback reminders**: gate `TURNIX_REMINDERS_ENABLED=true` por barbershop.OWNER puede desactivar individualmente.
4. **Rollback pricing**: revertir cambios en `subscription-types.ts`; subscribers AI_PRO existentes se mantienen.
5. **Datos WhatsAppMessageLog**: nunca dropear (historial auditable).

---

## 7. Testing Strategy

- **Unit tests** (vitest): `lib/kapso/verify-signature.test.ts`, `lib/ai/tools/*.test.ts`, `lib/subscription.test.ts`.
- **Integration tests**: cron routes con Prisma transactional rollback, mocked fetch a Kapso API.
- **E2E Playwright**:
  1. `tests/whatsapp-onboarding.spec.ts` — flow Kapso setup + state transitions.
  2. `tests/billing-ai-pro-upgrade.spec.ts` — upgrade PRO → AI_PRO con MercadoPago sandbox.
  3. `tests/whatsapp-reminders-cron.spec.ts` — disparo cron con booking fixture.
  4. `tests/whatsapp-inbound-bot.spec.ts` — webhook mock con reply del bot.
  5. `tests/whatsapp-absentee-detection.spec.ts` — booking SCHEDULED vencido → absentee report.

---

## 8. Skills Activadas Durante Implementación

| Etapa | Skill |
|---|---|
| Todas | `verification-before-completion` |
| 1-2 | `prisma-cli`, `prisma-client-api`, `prisma-database-setup` |
| 3 | `nodejs-backend-patterns`, `nodejs-best-practices` |
| 4 | `next-best-practices`, `shadcn`, `tailwind-css-patterns` |
| 5 | `integrate-whatsapp` |
| 6 | `ai-sdk` (instalada), `npx skills use https://github.com/vercel/ai --skill ai-sdk` |
| 7-8 | `playwright-best-practices` |
| 9 | `integrations-mercadopago` (docs existentes en `lib/mercadopago/`) |
| 10 | `accessibility`, `shadcn`, `frontend-design` |

---

## 9. Open Questions (Definir Post-Brainstorm)

1. **Provider LLM default**: abierto (recomendado `gpt-4o-mini` por costo + español rioplatense).
2. **Display name WhatsApp del barbershop**: v0.1 auto-asignado por defecto, editable post-onboarding via Kapso CLI.
3. **Política PII mensajería**: inbound no se persiste en texto libre en v0.1. Post-MVP evaluar hashed partial con consentimiento.
4. **Suba de precio PRO**: decidí NO subirlo en v0.1. Revisar post-AI PRO adoption (3-6 meses) con datos de churn.

---

## 10. Fuera de Scope v0.1 (Post-MVP)

- `MessageTemplate` model (templates editables por OWNER).
- `BotConversationContext` (memoria persistente por `wa_id`).
- `WhatsAppUsageLog` (token metering).
- `BranchOffice` / multi-sucursal.
- Campos para "AI PRO MAX".
- Alta/baja de turnos por bot.
- Reseñas post-turno.
- Mensajes masivos con dashboard de templates.
- Planes PRO MAX / AI PRO MAX.

---

## 11. Criterios de Éxito

- **Adopción**: 3+ barberías activan AI PRO en primer mes.
- **Reducción de ausencias**: >20% reducción en ausencias vs. baseline (medido en 3 meses).
- **Satisfacción OWNER**: NPS > 50 en encuesta post-activación.
- **Costos**: costo Meta + LLM por barbershop < 30% del revenue AI_PRO (margen > 70%).

---

## 12. Próximos Pasos

1. Invocar `writing-plans` skill para generar plan de implementación detallado por etapa.
2. Ejecutar plan secuencialmente (etapas 1-10).
3. Cada etapa: implementar → lint + typecheck → tests → review → merge.
4. Deploy a Vercel preview → QA con barberías beta → production.

---

**Fin del spec.**
