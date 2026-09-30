# ShadePass — deployment

| Field | Value |
|---|---|
| Network | **Preprod** (Level 2 — Waxing Crescent / Level 3) |
| Contract address | `e01a7e066dc7ddb3712c27e9975cd9523d3f7a283c6824f752933f4a5d6b3795` |
| Latest indexed action | `ContractCall` · entryPoint `admitMember` |
| Activity tx hash | `42cecd3ff8fac01c7c630247fc1b209cd3c8d8ce0b7ca5ab605e9aca1205ee82` |
| Block height | `2776908` |
| Block hash | `c18c4ace3fe940217eae4ee946231991c4c99a237428303695cdfe2ff120a536` |
| Deployer | **1AM** UI on https://shade-pass.vercel.app |
| Timestamp (UTC) | 2026-09-30 |
| Indexer | `https://indexer.preprod.midnight.network/api/v4/graphql` |
| Node / RPC | `https://rpc.preprod.midnight.network` |
| Faucet | `https://faucet.preprod.midnight.network` |
| Explorer | `https://explorer.preprod.midnight.network` (UI often 404; prefer indexer) |

## Status

**Preprod contract recorded** from 1AM UI deploy. Indexer confirms live `admitMember` activity on this address. Wired into README and `web/src/lib/config.ts` for auto-join.

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
