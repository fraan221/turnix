# Auditoría Senior Full-Stack — Turnix Bot AI PRO Design Spec v0.1

**Fecha de auditoría**: 2026-07-20  
**Especificación auditada**: `docs/superpowers/specs/2026-07-20-turnix-bot-ai-pro-design.md`  
**Auditor**: Co-fundador técnico / auditor externo full-stack  
**Veredicto global**: ⚠️ **Aprobable con cambios obligatorios**. El spec tiene una arquitectura sólida y alineada con la filosofía de Turnix, pero presenta **gaps críticos** en seguridad, robustez operacional y consistencia con el codebase existente que, si no se corrigen, generarán incidentes en producción y retrabajo.

---

## 🟥 BLOQUEANTES (deben corregirse antes de aprobar)

### B1. `Client.phone` no está indexado: búsqueda O(n) por barbershop
- **Referencia spec**: §2.5 — "Turnix busca `Client` donde `phone === wa_id` (normalizado)".
- **Estado actual en schema** (`prisma/schema.prisma:88-104`): `Client.phone String?` sin índice compuesto. Solo existe `@@index([barbershopId, createdAt])`.
- **Impacto**: cada mensaje inbound de WhatsApp realizará un full table scan de la tabla `Client` filtrando por `barbershopId` + `phone`. En escala, esto genera latencia creciente y costo de CPU en PostgreSQL.
- **Fix obligatorio**:
  1. Añadir `@@index([barbershopId, phone])` en la migración `add_whatsapp_ai_pro`.
  2. Normalizar el teléfono a E.164 **al momento de guardar** el cliente, no solo en runtime del bot. Los clientes existentes pueden tener el teléfono en formatos heterogéneos.
  3. Documentar en el spec la estrategia de migración/normalización de teléfonos existentes.

### B2. Estado `BLOCKED` de `WhatsAppBotState` no está operacionalizado
- **Referencia spec**: §4 define `WhatsAppBotState { DISCONNECTED, PENDING, CONNECTED, BLOCKED }`.
- **Problema**: ninguna sección describe:
  - Qué evento de Kapso o de Meta transiciona una barbería a `BLOCKED`.
  - Qué comportamiento tienen los crons cuando `state === BLOCKED` (deberían dejar de enviar y alertar al OWNER).
  - Cómo se recupera una barbería de `BLOCKED`.
- **Impacto**: si Meta suspende un WABA por calidad o si un cliente bloquea al número, el sistema seguirá intentando enviar mensajes, acumulando errores 4xx/429 y generando costo innecesario, sin alertar al OWNER.
- **Fix obligatorio**:
  1. Definir eventos concretos que generan la transición a `BLOCKED`.
  2. Añadir un mecanismo de degradación graceful: los crons y el bot inbound deben verificar `whatsappState === CONNECTED` antes de cualquier envío.
  3. Implementar una notificación al OWNER (push/email) cuando el bot entra en `BLOCKED`.

### B3. Idempotencia del webhook inbound está mal ordenada
- **Referencia spec**: §5 — "persiste `metaMessageId` en `WhatsAppMessageLog`; si llega duplicado (Meta retry), se ignora".
- **Problema**: el spec no especifica el **orden** del idempotency check. Si se verifica después de buscar al cliente e invocar al LLM, cada retry de Meta generará una llamada a OpenAI ($$$) y posiblemente respuestas duplicadas al cliente.
- **Race condition adicional**: `WhatsAppMessageLog` no tiene una restricción `@@unique([metaMessageId, direction])` para mensajes inbound. Dos retries concurrentes pueden pasar el check antes de insertar, generando doble procesamiento.
- **Fix obligatorio**:
  1. Verificar `metaMessageId` **primero**, antes de cualquier lógica de negocio o LLM.
  2. Añadir `@@unique([metaMessageId, direction])` al modelo, con manejo de error `P2002` para retries concurrentes.
  3. Retornar `200 OK` inmediatamente si el mensaje ya fue procesado.

