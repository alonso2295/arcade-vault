"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createCaidaGame, type CaidaState } from "@/lib/games/caida/engine";
import { getSession } from "@/lib/session";
import { saveScore } from "@/lib/supabase/scores";

export function CaidaPlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<CaidaState>({
    score: 0,
    lines: 0,
    level: 1,
    state: "playing",
    nextPiece: "I",
  });
  const scoreSavedRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || !nextCanvasRef.current) return;
    const game = createCaidaGame(canvasRef.current, nextCanvasRef.current, setGameState);
    return () => game.destroy();
  }, []);

  useEffect(() => {
    if (gameState.state === "gameover" && !scoreSavedRef.current) {
      scoreSavedRef.current = true;
      const playerName = getSession()?.name ?? "ANÓNIMO";
      saveScore({ gameId: "caida", playerName, score: gameState.score });
    }
    if (gameState.state === "playing") {
      scoreSavedRef.current = false;
    }
  }, [gameState.state, gameState.score]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10">
      <div className="flex w-[300px] max-w-full items-center justify-between px-1 font-mono text-sm tracking-wide text-zinc-300">
        <span>
          SCORE <b className="text-[var(--magenta)]">{gameState.score}</b>
        </span>
        <span>
          NIVEL <b className="text-[var(--magenta)]">{gameState.level}</b>
        </span>
      </div>

      <div className="flex items-start gap-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={300}
            height={600}
            className="max-w-full border border-white/10"
          />

          {gameState.state === "gameover" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 px-4 text-center">
              <p className="font-mono text-sm tracking-widest text-zinc-300">
                PUNTAJE FINAL: <b className="text-[var(--magenta)]">{gameState.score}</b>
              </p>
              <Link href="/game/caida" className="btn xl pulse">
                VOLVER
              </Link>
            </div>
          )}

          {gameState.state === "paused" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
              <p className="font-mono text-lg tracking-widest text-zinc-300">PAUSA</p>
              <p className="font-mono text-xs tracking-wide text-zinc-500">Presiona P para continuar</p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 font-mono text-xs tracking-wide text-zinc-300">
          <span>SIGUIENTE</span>
          <canvas
            ref={nextCanvasRef}
            width={120}
            height={120}
            className="border border-white/10"
          />
          <span>
            LÍNEAS <b className="text-[var(--magenta)]">{gameState.lines}</b>
          </span>
        </div>
      </div>
    </div>
  );
}
