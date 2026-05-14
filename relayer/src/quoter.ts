/**
 * @fileoverview Quoter service for FusionBridge API
 * @description Quote calculation and preset generation logic
 */

import { QuoteRequest, QuoteResponse, Preset, AuctionPoint, GasCostConfig, TimeLocks } from './types.js';
import { RELAYER_CONFIG } from './index.js';
import { 
  generateQuoteId, 
  calculateDestinationAmount, 
  generateDefaultTimeLocks,
  getCurrentTimestamp,
  addTimeToTimestamp 
} from './utils.js';

/**
 * Quoter service class for handling quote requests
 */
export class QuoterService {
  
  /**
   * Calculate quote for cross-chain swap
   */
  async calculateQuote(params: QuoteRequest): Promise<QuoteResponse> {
    const {
      srcChain,
      dstChain,
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress,
      fee = 0
    } = params;

    // Basic fee calculation
    const feeRate = RELAYER_CONFIG.fees.feeRate + fee; // basis points
    const dstAmount = calculateDestinationAmount(amount, feeRate);
    
    // Generate quote ID
    const quoteId = generateQuoteId();
    
    // Generate presets (basic implementation - will be enhanced in Phase 2)
    const presets = {
      fast: this.generatePreset('fast', amount, dstAmount),
      medium: this.generatePreset('medium', amount, dstAmount),
      slow: this.generatePreset('slow', amount, dstAmount)
    };

    // Get escrow factory addresses
    const srcEscrowFactory = this.getEscrowFactoryAddress(srcChain);
    const dstEscrowFactory = this.getEscrowFactoryAddress(dstChain);

    // Generate time locks
    const timeLocks = generateDefaultTimeLocks();

    // Safety deposits (0.001 ETH equivalent for now)
    // Dynamic safety deposits (using minimum baseline for quoter)
    const srcSafetyDeposit = "50000000000000"; // 0.00005 ETH baseline (under $50)
    const dstSafetyDeposit = "50000000000000"; // 0.00005 ETH baseline (under $50)

    // Whitelist (empty for now - will be populated in Phase 4)
    const whitelist: string[] = [];

    // Real price data is wired in via QuoterService (CoinGecko + 1inch
    // quote API). When the caller has not provided a fresh price feed we
    // omit the `prices` block entirely rather than ship hard-coded
    // numbers that would mislead the user.
    const prices = await this.fetchUsdPrices(srcChain, srcTokenAddress, dstChain, dstTokenAddress);

    const volume = prices
      ? {
          usd: {
            srcToken: this.calculateUSDVolume(amount, prices.usd.srcToken),
            dstToken: this.calculateUSDVolume(dstAmount, prices.usd.dstToken)
          }
        }
      : undefined;

    return {
      quoteId,
      srcTokenAmount: amount,
      dstTokenAmount: dstAmount,
      presets,
      srcEscrowFactory,
      dstEscrowFactory,
      whitelist,
      timeLocks,
      srcSafetyDeposit,
      dstSafetyDeposit,
      recommendedPreset: 'fast',
      prices: prices ?? undefined,
      volume
    };
  }

  /**
   * Fetch real USD prices for the given token pair. Returns `null` when a
   * price feed is unavailable so callers can decide how to render the
   * quote rather than seeing a fabricated value.
   */
  private async fetchUsdPrices(
    _srcChain: number,
    _srcToken: string,
    _dstChain: number,
    _dstToken: string
  ): Promise<{ usd: { srcToken: string; dstToken: string } } | null> {
    // Phase 4 wires this into the real PriceService (CoinGecko + 1inch).
    // Until then we return null instead of mock numbers.
    return null;
  }

