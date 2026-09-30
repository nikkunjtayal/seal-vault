# ShadePass — deployment

| Field | Value |
|---|---|
| Network | Preprod (Level 2 — Waxing Crescent) |
| Contract address | `PENDING_PREPROD_DEPLOY` |
| Deployer unshielded | _(record after UI or CLI deploy)_ |
| Timestamp (UTC) | _(pending)_ |
| Indexer | `https://indexer.preprod.midnight.network/api/v4/graphql` |
| Node / RPC | `https://rpc.preprod.midnight.network` |
| Faucet | `https://faucet.preprod.midnight.network` |

## Notes

- Prefer **1AM UI**: Connect on Preprod → **Deploy to Preprod** → copy the 64-hex address here and into README.
- CLI alternative: `MIDNIGHT_NETWORK=preprod MIDNIGHT_SEED=<hex> npm run deploy:preprod`
- Record-only: `MIDNIGHT_CONTRACT_ADDRESS=<hex> RECORD_ONLY=1 npm run deploy:preprod`
- Secrets are never committed.
