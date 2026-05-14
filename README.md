# OverSync

**OverSync** is a non-custodial cross-chain bridge between Ethereum and
Stellar, built around symmetric hash + time-lock contracts (HTLCs) on
both chains.

> **v2 rebuild in progress.** This repository is in the middle of a
> ground-up rebuild driven by feedback from the SCF #40 panel. See
> [`ARCHITECTURE.md`](ARCHITECTURE.md) for the target design and the
> per-component README files (`soroban/`, `contracts/`, `coordinator/`,
> `resolver/`, `packages/sdk/`) for what currently ships. The legacy
> v1 code remains in `relayer/`, `stellar/`, and `frontend/` until the
> v2 modules reach feature parity.

## What's new in v2

| Concern | v1 | v2 |
|---|---|---|
| Stellar HTLC | Claimable balance with unconditional claimants — coordinator-custodial | [Soroban HTLC contract](soroban/contracts/htlc/src/lib.rs) — sha256 hashlock + timelock, non-custodial |
| Ethereum HTLC | Three overlapping contracts (`HTLCBridge`, `MainnetHTLC`, `EscrowFactory`); resolver allowlist not enforced | One canonical [`HTLCEscrow`](contracts/contracts/v2/HTLCEscrow.sol) + [`ResolverRegistry`](contracts/contracts/v2/ResolverRegistry.sol) |
| Operator model | Single relayer with hot keys for both chains | Open [`ResolverRegistry`](docs/RESOLVERS.md) with stake + slash; community resolvers welcome |
| Refunds | Mocked in code; refund address was the relayer's | Permissionless on-chain refund; funds always return to the user |
| Order persistence | In-memory `Map`, lost on restart | SQLite-backed coordinator with state machine |
| Frontend history | Hard-coded mock entries + fake hash fallback | Real coordinator API + on-chain events only ([details](docs/TRUST_MODEL.md)) |
| Tests | Ad-hoc | 10 Soroban + 21 Solidity + 8 SDK + 4 coordinator unit tests, plus GitHub Actions CI |

## Repository layout

```
OverSync-1nchFusion/
├── soroban/                      # NEW Rust workspace
│   ├── contracts/htlc/           # OverSync HTLC for Stellar
│   ├── contracts/resolver-registry/
│   └── README.md
├── contracts/                    # Solidity (Hardhat)
│   └── contracts/v2/             # NEW canonical HTLCEscrow + ResolverRegistry
├── packages/sdk/                 # NEW @oversync/sdk (TypeScript)
├── coordinator/                  # NEW v2 coordinator (replaces relayer/)
├── resolver/                     # NEW open-source resolver runner + Docker
├── relayer/                      # v1 relayer (deprecated, scheduled for removal)
├── frontend/                     # React dApp (RefundDialog added in v2)
├── docs/                         # Trust model, security, deploy, resolvers
└── .github/workflows/            # CI for TS + Rust + Solidity
```

## Quick start

```bash
git clone https://github.com/karagozemin/OverSync-1nchFusion
cd OverSync-1nchFusion
pnpm install
cp env.example .env

# Build SDK
pnpm --filter @oversync/sdk build

# Compile + test Solidity v2 contracts
pnpm --filter @oversync/contracts compile
pnpm --filter @oversync/contracts exec hardhat test test/v2

# Build + test Soroban contracts
cd soroban && cargo test --release && cd ..

# Run coordinator (Node 22.5+ required for built-in node:sqlite)
pnpm --filter @oversync/coordinator dev

# Run frontend
pnpm --filter @oversync/frontend dev
```

## Trust model in one paragraph

User funds are locked in HTLC contracts on both chains. Each lock has a
`hashlock` and a `timelock`. The locked funds can only be moved by:

1. Anyone (typically the beneficiary or a relayer) revealing a preimage
   whose digest matches `hashlock`, before `timelock`.
2. Anyone (typically the user) calling `refund` after `timelock`. The
   funds return to the original `refundAddress` — which is **always the
   user** in OverSync v2.

The coordinator never signs a transaction that could move user funds
without one of these conditions being satisfied. Resolvers stake into
the on-chain `ResolverRegistry`; misbehaviour is slashed. See
[`docs/TRUST_MODEL.md`](docs/TRUST_MODEL.md) for the full threat model.

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — target system architecture
- [`docs/TRUST_MODEL.md`](docs/TRUST_MODEL.md) — non-custodial proofs
- [`docs/DIFFERENTIATION.md`](docs/DIFFERENTIATION.md) — comparison with Allbridge and similar bridges
- [`docs/RESOLVERS.md`](docs/RESOLVERS.md) — run your own resolver
- [`docs/SECURITY.md`](docs/SECURITY.md) — threat model, audit prep, bug bounty
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — testnet + mainnet deployment

## License

MIT. See [`LICENSE`](LICENSE).
