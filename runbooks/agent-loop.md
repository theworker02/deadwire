# Agent loop

1. Inspect repeated state fingerprints and semantic-progress score.
2. Identify repeated model/tool calls and estimated cost.
3. Terminate or checkpoint the branch according to policy.
4. Fix prompt/tool contract or add a maximum-step/budget guard.
5. Resume only at a verified checkpoint.
