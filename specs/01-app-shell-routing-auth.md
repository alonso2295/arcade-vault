# 01 — App Shell, Routing & Auth

- **Estado:** Implementado
- **Depende de:** Ninguno (primer spec del proyecto)
- **Fecha:** 2026-07-28
- **Objetivo:** Construir el shell de la aplicación Arcade Vault (layout, navegación y sesión mock) sobre Next.js App Router, dejando listas las rutas `/`, `/game/[id]`, `/game/[id]/play`, `/hall-of-fame` y `/auth` para que los siguientes specs implementen sus pantallas.

## Contexto

Este es el primero de tres specs que conforman el MVP de Arcade Vault, portado desde los prototipos estáticos en `references/templates/` (`app.jsx`, `nav.jsx`, `auth.jsx`, `data.jsx`, `styles.css`). La división acordada es:

1. **Spec 1 (este documento):** Shell de la app, routing, Nav, Auth mock.
2. **Spec 2:** Biblioteca (grid + filtros) y Detalle de juego (leaderboard, stats).
3. **Spec 3:** Reproductor (HUD + CRT simulado) y Salón de la Fama (podio + tabla), con persistencia de puntuaciones.

## Scope

**Dentro del alcance:**
- Layout raíz (`app/layout.tsx`) con fondo `.av-bg`/`.av-noise` (ya aplicado), `Nav` y `footer` globales.
- Componente `Nav` (desktop + panel móvil con hamburguesa) con links a Biblioteca (`/`) y Salón de la Fama (`/hall-of-fame`), contador de créditos estático ("CRÉDITOS · 03"), y botón de sesión (login / `{nombre} ▾` que cierra sesión al click).
- Rutas placeholder creadas y navegables (aunque su contenido real lo implementen Spec 2 y Spec 3): `app/page.tsx` (`/`), `app/game/[id]/page.tsx` (`/game/[id]`), `app/game/[id]/play/page.tsx` (`/game/[id]/play`), `app/hall-of-fame/page.tsx` (`/hall-of-fame`).
- Pantalla y lógica de `/auth` completa: tabs "Iniciar sesión" / "Crear cuenta", formulario mock (usuario, email solo en registro, contraseña), botón "Jugar como invitado", botones sociales decorativos (Google/GitHub, sin funcionalidad), sin validación real.
- Gestión de sesión mock: `{ name }` persistido en `localStorage` bajo la clave `av_user`; login, registro y "jugar como invitado" navegan a `/` tras completarse; sign out limpia la sesión.
- Archivo de datos mock `lib/games.ts` con `GAMES`, `CATS`, `PLAYERS` y la función `seededScores`, portados de `data.jsx` (se usarán en Spec 2 y 3, pero se crean aquí como base compartida).
- Contenido real de Biblioteca (`app/page.tsx`): hero, buscador, chips de filtro por categoría y grid de tarjetas de juego, portado de `biblioteca.jsx`. Al hacer click en una tarjeta o "JUGAR", navega a `/game/[id]` (cuyo contenido real sigue siendo Spec 2).

**Fuera del alcance (se cubre en specs posteriores):**
- Contenido real de Detalle de juego (portada, tags, leaderboard, stats) → Spec 2.
- Reproductor (HUD, CRT simulado, modal de fin de juego, guardado de puntuación) → Spec 3.
- Salón de la Fama (podio, tabla de puntuaciones) → Spec 3.
- Persistencia de puntuaciones (`av_scores` en localStorage) → Spec 3.
- Cualquier backend, base de datos o autenticación real.
- Protección de rutas / redirects basados en sesión (según lo acordado, `/game/[id]/play` es accesible sin sesión).

## Data model

**`lib/games.ts`** (nuevo, portado de `data.jsx`):
```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;   // clase CSS del cover generado (ej. "cover-bricks")
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}

export const GAMES: Game[];
export const CATS: readonly ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];
export const PLAYERS: readonly string[];

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/AAAA"
}

export function seededScores(seed: number, count?: number): ScoreRow[];
```

**`lib/session.ts`** (nuevo — sesión mock vía localStorage):
```ts
export interface SessionUser {
  name: string;
}

const STORAGE_KEY = "av_user"; // localStorage

export function getSession(): SessionUser | null;
export function setSession(user: SessionUser | null): void;
export function clearSession(): void;
```

Nota: como es estado de cliente (localStorage) atado a Auth/Nav, se expondrá también vía un hook simple `useSession()` (Client Component) que envuelve `lib/session.ts` y sincroniza el estado en memoria para que `Nav` y `Auth` se actualicen sin recargar la página.

## Plan de implementación

