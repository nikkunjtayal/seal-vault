# Code quality notes — ShadePass

Engineering practices aligned with Midnight Level 2 quality bar:

- **Session-cache providers** — one Level private-state provider per wallet session; always `setContractAddress` before private state / `callTx`.
- **Join via indexer** — `queryContractState` / `queryDeployContractState`; do not hang on `watchForDeployTxData` after later ContractCalls.
- **Public reads** — managed `ledger()` + indexer HTTP; no getter `callTx` for UI reads.
- **Vite** — dedupe/alias single `@midnight-ntwrk/ledger-v8` + `onchain-runtime-v3`; polyfill `events` / `assert` / `buffer`.
- **ZK assets** — `npm run web:sync-zk` copies keys/zkir to `web/public/zk/shade-pass/` for `FetchZkConfigProvider`.
- **Auto-join** — when `DEFAULT_CONTRACT_ADDRESS` / `VITE_CONTRACT_ADDRESS` is set, Connect triggers join.
- **Proof path** — prefer `dappConnectorProofProvider` (`getProvingProvider`); HTTP proof-server fallback only.
- **Product semantics** — allowlist / membership only (`admitMember`); no threshold eligibility gates.
