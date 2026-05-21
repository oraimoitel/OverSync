# OverSync — IBW x Endeavor Türkiye Pitch Deck

**Event:** Istanbul Blockchain Week 2026 · Startup Pitch Competition  
**Date:** 3 June 2026 · Hilton Bomonti  
**Format:** ~3 min pitch + ~2 min Q&A · 10 slides max  
**Apply:** [istanbulblockchainweek.com/ibw-x-endeavor-turkey-startup-pitch-competition](https://istanbulblockchainweek.com/ibw-x-endeavor-turkey-startup-pitch-competition/)

> Bu dosyayı Google Slides / Keynote / Canva'ya aktar. `[...]` ile işaretli alanları kendi bilgilerinle doldur.

---

## Slide 1 — Title

**OverSync**  
*Trust-minimised native cross-chain swaps*

Ethereum ↔ Stellar today · HTLC protocol for non-EVM corridors tomorrow

`[Founder Name]` · `[Title]` · `[email]` · `[oversync.app / testnet URL]`

**Speaker note:** Tek cümlede ne yaptığını söyle. "Bridge" kelimesini ikinci planda tut — "trust-minimised native swap protocol" de.

---

## Slide 2 — The Problem ($2B+ in bridge hacks)

**Bridge hacks share one pattern: compromised off-chain signers**

| Incident | Loss | Root cause |
|---|---|---|
| Ronin | $625M | Validator keys compromised |
| Wormhole | $325M | Guardian quorum failure |
| Multichain | $231M | Multisig / operator compromise |

> Institutions and power users increasingly ask for **"an actual HTLC"** — not another committee-signed bridge.

**Speaker note:** Yatırımcı bu tabloyu bilir. 15 saniye dur, sonra geç. Mesaj: problem büyük, pattern tekrarlı, çözüm kategorisi farklı olmalı.

---

## Slide 3 — Why Existing Stellar Bridges Don't Solve This

**Stellar bridging exploded in 2026 — but trust models differ**

| Bridge | Live | Trust model | Gap |
|---|---|---|---|
| Circle CCTP v2 | Testnet → mainnet | Circle attestation | **USDC only** |
| Axelar ITS | Mainnet (Feb 2026) | Validator set | Wrapped tokens |
| Allbridge | Mainnet | Validator set | ~$0.45M Stellar TVL |

**Nobody offers native XLM ↔ native ETH with HTLC-grade settlement and no privileged signer.**

**Speaker note:** "Rakipler kötü" deme — "farklı segment" de. CCTP ve Axelar büyüdükçe Stellar'a para akıyor; OverSync o paranın trust-minimised çıkış kapısı.

---

## Slide 4 — Our Solution

**Symmetric HTLC on both chains. No validator quorum. No admin escape hatch.**

```
User locks ETH          Resolver locks XLM
(hashlock + 24h)   →    (same hashlock + 12h)
        ↓                        ↓
User claims XLM         Resolver claims ETH
(reveals secret)        (uses public secret)
```

Locked funds move only when:
1. **Claim** — correct preimage before timelock, or  
2. **Refund** — permissionless after timelock → always back to **user**

**Speaker note:** Timelock asymmetry kritik: resolver risk alır (12h), user korunur (24h). "Operator çalsa bile user fonu çalamaz" buradan geliyor.

---

## Slide 5 — Product (Live on Testnet)

**Deployed, tested, demo-ready — not a whitepaper**

| Layer | Status |
|---|---|
| EVM `HTLCEscrow` + `ResolverRegistry` | Sepolia — verified |
| Soroban `oversync-htlc` + registry | Stellar testnet — verified |
| React dApp (MetaMask + Freighter) | `[testnet.oversync.app]` |
| Coordinator (SQLite, REST/WS) | Running |
| Open-source resolver runner + Docker | [`resolver/`] |
| `@oversync/sdk` | 8 Vitest tests |

**49+ automated tests · CI on every push · MIT open source**

**Testnet contracts:**
- Sepolia HTLC: `0xb352339BEb146f2699d28D736700B953988bB178`
- Stellar HTLC: `CDIKSJKVMXKGBRD3BBEBMF7Q4GQJ52ECU6R6G5HEKXKXVGGWK2CTA6JK`

**Speaker note:** Demo varsa burada geç — "telefonumda testnet swap gösterebilirim." Explorer linklerini hazır tut.

---

## Slide 6 — Four Refund Layers (Funds Cannot Be Stranded)

| Layer | What | Latency |
|---|---|---|
| 1. On-chain HTLC refund | Permissionless after timelock | ≤ 24h |
| 2. Frontend RefundDialog | One-click in transaction history | User-driven |
| 3. Automatic XLM refund | Relayer refunds on ETH leg failure | < 30s |
| 4. Background watchdog | Scans every 60s, refunds stale orders | < 6 min |

**Even if coordinator dies, resolver misbehaves, or user closes the tab — funds recover.**

**Speaker note:** Bu slide operational risk sorusunu öldürür. Treasury / OTC kullanıcıları için güçlü.

---

## Slide 7 — Business Model & Target Users

**Four segments, one wedge**

| Segment | Why OverSync | Swap size |
|---|---|---|
| Trust-conscious power users | HTLC settlement, normal dApp UX | $1k–$50k |
| Stellar-native protocols | Native ETH delivery, not wrapped | Protocol treasury |
| 1inch Fusion+ resolvers | Same resolver pattern, new inventory | Resolver fees |
| OTC / treasuries | Trust savings > gas overhead | $25k–$500k |

**Revenue (post-mainnet):**
- Resolver spread / fee on filled orders  
- Optional coordinator SaaS for white-label integrators  
- Future: protocol fee on registry (governance-gated)

**Speaker note:** Henüz mainnet TVL yok — dürüst ol. "Testnet traction + partnership pipeline" göster, sahte metrik koyma.

---

## Slide 8 — Why Now

**Three trends converging on Stellar — May 2026**

1. **Stellar bridging boom** — Axelar ITS mainnet, CCTP v2 imminent → more cross-chain liquidity landing on Stellar  
2. **Validator-set fatigue** — $2B+ cumulative bridge losses → demand for HTLC-grade settlement  
3. **Fusion+ normalises resolvers** — open per-order escrow is proven on EVM; we extend it to Soroban  

**Window:** First native Soroban HTLC bridge with open resolver registry — before mainnet competitors copy the pattern.

**Speaker note:** Timing slide'ı — "neden bugün, neden Stellar, neden sen."

---

## Slide 9 — Roadmap & Long-Term Vision

**Depth first, then replication — not "another Axelar"**

| Phase | Milestone | Timeline |
|---|---|---|
| **Now** | v2 testnet live · 49 tests · docs + CI | ✅ May 2026 |
| **Q3–Q4 2026** | Foundry fuzz · differential tests · 2 independent audits | Audit prep |
| **Q1 2027** | Mainnet launch · CCTP v2 + Axelar route composition | Public release |
| **2027–28** | HTLC replication → Cosmos, Near | Same trust model, new corridors |
| **2028+** | Non-EVM ↔ Non-EVM native swaps | Stellar ↔ Cosmos without EVM hub |

```
Today:     ETH ←—— HTLC ——→ Stellar (Soroban)
2027:      + CCTP (USDC) + Axelar (wrapped) as composable routes
2028+:     HTLC template → additional non-EVM chains
```

**We sell trust minimisation. Axelar sells coverage. We compose, not compete.**

**Speaker note:** Vision slide — yatırımcı TAM soruyor. "50 chain" deme; "HTLC primitive replication" de.

---

## Slide 10 — Team & The Ask

**Team**

| | |
|---|---|
| `[Founder Name]` | `[Background: e.g. full-stack / blockchain / previous projects]` |
| `[Co-founder / Advisor if any]` | `[Role]` |
| Open resolver network | Community operators — not solo-coupled |

**Partnerships in progress:** Stellar Foundation dev programmes · 1inch Fusion+ outreach · audit firm shortlist

**The Ask**

| | |
|---|---|
| **Raising** | `[e.g. $500K – $750K seed]` |
| **Stage** | Pre-seed / Seed |
| **Use of funds** | Independent audits (2 firms) · Soroban specialist · resolver bootstrap pool · 12-month runway to mainnet |
| **Milestone unlock** | Mainnet launch Q1 2027 · 3 community resolvers · public TVL dashboard |

**Contact:** `[email]` · `[Twitter/X]` · `[GitHub: github.com/karagozemin/OverSync-1nchFusion]`

**Speaker note:** IBW kriteri $250K+ — raise miktarını net söyle. Audit + mainnet için somut milestone bağla.

---

# 3-Minute Pitch Script (word-for-word guide)

> **~450 words · practice with timer**

---

**[0:00 – 0:20] Hook**

"Bridge hacks have cost over two billion dollars. Ronin, Wormhole, Multichain — same pattern every time: someone compromised the off-chain signer quorum, and wrapped tokens got minted without a real lock.

OverSync is a cross-chain protocol where that attack vector **does not exist**. There is no validator set, no attester, no admin key that can move user funds. Only sha256, timelock, and chain consensus."

---

**[0:20 – 0:50] Problem + Wedge**

"We're starting with Ethereum and Stellar. Stellar's bridging landscape changed dramatically this year — Axelar ITS went mainnet in February, Circle's CCTP v2 is coming. But CCTP is USDC-only with Circle attestation. Axelar and Allbridge use validator sets and deliver wrapped tokens.

Nobody offers **native XLM to native ETH** with HTLC-grade settlement. That's the gap we fill — and as more liquidity flows into Stellar, that gap gets bigger, not smaller."

---

**[0:50 – 1:30] Solution + Product**

"How it works: the user locks ETH on Ethereum under a hashlock. A resolver locks XLM on Stellar under the same hashlock, but with a shorter timelock — so the resolver takes the timing risk, not the user.

The user claims XLM by revealing the secret. The resolver uses that public secret to claim ETH. If anything fails, four independent refund layers kick in — on-chain permissionless refund, a one-click UI button, automatic relayer refund, and a background watchdog that runs every sixty seconds.

This isn't a whitepaper. We have **HTLCEscrow on Sepolia**, **oversync-htlc on Soroban testnet**, a live frontend, an open-source resolver anyone can run, and forty-nine automated tests in CI. MIT licensed, fully open source."

---

**[1:30 – 2:10] Differentiation + Vision**

"What makes us different isn't 'we use HTLC' — it's that we built **real Soroban HTLC contracts** with symmetric semantics to EVM, an open resolver registry with stake and slash, and composability with CCTP and Axelar so we're not an isolated island.

Long term, we're not trying to be Axelar with fifty chains. We're building a **trust-minimisation layer** — the same HTLC primitive replicated chain by chain. Stellar today, Cosmos and Near tomorrow, and eventually non-EVM to non-EVM corridors without routing everything through Ethereum."

---

**[2:10 – 2:45] Traction + Ask**

"Our users are trust-conscious power users, Stellar protocols that need native ETH, Fusion+ resolver operators, and OTC desks moving twenty-five to five hundred thousand per swap.

We're raising **[AMOUNT]** to fund two independent audits, expand the team with a Soroban specialist, bootstrap the first community resolvers, and reach mainnet in Q1 twenty-twenty-seven.

We're the trust-minimised exit ramp for Stellar's growing cross-chain liquidity. I'd love to show you a live testnet swap after this. Thank you."

---

# Q&A Cheat Sheet — Top 10 Hard Questions

### 1. "HTLC bridges exist. What's new?"

**A:** HTLC exists since Lightning. What's new is **production Soroban HTLC + symmetric EVM HTLC + open resolver registry + four refund layers + CCTP/Axelar composability** in one stack. We're not inventing HTLC — we're shipping it on Stellar with institutional-grade docs and audit-first mainnet gating.

### 2. "Where's your traction / TVL?"

**A:** v2 is testnet-first by design — we refuse to ship unaudited contracts to mainnet. Traction today: deployed testnet contracts, 49 CI tests, open-source resolver runner, Stellar Foundation conversations. Post-mainnet KPIs: public TVL dashboard, weekly volume reporting, no vanity metrics.

### 3. "Is mainnet available?"

**A:** Not in the public UI. The dApp is testnet-only (`VITE_MAINNET_ENABLED=false`); the navbar shows **Mainnet Coming**. Legacy v1 mainnet code remains in the repo for reference, but new users are routed to v2 testnet only. Mainnet returns after fuzz tests, two independent audits, and v2 contract deployment (Q1 2027 target).

### 4. "HTLC is slow. Who will use this?"

**A:** Not $5 retail swaps — safety deposit and multi-block delay make us uneconomic there. Our segments: treasuries ($25k–$500k), power users who explicitly want HTLC settlement, and protocols that need native assets not wrapped tokens. Speed vs trust trade-off — we own the trust side.

### 5. "What if sha256 breaks?"

**A:** Then all of crypto breaks — Bitcoin, TLS, every bridge. Our trust assumption is strictly weaker than validator-set bridges: we add nothing beyond chain consensus + sha256.

### 6. "How do you make money?"

**A:** Resolver spread on filled orders; optional coordinator SaaS for integrators; future governance-gated protocol fee. Primary near-term: resolver network economics at scale post-mainnet.

### 7. "Axelar has 50 chains. You'll never catch up."

**A:** We don't compete on coverage — we compete on trust minimisation. Axelar sells validator-set wrapped routing; we sell native HTLC settlement. Our roadmap composes with Axelar (ITS adapter in Q1 2027 mainnet tranche). Different product, same ecosystem.

### 8. "Single founder / bus factor?"

**A:** Open resolver protocol means the bridge keeps working if the core team disappears — community resolvers fill orders independently. MIT open source, 49 tests, ARCHITECTURE + TRUST_MODEL docs. Funding ask includes Soroban specialist hire and auditor liaison.

### 9. "What's the moat?"

**A:** (1) Soroban HTLC production expertise, (2) symmetric cross-chain invariant design, (3) Fusion+ resolver compatibility for distribution, (4) audit-first credibility, (5) first-mover in trust-minimised Stellar native swap niche.

### 10. "Why Stellar? TAM seems small."

**A:** Stellar is the **beachhead**, not the ceiling. Institutional cross-chain money is arriving via Axelar and CCTP — we capture the trust-minimised slice. Long-term TAM expands via HTLC replication to Cosmos, Near, and non-EVM ↔ non-EVM corridors. Stellar proves the model on a live non-EVM chain.

---

# Application Form — Suggested Answers

Use these when filling the IBW application:

**One-liner:**  
Trust-minimised native cross-chain swaps between Ethereum and Stellar using symmetric HTLCs — no validator set, no attester, no admin escape hatch.

**What problem do you solve?**  
Cross-chain bridge hacks ($2B+ lost) stem from compromised off-chain signer quorums. OverSync eliminates that attack vector by locking funds in hash-time-lock contracts on both chains. Settlement is cryptographic (preimage reveal), not multisig attestation.

**Product / traction:**  
v2 deployed on Sepolia + Stellar testnet. 49 automated tests. Open-source resolver runner, coordinator, SDK, and React dApp. MIT licensed. Mainnet gated on independent audit (Q1 2027).

**Target market:**  
Trust-conscious power users, Stellar-native DeFi protocols, 1inch Fusion+ resolver operators, OTC/treasury desks ($25k–$500k swaps).

**Competitive advantage:**  
Only bridge offering native XLM ↔ native ETH with Soroban HTLC + permissionless refunds + open resolver registry. Composes with CCTP v2 and Axelar ITS rather than competing.

**Funding stage / amount:**  
`[Pre-seed / Seed]` · Raising `[$500K+]` · `[18-month runway to audited mainnet]`

**Why IBW / Endeavor:**  
Istanbul is a strategic hub for Web3 capital and Stellar ecosystem growth in MENA/Turkey. Live pitch to investors accelerates audit funding and resolver network bootstrap ahead of Q1 2027 mainnet.

---

# Demo Checklist (before June 3)

- [ ] Testnet dApp loaded on phone/laptop (`MetaMask Sepolia` + `Freighter testnet`)
- [ ] One successful ETH→XLM swap with Etherscan + Stellar Expert links bookmarked
- [ ] One refund flow demo (expired order → RefundDialog or on-chain refund)
- [ ] Explorer links for deployed contracts (Slide 5)
- [ ] GitHub repo ready to share
- [ ] Backup: screen recording if live demo fails (WiFi issues at venue)

---

# Visual Design Notes

- **Primary colors:** Dark background (matches dApp `DarkVeil` aesthetic) + accent green/teal for "trust / security"
- **Logo:** `frontend/public/images/oversync-logo.png`
- **Diagrams:** Use Slide 4 flow + Slide 9 timeline; avoid dense tables on projected slides — max 4 bullets per slide
- **Font:** Clean sans-serif (Inter, Geist, or similar)
- **No vanity metrics** — if TVL is zero, say "testnet live, mainnet post-audit"

---

# Slide Export Checklist

| # | Slide title | ~seconds |
|---|---|---|
| 1 | Title | 5 |
| 2 | Problem | 20 |
| 3 | Stellar gap | 20 |
| 4 | Solution | 25 |
| 5 | Product / demo | 35 |
| 6 | Refund layers | 20 |
| 7 | Business model | 20 |
| 8 | Why now | 15 |
| 9 | Roadmap & vision | 25 |
| 10 | Team & ask | 25 |
| | **Total** | **~3:10** (trim Slide 6 or 7 if over) |

---

*Last updated: May 2026 · OverSync v2 testnet*
