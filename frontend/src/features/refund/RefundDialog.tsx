import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock, RefreshCw, ShieldCheck } from "lucide-react";
import type { Address } from "viem";
import { makeEthereumHTLCClient } from "../../lib/sdk-context";
import { isTestnet } from "../../config/networks";

export interface RefundDialogProps {
  /** Ethereum address of the user (used as wallet signer). */
  userAddress: Address;
  /** On-chain order id from the HTLCEscrow contract. */
  orderId: string;
  /** Absolute timelock as unix seconds (server-side timestamp). */
  timelockUnixSeconds: number;
  /** Locked amount in atomic units (wei) for display. */
  amountWei: string;
  /** Optional callback invoked after a successful refund. */
  onRefunded?: (txHash: `0x${string}`) => void;
  /** Optional cancel/close handler for parent modal. */
  onClose?: () => void;
}

type Phase = "checking" | "waiting" | "ready" | "submitting" | "done" | "error";

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "expired";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Permissionless refund flow for an Ethereum-side HTLC order.
 *
 * If the timelock has expired the user can call `refundOrder` directly
 * on the contract from their own wallet — the coordinator is NOT
 * involved. This is the v2 capability that was missing in v1.
 */
export function RefundDialog(props: RefundDialogProps) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 5_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setPhase(props.timelockUnixSeconds <= now ? "ready" : "waiting");
  }, [props.timelockUnixSeconds, now]);

  const remaining = useMemo(
    () => Math.max(props.timelockUnixSeconds - now, 0),
    [props.timelockUnixSeconds, now]
  );

  async function handleRefund() {
    setError(null);
    setPhase("submitting");
    try {
      const client = await makeEthereumHTLCClient(props.userAddress);
      if (!client) {
        throw new Error("HTLCEscrow address is not configured for this network. Set VITE_ETH_HTLC_ESCROW_TESTNET / VITE_ETH_HTLC_ESCROW_MAINNET in .env.");
      }
      const hash = await client.refundOrder(BigInt(props.orderId));
      setTxHash(hash);
      setPhase("done");
      props.onRefunded?.(hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
      setPhase("error");
    }
  }

  const explorer = isTestnet() ? "https://sepolia.etherscan.io" : "https://etherscan.io";

  return (
    <div className="bg-[#131823] rounded-2xl p-6 border border-white/10 max-w-md w-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Refund order</h2>
          <p className="text-gray-400 text-sm">
            Refund is permissionless — your wallet calls the contract directly.
          </p>
        </div>
        {props.onClose && (
          <button
            onClick={props.onClose}
            className="text-gray-400 hover:text-white transition-colors text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      <dl className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-400">Order id</dt>
          <dd className="text-white font-mono">{props.orderId}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-400">Locked amount</dt>
          <dd className="text-white font-mono">{props.amountWei} wei</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-400">Timelock</dt>
          <dd className="text-white">{new Date(props.timelockUnixSeconds * 1000).toISOString()}</dd>
        </div>
      </dl>

      {phase === "waiting" && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-yellow-400" />
          <div className="text-sm">
            <p className="text-yellow-300">Refund not yet available.</p>
            <p className="text-gray-400">Time remaining: {formatRemaining(remaining)}</p>
          </div>
        </div>
      )}

      {phase === "ready" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <p className="text-sm text-emerald-300">
            The timelock has expired. You can refund this order at any time.
          </p>
        </div>
      )}

      {phase === "error" && error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-red-300 font-medium">Refund failed</p>
            <p className="text-gray-400 break-all">{error}</p>
          </div>
        </div>
      )}

      {phase === "done" && txHash && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-emerald-300 font-medium mb-1">Refund submitted.</p>
          <a
            href={`${explorer}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline break-all"
          >
            {txHash}
          </a>
        </div>
      )}

      <button
        onClick={handleRefund}
        disabled={phase !== "ready" && phase !== "error"}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors bg-gradient-to-r from-[#6C63FF] to-[#3ABEFF] hover:opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {phase === "submitting" && <RefreshCw className="h-4 w-4 animate-spin" />}
        {phase === "submitting" ? "Submitting refund..." : "Refund from contract"}
      </button>
    </div>
  );
}

export default RefundDialog;
