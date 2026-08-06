# 05 — Integración de Supabase

- **Estado:** Implementado
- **Depende de:** [[01-app-shell-routing-auth]] (Auth mock actual, que esta spec no modifica pero convive con)
- **Fecha:** 2026-08-06
- **Objetivo:** Integrar el cliente de Supabase (browser, server y middleware) en la aplicación Next.js usando `@supabase/ssr`, dejando la infraestructura lista y verificada para que un spec futuro reemplace la sesión mock y conecte el formulario de `/auth` a Supabase Auth real.

## Scope

**Dentro del alcance:**
- Dependencias nuevas en `package.json`: `@supabase/supabase-js` y `@supabase/ssr`.
- `lib/supabase/client.ts` (nuevo) — cliente de Supabase para uso en Client Components (`createBrowserClient`).
- `lib/supabase/server.ts` (nuevo) — cliente de Supabase para uso en Server Components/Server Actions/Route Handlers (`createServerClient`, con manejo de cookies vía `next/headers`).
- `lib/supabase/middleware.ts` (nuevo) — helper `updateSession(request)` que refresca el token/cookie de sesión de Supabase en cada request, siguiendo el patrón estándar de `@supabase/ssr`.
- `middleware.ts` (nuevo, raíz del proyecto) — invoca `updateSession` en cada request (matcher amplio, excluyendo estáticos), sin gatear ni redirigir ninguna ruta.
- `.env.local.example` — añadir placeholders `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ya existen en `.env.local` real del usuario).
- Verificación de conectividad real contra el proyecto Supabase vinculado (`jqvjxolkljoxkgozyxuk`) usando las herramientas MCP de Supabase (no se crea una ruta de diagnóstico nueva en la app).

**Fuera de alcance:**
- Cualquier cambio a `/auth`, `AuthForm.tsx` o `lib/session.ts` — el formulario sigue usando la sesión mock de `localStorage` tal como está.
- Reemplazo del `Nav` para leer sesión real de Supabase.
- Autenticación con OAuth (Google/GitHub) — los botones siguen decorativos.
- Protección de rutas / redirects basados en sesión en el `middleware.ts` (solo refresca cookies, no gatea nada).
- Cualquier tabla, esquema o migración en la base de datos de Supabase (no hay modelo de datos de aplicación en este spec, solo Auth como servicio).
- Ruta de diagnóstico/API en la app para verificar la conexión (se verifica vía MCP en su lugar).

## Modelo de datos

No se introduce modelo de datos de aplicación en este spec. Supabase se integra únicamente como servicio de autenticación (Auth); no se crean tablas, esquemas ni migraciones en la base de datos.

## Plan de implementación

1. **`package.json`** — Añadir dependencias `@supabase/supabase-js` y `@supabase/ssr`.
2. **`.env.local.example`** — Añadir `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` con comentario explicando su origen (Supabase Dashboard → Project Settings → API).
3. **`lib/supabase/client.ts`** (nuevo) — Exporta `createClient()` usando `createBrowserClient` de `@supabase/ssr`, leyendo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. **`lib/supabase/server.ts`** (nuevo) — Exporta `createClient()` (async) usando `createServerClient` de `@supabase/ssr`, integrando `cookies()` de `next/headers` para get/set/remove.
5. **`lib/supabase/middleware.ts`** (nuevo) — Exporta `updateSession(request: NextRequest)`: crea un cliente de Supabase con manejo de cookies sobre `NextResponse`, llama a `supabase.auth.getUser()` para refrescar el token, y devuelve la `NextResponse` con las cookies actualizadas.
6. **`proxy.ts`** (nuevo, raíz) — Importa `updateSession` y lo invoca en cada request vía `export async function proxy(request)`; define `config.matcher` excluyendo `_next/static`, `_next/image`, favicon y archivos estáticos comunes. *(Nota: el plan original decía `middleware.ts`/`export function middleware`, pero Next.js 16.2.12 deprecó esa convención en favor de `proxy.ts`/`export function proxy` — ver `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`. El comportamiento es idéntico, solo cambia el nombre de archivo/función.)*
7. **Verificación de conectividad** — Usar las herramientas MCP de Supabase (`get_project_url`, `list_tables`) para confirmar que el proyecto vinculado (`jqvjxolkljoxkgozyxuk`) responde y que las credenciales en `.env.local` corresponden a ese proyecto.
8. **Verificación de build** — Ejecutar `npm run dev` y navegar por las rutas existentes (`/`, `/auth`, `/hall-of-fame`, `/game/[id]`) confirmando que no hay errores en consola ni en la respuesta del middleware (headers/cookies se setean sin romper la navegación). Ejecutar `npm run build` para confirmar que compila sin errores de TypeScript/ESLint.

## Criterios de aceptación

- [x] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr` como dependencias, y `npm install` las resuelve sin conflictos.
- [x] `.env.local.example` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sin valores reales.
- [x] `lib/supabase/client.ts` exporta un cliente funcional para Client Components (verificable importándolo sin errores de tipos).
- [x] `lib/supabase/server.ts` exporta un cliente funcional para Server Components/Actions, usando `cookies()` de `next/headers` correctamente (sin errores de build).
- [x] `proxy.ts` (renombrado desde `middleware.ts` por deprecación en Next.js 16 — ver Plan de implementación paso 6) se ejecuta en cada request de la app sin alterar el contenido ni el status code de ninguna ruta existente. Sin sesión activa no hay cookies `sb-*` que refrescar (comportamiento esperado de `auth.getUser()` sin token); la ejecución del proxy en cada ruta se confirmó vía `npm run dev` + requests a todas las rutas.
- [x] Navegar por `/`, `/games`, `/auth`, `/hall-of-fame` y `/game/[id]` no muestra errores en consola del navegador ni del servidor relacionados con Supabase o el proxy.
- [x] Las herramientas MCP de Supabase (`get_project_url`, `list_tables`) confirman conectividad contra el proyecto `jqvjxolkljoxkgozyxuk` usando las credenciales de `.env.local`.
- [x] `npm run build` compila sin errores de TypeScript ni de ESLint.

