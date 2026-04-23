import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, Observable, map, of } from 'rxjs';
import { ParcelRoute } from '../../core/models/track-parcel.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TrackParcelService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/parcels`;
  private readonly parcels: ParcelRoute[] = [
    {
      id: '41267981240-DEF1',
      title: 'Macbook pro M2 (16/512) Space...',
      reference: '#41267981240-DEF1',
      status: 'IN_TRANSIT',
      createdAt: '2026-03-02T10:30:00Z',
      source: { label: 'Lagos', latitude: 6.5244, longitude: 3.3792 },
      destination: { label: 'Abuja', latitude: 9.0579, longitude: 7.4951 },
      current: { label: 'Lokoja', latitude: 7.8024, longitude: 6.7409 },
      progress: 58,
    },
    {
      id: '51267981240-DEF2',
      title: 'Nike Air Force 1 Sneakers Limited...',
      reference: '#51267981240-DEF2',
      status: 'IN_TRANSIT',
      createdAt: '2026-03-03T09:00:00Z',
      source: { label: 'Port Harcourt', latitude: 4.8156, longitude: 7.0498 },
      destination: { label: 'Lagos', latitude: 6.5244, longitude: 3.3792 },
      current: { label: 'Benin City', latitude: 6.3382, longitude: 5.6258 },
      progress: 44,
    },
    {
      id: '61267981240-DEF3',
      title: 'Clothing Package (T-Shirts & ...',
      reference: '#61267981240-DEF3',
      status: 'DELIVERED',
      createdAt: '2026-02-28T15:25:00Z',
      source: { label: 'Ibadan', latitude: 7.3775, longitude: 3.947 },
      destination: { label: 'Enugu', latitude: 6.5244, longitude: 7.5103 },
      current: { label: 'Delivered', latitude: 6.5244, longitude: 7.5103 },
      progress: 100,
    },
  ];

  getRoute(parcelId?: string): Observable<ParcelRoute[]> {
    if (!parcelId) return of(this.parcels).pipe(delay(250));
    return of(this.parcels.filter((p) => p.id === parcelId)).pipe(delay(250));
  }

  // getRoute(parcelId?: string): Observable<ParcelRoute[]> {
  //   if (!parcelId) return of([]);

  //   return this.http.get<any>(`${this.apiUrl}/${parcelId}`).pipe(
  //     map((parcel) => {
  //       // Compute progress percentage based on backend ParcelStatus enum
  //       let progress = 20;
  //       if (parcel.status === 'IN_TRANSIT') progress = 60;
  //       if (parcel.status === 'DELIVERED') progress = 100;

  //       return [
  //         {
  //           id: parcel.parcelId,
  //           status: parcel.status,
  //           title: 'Package Tracking',
  //           reference: parcel.parcelId,
  //           createdAt: parcel.createdAt,
  //           progress: progress,
  //           source: { label: parcel.sourceAgency || 'Source Point' },
  //           destination: { label: parcel.destinationAgency || 'Destination Point' },
  //           current: { label: parcel.currentLocation || 'In Transit' },
  //         },
  //       ];
  //     }),
  //   );
  // }
}
