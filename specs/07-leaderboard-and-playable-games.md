# 07 — Leaderboard real (Supabase) & listado de juegos jugables

- **Estado:** Aprobada
- **Depende de:** [[05-supabase-integration]] (clientes Supabase browser/server ya configurados), [[06-asteroids-player]] (`AsteroidsPlayer.tsx`, `AsteroidsState` con `score`/`state` al terminar partida), [[01-app-shell-routing-auth]] (`lib/games.ts`, `lib/session.ts`)
- **Fecha:** 2026-08-16
- **Objetivo:** Persistir puntuaciones reales de Asteroids en una tabla `scores` de Supabase (guardadas al terminar la partida, leídas en `/game/asteroides` y el tab de Asteroids en `/hall-of-fame`) y añadir una ruta `/jugables` que liste únicamente los juegos con reproductor implementado, marcados vía un nuevo campo `playable` en `Game`.

## Scope

**Dentro del alcance:**
- Nuevo campo `playable: boolean` en el tipo `Game` (`lib/games.ts`) — `true` solo para `asteroides`, `false`/ausente (default `false`) para el resto.
- Nueva ruta `app/jugables/page.tsx` — lista solo los juegos con `playable === true` (hoy: Asteroides), reutilizando el patrón visual de cards existente (ej. `MiniGameCard` o similar).
- Nueva tabla `scores` en Supabase (migración vía MCP `apply_migration`): `id`, `game_id`, `player_name`, `score`, `created_at`.
- RLS en `scores`: policies públicas de `insert` y `select` para el rol `anon`.
- `lib/supabase/scores.ts` (nuevo) — funciones `saveScore({ gameId, playerName, score })` y `getTopScores(gameId, limit)` usando el cliente Supabase.
- `components/games/AsteroidsPlayer.tsx` — al llegar a `state === 'gameover'`, llama a `saveScore` con el nombre de la sesión mock (o "ANÓNIMO" si no hay sesión) y el score final.
- `app/game/[id]/page.tsx` — si `id === "asteroides"`, el leaderboard lateral usa `getTopScores("asteroides", 10)` en vez de `seededScores`; el resto de ids sigue con `seededScores`.
- `app/hall-of-fame/page.tsx` — el tab "asteroides" usa scores reales (podio + tabla); el resto de tabs sigue con `seededScores`.

**Fuera de alcance:**
- Migrar `lib/games.ts`/`GAMES` completo a Supabase — sigue siendo el array mock en código.
- Supabase Auth real / cambios a `/auth`, `AuthForm.tsx`, `lib/session.ts`.
- Cualquier otro juego además de Asteroides (no hay más reproductores implementados).
- Edición/borrado de scores, moderación, límites anti-abuso (rate limiting) sobre los inserts.
- Cambios al diseño visual de `/game/[id]` o `/hall-of-fame` más allá de la fuente de datos (misma UI, distinto origen de datos).

## Modelo de datos

**Tabla `scores` (Supabase, nueva migración):**

```sql
create table scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  player_name text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

alter table scores enable row level security;

create policy "scores_select_public" on scores
  for select to anon using (true);

create policy "scores_insert_public" on scores
  for insert to anon with check (true);
```

**`lib/games.ts` — tipo `Game` extendido:**

```ts
export interface Game {
  // ...campos existentes
  playable?: boolean; // default implícito: false/undefined
}
```

**`lib/supabase/scores.ts` (nuevo):**

```ts
export interface ScoreRow {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  created_at: string;
}

async function saveScore(params: { gameId: string; playerName: string; score: number }): Promise<void>
async function getTopScores(gameId: string, limit: number): Promise<ScoreRow[]>
```

## Plan de implementación

1. **Migración Supabase** (`apply_migration` vía MCP) — Crear tabla `scores` con columnas `id`, `game_id`, `player_name`, `score`, `created_at`, RLS habilitado y policies públicas de `select`/`insert` para `anon`, tal como se definió en el Modelo de datos.
2. **`lib/games.ts`** — Añadir `playable?: boolean` al tipo `Game`; setear `playable: true` en la entrada `asteroides`; el resto de entradas queda sin el campo (equivalente a `false`).
3. **`lib/supabase/scores.ts`** (nuevo) — Implementar `saveScore()` (insert) y `getTopScores(gameId, limit)` (select ordenado por `score desc`, limitado), usando `lib/supabase/client.ts` (browser) para `saveScore` desde el reproductor y `lib/supabase/server.ts` para las lecturas en Server Components (`/game/[id]`, `/hall-of-fame`).
4. **`components/games/AsteroidsPlayer.tsx`** — En el efecto que reacciona a `gameState.state === 'gameover'`, invocar `saveScore({ gameId: "asteroides", playerName: <sesión mock o "ANÓNIMO">, score: gameState.score })` una sola vez por partida (evitar doble guardado en re-renders).
5. **`app/game/[id]/page.tsx`** — Si `id === "asteroides"`, reemplazar `seededScores(...)` por `await getTopScores("asteroides", 10)` (Server Component, ya es `async`); para el resto de ids, sin cambios (`seededScores`).
6. **`app/hall-of-fame/page.tsx`** — Para el tab activo `"asteroides"`, usar scores reales (`getTopScores("asteroides", 12)`) en vez de `seededScores`; para el resto de tabs, sin cambios. Dado que hoy es Client Component, evaluar fetch vía `useEffect`/estado o convertir la carga de datos en una Server Action/route handler — se decide en este paso durante la implementación siguiendo el patrón más simple que no rompa `useSession()`.
7. **`app/jugables/page.tsx`** (nuevo) — Server Component que filtra `GAMES.filter(g => g.playable)` y renderiza el listado (cards) con link a `/game/[id]`.
8. **Verificación de build y manual** — `npm run dev`; jugar una partida de Asteroids y confirmar que el score se guarda (ver reflejado en `/game/asteroides` y `/hall-of-fame` tras recargar); confirmar `/jugables` muestra solo Asteroides; `npm run build` sin errores de TypeScript/ESLint.

