import { Injectable, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  CreateParcelDraft,
  DeliveryDetailsFormValue,
  ParcelSummary,
  PaymentMethod,
} from '../../core/models/parcel.model';
import { WalletService } from './wallet.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ParcelService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/parcels`;
  private readonly parcels: ParcelSummary[] = [
    {
      id: '41267981240-DEF1',
      title: 'MacBook Pro M2 (16/512)',
      reference: '#41267981240-DEF1',
      status: 'IN_TRANSIT',
      paymentStatus: 'PAID',
      createdAt: '2026-03-02T10:30:00Z',
      estimatedDeliveryTime: '2026-03-04T16:00:00Z',
      destination: 'Abuja, Nigeria',
    },
    {
      id: '81267981241-ABC9',
      title: 'Office Chair Set',
      reference: '#81267981241-ABC9',
      status: 'WAITING_FOR_AGENT',
      paymentStatus: 'PAID',
      createdAt: '2026-03-03T09:00:00Z',
      estimatedDeliveryTime: '2026-03-06T13:30:00Z',
      destination: 'Port Harcourt, Nigeria',
    },
    {
      id: '91267981242-KLM3',
      title: 'Fashion Package Bundle',
      reference: '#91267981242-KLM3',
      status: 'IN_TRANSIT',
      paymentStatus: 'PAID',
      createdAt: '2026-03-01T12:15:00Z',
      estimatedDeliveryTime: '2026-03-05T11:00:00Z',
      destination: 'Lagos, Nigeria',
    },
  ];

  constructor(private readonly walletService: WalletService) {}

  getCurrentUserParcels(): Observable<ParcelSummary[]> {
    return of(this.parcels).pipe(delay(350));
  }

  calculateParcelPrice(details: DeliveryDetailsFormValue, draft: CreateParcelDraft): number {
    const base = draft.packageSize === 'SMALL' ? 4000 : 15000;
    const weightFactor = Math.max(1, Math.ceil(details.weight / 5));
    const fragilityFactor = 1 + (details.fragility / 10) * 0.2;
    const distanceFactor = this.estimateDistanceFactor(
      details.sourceLatitude,
      details.sourceLongitude,
      details.destinationLatitude,
      details.destinationLongitude,
    );
    return Math.round(base * weightFactor * fragilityFactor * distanceFactor);
  }

  createParcel(
    details: DeliveryDetailsFormValue,
    draft: CreateParcelDraft,
    amount: number,
  ): Observable<ParcelSummary> {
    const id = `PL-${Date.now()}`;
    const parcel: ParcelSummary = {
      id,
      title: `${draft.serviceName} (${draft.quantityLabel})`,
      reference: `#${id}`,
      status: 'WAITING_FOR_AGENT',
      paymentStatus: 'PAID',
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: this.estimateEta(details, draft.deliveryMode),
      destination: details.destinationAgency,
    };

    this.parcels.unshift(parcel);
    return of(parcel).pipe(delay(350));
  }

  simulatePayment(
    method: PaymentMethod,
    amount: number,
  ): Observable<{ success: boolean; method: PaymentMethod; amount: number }> {
    return of({ success: true, method, amount }).pipe(delay(700));
  }

  private estimateDistanceFactor(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const distance = Math.abs(lat1 - lat2) + Math.abs(lon1 - lon2);
    if (distance < 1) return 1;
    if (distance < 5) return 1.15;
    if (distance < 10) return 1.35;
    return 1.6;
  }

  private estimateEta(details: DeliveryDetailsFormValue, mode: string): string {
    const hours = mode === 'INSTANT' ? 24 : 72;
    const eta = new Date();
    eta.setHours(eta.getHours() + hours);
    return eta.toISOString();
  }
}
