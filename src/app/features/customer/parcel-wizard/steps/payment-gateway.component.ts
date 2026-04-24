import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParcelWizardService } from '../../../../core/services/parcel-wizard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-gateway',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2>Payment</h2>
      <p class="subtitle">Select your preferred payment method to finalize your shipment.</p>

      <div class="payment-options">
        <div 
          class="payment-card" 
          [class.selected]="selectedMethod() === 'MTN_MOBILE_MONEY'"
          (click)="selectMethod('MTN_MOBILE_MONEY')"
        >
          <div class="method-icon mtn">M</div>
          <div class="method-info">
            <span class="method-name">MTN Mobile Money</span>
            <span class="method-desc">Pay using your MoMo wallet</span>
          </div>
          <div class="check" *ngIf="selectedMethod() === 'MTN_MOBILE_MONEY'">
            <i class="fas fa-check-circle"></i>
          </div>
        </div>

        <div 
          class="payment-card" 
          [class.selected]="selectedMethod() === 'ORANGE_MONEY'"
          (click)="selectMethod('ORANGE_MONEY')"
        >
          <div class="method-icon orange">O</div>
          <div class="method-info">
            <span class="method-name">Orange Money</span>
            <span class="method-desc">Pay using your OM account</span>
          </div>
          <div class="check" *ngIf="selectedMethod() === 'ORANGE_MONEY'">
            <i class="fas fa-check-circle"></i>
          </div>
        </div>

        <div 
          class="payment-card" 
          [class.selected]="selectedMethod() === 'WALLET'"
          (click)="selectMethod('WALLET')"
        >
          <div class="method-icon wallet">
            <i class="fas fa-wallet"></i>
          </div>
          <div class="method-info">
            <span class="method-name">Personal Wallet</span>
            <span class="method-desc">Use your internal balance</span>
          </div>
          <div class="check" *ngIf="selectedMethod() === 'WALLET'">
            <i class="fas fa-check-circle"></i>
          </div>
        </div>
      </div>

      <div class="payment-summary">
        <div class="summary-row">
          <span>Amount to Pay</span>
          <span class="amount">{{ quote()?.estimatedCost | number }} XAF</span>
        </div>
        <div class="summary-row small">
          <span>Transaction Fee</span>
          <span>Included</span>
        </div>
      </div>

      <button 
        class="btn-pay-now" 
        [disabled]="!selectedMethod() || isProcessing()"
        (click)="processPayment()"
      >
        <span *ngIf="!isProcessing()">Complete Payment & Ship</span>
        <div *ngIf="isProcessing()" class="spinner-small"></div>
      </button>
    </div>
  `,
  styles: [`
    .step-container h2 {
      margin-top: 0;
      font-size: 1.8rem;
      color: #e94560;
    }
    .subtitle {
      opacity: 0.6;
      margin-bottom: 2rem;
    }
    .payment-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .payment-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 1.2rem;
      display: flex;
      align-items: center;
      gap: 1.2rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }
    .payment-card:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(233, 69, 96, 0.3);
    }
    .payment-card.selected {
      background: rgba(233, 69, 96, 0.1);
      border-color: #e94560;
      box-shadow: 0 0 15px rgba(233, 69, 96, 0.1);
    }
    .method-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.5rem;
    }
    .mtn { background: #ffcc00; color: #000; }
    .orange { background: #ff6600; color: #fff; }
    .wallet { background: #4ecca3; color: #1a1a2e; font-size: 1.2rem; }
    
    .method-info {
      display: flex;
      flex-direction: column;
    }
    .method-name {
      font-weight: bold;
      font-size: 1.1rem;
    }
    .method-desc {
      font-size: 0.8rem;
      opacity: 0.5;
    }
    .check {
      position: absolute;
      right: 1.5rem;
      color: #e94560;
      font-size: 1.2rem;
    }
    .payment-summary {
      background: rgba(0, 0, 0, 0.2);
      padding: 1.5rem;
      border-radius: 16px;
      margin-bottom: 2rem;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .summary-row.small {
      margin-top: 0.5rem;
      font-size: 0.8rem;
      opacity: 0.5;
    }
    .amount {
      font-size: 1.5rem;
      font-weight: 800;
      color: #4ecca3;
    }
    .btn-pay-now {
      width: 100%;
      background: #e94560;
      color: white;
      padding: 1.2rem;
      border-radius: 12px;
      font-weight: 800;
      font-size: 1.1rem;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .btn-pay-now:hover:not(:disabled) {
      background: #ff5e78;
      transform: translateY(-2px);
    }
    .btn-pay-now:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .spinner-small {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class PaymentGatewayComponent {
  private wizardService = inject(ParcelWizardService);
  private router = inject(Router);

  quote = () => this.wizardService.state().quote;
  selectedMethod = signal<string | null>(null);
  isProcessing = signal(false);

  selectMethod(method: string) {
    this.selectedMethod.set(method);
  }

  processPayment() {
    this.isProcessing.set(true);
    // Simulate payment processing
    setTimeout(() => {
      this.isProcessing.set(false);
      this.wizardService.reset();
      this.router.navigate(['/customer/dashboard']);
    }, 2500);
  }
}
