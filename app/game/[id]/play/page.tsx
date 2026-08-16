import { AsteroidsPlayer } from "@/components/games/AsteroidsPlayer";
import { CaidaPlayer } from "@/components/games/CaidaPlayer";

export default async function GamePlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "asteroides") {
    return <AsteroidsPlayer />;
  }

  if (id === "caida") {
    return <CaidaPlayer />;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Reproductor</h1>
      <p className="mt-2 text-sm text-zinc-400">Próximamente</p>
    </div>
  );
}
