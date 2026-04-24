import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AuthRequest,
  AuthResponse,
  SignupRequest,
  UserRole,
  UserResponse,
} from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly baseUrl = `${environment.apiUrl}/logistics/auth`;

  login(payload: AuthRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(tap((res) => this.storage.save(res.token, res.user)));
  }

  register(payload: SignupRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, payload)
      .pipe(tap((res) => this.storage.save(res.token, res.user)));
  }

  logout(): void {
    this.storage.clear();
  }

  currentUser(): UserResponse | null {
    return this.storage.getUser();
  }

  token(): string | null {
    return this.storage.getToken();
  }

  isAuthenticated(): boolean {
    return this.storage.hasToken();
  }

  role(): UserRole | null {
    return this.storage.getUser()?.role ?? null;
  }
}
