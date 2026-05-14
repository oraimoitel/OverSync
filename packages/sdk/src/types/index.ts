export type Chain = "ethereum" | "stellar";
export type Direction = "eth_to_xlm" | "xlm_to_eth";

export type OrderStatus =
  | "announced"
  | "src_locked"
  | "dst_locked"
  | "secret_revealed"
  | "completed"
  | "refunded"
  | "failed"
  | "expired";

/** Cross-chain swap order as visible to clients of the SDK. */
export interface Order {
  publicId: string;
  direction: Direction;
  status: OrderStatus;
  hashlock: `0x${string}`;
  src: ChainLeg;
  dst: ChainLeg;
  preimage: `0x${string}` | null;
}

export interface ChainLeg {
  chain: Chain;
  address: string;
  asset: string;
  /** Atomic units, decimal string. */
  amount: string;
  /** Atomic units, decimal string. */
  safetyDeposit?: string;
  /** On-chain order id once the leg is locked. */
  orderId?: string | null;
  /** Tx hash that created the on-chain lock. */
  lockTx?: string | null;
  /** Absolute timelock as unix seconds. */
  timelock?: number | null;
}

/** Resolver listing entry returned by the coordinator. */
export interface ResolverInfo {
  address: string;
  chain: Chain;
  stake: string;
  active: boolean;
  registeredAt: number;
}
