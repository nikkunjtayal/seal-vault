import { CompiledContract } from "@midnight-ntwrk/compact-js";
import {
  createCircuitCallTxInterface,
  deployContract,
  verifyContractState,
} from "@midnight-ntwrk/midnight-js-contracts";
import { ContractExecutable } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { sampleSigningKey } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import { Contract, ledger } from "@sp/contract";
import {
  createPrivateState,
  PRIVATE_STATE_ID,
  witnesses,
  bytesToHex,
  type ShadePassPrivateState,
} from "@sp/witnesses";
import type { ShadePassProviders } from "./providers";

export type PublicLedgerView = {
  admitted: boolean;
  admitCount: bigint;
  latestCommitmentHex: string;
};

const compiledContract = CompiledContract.make("shade-pass", Contract).pipe(
  CompiledContract.withWitnesses(witnesses as never),
);

export type DeployedShadePass = {
  deployTxData: {
    private: {
      signingKey: string;
      initialPrivateState: ShadePassPrivateState;
    };
    public: {
      contractAddress: string;
      initialContractState: unknown;
    };
  };
  callTx: ReturnType<typeof createCircuitCallTxInterface>;
};

function bindPrivateState(
  providers: ShadePassProviders,
  contractAddress: string,
): void {
  providers.privateStateProvider.setContractAddress(contractAddress);
}

function makeCallTx(providers: ShadePassProviders, contractAddress: string) {
  return createCircuitCallTxInterface(
    providers,
    compiledContract,
    contractAddress,
    PRIVATE_STATE_ID,
  );
}

export async function deployShadePass(
  providers: ShadePassProviders,
  memberTagForInitialState = 0n,
): Promise<{ contract: DeployedShadePass; address: string }> {
  const contract = await deployContract(providers, {
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: createPrivateState(memberTagForInitialState),
  });
  const address = contract.deployTxData.public.contractAddress;
  bindPrivateState(providers, address);
  return {
    contract: {
      ...(contract as unknown as DeployedShadePass),
      callTx: makeCallTx(providers, address),
    },
    address,
  };
}

/**
 * Attach to an already-deployed Preprod contract.
 * Uses HTTP indexer queries (no watchForDeployTxData hang after later calls).
 */
export async function joinShadePass(
  providers: ShadePassProviders,
  contractAddress: string,
  privateState?: ShadePassPrivateState,
): Promise<DeployedShadePass> {
  const address = contractAddress.trim();
  if (!address) throw new Error("Contract address required");

  bindPrivateState(providers, address);

  const currentContractState =
    await providers.publicDataProvider.queryContractState(address);
  if (!currentContractState) {
    throw new Error(`No contract found on Preprod at ${address}`);
  }

  const initialContractState =
    (await providers.publicDataProvider.queryDeployContractState(address)) ??
    currentContractState;

  const circuitIds =
    ContractExecutable.make(compiledContract).getProvableCircuitIds();
  const verifierKeys =
    await providers.zkConfigProvider.getVerifierKeys(circuitIds);
  verifyContractState(verifierKeys, currentContractState);

  const existingKey =
    await providers.privateStateProvider.getSigningKey(address);
  const signingKey = existingKey ?? sampleSigningKey();
  if (!existingKey) {
    await providers.privateStateProvider.setSigningKey(address, signingKey);
  }

  const initialPrivateState = privateState ?? createPrivateState(0n);
  await providers.privateStateProvider.set(
    PRIVATE_STATE_ID,
    initialPrivateState,
  );

  return {
    deployTxData: {
      private: { signingKey, initialPrivateState },
      public: { contractAddress: address, initialContractState },
    },
    callTx: makeCallTx(providers, address),
  };
}

/** Public ledger via indexer HTTP — no wallet / prove txs. */
export async function readPublicState(
  providers: ShadePassProviders,
  contractAddress: string,
): Promise<PublicLedgerView> {
  const state =
    await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) {
    throw new Error(`No contract state at ${contractAddress}`);
  }
  const view = ledger(state.data);
  return {
    admitted: Boolean(view.admitted),
    admitCount: view.admitCount as bigint,
    latestCommitmentHex: bytesToHex(view.latestCommitment as Uint8Array),
  };
}

/**
 * Prove + submit admitMember, then refresh public view from indexer.
 */
export async function admitMember(
  providers: ShadePassProviders,
  contractAddress: string,
  memberTag: bigint,
): Promise<{
  txHash?: string;
  public: PublicLedgerView;
}> {
  const address = contractAddress.trim();
  if (!address) throw new Error("Contract address required");

  bindPrivateState(providers, address);
  await providers.privateStateProvider.set(
    PRIVATE_STATE_ID,
    createPrivateState(memberTag),
  );

  const before = await readPublicState(providers, address);
  const callTx = makeCallTx(providers, address);
  const txData = await callTx.admitMember(memberTag);
  const pub = txData.public as { txHash?: string; txId?: string };

  let publicView = before;
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 1200));
    publicView = await readPublicState(providers, address);
    if (publicView.admitCount !== before.admitCount) break;
  }

  return {
    txHash: pub.txHash ?? pub.txId,
    public: publicView,
  };
}
