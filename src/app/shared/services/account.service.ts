import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { CustomerAccount } from '../../core/models/account.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly accountState = signal<CustomerAccount>({
    firstName: 'Emmanuel',
    lastName: 'Adewale',
    email: 'emmanuel@example.com',
    phone: '+234 801 234 5678',
    city: 'Lagos',
    state: 'Ikeja',
    address: '12 Admiralty Way, Lekki',
    avatarInitials: 'EA'
  });

  getAccount(): Observable<CustomerAccount> {
    return of(this.accountState()).pipe(delay(250));
  }

  updateAccount(payload: CustomerAccount): Observable<CustomerAccount> {
    const next = { ...payload, avatarInitials: `${payload.firstName?.[0] ?? ''}${payload.lastName?.[0] ?? ''}`.toUpperCase() };
    this.accountState.set(next);
    return of(next).pipe(delay(350));
  }

  currentAccount() {
    return this.accountState;
  }
}