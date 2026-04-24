import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { CustomerDashboardData } from '../../core/models/customer-dashboard.model';
import { ParcelService } from './parcel.service';
import { WalletService } from './wallet.service';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerDashboardService {
  private readonly walletService = inject(WalletService);
  private readonly parcelService = inject(ParcelService);
  private readonly accountService = inject(AccountService);

  getDashboardData(): Observable<CustomerDashboardData> {
    return forkJoin({
      wallet: this.walletService.getWalletSummary(),
      activeParcels: this.parcelService.getCurrentUserParcels(),
      account: this.accountService.getAccount()
    }).pipe(
      map(({ wallet, activeParcels, account }) => ({
        profile: {
          firstName: account.firstName,
          fullName: `${account.firstName} ${account.lastName}`,
          city: account.city,
          state: account.state
        },
        wallet,
        activeParcels
      }))
    );
  }
}