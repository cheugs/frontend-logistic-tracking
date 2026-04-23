import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CreateParcelDraft, DeliveryDetailsFormValue, PaymentMethod } from '../../../core/models/parcel.model';
import { ParcelService } from '../../../shared/services/parcel.service';
import { WalletService } from '../../../shared/services/wallet.service';

@Component({
  selector: 'app-delivery-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './delivery-details.component.html',
  styleUrls: ['./delivery-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryDetailsComponent implements OnInit {
  protected readonly currentStep = signal<'DETAILS' | 'PAYMENT'>('DETAILS');
  protected readonly paymentMethods: { id: PaymentMethod; label: string; subtitle: string }[] = [
    { id: 'MTN_MOBILE_MONEY', label: 'MTN Mobile Money', subtitle: 'Pay with your MTN MoMo wallet' },
    { id: 'ORANGE_MONEY', label: 'Orange Money', subtitle: 'Pay with your Orange Money account' },
    { id: 'WALLET', label: 'Wallet Balance', subtitle: 'Use your available in-app balance' }
  ];
  protected readonly selectedPayment = signal<PaymentMethod>('MTN_MOBILE_MONEY');
  protected readonly computedAmount = signal(0);
  protected readonly statusMessage = signal('');
  protected readonly loadingPayment = signal(false);
  protected readonly topUpEnough = signal(true);

  private readonly draft: CreateParcelDraft = history.state?.deliveryMode
    ? {
        deliveryMode: history.state.deliveryMode,
        packageSize: history.state.packageSize,
        serviceName: history.state.packageSize === 'SMALL' ? 'Small Delivery' : 'Large Delivery',
        quantityLabel: history.state.packageSize === 'SMALL' ? '1 - 5KG' : '6 - 10KG',
        amount: history.state.packageSize === 'SMALL' ? 4000 : 15000,
        estimatedDuration: history.state.deliveryMode === 'INSTANT' ? '1 Day shipping' : 'Scheduled shipping'
      }
    : {
        deliveryMode: 'INSTANT',
        packageSize: 'SMALL',
        serviceName: 'Small Delivery',
        quantityLabel: '1 - 5KG',
        amount: 4000,
        estimatedDuration: '1 Day shipping'
      };

  protected readonly detailsForm = this.fb.nonNullable.group({
    sourceAgency: ['Lagos Warehouse', Validators.required],
    sourceLatitude: [6.5244, Validators.required],
    sourceLongitude: [3.3792, Validators.required],
    destinationAgency: ['Abuja Hub', Validators.required],
    destinationLatitude: [9.0579, Validators.required],
    destinationLongitude: [7.4951, Validators.required],
    receiverName: [''],
    receiverPhone: [''],
    receiverAddress: [''],
    weight: [1, [Validators.required, Validators.min(0.1)]],
    fragility: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
    status: ['PENDING' as const, Validators.required],
    landmark: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly parcelService: ParcelService,
    private readonly walletService: WalletService
  ) {}

  ngOnInit(): void {
    this.computedAmount.set(this.parcelService.calculateParcelPrice(this.detailsForm.getRawValue(), this.draft));
  }

  protected recalculateAmount(): void {
    this.computedAmount.set(this.parcelService.calculateParcelPrice(this.detailsForm.getRawValue(), this.draft));
  }

  protected selectPayment(method: PaymentMethod): void {
    this.selectedPayment.set(method);
  }

  protected proceedToPayment(): void {
    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      return;
    }
    this.currentStep.set('PAYMENT');
    this.recalculateAmount();
  }

  protected backToDetails(): void {
    this.currentStep.set('DETAILS');
  }

  protected confirmPayment(): void {
    if (this.loadingPayment()) return;
    if (this.selectedPayment() === 'WALLET') {
      const walletEnough = true;
      this.topUpEnough.set(walletEnough);
    }

    const amount = this.computedAmount();
    const method = this.selectedPayment();
    this.loadingPayment.set(true);
    this.statusMessage.set('');

    this.parcelService.simulatePayment(method, amount).subscribe({
      next: () => {
        if (method !== 'WALLET') {
          this.walletService.deductBalance(amount).subscribe({
            next: () => this.finishParcel()
          });
        } else {
          this.finishParcel();
        }
      },
      error: () => {
        this.loadingPayment.set(false);
        this.statusMessage.set('Payment failed. Please try again.');
      }
    });
  }

  private finishParcel(): void {
    const details = this.detailsForm.getRawValue() as DeliveryDetailsFormValue;
    this.parcelService.createParcel(details, this.draft, this.computedAmount()).subscribe({
      next: () => {
        this.loadingPayment.set(false);
        this.statusMessage.set('Payment successful and parcel created.');
        setTimeout(() => this.router.navigate(['/customer/dashboard']), 1200);
      }
    });
  }

  protected formatCurrency(amount: number): string {
    return this.walletService.formatCurrency(amount, 'XAF');
  }
}