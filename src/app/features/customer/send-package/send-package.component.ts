import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CreateParcelDraft } from '../../../core/models/parcel.model';

@Component({
  selector: 'app-send-package', 
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-parcel.html',
  styleUrls: ['./create-parcel.scss']
})
export class SendPackageComponent implements OnInit {
  protected readonly selectedMode = signal<'INSTANT' | 'SCHEDULED'>('INSTANT');
  protected readonly selectedPackage = signal<'SMALL' | 'LARGE'>('SMALL');

  protected readonly packageOptions: CreateParcelDraft[] = [
    {
      deliveryMode: 'INSTANT',
      packageSize: 'SMALL',
      serviceName: 'Small Delivery',
      quantityLabel: '1 Day shipping',
      amount: 4000,
      estimatedDuration: '1 Day shipping'
    },
    {
      deliveryMode: 'INSTANT',
      packageSize: 'LARGE',
      serviceName: 'Large Delivery',
      quantityLabel: '2 - 3 Days shipping',
      amount: 15000,
      estimatedDuration: '2 - 3 Days shipping'
    }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.applyPackage(this.packageOptions[0]);
  }

  protected selectMode(mode: 'INSTANT' | 'SCHEDULED'): void {
    this.selectedMode.set(mode);
  }

  protected applyPackage(option: CreateParcelDraft): void {
    this.selectedMode.set(option.deliveryMode);
    this.selectedPackage.set(option.packageSize);
  }

  protected choosePackage(size: 'SMALL' | 'LARGE'): void {
    this.selectedPackage.set(size);
  }

  protected proceedToDetails(): void {
    const draft = {
      deliveryMode: this.selectedMode(),
      packageSize: this.selectedPackage()
    };
    this.router.navigate(['/customer/delivery-details'], { state: draft });
  }
}