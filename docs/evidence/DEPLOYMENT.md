# ShadePass — deployment

| Field | Value |
|---|---|
| Network | **Preprod** (Level 2 — Waxing Crescent / Level 3) |
| Contract address | `e01a7e066dc7ddb3712c27e9975cd9523d3f7a283c6824f752933f4a5d6b3795` |
| Deploy tx hash | _(fill if known from 1AM / indexer)_ |
| Block height | _(fill if known)_ |
| Block hash | _(fill if known)_ |
| Deployer | **1AM** UI on https://shade-pass.vercel.app |
| Timestamp (UTC) | 2026-09-30 |
| Indexer | `https://indexer.preprod.midnight.network/api/v4/graphql` |
| Node / RPC | `https://rpc.preprod.midnight.network` |
| Faucet | `https://faucet.preprod.midnight.network` |
| Explorer | `https://explorer.preprod.midnight.network` (UI often 404; prefer indexer) |

## Status

**Preprod contract recorded** from 1AM UI deploy. Address is wired into README and `web/src/lib/config.ts` for auto-join.

### Indexer verification (GraphQL)

```graphql
query {
  contractAction(
    address: "e01a7e066dc7ddb3712c27e9975cd9523d3f7a283c6824f752933f4a5d6b3795"
  ) {
    __typename
    ... on ContractDeploy {
      address
      transaction {
        hash
        block { height hash timestamp }
      }
    }
  }
}
```
