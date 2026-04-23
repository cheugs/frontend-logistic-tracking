import {NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerRoutingModule } from './customer-routing-module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SendPackageComponent } from './send-package/send-package.component';
import { DeliveryDetailsComponent } from './delivery-details/delivery-details.component';
import { PackagesComponent } from './packages/packages.component';
import { TrackParcelComponent } from './track-parcel/track-parcel.component';
import { AccountComponent } from './account/account.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    CustomerRoutingModule
  ],
    exports: [
  ]
})
export class CustomerModule { }