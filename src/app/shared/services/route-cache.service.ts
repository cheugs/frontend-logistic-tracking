import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RouteCache } from '../../core/models/route';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RouteCacheService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/routes`;

  getAllRoutes(): Observable<RouteCache[]> {
    return this.http.get<RouteCache[]>(this.apiUrl);
  }

  getRouteById(id: string): Observable<RouteCache> {
    return this.http.get<RouteCache>(`${this.apiUrl}/${id}`);
  }
}
