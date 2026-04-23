import { Routes } from '@angular/router';

import { OnboardingComponent } from './features/onboarding/onboarding.component';

export const routes: Routes = [
  { path: '', redirectTo: '/onboarding', pathMatch: 'full' },
  { path: 'onboarding', component: OnboardingComponent },
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

  { path: '**', redirectTo: '/onboarding' }
];