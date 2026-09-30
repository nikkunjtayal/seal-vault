import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as RT from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  ledger,
} from "../contracts/managed/shade-pass/contract/index.js";
import {
  createPrivateState,
  decodeMemberTag,
  encodeClaim,
  DOMAIN_TAG,
  witnesses,
  type ShadePassPrivateState,
} from "../src/witnesses.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const managed = join(root, "contracts", "managed", "shade-pass");

const COIN = "0".repeat(64);
const ADDR = RT.sampleContractAddress();

function setup(memberTag: bigint) {
  const privateState: ShadePassPrivateState = createPrivateState(memberTag);
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

describe("ShadePass managed artifacts", () => {
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
      ["admitMember", "getAdmitCount", "getAdmitted", "getLatestCommitment"].sort(),
    );
    expect(info.witnesses.map((w) => w.name)).toContain("privateClaim");
  });

  it("has prover/verifier keys for every circuit", () => {
    const keys = readdirSync(join(managed, "keys"));
    for (const circuit of [
      "admitMember",
      "getAdmitCount",
      "getAdmitted",
      "getLatestCommitment",
    ]) {
      expect(keys).toContain(`${circuit}.prover`);
      expect(keys).toContain(`${circuit}.verifier`);
    }
  });
});

describe("ShadePass claim encoding", () => {
  it("encodes LE memberTag and ShadePas domain tag", () => {
    const claim = encodeClaim(42n);
    expect(claim.length).toBe(32);
    expect(decodeMemberTag(claim)).toBe(42n);
    expect(new TextDecoder().decode(claim.slice(24))).toBe(DOMAIN_TAG);
  });
});

describe("ShadePass runtime ledger", () => {
  it("starts with admitted=false, admitCount=0, empty commitment", () => {
    const { ctx } = setup(7n);
    const state = ledger(ctx.currentQueryContext.state);
    expect(state.admitted).toBe(false);
    expect(state.admitCount).toBe(0n);
    expect(state.latestCommitment.every((b) => b === 0)).toBe(true);
  });

  it("marks admitted=true and bumps count for non-zero memberTag", () => {
    const { contract, ctx } = setup(7n);
    const after = contract.impureCircuits.admitMember(ctx, 7n);
    const state = ledger(after.context.currentQueryContext.state);
    expect(state.admitted).toBe(true);
    expect(state.admitCount).toBe(1n);
    expect(state.latestCommitment.some((b) => b !== 0)).toBe(true);

    const admitted = contract.impureCircuits.getAdmitted(after.context);
    expect(admitted.result).toBe(true);
    const count = contract.impureCircuits.getAdmitCount(after.context);
    expect(count.result).toBe(1n);
  });

  it("allows under-demo tag 0 but sets admitted=false", () => {
    const { contract, ctx } = setup(0n);
    const after = contract.impureCircuits.admitMember(ctx, 0n);
    const state = ledger(after.context.currentQueryContext.state);
    expect(state.admitted).toBe(false);
    expect(state.admitCount).toBe(1n);
    expect(state.latestCommitment.some((b) => b !== 0)).toBe(true);
  });
});
