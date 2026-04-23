import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';
import { UserRole } from '../models/auth.models';

export const roleGuard = (allowed: UserRole[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const storage = inject(TokenStorageService);
    const user = storage.getUser();

    if (!user) {
      return router.createUrlTree(['/login']);
    }

    return allowed.includes(user.role)
      ? true
      : router.createUrlTree([defaultRoute(user.role)]);
  };
};

function defaultRoute(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'DELIVERY_AGENT':
      return '/agent/dashboard';
    default:
      return '/customer/dashboard';
  }
}