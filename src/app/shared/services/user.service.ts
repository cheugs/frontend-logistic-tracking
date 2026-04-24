import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  User, 
  UserContactResponse, 
  UpdateUserRequest, 
  ChangePasswordRequest, 
  VerificationStatus 
} from '../../core/models/user';
import { UserRole } from '../../core/models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logistics/api/v1/users`;

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  getUserContact(userId: string): Observable<UserContactResponse> {
    return this.http.get<UserContactResponse>(`${this.apiUrl}/${userId}/contact`);
  }

  updateUser(userId: string, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}`, request);
  }

  changePassword(userId: string, request: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${userId}/password`, request);
  }

  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${userId}`);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUsersByRole(role: UserRole): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/role/${role}`);
  }

  verifyUser(userId: string, status: VerificationStatus): Observable<{ message: string }> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${userId}/verify`, null, { params });
  }
}