### B4. Plantillas Meta deben existir y estar aprobadas antes de habilitar envíos
- **Referencia spec**: §5 — "Creación inicial: durante onboarding WABA, Turnix llama a Kapso API para crear los 3 templates".
- **Problema**: Meta suele requerir revisión manual de templates UTILITY (24-48h). Si el OWNER conecta WABA y configura recordatorios, el cron puede ejecutarse antes de que los templates estén aprobados, fallando silenciosamente.
- **Impacto**: experiencia rota para el OWNER ("conecté WhatsApp pero no llegan recordatorios") y logs de errores de Kapso sin explicación clara en UI.
- **Fix obligatorio**:
  1. Separar `PENDING` en dos estados o añadir uno nuevo: `PENDING_SETUP` (WABA conectado, templates no enviados) y `PENDING_APPROVAL` (templates enviados, esperando aprobación de Meta).
  2. Los crons de reminders NO deben enviar mensajes hasta que `whatsappState === CONNECTED` y los templates requeridos estén confirmados como aprobados.
  3. La UI debe mostrar explícitamente: "Tus templates están en revisión por Meta. Esto puede tardar entre 24 y 48 horas.".

### B5. Flujo "cliente desconocido" es un vector de spam/abuso
- **Referencia spec**: §5 — flujo D. El bot pide el nombre al cliente desconocido y genera una `Notification` al OWNER con ese nombre.
- **Problema**: cualquier persona que conozca el número de WhatsApp de la barbería puede enviar "Soy Juan Pérez, contactame" y generar una notificación falsa al OWNER. No hay rate limiting ni verificación.
- **Impacto**: potencial de spam, notificaciones falsas y pérdida de confianza del OWNER en el bot.
- **Fix obligatorio**:
  1. Añadir rate limiting por `wa_id` en el flujo de "cliente desconocido deja nombre" (ej. máximo 1 intento cada 24h por número).
  2. Hacer que la `Notification` al OWNER sea **opt-in** por barbershop, o al menos advertir claramente "Este número no está en tu agenda".
  3. Documentar la política de PII: qué se persiste, qué se procesa efímeramente y qué no.

### B6. Race condition en los crons de recordatorios 24h y 2h
- **Referencia spec**: §3 — cron busca bookings con `reminder24hSentAt IS NULL` y luego marca el timestamp.
- **Problema**: Vercel Cron no garantiza single-instance. Dos invocaciones concurrentes pueden leer el mismo booking con `reminder24hSentAt = null`, ambas enviar el mensaje, y solo una marcar el timestamp. Resultado: doble mensaje al cliente.
- **Fix obligatorio**: usar un patrón atómico. Ejemplo:
  ```ts
  const updated = await prisma.booking.updateMany({
    where: { id: booking.id, reminder24hSentAt: null },
    data: { reminder24hSentAt: new Date() },
  });
  if (updated.count === 0) continue; // ya fue procesado por otro worker
  // ahora sí enviar
  ```
  Alternativas válidas: `SELECT ... FOR UPDATE` dentro de `$transaction`, o locks distribuidos con `pg_advisory_lock`.

### B7. Verificación de firma Kapso no está documentada con el formato exacto
- **Referencia spec**: §5 — "verifica `X-Kapso-Signature` (HMAC SHA256, secret `KAPSO_WEBHOOK_SECRET`)".
- **Problema**: el spec asume el formato de firma pero no referencia la documentación oficial de Kapso. El formato de Kapso podría coincidir con el de Mercado Pago (`ts=...,v1=...` sobre manifest `id:...;request-id:...;ts:...;`) o podría ser diferente.
- **Impacto**: implementar una verificación incorrecta deja la puerta abierta a ataques de webhook spoofing, o bien rechaza webhooks legítimos.
- **Fix obligatorio**:
  1. Antes de implementar, obtener y referenciar la URL/documento oficial de Kapso sobre verificación de firmas.
  2. Si no hay documentación, inspeccionar el SDK `@kapso/whatsapp-cloud-api` para confirmar el algoritmo exacto.
  3. Incluir en el spec el snippet o pseudocódigo de verificación y el formato del header.

---

## 🟧 IMPORTANTES (corregir en el plan antes de la primera implementación)

### I1. Granularidad del cron de recordatorios 24h
- **Referencia spec**: §3 — ventana de reminder 24h es `[+24h, +25h]`.
- **Problema**: si el cron de Vercel corre una sola vez al día (ej. `0 4 * * *`), solo atenderá bookings en esa ventana exacta. Un booking a las 4:30 AM quedaría fuera.
- **Fix**: documentar explícitamente la frecuencia del cron. Recomendación: ejecutar cada 5 minutos (`*/5 * * * *`) y ajustar la ventana a `[+24h, +24h10m]` (o similar) para evitar duplicados y garantizar cobertura.

