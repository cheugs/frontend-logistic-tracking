import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { CustomerDashboardData } from '../../core/models/customer-dashboard.model';
import { ParcelService } from './parcel.service';
import { WalletService } from './wallet.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerDashboardService {
  constructor(
    private readonly walletService: WalletService,
    private readonly parcelService: ParcelService
  ) {}

  getDashboardData(): Observable<CustomerDashboardData> {
    return forkJoin({
      wallet: this.walletService.getWalletSummary(),
      activeParcels: this.parcelService.getCurrentUserParcels()
    }).pipe(
      map(({ wallet, activeParcels }) => ({
        profile: {
          firstName: 'Ahmad Amine',
          fullName: 'Mfone Ahmad Amine',
          city: 'Yaounde',
          state: 'Centre'
        },
        wallet,
        activeParcels
      }))
    );
  }
}