import { describe, expect, it } from "vitest";
import { parseEntry, parseName, type RawModel } from "./parse";

const NAME = "Claude Opus 5.5 (Medium, Default Fallback)";
const costs = new Map([[NAME, 1.34]]);

const raw = (over: Partial<RawModel> = {}): RawModel => ({
  id: "id-1",
  name: NAME,
  model_creator: { name: "Anthropic" },
  evaluations: {
    terminalbench_v4_0: 0.5,
    scicode: 0.6,
    artificial_analysis_intelligence_index: 51.2,
  },
  ...over,
});

describe("parseName", () => {
  it("reads a plain effort label", () => {
    expect(parseName("GPT-6.1 Sol (Xhigh)")).toEqual({ model: "GPT-6.1 Sol", effort: "xhigh" });
  });

  it("reads an effort label followed by a fallback note", () => {
    expect(parseName(NAME)).toEqual({ model: "Claude Opus 5.5", effort: "medium" });
  });

  it("reads an effort label that is not first", () => {
    expect(parseName("Claude Sonnet 5 (Non-reasoning, High)")).toEqual({
      model: "Claude Sonnet 5",
      effort: "high",
    });
  });

  it("keeps the full name when the parenthetical is not an effort", () => {
    expect(parseName("Qwen3.8 Max (0902)")).toEqual({ model: "Qwen3.8 Max (0902)", effort: null });
  });

  it("handles a name with no parenthetical", () => {
    expect(parseName("MiniMax-M3")).toEqual({ model: "MiniMax-M3", effort: null });
  });
});

describe("parseEntry", () => {
  it("averages the two coding benchmarks into a 0 to 100 score and attaches the cost", () => {
    expect(parseEntry(raw(), costs)).toMatchObject({
      id: "id-1",
      model: "Claude Opus 5.5",
      effort: "medium",
      maker: "Anthropic",
      terminalBench: 50,
      sciCode: 60,
      score: expect.closeTo(55),
      intelligence: 51.2,
      costPerTask: 1.34,
    });
  });

  it("drops an entry missing either benchmark", () => {
    expect(parseEntry(raw({ evaluations: { terminalbench_v4_0: null, scicode: 0.6 } }), costs)).toBeNull();
    expect(parseEntry(raw({ evaluations: { terminalbench_v4_0: 0.5 } }), costs)).toBeNull();
  });

  it("drops an entry with no cost per task", () => {
    expect(parseEntry(raw(), new Map())).toBeNull();
    expect(parseEntry(raw({ name: "Claude Opus 5.5 (High, Default Fallback)" }), costs)).toBeNull();
  });

  it("allows a missing intelligence index", () => {
    const entry = parseEntry(raw({ evaluations: { terminalbench_v4_0: 0.5, scicode: 0.6 } }), costs);
    expect(entry?.intelligence).toBeNull();
  });
});
