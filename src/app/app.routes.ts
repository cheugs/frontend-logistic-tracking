import { Routes } from '@angular/router';

export const routes: Routes = [
 { path: '',
    loadChildren: () => import('./features/landing/landing-module').then(m => m.LandingModule)
  },

 { path: 'onboarding',
    loadChildren: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },

  { path: 'login',
    loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
  },

  { path: 'register',
    loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
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
    path: 'customer',
    loadChildren: () => import('./features/customer/customer-module').then(m => m.CustomerModule)
  },

  { path: '**', redirectTo: '' }
];