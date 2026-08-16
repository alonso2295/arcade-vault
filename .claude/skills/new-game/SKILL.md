---
name: new-game
description: Diseña una spec para portar/integrar un nuevo juego jugable en Arcade Vault (motor + componente + leaderboard real), siguiendo el patrón ya validado en las specs 06 y 07. Pregunta lo específico del juego y pre-rellena el resto del plan. Usar antes de agregar cualquier juego nuevo al catálogo.
disable-model-invocation: true
argument-hint: '<carpeta-de-plantilla-en-started-games-o-nombre-del-juego>'
---

# /new-game — Diseñador de spec para juegos nuevos

Esta skill es una variante especializada de `/spec`, acotada al dominio "agregar un juego jugable + su leaderboard a Arcade Vault". **No escribe código.** Su trabajo es producir una spec en `specs/NN-slug.md` (estado `Draft`) lista para `/spec-impl`, reutilizando el patrón ya validado por `specs/06-asteroids-player.md` (motor + componente) y `specs/07-leaderboard-and-playable-games.md` (leaderboard real).

Sigue las mismas 4 fases y reglas duras que `/spec` (ver `.claude/skills/spec/SKILL.md` y `template.md` para el formato exacto de cada sección). Esta skill acorta la Fase 2 porque el shape de la solución ya está resuelto — no hay que redescubrir el modelo de datos ni la arquitectura desde cero cada vez.

## Infraestructura ya generalizada (no repetir en el plan)

Desde que esta skill existe, los siguientes mecanismos son **genéricos** y funcionan para cualquier juego con `playable: true`, sin tocar código adicional:

- `lib/supabase/scores.ts` (`saveScore`, `getTopScores`) — tabla `scores` única para todos los juegos, filtrada por `game_id`. No se crean tablas nuevas por juego.
- `app/game/[id]/page.tsx` — el leaderboard lateral usa datos reales de Supabase automáticamente cuando `game.playable === true`; si no, usa `seededScores`.
- `app/hall-of-fame/page.tsx` — el tab correspondiente usa datos reales automáticamente cuando el juego de ese tab tiene `playable === true`.
- `app/jugables/page.tsx` — lista automáticamente cualquier juego con `playable === true`.
- `lib/session.ts` (`getSession`) — nombre de jugador mock para asociar el score guardado.

**Por lo tanto, la spec que genera esta skill NUNCA debe incluir pasos para tocar esos cinco archivos/mecanismos.** El plan de implementación se limita a: motor del juego, componente jugador, entrada en el catálogo, clase CSS de portada, y el wiring del componente en la ruta de juego.

## Fase 1 — Entender el contexto y la fuente del juego

1. Leer `CLAUDE.md` (memoria del proyecto).
2. Listar `specs/` y leer al menos `specs/06-asteroids-player.md` (patrón de motor/componente) y `specs/07-leaderboard-and-playable-games.md` (patrón de leaderboard) si aún no están frescas en contexto.
3. Leer `lib/games.ts` completo: tipo `Game`, `GAMES` (para no colisionar `id`), `GameCategory`, colores disponibles.
4. Determinar la **fuente del juego** a partir de `$ARGUMENTS`:
   - Si coincide con una carpeta de `references/templates/started-games/` (por número, nombre completo o slug — ej. `03-tetris`, `tetris`), leer su `CLAUDE.md`, `README.md` y el archivo principal de lógica (`game.js` u equivalente) para entender arquitectura, clases, estado y controles. Confirmar con el usuario que esa es la fuente correcta antes de continuar.
   - Si no coincide con ninguna carpeta conocida, o `$ARGUMENTS` viene vacío, preguntar: ¿la fuente es (a) una carpeta de `references/templates/started-games/` [listar las disponibles], (b) código en otra ruta que el usuario va a indicar, o (c) un juego a diseñar desde cero (mayor alcance — confirmar explícitamente que se quiere esto antes de seguir)?

## Fase 2 — Clarificar en bloques

A diferencia de `/spec`, aquí el terreno ya está mapeado por las specs 06/07, así que las preguntas son puntuales. Preguntar en bloques de 3-5, esperando respuesta entre bloques.

**Bloque A — Identidad del juego:**
1. `id` (slug, kebab-case, no debe colisionar con los existentes en `GAMES`).
2. `title` (mayúsculas, estilo del catálogo — ej. "ASTEROIDES").
3. `cat` — una de `ARCADE | PUZZLE | SHOOTER | VERSUS`.
4. `color` — una de `cyan | magenta | yellow | green`.

**Bloque B — Descripción y metadata mock:**
1. `short`/`long` — adaptar del `README.md` de la plantilla si existe; si no, pedir al usuario una frase corta y una descripción de 2-3 frases.
2. `best`/`plays` — valores mock iniciales coherentes con el resto del catálogo (ver ejemplos en `lib/games.ts`).
3. Nombre de la clase de portada: `.cover-<id>` (confirmar que no colisiona con una clase `.cover-*` existente en `app/globals.css`).