## Decisiones tomadas y descartadas

- **`@supabase/ssr` en vez de `@supabase/auth-helpers-nextjs`** — El paquete `auth-helpers-nextjs` está deprecado; `@supabase/ssr` es el patrón recomendado actualmente por Supabase para App Router con clientes separados de browser/server y manejo explícito de cookies.
- **Middleware solo refresca sesión, no gatea rutas** — Por pedido explícito del usuario, la protección de rutas queda fuera de alcance; el middleware únicamente mantiene el token de Supabase vigente en cada request.
- **Sin ruta de diagnóstico en la app** — Por pedido explícito del usuario (Opción B), la verificación de conectividad se hace vía herramientas MCP de Supabase en vez de crear un endpoint temporal en la aplicación.
- **No se toca `/auth`, `AuthForm.tsx` ni `lib/session.ts` en este spec** — Por pedido explícito del usuario, la sesión mock convive sin cambios; la migración a Supabase Auth real (incluyendo email/password en el formulario) queda para un spec futuro.
- **Solo email/password diferido, sin OAuth en este ni el próximo spec de auth aún** — Por pedido explícito del usuario, Google/GitHub se dejan fuera de alcance por ahora; los botones siguen decorativos.
- **`.env.local` real ya existe, no se generan credenciales nuevas** — El usuario confirmó que el proyecto Supabase (`jqvjxolkljoxkgozyxuk`) y sus credenciales ya están configurados; este spec solo añade el placeholder en `.env.local.example` para documentación, sin tocar los valores reales.

## Riesgos identificados

- **Matcher del middleware mal configurado** — Si el `config.matcher` de `middleware.ts` no excluye correctamente los archivos estáticos (`_next/static`, `_next/image`, favicon), el middleware podría ejecutarse innecesariamente en cada asset y degradar el rendimiento. Mitigación: usar el patrón de matcher recomendado por la documentación de `@supabase/ssr` en `node_modules/next/dist/docs/`.
- **Manejo incorrecto de cookies en `lib/supabase/server.ts`** — Un error común al portar el patrón de `@supabase/ssr` es intentar escribir cookies desde un Server Component (no permitido en Next.js), lo que lanza errores en build/runtime. Mitigación: seguir el patrón oficial donde el `set`/`remove` de cookies se maneja con try/catch silencioso en Server Components (solo el middleware y las Server Actions pueden escribir cookies).
- **Desalineación entre credenciales de `.env.local` y el proyecto MCP vinculado** — Si el usuario tiene un `.env.local` apuntando a un proyecto Supabase distinto al vinculado en `.mcp.json` (`jqvjxolkljoxkgozyxuk`), la verificación de conectividad podría dar falsos positivos/negativos. Mitigación: el paso de verificación (criterio de aceptación) confirma explícitamente que ambas fuentes coinciden.
