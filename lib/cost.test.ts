import { describe, expect, it } from "vitest";
import { parseCosts } from "./cost";

const model = (name: string, cost: string) =>
  `{\\"slug\\":\\"some-slug\\",\\"name\\":\\"${name}\\",\\"isReasoning\\":true,\\"scicode\\":0.46,\\"intelligenceIndexCostPerTask\\":${cost},\\"price1mInputTokens\\":0.2}`;

describe("parseCosts", () => {
  it("reads cost per task for each model from the escaped page data", () => {
    const html = `<script>self.__next_f.push([1,"[${model("GPT-6.1 Sol (High)", "0.3195")},${model("Claude Opus 5.5 (Medium, Default Fallback)", "1.34")}]"])</script>`;
    expect(parseCosts(html)).toEqual(
      new Map([
        ["GPT-6.1 Sol (High)", 0.3195],
        ["Claude Opus 5.5 (Medium, Default Fallback)", 1.34],
      ]),
    );
  });

  it("skips models with no cost and does not borrow the next model's cost", () => {
    const html = `[${model("No Cost", "null")},${model("Has Cost", "2.5")}]`;
    expect(parseCosts(html)).toEqual(new Map([["Has Cost", 2.5]]));
  });

  it("reads past a nested scores object between the name and the cost", () => {
    const nested = (name: string, cost: string) =>
      `{\\"slug\\":\\"s\\",\\"name\\":\\"${name}\\",\\"scores\\":{\\"scicode\\":0.46,\\"critpt\\":0.17},\\"intelligenceIndexCostPerTask\\":${cost}}`;
    const noKey = `{\\"slug\\":\\"n\\",\\"name\\":\\"No Key\\",\\"scores\\":{\\"scicode\\":0.1}}`;
    const html = `[${nested("Nested", "0.78")},${noKey},${nested("After", "4.47")}]`;
    expect(parseCosts(html)).toEqual(
      new Map([
        ["Nested", 0.78],
        ["After", 4.47],
      ]),
    );
  });

  it("returns nothing for a page without model data", () => {
    expect(parseCosts("<html><body>maintenance</body></html>").size).toBe(0);
  });
});
