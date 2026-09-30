# Product / Idea proposal â€” VaultBid

**Chosen idea (from provided list):** Sealed-Bid Auction â€” private bids, public sealed count + commitment  
**Product name:** VaultBid  
**Challenge period:** September Challenge (Active)  
**Network:** Midnight Preprod  
**Track category for form:** **Confidential DeFi** (auction / sealed bidding; closest fit â€” Other if form forces a single â€œauctionâ€ bucket)

---

## Copy-paste for Idea Submission form

### Question 1 â€” What is your idea?

```
VaultBid â€” Sealed-Bid Auction on Midnight.

I am building (and already ship on Preprod) a privacy-first sealed-bid auction board: bidders prove a bid was sealed without revealing the private bid amount on the public ledger.

How it works:
â€¢ Private: 32-byte witness claim (LE u64 bidAmount + domain tag "VaultBid") + private circuit parameter bidAmount
â€¢ Public (selective disclosure): auctionOpen, sealedBidCount, latestBidCommitment = persistentHash(claim)
â€¢ Circuit: sealBid(bidAmount) â€” auction stays open in Level 2/3 sealed phase; winner reveal is a later phase
â€¢ Level 2/3 do NOT publish winner amounts or per-bid cleartext (that would break the sealed-bid story)
â€¢ Wallet: 1AM on Preprod; proving prefers dapp-connector proof provider
â€¢ Live dApp: https://vault-bid.vercel.app
â€¢ Repo: https://github.com/nikkunjtayal/vault-bid
â€¢ Contract: fd791ba296bc112e5169e16fa4654f462b935cfefe5be7dfc484ab591f7c954a (Preprod)
â€¢ Demo video: https://drive.google.com/file/d/1O-HAv4bLrN6DIZdIo6_rPsaZm5xDkb7A/view?usp=sharing

For Level 4â€“6 I will harden VaultBid into a production-grade sealed-bid auction: close/reveal phases, multi-lot vaults, and monitoring â€” still never putting bid amounts on the public board during the sealed phase.
```

### Question 2 â€” Choose a category

**Confidential DeFi**

(Maps to **Sealed-Bid Auction** on the Provided Idea List. Identity/credentials and consumer survey/allowlist ideas are the wrong fit â€” this is sealed bidding.)

### Submission period

**September Challenge** â€” Active

---

## Problem

Open auctions leak bids on transparent ledgers. Offline sealed envelopes are not verifiable. Teams need â€œa bid was sealedâ€ plus integrity (a commitment) without publishing the amount until reveal.

## Solution (ships today)

- Compact circuit `sealBid(bidAmount)` + getters  
- 1AM browser auction board: Connect / Deploy / Join / Seal bid  
- CI + Vitest (13 tests) + Vercel live demo  
- Privacy model documented in README (observer can / cannot)

### Data model

| Layer | Fields | Visibility |
|---|---|---|
| PRIVATE | `privateBidClaim` (32 bytes), circuit `bidAmount` | Witness only â€” never cleartext on ledger |
| PUBLIC | `auctionOpen`, `sealedBidCount`, `latestBidCommitment` | After `disclose()` / Counter |

## Why Midnight

Midnightâ€™s selective disclosure is the right primitive for sealed auctions: prove a bid was sealed with a private witness while the public ledger only learns open status, sealed count, and a commitment. Stronger than publishing amounts on a transparent chain, and different from eligibility gates or private allowlists.

## Level 4â€“6 direction (after idea approval)

| Phase | Focus |
|---|---|
| Level 4 | Close + winner reveal UX (still sealed-bid auction, not eligibility/allowlist) |
| Level 5 | Multi-lot vaults, monitoring, hardened ops |
| Level 6 | Supermoon polish toward a reusable sealed-auction product |

## Links

| Resource | URL |
|---|---|
| Repo | https://github.com/nikkunjtayal/vault-bid |
| Live demo | https://vault-bid.vercel.app |
| Demo video | https://drive.google.com/file/d/1O-HAv4bLrN6DIZdIo6_rPsaZm5xDkb7A/view?usp=sharing |
| Contract | `docs/evidence/DEPLOYMENT.md` |
| Midnight RFS | https://midnight.network/request-for-start-ups |

## Approval ask

Please approve **Sealed-Bid Auction â€” VaultBid** under **Confidential DeFi** (or Other / auction if that is the forced closest bucket) for the September challenge Idea Submission (Level 4â€“6 scope).
