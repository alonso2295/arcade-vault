# 09 — Reproductor de Arkanoide

- **Estado:** Aprobada
- **Depende de:** [[06-asteroids-player]] (patrón motor/componente jugable), [[07-leaderboard-and-playable-games]] (infraestructura de leaderboard genérica)
- **Fecha:** 2026-08-16
- **Objetivo:** Portar el clon de Arkanoid de `references/templates/started-games/04-arkanoid/` a un componente React/canvas jugable en `/game/arkanoide/play`, con un puente de estado (score, vidas, nivel, game over/win) hacia React para HUD y overlay propios del sitio, e integración con el leaderboard real vía `gameId: "arkanoide"`.

## Scope

**Dentro del alcance:**
- Nueva entrada en `lib/games.ts` → `GAMES`: `id: "arkanoide"`, `title: "ARKANOIDE"`, `cat: "ARCADE"`, `cover: "cover-arkanoide"`, `color: "magenta"`, textos `short`/`long` adaptados del `README.md` del template, `best`/`plays` como valores mock coherentes con el resto del catálogo, `playable: true`.
- Nueva clase `.cover-arkanoide` en `app/globals.css`, siguiendo el patrón visual de las demás (gradiente + pseudo-elementos `::after`/`::before` decorativos).
- Copia de los assets reales del template a `public/games/arkanoide/`: `spritesheet-breakout.png`, `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3`.
- Motor del juego portado a TypeScript en `lib/games/arkanoide/engine.ts` (paddle, pelota, colisiones AABB, bloques, explosiones animadas, niveles con `speed` multiplicador, HUD y overlays dibujados en canvas — incluida la lógica de `spritesheet.js` portada como helpers internos del módulo), exportando `createArkanoideGame(canvas: HTMLCanvasElement, onStateChange: (s: ArkanoideState) => void): { destroy(): void }`.
- `app/game/[id]/play/page.tsx`: nueva rama `if (id === "arkanoide") return <ArkanoidePlayer />;`, junto a las ramas existentes de `asteroides` y `caida`.
- Nuevo Client Component `components/games/ArkanoidePlayer.tsx` que monta un `<canvas width={800} height={600}>`, inicializa `createArkanoideGame` en `useEffect`, mantiene el estado recibido vía `useState`, limpia el loop y libera los `Audio()` en el cleanup del efecto, renderiza HUD adicional (score/vidas/nivel con estilo Arcade Vault) y overlay de Game Over / Victoria (con botón "VOLVER" → `Link` a `/game/arkanoide`) cuando `state === 'gameover'` o `state === 'win'`.
- El canvas conserva su HUD interno actual (score/nivel/vidas, overlay de pausa con selector de nivel, overlay "GAME OVER"/"¡Completaste el juego!" dibujados en canvas, igual que el original), en paralelo al HUD/overlay que añade React.
- Controles tal como en el original: paddle con mouse o `←`/`→`, pausa con `P`/`Escape`, selector de nivel (click en botones 1-5) durante la pausa.
- Guardado del score vía `saveScore` tanto al llegar a `state === 'gameover'` como a `state === 'win'`, una sola vez por partida.
- Canvas de tamaño fijo 800×600 (sin reescalar), centrado dentro de `<main>` respetando `Nav` y footer existentes del sitio.

**Fuera de alcance:**
- Cambios a `lib/supabase/scores.ts`, `app/game/[id]/page.tsx`, `app/hall-of-fame/page.tsx` o `app/jugables/page.tsx` — ya son genéricos para cualquier juego con `playable: true`.
- Soporte táctil/móvil para los controles.
- Reescalado responsive del canvas.
- Cambios a `lib/session.ts`, `Nav`, Supabase, o rutas de auth.
- Cualquier otro juego del catálogo además de `arkanoide`.

## Modelo de datos

No se introduce persistencia ni tablas nuevas. Se añade un tipo en memoria/TS:

```ts
// lib/games/arkanoide/engine.ts
export interface ArkanoideState {
  score: number;
  lives: number;
  level: number; // 1-5
  state: 'playing' | 'paused' | 'gameover' | 'win';
}
```

Y una nueva entrada en el array existente `GAMES` (`lib/games.ts`), sin cambios al tipo `Game`:

```ts
{
  id: "arkanoide",
  title: "ARKANOIDE",
  short: "...",
  long: "...",
  cat: "ARCADE",
  cover: "cover-arkanoide",
  color: "magenta",
  best: <mock>,
  plays: "<mock>",
  playable: true,
}
```

## Plan de implementación

