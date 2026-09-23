# Notes

## How I found the mean bugs

The ticket says two different things about means: the school mean looks wrong to the deputy, and some students see a lower mean than on their printed slip. Both calculations are in `ExamDashboard`.

A student mean added up the papers they sat, then divided by `subjects.length` (8). An absence is stored as `score: null`, so it added nothing and still took a slot in the divisor. On the Term 2 Opener that is 1,424 of 3,000 candidates. Sifa Odhiambo (North) sat 7 papers: the screen showed 42.50 and the mean of the papers she sat is 48.57.

The school mean then averaged the four stream means, one vote each. The streams are 1,400, 900, 500 and 200 candidates, and West is the high-scoring stream (the generator adds 14 to that stream for this reason). On the same exam the four stream means average to 57.07. The mean of the 3,000 on-screen student means is 54.78. After dropping absences from each student's divisor, the mean of those slip means is 59.77.

`features/streams/internal/stream-stats.ts` already has `weightedMean`. I did not import it. That file says it is internal to the streams feature, and the dashboard can weight the school mean from the candidate rows it already holds. Moving the helper into `core/` would be worth it if a third caller appeared. Two call sites do not need a new shared module, and averaging the rounded stream means would still drift from the slips by about a hundredth.

I rejected counting an absence as zero, and I rejected giving each stream an equal vote.

A student who sat nothing keeps mean 0, so the table does not show `NaN`. They stay in the candidate count.

## What this change does not do

Typing in the search box is still slow. `rows` is a getter, and a keystroke rebuilds every candidate from the entries more than once. That is the next change, and it needs a measurement before a fix.

Switching exam while 9001 is still loading (1,200 ms) can let that response land after 9002 (250 ms) and paint the wrong exam. Not part of this commit.
