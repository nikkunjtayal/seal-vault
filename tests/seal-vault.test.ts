import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as RT from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  ledger,
} from "../contracts/managed/seal-vault/contract/index.js";
import {
  createPrivateState,
  decodeBidAmount,
  encodeClaim,
  DOMAIN_TAG,
  witnesses,
  type SealVaultPrivateState,
} from "../src/witnesses.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const managed = join(root, "contracts", "managed", "seal-vault");

const COIN = "0".repeat(64);
const ADDR = RT.sampleContractAddress();

function setup(bidAmount: bigint) {
  const privateState: SealVaultPrivateState = createPrivateState(bidAmount);
  const contract = new Contract(witnesses);
  const ctor = contract.initialState(
    RT.createConstructorContext(privateState, COIN),
  );
  const ctx = RT.createCircuitContext(
    ADDR,
    COIN,
    ctor.currentContractState,
    ctor.currentPrivateState,
  );
  return { contract, ctx, privateState };
}

describe("SealVault managed artifacts", () => {
  it("ships compiler, contract, keys, and zkir directories", () => {
    for (const dir of ["compiler", "contract", "keys", "zkir"]) {
      expect(existsSync(join(managed, dir)), `missing ${dir}`).toBe(true);
    }
  });

  it("lists expected circuits and witness in contract-info.json", () => {
    const infoPath = join(managed, "compiler", "contract-info.json");
    expect(existsSync(infoPath)).toBe(true);
    const info = JSON.parse(readFileSync(infoPath, "utf8")) as {
      circuits: { name: string }[];
      witnesses: { name: string }[];
      "compiler-version": string;
    };
    expect(info["compiler-version"]).toBe("0.31.1");
    const names = info.circuits.map((c) => c.name).sort();
    expect(names).toEqual(
      [
        "sealBid",
        "getSealedBidCount",
        "getAuctionOpen",
        "getLatestBidCommitment",
      ].sort(),
    );
    expect(info.witnesses.map((w) => w.name)).toContain("privateBidClaim");
  });

  it("has prover/verifier keys for every circuit", () => {
    const keys = readdirSync(join(managed, "keys"));
    for (const circuit of [
      "sealBid",
      "getSealedBidCount",
      "getAuctionOpen",
      "getLatestBidCommitment",
    ]) {
      expect(keys).toContain(`${circuit}.prover`);
      expect(keys).toContain(`${circuit}.verifier`);
    }
  });
});

describe("SealVault claim encoding", () => {
  it("encodes LE bidAmount and SealVault domain tag", () => {
    const claim = encodeClaim(2500n);
    expect(claim.length).toBe(32);
    expect(decodeBidAmount(claim)).toBe(2500n);
    expect(new TextDecoder().decode(claim.slice(24))).toBe(DOMAIN_TAG);
  });
});

describe("SealVault runtime ledger", () => {
  it("starts with auctionOpen=true, sealedBidCount=0, empty commitment", () => {
    const { ctx } = setup(100n);
    const state = ledger(ctx.currentQueryContext.state);
    expect(state.auctionOpen).toBe(true);
    expect(state.sealedBidCount).toBe(0n);
    expect(state.latestBidCommitment.every((b) => b === 0)).toBe(true);
  });

  it("sealBid increments count, updates commitment, keeps auction open", () => {
    const { contract, ctx } = setup(777n);
    const after = contract.impureCircuits.sealBid(ctx, 777n);
    const state = ledger(after.context.currentQueryContext.state);
    expect(state.auctionOpen).toBe(true);
    expect(state.sealedBidCount).toBe(1n);
    expect(state.latestBidCommitment.some((b) => b !== 0)).toBe(true);

    const open = contract.impureCircuits.getAuctionOpen(after.context);
    expect(open.result).toBe(true);
    const count = contract.impureCircuits.getSealedBidCount(after.context);
    expect(count.result).toBe(1n);
  });

  it("allows zero bid amounts while still sealing a commitment", () => {
    const { contract, ctx } = setup(0n);
    const after = contract.impureCircuits.sealBid(ctx, 0n);
    const state = ledger(after.context.currentQueryContext.state);
    expect(state.auctionOpen).toBe(true);
    expect(state.sealedBidCount).toBe(1n);
    expect(state.latestBidCommitment.some((b) => b !== 0)).toBe(true);
  });

  it("updates count on successive sealed bids and stays open", () => {
    const { contract, ctx } = setup(10n);
    const first = contract.impureCircuits.sealBid(ctx, 10n);
    const mid = ledger(first.context.currentQueryContext.state);
    const second = contract.impureCircuits.sealBid(first.context, 99n);
    const end = ledger(second.context.currentQueryContext.state);
    expect(mid.sealedBidCount).toBe(1n);
    expect(end.sealedBidCount).toBe(2n);
    expect(end.auctionOpen).toBe(true);
    expect(end.latestBidCommitment.some((b) => b !== 0)).toBe(true);
    const commitment = contract.impureCircuits.getLatestBidCommitment(
      second.context,
    );
    expect(commitment.result).toEqual(end.latestBidCommitment);
  });
});
