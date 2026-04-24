import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminStatsResponse } from '../../core/models/stats';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/stats`;

  getAdminSummary(): Observable<AdminStatsResponse> {
    return this.http.get<AdminStatsResponse>(`${this.apiUrl}/admin/summary`);
  }
}
