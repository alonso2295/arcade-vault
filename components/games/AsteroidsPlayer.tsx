"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createAsteroidsGame, type AsteroidsState } from "@/lib/games/asteroids/engine";
import { getSession } from "@/lib/session";
import { saveScore } from "@/lib/supabase/scores";

export function AsteroidsPlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<AsteroidsState>({
    score: 0,
    lives: 3,
    level: 1,
    state: "playing",
  });
  const scoreSavedRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = createAsteroidsGame(canvasRef.current, setGameState);
    return () => game.destroy();
  }, []);

  useEffect(() => {
    if (gameState.state === "gameover" && !scoreSavedRef.current) {
      scoreSavedRef.current = true;
      const playerName = getSession()?.name ?? "ANÓNIMO";
      saveScore({ gameId: "asteroides", playerName, score: gameState.score });
    }
    if (gameState.state === "playing") {
      scoreSavedRef.current = false;
    }
  }, [gameState.state, gameState.score]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10">
      <div className="flex w-[800px] max-w-full items-center justify-between px-1 font-mono text-sm tracking-wide text-zinc-300">
        <span>
          SCORE <b className="text-[var(--cyan)]">{gameState.score}</b>
        </span>
        <span>
          NIVEL <b className="text-[var(--cyan)]">{gameState.level}</b>
        </span>
        <span>
          VIDAS <b className="text-[var(--cyan)]">{gameState.lives}</b>
        </span>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="max-w-full border border-white/10"
        />

        {gameState.state === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
            <p className="font-mono text-sm tracking-widest text-zinc-300">
              PUNTAJE FINAL: <b className="text-[var(--cyan)]">{gameState.score}</b>
            </p>
            <Link href="/game/asteroides" className="btn xl pulse">
              VOLVER
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