### I2. Zona horaria no está explicitada en el prompt del agente
- **Referencia spec**: §5 — tool `getNextBookings` usa `startTime > now`.
- **Problema**: el AGENTS.md fija la zona horaria a `America/Argentina/Buenos_Aires`, pero el system prompt del bot no menciona explícitamente que las fechas/horas mostradas al cliente deben ser en hora argentina.
- **Fix**: añadir al prompt: "Todas las fechas y horas que le indiques al cliente están en hora de Argentina (ART, UTC-3).".

### I3. Rollback plan asume campos `*_deprecated` que no están en la migración
- **Referencia spec**: §6 Rollback #1 — "renombrar campos a `*_deprecated` por 30 días".
- **Problema**: el spec de migración (§4) no menciona estos campos `*_deprecated`. Si la migración se implementa "limpia", el rollback no será no-destructivo.
- **Fix**: o bien (a) añadir los campos `_deprecated` desde el día 1 y migrar gradualmente, o (b) documentar el rollback como destructivo con downtime aceptado.

### I4. Lista de tools del agente es inconsistente entre secciones
- **Referencia spec**: §3 menciona `getShopInfo`, §5 menciona `getServiceCatalog` y `getPublicBookingLink`. Hay discrepancia en nombres y funciones.
- **Fix**: consolidar una única lista de tools, con nombres, propósito y parámetros, y referenciarla desde todos los diagramas.

### I5. Dependencias npm con versiones no verificadas
- **Referencia spec**: §6 — `"ai": "^7.0.0"`, `"@ai-sdk/openai": "^2.0.0"`, `"@kapso/whatsapp-cloud-api": "latest"`.
- **Problema**:
  - `latest` es peligroso para reproducibilidad de builds.
  - `ai` 7.x y `@ai-sdk/openai` 2.x deben ser verificados: ¿existen en julio 2026? ¿`ToolLoopAgent` existe en esa versión?
- **Fix**: fijar versiones exactas o rangos conservadores (`^x.y.z`) validados contra npm. Verificar disponibilidad y API de `ToolLoopAgent` en la etapa 1.

### I6. Rate limiting mensual vs. por minuto no está unificado
- **Referencia spec**: §5 — cap mensual de 1000 mensajes salientes y límite blando de 20 outbound/min por `phone_number_id`.
- **Problema**: el límite de 20/min no se aplica explícitamente en todos los outbound. El inbound puede generar un pico de respuestas sin freno. Además, el cap mensual se mide por conteo en DB, lo que no frena en tiempo real.
- **Fix**: documentar dónde se enforcea cada límite (recomendado: centralizar en `lib/kapso/send.ts`). Definir el comportamiento al exceder 20/min (cola, delay, o error controlado).

### I7. No hay política de logging y PII
- **Referencia spec**: §5 no define qué se loggea del LLM (input del cliente, output del bot, uso de tokens).
- **Problema**: el criterio de éxito §11 requiere "margen >70%" y control de costos, lo cual sin logs de uso es imposible de medir. Además, logs con PII pueden violar políticas de privacidad.
- **Fix**: añadir sección "Logging & Observability" que defina:
  - Qué se loggea y qué se redacta.
  - Cómo se registran tokens/costo por barbershop.
  - Uso de `telemetry` de Vercel AI SDK.

---

## 🟨 MENORES (nice-to-have, no bloquean)

### M1. `confirmBooking` valida `startTime > now + 1h` sin justificar
- **Pregunta**: ¿por qué 1h? Si `reminderGraceMinutes` es configurable, el corte de confirmación debería ser consistente o configurable por barbershop.
- **Sugerencia**: añadir `confirmationCutoffMinutes` con default 60.

### M2. Campo `botConversationId` no tiene uso definido en v0.1
- **Referencia spec**: §4 — "Kapso execution_id (opcional v0.1)".
- **Sugerencia**: si no se usa, eliminarlo del schema inicial (YAGNI).

### M3. `WhatsAppMessageLog.toPhone` no tiene validación de formato
- **Sugerencia**: añadir comentario en schema y validación Zod para garantizar E.164.

### M4. Flujo "cliente desconocido" no es idempotente
- Mismo problema raíz que B3: sin idempotencia fuerte, retries generan notificaciones duplicadas al OWNER.

### M5. `SubscriptionInfo` de NextAuth no incluye `tier`
- **Referencia**: `types/next-auth.d.ts:5-11`.
- **Impacto**: el feature gate `subscriptionTier === 'AI_PRO'` requiere un round-trip a DB en cada request si no se popula en la sesión.
- **Sugerencia**: añadir `tier: SubscriptionTier | null` a `SubscriptionInfo` y popularlo en `auth.ts`.

