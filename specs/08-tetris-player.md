# 08 - Tetris Player

**Estado:** Implementado
**Depende de:** [[06-asteroids-player]], [[07-leaderboard-and-playable-games]]

## Objetivo

Portar el motor de Tetris del template `references/templates/started-games/03-tetris` a un motor TypeScript y componente React jugable en `/game/caida/play`, integrado con el leaderboard real vía `gameId: "caida"`, reutilizando el patrón validado por Asteroids (specs 06/07) sin tocar la infraestructura ya generalizada.

## Scope

### Dentro de alcance
- Motor del juego: `lib/games/caida/engine.ts` (nuevo), portando la lógica de `game.js` del template `03-tetris` a TypeScript.
- Componente jugador: `components/games/CaidaPlayer.tsx` (nuevo), siguiendo el patrón de `AsteroidsPlayer.tsx`.
- Actualizar la entrada `caida` existente en `GAMES` (`lib/games.ts`) añadiendo `playable: true`.
- Wiring en `app/game/[id]/play/page.tsx`: nueva rama `if (id === "caida") return <CaidaPlayer />;`.

### Fuera de alcance
- Cambios a `lib/supabase/scores.ts`, `app/game/[id]/page.tsx`, `app/hall-of-fame/page.tsx` o `app/jugables/page.tsx` — ya son genéricos para cualquier juego con `playable: true`.
- Soporte táctil/móvil.
- Nueva clase CSS de portada — se reutiliza `cover-tetro`, ya existente y ya asignada a `caida`.
- Cambiar `id`, `title`, `cat`, `color`, `cover`, `best` o `plays` de la entrada `caida` (se mantienen intactos salvo `playable: true`).

## Modelo de datos

### Estado del motor (`CaidaState`)

```ts
export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L" | "N"; // "N" = pieza "tuerca" extra del template

export interface CaidaState {
  score: number;
  lines: number;
  level: number;
  state: "playing" | "paused" | "gameover";
  nextPiece: PieceType;
}
```

- `nextPiece` es el tipo de la siguiente pieza; el componente lo usa para dibujar el preview en el canvas secundario de 120×120 (mismo dato interno que `randomPiece()` ya calcula en el original, solo se expone vía `onStateChange`).
- El tablero, la pieza activa y la posición del ghost piece son estado interno del motor (no se exponen a React) — el motor dibuja todo directamente sobre el canvas principal en su loop `requestAnimationFrame`, igual que Asteroids.

### Catálogo (`lib/games.ts`)

Se actualiza la entrada existente `caida` agregando un único campo, sin tocar el resto:

```ts
{
  id: "caida",
  title: "CAÍDA",
  short: "Encaja las piezas antes de que el techo te aplaste.",
  long: "Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.",
  cat: "PUZZLE",
  cover: "cover-tetro",
  color: "magenta",
  best: 184220,
  plays: "31.8K",
  playable: true, // ← único cambio
},
```

### Persistencia

Sin tabla nueva en Supabase — reutiliza `scores` (vía `saveScore`/`getTopScores` de `lib/supabase/scores.ts`) filtrada por `gameId: "caida"`.

## Plan de implementación

1. **`lib/games.ts`** — Añadir `playable: true` a la entrada `caida` existente. Sin otros cambios a ese objeto.

2. **`lib/games/caida/engine.ts`** (nuevo) — Portar `game.js` del template `03-tetris` a TypeScript:
   - Tablero 10×20 (`COLS=10`, `ROWS=20`, `BLOCK=30`), canvas principal 300×600.
   - 8 tipos de pieza (`PIECES`), incluida la pieza "tuerca" extra del template (color `#9e9e9e`).
   - Funciones portadas: `createBoard`, `randomPiece`, `collide`, `rotateCW` (transpose+reverse), `tryRotate` (wall kicks `[0,-1,1,-2,2]`), `merge`, `clearLines` (`LINE_SCORES=[0,100,300,500,800]` × nivel), `ghostY`, `hardDrop` (+2/celda), `softDrop` (+1/fila), `lockPiece`, `spawn`, `togglePause`.
   - Velocidad: `dropInterval = max(100, 1000-(level-1)*90)`; `level = floor(lines/10)+1`.
   - Loop vía `requestAnimationFrame`, manejo de teclado (`keydown`/`keyup`) para ←/→ mover, ↑/X rotar, ↓ soft drop, Space hard drop, P pausa.
   - Dibuja tablero + ghost piece en el canvas principal, y la pieza siguiente en un segundo canvas (120×120) pasado como segundo parámetro.
   - Exporta:
     ```ts
     export function createCaidaGame(
       canvas: HTMLCanvasElement,
       nextCanvas: HTMLCanvasElement,
       onStateChange: (s: CaidaState) => void
     ): { destroy(): void }
     ```
   - `destroy()` cancela el `requestAnimationFrame` pendiente y remueve los listeners de teclado.

