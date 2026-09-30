import { CompiledContract } from "@midnight-ntwrk/compact-js";
import {
  createCircuitCallTxInterface,
  deployContract,
  verifyContractState,
} from "@midnight-ntwrk/midnight-js-contracts";
import { ContractExecutable } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { sampleSigningKey } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import { Contract, ledger } from "@vb/contract";
import {
  createPrivateState,
  PRIVATE_STATE_ID,
  witnesses,
  bytesToHex,
  type VaultBidPrivateState,
} from "@vb/witnesses";
import type { VaultBidProviders } from "./providers";

export type PublicLedgerView = {
  auctionOpen: boolean;
  sealedBidCount: bigint;
  latestCommitmentHex: string;
};

const compiledContract = CompiledContract.make("vault-bid", Contract).pipe(
  CompiledContract.withWitnesses(witnesses as never),
);

export type DeployedVaultBid = {
  deployTxData: {
    private: {
      signingKey: string;
      initialPrivateState: VaultBidPrivateState;
    };
    public: {
      contractAddress: string;
      initialContractState: unknown;
    };
  };
  callTx: ReturnType<typeof createCircuitCallTxInterface>;
};

function bindPrivateState(
  providers: VaultBidProviders,
  contractAddress: string,
): void {
  providers.privateStateProvider.setContractAddress(contractAddress);
}

function makeCallTx(providers: VaultBidProviders, contractAddress: string) {
  return createCircuitCallTxInterface(
    providers,
    compiledContract,
    contractAddress,
    PRIVATE_STATE_ID,
  );
}

export async function deployVaultBid(
  providers: VaultBidProviders,
  bidForInitialState = 0n,
): Promise<{ contract: DeployedVaultBid; address: string }> {
  const contract = await deployContract(providers, {
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: createPrivateState(bidForInitialState),
  });
  const address = contract.deployTxData.public.contractAddress;
  bindPrivateState(providers, address);
  return {
    contract: {
      ...(contract as unknown as DeployedVaultBid),
      callTx: makeCallTx(providers, address),
    },
    address,
  };
}

/**
 * Attach to an already-deployed Preprod auction.
 * Uses HTTP indexer queries (no watchForDeployTxData hang).
 */
export async function joinVaultBid(
  providers: VaultBidProviders,
  contractAddress: string,
  privateState?: VaultBidPrivateState,
): Promise<DeployedVaultBid> {
  const address = contractAddress.trim();
  if (!address) throw new Error("Contract address required");

  bindPrivateState(providers, address);

  const currentContractState =
    await providers.publicDataProvider.queryContractState(address);
  if (!currentContractState) {
    throw new Error(`No auction contract found on Preprod at ${address}`);
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
  providers: VaultBidProviders,
  contractAddress: string,
): Promise<PublicLedgerView> {
  const state =
    await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) {
    throw new Error(`No contract state at ${contractAddress}`);
  }
  const view = ledger(state.data);
  return {
    auctionOpen: Boolean(view.auctionOpen),
    sealedBidCount: view.sealedBidCount as bigint,
    latestCommitmentHex: bytesToHex(view.latestBidCommitment as Uint8Array),
  };
}

/**
 * Prove + submit sealBid, then refresh public view from indexer.
 */
export async function sealBid(
  providers: VaultBidProviders,
  contractAddress: string,
  bidAmount: bigint,
): Promise<{
  txHash?: string;
  public: PublicLedgerView;
}> {
  const address = contractAddress.trim();
  if (!address) throw new Error("Contract address required");

  bindPrivateState(providers, address);
  await providers.privateStateProvider.set(
    PRIVATE_STATE_ID,
    createPrivateState(bidAmount),
  );

  const before = await readPublicState(providers, address);
  const callTx = makeCallTx(providers, address);
  const txData = await callTx.sealBid(bidAmount);
  const pub = txData.public as { txHash?: string; txId?: string };

  let publicView = before;
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 1200));
    publicView = await readPublicState(providers, address);
    if (publicView.sealedBidCount !== before.sealedBidCount) break;
  }

  return {
    txHash: pub.txHash ?? pub.txId,
    public: publicView,
  };
}
