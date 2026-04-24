import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentResponse, PayRequest } from '../../core/models/payment';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/payments`;

  getPaymentById(paymentId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/${paymentId}`);
  }

  getPaymentByParcelId(parcelId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/parcel/${parcelId}`);
  }

  getPaymentsByUserId(userId: string): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/user/${userId}`);
  }

  pay(paymentId: string, request: PayRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/${paymentId}/pay`, request);
  }
}
