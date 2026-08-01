# 03 — Página de inicio /games

- **Estado:** Implementado
- **Depende de:** [[01-app-shell-routing-auth]] (`lib/games.ts`, `components/Nav.tsx`, layout base), [[02-game-detail-hall-of-fame]] (`lib/games.ts` con `seededScores`)
- **Fecha:** 2026-07-29
- **Objetivo:** Crear la ruta `/games`, portando `home.jsx` y `nav.jsx` de `references/templates/home-about/` (excluyendo `about.jsx`), para que `/games` sea la landing page por defecto del sitio (`/` redirige a `/games`), con el diseño visible en `arcade-vault-standalone.html`.

## Scope

**Dentro del alcance:**
- Nueva ruta `app/games/page.tsx`: landing page completa portada de `home.jsx` — hero (título, subtítulo, CTAs, silhouettes flotantes decorativas, scroll hint), sección "¿POR QUÉ ARCADE VAULT?" (4 feature cards con iconos pixel), sección "JUEGOS DISPONIBLES AHORA" (mini-rail con los primeros 6 juegos de `GAMES`), sección de stats (3 bloques), sección "ACTIVIDAD EN VIVO" (ticker de últimas puntuaciones + top 5 jugadores del día), sección de precios (plan único + FAQ), y CTA final.
- Animación `reveal`-on-scroll (IntersectionObserver) igual que el original, como hook de cliente.
- Todas las clases CSS nuevas que requiere esta pantalla (`home-*`, `feature-*`, `mini-rail`, `mini-card`, `stat-*`, `activity-*`, `ticker`, `tick-row`, `top-*`, `pricing-*`, `price-card`, `faq-*`, `final-*`, `reveal`) añadidas a `app/globals.css`, portadas literalmente del `styles.css` de referencia.
- Nueva ruta `app/biblioteca/page.tsx`: recibe el contenido actual de `app/page.tsx` (grid de juegos con búsqueda/filtro) sin cambios funcionales, solo reubicado.
- `app/page.tsx` (`/`) pasa a ser un redirect permanente a `/games` (`redirect("/games")` de `next/navigation`, Server Component).
- `components/Nav.tsx`: el logo pasa a apuntar a `/games`; nuevo link "Inicio" → `/games`; el link "Biblioteca" pasa a apuntar a `/biblioteca` (antes apuntaba a `/`); `isActive` se actualiza para reconocer `/games` ("Inicio") y `/biblioteca` + `/game/*` ("Biblioteca").
- Datos de actividad ("ÚLTIMAS PUNTUACIONES" y "TOP JUGADORES · HOY") generados con `seededScores()` de `lib/games.ts` en vez de los arrays hardcodeados del template:
  - Ticker: `seededScores(1, 7)`, asignando un juego de `GAMES` por índice (rotando) y una lista fija de tiempos relativos (`"hace 2 min"`, `"hace 5 min"`, …) igual que el original.
  - Top jugadores: `seededScores(2, 5)`.
- Botones "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →", "INSERTAR MONEDA →" navegan a `/biblioteca`. "CREAR CUENTA", "EMPEZAR GRATIS →" navegan a `/auth`. "VER SALÓN →" navega a `/hall-of-fame`. Las mini-cards de la sección de juegos navegan a `/game/[id]`.
- `app/game/[id]/page.tsx`: botón "VOLVER AL VAULT" → `/biblioteca` (antes `/`).
- `app/hall-of-fame/page.tsx`: botón "VOLVER A LA BIBLIOTECA" → `/biblioteca` (antes `/`).
- `components/AuthForm.tsx`: los dos `router.push("/")` tras login/registro pasan a `router.push("/biblioteca")`.
- Componentes de cliente necesarios (`"use client"`) para el hook `reveal` e IntersectionObserver.

