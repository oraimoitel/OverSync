# OverSync vs Allbridge and other Stellar bridges

This document is the answer to the SCF #40 panel's question: *"What
makes OverSync different from Allbridge or other already-working
Stellar bridges?"*

## TL;DR

| Property | Allbridge Classic / Core | Stellar–Ethereum lockbox bridges (Wormhole etc.) | **OverSync v2** |
|---|---|---|---|
| Trust assumption | Validator-set signs every withdrawal | Guardian / validator committee | **None — atomic HTLC math** |
| Worst case if operator goes offline | Funds stuck until validator set returns | Funds stuck until guardians return | **User refunds permissionlessly after timelock** |
| Worst case if operator is malicious | Operator can sign fraudulent withdrawals | Operator can sign fraudulent withdrawals | **Cannot move user funds — contract enforces hashlock + timelock** |
| Stellar contract | Custom multisig escrow | Custom multisig escrow | **Native Soroban HTLC** |
| Fusion+ compatibility | No | No | **Yes — 1inch resolver pattern** |
| Open resolver participation | No (validator-set is fixed) | No (guardians are fixed) | **Yes — anyone can stake into `ResolverRegistry`** |

## Two differentiators we lean into

### 1. First *native* Soroban HTLC bridge for Stellar

Existing Stellar-side cross-chain solutions wrap the destination asset
in a custom multisig contract whose signers act as a federated bridge
operator. The contracts on Stellar look like multisigs, not like HTLCs
— there is no on-chain hashlock invariant, and refunds require
operator action.

OverSync v2 implements the Stellar side as a **first-class Soroban
HTLC contract** with the same semantics as the EVM-side HTLCEscrow:

- [`soroban/contracts/htlc/src/lib.rs`](../soroban/contracts/htlc/src/lib.rs)
- 10 unit tests covering happy path, refund, wrong preimage, expiry,
  double claim, timelock bounds.

This is the first publicly auditable Stellar HTLC we know of where
sha256 hashlock + ledger-timestamp timelock are enforced by Soroban
WASM code, not by an off-chain committee.

### 2. Fusion+ — compatible Stellar gateway

The 1inch Fusion+ resolver pattern (open registry, per-order escrow,
secret reveal) is widely used on EVM chains. OverSync's HTLCEscrow and
ResolverRegistry follow the same shape, which means:

- Existing 1inch resolver operators can plug Stellar into their
  inventory by running our `@oversync/resolver` runner. They already
  know the patterns.
- We're not asking the Stellar ecosystem to invent a new resolver
  protocol from scratch.
- The same SDK (`@oversync/sdk`) abstracts secret generation,
  state-machine transitions and event handling for both chains.

## Why not just be Allbridge?

Allbridge ships and works today; that's a real point. But OverSync's
value proposition is different:

| OverSync optimises for | Allbridge optimises for |
|---|---|
| Trust minimisation | Throughput + fees |
| Pluggable resolver competition | Stable operator economics |
| Composability with 1inch Fusion+ | Standalone bridge UX |

Both can exist; users with different risk profiles will pick different
bridges. OverSync is specifically targeting:

1. **Power users** who want HTLC-grade settlement guarantees.
2. **Solana/EVM-native protocols** that want to slot Stellar in
   without learning a new trust model.
3. **Future 1inch Fusion+ integration** where OverSync becomes the
   Stellar gateway inside Fusion+'s existing resolver network.

## What we are NOT claiming

- We are not faster than Allbridge.
- We are not cheaper at small swap sizes (the safety deposit and
  hashlock dance impose a floor on per-trade gas overhead).
- We are not "production-ready" today — v2 contracts are unaudited
  and the resolver network has zero community participants yet. See
  [`SECURITY.md`](SECURITY.md) for the honest production checklist.

## Honest open questions

- Will the safety deposit incentive be enough to attract resolvers
  at low-volume launch? Probably not without bootstrap subsidies.
- Will users tolerate the longer happy-path latency vs validator-set
  bridges? We bet yes for >$1k swaps and no for $5 swaps.

We will measure both empirically during the SCF #41 tranche and adjust.
