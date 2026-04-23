import { ParcelSummary } from './parcel.model';
import { WalletSummary } from './wallet.model';

export interface CustomerProfileSummary {
  firstName: string;
  fullName: string;
  city: string;
  state: string;
  avatarUrl?: string;
}

export interface CustomerDashboardData {
  profile: CustomerProfileSummary;
  wallet: WalletSummary;
  activeParcels: ParcelSummary[];
}