1. **Datos mock compartidos** — Crear `lib/games.ts` portando `GAMES`, `CATS`, `PLAYERS` y `seededScores` desde `references/templates/data.jsx` a TypeScript tipado.
2. **Sesión mock** — Crear `lib/session.ts` (get/set/clear sobre `localStorage["av_user"]`) y el hook `useSession()` como Client Component/hook para que Nav y Auth reaccionen a cambios de sesión.
3. **Rutas placeholder** — Crear `app/game/[id]/page.tsx`, `app/game/[id]/play/page.tsx`, `app/hall-of-fame/page.tsx` como páginas mínimas (título + mensaje "Próximamente") que confirman que el routing funciona.
3b. **Biblioteca (`app/page.tsx`)** — Portar `biblioteca.jsx`: `components/GameCard.tsx` (tarjeta con cover, categoría, título, descripción, mejor puntuación y botón "JUGAR") y la página `/` con hero, buscador (filtra por nombre) y chips de categoría (`CATS`) sobre `GAMES` de `lib/games.ts`. Click en tarjeta o "JUGAR" navega a `/game/[id]`.
4. **Componente Nav** — Crear `components/Nav.tsx` (Client Component) portando `nav.jsx`: logo, links activos según ruta actual (`usePathname`), contador de créditos, botón de sesión, panel móvil con hamburguesa. Usa `useSession()` para mostrar login/nombre de usuario.
5. **Layout raíz** — Integrar `Nav` y `footer` en `app/layout.tsx` (ya tiene `.av-bg`/`.av-noise`), envolviendo `{children}` en `<main className="av-main">`.
6. **Pantalla Auth** — Crear `app/auth/page.tsx` + `components/AuthForm.tsx` (Client Component) portando `auth.jsx`: tabs, formulario mock, "jugar como invitado", botones sociales decorativos. Al enviar, llama a `setSession` y navega a `/` con `useRouter().push("/")`.
7. **Verificación manual** — Levantar `npm run dev`, navegar entre las 5 rutas desde el Nav (desktop y móvil), hacer login/registro/invitado, cerrar sesión, y confirmar que `av_user` persiste tras recargar la página.

## Criterios de aceptación

- [x] `app/layout.tsx` renderiza `.av-bg`, `.av-noise`, `Nav` y `footer` en todas las páginas.
- [x] Las rutas `/`, `/game/[id]`, `/game/[id]/play`, `/hall-of-fame` y `/auth` existen y navegan sin error 404.
- [x] El `Nav` desktop muestra links a "Biblioteca" y "Salón de la Fama", marcando el activo según la ruta actual (incluye `/game/[id]` y `/game/[id]/play` como parte de "Biblioteca" activa).
- [x] En viewport ≤840px el `Nav` oculta los links y el contador de créditos, mostrando el botón hamburguesa que abre el panel móvil (`av-mobile-panel`) con backdrop.
- [x] Sin sesión, el `Nav` muestra el botón "Iniciar Sesión" que navega a `/auth`.
- [x] En `/auth`, completar el tab "Iniciar sesión" (o "Crear cuenta") y enviar el formulario guarda `{ name }` en `localStorage["av_user"]`, actualiza el `Nav` a `{NOMBRE} ▾`, y redirige a `/`.
- [x] En `/auth`, el botón "Jugar como invitado" limpia cualquier sesión previa y navega a `/` sin requerir datos del formulario.
- [x] Con sesión activa, hacer click en `{NOMBRE} ▾` en el `Nav` cierra la sesión (borra `av_user`) inmediatamente, sin confirmación ni menú desplegable.
- [x] Recargar la página (`F5`) conserva la sesión si existía (`av_user` persiste en `localStorage`).
- [x] Navegar a `/game/[id]/play` funciona sin sesión activa (no hay redirect a `/auth`).
- [x] `lib/games.ts` exporta `GAMES` (8 juegos, igual que el template), `CATS`, `PLAYERS` y `seededScores` con las mismas firmas/comportamiento que `data.jsx`.
- [x] `/` muestra el hero, buscador, chips de categoría y el grid con los 8 juegos (Bloque Buster, Caída, Serpentina, Glotón, Invasores, Rocas, Ranaria, Duelo Pixel); buscar filtra por nombre y los chips filtran por categoría.
- [x] Click en una tarjeta o su botón "JUGAR" navega a `/game/[id]` con el `id` del juego correspondiente.
- [x] `npm run build` compila sin errores de TypeScript ni de ESLint.

## Decisiones tomadas y descartadas

- **Next.js App Router real en vez de hash routing** — Se descarta replicar el patrón `location.hash` con JSON del template porque no es idiomático en Next 16 y perdería SEO, back/forward nativo y file-based routing. Se usan rutas reales (`/`, `/game/[id]`, etc.).
- **Rutas en inglés (`/game/[id]`, `/hall-of-fame`) en vez de español** — Convención más estándar en código Next, aunque los textos de la UI se mantienen en español como en el template.
- **Auth 100% mock, sin backend** — Fiel al template: no hay validación real de usuario/contraseña ni verificación de email. Se prioriza velocidad de MVP; una integración de auth real quedaría para un spec futuro fuera de este alcance.
- **Botones sociales (Google/GitHub) se mantienen como decorativos** — Se conservan del template por fidelidad visual, sin funcionalidad real, ya que no hay backend de auth en este MVP.
- **Jugar sin sesión permitido en `/game/[id]/play`** — Se mantiene el comportamiento original del template (nombre por defecto "INVITADO") en vez de forzar login, para no bloquear el flujo principal de "jugar" en el MVP.
- **Botón de sesión en Nav sin dropdown real** — Aunque el texto "{NOMBRE} ▾" sugiere un menú desplegable, se replica el comportamiento original del template (click = cerrar sesión directo) para no añadir alcance no solicitado por el template.
- **`lib/games.ts` centraliza datos mock aunque su consumo real sea en Spec 2/3** — Se crea aquí porque es una base compartida por múltiples pantallas futuras y evita duplicar el mapeo del template en cada spec.

## Riesgos identificados

- **Acceso a `localStorage` en Server Components** — Next App Router renderiza en servidor por defecto; `lib/session.ts` y cualquier lectura de `av_user` debe ejecutarse solo en Client Components (`"use client"`) para evitar errores de `localStorage is not defined`.
- **Hydration mismatch en el Nav** — Si el estado de sesión se lee de forma síncrona antes del montaje en cliente, el HTML del servidor (sin sesión) puede no coincidir con el cliente (con sesión). Mitigación: leer la sesión en un `useEffect` y renderizar el estado "sin sesión" hasta el primer render en cliente.
