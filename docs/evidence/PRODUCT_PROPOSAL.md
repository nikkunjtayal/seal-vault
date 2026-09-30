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
ShadePass is Private Allowlist Access on Midnight: prove “I’m on the list” without revealing who you are.

Clubs, beta programs, airdrops, and gated communities constantly ask one question — are you allowed in? Today that usually means publishing emails, wallet lists, or member IDs where anyone can scrape them. ShadePass flips that model: membership stays private; the chain only learns a selective-disclosure result.

What ships today (Level 1–3):
- Compact circuit admitMember with a private memberTag / claim witness (domain-tagged “ShadePas”)
- Public ledger shows only admitted, admitCount, and a commitment hash — never the tag or roster
- 1AM Preprod dApp with connect, deploy/join, and private admit UX
- Live demo: https://shade-pass.vercel.app
- Repo: https://github.com/Nikkunj-145/shade-pass
- Preprod contract: e01a7e066dc7ddb3712c27e9975cd9523d3f7a283c6824f752933f4a5d6b3795
- Demo video: https://drive.google.com/file/d/1z8oAUs1ZcpWHWxYsX1nLPeceFk3s-F18/view?usp=sharing

Why Midnight: selective disclosure is the right primitive for allowlists — stronger than dumping membership sets on a transparent chain, and different from threshold “eligibility score” products.

Level 4–6 plan: turn this into a reusable private-membership product — multi-policy allowlists (club / beta / airdrop packs), clearer observer guarantees, richer UX/recovery, and ops monitoring — still membership-first, never an age/eligibility gate clone.
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
| Demo video | https://drive.google.com/file/d/1z8oAUs1ZcpWHWxYsX1nLPeceFk3s-F18/view?usp=sharing |
| Contract (Preprod) | `e01a7e066dc7ddb3712c27e9975cd9523d3f7a283c6824f752933f4a5d6b3795` |
| Midnight RFS | https://midnight.network/request-for-start-ups |

## Approval ask

Please approve **Private Allowlist Access — ShadePass** under **Identity/credentials** for the September challenge Idea Submission (Level 4–6 scope).
