import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { CustomerDashboardService } from '../../../shared/services/customer-dashboard.service';
import { WalletService } from '../../../shared/services/wallet.service';
import { CustomerDashboardData } from '../../../core/models/customer-dashboard.model';
import { ParcelSummary } from '../../../core/models/parcel.model';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly toppingUp = signal(false);
  protected readonly showBalance = signal(true);
  protected readonly topUpMessage = signal('');
  protected readonly dashboard = signal<CustomerDashboardData | null>(null);

  protected readonly topUpForm = this.fb.nonNullable.group({
    amount: [1000, [Validators.required, Validators.min(100)]]
  });

  protected readonly trackForm = this.fb.nonNullable.group({
    parcelId: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly activeParcels = computed<ParcelSummary[]>(() => this.dashboard()?.activeParcels ?? []);
  protected readonly walletDisplay = computed(() => {
    const wallet = this.dashboard()?.wallet;
    if (!wallet) return '';
    return this.showBalance() ? this.walletService.formatCurrency(wallet.balance, wallet.currency) : '••••••';
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly dashboardService: CustomerDashboardService,
    private readonly walletService: WalletService
  ) {}



  ngOnInit(): void {
    this.loadDashboard();
  }

  protected loadDashboard(): void {
    this.loading.set(true);
    this.dashboardService.getDashboardData()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.dashboard.set(data)
      });
  }

  protected toggleBalance(): void {
    this.showBalance.update(value => !value);
  }

  protected submitTopUp(): void {
    if (this.topUpForm.invalid || !this.dashboard()) {
      this.topUpForm.markAllAsTouched();
      return;
    }

    this.toppingUp.set(true);
    this.topUpMessage.set('');

    this.walletService.topUpWallet({ amount: this.topUpForm.getRawValue().amount })
      .pipe(finalize(() => this.toppingUp.set(false)))
      .subscribe({
        next: (wallet) => {
          this.dashboard.update(current => current ? ({ ...current, wallet }) : current);
          this.topUpMessage.set(`Wallet funded successfully with ${this.walletService.formatCurrency(this.topUpForm.getRawValue().amount, wallet.currency)}.`);
          this.topUpForm.patchValue({ amount: 1000 });
        }
      });
  }

  protected submitTracking(): void {
    if (this.trackForm.invalid) {
      this.trackForm.markAllAsTouched();
      return;
    }

    const parcelId = this.trackForm.getRawValue().parcelId.trim();
  if (parcelId) {
    this.router.navigate(['/customer/track-parcel', parcelId]);
  } else {
    this.router.navigate(['/customer/track-parcel']);
  }
  }

  protected goToCreateParcel(): void {
    this.router.navigate(['/customer/create-parcel']);
  }

  protected viewParcel(parcel: ParcelSummary): void {
    this.router.navigate(['/customer/track-parcel', parcel.id]);
  }

  protected formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }

  protected trackByParcelId(_index: number, item: ParcelSummary): string {
    return item.id;
  }
}