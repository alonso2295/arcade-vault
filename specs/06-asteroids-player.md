# 06 — Reproductor de Asteroids

- **Estado:** Implementado
- **Depende de:** [[01-app-shell-routing-auth]] (`lib/games.ts`, rutas placeholder), [[02-game-detail-hall-of-fame]] (`/game/[id]` ya muestra portada/leaderboard a partir de `GAMES`)
- **Fecha:** 2026-08-06
- **Objetivo:** Portar el clon de Asteroids de `references/templates/started-games/02-asteroids/` a un componente React/canvas jugable en `/game/asteroides/play`, con un puente de estado (score, vidas, nivel, game over) hacia React para HUD y overlay propios del sitio.

## Contexto

`references/templates/started-games/02-asteroids/` contiene un clon de Asteroids funcional (canvas HTML5 puro, `game.js`, 511 líneas, sin dependencias). El reproductor de la plataforma (`app/game/[id]/play/page.tsx`) es hoy un placeholder ("Próximamente"). Esta spec lo convierte en el primer juego real y jugable de Arcade Vault. Es un juego **nuevo** en el catálogo (`id: "asteroides"`) — no reemplaza ni reutiliza la entrada mock existente `rocas`, que permanece sin reproductor. La persistencia de puntuación (`av_scores`) queda fuera de esta spec.

## Scope

