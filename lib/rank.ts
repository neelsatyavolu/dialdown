import { EFFORTS, type Effort, type Entry } from "./parse";

export const FLOOR_RATIO = 0.8;
export const TOP_LIMIT = 10;

export type Pick = Entry & { perDollar: number };
export type Rung = { effort: Effort | null; score: number; costPerTask: number; qualifies: boolean; ranked: boolean };
export type Ladder = { model: string; maker: string; rungs: Rung[] };
export type Ranking = { floor: number; picks: Pick[]; ladders: Ladder[] };

const modelKey = (entry: Entry) => `${entry.maker}\n${entry.model}`;

// Entries with no effort label sort last within a model.
const effortOrder = (effort: Effort | null) => (effort ? EFFORTS.indexOf(effort) : EFFORTS.length);
const byEffort = (a: Entry, b: Entry) => effortOrder(a.effort) - effortOrder(b.effort) || a.score - b.score;

// Rounding keeps a score that sits on the floor from failing on float error (0.8 * 100 is 80.00000000000001).
const round = (value: number) => Math.round(value * 1e6) / 1e6;

export function rank(
  entries: readonly Entry[],
  { floorRatio = FLOOR_RATIO, limit = TOP_LIMIT }: { floorRatio?: number; limit?: number } = {},
): Ranking {
  if (entries.length === 0) return { floor: 0, picks: [], ladders: [] };
  const floor = round(Math.max(...entries.map((entry) => entry.score)) * floorRatio);
  const qualifies = (entry: Entry) => round(entry.score) >= floor;

  const picks = entries
    .filter(qualifies)
    .map((entry): Pick => ({ ...entry, perDollar: entry.score / entry.costPerTask }))
    .toSorted((a, b) => b.perDollar - a.perDollar || b.score - a.score)
    .slice(0, limit);

  const rankedIds = new Set(picks.map((pick) => pick.id));
  const byModel = Map.groupBy(entries, modelKey);
  const ladders = [...new Set(picks.map(modelKey))].map((key): Ladder => {
    const group = (byModel.get(key) ?? []).toSorted(byEffort);
    return {
      model: group[0].model,
      maker: group[0].maker,
      rungs: group.map((entry) => ({
        effort: entry.effort,
        score: entry.score,
        costPerTask: entry.costPerTask,
        qualifies: qualifies(entry),
        ranked: rankedIds.has(entry.id),
      })),
    };
  });

  return { floor, picks, ladders };
}
