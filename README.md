# Dialdown

A leaderboard of the coding models worth running all day: every model at every
effort level, ranked by how much coding score a dollar buys.

Live at https://dialitdown.vercel.app

Max effort tops every benchmark chart, but few people can afford to run it for
heavy daily coding. Dialdown looks for the entries that stay near the top while
costing far less.

## How the ranking works

1. Each model at each effort level is its own entry, for example
   `Claude Opus 5.5 (medium)`.
2. Coding score is the average of Terminal-Bench 4.0 and SciCode, on a 0 to 100
   scale.
3. The bar is 80% of the best coding score on the board. Entries under it are
   out.
4. Entries over the bar are ordered by coding score divided by cost per task.
   The first 10 are shown.

Cost per task is the average cost Artificial Analysis measured for one task of
their Intelligence Index. It counts the reasoning tokens an effort level burns,
which token prices alone do not show. The index covers more than coding, so it
is a general measure of running cost set against a coding-only score.

## Data

All data comes from [Artificial Analysis](https://artificialanalysis.ai/).

- Benchmark scores come from their free data API
  (`/api/v2/data/llms/models`), which needs an API key.
- Cost per task is not in that API. It is read from the data embedded in their
  public leaderboard page and joined by model name (`lib/cost.ts`). Their Terms
  of Use restrict automated access to the site, so check them before you run
  your own copy.

The page is rebuilt at most once an hour. If either source fails, or fewer than
10 entries qualify, the rebuild throws and the last good page stays up.

## Run it

```bash
pnpm install
AA_API_KEY=your_key pnpm dev
```

Get a free key by creating an account at artificialanalysis.ai. On Vercel, set
`AA_API_KEY` as an environment variable.

```bash
pnpm test        # parsing and ranking tests
pnpm typecheck
pnpm build
```

## Layout

| File | Does |
|---|---|
| `lib/parse.ts` | Validates an API entry and splits its name into model and effort |
| `lib/cost.ts` | Reads cost per task from the leaderboard page |
| `lib/rank.ts` | Applies the bar, orders entries, builds the effort ladders |
| `lib/leaderboard.ts` | Fetches both sources and returns the ranking |
| `app/page.tsx` | Renders the page |

## License

MIT. See [LICENSE](LICENSE). The data belongs to Artificial Analysis.