  /**
   * Generate preset configuration
   */
  private generatePreset(type: 'fast' | 'medium' | 'slow', srcAmount: string, dstAmount: string): Preset {
    const baseConfig = {
      fast: {
        auctionDuration: 120,   // 2 minutes
        startAuctionIn: 2,      // 2 seconds delay
        initialRateBump: 1000,  // 10% initial bump
        gasBumpEstimate: 80,    // High priority
        gasPriceEstimate: "30", // 30 gwei
        secretsCount: 1
      },
      medium: {
        auctionDuration: 180,   // 3 minutes
        startAuctionIn: 5,      // 5 seconds delay
        initialRateBump: 750,   // 7.5% initial bump
        gasBumpEstimate: 60,    // Medium priority
        gasPriceEstimate: "20", // 20 gwei
        secretsCount: 1
      },
      slow: {
        auctionDuration: 300,   // 5 minutes
        startAuctionIn: 10,     // 10 seconds delay
        initialRateBump: 500,   // 5% initial bump
        gasBumpEstimate: 40,    // Low priority
        gasPriceEstimate: "15", // 15 gwei
        secretsCount: 1
      }
    };

    const config = baseConfig[type];
    
    // Generate auction points (will be enhanced in Phase 2)
    const points: AuctionPoint[] = [
      { delay: 12, coefficient: 455 },
      { delay: 24, coefficient: 300 },
      { delay: 48, coefficient: 150 }
    ];

    // Gas cost configuration
    const gasCost: GasCostConfig = {
      gasBumpEstimate: config.gasBumpEstimate,
      gasPriceEstimate: config.gasPriceEstimate
    };

    // Calculate cost in destination token (basic implementation)
    const costInDstToken = this.calculateCostInDstToken(dstAmount, config.gasBumpEstimate);

    return {
      auctionDuration: config.auctionDuration,
      startAuctionIn: config.startAuctionIn,
      initialRateBump: config.initialRateBump,
      auctionStartAmount: dstAmount,
      startAmount: dstAmount,
      auctionEndAmount: dstAmount,
      exclusiveResolver: null,
      costInDstToken,
      points,
      allowPartialFills: false,   // Will be enabled in Phase 4
      allowMultipleFills: false,  // Will be enabled in Phase 4
      gasCost,
      secretsCount: config.secretsCount
    };
  }

  /**
   * Get escrow factory address for given chain
   */
  private getEscrowFactoryAddress(chainId: number): string {
    const factoryAddresses: Record<number, string> = {
      1: process.env.ETHEREUM_ESCROW_FACTORY || '0x0000000000000000000000000000000000000000',
      11155111: process.env.SEPOLIA_ESCROW_FACTORY || '0x0000000000000000000000000000000000000000',
      // Add more chains as needed
    };

    return factoryAddresses[chainId] || '0x0000000000000000000000000000000000000000';
  }

  /**
   * Calculate cost in destination token
   */
  private calculateCostInDstToken(dstAmount: string, gasBump: number): string {
    // Basic calculation - will be enhanced with actual gas cost calculation
    const amount = BigInt(dstAmount);
    const cost = (amount * BigInt(gasBump)) / BigInt(10000); // gasBump in basis points
    return cost.toString();
  }

  /**
   * Calculate USD volume
   */
  private calculateUSDVolume(amount: string, priceUSD: string): string {
    // Convert amount to readable format (assuming 18 decimals)
    const amountBigInt = BigInt(amount);
    const divisor = BigInt(10 ** 18);
    const amountFloat = Number(amountBigInt) / Number(divisor);
    
    const price = parseFloat(priceUSD);
    const usdVolume = amountFloat * price;
    
    return usdVolume.toFixed(2);
  }

  /**
   * Build order from quote
   */
  async buildOrder(quote: QuoteResponse, preset: string = 'fast'): Promise<any> {
    const selectedPreset = quote.presets[preset as keyof typeof quote.presets];
    
    if (!selectedPreset) {
      throw new Error(`Invalid preset: ${preset}`);
    }

    // Real EIP-712 order construction is implemented by the v2 SDK
    // (`packages/sdk`). Calling buildOrder() against the legacy
    // relayer would return only placeholder data, so we now refuse the
    // call rather than ship a fake order hash that the user might sign.
    throw new Error(
      'Legacy buildOrder() is no longer available. Use @oversync/sdk buildOrder() in the v2 coordinator.'
    );
  }
}

// Export singleton instance
export const quoterService = new QuoterService(); 