### M6. Trial no está mencionado para AI PRO
- **Pregunta**: el AGENTS.md dice "Freemium con trial de 14 días sin restricciones". ¿Aplica a AI PRO? ¿Un OWNER nuevo puede usar AI PRO durante el trial sin pagar?
- **Sugerencia**: definir explícitamente en el spec.

### M7. KPI de adopción carece de baseline
- **Referencia spec**: §11 — "3+ barberías activan AI PRO en primer mes".
- **Sugerencia**: añadir métricas base previas al lanzamiento (número total de barberías activas, % con clientes que tienen teléfono cargado, etc.).

---

## 🟦 INCONSISTENCIAS CON CODEBASE TURNIX EXISTENTE

### C1. `Subscription` no tiene campo `tier`
- **Estado actual**: `prisma/schema.prisma:263-281` no tiene `tier`.
- **Spec**: §4 propone añadir `tier SubscriptionTier @default(PRO)`.
- **Nota**: correcto, pero hay que complementar `lib/subscription.ts` con un helper `isAiPro(session)` separado de `hasActiveSubscription`, ya que PRO y AI_PRO comparten "active" pero tienen gates distintos.

### C2. Runtime del route handler del bot
- **Spec §5**: `app/api/wa/inbound/route.ts, runtime nodejs`.
- **Verificación**: Next.js 14 usa `nodejs` por defecto, pero explicitarlo es correcto porque el bot no debe correr en Edge (usa `crypto`, Prisma, etc.).

### C3. Patrón de Server Actions del AGENTS.md
- **Spec §3 onboarding**: describe un flujo de UI → `kapso setup --customer <owner>`.
- **Nota**: verificar que el onboarding use un Server Action (`actions/whatsapp.actions.ts`) siguiendo el patrón auth → authz → zod → try/catch del AGENTS.md.

### C4. `Notification` model existente
- **Referencia**: `actions/notification.actions.ts` ya existe.
- **Spec §5**: `requestCancellation` genera una `Notification` al OWNER.
- **Nota**: el spec no describe el formato/tipo de la notificación. Si reusa el modelo existente, verificar que el mensaje sea comprensible. Si requiere un tipo nuevo, añadir un campo o enum.

### C5. Cambios en `next-auth.d.ts` deben estar en etapa 1
- **Spec §6 etapa 1**: "tipos".
- **Nota**: extender `SubscriptionInfo` con `tier` debe hacerse en la etapa 1, no después, para mantener type safety en todo el stack.

---

## 🟪 SKILLS RELEVANTES NO MENCIONADAS EN EL SPEC

| Skill | Por qué aplica | Cuándo |
|---|---|---|
| `receiving-code-review` | El spec va a recibir review técnica; conviene definir cómo se incorporan cambios | Pre-etapa 1 |
| `systematic-debugging` | Bot + LLM en producción generará bugs difíciles de reproducir | Etapas 6+ |
| `prisma-postgres` / `supabase-postgres-best-practices` | Nuevos índices en `Booking` requieren análisis de query plan | Etapa 1 |
| `vercel-react-best-practices` | Route handlers, runtime y streaming en Next.js 14 | Etapas 5-6 |
| `requesting-code-review` | Al cerrar etapas críticas (agente, crons, billing) | Etapas 6, 7, 8, 9 |
| `pnpm` | Nuevas deps con `latest` y versiones mayores sin verificar | Etapa 1 |
| `shadcn` | Settings UI para `reminderGraceMinutes` | Etapa 10 |

---

## 🎯 RECOMENDACIONES FINALES

1. **No aprobar este spec para implementación sin corregir los 7 bloqueantes**.
2. **Prioridad de correcciones**:
   - Inmediata: B1, B6, B7 (schema + race condition + firma).
   - Corto plazo: B2, B4 (estados de WABA y templates).
   - Producto/legal: B3, B5 (idempotencia y PII/spam).
3. **Decisiones de producto pendientes**:
   - ¿Trial de 14 días aplica a AI PRO?
   - ¿Política de opt-in para notificaciones de clientes desconocidos?
   - ¿Qué se loggea y qué se redacta?
   - ¿Cómo se mide y reporta el margen "costo Meta + LLM < 30% de revenue"?
4. **Validaciones externas antes de etapa 1**:
   - Versión real disponible de `ai` SDK y `@ai-sdk/openai`.
   - Documentación de firma de webhook de Kapso.
   - Precios actuales de Meta para templates UTILITY en LATAM.
   - Límite real de mensajes outbound/mes para WABA nuevos.

---

**Fin del reporte de auditoría.**
