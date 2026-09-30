# Code quality audit — ShadePass Level 3

Date: 2026-09-30  
Scope: contract, witnesses, tests, providers, wallet bridge, UI, CI  
Product: Private Allowlist Access (not eligibility/age gate)

## Deep audit findings

| Area | Finding | Severity | Action |
|---|---|---|---|
| Provider session | Fresh Level store per click drops `setContractAddress` | High | Session-cached `getProviders()` in `web/src/lib/providers.ts` |
| Join hang | `watchForDeployTxData` waits forever after later ContractCalls | High | HTTP `queryContractState` / `queryDeployContractState` join |
| Getter txs | UI reads via `callTx` getters burn wallet proves | High | Indexer + managed `ledger()` for public view |
| Ledger WASM dupes | Multiple `ledger-v8` copies break types | High | Vite dedupe/alias + npm overrides |
| Node builtins in browser | `events` / `assert` externalized → runtime blank | High | Polyfill aliases in `web/vite.config.ts` |
| Proving path | HTTP proof URL fragile vs 1AM | Med | Prefer `dappConnectorProofProvider`; HTTP fallback only |
| Mobile layout | Grid cramped &lt;720px | Med | `@media (max-width: 720px)` full-width buttons |
| Witness coverage | Encoding only indirect | Med | `tests/witnesses.test.ts` (LE tag, domain, hex, malformed) |
| Secrets | Seeds / `.env` must never land in git | High | `.gitignore` + never commit identity files |
| CI | Need gate on every `main` push | High | `.github/workflows/ci.yml` |

## Standards followed

- No secrets in repo
- Privacy UX: private memberTag cleared after successful `admitMember`
- Single provider instance per wallet session
- Official Midnight stack (`network-id`, indexer, level, fetch zk, dapp proving)
- Product stays allowlist/membership — no NightGate threshold copy
- Meaningful commits on `main` as Manoj Aggarwal

## Verification

```bash
npm test
npm run web:sync-zk
npm --prefix web ci
npm --prefix web run build
```

CI runs the same on every push to `main`.
