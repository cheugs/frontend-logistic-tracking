import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap, map, of } from 'rxjs';
import { CustomerAccount } from '../../core/models/account.model';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  
  private readonly accountState = signal<CustomerAccount | null>(null);

  getAccount(): Observable<CustomerAccount> {
    const user = this.authService.currentUser();
    if (!user) return of({} as CustomerAccount);

    return this.userService.getUserById(user.userId).pipe(
      map(res => ({
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
        phone: res.phoneNumber,
        city: res.city || 'Unknown',
        state: res.state || 'Unknown',
        address: res.address,
        avatarInitials: `${res.firstName?.[0] ?? ''}${res.lastName?.[0] ?? ''}`.toUpperCase()
      })),
      tap(acc => this.accountState.set(acc))
    );
  }

  updateAccount(payload: CustomerAccount): Observable<CustomerAccount> {
    const user = this.authService.currentUser();
    if (!user) return of(payload);

    const updateRequest = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phone,
      address: payload.address
    };

    return this.userService.updateUser(user.userId, updateRequest).pipe(
      map(res => ({
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
        phone: res.phoneNumber,
        city: res.city || 'Unknown',
        state: res.state || 'Unknown',
        address: res.address,
        avatarInitials: `${res.firstName?.[0] ?? ''}${res.lastName?.[0] ?? ''}`.toUpperCase()
      })),
      tap(acc => this.accountState.set(acc))
    );
  }

  currentAccount() {
    return this.accountState;
  }
}
