import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, Observable, map, of } from 'rxjs';
import { ParcelRoute } from '../../core/models/track-parcel.model';
import { ParcelResponse } from '../../core/models/parcel.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TrackParcelService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/parcels`;

  getRoute(parcelId?: string): Observable<ParcelRoute[]> {
    if (!parcelId) return of([]);

    return this.http.get<ParcelResponse>(`${this.apiUrl}/${parcelId}`).pipe(
      map((parcel) => {
        // Compute progress percentage based on backend ParcelStatus enum
        let progress = 20;
        if (parcel.status === 'IN_TRANSIT') progress = 60;
        if (parcel.status === 'DELIVERED') progress = 100;

        return [
          {
            id: parcel.id,
            status: parcel.status,
            title: `Parcel to ${parcel.receiverName}`,
            reference: parcel.id,
            createdAt: parcel.createdAt,
            progress: progress,
            source: { 
              label: parcel.sourceAgencyName || 'Source Point', 
              latitude: parcel.sourceLatitude || 0, 
              longitude: parcel.sourceLongitude || 0 
            },
            destination: { 
              label: parcel.destAgencyName || 'Destination Point', 
              latitude: parcel.destLatitude || 0, 
              longitude: parcel.destLongitude || 0 
            },
            current: { 
              label: parcel.status === 'DELIVERED' ? 'Delivered' : 'In Transit',
              latitude: parcel.status === 'DELIVERED' ? (parcel.destLatitude || 0) : (parcel.sourceLatitude || 0),
              longitude: parcel.status === 'DELIVERED' ? (parcel.destLongitude || 0) : (parcel.sourceLongitude || 0)
            },
          },
        ];
      }),
    );
  }
}
