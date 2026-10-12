import { describe, expect, it } from "vitest";
import type { Effort, Entry } from "./parse";
import { rank } from "./rank";

let nextId = 0;
const entry = (model: string, effort: Effort | null, score: number, costPerTask: number): Entry => ({
  id: `id-${nextId++}`,
  model,
  effort,
  maker: "Maker",
  terminalBench: score,
  sciCode: score,
  score,
  intelligence: null,
  costPerTask,
});

const names = (picks: Entry[]) => picks.map((pick) => `${pick.model} ${pick.effort ?? "-"}`);

describe("rank", () => {
  it("sets the floor at a ratio of the best score and includes entries exactly on it", () => {
    const result = rank([entry("A", null, 100, 10), entry("B", null, 80, 10), entry("C", null, 79.9, 1)]);
    expect(result.floor).toBe(80);
    expect(result.picks.map((pick) => pick.model)).toEqual(["A", "B"]);
  });

  it("lets every effort level compete on score per dollar of cost per task", () => {
    const result = rank([
      entry("A", "max", 100, 6),
      entry("A", "high", 92, 2),
      entry("A", "low", 60, 0.5),
      entry("B", "medium", 85, 1),
    ]);
    expect(names(result.picks)).toEqual(["B medium", "A high", "A max"]);
    expect(result.picks[0].perDollar).toBe(85);
  });

  it("breaks a tie on score per dollar by the higher score", () => {
    const result = rank([entry("Low", null, 80, 8), entry("High", null, 100, 10)]);
    expect(result.picks.map((pick) => pick.model)).toEqual(["High", "Low"]);
  });

  it("returns at most the limit", () => {
    const entries = Array.from({ length: 15 }, (_, i) => entry(`M${i}`, null, 90, i + 1));
    expect(rank(entries).picks).toHaveLength(10);
    expect(rank(entries, { limit: 3 }).picks).toHaveLength(3);
  });

  it("builds one effort ladder per ranked model, lowest effort first", () => {
    const result = rank(
      [entry("A", "max", 100, 9), entry("A", "low", 60, 1), entry("A", "high", 90, 3), entry("B", "max", 95, 5)],
      { limit: 2 },
    );
    expect(names(result.picks)).toEqual(["A high", "B max"]);
    expect(result.ladders).toEqual([
      {
        model: "A",
        maker: "Maker",
        rungs: [
          { effort: "low", score: 60, costPerTask: 1, qualifies: false, ranked: false },
          { effort: "high", score: 90, costPerTask: 3, qualifies: true, ranked: true },
          { effort: "max", score: 100, costPerTask: 9, qualifies: true, ranked: false },
        ],
      },
      { model: "B", maker: "Maker", rungs: [{ effort: "max", score: 95, costPerTask: 5, qualifies: true, ranked: true }] },
    ]);
  });

  it("treats same-named models from different makers as separate", () => {
    const other = { ...entry("A", null, 90, 5), maker: "Other" };
    expect(rank([entry("A", null, 100, 10), other]).ladders).toHaveLength(2);
  });

  it("returns nothing for no entries and does not change its input", () => {
    expect(rank([])).toEqual({ floor: 0, picks: [], ladders: [] });
    const entries = [entry("A", "max", 100, 10), entry("A", "low", 90, 10)];
    const before = structuredClone(entries);
    rank(entries);
    expect(entries).toEqual(before);
  });
});
