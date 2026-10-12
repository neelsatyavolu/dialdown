import { getLeaderboard } from "@/lib/leaderboard";
import { EFFORTS } from "@/lib/parse";
import { FLOOR_RATIO, type Ladder, type Pick, type Rung } from "@/lib/rank";

// Must be a literal for Next.js; keep in step with REVALIDATE_SECONDS.
export const revalidate = 3600;

const SOURCE_URL = "https://artificialanalysis.ai/";

const fixed = (value: number, digits = 1) => value.toFixed(digits);
const usd = (value: number) => `$${value.toFixed(2)}`;

function ThePick({ pick, best }: { pick: Pick; best: number }) {
  const share = Math.round((pick.score / best) * 100);
  const stats = [
    ["Coding score", fixed(pick.score)],
    ["Cost per task", usd(pick.costPerTask)],
    ["Score per $", fixed(pick.perDollar)],
    ["Intelligence", pick.intelligence === null ? "n/a" : fixed(pick.intelligence)],
  ];
  return (
    <div className="pick">
      <div className="pick-main">
        <span className="label">The pick</span>
        <p className="pick-name">{pick.model}</p>
        <span className="pick-effort">
          <span className="dot" />
          {pick.effort ? `${pick.effort} effort` : "single setting"}
        </span>
        <p className="prose">
          Keeps {share}% of the best coding score on the board, and returns more score per dollar than any other
          entry that clears the bar.
        </p>
      </div>
      <div className="pick-stats">
        {stats.map(([label, value]) => (
          <div className="stat" key={label}>
            <span className="label">{label}</span>
            <span className="num">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopTen({ picks }: { picks: Pick[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Model</th>
            <th>Effort</th>
            <th>Coding</th>
            <th className="wide">Terminal-Bench</th>
            <th className="wide">SciCode</th>
            <th className="wide">Intelligence</th>
            <th>Cost / task</th>
            <th>Score / $</th>
          </tr>
        </thead>
        <tbody>
          {picks.map((pick, index) => (
            <tr key={pick.id}>
              <td className="num">{String(index + 1).padStart(2, "0")}</td>
              <td>
                <span className="model">{pick.model}</span>
                <span className="maker">{pick.maker}</span>
              </td>
              <td className={pick.effort ? "effort" : "effort dim"}>{pick.effort ?? "single"}</td>
              <td className="num">{fixed(pick.score)}</td>
              <td className="num wide dim">{fixed(pick.terminalBench)}%</td>
              <td className="num wide dim">{fixed(pick.sciCode)}%</td>
              <td className="num wide dim">{pick.intelligence === null ? "n/a" : fixed(pick.intelligence)}</td>
              <td className="num">{usd(pick.costPerTask)}</td>
              <td className="num">{fixed(pick.perDollar)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RungCell({ rung, single = false }: { rung: Rung; single?: boolean }) {
  const state = rung.ranked ? "ranked" : rung.qualifies ? "" : "below";
  return (
    <span className={`rung num ${state} ${single ? "single" : ""}`}>
      {fixed(rung.score)}
      <span className="rung-cost">{usd(rung.costPerTask)}</span>
    </span>
  );
}

function LadderRow({ ladder }: { ladder: Ladder }) {
  const hasEffortLevels = ladder.rungs.some((rung) => rung.effort);
  return (
    <div className="ladder-row">
      <span className="model">{ladder.model}</span>
      {hasEffortLevels ? (
        EFFORTS.map((effort) => {
          const rung = ladder.rungs.find((candidate) => candidate.effort === effort);
          return rung ? <RungCell rung={rung} key={effort} /> : <span className="rung" key={effort} />;
        })
      ) : (
        <RungCell rung={ladder.rungs[0]} single />
      )}
    </div>
  );
}

function Ladders({ ladders }: { ladders: Ladder[] }) {
  return (
    <div>
      <div className="ladder-row ladder-head">
        <span className="label">Model</span>
        {EFFORTS.map((effort) => (
          <span className="label" key={effort}>
            {effort}
          </span>
        ))}
      </div>
      {ladders.map((ladder) => (
        <LadderRow ladder={ladder} key={`${ladder.maker} ${ladder.model}`} />
      ))}
    </div>
  );
}

export default async function Page() {
  const { picks, ladders, floor, rated, fetchedAt } = await getLeaderboard();
  const best = floor / FLOOR_RATIO;
  const updated = new Date(fetchedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <main>
      <header className="hero">
        <span className="label">Dialdown / coding models</span>
        <h1>
          Dial the effort down<span className="caret">▏</span>
        </h1>
        <p className="prose">
          Max effort tops every chart and empties every budget. This board takes every model at every effort level,
          keeps the ones that still code near the top, and ranks them by how much score a dollar buys.
        </p>
        <ThePick pick={picks[0]} best={best} />
      </header>

      <section>
        <div className="section-head">
          <h2>Top 10</h2>
          <span className="label">Updated {updated}</span>
        </div>
        <TopTen picks={picks} />
      </section>

      <section>
        <div className="section-head">
          <h2>Effort ladder</h2>
          <span className="label">Coding score and cost per task</span>
        </div>
        <Ladders ladders={ladders} />
        <p className="ladder-note">
          Blue marks a level in the top 10. Faded scores fall under the bar of {fixed(floor)}. An empty cell means
          that level has not been rated.
        </p>
      </section>

      <section>
        <div className="section-head">
          <h2>Method</h2>
          <span className="label">{rated} rated entries</span>
        </div>
        <div className="method prose">
          <ol>
            <li>Each model at each effort level is its own entry.</li>
            <li>Coding score is the average of Terminal-Bench 4.0 and SciCode.</li>
            <li>
              The bar is {FLOOR_RATIO * 100}% of the best score on the board: {fixed(floor)} today.
            </li>
            <li>Entries over the bar are ordered by coding score per dollar of cost per task.</li>
          </ol>
          <div>
            <p>
              Cost per task is what Artificial Analysis measured each entry spending, on average, on one task of
              their Intelligence Index. It counts the reasoning tokens an effort level burns, which a price list
              cannot show.
            </p>
            <p>
              That index covers more than coding, so the cost is a general measure of how expensive an entry is to
              run, set against a coding-only score.
            </p>
          </div>
        </div>
      </section>

      <footer>
        <span className="label">
          Data: <a href={SOURCE_URL}>Artificial Analysis</a>
        </span>
        <span className="label">Refreshed hourly</span>
      </footer>
    </main>
  );
}
