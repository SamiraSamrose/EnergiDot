// frontend/src/context/PolkadotContext.tsx
// STEP I.01 - Polkadot.js API context for wallet interactions

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface PolkadotContextType {
  api: ApiPromise | null;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  selectAccount: (account: InjectedAccountWithMeta) => void;
  disconnectWallet: () => void;
}

const PolkadotContext = createContext<PolkadotContextType | undefined>(undefined);

export const usePolkadot = () => {
  const context = useContext(PolkadotContext);
  if (!context) {
    throw new Error('usePolkadot must be used within a PolkadotProvider');
  }
  return context;
};

interface PolkadotProviderProps {
  children: ReactNode;
}

export const PolkadotProvider: React.FC<PolkadotProviderProps> = ({ children }) => {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApi();
  }, []);

  const initializeApi = async () => {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:9945';
      const wsProvider = new WsProvider(wsUrl);

      const apiInstance = await ApiPromise.create({
        provider: wsProvider,
        types: {
          EnergyAmount: 'u64',
          GridZone: {
            _enum: {
              NorthAmerica: 'u32',
              Europa: 'u32',
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

      await apiInstance.isReady;
      setApi(apiInstance);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to connect to Substrate node');
      setIsLoading(false);
      console.error('API initialization error:', err);
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const extensions = await web3Enable('EnergiDot');

      if (extensions.length === 0) {
        throw new Error('No Polkadot wallet extension found. Please install Talisman or SubWallet.');
      }

      const allAccounts = await web3Accounts();

      if (allAccounts.length === 0) {
        throw new Error('No accounts found. Please create an account in your wallet.');
      }

      setAccounts(allAccounts);
      setSelectedAccount(allAccounts[0]);
      setIsConnected(true);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      console.error('Wallet connection error:', err);
    }
  };

  const selectAccount = (account: InjectedAccountWithMeta) => {
    setSelectedAccount(account);
  };

  const disconnectWallet = () => {
    setAccounts([]);
    setSelectedAccount(null);
    setIsConnected(false);
  };

  const value: PolkadotContextType = {
    api,
    accounts,
    selectedAccount,
    isConnected,
    isLoading,
    error,
    connectWallet,
    selectAccount,
    disconnectWallet,
  };

  return (
    <PolkadotContext.Provider value={value}>
      {children}
    </PolkadotContext.Provider>
  );
};