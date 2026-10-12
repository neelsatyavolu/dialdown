import { z } from "zod";

export const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
export type Effort = (typeof EFFORTS)[number];

const score = z.number().nullish();

export const rawModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  model_creator: z.object({ name: z.string() }),
  evaluations: z.object({
    terminalbench_v4_0: score,
    scicode: score,
    artificial_analysis_intelligence_index: score,
  }),
});

export type RawModel = z.infer<typeof rawModelSchema>;

export type Entry = {
  id: string;
  model: string;
  effort: Effort | null;
  maker: string;
  terminalBench: number;
  sciCode: number;
  score: number;
  intelligence: number | null;
  costPerTask: number;
};

const isEffort = (value: string): value is Effort => (EFFORTS as readonly string[]).includes(value);

// "Claude Opus 5.5 (Medium, Default Fallback)" -> model "Claude Opus 5.5", effort "medium".
// A trailing parenthetical with no effort word, such as "(0902)", stays part of the model name.
export function parseName(name: string): { model: string; effort: Effort | null } {
  const match = name.match(/\s*\(([^)]*)\)$/);
  if (!match) return { model: name, effort: null };
  const effort = match[1]
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .find(isEffort);
  if (!effort) return { model: name, effort: null };
  return { model: name.slice(0, match.index), effort };
}

export function parseEntry(raw: RawModel, costs: ReadonlyMap<string, number>): Entry | null {
  const { terminalbench_v4_0: terminalBench, scicode: sciCode } = raw.evaluations;
  const costPerTask = costs.get(raw.name);
  if (terminalBench == null || sciCode == null || costPerTask === undefined) return null;
  return {
    id: raw.id,
    ...parseName(raw.name),
    maker: raw.model_creator.name,
    terminalBench: terminalBench * 100,
    sciCode: sciCode * 100,
    score: (terminalBench + sciCode) * 50,
    intelligence: raw.evaluations.artificial_analysis_intelligence_index ?? null,
    costPerTask,
  };
}
