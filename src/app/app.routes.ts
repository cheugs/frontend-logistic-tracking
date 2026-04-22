import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/agent/dashboard', pathMatch: 'full' },
  { 
    path: 'admin', 
    loadChildren: () => import('./features/admin/admin-module').then(m => m.AdminModule)
  },
  { 
    path: 'agent', 
    loadChildren: () => import('./features/agent/agent-module').then(m => m.AgentModule)
  },
  { path: '**', redirectTo: '/agent/dashboard' }
];