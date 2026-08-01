"use client";

import { useRouter } from "next/navigation";
import type { Game } from "@/lib/games";

export default function MiniGameCard({ game }: { game: Game }) {
  const router = useRouter();

  return (
    <div className="mini-card" onClick={() => router.push(`/game/${game.id}`)}>
      <div className="mini-cover">
        <div className={"cover-bg " + game.cover}></div>
      </div>
      <div className="mini-meta">
        <div className="mini-title">{game.title}</div>
        <div className="mini-cat">{game.cat}</div>
      </div>
    </div>
  );
}
