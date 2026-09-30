export const NETWORK_ID = "preprod" as const;

export const PREPROD = {
  network: NETWORK_ID,
  indexerUrl: "https://indexer.preprod.midnight.network/api/v4/graphql",
  indexerWsUrl: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
  nodeUrl: "https://rpc.preprod.midnight.network",
  faucetUrl: "https://faucet.preprod.midnight.network",
  proofServerUrl:
    import.meta.env.VITE_PROOF_SERVER_URL ?? "http://127.0.0.1:6300",
  explorerContractBase: "https://explorer.preprod.midnight.network/contract",
};

/** Prefill Join — known Preprod SealVault auction. */
export const DEFAULT_CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined)?.trim() ||
  "fd791ba296bc112e5169e16fa4654f462b935cfefe5be7dfc484ab591f7c954a";

export const ZK_ASSET_BASE = "/zk/seal-vault";