**Fuera de alcance:**
- `about.jsx` — no se porta ninguna pantalla "Acerca de" ni su link de Nav.
- Persistencia real de puntuaciones o actividad en vivo real (todo sigue siendo mock/determinista vía `seededScores`).
- Cambios funcionales a `/game/[id]`, `/hall-of-fame`, `/auth` más allá de actualizar los enlaces que asumían `/` = grid.

## Modelo de datos

Esta pantalla no introduce estructuras nuevas: reutiliza `Game` y `seededScores()` ya definidos en `lib/games.ts`. Se omite esta sección.

## Plan de implementación

1. **`app/globals.css`** — Añadir el bloque `HOME PAGE` (`.home*`, `.feature-*`, `.mini-*`, `.stat-*`, `.activity-*`, `.ticker`, `.tick-row`, `.top-*`, `.pricing-*`, `.price-card`, `.faq-*`, `.final-*`, `.reveal`, `@keyframes float/bounce`) portado literalmente de `styles.css`.
2. **`hooks/useReveal.ts`** (nuevo) — Hook `IntersectionObserver` para `.reveal`, portado de `home.jsx`.
3. **`components/FloatingSilhouettes.tsx`** (nuevo) — 8 SVGs decorativos del hero.
4. **`components/FeatureIcon.tsx`** (nuevo) — 4 iconos SVG pixel (`GAMEPAD`, `FREE`, `TROPHY`, `ROCKET`).
5. **`components/MiniGameCard.tsx`** (nuevo) — Card compacta para "JUEGOS DISPONIBLES AHORA", navega a `/game/[id]`.
6. **`app/games/page.tsx`** (nuevo, `"use client"`) — Ensambla las 7 secciones del landing. CTAs a `/biblioteca`, `/auth`, `/hall-of-fame`. Ticker vía `seededScores(1, 7)`, top jugadores vía `seededScores(2, 5)`.
7. **`app/biblioteca/page.tsx`** (nuevo) — Mueve el contenido íntegro de `app/page.tsx` (grid con búsqueda/filtro) sin cambios funcionales.
8. **`app/page.tsx`** — Se reemplaza por un Server Component que hace `redirect("/games")` (`next/navigation`).
9. **`components/Nav.tsx`** — Logo → `/games`. Link "Biblioteca" → `/biblioteca`. Nuevo link "Inicio" → `/games`. `isActive` reconoce `/games` para "Inicio" y `/biblioteca` + `/game/*` para "Biblioteca".
10. **`components/AuthForm.tsx`** — Los dos `router.push("/")` post-login/registro pasan a `router.push("/biblioteca")`.
11. **`app/game/[id]/page.tsx`** — Botón "VOLVER AL VAULT" → `/biblioteca`.
12. **`app/hall-of-fame/page.tsx`** — Botón "VOLVER A LA BIBLIOTECA" → `/biblioteca`.
13. Verificar `npm run build` (TypeScript + ESLint) y probar manualmente: `/` redirige a `/games`, navegación completa entre `/games`, `/biblioteca`, `/game/[id]`, `/hall-of-fame`, `/auth`, en desktop y mobile (≤840px).

## Criterios de aceptación

