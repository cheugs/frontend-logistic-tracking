import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, delay } from 'rxjs';
import {
  ParcelSummary,
  ParcelQuoteRequest,
  ParcelQuoteResponse,
  ParcelRequest,
  ParcelResponse,
  ParcelStatus,
  DeliveryDetailsFormValue,
  CreateParcelDraft,
  PaymentMethod
} from '../../core/models/parcel.model';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ParcelService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/parcels`;

  getAllParcels(): Observable<ParcelResponse[]> {
    return this.http.get<ParcelResponse[]>(this.apiUrl);
  }

  createParcel(
    details: DeliveryDetailsFormValue,
    draft: CreateParcelDraft,
    amount: number
  ): Observable<ParcelResponse> {
    const user = this.authService.currentUser();
    const request: ParcelRequest = {
      userId: user?.userId || '',
      sourceAgencyId: details.sourceAgency,
      destAgencyId: details.destinationAgency,
      weight: details.weight,
      fragility: details.fragility,
      receiverName: details.receiverName,
      receiverPhone: details.receiverPhone
    };
    return this.http.post<ParcelResponse>(this.apiUrl, request);
  }

  getParcelById(parcelId: string): Observable<ParcelResponse> {
    return this.http.get<ParcelResponse>(`${this.apiUrl}/${parcelId}`);
  }

  getParcelsByUserId(userId: string): Observable<ParcelResponse[]> {
    return this.http.get<ParcelResponse[]>(`${this.apiUrl}/user/${userId}`);
  }

  getCurrentUserParcels(): Observable<ParcelSummary[]> {
    const user = this.authService.currentUser();
    if (!user) return of([]);

    return this.getParcelsByUserId(user.userId).pipe(
      map(parcels => parcels.map(p => ({
        id: p.id,
        title: `Parcel to ${p.receiverName}`,
        reference: p.id,
        status: p.status,
        paymentStatus: 'PAID',
        createdAt: p.createdAt,
        estimatedDeliveryTime: p.estimatedDeliveryTime,
        destination: p.destAgencyName
      })))
    );
  }

  getParcelsByStatus(status: ParcelStatus): Observable<ParcelResponse[]> {
    return this.http.get<ParcelResponse[]>(`${this.apiUrl}/status/${status}`);
  }

  getParcelOwner(parcelId: string): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/${parcelId}/owner`);
  }

  getAvailableParcels(sourceAgencyId: string, destAgencyId: string): Observable<ParcelResponse[]> {
    return this.http.get<ParcelResponse[]>(`${this.apiUrl}/available`, {
      params: { sourceAgencyId, destAgencyId }
    });
  }

  getQuote(request: ParcelQuoteRequest): Observable<ParcelQuoteResponse> {
    return this.http.post<ParcelQuoteResponse>(`${this.apiUrl}/quote`, request);
  }

  cancelParcel(parcelId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${parcelId}/cancel`, {});
  }

  calculateParcelPrice(details: DeliveryDetailsFormValue, draft: CreateParcelDraft): number {
    const base = draft.packageSize === 'SMALL' ? 4000 : 15000;
    const weightFactor = Math.max(1, Math.ceil(details.weight / 5));
    const fragilityFactor = 1 + (details.fragility / 10) * 0.2;
    // Simple estimation since we don't have lat/long for all agencies easily here
    return Math.round(base * weightFactor * fragilityFactor);
  }

  simulatePayment(
    method: PaymentMethod,
    amount: number,
  ): Observable<{ success: boolean; method: PaymentMethod; amount: number }> {
    return of({ success: true, method, amount }).pipe(delay(700));
  }
}
