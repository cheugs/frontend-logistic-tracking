import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { ParcelSummary, ParcelStatus } from '../models/parcel.model';

@Injectable({
  providedIn: 'root',
})
export class ParcelAdminService {
  private readonly api = inject(Api);

  getAllParcels(): Observable<ParcelSummary[]> {
    return this.api.get<ParcelSummary[]>('/logistics/api/v1/parcels');
  }

  getParcelsByStatus(status: ParcelStatus): Observable<ParcelSummary[]> {
    return this.api.get<ParcelSummary[]>(`/logistics/api/v1/parcels/status/${status}`);
  }

  cancelParcel(parcelId: string): Observable<void> {
    return this.api.post<void>(`/logistics/api/v1/parcels/${parcelId}/cancel`, {});
  }
}
