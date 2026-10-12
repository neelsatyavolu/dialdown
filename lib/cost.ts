const PAGE_URL = "https://artificialanalysis.ai/leaderboards/models";
const USER_AGENT = "dialdown/0.1 (+https://dialitdown.vercel.app)";
// The page listed 186 costed models on 2026-10-12; far fewer means its markup changed.
const MIN_EXPECTED_COSTS = 50;

const MODEL_COST = /"slug":"[^"]+","name":"([^"]+)"[^{}]*?"intelligenceIndexCostPerTask":([0-9.eE+-]+)/g;

// The leaderboard page embeds one JSON object per model. Cost per task is not in the data API,
// so it is read from there and joined to the API entries by model name.
export function parseCosts(html: string): Map<string, number> {
  const unescaped = html.replaceAll('\\"', '"');
  const pairs = [...unescaped.matchAll(MODEL_COST)]
    .map(([, name, cost]): [string, number] => [name, Number(cost)])
    .filter(([, cost]) => Number.isFinite(cost) && cost > 0);
  return new Map(pairs);
}

export async function fetchCosts(revalidate: number): Promise<Map<string, number>> {
  const response = await fetch(PAGE_URL, { headers: { "User-Agent": USER_AGENT }, next: { revalidate } });
  if (!response.ok) throw new Error(`Artificial Analysis leaderboard page returned ${response.status}`);
  const costs = parseCosts(await response.text());
  if (costs.size < MIN_EXPECTED_COSTS) {
    throw new Error(`Found cost per task for only ${costs.size} models; the page layout may have changed`);
  }
  return costs;
}
