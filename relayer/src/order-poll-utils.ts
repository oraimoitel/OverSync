const TERMINAL_STATUSES = new Set([
  'completed',
  'cancelled',
  'failed',
  'refunded',
  'escrow_creation_failed',
]);

export function hasPendingRelayerEscrow(activeOrders: Map<string, { status?: string }>): boolean {
  for (const order of activeOrders.values()) {
    if (order?.status === 'pending_relayer_escrow') return true;
  }
  return false;
}

export function hasAwaitingXlmPayment(activeOrders: Map<string, { status?: string }>): boolean {
  for (const order of activeOrders.values()) {
    if (order?.status === 'awaiting_xlm_payment') return true;
  }
  return false;
}

/** Any in-flight bridge order that still needs chain monitoring. */
export function hasActiveBridgeOrders(activeOrders: Map<string, { status?: string }>): boolean {
  if (activeOrders.size === 0) return false;
  for (const order of activeOrders.values()) {
    const status = order?.status;
    if (!status || !TERMINAL_STATUSES.has(status)) return true;
  }
  return false;
}