1. **`lib/games.ts`** — Añadir entrada `{ id: "arkanoide", title: "ARKANOIDE", cat: "ARCADE", cover: "cover-arkanoide", short, long, color: "magenta", best, plays, playable: true }` a `GAMES`, con textos adaptados del `README.md` del template (paddle, pelota, muros de bloques, 5 niveles).
2. **`app/globals.css`** — Añadir bloque `.cover-arkanoide` (+ `::after`/`::before`) siguiendo el patrón de los bloques `cover-*` existentes.
3. **`public/games/arkanoide/`** — Copiar `spritesheet-breakout.png`, `sounds/ball-bounce.mp3` y `sounds/break-sound.mp3` desde `references/templates/started-games/04-arkanoid/assets/`.
4. **`lib/games/arkanoide/engine.ts`** (nuevo) — Portar `game.js` + `levels.js` + `assets/spritesheet.js` completos a TypeScript: constantes (`PADDLE_SPEED`, `BLOCK_COLS/ROWS/W/H`, `BLOCK_COLORS`, `BASE_BALL_VX/VY`), `LEVELS` (5 niveles con `blocks[]` y `speed`), helpers de spritesheet (`loadSpritesheet`, `drawSprite`, `drawFrame`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`) apuntando a `/games/arkanoide/spritesheet-breakout.png`, funciones `initPaddle`, `initBall`, `loadLevel`, `collideAABB`, `update`, `draw`, `drawOverlay`, `drawPauseOverlay`, loop `requestAnimationFrame`. Reemplazar los globals (`ctx`, `keys`, `score`, `lives`, `gameState`, `currentLevel`, `isPaused`, `blocks`, `explosions`, `bounceSound`/`breakSound`) por closures locales a la instancia devuelta por `createArkanoideGame(canvas, onStateChange)`. Los listeners de `click`/`mousemove`/`keydown`/`keyup` se agregan sobre el `canvas`/`document` recibido y se remueven en `destroy()`; `onStateChange` se invoca tras cada `update()` cuando `score`, `lives`, `level` o `state` cambian; `destroy()` cancela el `requestAnimationFrame` pendiente, remueve todos los listeners y pausa/libera las instancias de `Audio`.
5. **`components/games/ArkanoidePlayer.tsx`** (nuevo) — `"use client"`. `useRef<HTMLCanvasElement>`, `useState<ArkanoideState>` inicial `{ score: 0, lives: 3, level: 1, state: 'playing' }`, `useEffect` que llama `createArkanoideGame(canvasRef.current, setGameState)` al montar y `destroy()` en el cleanup. Renderiza el `<canvas width={800} height={600}>` centrado, un HUD superior con clases/estilo del sitio (score, vidas, nivel), y cuando `gameState.state === 'gameover'` o `'win'`, un overlay con puntaje final y `Link` "VOLVER" → `/game/arkanoide`. `scoreSavedRef = useRef(false)`: al entrar en `gameover`/`win` y `!scoreSavedRef.current`, llama `saveScore({ gameId: "arkanoide", playerName: getSession()?.name ?? "ANÓNIMO", score: gameState.score })` y marca el ref (mismo patrón que `AsteroidsPlayer.tsx`/`CaidaPlayer.tsx`).
6. **`app/game/[id]/play/page.tsx`** — Añadir rama `if (id === "arkanoide") return <ArkanoidePlayer />;`, junto a las ramas existentes de `asteroides` y `caida`.
7. **Verificación de build y manual** — `npm run dev`, navegar `/game/arkanoide` → `/game/arkanoide/play`, jugar hasta perder 3 vidas (confirmar overlay "GAME OVER") y también hasta completar los 5 niveles (confirmar overlay "win"), verificando en ambos casos que el score se guarda y se refleja en `/game/arkanoide` y `/hall-of-fame`; confirmar pausa (P/Escape) y selector de nivel funcionales; confirmar que otros juegos (`asteroides`, `caida`) no tienen regresión. `npm run build` sin errores de TypeScript/ESLint.

## Criterios de aceptación

- [ ] `lib/games.ts` incluye la entrada `arkanoide` en `GAMES` con todos los campos de `Game` completos, incluido `playable: true`.
- [ ] `/game/arkanoide` muestra portada con `.cover-arkanoide`, tags, título, descripción y leaderboard real (vía `getTopScores`, heredado de spec 07 sin cambios de código).
- [ ] `/game/arkanoide/play` renderiza el canvas 800×600 centrado y el juego es jugable: mover paddle (mouse o `←`/`→`), rebotar la pelota, destruir bloques con animación de explosión, avanzar entre los 5 niveles, perder vidas al caer la pelota.
- [ ] La pausa (`P`/`Escape`) detiene el loop y muestra el selector de nivel (botones 1-5) clickeable, tal como el original.
- [ ] El HUD React (fuera del canvas) refleja `score`, `lives` y `level` en tiempo real mientras se juega.
- [ ] Al perder la última vida, aparece un overlay de Game Over con estilo Arcade Vault mostrando el puntaje final y un botón "VOLVER" que navega a `/game/arkanoide`.
- [ ] Al completar el nivel 5, aparece un overlay de Victoria con estilo Arcade Vault mostrando el puntaje final y un botón "VOLVER" que navega a `/game/arkanoide`.
- [ ] El score se guarda en Supabase exactamente una vez por partida tanto en `gameover` como en `win` (no se duplica en re-renders).
- [ ] Salir de `/game/arkanoide/play` durante una partida activa no deja el `requestAnimationFrame` corriendo en segundo plano, ni listeners de teclado/mouse huérfanos, ni sonidos reproduciéndose (verificable revisando que `destroy()` se invoque en el cleanup de `useEffect`).
- [ ] El resto del catálogo (`asteroides`, `caida`, y los no jugables) sigue funcionando sin regresión.
- [ ] `npm run build` compila sin errores de TypeScript ni ESLint.

## Decisiones tomadas y descartadas

- **Se reutiliza la infraestructura de leaderboard sin cambios (specs 06/07)** — `saveScore`/`getTopScores`, leaderboard lateral en `/game/[id]`, tab en `/hall-of-fame`, listado en `/jugables`, todos ya genéricos vía `playable: true`.
- **Assets reales del template (spritesheet + sonidos), no formas simples** — Por pedido explícito del usuario; a diferencia de Asteroids/Tetris (dibujados con figuras de canvas), Arkanoid usa sprites y sonido como parte central de su identidad visual, así que se copian a `public/games/arkanoide/` en vez de redibujar.
- **El score se guarda tanto en `gameover` como en `win`** — Por pedido explícito del usuario; completar los 5 niveles es un "fin de partida" válido tanto como perder, y debe reflejarse en el leaderboard igual que una derrota.
- **Se usa el ancho real de paddle del código (`w: 81`), no el documentado en el README del template (162)** — El `README.md` del template quedó desactualizado tras algún ajuste de balance; se prioriza el comportamiento real de `game.js` como fuente de verdad.
- **Motor portado a módulo TS con callback (`onStateChange`), no `<script>` clásico** — Mismo patrón ya validado por Asteroids/Tetris: mantiene el juego dentro del ciclo de vida de React/Next, tipado y con cleanup determinista vía `useEffect`.
- **HUD dentro del canvas se conserva, y además se añade HUD/overlay en React** — Mínimo cambio sobre la lógica original del juego, pero con una experiencia de fin de partida coherente con el resto del sitio (botón real de navegación en vez de reinicio con tecla).
- **Canvas fijo 800×600, sin reescalar** — Evita tocar la física/coordenadas del juego original; mismo criterio que Asteroids.
- **Nueva clase `.cover-arkanoide`** — No colisiona con ninguna clase `.cover-*` existente en `app/globals.css`.

## Riesgos identificados

- **Fugas de `requestAnimationFrame` y listeners al navegar fuera del reproductor** — Si `destroy()` no cancela correctamente el loop y remueve los listeners de `click`/`mousemove`/`keydown`/`keyup`, el juego seguiría corriendo en segundo plano tras salir de `/game/arkanoide/play`. Mitigación: `useEffect` con cleanup explícito que llama a `destroy()`, verificado manualmente navegando fuera del reproductor durante una partida activa.
- **Instancias de `Audio` no liberadas** — El original usa `new Audio(...).cloneNode().play()` en cada rebote/rotura de bloque; si el componente se desmonta a mitad de reproducción, esas instancias clonadas pueden seguir sonando o acumularse en memoria. Mitigación: `destroy()` debe pausar/limpiar las instancias base de `Audio` y evitar disparar nuevos `play()` tras la llamada a `destroy()`.
- **Doble guardado de score por re-render en React, en dos rutas de fin de partida (`gameover`/`win`)** — Mitigación: mismo patrón `useRef` guard (`scoreSavedRef`) usado en `AsteroidsPlayer.tsx`/`CaidaPlayer.tsx`, cubriendo ambos estados terminales.
- **Conflicto de estado entre React y el bucle interno del motor** — El motor es la única fuente de verdad (React solo refleja lo que `onStateChange` reporta).
- **Ruta de assets estáticos** — Si `public/games/arkanoide/spritesheet-breakout.png` no se copia correctamente o el path referenciado en `spritesheet.js` portado no coincide con la carpeta `public/`, el juego cargaría sin sprites (canvas negro). Mitigación: verificar manualmente que `loadSpritesheet` complete su callback antes del primer `draw()`.
