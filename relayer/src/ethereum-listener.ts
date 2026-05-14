/**
 * @fileoverview Ethereum Event Listener for FusionBridge
 * @description Monitors HTLCBridge contract events and triggers Stellar operations
 */

import { ethers, Contract, EventLog } from 'ethers';
import { RELAYER_CONFIG } from './index.js';

// Mock CrossChainOrder interface for now
interface CrossChainOrder {
  orderId: string;
  sender: string;
  token: string;
  amount: string;
  hashLock: string;
  timelock: number;
  feeRate: string;
  partialFillEnabled: boolean;
  ethereumOrderId?: string;
}

// HTLCBridge contract ABI (focusing on OrderCreated event)
const HTLC_BRIDGE_ABI = [
  "event OrderCreated(uint256 indexed orderId, address indexed sender, address indexed token, uint256 amount, bytes32 hashLock, uint256 timelock, uint256 feeRate, bool partialFillEnabled)",
  "event OrderClaimed(uint256 indexed orderId, address indexed claimer, uint256 amount, uint256 totalFilled, bytes32 preimage)",
  "event OrderRefunded(uint256 indexed orderId, address indexed sender, uint256 refundAmount)"
];

/**
 * Ethereum OrderCreated event data
 */
interface OrderCreatedEvent {
  orderId: bigint;
  sender: string;
  token: string;
  amount: bigint;
  hashLock: string;
  timelock: bigint;
  feeRate: bigint;
  partialFillEnabled: boolean;
  transactionHash: string;
  blockNumber: number;
}

/**
 * Ethereum Event Listener for HTLCBridge contract
 */
export class EthereumEventListener {
  private provider?: ethers.JsonRpcProvider;
  private contract?: Contract;
  private isListening: boolean = false;

  constructor() {
    // Lazy initialization - will be done in startListening()
  }

  /**
   * Initialize components with configuration
   */
  private initializeComponents() {
    if (this.provider) return; // Already initialized

    // In mock mode, don't initialize real provider to avoid RPC errors
    if (RELAYER_CONFIG.enableMockMode) {
      console.log('🧪 Mock mode: Skipping Ethereum provider initialization');
      return;
    }

    // Initialize Ethereum provider
    this.provider = new ethers.JsonRpcProvider(RELAYER_CONFIG.ethereum.rpcUrl);
    
    // Initialize contract
    this.contract = new Contract(
      RELAYER_CONFIG.ethereum.contractAddress,
      HTLC_BRIDGE_ABI,
      this.provider
    );

    // Initialize Stellar client (placeholder for now)
    console.log('🌟 Stellar client initialization placeholder');
  }

  /**
   * Start listening to Ethereum events
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️  Event listener is already running');
      return;
    }

    try {
      // Initialize components first
      this.initializeComponents();

      console.log('🔄 Starting Ethereum event listener...');
      console.log(`📍 Contract address: ${RELAYER_CONFIG.ethereum.contractAddress}`);
      console.log(`🌐 Network: ${RELAYER_CONFIG.ethereum.network}`);

      // Validate configuration
      await this.validateConfiguration();

      // Set up event listener for OrderCreated events
      if (RELAYER_CONFIG.enableMockMode) {
        console.log('🧪 Mock mode: Simulating event listener (no real blockchain connection)');
      } else {
        this.contract!.on('OrderCreated', this.handleOrderCreatedEvent.bind(this));
      }

      this.isListening = true;
      console.log('✅ Ethereum event listener started successfully');
      console.log('👂 Listening for OrderCreated events...');

    } catch (error) {
      console.error('❌ Failed to start event listener:', error);
      throw error;
    }
  }

  /**
   * Stop listening to events
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      console.log('⚠️  Event listener is not running');
      return;
    }

    try {
      if (!RELAYER_CONFIG.enableMockMode) {
        this.contract?.removeAllListeners('OrderCreated');
      }
      this.isListening = false;
      console.log('🛑 Ethereum event listener stopped');
    } catch (error) {
      console.error('❌ Error stopping event listener:', error);
    }
  }

  /**
   * Handle OrderCreated event from HTLCBridge contract
   */
  private async handleOrderCreatedEvent(
    orderId: bigint,
    sender: string,
    token: string,
    amount: bigint,
    hashLock: string,
    timelock: bigint,
    feeRate: bigint,
    partialFillEnabled: boolean,
    event: EventLog
  ): Promise<void> {
    try {
      console.log('\n🚨 NEW ETHEREUM ORDER DETECTED!');
      console.log('================================');
      console.log(`🆔 Order ID: ${orderId.toString()}`);
      console.log(`👤 Sender: ${sender}`);
      console.log(`💰 Token: ${token}`);
      console.log(`💵 Amount: ${ethers.formatUnits(amount.toString(), 18)} tokens`);
      console.log(`🔒 Hash Lock: ${hashLock}`);
      console.log(`⏰ Timelock: ${new Date(Number(timelock) * 1000).toISOString()}`);
      console.log(`💸 Fee Rate: ${Number(feeRate) / 100}%`);
      console.log(`🔄 Partial Fill: ${partialFillEnabled ? 'Enabled' : 'Disabled'}`);
      console.log(`📝 Tx Hash: ${event.transactionHash}`);
      console.log(`🧱 Block: ${event.blockNumber}`);

      // Convert Ethereum event to CrossChainOrder format
      const crossChainOrder: CrossChainOrder = {
        orderId: orderId.toString(),
        ethereumOrderId: orderId.toString(),
        token: token,
        amount: amount.toString(),
        hashLock: hashLock,
        timelock: Number(timelock),
        sender: sender,
        partialFillEnabled: partialFillEnabled,
        feeRate: feeRate.toString()
      };

      // Process the order (create Stellar HTLC)
      await this.processCrossChainOrder(crossChainOrder);

    } catch (error) {
      console.error('❌ Error handling OrderCreated event:', error);
    }
  }

