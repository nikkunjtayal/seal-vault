# Product / Idea proposal — ShadePass

**Chosen idea (from provided list):** Private Allowlist Access — prove membership without revealing identity  
**Product name:** ShadePass  
**Author:** Nikkunj (`Nikkunj-145`)  
**Challenge period:** September Challenge (Active)  
**Network:** Midnight Preprod  
**Track category for form:** **Identity/credentials**

---

## Copy-paste for 💭 Idea Submission form

### Question 1 — What is your idea?

```
ShadePass — Private Allowlist Access on Midnight.

I am building (and already ship on Preprod) a privacy-first allowlist gate: a user proves they are an allowed member without revealing which member they are, or any cleartext identity, on the public ledger.

How it works:
• Private: 32-byte witness claim (LE u64 memberTag + domain tag "ShadePas") + private circuit parameter `memberTag`
• Public (selective disclosure): admitted boolean, admitCount, latestCommitment = persistentHash(claim)
• Demo rule: admitted = (memberTag != 0); tag 0 still allowed with admitted=false
• Wallet: 1AM on Preprod; proving prefers dapp-connector proof provider
• Live dApp: https://shade-pass.vercel.app
• Repo: https://github.com/Nikkunj-145/shade-pass
• Contract: see docs/evidence/DEPLOYMENT.md (Preprod 64-hex)
• Demo video: (Drive/YouTube — paste when recorded)

For Level 4–6 I will harden ShadePass into a production-grade allowlist / membership product: richer UX, policy packs for clubs/betas/airdrops, monitoring, and clearer selective-disclosure flows aligned with Midnight’s identity/credentials track — without ever putting member lists or raw tags on-chain.
```

### Question 2 — Choose a category

**Identity/credentials**

(Maps directly to **Private Allowlist Access** on the Provided Idea List. Consumer focus is acceptable only if the form forces a single pick.)

### Submission period

**September Challenge** — Active

---

## Problem

Clubs, beta programs, airdrops, and gated apps need “are you allowed?” checks. Publishing member IDs, emails, or wallet lists on a public ledger leaks privacy. Operators need a boolean answer, not a roster dump.

## Solution (ships today)

- Compact circuit `admitMember(memberTag)` + getters  
- 1AM browser UI: Connect / Deploy / Join / Call  
- CI + Vitest (≥10 tests) + Vercel live demo  
- Privacy model documented in README (observer can / cannot)

### Data model

| Layer | Fields | Visibility |
|---|---|---|
| PRIVATE | `privateClaim` (32 bytes), circuit `memberTag` | Witness only — never cleartext on ledger |
| PUBLIC | `admitted`, `admitCount`, `latestCommitment` | After `disclose()` / Counter |

## Why Midnight

Midnight’s selective disclosure is the right primitive for allowlists: prove membership with a private witness while the public ledger only learns admission + a commitment. That is stronger than publishing membership sets on a transparent chain, and different from simple “threshold eligibility” products.

## Level 4–6 direction (after idea approval)

| Phase | Focus |
|---|---|
| Level 4 | Richer UX, recovery copy, multi-allowlist / policy packs (still membership, not age gates) |
| Level 5 | Monitoring, hardened ops, clearer observer guarantees |
| Level 6 | Supermoon polish toward a reusable private-allowlist SDK / product |

## Links

| Resource | URL |
|---|---|
| Repo | https://github.com/Nikkunj-145/shade-pass |
| Live demo | https://shade-pass.vercel.app |
| Demo video | See `docs/evidence/DEMO_VIDEO.md` |
| Contract | `docs/evidence/DEPLOYMENT.md` |
| Midnight RFS | https://midnight.network/request-for-start-ups |

## Approval ask

Please approve **Private Allowlist Access — ShadePass** under **Identity/credentials** for the September challenge Idea Submission (Level 4–6 scope).
