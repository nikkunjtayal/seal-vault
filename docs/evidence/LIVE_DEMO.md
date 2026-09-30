# Live demo

| Field | Value |
|---|---|
| URL | https://shade-pass.vercel.app |
| Network | Preprod |
| Wallet | 1AM (recommended) |

## Smoke path

1. Open https://shade-pass.vercel.app
2. Connect 1AM on Preprod (unshielded address appears in topbar).
3. Deploy or Join the recorded contract address.
4. Enter a private memberTag → **Call admitMember**.
5. Confirm public panel shows `admitted` / `admitCount` / `latestCommitment` and the private field cleared.

After first UI deploy, paste the 64-hex address into `DEPLOYMENT.md`, README, and optionally `VITE_CONTRACT_ADDRESS` for auto-join.
