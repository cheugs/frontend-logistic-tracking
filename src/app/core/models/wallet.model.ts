export interface WalletSummary {
  balance: number;
  currency: string;
}

export interface WalletTopUpRequest {
  amount: number;
}