3. **`components/games/CaidaPlayer.tsx`** (nuevo) — Mismo patrón que `AsteroidsPlayer.tsx`:
   - `canvasRef` (300×600) + `nextCanvasRef` (120×120).
   - `useEffect` de montaje: `createCaidaGame(canvasRef.current, nextCanvasRef.current, setGameState)`, cleanup con `game.destroy()`.
   - HUD en React (spans) con score/lines/level, acentos con `var(--magenta)` (color asignado a `caida`).
   - `scoreSavedRef = useRef(false)`: en `state === "gameover"` y `!scoreSavedRef.current`, guarda con `saveScore({ gameId: "caida", playerName: getSession()?.name ?? "ANÓNIMO", score: gameState.score })`, marca el ref, y lo resetea cuando `state` vuelve a `"playing"`.
   - Overlay de game over (`bg-black/70`) con score final y `<Link href="/game/caida" className="btn xl pulse">VOLVER</Link>`.
   - Indicador visual de pausa (overlay simple o texto) cuando `state === "paused"`.

4. **`app/game/[id]/play/page.tsx`** — Añadir rama `if (id === "caida") return <CaidaPlayer />;` antes del fallback genérico, junto a la rama existente de `asteroides`.

5. **Verificación**:
   - `npm run build` limpio, sin errores de tipos ni lint.
   - Manual: jugar una partida completa hasta game over (spawn → líneas completas → aumento de nivel → colisión en el spawn), confirmar pausa (P) funcional, confirmar que el preview de siguiente pieza se actualiza correctamente.
   - Confirmar que el score se guarda en Supabase una sola vez por partida y se refleja en `/game/caida` y en el tab correspondiente de `/hall-of-fame`, sin haber tocado esas páginas.
   - Confirmar que `/game/asteroides` (y el resto del catálogo) sigue funcionando sin regresión.

## Criterios de aceptación

- [x] El juego es jugable de principio a fin: piezas caen, se pueden mover/rotar/soft-drop/hard-drop, se completan y limpian líneas, el nivel sube cada 10 líneas y la velocidad aumenta en consecuencia.
- [x] El HUD en React (score/lines/level) se mantiene sincronizado con el estado que reporta el motor vía `onStateChange`.
- [x] El preview de la siguiente pieza se dibuja correctamente en el canvas secundario y se actualiza en cada spawn.
- [x] La pausa (tecla P) detiene el loop del juego y lo reanuda correctamente sin corromper el estado.
- [x] Al llegar a `state === "gameover"` se muestra un overlay con el score final y un botón "VOLVER" que enlaza a `/game/caida`.
- [x] `destroy()` cancela el `requestAnimationFrame` y remueve todos los listeners de teclado al desmontar el componente (sin fugas verificables al navegar fuera y volver a entrar).
- [x] El score se guarda en Supabase exactamente una vez por partida (no se duplica en re-renders) y aparece reflejado en `/game/caida` y en `/hall-of-fame` sin modificar esas páginas.
- [x] El resto del catálogo (incluyendo `/game/asteroides`) sigue funcionando sin regresión.
- [x] `npm run build` pasa sin errores.

## Decisiones tomadas y descartadas

- Se reutiliza la infraestructura de leaderboard sin cambios (specs 06/07): `saveScore`/`getTopScores`, leaderboard lateral en `/game/[id]`, tab en `/hall-of-fame`, listado en `/jugables` — todos ya genéricos vía `playable: true`.
- Se reutiliza la entrada `caida` existente en `GAMES` en vez de crear un id/slug nuevo, para no duplicar la entrada mock ya presente en el catálogo.
- Se mantiene el canvas nativo del template (300×600) en vez de escalar a 800×600 como Asteroids — se prioriza fidelidad al original sobre uniformidad de tamaño entre juegos del catálogo.
- Se incluye la pieza "tuerca" extra del template (8 piezas en vez de las 7 estándar de Tetris) como parte del motor portado, sin alterar su forma ni color.
- Se porta la pausa (tecla P) del original en vez de omitirla, dado su bajo costo de implementación (ya resuelta en `game.js`).
- El HUD se migra de elementos DOM (como en el original) a React, siguiendo el patrón ya validado de `AsteroidsPlayer.tsx`, en vez de mezclar DOM directo con React.

## Riesgos identificados

- Fuga de `requestAnimationFrame` o listeners de teclado si `destroy()` no se invoca correctamente en el cleanup del `useEffect` de montaje (mismo riesgo ya conocido de Asteroids).
- Doble guardado de score en Supabase por re-render del componente — mitigado con el mismo patrón `useRef` guard (`scoreSavedRef`) usado en `AsteroidsPlayer.tsx`.
- Diferencia de escala entre el canvas de Tetris (300×600) y el de Asteroids (800×600) puede leerse como inconsistente visualmente en el catálogo — riesgo aceptado y documentado como decisión intencional, no un bug.
- La pieza "tuerca" extra del template no es estándar de Tetris; si en el futuro se compara con otras implementaciones de Tetris, podría generar confusión sobre las reglas — se documenta como parte fiel del motor original portado.
- Los wall kicks simplificados (`[0,-1,1,-2,2]`) del original no son el sistema SRS completo; rotaciones cerca de los bordes o de piezas ya fijadas pueden fallar en casos límite — comportamiento heredado del original, no se corrige en esta spec.
