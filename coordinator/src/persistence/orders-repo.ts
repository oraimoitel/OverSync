import { randomBytes } from "node:crypto";
import type { Database } from "./db.js";

type DatabaseT = Database;
type Statement = ReturnType<DatabaseT["prepare"]>;

export type OrderStatus =
  | "announced"
  | "src_locked"
  | "dst_locked"
  | "secret_revealed"
  | "completed"
  | "refunded"
  | "failed"
  | "expired";

export type Chain = "ethereum" | "stellar";
export type Direction = "eth_to_xlm" | "xlm_to_eth";

export interface OrderRow {
  id: number;
  publicId: string;
  direction: Direction;
  status: OrderStatus;
  hashlock: string;
  srcChain: Chain;
  srcAddress: string;
  srcAsset: string;
  srcAmount: string;
  srcSafetyDeposit: string;
  srcOrderId: string | null;
  srcLockTx: string | null;
  srcLockBlock: number | null;
  srcTimelock: number | null;
  dstChain: Chain;
  dstAddress: string;
  dstAsset: string;
  dstAmount: string;
  dstOrderId: string | null;
  dstLockTx: string | null;
  dstLockBlock: number | null;
  dstTimelock: number | null;
  preimage: string | null;
  secretRevealedTx: string | null;
  resolverAddress: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface AnnounceOrderInput {
  direction: Direction;
  hashlock: string;
  srcChain: Chain;
  srcAddress: string;
  srcAsset: string;
  srcAmount: string;
  srcSafetyDeposit: string;
  dstChain: Chain;
  dstAddress: string;
  dstAsset: string;
  dstAmount: string;
}

interface OrderDbRow {
  id: number;
  public_id: string;
  direction: Direction;
  status: OrderStatus;
  hashlock: string;
  src_chain: Chain;
  src_address: string;
  src_asset: string;
  src_amount: string;
  src_safety_deposit: string;
  src_order_id: string | null;
  src_lock_tx: string | null;
  src_lock_block: number | null;
  src_timelock: number | null;
  dst_chain: Chain;
  dst_address: string;
  dst_asset: string;
  dst_amount: string;
  dst_order_id: string | null;
  dst_lock_tx: string | null;
  dst_lock_block: number | null;
  dst_timelock: number | null;
  preimage: string | null;
  secret_revealed_tx: string | null;
  resolver_address: string | null;
  created_at: number;
  updated_at: number;
}

function rowToOrder(r: OrderDbRow): OrderRow {
  return {
    id: r.id,
    publicId: r.public_id,
    direction: r.direction,
    status: r.status,
    hashlock: r.hashlock,
    srcChain: r.src_chain,
    srcAddress: r.src_address,
    srcAsset: r.src_asset,
    srcAmount: r.src_amount,
    srcSafetyDeposit: r.src_safety_deposit,
    srcOrderId: r.src_order_id,
    srcLockTx: r.src_lock_tx,
    srcLockBlock: r.src_lock_block,
    srcTimelock: r.src_timelock,
    dstChain: r.dst_chain,
    dstAddress: r.dst_address,
    dstAsset: r.dst_asset,
    dstAmount: r.dst_amount,
    dstOrderId: r.dst_order_id,
    dstLockTx: r.dst_lock_tx,
    dstLockBlock: r.dst_lock_block,
    dstTimelock: r.dst_timelock,
    preimage: r.preimage,
    secretRevealedTx: r.secret_revealed_tx,
    resolverAddress: r.resolver_address,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export class OrdersRepository {
  private readonly insertStmt: Statement;
  private readonly byPublicId: Statement;
  private readonly byHashlock: Statement;
  private readonly byAddress: Statement;
  private readonly bySrcOrderId: Statement;
  private readonly byDstOrderId: Statement;
  private readonly updateStatus: Statement;
  private readonly updateSrcLock: Statement;
  private readonly updateDstLock: Statement;
  private readonly updateSecret: Statement;

  constructor(private readonly db: DatabaseT) {
    this.insertStmt = db.prepare(`
      INSERT INTO orders (
        public_id, direction, status, hashlock,
        src_chain, src_address, src_asset, src_amount, src_safety_deposit,
        dst_chain, dst_address, dst_asset, dst_amount
      ) VALUES (
        :publicId, :direction, 'announced', :hashlock,
        :srcChain, :srcAddress, :srcAsset, :srcAmount, :srcSafetyDeposit,
        :dstChain, :dstAddress, :dstAsset, :dstAmount
      )
    `);
    this.byPublicId = db.prepare("SELECT * FROM orders WHERE public_id = ?");
    this.byHashlock = db.prepare("SELECT * FROM orders WHERE hashlock = ?");
    this.byAddress = db.prepare(`
      SELECT * FROM orders
      WHERE src_address = :addr OR dst_address = :addr
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset
    `);
    this.bySrcOrderId = db.prepare(`
      SELECT * FROM orders WHERE src_chain = :chain AND src_order_id = :orderId
    `);
    this.byDstOrderId = db.prepare(`
      SELECT * FROM orders WHERE dst_chain = :chain AND dst_order_id = :orderId
    `);
    this.updateStatus = db.prepare(`
      UPDATE orders
      SET status = :status, updated_at = CAST(strftime('%s','now') AS INTEGER)
      WHERE public_id = :publicId
    `);
    this.updateSrcLock = db.prepare(`
      UPDATE orders SET
        src_order_id = :orderId,
        src_lock_tx = :txHash,
        src_lock_block = :blockNumber,
        src_timelock = :timelock,
        status = CASE WHEN status = 'announced' THEN 'src_locked' ELSE status END,
        updated_at = CAST(strftime('%s','now') AS INTEGER)
      WHERE public_id = :publicId
    `);
    this.updateDstLock = db.prepare(`
      UPDATE orders SET
        dst_order_id = :orderId,
        dst_lock_tx = :txHash,
        dst_lock_block = :blockNumber,
        dst_timelock = :timelock,
        resolver_address = :resolver,
        status = CASE WHEN status IN ('announced', 'src_locked') THEN 'dst_locked' ELSE status END,
        updated_at = CAST(strftime('%s','now') AS INTEGER)
      WHERE public_id = :publicId
    `);
    this.updateSecret = db.prepare(`
      UPDATE orders SET
        preimage = :preimage,
        secret_revealed_tx = :txHash,
        status = 'secret_revealed',
        updated_at = CAST(strftime('%s','now') AS INTEGER)
      WHERE public_id = :publicId
    `);
  }

  /** Returns the public id of the new order. */
  announce(input: AnnounceOrderInput): OrderRow {
    const publicId = randomBytes(16).toString("hex");
    this.insertStmt.run({ publicId, ...input });
    const row = this.byPublicId.get(publicId) as OrderDbRow | undefined;
    if (!row) throw new Error("Failed to insert order");
    return rowToOrder(row);
  }

  findByPublicId(publicId: string): OrderRow | null {
    const row = this.byPublicId.get(publicId) as OrderDbRow | undefined;
    return row ? rowToOrder(row) : null;
  }

  findByHashlock(hashlock: string): OrderRow | null {
    const row = this.byHashlock.get(hashlock) as OrderDbRow | undefined;
    return row ? rowToOrder(row) : null;
  }

  findBySrcOrderId(chain: Chain, orderId: string): OrderRow | null {
    const row = this.bySrcOrderId.get({ chain, orderId }) as OrderDbRow | undefined;
    return row ? rowToOrder(row) : null;
  }

  findByDstOrderId(chain: Chain, orderId: string): OrderRow | null {
    const row = this.byDstOrderId.get({ chain, orderId }) as OrderDbRow | undefined;
    return row ? rowToOrder(row) : null;
  }

  findByAddress(addr: string, limit = 50, offset = 0): OrderRow[] {
    const rows = this.byAddress.all({ addr, limit, offset }) as unknown as OrderDbRow[];
    return rows.map(rowToOrder);
  }

  setStatus(publicId: string, status: OrderStatus): void {
    this.updateStatus.run({ publicId, status });
  }

  recordSrcLock(input: {
    publicId: string;
    orderId: string;
    txHash: string;
    blockNumber: number;
    timelock: number;
  }): void {
    this.updateSrcLock.run(input);
  }

  recordDstLock(input: {
    publicId: string;
    orderId: string;
    txHash: string;
    blockNumber: number;
    timelock: number;
    resolver: string | null;
  }): void {
    this.updateDstLock.run(input);
  }

  recordSecretRevealed(input: { publicId: string; preimage: string; txHash: string }): void {
    this.updateSecret.run(input);
  }
}
