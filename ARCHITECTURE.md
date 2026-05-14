# OverSync v2 — Architecture (in-progress)

> **Status:** OverSync is being rebuilt as a non-custodial, multi-resolver,
> HTLC-based bridge between Ethereum and Stellar. This document tracks the
> **target** architecture. Code in this repository is currently in the
> middle of the v1 to v2 transition; sections that describe behavior not
> yet shipped are marked **`(planned)`**.

---

## 1. Goals

OverSync v2 is designed around three properties:

1. **Non-custodial.** User funds are always locked in on-chain HTLC contracts
   on both source and destination chains. No off-chain service can spend
   them. Refunds after the timelock are permissionless and always go to the
   original user, not the operator.
2. **Multi-resolver.** Anyone can register as a resolver by staking on the
   on-chain `ResolverRegistry`. Resolvers compete to fill orders; misbehavior
   is slashed. The reference coordinator is one participant, not a
   privileged operator.
3. **Symmetric HTLC semantics across chains.** Stellar enforces the same
   hashlock + timelock invariants as Ethereum, via a dedicated Soroban
   contract — not via claimable balances.

## 2. High-level layout

```
┌────────────────────┐   lock(hashlock, timelock)   ┌────────────────────┐
│ Ethereum EscrowF.  │ ◄──────── user ────────────► │ Soroban HTLC       │
│  + ResolverRegistry│                              │  + ResolverRegistry│
└─────────┬──────────┘                              └──────────┬─────────┘
          │ events                                             │ events
          ▼                                                    ▼
                  ┌──────────────────────────────┐
                  │ Reference Coordinator        │
                  │ - secret relay, order book   │
                  │ - holds NO user funds        │
                  └──────┬──────────────┬────────┘
                         │              │
                ┌────────▼────┐    ┌────▼─────────┐
                │ Community   │... │ Community    │
                │ Resolver 1  │    │ Resolver N   │
                └─────────────┘    └──────────────┘
```

## 3. Components

### 3.1 Ethereum contracts (`contracts/`) **(in rewrite)**

Target layout:

- `HTLCEscrow.sol` — per-order escrow with `claim(preimage)` and
  `refund()` after timelock. Refund is permissionless and pays
  `refundAddress` (set to the original user).
- `EscrowFactory.sol` — creates `HTLCEscrow` instances, gated by a
  resolver allowlist read from `ResolverRegistry`.
- `ResolverRegistry.sol` — open registry with stake + slash for resolver
  misbehavior.

The v1 contracts (`HTLCBridge.sol`, `MainnetHTLC.sol`, the existing
`EscrowFactory.sol`) are still present but will be replaced.

### 3.2 Soroban contracts (`soroban/`) **(planned, Phase 1)**

- `htlc` — `create_order`, `claim_order(preimage)`,
  `refund_order` with the same semantics as the EVM HTLCEscrow.
- `resolver_registry` — Soroban-side resolver allowlist.

This eliminates the v1 design where Stellar-side custody depended on the
coordinator's hot key, which was the core SCF #40 security concern.

### 3.3 Coordinator (`coordinator/`, ex-`relayer/`) **(in rewrite, Phase 4)**

A reference Node.js service that:

- watches both chains for order events,
- maintains a public order book,
- relays secret-reveal events between chains,
- never signs a transaction that could move user funds without a valid
  preimage or expired timelock.

Persistence: SQLite for development, Postgres for production.

### 3.4 Resolver (`resolver/`) **(planned, Phase 3)**

An open-source CLI / Docker image that any party can run after staking
on `ResolverRegistry`. The reference coordinator runs an instance for
convenience; it has no privilege over community resolvers.

### 3.5 Frontend (`frontend/`) **(in rewrite, Phase 6)**

- A React + Vite dApp using the shared `@oversync/sdk` package.
- Provides a per-order refund button that calls the contract directly,
  so users can always recover their funds without coordinator
  participation.
- Reads transaction history only from the coordinator or from real
  on-chain events — no fabricated demo data.

## 4. Trust model (will be expanded in `docs/TRUST_MODEL.md`)

- **Coordinator compromise.** A compromised coordinator cannot spend any
  user funds. It can withhold secret-reveal relay, in which case users
  perform refund or claim directly from their wallet after the timelock.
- **Resolver compromise.** A misbehaving resolver loses its stake via
  on-chain slashing. The user's locked funds remain refundable.
- **Single-chain compromise.** HTLC invariants prevent partial completion:
  either both sides settle or both sides refund.

## 5. Status table

| Layer | v1 state | v2 plan |
|---|---|---|
| Stellar HTLC | Claimable Balance with unconditional claimants, coordinator-custodial | Soroban HTLC, non-custodial, symmetric with EVM |
| EVM HTLC | `HTLCBridge`, `MainnetHTLC`, custom `EscrowFactory` (3 overlapping contracts, resolver allowlist not enforced) | Single canonical `HTLCEscrow` + `EscrowFactory`, allowlist enforced |
| Resolver network | Single coordinator key, no on-chain registry | `ResolverRegistry` on both chains, open staking |
| Refund | Async, mocked in coordinator; v1 sent refund to coordinator address | On-chain, permissionless, paid to original user |
| Persistence | In-memory `Map`, lost on restart | SQLite/Postgres with state machine |
| Frontend history | Hard-coded mock entries + relayer fallback returning fake hashes | Real coordinator API + on-chain events only |

## 6. Out of scope (v2.0)

- Partial fills on Soroban (planned for v2.1; EVM side keeps the v1
  partial-fill code path).
- Stellar non-XLM assets (planned for v2.1).
- Off-chain resolver auction protocol (v2.x; v2.0 uses simple
  first-come-first-served fills).
