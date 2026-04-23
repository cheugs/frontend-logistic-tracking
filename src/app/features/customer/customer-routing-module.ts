import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { SendPackageComponent } from './send-package/send-package.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DeliveryDetailsComponent } from './delivery-details/delivery-details.component';
import { PackagesComponent } from './packages/packages.component';
import { TrackParcelComponent } from './track-parcel/track-parcel.component';
import { AccountComponent } from './account/account.component';

export const routes: Routes = [
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule {}