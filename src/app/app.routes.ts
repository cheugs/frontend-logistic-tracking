import { Routes } from '@angular/router';
import { authGuard } from "./core/guards/auth-guard";

import { OnboardingComponent } from './features/onboarding/onboarding.component';

export const routes: Routes = [

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'landing'
  },
 { path: 'landing',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },

 { path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },

  { path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },

  { path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },

  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin-module').then(m => m.AdminModule)
  },
  {
    path: 'agent',
    loadChildren: () => import('./features/agent/agent-module').then(m => m.AgentModule)
  },
  {
    path: 'customer/dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'customer/create-parcel',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/send-package/send-package.component').then(m => m.SendPackageComponent)
  },
  {
    path: 'customer/delivery-details',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/delivery-details/delivery-details.component').then(m => m.DeliveryDetailsComponent)
  },
  {
    path: 'customer/packages',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/packages/packages.component').then(m => m.PackagesComponent)
  },
  {
    path: 'customer/track-parcel',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/track-parcel/track-parcel.component').then(m => m.TrackParcelComponent)
  },
  {
    path: 'customer/track-parcel/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/track-parcel/track-parcel.component').then(m => m.TrackParcelComponent)
  },
  {
    path: 'customer/account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/account/account.component').then(m => m.AccountComponent)
  },

  { path: '**', redirectTo: '/onboarding' }
];
