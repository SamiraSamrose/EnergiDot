//### Path: `backend/api-gateway/src/services/substrateService.ts`

// backend/api-gateway/src/services/substrateService.ts
// STEP I.01 - Polkadot.js API + Substrate RPC for wallet-based interactions

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { logger } from '../utils/logger';

export class SubstrateService {
    private static instance: SubstrateService;
    private api: ApiPromise | null = null;
    private keyring: Keyring | null = null;
    private wsProvider: WsProvider | null = null;

    private constructor() {}

    public static getInstance(): SubstrateService {
        if (!SubstrateService.instance) {
            SubstrateService.instance = new SubstrateService();
        }
        return SubstrateService.instance;
    }

    public async connect(): Promise<void> {
        try {
            const wsUrl = process.env.SUBSTRATE_RPC_URL || 'ws://localhost:9945';
            this.wsProvider = new WsProvider(wsUrl);

            this.api = await ApiPromise.create({
                provider: this.wsProvider,
                types: {
                    EnergyAmount: 'u64',
                    GridZone: {
                        _enum: {
                            NorthAmerica: 'u32', Europa: 'u32',
Asia: 'u32',
Custom: 'u32'
}
},
EnergySource: {
_enum: ['Solar', 'Wind', 'Hydro', 'Geothermal', 'Battery', 'Mixed']
},
OrderStatus: {
_enum: ['Open', 'Matched', 'Completed', 'Cancelled', 'Expired']
},
ReputationTier: {
_enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
}
}
});

await this.api.isReady;
        this.keyring = new Keyring({ type: 'sr25519' });

        logger.info('Substrate API connected successfully');
    } catch (error) {
        logger.error('Failed to connect to Substrate node:', error);
        throw error;
    }
}

public async disconnect(): Promise<void> {
    if (this.api) {
        await this.api.disconnect();
        this.api = null;
        logger.info('Substrate API disconnected');
    }
}

public getApi(): ApiPromise {
    if (!this.api) {
        throw new Error('Substrate API not initialized');
    }
    return this.api;
}

public getKeyring(): Keyring {
    if (!this.keyring) {
        throw new Error('Keyring not initialized');
    }
    return this.keyring;
}

// Energy Market functions
public async createSellOrder(
    signer: string,
    energyAmount: number,
    pricePerKwh: string,
    gridZone: any,
    energySource: string,
    expiresInBlocks: number
): Promise<string> {
    try {
        const api = this.getApi();
        const account = this.keyring!.addFromUri(signer);

        const tx = api.tx.energyMarket.createSellOrder(
            energyAmount,
            pricePerKwh,
            gridZone,
            energySource,
            expiresInBlocks
        );

        const hash = await tx.signAndSend(account);
        return hash.toHex();
    } catch (error) {
        logger.error('Error creating sell order:', error);
        throw error;
    }
}

public async buyEnergy(signer: string, orderId: string): Promise<string> {
    try {
        const api = this.getApi();
        const account = this.keyring!.addFromUri(signer);

        const tx = api.tx.energyMarket.buyEnergy(orderId);
        const hash = await tx.signAndSend(account);
        return hash.toHex();
    } catch (error) {
        logger.error('Error buying energy:', error);
        throw error;
    }
}

public async registerDevice(
    signer: string,
    deviceType: string,
    capacityKwh: number,
    didReference: string
): Promise<string> {
    try {
        const api = this.getApi();
        const account = this.keyring!.addFromUri(signer);

        const tx = api.tx.energyMarket.registerDevice(
            deviceType,
            capacityKwh,
            didReference
        );

        const hash = await tx.signAndSend(account);
        return hash.toHex();
    } catch (error) {
        logger.error('Error registering device:', error);
        throw error;
    }
}

// Staking functions
public async stakeTokens(signer: string, amount: string): Promise<string> {
    try {
        const api = this.getApi();
        const account = this.keyring!.addFromUri(signer);

        const tx = api.tx.incentives.stakeTokens(amount);
        const hash = await tx.signAndSend(account);
        return hash.toHex();
    } catch (error) {
        logger.error('Error staking tokens:', error);
        throw error;
    }
}

public async claimRewards(signer: string): Promise<string> {
    try {
        const api = this.getApi();
        const account = this.keyring!.addFromUri(signer);

        const tx = api.tx.incentives.claimRewards();
        const hash = await tx.signAndSend(account);
        return hash.toHex();
    } catch (error) {
        logger.error('Error claiming rewards:', error);
        throw error;
    }
}

// Query functions
public async getEnergyOrder(orderId: string): Promise<any> {
    const api = this.getApi();
    const order = await api.query.energyMarket.energyOrders(orderId);
    return order.toJSON();
}

public async getUserStake(accountId: string): Promise<any> {
    const api = this.getApi();
    const stake = await api.query.incentives.stakes(accountId);
    return stake.toJSON();
}

public async getLeaderboard(): Promise<any> {
    const api = this.getApi();
    const leaderboard = await api.query.incentives.leaderboard();
    return leaderboard.toJSON();
}

public async getGridPrice(gridZone: any): Promise<any> {
    const api = this.getApi();
    const price = await api.query.energyMarket.gridPrices(gridZone);
    return price.toJSON();
}

public async subscribeToBlocks(callback: (blockNumber: number) => void): Promise<void> {
    const api = this.getApi();
    await api.rpc.chain.subscribeNewHeads((header) => {
        callback(header.number.toNumber());
    });
}
}