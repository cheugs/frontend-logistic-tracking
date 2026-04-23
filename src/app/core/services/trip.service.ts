import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { TripResponse, TripStatus } from '../models/trip.model';

import { AgentStats } from '../models/agent-stats.model';
import { TripRequest, AvailableParcelResponse } from '../models/trip.model';

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private readonly api = inject(Api);

  getAgentTrips(agentId: string, status?: TripStatus): Observable<TripResponse[]> {
    const params: any = {};
    if (status) params.status = status;
    return this.api.get<TripResponse[]>(`/logistics/api/v1/trips/agent/${agentId}`, params);
  }

  getAgentStats(agentId: string): Observable<AgentStats> {
    return this.api.get<AgentStats>(`/logistics/api/v1/trips/agent/${agentId}/summary`);
  }

  createTrip(request: TripRequest): Observable<TripResponse> {
    return this.api.post<TripResponse>('/logistics/api/v1/trips', request);
  }

  getAvailableParcels(tripId: string): Observable<AvailableParcelResponse[]> {
    return this.api.get<AvailableParcelResponse[]>(`/logistics/api/v1/trips/${tripId}/available-parcels`);
  }

  assignParcels(tripId: string, parcelIds: string[]): Observable<void> {
    return this.api.post<void>(`/logistics/api/v1/trips/${tripId}/parcels`, parcelIds);
  }

  startTrip(tripId: string): Observable<TripResponse> {
    return this.api.post<TripResponse>(`/logistics/api/v1/trips/${tripId}/start`, {});
  }

  reachSegment(tripId: string, segmentId: string): Observable<TripResponse> {
    return this.api.post<TripResponse>(`/logistics/api/v1/trips/${tripId}/segments/${segmentId}/reach`, {});
  }
}
