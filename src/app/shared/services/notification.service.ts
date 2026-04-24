import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification, UnreadCountResponse, TokenRegistrationRequest } from '../../core/models/notification';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/notifications`;

  getNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/${userId}`);
  }

  getUnreadCount(userId: string): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/${userId}/unread-count`);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(userId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${userId}/read-all`, {});
  }

  registerToken(request: TokenRegistrationRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/register-token`, request);
  }
}
