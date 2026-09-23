# Exam Dashboard (take-home)

```
pnpm install
pnpm start # http://localhost:4200
pnpm test -- --watch=false --browsers=ChromeHeadless
```

No database, Docker, VPN, credentials, or environment variables. Results are served from
`public/exam-results.json`, a static file. Everything runs offline after `pnpm install`.

Node 20+ and Chrome (for the test runner).

`node tools/generate-data.mjs` regenerates the data file. It is deterministic, so the
numbers never move between runs. You should not need to touch it.

## What this is

The exam analysis dashboard a school opens after results are entered. One school, 3000
students, four streams of very different sizes, two exams, eight subjects, and the
absences a real school has.

## The ticket

> "Exam analysis is sluggish on our bigger schools — typing in the search box lags. Also
> the mean scores don't look right to the deputy, especially the school mean. Some
> students say their mean is lower on screen than on their printed slip."
>
> — reported by an account manager, no reproduction steps

That is all you get. No file paths.

## Your task

1. **Diagnose.** Find the problems from the symptom alone. Write down how you found them.
2. **Prove.** A failing test for anything you believe is wrong, and a **measurement**, not
   a guess, for anything you believe is slow.
3. **Fix.** Correctness first, then performance.
4. **Justify.** In `NOTES.md`: what you changed, what you rejected, and why.

Note the structure under `src/app/features/`. `internal/` folders are internal to their
feature. If that gets in your way, say so in `NOTES.md` and argue your position rather
than quietly reaching through it.

## Rules

- Commit in small steps. The commit sequence is part of what we read.
- Do not rewrite the dashboard from scratch.
- No new dependencies.

Time box: 3 hours. Stop at 3 and note what you would do next.
