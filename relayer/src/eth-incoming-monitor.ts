/**
 * Scans new blocks for native ETH sent to the relayer address.
 *
 * Uses a single `getBlock(prefetchTxs=true)` per block — the previous
 * implementation re-fetched every transaction with `getTransaction`,
 * which on Sepolia meant hundreds of redundant RPC calls per block.
 */

import type { JsonRpcProvider, TransactionResponse } from 'ethers';

const DEFAULT_MAX_BLOCK_WINDOW = 500;

export interface IncomingEthPayment {
  hash: string;
  from: string;
  value: bigint;
  blockNumber: number;
}

export async function fetchIncomingEthPayments(
  provider: JsonRpcProvider,
  relayerAddress: string,
  lastProcessedBlock: number,
  maxBlockWindow = DEFAULT_MAX_BLOCK_WINDOW
): Promise<{ payments: IncomingEthPayment[]; cursor: number }> {
  const head = await provider.getBlockNumber();
  if (head <= lastProcessedBlock) {
    return { payments: [], cursor: lastProcessedBlock };
  }

  const relayerLower = relayerAddress.toLowerCase();
  const fromBlock = lastProcessedBlock + 1;
  const toBlock = Math.min(head, fromBlock + maxBlockWindow - 1);
  const payments: IncomingEthPayment[] = [];

  for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
    const block = await provider.getBlock(blockNum, true);
    if (!block?.transactions?.length) continue;

    for (const entry of block.transactions) {
      if (typeof entry === 'string') continue;
      const tx = entry as TransactionResponse;
      if (!tx.to || tx.to.toLowerCase() !== relayerLower) continue;
      if (!tx.value || tx.value <= 0n) continue;

      payments.push({
        hash: tx.hash,
        from: tx.from,
        value: tx.value,
        blockNumber: blockNum,
      });
    }
  }

  return { payments, cursor: toBlock };
}