**Dentro del alcance:**
- Nueva entrada en `lib/games.ts` → `GAMES`: `id: "asteroides"`, `title: "ASTEROIDES"`, `cat: "SHOOTER"`, `cover: "cover-asteroides"`, textos `short`/`long` adaptados del README del template, `best`/`plays` como valores mock coherentes con el resto del catálogo.
- Nueva clase `.cover-asteroides` en `app/globals.css`, siguiendo el patrón visual de las demás (`cover-rocas`, `cover-invaders`, etc. — gradiente + pseudo-elementos `::after`/`::before` decorativos).
- Motor del juego portado a TypeScript en `lib/games/asteroids/engine.ts` (clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`, constantes `RADII`/`SPEEDS`/`POINTS`, loop `update`/`draw`), exportando `createAsteroidsGame(canvas: HTMLCanvasElement, onStateChange: (s: AsteroidsState) => void): { destroy(): void }`. `AsteroidsState` incluye al menos `{ score, lives, level, state: 'playing' | 'dead' | 'gameover' }`.
- `app/game/[id]/play/page.tsx`: si `id === "asteroides"`, renderiza el componente de juego real; para el resto de ids sigue mostrando el placeholder actual "Próximamente" (no se implementan otros juegos en esta spec).
- Nuevo Client Component `components/games/AsteroidsPlayer.tsx` que monta un `<canvas width={800} height={600}>`, inicializa `createAsteroidsGame` en `useEffect`, mantiene el estado recibido vía `useState`, limpia el loop en el cleanup del efecto, renderiza HUD adicional (score/vidas/nivel con estilo Arcade Vault) y overlay de Game Over (con botón "VOLVER" → `Link` a `/game/asteroides`) cuando `state === 'gameover'`.
- El canvas conserva su HUD interno actual (score/nivel/vidas y overlay "GAME OVER — ESPACIO PARA REINICIAR" dibujados en canvas, igual que el original), en paralelo al HUD/overlay que añade React.
- Controles de teclado (`ArrowLeft/Right/Up`, `Space`) tal como en el original.
- Canvas de tamaño fijo 800×600 (sin reescalar), centrado dentro de `<main>` respetando `Nav` y footer existentes del sitio.

**Fuera de alcance:**
- Persistencia de puntuación (`av_scores`, localStorage) — spec futuro.
- Cualquier otro juego del catálogo además de `asteroides` (`rocas` y el resto siguen como mocks sin reproductor).
- Soporte táctil/móvil para los controles (el template original es solo teclado; no se agrega nada nuevo).
- Reescalado responsive del canvas.
- Cambios a `lib/session.ts`, `Nav`, Supabase, o rutas de auth.

## Modelo de datos

No se introduce persistencia ni tablas nuevas. Se añade un tipo en memoria/TS:

```ts
// lib/games/asteroids/engine.ts
export interface AsteroidsState {
  score: number;
  lives: number;
  level: number;
  state: 'playing' | 'dead' | 'gameover';
}
```

Y una nueva entrada en el array existente `GAMES` (`lib/games.ts`), sin cambios al tipo `Game`.

## Plan de implementación

1. **`lib/games.ts`** — Añadir entrada `{ id: "asteroides", title: "ASTEROIDES", cat: "SHOOTER", cover: "cover-asteroides", short, long, color, best, plays }` a `GAMES`, con textos adaptados del `README.md` del template (nave en campo de asteroides, envolvimiento toroidal, fragmentación de rocas).
2. **`app/globals.css`** — Añadir bloque `.cover-asteroides` (+ `::after`/`::before`) siguiendo el patrón de los bloques `cover-*` existentes (línea ~406 en adelante).
3. **`lib/games/asteroids/engine.ts`** (nuevo) — Portar `game.js` completo: clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`, constantes (`RADII`, `SPEEDS`, `POINTS`, `POWERUP_*`, `TRIPLE_SPREAD`), funciones `wrap`/`dist`/`rand`/`randInt`, estado del juego, `spawnAsteroids`, `initGame`, `nextLevel`, `explode`, `killShip`, `update`, `draw`, HUD y overlay dibujados en canvas. Envolver todo en `createAsteroidsGame(canvas, onStateChange)`: reemplaza los globals `ctx`, `keys`, `justPressed`, `score`, `lives`, `level`, `state`, etc. por closures locales a la instancia; los listeners de teclado (`keydown`/`keyup`) se agregan/remueven en `createAsteroidsGame`/`destroy()`; `onStateChange` se invoca tras cada `update()` cuando `score`, `lives`, `level` o `state` cambian; devuelve `{ destroy() }` que cancela el `requestAnimationFrame` pendiente y remueve los listeners.
4. **`components/games/AsteroidsPlayer.tsx`** (nuevo) — `"use client"`. `useRef<HTMLCanvasElement>`, `useState<AsteroidsState>` inicial `{ score: 0, lives: 3, level: 1, state: 'playing' }`, `useEffect` que llama `createAsteroidsGame(canvasRef.current, setGameState)` al montar y `destroy()` en el cleanup. Renderiza el `<canvas width={800} height={600}>` centrado, un HUD superior con clases/estilo del sitio (score, vidas, nivel a partir del estado), y cuando `gameState.state === 'gameover'`, un overlay con puntaje final y `Link` "VOLVER" → `/game/asteroides`.
5. **`app/game/[id]/play/page.tsx`** — Cambiar a Server/Client según se requiera: si `id === "asteroides"` renderiza `<AsteroidsPlayer />`; en cualquier otro caso mantiene el markup placeholder actual ("Reproductor" / "Próximamente") sin cambios.
6. **Verificación de build y manual** — `npm run dev`, navegar `/game/asteroides` → `/game/asteroides/play`, jugar una partida completa (perder 3 vidas) confirmando HUD React sincronizado y overlay de Game Over con botón "VOLVER" funcional; confirmar que `/game/bloque-buster/play` (u otro id existente) sigue mostrando el placeholder. `npm run build` sin errores de TypeScript/ESLint.

## Criterios de aceptación

- [x] `lib/games.ts` incluye la entrada `asteroides` en `GAMES` con todos los campos de `Game` completos.
- [x] `/game/asteroides` muestra portada con `.cover-asteroides`, tags, título, descripción y leaderboard (heredado de spec 02 sin cambios de código).
- [x] `/game/asteroides/play` renderiza el canvas 800×600 centrado y el juego es jugable: rotar (`←`/`→`), propulsar (`↑`), disparar (`Espacio`), asteroides se fragmentan, power-up de disparo triple funciona, nave reaparece con invencibilidad tras perder una vida.
- [x] El HUD React (fuera del canvas) refleja `score`, `lives` y `level` en tiempo real mientras se juega.
- [x] Al perder la última vida, aparece un overlay de Game Over con estilo Arcade Vault mostrando el puntaje final y un botón "VOLVER" que navega a `/game/asteroides` usando `Link` de Next (no solo el reinicio con `Espacio` del canvas original).
- [x] Salir de `/game/asteroides/play` (navegación a otra ruta) no deja el `requestAnimationFrame` corriendo en segundo plano ni listeners de teclado huérfanos (verificable revisando que `destroy()` se invoque en el cleanup de `useEffect`).
- [x] `/game/bloque-buster/play` (u otro id existente distinto de `asteroides`) sigue mostrando el placeholder "Próximamente" sin errores.
- [x] `npm run build` compila sin errores de TypeScript ni ESLint.

## Decisiones tomadas y descartadas

- **Juego nuevo (`asteroides`), no reutiliza `rocas`** — Por pedido explícito del usuario; `rocas` es una entrada mock preexistente distinta que no debe modificarse ni servir de base para este reproductor.
- **Motor portado a módulo TS con callback, no `<script>` clásico ni `CustomEvent`** — Por pedido explícito del usuario (opción recomendada); mantiene el juego dentro del ciclo de vida de React/Next (import estático, tipado, cleanup determinista vía `useEffect`), en vez de cargar un script global o depender de eventos del DOM poco tipados.
- **HUD dentro del canvas se conserva, y además se añade HUD/overlay en React** — Por pedido explícito del usuario: no se elimina el dibujo original en canvas (mínimo cambio sobre la lógica del juego), pero se expone el estado a React para dar una experiencia de Game Over coherente con el resto del sitio (botón real de navegación en vez de "pulsa Espacio").
- **Canvas fijo 800×600, sin reescalar** — Por pedido explícito del usuario; evita tocar la física/coordenadas del juego original y el riesgo de romper el feel, a cambio de no ser responsive en esta spec.
- **Nueva clase `.cover-asteroides` en vez de reutilizar `.cover-rocas`** — Por pedido explícito del usuario, aunque `.cover-rocas` ya existe sin uso; se prefiere una clase dedicada para evitar acoplar visualmente el juego nuevo a la entrada mock `rocas`.
- **Persistencia de puntuación fuera de alcance** — Igual que Spec 2 dejó explícito para el resto de la plataforma; se aborda en un spec futuro dedicado a `av_scores`.

## Riesgos identificados

- **Fugas de `requestAnimationFrame` y listeners al navegar fuera del reproductor** — Si `destroy()` no cancela correctamente el loop y remueve los `keydown`/`keyup` listeners, el juego seguiría corriendo en segundo plano tras salir de `/game/asteroides/play`, consumiendo CPU y capturando teclas globalmente. Mitigación: `useEffect` con cleanup explícito que llama a `destroy()`, verificado manualmente navegando fuera del reproductor durante una partida activa.
- **Conflicto de estado entre React y el bucle interno del motor** — Al mantener el HUD dibujado en canvas y a la vez notificar a React, hay dos fuentes de verdad para `score`/`lives`/`level`. Mitigación: el motor es la única fuente de verdad (React solo refleja lo que `onStateChange` reporta, nunca muta el estado del juego directamente).
- **Colisión de nombres/estilos CSS** — Añadir `.cover-asteroides` requiere evitar colisión con clases existentes (`.cover-rocas` ya tiene un patrón visual similar). Mitigación: revisar `app/globals.css` antes de escribir el bloque nuevo para diferenciar el gradiente/paleta.
