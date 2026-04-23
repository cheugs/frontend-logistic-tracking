import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Agency {
  id: string;
  name: string;
  country: string;
  town: string;
  addressLine: string;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgencyService {
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/agencies`;

  constructor(private http: HttpClient) {}

  getAllAgencies(): Observable<Agency[]> {
    return this.http.get<Agency[]>(this.apiUrl);
  }

  getAgencyById(id: string): Observable<Agency> {
    return this.http.get<Agency>(`${this.apiUrl}/${id}`);
  }
}
