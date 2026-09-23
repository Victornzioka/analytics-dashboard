# Notes

## How I found the mean bugs

The ticket says two different things about means: the school mean looks wrong to the deputy, and some students see a lower mean than on their printed slip. Both calculations are in `ExamDashboard`.

A student mean added up the papers they sat, then divided by `subjects.length` (8). An absence is stored as `score: null`, so it added nothing and still took a slot in the divisor. On the Term 2 Opener that is 1,424 of 3,000 candidates. Sifa Odhiambo (North) sat 7 papers: the screen showed 42.50 and the mean of the papers she sat is 48.57.

The school mean then averaged the four stream means, one vote each. The streams are 1,400, 900, 500 and 200 candidates, and West is the high-scoring stream (the generator adds 14 to that stream for this reason). On the same exam the four stream means average to 57.07. The mean of the 3,000 on-screen student means is 54.78. After dropping absences from each student's divisor, the mean of those slip means is 59.77.

`features/streams/internal/stream-stats.ts` already has `weightedMean`. I did not import it. That file says it is internal to the streams feature, and the dashboard can weight the school mean from the candidate rows it already holds. Moving the helper into `core/` would be worth it if a third caller appeared. Two call sites do not need a new shared module, and averaging the rounded stream means would still drift from the slips by about a hundredth.

I rejected counting an absence as zero, and I rejected giving each stream an equal vote.

A student who sat nothing keeps mean 0, so the table does not show `NaN`. They stay in the candidate count.

## Why search lags

`rows`, `filteredRows`, `visibleRows`, `streamRows`, `schoolMean` and `streamNames` were getters. A getter runs its body on every read, and Angular reads every template binding on each change-detection pass, twice in development mode. Each read of `rows` grouped about 24,000 entries into 3,000 candidate rows, and the other getters read `rows` again. None of that output depends on the search text.

How I measured it: `exam-dashboard.perf.spec.ts` loads the real `exam-results.json` (Term 2 Opener, 3,000 candidates), types into the search box and times the input event plus `detectChanges()`. That is 40 keystrokes: "wanjiku" letter by letter and then cleared, five times. It runs in headless Chrome in development mode, so the absolute numbers are higher than a production build. The before and after figures are comparable with each other.

| | Rows rebuilt per keystroke | Median keystroke | Worst keystroke |
|---|---|---|---|
| Before | 18 | 40.3 ms | 45.8 ms |
| After | 0 | 4.8 ms | 12.8 ms |

The before count came from a temporary `spyOnProperty` on the `rows` getter. It cannot run against the fix because `rows` is no longer a getter. The spec keeps the test that holds the fix in place: a keystroke must leave `dash.rows` as the same array. It failed before the change.

## What I changed for performance

- `rows`, `streamRows`, `schoolMean` and `streamNames` are plain fields, built once when an exam loads. The calculations are unchanged; only when they run changed.
- `filteredRows` and `visibleRows` are rebuilt in `applyFilters()`, which runs when the search text, stream filter or sort order changes. It filters and sorts 3,000 rows that are already built.
- The table tracks rows by `studentId` instead of `$index`, so Angular reuses a student's row rather than rewriting cells when the order changes.
- `streamNames` uses a `Set` instead of `includes` over all 3,000 students.

`candidateCount` and `schoolGrade` stay getters. Each is one lookup.

## What I rejected for performance

- **Debouncing the search box.** It reduces how often the work runs, but each run still rebuilds every row, and the input would feel laggy in a different way.
- **Signals and `computed()`.** They come with Angular 20, so they are not a new dependency, and they would keep the values correct without manual refreshing. They would also change every binding and field in the component. The ticket says not to rewrite the dashboard, and plain fields fix the measured cost with a smaller diff. This is the direction I would take if the component keeps growing.
- **`OnPush` change detection.** It would cut how often bindings are checked, but the getters would still run on each check. It is also easier to get wrong with `ngModel`.

The cost of the fixed version is that anything that changes `search`, `streamFilter` or the sort must call `applyFilters()`. Today that is the two `ngModelChange` bindings and `sortBy`.

## Still open

Switching exam while 9001 is still loading (1,200 ms) can let that response land after 9002 (250 ms) and paint the wrong exam.
