import { useState, useEffect, useCallback } from 'react';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  shortAddress: string | null;
  chainId: number | null;
  balance: string | null;
  error: string | null;
  isConnecting: boolean;
  hasWallet: boolean;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    shortAddress: null,
    chainId: null,
    balance: null,
    error: null,
    isConnecting: false,
    hasWallet: false,
  });

  const formatAddress = useCallback((address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const getBalance = useCallback(async (address: string): Promise<string | null> => {
    try {
      if (!window.ethereum) return null;
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      return balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  }, []);

  const connect = useCallback(async () => {
    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        if (accounts.length === 0) {
          throw new Error('No accounts found');
        }

        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });

        const address = accounts[0];
        const balance = await getBalance(address);

        setWalletState({
          isConnected: true,
          address,
          shortAddress: formatAddress(address),
          chainId: parseInt(chainId, 16),
          balance,
          error: null,
          isConnecting: false,
          hasWallet: true,
        });
      } else {
        setWalletState(prev => ({
          ...prev,
          error: 'Please install MetaMask or another Web3 wallet',
          isConnecting: false,
          hasWallet: false,
        }));
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setWalletState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect wallet',
        isConnecting: false,
      }));
    }
  }, [formatAddress, getBalance]);

  const disconnect = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      shortAddress: null,
      chainId: null,
      balance: null,
      error: null,
      isConnecting: false,
      hasWallet: typeof window !== 'undefined' && !!window.ethereum,
    });
  }, []);

  // Check if wallet is available and already connected on mount
  useEffect(() => {
    const checkWalletAvailability = () => {
      const hasWallet = typeof window !== 'undefined' && !!window.ethereum;
      setWalletState(prev => ({ ...prev, hasWallet }));
    };

    checkWalletAvailability();

    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            const chainId = await window.ethereum.request({
              method: 'eth_chainId',
            });

            const address = accounts[0];
            const balance = await getBalance(address);

            setWalletState({
              isConnected: true,
              address,
              shortAddress: formatAddress(address),
              chainId: parseInt(chainId, 16),
              balance,
              error: null,
              isConnecting: false,
              hasWallet: true,
            });
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for account and chain changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          const address = accounts[0];
          setWalletState(prev => ({
            ...prev,
            address,
            shortAddress: formatAddress(address),
            isConnected: true,
            error: null,
          }));

          // Fetch updated balance
          getBalance(address).then(balance => {
            if (balance !== null) {
              setWalletState(prev => ({ ...prev, balance }));
            }
          });
        }
      };

      const handleChainChanged = (chainId: string) => {
        setWalletState(prev => ({
          ...prev,
          chainId: parseInt(chainId, 16),
        }));

        // Reload the page to reset the app state
        window.location.reload();
      };

      const handleConnect = () => {
        setWalletState(prev => ({ ...prev, hasWallet: true }));
      };

      const handleDisconnect = (error: { code: number; message: string }) => {
        console.log('Wallet disconnected:', error);
        disconnect();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('connect', handleConnect);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
        window.ethereum?.removeListener('connect', handleConnect);
        window.ethereum?.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [formatAddress, getBalance, disconnect]);

  return {
    ...walletState,
    connect,
    disconnect,
  };
};