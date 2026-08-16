import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export interface ScoreRow {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  created_at: string;
}

export async function saveScore(params: {
  gameId: string;
  playerName: string;
  score: number;
}): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from("scores").insert({
    game_id: params.gameId,
    player_name: params.playerName,
    score: params.score,
  });

  if (error) {
    console.error("Error al guardar el score:", error.message);
  }
}

export async function getTopScores(
  gameId: string,
  limit: number,
  client: SupabaseClient = createBrowserClient()
): Promise<ScoreRow[]> {
  const { data, error } = await client
    .from("scores")
    .select("*")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error al obtener los scores:", error.message);
    return [];
  }

  return data ?? [];
}
