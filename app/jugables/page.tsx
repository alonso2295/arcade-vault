import { GAMES } from "@/lib/games";
import MiniGameCard from "@/components/MiniGameCard";

export default function JugablesPage() {
  const playableGames = GAMES.filter((g) => g.playable);

  return (
    <div className="fade-in" style={{ padding: "40px 24px" }}>
      <h1 className="neon-cyan" style={{ marginBottom: 24 }}>
        JUEGOS JUGABLES
      </h1>
      <div className="mini-rail">
        {playableGames.map((game) => (
          <MiniGameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
