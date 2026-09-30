import { useCallback, useEffect, useRef, useState } from "react";
import "@midnight-ntwrk/dapp-connector-api";
import { useMidnightWallet } from "./hooks/useMidnightWallet";
import { clearProvidersCache, getProviders } from "./lib/providers";
import {
  sealBid,
  deployVaultBid,
  joinVaultBid,
  readPublicState,
  type PublicLedgerView,
} from "./lib/vaultBidApi";
import { DEFAULT_CONTRACT_ADDRESS, PREPROD } from "./lib/config";
import "./styles.css";

function shortAddr(value: string): string {
  if (value.length < 20) return value;
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export default function App() {
  const wallet = useMidnightWallet();
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [joined, setJoined] = useState(false);
  const [bidInput, setBidInput] = useState("");
  const [ledger, setLedger] = useState<PublicLedgerView | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState("Connect 1AM on Preprod to open the vault.");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [provingLocally, setProvingLocally] = useState(false);
  const autoJoinTried = useRef(false);

  const walletLabel = wallet.walletName ?? "1AM";
  const auctionOpen = ledger?.auctionOpen ?? true;

  const requireApi = useCallback(() => {
    const session = wallet.session.current;
    if (!session) throw new Error("Connect 1AM first");
    return session.api;
  }, [wallet.session]);

  const doJoin = useCallback(
    async (address: string, silent = false) => {
      const trimmed = address.trim();
      if (!trimmed) {
        setActionError("Paste a Preprod auction address first.");
        return false;
      }
      if (!silent) {
        setActionBusy(true);
        setActionError(null);
        setStatus("Joining auction vault (indexer only)…");
      }
      try {
        const providers = await getProviders(requireApi());
        await joinVaultBid(providers, trimmed);
        const view = await readPublicState(providers, trimmed);
        setLedger(view);
        setJoined(true);
        setContractAddress(trimmed);
        setStatus(`Joined vault ${shortAddr(trimmed)} — ready to seal a bid`);
        setActionError(null);
        return true;
      } catch (err) {
        setJoined(false);
        setActionError(err instanceof Error ? err.message : String(err));
        setStatus("Join failed.");
        return false;
      } finally {
        if (!silent) setActionBusy(false);
      }
    },
    [requireApi],
  );

  useEffect(() => {
    if (!wallet.connected) {
      autoJoinTried.current = false;
      setJoined(false);
      clearProvidersCache();
      setStatus("Connect 1AM on Preprod to open the vault.");
      return;
    }
    if (autoJoinTried.current || joined || !contractAddress.trim()) return;
    autoJoinTried.current = true;
    setStatus("Auto-joining known Preprod auction…");
    void doJoin(contractAddress, true).then((ok) => {
      if (!ok) {
        setStatus("Wallet connected — Deploy a new auction or Join an address.");
      }
    });
  }, [wallet.connected, contractAddress, joined, doJoin]);

  async function onDeploy() {
    setActionBusy(true);
    setActionError(null);
    setStatus("Deploying VaultBid auction to Preprod…");
    try {
      const providers = await getProviders(requireApi());
      const { address } = await deployVaultBid(providers, 0n);
      const view = await readPublicState(providers, address);
      setLedger(view);
      setContractAddress(address);
      setJoined(true);
      setStatus(`Auction deployed on Preprod: ${address}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setStatus("Deploy failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function onJoin() {
    await doJoin(contractAddress, false);
  }

  async function onSealBid() {
    const trimmed = contractAddress.trim();
    if (!trimmed) {
      setActionError("Paste a Preprod auction address first.");
      return;
    }
    if (!bidInput.trim()) {
      setActionError("Enter a private bid amount before sealing.");
      return;
    }
    const bidAmount = BigInt(bidInput || "0");
    setActionBusy(true);
    setActionError(null);
    setProvingLocally(true);
    setStatus("Sealing bid — amount stays private; only a commitment goes on-chain…");
    try {
      const providers = await getProviders(requireApi());
      if (!joined) {
        setStatus("Attaching to auction, then sealing…");
        await joinVaultBid(providers, trimmed);
        setJoined(true);
      } else {
        providers.privateStateProvider.setContractAddress(trimmed);
      }

      const result = await sealBid(providers, trimmed, bidAmount);
      setLedger(result.public);
      setTxHash(result.txHash ?? null);
      setBidInput("");
      setProvingLocally(false);
      setStatus(
        `Bid sealed. Public board shows count=${result.public.sealedBidCount.toString()} — amount never disclosed.`,
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setStatus("Seal bid failed.");
      setProvingLocally(false);
    } finally {
      setActionBusy(false);
    }
  }

  function onDisconnect() {
    clearProvidersCache();
    setJoined(false);
    autoJoinTried.current = false;
    wallet.disconnect();
  }

  return (
    <div className="app">
      <header className="wallet-bar">
        <div className="brand">
          <span className="brand-mark">VaultBid</span>
          <span className="brand-sub">Sealed-bid auction · Preprod</span>
        </div>
        <div className="wallet-bar-actions">
          {wallet.connected && wallet.address ? (
            <span className="addr" title={wallet.address}>
              {shortAddr(wallet.address)}
            </span>
          ) : null}
          {wallet.connected ? (
            <button className="btn" type="button" onClick={onDisconnect}>
              Disconnect {walletLabel}
            </button>
          ) : (
            <button
              className="btn btn-amber"
              type="button"
              disabled={wallet.busy}
              onClick={() => void wallet.connect().catch(() => undefined)}
            >
              {wallet.busy ? "Connecting…" : "Connect 1AM"}
            </button>
          )}
        </div>
      </header>

      {wallet.error ? <p className="banner-err">{wallet.error}</p> : null}

      <main className="layout">
        <section className="auction-board">
          <div className="board-head">
            <div>
              <p className="kicker">Auction board</p>
              <h1>Live vault</h1>
            </div>
            <span className={`phase-badge ${auctionOpen ? "open" : "closed"}`}>
              {auctionOpen ? "Open · Sealed phase" : "Closed"}
            </span>
          </div>

          <p className="board-lede">
            Bidders lock a private amount behind a commitment. The board only
            learns how many bids were sealed — never who bid what. Winner reveal
            is a later phase.
          </p>

          <div className="field">
            <label htmlFor="contract">Auction contract (Preprod)</label>
            <input
              id="contract"
              value={contractAddress}
              onChange={(e) => {
                setContractAddress(e.target.value);
                setJoined(false);
                autoJoinTried.current = false;
              }}
              placeholder="64-hex address — deploy if empty"
              spellCheck={false}
            />
          </div>

          <div className="board-actions">
            <button
              className="btn btn-amber"
              type="button"
              disabled={!wallet.connected || actionBusy}
              onClick={() => void onDeploy()}
            >
              Deploy auction
            </button>
            <button
              className="btn"
              type="button"
              disabled={!wallet.connected || actionBusy}
              onClick={() => void onJoin()}
            >
              {joined ? "Re-join vault" : "Join auction"}
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <span className="stat-label">auctionOpen</span>
              <span className="stat-value">
                {ledger ? (ledger.auctionOpen ? "true" : "false") : "—"}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">sealedBidCount</span>
              <span className="stat-value">
                {ledger ? ledger.sealedBidCount.toString() : "—"}
              </span>
            </div>
            <div className="stat stat-wide">
              <span className="stat-label">latestBidCommitment</span>
              <span className="stat-value mono">
                {ledger
                  ? `${ledger.latestCommitmentHex.slice(0, 22)}…`
                  : "—"}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">last tx</span>
              <span className="stat-value mono">
                {txHash ? shortAddr(txHash) : "—"}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">network</span>
              <span className="stat-value">Preprod</span>
            </div>
          </div>

          <p className="status-line">{status}</p>
          {actionError ? <p className="banner-err">{actionError}</p> : null}
        </section>

        <aside className="seal-dock">
          <p className="kicker">Seal dock</p>
          <h2>Private bid</h2>
          <p className="dock-lede">
            Enter your <strong>PRIVATE</strong> bid amount locally. It never
            appears on the public auction board — only a commitment hash does.
          </p>

          <div className="field">
            <label htmlFor="bid">PRIVATE bid amount</label>
            <input
              id="bid"
              inputMode="numeric"
              value={bidInput}
              onChange={(e) =>
                setBidInput(e.target.value.replace(/[^\d]/g, ""))
              }
              placeholder="e.g. 1500 — cleared after seal"
            />
          </div>

          <button
            className="btn btn-amber btn-block"
            type="button"
            disabled={
              !wallet.connected || actionBusy || !contractAddress.trim()
            }
            onClick={() => void onSealBid()}
          >
            {provingLocally ? "Proving seal…" : "Seal bid"}
          </button>

          {provingLocally ? (
            <p className="hint">
              Local proving in progress — bid amount stays in this session only.
            </p>
          ) : (
            <p className="hint">
              Circuit: <code>sealBid(bidAmount)</code> · domain tag{" "}
              <code>VaultBid</code>
            </p>
          )}

          <div className="observer-card">
            <h3>Observer sees</h3>
            <ul>
              <li>sealedBidCount</li>
              <li>latestBidCommitment</li>
              <li>auctionOpen</li>
            </ul>
            <h3>Observer never sees</h3>
            <ul>
              <li>bid amount</li>
              <li>claim cleartext</li>
            </ul>
          </div>
        </aside>
      </main>

      <footer className="footer">
        <span>VaultBid · Sealed-bid auction</span>
        <a href={PREPROD.faucetUrl} target="_blank" rel="noreferrer">
          Preprod faucet
        </a>
      </footer>
    </div>
  );
}