- [x] `/` redirige automáticamente a `/games`.
- [x] `/games` renderiza las 7 secciones del landing (hero, why, games preview, stats, actividad en vivo, pricing, CTA final), visualmente equivalente a `arcade-vault-standalone.html`.
- [x] Las 4 feature cards, las 6 mini-cards de juegos y los 8 silhouettes decorativos del hero se muestran correctamente.
- [x] Las secciones `reveal` inician invisibles y aparecen al hacer scroll hasta ellas.
- [x] "JUEGOS DISPONIBLES AHORA" muestra los primeros 6 juegos de `GAMES`; cada mini-card navega a `/game/[id]` correspondiente.
- [x] "ÚLTIMAS PUNTUACIONES" muestra 7 filas de `seededScores(1, 7)` con jugador, juego (rotado), puntuación y tiempo relativo.
- [x] "TOP JUGADORES · HOY" muestra 5 filas de `seededScores(2, 5)` con barra de progreso.
- [x] `/biblioteca` muestra el grid de juegos con búsqueda y filtro por categoría, funcionalmente idéntico al `app/page.tsx` anterior.
- [x] Desde `/games`: "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →", "INSERTAR MONEDA →" → `/biblioteca`; "CREAR CUENTA"/"EMPEZAR GRATIS →" → `/auth`; "VER SALÓN →" → `/hall-of-fame`.
- [x] El logo del Nav navega a `/games`; el link "Inicio" navega a `/games` y se marca activo solo ahí; el link "Biblioteca" navega a `/biblioteca` y se marca activo en `/biblioteca` y en `/game/*`.
- [x] Tras login o registro en `/auth`, se redirige a `/biblioteca` (no a `/`).
- [x] "VOLVER AL VAULT" (en `/game/[id]`) y "VOLVER A LA BIBLIOTECA" (en `/hall-of-fame`) navegan a `/biblioteca`.
- [x] La página `/games` es responsive en los breakpoints ya definidos en el CSS portado.
- [x] `npm run build` compila sin errores de TypeScript ni de ESLint.

## Decisiones tomadas y descartadas

- **`/` como redirect a `/games` en vez de fusionar contenido** — Se prefiere un `redirect()` explícito de Server Component antes que mover el JSX del landing directamente a `app/page.tsx`, para mantener `/games` como URL canónica y evitar tener el mismo contenido servido en dos rutas distintas.
- **Grid de biblioteca movido a `/biblioteca`** — Nombre elegido por coincidir con `biblioteca.jsx` del template original y con el label ya existente en el Nav ("Biblioteca"), evitando ambigüedad con `/game/[id]` (singular).
- **Actualizar todos los enlaces existentes que asumían `/` = grid** — Se decide corregir Nav, `AuthForm`, `game/[id]` y `hall-of-fame` en este mismo spec en vez de dejarlos rotos, porque de lo contrario el cambio de raíz dejaría 6 puntos de navegación inconsistentes en la app.
- **`seededScores()` en vez de arrays hardcodeados** — Se reutiliza la función determinista ya existente en `lib/games.ts` (introducida en spec 02) para mantener consistencia con el resto del proyecto y evitar duplicar datos mock inventados a mano.
- **Tiempos relativos fijos para el ticker** — `seededScores()` no genera un campo de tiempo relativo ("hace 2 min"), solo `date`. Se decide mantener una lista fija de tiempos relativos (igual que el template original) asignada por índice a las filas generadas, en vez de mostrar la fecha real, para conservar la sensación de "actividad en vivo" del diseño original.
- **`about.jsx` explícitamente fuera de alcance** — Por pedido explícito del usuario; no se agrega pantalla "Acerca de" ni su entrada de Nav.
- **Client Component completo para `/games`** — A diferencia de `/game/[id]` (spec 02), esta pantalla necesita `useReveal` (IntersectionObserver) en múltiples secciones, por lo que se marca toda la página como `"use client"` en vez de aislar solo las partes interactivas, siguiendo el mismo patrón que `app/page.tsx` actual.

## Riesgos identificados

- **Enlaces externos o marcadores a `/`** — Si algún usuario tenía guardada la URL raíz esperando ver el grid directamente, ahora verá el landing tras el redirect. Riesgo aceptado: es el comportamiento pedido explícitamente.
- **Redirect añade un salto extra** — `/` → `/games` implica una petición adicional (redirect 307/308) antes de renderizar. Impacto mínimo dado que es un Server Component sin lógica pesada.
- **Layout shift por IntersectionObserver** — Si `useReveal` no limpia bien sus observers al desmontar, podría acumular listeners en navegaciones repetidas hacia/desde `/games`. Mitigación: portar `return () => io.disconnect()` del original tal cual.
