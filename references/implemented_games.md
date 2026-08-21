# Juegos implementados — Arcade Vault

Catálogo de los juegos **jugables** de Arcade Vault: aquellos que tienen motor, reproductor y leaderboard real conectado a Supabase.

El catálogo completo (`lib/games.ts`) contiene 10 entradas, pero solo las marcadas con `playable: true` están implementadas. Las otras 7 (`bloque-buster`, `serpentina`, `gloton`, `invasores`, `rocas`, `ranaria`, `duelo-pixel`) son entradas de vitrina: tienen ficha de detalle y leaderboard simulado, pero no se pueden jugar.

**Verificado contra la tabla `scores` de Supabase**: los únicos `game_id` con partidas registradas son `asteroides`, `caida` y `arkanoide` — exactamente los tres documentados aquí.

_Última actualización: 20 de agosto de 2026._

---

## Resumen

| Juego | `id` | Categoría | Spec | Jugar en |
|---|---|---|---|---|
| ASTEROIDES | `asteroides` | SHOOTER | `specs/06-asteroids-player.md` | `/game/asteroides/play` |
| CAÍDA | `caida` | PUZZLE | `specs/08-tetris-player.md` | `/game/caida/play` |
| ARKANOIDE | `arkanoide` | ARCADE | `specs/09-arkanoide-player.md` | `/game/arkanoide/play` |

---

## ASTEROIDES

> Pulveriza rocas espaciales en gravedad cero.

Pilota una nave triangular a la deriva en un campo de asteroides toroidal. Rota, propulsa y dispara para fragmentar rocas grandes en pedazos cada vez más pequeños, y atrapa el power-up de disparo triple antes de que se agote el tiempo.

| | |
|---|---|
| **`id`** | `asteroides` |
| **Categoría** | SHOOTER · color `cyan` · portada `cover-asteroides` |
| **Motor** | `lib/games/asteroids/engine.ts` |
| **Reproductor** | `components/games/AsteroidsPlayer.tsx` |
| **Origen del port** | `references/templates/started-games/02-asteroids/` |
| **Lienzo** | 800 × 600 |

**Controles**

| Tecla | Acción |
|---|---|
| ← / → | Rotar la nave |
| ↑ | Propulsión |
| Espacio | Disparar · reiniciar tras el game over |

**Reglas y puntuación**

- 3 vidas. El campo es toroidal: todo lo que sale por un borde reaparece por el opuesto.
- Puntos por asteroide destruido según su tamaño: **pequeño 100 · mediano 50 · grande 20**. Los grandes se fragmentan al recibir impacto.
- Power-up de **disparo triple**: 15 % de probabilidad de caída, dura 5 segundos y desaparece a los 12 si no se recoge.
- Al limpiar el campo se avanza de nivel.

---

## CAÍDA

> Encaja las piezas antes de que el techo te aplaste.

Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.

| | |
|---|---|
| **`id`** | `caida` |
| **Categoría** | PUZZLE · color `magenta` · portada `cover-tetro` |
| **Motor** | `lib/games/caida/engine.ts` |
| **Reproductor** | `components/games/CaidaPlayer.tsx` |
| **Origen del port** | `references/templates/started-games/03-tetris/` |
| **Tablero** | 10 × 20 celdas (bloque de 30 px) |

**Controles**

| Tecla | Acción |
|---|---|
| ← / → | Mover la pieza |
| ↓ | Caída suave (*soft drop*) |
| ↑ o X | Rotar |
| Espacio | Caída dura (*hard drop*) |
| P | Pausa |

**Reglas y puntuación**

- **8 tipos de pieza**: las siete clásicas `I O T S Z J L` más una pieza extra `N`.
- Líneas completadas de una vez, multiplicado por el nivel actual: **1 → 100 · 2 → 300 · 3 → 500 · 4 → 800**.
- Caída dura: +2 puntos por celda recorrida. Caída suave: +1 punto por celda.
- Muestra la pieza siguiente. El nivel —y con él la velocidad— sube cada 10 líneas.

---

## ARKANOIDE

> Rebota la pelota y destruye muros de bloques.

Controla una paleta y rebota una pelota luminosa para pulverizar 5 niveles de muros de bloques cromáticos. La pelota gana velocidad en cada nivel — no pierdas tus 3 vidas antes de completar el desafío.

| | |
|---|---|
| **`id`** | `arkanoide` |
| **Categoría** | ARCADE · color `magenta` · portada `cover-arkanoide` |
| **Motor** | `lib/games/arkanoide/engine.ts` |
| **Reproductor** | `components/games/ArkanoidePlayer.tsx` |
| **Origen del port** | `references/templates/started-games/04-arkanoid/` |
| **Assets** | `public/games/arkanoide/` — `spritesheet-breakout.png`, `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3` |

**Controles**

| Tecla | Acción |
|---|---|
| ← / → | Mover la paleta |
| P o Esc | Pausa |

**Reglas y puntuación**

- 3 vidas y **5 niveles**, cada uno con su propia disposición de bloques (muro completo, pirámide, tablero de ajedrez, huecos y un patrón final) y mayor velocidad de pelota.
- **10 puntos** por bloque destruido.
- Es el único juego con sonido: rebote de pelota y rotura de bloque.

---

## Infraestructura común

Los tres juegos comparten exactamente el mismo patrón, descrito en `CLAUDE.md` y automatizado por la skill `/new-game`:

- **Motor headless** en `lib/games/<id>/engine.ts` — lógica pura sobre canvas, sin React. Expone `create<Nombre>Game(canvas, onStateChange)` y devuelve un objeto con `destroy()`.
- **Componente cliente** en `components/games/<Nombre>Player.tsx` — monta el canvas, refleja el estado en un HUD de React y guarda el score una sola vez por partida.
- **Despacho** por `id` en `app/game/[id]/play/page.tsx`.
- **Leaderboard real**: al llevar `playable: true`, el juego aparece en `/jugables` y sus tablas en `/game/<id>` y `/hall-of-fame` leen de la tabla única `scores` de Supabase (`lib/supabase/scores.ts`), filtrada por `game_id`. El nombre del jugador viene de la sesión mock (`lib/session.ts`).
