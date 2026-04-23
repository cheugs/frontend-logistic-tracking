import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { SendPackageComponent } from './send-package/send-package.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DeliveryDetailsComponent } from './delivery-details/delivery-details.component';
import { PackagesComponent } from './packages/packages.component';
import { TrackParcelComponent } from './track-parcel/track-parcel.component';
import { AccountComponent } from './account/account.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    data: { title: 'Customer Dashboard' }
  },
  {
    path: 'create-parcel',
    component: SendPackageComponent,
    data: { title: 'Create Parcel' }
  },
  {
    path: 'delivery-details',
    component: DeliveryDetailsComponent,
    data: { title: 'Delivery Details' }
  },
  {
    path: 'packages',
    component: PackagesComponent,
    data: { title: 'Packages' }
  },
  {
    path: 'track-parcel',
    component: TrackParcelComponent,
    data: { title: 'Track Parcel' }
  },
  {
    path: 'track-parcel/:id',
    component: TrackParcelComponent,
    data: { title: 'Track Parcel' }
  },
  {
    path: 'account',
    component: AccountComponent,
    data: { title: 'Account' }
  }

];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule {}