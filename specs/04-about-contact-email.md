# 04 — Página About y envío de correo de contacto

- **Estado:** Implementado
- **Depende de:** [[03-games-landing-page]] (`components/Nav.tsx`, layout base, patrón de rutas en `app/`)
- **Fecha:** 2026-08-01
- **Objetivo:** Crear la ruta `/about` portando `about.jsx` de `references/templates/home-about/` (hero + formulario de contacto), con envío real de correo vía Resend usando un Server Action, notificando al equipo y confirmando al remitente.

## Scope

**Dentro del alcance:**
- Nueva ruta `app/about/page.tsx`: portada de `about.jsx` — hero "ACERCA DE ARCADE VAULT" (kicker, título, misión, 3 highlights), divider decorativo, y sección de contacto (intro + tips + formulario).
- Formulario de contacto (`components/ContactForm.tsx`, `"use client"`): campos NOMBRE, CORREO ELECTRÓNICO, MENSAJE; validación de campos vacíos con animación `shake` (igual que el template); estado de envío (`idle` → `sending` → `success` / `error`).
- Server Action (`lib/actions/contact.ts`) que recibe los datos del formulario, valida en servidor y envía dos correos vía Resend:
  1. Notificación al equipo, a `jamd221195@gmail.com`, con nombre/correo/mensaje del remitente.
  2. Confirmación automática al correo que puso el usuario en el formulario.
- Integración de Resend: dependencia `resend` añadida a `package.json`, cliente instanciado con `RESEND_API_KEY`.
- Variables de entorno placeholder en `.env.local.example` (no se commitea `.env.local` real): `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
- Estado de éxito reemplaza la simulación fake del template (`setTimeout`) por el resultado real del Server Action — se mantiene la estética "terminal" (`.terminal-success`) pero ahora refleja envío real.
- Estado de error inline en el formulario si el Server Action falla (API key inválida, error de red, etc.), con opción de reintentar.
- Todas las clases CSS necesarias (`about-*`, `contact-*`, `terminal-success`, `.shake`) añadidas a `app/globals.css`, portadas literalmente de `styles.css`.
- `components/Nav.tsx`: nuevo link "Acerca de" → `/about`, en desktop y menú móvil; `isActive` reconoce `/about`.

**Fuera de alcance:**
- Persistencia de mensajes de contacto en base de datos — el mensaje solo se envía por correo, no se guarda.
- Rate limiting o protección anti-spam (captcha, honeypot) del formulario.
- Panel de administración para ver mensajes recibidos.
- Configuración real de la cuenta Resend (dominio verificado, API key real) — el usuario la proveerá luego; esta spec solo prepara el código y los placeholders.
- Cambios a otras rutas/páginas existentes más allá de agregar el link "Acerca de" en el Nav.

## Modelo de datos

No se introduce persistencia de datos (ni base de datos, ni localStorage). Se definen tipos TypeScript in-memory para el flujo del formulario:

```ts
// lib/actions/contact.ts
type ContactFormInput = {
  name: string;
  email: string;
  message: string;
};

type ContactActionResult =
  | { ok: true }
  | { ok: false; error: string };
```

`ContactFormInput` se valida en el Server Action (campos no vacíos, `email` con formato válido) antes de invocar Resend. `ContactActionResult` es el valor de retorno que consume `ContactForm.tsx` para decidir entre estado `success` o `error`.

## Plan de implementación

1. **`package.json`** — Añadir dependencia `resend`.
2. **`.env.local.example`** (nuevo) — Placeholders: `RESEND_API_KEY=`, `CONTACT_TO_EMAIL=jamd221195@gmail.com`, `CONTACT_FROM_EMAIL=onboarding@resend.dev`. Documentar en comentario que `.env.local` real no se commitea.
3. **`app/globals.css`** — Añadir el bloque `ABOUT PAGE` (`.about-*`, `.contact-*`, `.terminal-success`, `.shake`, `@keyframes shake`) portado literalmente de `styles.css`.
4. **`hooks/useReveal.ts`** — Reutilizar el hook existente (ya creado en spec 03) para las animaciones `reveal` de `about-divider` y `about-contact`.
5. **`lib/actions/contact.ts`** (nuevo, `"use server"`) — Server Action `sendContactMessage(input: ContactFormInput): Promise<ContactActionResult>`: valida campos, instancia cliente Resend con `RESEND_API_KEY`, envía correo de notificación a `CONTACT_TO_EMAIL` y correo de confirmación a `input.email` desde `CONTACT_FROM_EMAIL`; captura errores y devuelve `{ ok: false, error }`.
6. **`components/ContactForm.tsx`** (nuevo, `"use client"`) — Formulario portado de la sección contact de `about.jsx`: estado `idle | sending | success | error`, validación de campos vacíos con `shake`, invoca `sendContactMessage` vía `useTransition`/`action`, muestra `.terminal-success` en éxito y mensaje de error inline con botón de reintentar en error.
7. **`app/about/page.tsx`** (nuevo) — Ensambla hero, divider y `<ContactForm />`, portado de `about.jsx`.
8. **`components/Nav.tsx`** — Nuevo link "Acerca de" → `/about` en desktop y menú móvil; `isActive` reconoce `/about`.
9. Verificar `npm run build` (TypeScript + ESLint) y probar manualmente: navegación a `/about` desde el Nav, validación de campos vacíos, envío exitoso (con credenciales reales que proveerá el usuario) y estado de error simulando fallo (ej. `RESEND_API_KEY` inválida), en desktop y mobile.

## Criterios de aceptación

- [ ] `/about` renderiza el hero (kicker, título, misión, 3 highlights), el divider decorativo y la sección de contacto, visualmente equivalente al template de referencia.
- [ ] Las secciones `reveal` (`about-divider`, `about-contact`) inician invisibles y aparecen al hacer scroll hasta ellas.
- [ ] Enviar el formulario con algún campo vacío dispara la animación `shake` y no invoca el Server Action.
- [ ] Enviar el formulario con datos válidos invoca `sendContactMessage`, que envía un correo a `CONTACT_TO_EMAIL` con nombre/correo/mensaje y un correo de confirmación a la dirección ingresada por el usuario.
- [ ] Tras un envío exitoso, se muestra el estado `.terminal-success` con el nombre del remitente y un botón para enviar otro mensaje que resetea el formulario.
- [ ] Si el Server Action devuelve error, el formulario muestra un mensaje de error inline y permite reintentar sin perder los datos ingresados.
- [ ] El Nav muestra el link "Acerca de" → `/about` en desktop y menú móvil, marcado activo solo en `/about`.
- [ ] `.env.local.example` documenta `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` sin valores reales sensibles.
- [ ] `npm run build` compila sin errores de TypeScript ni de ESLint.

## Decisiones tomadas y descartadas

- **Server Action en vez de API Route** — Se prefiere un Server Action (`lib/actions/contact.ts`) invocado directamente desde `ContactForm.tsx`, siguiendo el patrón recomendado en Next.js 16 para mutaciones simples desde formularios, evitando crear una capa adicional de `app/api/contact/route.ts`.
- **Dos correos (equipo + confirmación) en vez de uno solo** — Por pedido explícito del usuario: el equipo recibe la notificación con el contenido del mensaje, y el remitente recibe confirmación automática de que su mensaje fue recibido.
- **Placeholders en `.env.local.example` en vez de credenciales reales** — El usuario proveerá su propio `RESEND_API_KEY` y dominio verificado más adelante; esta spec deja el código listo para conectarlos sin hardcodear secretos.
- **`CONTACT_TO_EMAIL=jamd221195@gmail.com` como valor de ejemplo, no hardcodeado en código** — Se usa como variable de entorno (no literal en `lib/actions/contact.ts`) para que sea configurable sin tocar código si cambia el destinatario.
- **Estado de error inline en vez de solo log de servidor** — Por pedido explícito del usuario, para que el usuario del formulario sepa si su mensaje no llegó y pueda reintentar.
- **Se mantiene la estética `.terminal-success` del template** — En vez de rediseñar el estado de éxito, se reutiliza el componente visual ya definido en `styles.css`, ahora alimentado por el resultado real del Server Action en vez de un `setTimeout` simulado.

## Riesgos identificados

- **`RESEND_API_KEY` no configurada en desarrollo** — Hasta que el usuario provea sus credenciales reales, el envío fallará en local. Mitigación: el estado de error inline ya cubre este caso; no bloquea el resto del desarrollo/build.
- **Dominio de remitente no verificado en Resend** — Si `CONTACT_FROM_EMAIL` no está en un dominio verificado, Resend puede rechazar el envío del correo de confirmación. Mitigación: se documenta en `.env.local.example` que se puede usar el dominio de pruebas `onboarding@resend.dev` mientras no haya dominio propio verificado.
- **Sin protección anti-spam** — Al quedar explícitamente fuera de alcance, el formulario es vulnerable a envíos automatizados masivos una vez publicado. Riesgo aceptado para esta spec; se puede abordar en una spec futura (rate limiting/captcha).
- **Doble envío de correo por doble submit** — Si el usuario hace clic varias veces antes de que el Server Action responda, podrían dispararse envíos duplicados. Mitigación: el botón de envío se deshabilita durante el estado `sending`.
