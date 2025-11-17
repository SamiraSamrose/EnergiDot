//### Path: `frontend/src/hooks/usePolkadot.ts`

// frontend/src/hooks/usePolkadot.ts
// Custom hook for Polkadot interactions

import { useState, useEffect } from 'react';
import { usePolkadot as usePolkadotContext } from '../context/PolkadotContext';

export const usePolkadot = () => {
  return usePolkadotContext();
};

export const useBalance = (address: string | undefined) => {
  const { api } = usePolkadot();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api || !address) {
      setLoading(false);
      return;
    }

    let unsubscribe: () => void;

    const fetchBalance = async () => {
      try {
        const unsub = await api.query.system.account(address, (account: any) => {
          setBalance(account.data.free.toString());
          setLoading(false);
        });
        unsubscribe = unsub as unknown as () => void;
      } catch (error) {
        console.error('Error fetching balance:', error);
        setLoading(false);
      }
    };

    fetchBalance();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [api, address]);

  return { balance, loading };
};

export const useBlockNumber = () => {
  const { api } = usePolkadot();
  const [blockNumber, setBlockNumber] = useState<number>(0);

  useEffect(() => {
    if (!api) return;

    let unsubscribe: () => void;

    const subscribeToBlocks = async () => {
      const unsub = await api.rpc.chain.subscribeNewHeads((header) => {
        setBlockNumber(header.number.toNumber());
      });
      unsubscribe = unsub as unknown as () => void;
    };

    subscribeToBlocks();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [api]);

  return blockNumber;
};
