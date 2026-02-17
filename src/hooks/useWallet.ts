import { useState, useCallback, useEffect } from "react";
import { BrowserProvider, formatEther } from "ethers";

interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

const POLYGON_CHAIN_ID = 137;
const POLYGON_PARAMS = {
  chainId: "0x89",
  chainName: "Polygon Mainnet",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: ["https://polygon-rpc.com"],
  blockExplorerUrls: ["https://polygonscan.com"],
};

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  const getProvider = useCallback(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return new BrowserProvider((window as any).ethereum);
    }
    return null;
  }, []);

  const fetchBalance = useCallback(async (address: string) => {
    const provider = getProvider();
    if (!provider) return null;
    const balance = await provider.getBalance(address);
    return parseFloat(formatEther(balance)).toFixed(4);
  }, [getProvider]);

  const switchToPolygon = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: POLYGON_PARAMS.chainId }] });
    } catch (err: any) {
      if (err.code === 4902) {
        await eth.request({ method: "wallet_addEthereumChain", params: [POLYGON_PARAMS] });
      }
    }
  }, []);

  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      window.open("https://metamask.io/download/", "_blank", "noopener,noreferrer");
      return;
    }
    setWallet((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const chainId = parseInt(await eth.request({ method: "eth_chainId" }), 16);
      if (chainId !== POLYGON_CHAIN_ID) await switchToPolygon();
      const balance = await fetchBalance(accounts[0]);
      setWallet({ address: accounts[0], balance, chainId: POLYGON_CHAIN_ID, isConnecting: false, error: null });
    } catch (err: any) {
      setWallet((s) => ({ ...s, isConnecting: false, error: err?.message || "Connection failed" }));
    }
  }, [fetchBalance, switchToPolygon]);

  const disconnect = useCallback(() => {
    setWallet({ address: null, balance: null, chainId: null, isConnecting: false, error: null });
  }, []);

  const shortAddress = wallet.address
    ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
    : null;

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    const handleAccounts = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else {
        fetchBalance(accounts[0]).then((balance) =>
          setWallet((s) => ({ ...s, address: accounts[0], balance }))
        );
      }
    };
    const handleChain = (chainId: string) => {
      setWallet((s) => ({ ...s, chainId: parseInt(chainId, 16) }));
    };
    eth.on("accountsChanged", handleAccounts);
    eth.on("chainChanged", handleChain);
    return () => {
      eth.removeListener("accountsChanged", handleAccounts);
      eth.removeListener("chainChanged", handleChain);
    };
  }, [disconnect, fetchBalance]);

  return { ...wallet, shortAddress, connect, disconnect, hasWallet: !!(window as any)?.ethereum };
}
