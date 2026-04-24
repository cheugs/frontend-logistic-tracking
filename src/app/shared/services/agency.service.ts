import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Agency, AgencyRequest, CoordinatesResponse } from '../../core/models/agency';
export { Agency, AgencyRequest, CoordinatesResponse };
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AgencyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/agencies`;

  createAgency(request: AgencyRequest): Observable<Agency> {
    return this.http.post<Agency>(this.apiUrl, request);
  }

  getAllAgencies(): Observable<Agency[]> {
    return this.http.get<Agency[]>(this.apiUrl);
  }

  getAgencyById(id: string): Observable<Agency> {
    return this.http.get<Agency>(`${this.apiUrl}/${id}`);
  }

  getAgencyCoordinates(id: string): Observable<CoordinatesResponse> {
    return this.http.get<CoordinatesResponse>(`${this.apiUrl}/${id}/coordinates`);
  }
}
