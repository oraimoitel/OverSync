# @oversync/coordinator

Reference coordinator (formerly "relayer") for the OverSync cross-chain
bridge.

## What this service does

- Hosts the public order book — anyone can POST `/api/orders/announce`
  to publish a new HTLC swap intent.
- Watches both chains for `OrderCreated` / `OrderClaimed` /
  `OrderRefunded` events and updates a persistent local cache (SQLite).
- Coordinates secret reveals between the two chains: once a preimage is
  posted to `/api/secrets/reveal`, the coordinator validates it against
  the on-chain hashlock and broadcasts it so resolvers can settle the
  counterpart side.
- Provides a `/api/orders/history?address=...` endpoint the frontend
  consumes for transaction history.

## What this service deliberately does NOT do

- Hold user funds. Ever. Every cross-chain movement is gated by
  on-chain hashlock + timelock checks.
- Sign Ethereum or Stellar transactions on behalf of users. The
  user (or a resolver) submits all chain transactions from their own
  wallet.
- Fabricate order or secret data. If the underlying chain does not
  respond, the endpoint returns the real error.

## Quick start

```bash
cd coordinator
pnpm install
pnpm dev
```

By default the coordinator listens on `:3001` and writes to
`./oversync.db`. Override with env vars (see `env.example`).

## Architecture

```
src/
├── index.ts                # 50-line bootstrap
├── config.ts               # zod-validated env config
├── logger.ts               # pino logger factory
├── server/
│   ├── app.ts              # Express app factory
│   └── routes/
│       ├── health.ts       # GET /health
│       ├── orders.ts       # POST /api/orders/announce, GET /api/orders/:id, ...
│       ├── secrets.ts      # POST /api/secrets/reveal, GET /api/secrets/:id
│       └── quotes.ts       # GET /api/quotes/eth-xlm
├── services/
│   ├── order-service.ts    # Order lifecycle + state machine guards
│   ├── secret-service.ts   # Preimage validation + storage
│   └── quote-service.ts    # CoinGecko price lookups (real, not mocked)
├── listeners/
│   ├── ethereum-listener.ts # viem event subscription
│   └── soroban-listener.ts  # Soroban getEvents polling
├── persistence/
│   ├── db.ts               # node:sqlite (Node 22.5+/24.x built-in)
│   ├── schema.sql          # idempotent schema
│   └── orders-repo.ts      # typed CRUD
└── state-machine/
    └── order-machine.ts    # legal transitions
```

This replaces the 3276-line monolithic `relayer/src/index.ts` from v1.

## Persistence

We use Node's built-in `node:sqlite` driver — no native addons, no
build step. For production, swap the URL to a Postgres connection
string and replace the driver in `src/persistence/db.ts`. The schema
in `schema.sql` is portable across both engines.

## Tests

```bash
pnpm test
```

The test suite covers the order service state transitions, secret
validation (rejects preimages that don't hash to the stored hashlock),
and the schema bootstrapping.
