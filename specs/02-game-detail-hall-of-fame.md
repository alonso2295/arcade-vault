# 02 — Detalle de juego & Salón de la Fama

- **Estado:** Implementado
- **Depende de:** [[01-app-shell-routing-auth]] (`lib/games.ts`, `lib/session.ts`, `hooks/useSession`, rutas placeholder)
- **Fecha:** 2026-07-29
- **Objetivo:** Reemplazar los placeholders de `/game/[id]` y `/hall-of-fame` por su contenido real, portado de `references/templates/detalle.jsx` y `references/templates/salon.jsx`.

## Contexto

Spec 1 dejó las rutas `/game/[id]` y `/hall-of-fame` como placeholders ("Próximamente"), dejando explícitamente su contenido real fuera de alcance para specs posteriores. Este spec cubre esas dos pantallas. El Reproductor (`/game/[id]/play`) y la persistencia de puntuaciones (`av_scores`) quedan fuera de este spec y se abordarán en un spec futuro dedicado al Reproductor.

## Scope

**Dentro del alcance:**
- `app/game/[id]/page.tsx`: portada del juego (cover con clase CSS del template), tags (categoría, "1 JUGADOR", "TECLADO / TÁCTIL", "RETRO 1985"), título, descripción larga (`game.long`), tira de estadísticas (partidas, mejor global, dificultad fija a 3/5 estrellas), botones "▶ JUGAR AHORA" (→ `/game/[id]/play`) y "VOLVER AL VAULT" (→ `/`), y leaderboard lateral con 10 puntuaciones generadas vía `seededScores(id.length * 17 + 3, 10)`.
- Si el `id` de la URL no corresponde a ningún juego en `GAMES`, mostrar `notFound()` (404 de Next.js) en vez de renderizar vacío (el template original simplemente no renderizaba nada — se decide usar la convención idiomática de Next en su lugar).
- `app/hall-of-fame/page.tsx`: encabezado, tabs de juegos (`GAMES`, chip activo = juego seleccionado, por defecto el primero), podio (oro/plata/bronce) con los 3 primeros puestos de `seededScores(tab.length * 23 + 7, 12)`, tabla completa de 12 puestos, fila "TU MEJOR MARCA" visible solo con sesión activa (usa `useSession()`), y botón "VOLVER A LA BIBLIOTECA" (→ `/`).
- Ambas pantallas son Client Components donde se requiera estado (`hall-of-fame` necesita `useState` para el tab activo y `useSession`; `game/[id]` no necesita estado de cliente y puede ser Server Component).

**Fuera del alcance:**
- Reproductor (`/game/[id]/play`), HUD, CRT simulado → spec futuro.
- Persistencia real de puntuaciones (`av_scores` en localStorage) → spec futuro del Reproductor.
- Cualquier cambio a `lib/games.ts`, `lib/session.ts`, `Nav` o `Auth` (ya completos en Spec 1).

## Plan de implementación

1. `app/game/[id]/page.tsx` — Server Component. Busca el juego en `GAMES` por `params.id`; si no existe, `notFound()`. Renderiza el markup de `detalle.jsx` con clases CSS existentes (`av-detail`, `detail-cover`, `cover-bg`, `detail-info`, `detail-tags`, `stat-strip`, `detail-actions`, `leaderboard`, `lb-row`). Botones como `Link` de Next en vez de `navigate()`.
2. `app/hall-of-fame/page.tsx` — Client Component (`"use client"`) portando `salon.jsx`: `useState` para `tab` (id de juego activo), `useMemo` para `rows` vía `seededScores`, `useSession()` para el usuario actual. Markup con clases existentes (`av-hall`, `hall-head`, `hall-tabs`, `podium`, `podium-slot`, `hall-table`).

## Criterios de aceptación

- [x] `/game/bloque-buster` (y el resto de ids válidos) muestra cover, tags, título, descripción, stat-strip y leaderboard con 10 filas.
- [x] `/game/no-existe` responde 404 en vez de página en blanco.
- [x] "▶ JUGAR AHORA" navega a `/game/[id]/play`; "VOLVER AL VAULT" navega a `/`.
- [x] `/hall-of-fame` muestra tabs por cada juego de `GAMES`, podio con top 3 y tabla con 12 filas del juego seleccionado; cambiar de tab recalcula podio y tabla.
- [x] Con sesión activa (`av_user` set), la tabla muestra la fila "TU MEJOR MARCA EN {juego}" al final; sin sesión, no aparece.
- [x] "VOLVER A LA BIBLIOTECA" navega a `/`.
- [x] `npm run build` compila sin errores de TypeScript ni ESLint.

## Decisiones tomadas y descartadas

- **`/game/[id]` como Server Component** — No requiere estado de cliente (el leaderboard es determinístico por `id`), por lo que se evita `"use client"` innecesario, a diferencia de `salon.jsx` que sí necesita tabs interactivos.
- **404 real para ids inexistentes** — El template original no renderizaba nada (`if (!game) return null`); se prefiere `notFound()` de Next por ser la convención idiomática del App Router.