**Bloque C — Motor, estado y controles:**
1. Tamaño de canvas (¿fijo 800×600 como Asteroids, u otro?).
2. Controles (¿iguales a la fuente original, o hay cambios?).
3. Forma del estado que el motor reporta a React vía `onStateChange` — mínimo `{ score: number; state: 'playing' | 'gameover' }`, más los campos propios del juego (ej. `lives`, `level`, `rows`, `combo`).
4. ¿Se conserva el HUD dibujado en canvas del original, en paralelo al HUD de React? (Recomendado: sí, mismo patrón que `AsteroidsPlayer.tsx` — mínimo cambio sobre la lógica original.)

**Bloque D — Confirmación de leaderboard (no debería requerir decisiones nuevas):**
1. Confirmar que se reutiliza `saveScore`/`getTopScores` de `lib/supabase/scores.ts` sin modificarlos, pasando el nuevo `gameId`.
2. Confirmar que el guardado ocurre una sola vez por partida al llegar a `state === 'gameover'` (mismo patrón `useRef` que `AsteroidsPlayer.tsx`), usando `getSession()?.name ?? "ANÓNIMO"`.

**Cuándo parar de preguntar:** cuando puedas responder sin asumir: qué archivos aparecen, cuál es el primer y último paso ejecutable, y cómo se verifica que el juego funciona y guarda puntuación.

## Fase 3 — Desarrollar la spec sección por sección

Mismo ritmo que `/spec`: mostrar cada sección, preguntar "¿Esta sección queda así o quieres ajustar algo?", esperar confirmación antes de la siguiente. Orden:

1. **Header** — Estado `Draft`, `Depende de`: siempre incluir `[[06-asteroids-player]]` (patrón de motor/componente) y `[[07-leaderboard-and-playable-games]]` (patrón de leaderboard, ya generalizado), más cualquier otra spec relevante. Objetivo en una sola frase.
2. **Scope** — Dentro de alcance: motor, componente, entrada en `GAMES`, clase CSS, wiring en `play/page.tsx`. Fuera de alcance: siempre incluir explícitamente "cambios a `lib/supabase/scores.ts`, `app/game/[id]/page.tsx`, `app/hall-of-fame/page.tsx` o `app/jugables/page.tsx` — ya son genéricos para cualquier juego con `playable: true`" y "soporte táctil/móvil" (salvo que el usuario lo pida explícitamente).
3. **Modelo de datos** — La interfaz de estado del motor (ej. `TetrisState`), y la nueva entrada en `GAMES`. No hay tabla nueva en Supabase — reutiliza `scores`.
4. **Plan de implementación** — Instanciar el patrón canónico (ajustar nombres):
   1. `lib/games.ts` — nueva entrada en `GAMES` con `playable: true`.
   2. `app/globals.css` — nueva clase `.cover-<id>`.
   3. `lib/games/<id>/engine.ts` (nuevo) — portar el motor a TS, exportando `create<Name>Game(canvas, onStateChange): { destroy() }` y el tipo de estado.
   4. `components/games/<Name>Player.tsx` (nuevo) — mismo patrón que `AsteroidsPlayer.tsx`: canvas, HUD React, overlay de game over con `Link` "VOLVER" → `/game/<id>`, y guardado de score una vez por partida vía `saveScore`.
   5. `app/game/[id]/play/page.tsx` — añadir rama `if (id === "<id>") return <NamePlayer />;`.
   6. Verificación de build y manual — jugar hasta game over, confirmar guardado en Supabase y su reflejo en `/game/<id>` y `/hall-of-fame`; `npm run build` limpio.
5. **Criterios de aceptación** — checklist booleano análogo al de la spec 06 (juego jugable, HUD sincronizado, overlay de game over, cleanup de `destroy()`, otros juegos sin regresión) más uno heredado de la spec 07 (el score se guarda y aparece en `/game/<id>` y `/hall-of-fame` sin tocar esas páginas).
6. **Decisiones tomadas y descartadas** — Como mínimo: "Se reutiliza la infraestructura de leaderboard sin cambios (specs 06/07)"; documentar cualquier desviación del patrón que el usuario haya pedido en la Fase 2.
7. **Riesgos identificados** — Reutilizar los ya conocidos si aplican (fugas de `requestAnimationFrame`/listeners, doble guardado de score por re-render) más cualquier riesgo propio del motor portado.

## Fase 4 — Guardar la spec

Mismas reglas que `/spec` Fase 4: siguiente número secuencial en `specs/`, slug derivado del objetivo, confirmar nombre de archivo con el usuario antes de escribir, estado `Draft` (nunca `Approved` automático), no tocar `specs/.spec-config.yml` si ya existe. Confirmar ruta del archivo creado y que el siguiente paso es `/spec-impl NN-slug` una vez aprobado. **Detenerse ahí — no proponer implementar ni escribir código.**

## Reglas duras

Idénticas a `/spec`: nunca escribir código en esta skill; nunca proponer implementar después de guardar; nunca asumir decisiones no confirmadas; nunca generar la spec completa de una vez (sección por sección); nunca incluir en el plan pasos sobre los archivos ya generalizados (`lib/supabase/scores.ts`, `app/game/[id]/page.tsx`, `app/hall-of-fame/page.tsx`, `app/jugables/page.tsx`).

## Idioma

Responde en el mismo idioma del prompt inicial del usuario.
