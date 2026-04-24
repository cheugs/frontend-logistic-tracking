import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TripResponse, TripRequest, AvailableParcelResponse, TripStatus } from '../../core/models/trip.model';
import { AgentStats } from '../../core/models/agent-stats.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/trips`;

  createTrip(request: TripRequest): Observable<TripResponse> {
    return this.http.post<TripResponse>(this.apiUrl, request);
  }

  getTrip(tripId: string): Observable<TripResponse> {
    return this.http.get<TripResponse>(`${this.apiUrl}/${tripId}`);
  }

  getAvailableParcels(tripId: string): Observable<AvailableParcelResponse[]> {
    return this.http.get<AvailableParcelResponse[]>(`${this.apiUrl}/${tripId}/available-parcels`);
  }

  assignParcels(tripId: string, parcelIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tripId}/parcels`, parcelIds);
  }

  startTrip(tripId: string): Observable<TripResponse> {
    return this.http.post<TripResponse>(`${this.apiUrl}/${tripId}/start`, {});
  }

  markSegmentReached(tripId: string, segmentId: string): Observable<TripResponse> {
    return this.http.post<TripResponse>(`${this.apiUrl}/${tripId}/segments/${segmentId}/reach`, {});
  }

  getAgentTrips(agentId: string, status?: TripStatus): Observable<TripResponse[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<TripResponse[]>(`${this.apiUrl}/agent/${agentId}`, { params });
  }

  getAgentSummary(agentId: string): Observable<AgentStats> {
    return this.http.get<AgentStats>(`${this.apiUrl}/agent/${agentId}/summary`);
  }
}
