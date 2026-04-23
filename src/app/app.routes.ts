import { Routes } from '@angular/router';

export const routes: Routes = [
  // { path: '', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  { path: ''},
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

  { path: '**'}
  // { path: '**', redirectTo: '/admin/dashboard' }
];