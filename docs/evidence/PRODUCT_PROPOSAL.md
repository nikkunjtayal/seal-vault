# Product / Idea proposal — VaultBid

**Chosen idea:** Sealed-Bid Auction — private bids, public sealed count + commitment  
**Product name:** VaultBid  
**Author:** Manoj Aggarwal  
**Network:** Midnight Preprod  
**Category:** Consumer focus

---

## Copy-paste for Idea Submission

### Question 1 — What is your idea?

```
VaultBid — Sealed-Bid Auction on Midnight.

Bidders seal private bid amounts behind a ZK commitment. The public auction board only learns auctionOpen, sealedBidCount, and latestBidCommitment — never the bid amount. Winner reveal is a later phase.

• Private: 32-byte claim (LE u64 bidAmount + domain tag "VaultBid") + private circuit param bidAmount
• Public: auctionOpen, sealedBidCount, latestBidCommitment = persistentHash(claim)
• Circuit: sealBid(bidAmount)
• Wallet: 1AM on Preprod
• Repo: this repository (rebranded from ShadePass allowlist)
```

### Question 2 — Choose a category

**Consumer focus**

---

## Why Midnight

Selective disclosure lets auctions prove a bid was sealed without publishing the amount — stronger than transparent on-chain bids, and different from eligibility gates or allowlists.

## Level 4–6 direction

Richer auction UX, close/reveal phases, multi-lot vaults — still sealed-bid auction, not eligibility/allowlist.
