import { ethers } from 'ethers';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  balance: string;
}