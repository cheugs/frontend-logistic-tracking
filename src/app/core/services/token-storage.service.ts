import { Injectable } from '@angular/core';
import { UserResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly tokenKey = 'logistics_token';
  private readonly userKey = 'logistics_user';

  save(token: string, user: UserResponse): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): UserResponse | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }

  clear(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }
}