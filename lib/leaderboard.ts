import { z } from "zod";
import { fetchCosts } from "./cost";
import { parseEntry, rawModelSchema } from "./parse";
import { rank, TOP_LIMIT, type Ranking } from "./rank";

const API_URL = "https://artificialanalysis.ai/api/v2/data/llms/models";
export const REVALIDATE_SECONDS = 60 * 60;

const responseSchema = z.object({ data: z.array(rawModelSchema) });

export type Leaderboard = Ranking & { rated: number; fetchedAt: string };

async function fetchModels() {
  const apiKey = process.env.AA_API_KEY;
  if (!apiKey) throw new Error("AA_API_KEY is not configured");

  const response = await fetch(API_URL, {
    headers: { "x-api-key": apiKey },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) throw new Error(`Artificial Analysis API returned ${response.status}`);
  return responseSchema.parse(await response.json()).data;
}

// Any throw here fails the build or, on a scheduled refresh, leaves the last good page in place.
export async function getLeaderboard(): Promise<Leaderboard> {
  const [models, costs] = await Promise.all([fetchModels(), fetchCosts(REVALIDATE_SECONDS)]);
  const entries = models.map((model) => parseEntry(model, costs)).filter((entry) => entry !== null);
  const ranking = rank(entries);
  if (ranking.picks.length < TOP_LIMIT) {
    throw new Error(`Only ${ranking.picks.length} entries qualified; expected ${TOP_LIMIT}`);
  }
  return { ...ranking, rated: entries.length, fetchedAt: new Date().toISOString() };
}
