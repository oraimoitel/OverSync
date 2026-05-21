import pptxgen from "pptxgenjs";

const slides = [
  {
    title: "OverSync",
    body: [
      "Trust-minimised native cross-chain swaps",
      "",
      "Ethereum ↔ Stellar today",
      "HTLC protocol for non-EVM corridors tomorrow",
      "",
      "[Adın Soyadın] · Founder",
      "[email] · oversync.app",
    ],
  },
  {
    title: "The Problem — $2B+ in bridge hacks",
    body: [
      "Bridge hacks share one pattern: compromised off-chain signers",
      "",
      "Ronin — $625M  |  Wormhole — $325M  |  Multichain — $231M",
      "",
      'Institutions now ask for "an actual HTLC" —',
      "not another committee-signed bridge.",
    ],
  },
  {
    title: "Why existing Stellar bridges don't solve this",
    body: [
      "Stellar bridging exploded in 2026 — trust models differ",
      "",
      "CCTP v2 → USDC only, Circle attestation",
      "Axelar ITS → Validator set, wrapped tokens",
      "Allbridge → Validator set, low Stellar TVL",
      "",
      "Nobody offers native XLM ↔ native ETH with HTLC settlement.",
    ],
  },
  {
    title: "Our Solution — Symmetric HTLC",
    body: [
      "No validator quorum · No admin escape hatch",
      "",
      "1. User locks ETH (hashlock + 24h)",
      "2. Resolver locks XLM (same hashlock + 12h)",
      "3. User claims XLM → reveals secret",
      "4. Resolver claims ETH with public secret",
      "",
      "Funds move only via claim or permissionless refund to user.",
    ],
  },
  {
    title: "Product — Live on Testnet",
    body: [
      "✓ HTLCEscrow + ResolverRegistry — Sepolia",
      "✓ oversync-htlc — Stellar testnet",
      "✓ React dApp — MetaMask + Freighter",
      "✓ Open-source resolver + SDK",
      "✓ 49+ automated tests · CI · MIT open source",
      "",
      "Sepolia: 0xb352339BEb146f2699d28D736700B953988bB178",
    ],
  },
  {
    title: "Four Refund Layers",
    body: [
      "Funds cannot be stranded",
      "",
      "1. On-chain HTLC refund — permissionless after timelock",
      "2. Frontend RefundDialog — one-click recovery",
      "3. Automatic XLM refund — if ETH leg fails (< 30s)",
      "4. Background watchdog — scans every 60 seconds",
    ],
  },
  {
    title: "Business Model",
    body: [
      "Power users — HTLC settlement, normal dApp UX",
      "Stellar protocols — native ETH, not wrapped tokens",
      "Fusion+ resolvers — extend inventory to Stellar",
      "OTC / treasuries — $25k–$500k swaps, trust > speed",
      "",
      "Revenue: resolver spread · coordinator SaaS · protocol fee",
    ],
  },
  {
    title: "Why Now — May 2026",
    body: [
      "1. Stellar bridging boom (Axelar mainnet, CCTP imminent)",
      "2. Validator-set fatigue ($2B+ bridge losses)",
      "3. Fusion+ normalised open resolver pattern on EVM",
      "",
      "First native Soroban HTLC bridge with open resolver registry.",
    ],
  },
  {
    title: "Roadmap & Vision",
    body: [
      "Now — v2 testnet live, 49 tests",
      "Q3–Q4 2026 — Audits + fuzz tests",
      "Q1 2027 — Mainnet + CCTP/Axelar composition",
      "2027–28 — Cosmos, Near (HTLC replication)",
      "2028+ — Non-EVM ↔ Non-EVM native corridors",
      "",
      "We sell trust. Axelar sells coverage. We compose, not compete.",
    ],
  },
  {
    title: "Team & The Ask",
    body: [
      "[Adın] — [background]",
      "",
      "Raising: [$500K seed]",
      "Use: 2 audits · Soroban hire · resolver bootstrap · mainnet runway",
      "Milestone: Mainnet Q1 2027 · 3 community resolvers",
      "",
      "github.com/karagozemin/OverSync-1nchFusion",
    ],
  },
];

const pptx = new pptxgen();
pptx.layout = "LAYOUT_16x9";
pptx.author = "OverSync";
pptx.title = "OverSync — IBW 2026 Pitch Deck";

for (const slide of slides) {
  const s = pptx.addSlide();
  s.background = { color: "0F172A" };
  s.addText(slide.title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 1,
    fontSize: 28,
    bold: true,
    color: "FFFFFF",
    fontFace: "Arial",
  });
  s.addText(slide.body.join("\n"), {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 4.5,
    fontSize: 16,
    color: "E2E8F0",
    fontFace: "Arial",
    valign: "top",
    lineSpacingMultiple: 1.15,
  });
}

const out = new URL("./OverSync_Pitch_IBW2026.pptx", import.meta.url).pathname;
await pptx.writeFile({ fileName: out });
console.log("Created:", out);