## Criterios de aceptación

- [ ] La tabla `scores` existe en Supabase con las columnas y RLS definidas; `insert`/`select` funcionan para el rol `anon` (verificable vía MCP `execute_sql` o desde la app).
- [ ] `lib/games.ts` incluye `playable: true` en la entrada `asteroides`; el resto de entradas no lo tiene (o es `false`).
- [ ] `/jugables` muestra únicamente el juego Asteroides (con link a `/game/asteroides`); ningún otro juego del catálogo aparece.
- [ ] Al terminar una partida de Asteroids (game over), se inserta una fila nueva en `scores` con `game_id: "asteroides"`, el `player_name` de la sesión mock (o "ANÓNIMO" sin sesión) y el `score` final.
- [ ] Jugar dos partidas seguidas sin recargar no duplica el guardado por re-render (una fila por partida terminada).
- [ ] `/game/asteroides` muestra el leaderboard con datos reales de `scores` (no `seededScores`), ordenados de mayor a menor puntaje.
- [ ] El tab "asteroides" en `/hall-of-fame` (podio + tabla) muestra datos reales de `scores`; el resto de tabs sigue mostrando datos de `seededScores` sin cambios.
- [ ] `/game/[id]` para ids distintos de `asteroides` sigue mostrando `seededScores` sin cambios de comportamiento.
- [ ] `npm run build` compila sin errores de TypeScript ni ESLint.

## Decisiones tomadas y descartadas

- **`playable` como campo del catálogo mock, no migración a Supabase** — Por pedido explícito del usuario; el catálogo de juegos sigue siendo el array `GAMES` en código, solo se le añade un flag para distinguir qué tiene reproductor real.
- **RLS abierta a `anon` (insert + select público)** — Por pedido explícito del usuario, dado que no existe Supabase Auth real todavía (spec 05 dejó explícitamente Auth fuera de alcance); es el equivalente a un arcade clásico donde cualquiera ingresa sus iniciales. Se acepta el riesgo de inserts arbitrarios como trade-off consciente.
- **Nombre de jugador desde la sesión mock (`lib/session.ts`), no Supabase Auth** — Por pedido explícito del usuario; evita acoplar esta spec a una migración de Auth que está fuera de alcance.
- **Solo Asteroides consume datos reales; el resto sigue con `seededScores`** — Por pedido explícito del usuario; no tiene sentido persistir scores de juegos que no tienen reproductor implementado todavía.
- **Nueva ruta `/jugables` en vez de filtrar `/biblioteca`** — Por pedido explícito del usuario; mantiene `/biblioteca` sin cambios de comportamiento (sigue mostrando el catálogo completo) y aísla el nuevo listado en una ruta dedicada.

## Riesgos identificados

- **Inserts arbitrarios/abuso de la tabla `scores`** — Al ser `anon` con `insert` público sin validación de servidor, cualquiera con las credenciales públicas de Supabase podría insertar scores falsos o masivos directamente contra la API, sin pasar por el juego. Mitigación: ninguna en esta spec (aceptado explícitamente); queda como candidato a un spec futuro de validación/rate-limiting si se vuelve un problema real.
- **Doble guardado de score por re-render en React** — Si el `useEffect` que detecta `state === 'gameover'` no controla que se ejecute una sola vez por partida, podría insertar duplicados. Mitigación: usar un ref/flag que marque la partida como "ya guardada" hasta que se reinicie el juego.
- **Refactor de `/hall-of-fame` de Client a mezcla de datos server-fetched** — Al introducir datos reales async junto a un Client Component existente (`useState`/`useSession`), hay riesgo de romper el patrón actual de tabs interactivos. Mitigación: decidir en el paso 6 del plan el enfoque más simple (fetch en `useEffect` al cambiar de tab) que no requiera convertir toda la página a Server Component.
