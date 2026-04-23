import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { WalletSummary, WalletTopUpRequest } from '../../core/models/wallet.model';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly walletState = signal<WalletSummary>({
    balance: 500000,
    currency: 'XAF'
  });

  getWalletSummary(): Observable<WalletSummary> {
    return of(this.walletState()).pipe(delay(250));
  }

  topUpWallet(payload: WalletTopUpRequest): Observable<WalletSummary> {
    const current = this.walletState();
    const next = {
      ...current,
      balance: current.balance + payload.amount
    };

    this.walletState.set(next);
    return of(next).pipe(delay(400));
  }

  walletValue() {
    return this.walletState;
  }

  deductBalance(amount: number): Observable<WalletSummary> {
    const current = this.walletState();
    const next = { ...current, balance: Math.max(0, current.balance - amount) };
    this.walletState.set(next);
    return of(next).pipe(delay(350));
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}