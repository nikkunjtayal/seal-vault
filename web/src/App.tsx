import { useCallback, useEffect, useRef, useState } from "react";
import "@midnight-ntwrk/dapp-connector-api";
import { useMidnightWallet } from "./hooks/useMidnightWallet";
import { clearProvidersCache, getProviders } from "./lib/providers";
import {
  admitMember,
  deployShadePass,
  joinShadePass,
  readPublicState,
  type PublicLedgerView,
} from "./lib/shadePassApi";
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
  const [memberTagInput, setMemberTagInput] = useState("42");
  const [ledger, setLedger] = useState<PublicLedgerView | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState("Connect 1AM on Preprod to begin.");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [provingLocally, setProvingLocally] = useState(false);
  const autoJoinTried = useRef(false);

  const walletLabel = wallet.walletName ?? "1AM";

  const requireApi = useCallback(() => {
    const session = wallet.session.current;
    if (!session) throw new Error("Connect 1AM first");
    return session.api;
  }, [wallet.session]);

  const doJoin = useCallback(
    async (address: string, silent = false) => {
      const trimmed = address.trim();
      if (!trimmed) {
        setActionError("Paste a Preprod contract address first.");
        return false;
      }
      if (!silent) {
        setActionBusy(true);
        setActionError(null);
        setStatus("Joining ShadePass (indexer only, no wallet tx)…");
      }
      try {
        const providers = await getProviders(requireApi());
        await joinShadePass(providers, trimmed);
        const view = await readPublicState(providers, trimmed);
        setLedger(view);
        setJoined(true);
        setContractAddress(trimmed);
        setStatus(`Joined ${shortAddr(trimmed)} — ready to call admitMember`);
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
      setStatus("Connect 1AM on Preprod to begin.");
      return;
    }
    if (autoJoinTried.current || joined || !contractAddress.trim()) return;
    autoJoinTried.current = true;
    setStatus("Auto-joining known Preprod contract…");
    void doJoin(contractAddress, true).then((ok) => {
      if (!ok) {
        setStatus("Connect OK — Deploy a new contract or tap Join.");
      }
    });
  }, [wallet.connected, contractAddress, joined, doJoin]);

  async function onDeploy() {
    setActionBusy(true);
    setActionError(null);
    setStatus("Deploying ShadePass to Preprod (proving may take a minute)…");
    try {
      const providers = await getProviders(requireApi());
      const { address } = await deployShadePass(providers, 0n);
      const view = await readPublicState(providers, address);
      setLedger(view);
      setContractAddress(address);
      setJoined(true);
      setStatus(`Deployed on Preprod: ${address}`);
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

  async function onAdmit() {
    const trimmed = contractAddress.trim();
    if (!trimmed) {
      setActionError("Paste a Preprod contract address first.");
      return;
    }
    const memberTag = BigInt(memberTagInput || "0");
    setActionBusy(true);
    setActionError(null);
    setProvingLocally(true);
    setStatus("Proving allowlist membership without disclosing memberTag…");
    try {
      const providers = await getProviders(requireApi());
      if (!joined) {
        setStatus("Attaching to contract, then proving…");
        await joinShadePass(providers, trimmed);
        setJoined(true);
      } else {
        providers.privateStateProvider.setContractAddress(trimmed);
      }

      const result = await admitMember(providers, trimmed, memberTag);
      setLedger(result.public);
      setTxHash(result.txHash ?? null);
      setMemberTagInput("");
      setProvingLocally(false);
      setStatus(
        result.public.admitted
          ? "Admitted. Public ledger shows admitted=true — memberTag stays private."
          : "Not on allowlist (tag 0). Call allowed; admitted=false — claim still private.",
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setStatus("Circuit call failed.");
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
    <div className="shell">
      <header className="topbar">
        <div className="brand-mark">ShadePass</div>
        <div className="wallet-actions">
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
              className="btn btn-accent"
              type="button"
              disabled={wallet.busy}
              onClick={() => void wallet.connect().catch(() => undefined)}
            >
              {wallet.busy ? "Connecting…" : "Connect 1AM"}
            </button>
          )}
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">Private allowlist access</p>
        <h1>ShadePass</h1>
        <p>
          Prove you are an allowed member without revealing which member you are
          — or any cleartext identity — on the public ledger.
        </p>
        <div className="cta-row">
          {!wallet.connected ? (
            <button
              className="btn btn-accent"
              type="button"
              disabled={wallet.busy}
              onClick={() => void wallet.connect().catch(() => undefined)}
            >
              Connect 1AM on Preprod
            </button>
          ) : (
            <button
              className="btn btn-accent"
              type="button"
              disabled={actionBusy}
              onClick={() => void onDeploy()}
            >
              Deploy to Preprod
            </button>
          )}
        </div>
        {wallet.error ? <p className="err">{wallet.error}</p> : null}
      </section>

      <div className="grid">
        <section className="panel">
          <h2>Private admit</h2>
          <p className="lede">
            Enter a <strong>private</strong> memberTag locally. The circuit
            discloses only whether you are admitted — never the tag itself.
          </p>
          <div className="field">
            <label htmlFor="contract">Contract address</label>
            <input
              id="contract"
              value={contractAddress}
              onChange={(e) => {
                setContractAddress(e.target.value);
                setJoined(false);
                autoJoinTried.current = false;
              }}
              placeholder="Preprod contract address (64-hex)"
              spellCheck={false}
            />
          </div>
          <div className="field">
            <label htmlFor="memberTag">
              Private memberTag (cleared after prove; never on public panel)
            </label>
            <input
              id="memberTag"
              inputMode="numeric"
              value={memberTagInput}
              onChange={(e) =>
                setMemberTagInput(e.target.value.replace(/[^\d]/g, ""))
              }
              placeholder="non-zero = allowlisted · 0 = under-demo"
            />
          </div>
          <div className="cta-row">
            <button
              className="btn"
              type="button"
              disabled={!wallet.connected || actionBusy}
              onClick={() => void onJoin()}
            >
              {joined ? "Re-join" : "Join contract"}
            </button>
            <button
              className="btn btn-accent"
              type="button"
              disabled={!wallet.connected || actionBusy || !contractAddress.trim()}
              onClick={() => void onAdmit()}
            >
              Call admitMember
            </button>
          </div>
          {joined ? (
            <p className="note">
              Joined — Call admitMember needs one wallet confirm for prove/submit.
            </p>
          ) : null}
          {provingLocally ? (
            <p className="note">
              Proving… private memberTag held only in this session.
            </p>
          ) : null}
          {actionError ? <p className="err">{actionError}</p> : null}
          <p className="status-line">{status}</p>
        </section>

        <section className="panel">
          <h2>Public ledger view</h2>
          <p className="lede">
            What observers can see after disclose — never the memberTag or claim.
          </p>
          <div className="meta">
            <div>
              <span>admitted</span>
              <span>
                {ledger ? (
                  <span className={`badge ${ledger.admitted ? "pass" : "fail"}`}>
                    {ledger.admitted ? "true" : "false"}
                  </span>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div>
              <span>admitCount</span>
              <span>{ledger ? ledger.admitCount.toString() : "—"}</span>
            </div>
            <div>
              <span>latestCommitment</span>
              <span>
                {ledger
                  ? `${ledger.latestCommitmentHex.slice(0, 18)}…`
                  : "—"}
              </span>
            </div>
            <div>
              <span>last tx</span>
              <span>{txHash ? shortAddr(txHash) : "—"}</span>
            </div>
            <div>
              <span>network</span>
              <span>Preprod</span>
            </div>
          </div>
          {contractAddress ? (
            <p className="note">
              Indexer-verified address: <code>{shortAddr(contractAddress)}</code>
            </p>
          ) : null}
        </section>
      </div>

      <section className="privacy">
        <h2>Privacy claim</h2>
        <p className="lede">
          Observable behavior: the UI and public ledger show membership admission,
          never which member proved it.
        </p>
        <table>
          <tbody>
            <tr>
              <th>PRIVATE</th>
              <td>
                32-byte claim (LE u64 memberTag + domain tag{" "}
                <code>ShadePas</code>) + circuit <code>memberTag</code> — witness
                only
              </td>
            </tr>
            <tr>
              <th>PUBLIC</th>
              <td>
                <code>admitted</code>, <code>admitCount</code>,{" "}
                <code>latestCommitment = persistentHash(claim)</code>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer className="footer">
        <span>ShadePass · Level 2 — Waxing Crescent</span>
        <span>
          Faucet:{" "}
          <a href={PREPROD.faucetUrl} target="_blank" rel="noreferrer">
            Preprod
          </a>
        </span>
      </footer>
    </div>
  );
}
