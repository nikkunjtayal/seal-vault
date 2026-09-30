# Code quality audit — SealVault Level 3

Date: 2026-09-30  
Scope: contract, witnesses, tests, providers, wallet bridge, UI, CI  
Product: Sealed-Bid Auction (not eligibility gate, not allowlist membership, not survey)

## Deep audit findings

| Area | Finding | Severity | Action |
|---|---|---|---|
| Provider session | Fresh Level store per click drops `setContractAddress` | High | Session-cached `getProviders()` in `web/src/lib/providers.ts` |
| Join hang | `watchForDeployTxData` waits forever after later ContractCalls | High | HTTP `queryContractState` / indexer join (no watch hang) |
| Getter txs | UI reads via `callTx` getters burn wallet proves | High | Indexer + managed `ledger()` for public auction view |
| Ledger WASM dupes | Multiple `ledger-v8` copies break types | High | Vite dedupe/alias + npm overrides |
| Node builtins in browser | `events` / `assert` externalized → runtime blank | High | Polyfill aliases in `web/vite.config.ts` |
| Proving path | HTTP proof URL fragile vs 1AM | Med | Prefer `dappConnectorProofProvider`; HTTP fallback only |
| Mobile layout | Auction board + seal dock cramped &lt;720px | Med | `@media (max-width: 720px)` stacks board/dock, full-width buttons |
| Witness coverage | Encoding must be explicit | Med | `tests/witnesses.test.ts` (LE bidAmount, SealVault tag, hex, malformed) |
| Secrets | Seeds / `.env` must never land in git | High | `.gitignore` + never commit identity files |
| CI | Need gate on every `main` push | High | `.github/workflows/ci.yml` |
| Privacy UX | Bid amount must never appear on public board | High | Cleared after successful `sealBid`; public panel shows only auctionOpen / sealedBidCount / commitment |
| Winner amount | Publishing winner amount early breaks sealed story | High | Level 2/3 intentionally omit public winner amounts |

## Standards followed

- No secrets in repo
- Privacy UX: PRIVATE bid amount cleared after successful `sealBid`
- Single provider instance per wallet session
- Official Midnight stack (`network-id`, indexer, level, fetch zk, dapp proving)
- Product stays sealed-bid auction — no eligibility / allowlist / survey copy in UI
- Meaningful commits on `main`

## Verification

```bash
npm test
npm run web:sync-zk
npm --prefix web ci
npm --prefix web run build
```

CI runs the same on every push to `main`.
