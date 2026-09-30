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

/** Prefill Join field — env override or known Preprod deploy. */
export const DEFAULT_CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined)?.trim() ||
  "e01a7e066dc7ddb3712c27e9975cd9523d3f7a283c6824f752933f4a5d6b3795";

export const ZK_ASSET_BASE = "/zk/shade-pass";
