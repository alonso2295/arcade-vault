// ===== lib/games/caida/engine.ts — Tetris ("Caída") game engine (ported from references/templates/started-games/03-tetris/game.js) =====

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L" | "N";

export interface CaidaState {
  score: number;
  lines: number;
  level: number;
  state: "playing" | "paused" | "gameover";
  nextPiece: PieceType;
}

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const NEXT_BLOCK = 30;

const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L", "N"];

const COLORS: Record<PieceType, string> = {
  I: "#4dd0e1",
  O: "#ffd54f",
  T: "#ba68c8",
  S: "#81c784",
  Z: "#e57373",
  J: "#90caf9",
  L: "#ffb74d",
  N: "#9e9e9e",
};

const SHAPES: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  N: [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
};

const LINE_SCORES = [0, 100, 300, 500, 800];

const GRID_LINE = "rgba(255,255,255,0.08)";

interface Piece {
  type: PieceType;
  shape: number[][];
  x: number;
  y: number;
}

function createBoard(): PieceType[][] {
  return Array.from({ length: ROWS }, () => new Array<PieceType | 0>(COLS).fill(0)) as PieceType[][];
}

function randomPiece(): Piece {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  const shape = SHAPES[type].map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

function collide(board: (PieceType | 0)[][], shape: number[][], ox: number, oy: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

export function createCaidaGame(
  canvas: HTMLCanvasElement,
  nextCanvas: HTMLCanvasElement,
  onStateChange: (s: CaidaState) => void
): { destroy(): void } {
  const ctx = canvas.getContext("2d")!;
  const nextCtx = nextCanvas.getContext("2d")!;

  let board: (PieceType | 0)[][] = createBoard();
  let current: Piece;
  let next: Piece;
  let score = 0;
  let lines = 0;
  let level = 1;
  let paused = false;
  let gameOver = false;
  let dropInterval = 1000;
  let dropAccum = 0;
  let lastTime: number | null = null;
  let rafId = 0;

  let lastScore = -1;
  let lastLines = -1;
  let lastLevel = -1;
  let lastState: CaidaState["state"] | null = null;
  let lastNextPiece: PieceType | null = null;

  function notifyStateChange() {
    const state: CaidaState["state"] = gameOver ? "gameover" : paused ? "paused" : "playing";
    if (
      score !== lastScore ||
      lines !== lastLines ||
      level !== lastLevel ||
      state !== lastState ||
      next.type !== lastNextPiece
    ) {
      lastScore = score;
      lastLines = lines;
      lastLevel = level;
      lastState = state;
      lastNextPiece = next.type;
      onStateChange({ score, lines, level, state, nextPiece: next.type });
    }
  }

  function ghostY(): number {
    let gy = current.y;
    while (!collide(board, current.shape, current.x, gy + 1)) gy++;
    return gy;
  }

  function merge() {
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c]) board[current.y + r][current.x + c] = current.type;
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((v) => v !== 0)) {
        board.splice(r, 1);
        board.unshift(new Array(COLS).fill(0) as (PieceType | 0)[]);
        cleared++;
        r++;
      }
    }
    if (cleared) {
      lines += cleared;
      score += (LINE_SCORES[cleared] || 0) * level;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    }
  }

  function spawn() {
    current = next;
    next = randomPiece();
    if (collide(board, current.shape, current.x, current.y)) {
      endGame();
    }
  }

  function lockPiece() {
    merge();
    clearLines();
    spawn();
  }

  function hardDrop() {
    const gy = ghostY();
    score += (gy - current.y) * 2;
    current.y = gy;
    lockPiece();
  }

  function softDrop() {
    if (!collide(board, current.shape, current.x, current.y + 1)) {
      current.y++;
      score += 1;
    } else {
      lockPiece();
    }
  }

  function tryRotate() {
    const rotated = rotateCW(current.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collide(board, rotated, current.x + kick, current.y)) {
        current.shape = rotated;
        current.x += kick;
        return;
      }
    }
  }

  function endGame() {
    gameOver = true;
    cancelAnimationFrame(rafId);
    notifyStateChange();
  }

  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    if (!paused) {
      lastTime = null;
      rafId = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(rafId);
    }
    notifyStateChange();
  }

  function drawBlock(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    piece: PieceType | 0,
    size: number,
    alpha?: number
  ) {
    if (!piece) return;
    context.globalAlpha = alpha ?? 1;
    context.fillStyle = COLORS[piece];
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    context.fillStyle = "rgba(255,255,255,0.12)";
    context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    context.globalAlpha = 1;
  }

  function drawGrid() {
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK, 0);
      ctx.lineTo(c * BLOCK, ROWS * BLOCK);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK);
      ctx.lineTo(COLS * BLOCK, r * BLOCK);
      ctx.stroke();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) drawBlock(ctx, c, r, board[r][c], BLOCK);

    const gy = ghostY();
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c]) drawBlock(ctx, current.x + c, gy + r, current.type, BLOCK, 0.2);

    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c]) drawBlock(ctx, current.x + c, current.y + r, current.type, BLOCK);
  }

  function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const shape = next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) drawBlock(nextCtx, offX + c, offY + r, next.type, NEXT_BLOCK);
  }

  function loop(ts: number) {
    if (lastTime === null) lastTime = ts;
    const dt = ts - lastTime;
    lastTime = ts;
    dropAccum += dt;
    if (dropAccum >= dropInterval) {
      dropAccum = 0;
      if (!collide(board, current.shape, current.x, current.y + 1)) {
        current.y++;
      } else {
        lockPiece();
      }
    }
    draw();
    drawNext();
    notifyStateChange();
    if (gameOver) return;
    rafId = requestAnimationFrame(loop);
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "KeyP") {
      togglePause();
      return;
    }
    if (paused || gameOver) return;
    switch (e.code) {
      case "ArrowLeft":
        if (!collide(board, current.shape, current.x - 1, current.y)) current.x--;
        break;
      case "ArrowRight":
        if (!collide(board, current.shape, current.x + 1, current.y)) current.x++;
        break;
      case "ArrowDown":
        softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        tryRotate();
        break;
      case "Space":
        e.preventDefault();
        hardDrop();
        break;
    }
  };

  window.addEventListener("keydown", onKeyDown);

  next = randomPiece();
  spawn();
  rafId = requestAnimationFrame(loop);

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
    },
  };
}