  /**
   * Process cross-chain order by creating Stellar HTLC.
   *
   * The v1 implementation only logged a `placeholder-tx-hash` here and
   * never actually created a Stellar HTLC. v2 routes this through the
   * Soroban HTLC contract via the coordinator's StellarBridgeService.
   * Until that wiring is in place (Phase 4) we explicitly NO-OP and let
   * the user's own claim/refund handle settlement, rather than logging
   * fake success messages.
   */
  private async processCrossChainOrder(order: CrossChainOrder): Promise<void> {
    console.log('🌉 OrderCreated observed on Ethereum:', {
      ethereumOrderId: order.ethereumOrderId,
      hashLock: order.hashLock
    });
    console.log(
      '⚠️  v1 placeholder Stellar HTLC path disabled. The v2 coordinator (Phase 4) ' +
      'creates the Soroban HTLC. Until then the user can refund permissionlessly ' +
      'after the timelock.'
    );
  }

  /**
   * Validate configuration before starting
   */
  private async validateConfiguration(): Promise<void> {
    // Check if contract address is set
    if (!RELAYER_CONFIG.ethereum.contractAddress || RELAYER_CONFIG.ethereum.contractAddress === '') {
      throw new Error('HTLCBridge contract address not configured');
    }

    // Skip network validation in mock mode
    if (RELAYER_CONFIG.enableMockMode) {
      console.log('🧪 Mock mode enabled - skipping network validation');
      console.log('✅ Mock configuration validated');
      return;
    }

    // Check if RPC URL is valid
    if (RELAYER_CONFIG.ethereum.rpcUrl.includes('YOUR_')) {
      throw new Error('Ethereum RPC URL contains placeholder values');
    }

    try {
      // Test provider connection
      const network = await this.provider!.getNetwork();
      console.log(`🔗 Connected to Ethereum network: ${network.name} (Chain ID: ${network.chainId})`);

      // Test contract deployment
      const code = await this.provider!.getCode(RELAYER_CONFIG.ethereum.contractAddress);
      if (code === '0x') {
        throw new Error(`No contract deployed at address: ${RELAYER_CONFIG.ethereum.contractAddress}`);
      }

      console.log('✅ Contract validation successful');

    } catch (error) {
      console.error('❌ Configuration validation failed:', error);
      throw error;
    }
  }

  /**
   * Get current listening status
   */
  public isListeningToEvents(): boolean {
    return this.isListening;
  }

  /**
   * Get contract address being monitored
   */
  public getContractAddress(): string {
    return RELAYER_CONFIG.ethereum.contractAddress;
  }
}

// Export singleton instance
export const ethereumListener = new EthereumEventListener(); 