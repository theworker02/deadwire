# Buyer evaluation â€” deadwire

## Goal

In 15â€“45 minutes, verify the Product builds or runs as documented and that proprietary notices are present.

## Steps

1. Confirm root `LICENSE` is proprietary and `ACQUISITION.md` exists.
2. Skim `README.md` install/run claims.
3. Execute:

```
```yaml
incident: DW-193
affected_executions: 8147
common_failure_boundary: checkout.finalize â†’ payments-api/v3
probable_change: payment provider response schema
recovery:
  safe_resume: 6921
  safe_restart: 811
  manual_review: 304
  external_side_effect_unknown: 111
```
```text
 â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 â”‚                       Customer application                         â”‚
 â”‚  Upstash Workflow Â· QStash Â· Workflow Agents Â· external services  â”‚
 â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
               â”‚                                       â”‚
       Deadwire SDK bridge                      failure callback / DLQ
               â”‚                                       â”‚
               â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â–¼
                    HMAC-signed evidence ingestion
                               â”‚
                               â–¼
        evidence graph â†’ incident clustering â†’ deployment / trace correlation
                               â”‚
                               â–¼
            compatibility gate + side-effect verifiers + simulation
                               â”‚
                               â–¼
  receipt â†’ independent approval â†’ 1% canary â†’ observe â†’ ramp â†’ reconcile
                               â”‚
                               â–¼
           QStash resume with required flow-control configuration
```
```powershell
npm install
npm run typecheck
npm test
```
```

4. Run tests if present (`npm test`, `pytest`, `cargo test`, `go test ./...`, etc.).
5. Record README vs observed behavior gaps in workpapers.

## Pass criteria

- [ ] Clone succeeds
- [ ] Documented happy path works **or** failure is explained
- [ ] Minimal path needs no surprise secrets
- [ ] License notices intact

*Updated: 2026-09-22*
