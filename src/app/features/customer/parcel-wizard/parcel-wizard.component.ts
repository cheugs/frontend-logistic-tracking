import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParcelWizardService } from '../../../core/services/parcel-wizard.service';
import { AgencySelectorComponent } from './steps/agency-selector.component';
import { ParcelSpecsComponent } from './steps/parcel-specs.component';
import { QuoteSummaryComponent } from './steps/quote-summary.component';
import { ReviewConfirmComponent } from './steps/review-confirm.component';
import { PaymentGatewayComponent } from './steps/payment-gateway.component';

@Component({
  selector: 'app-parcel-wizard',
  standalone: true,
  imports: [
    CommonModule, 
    AgencySelectorComponent, 
    ParcelSpecsComponent, 
    QuoteSummaryComponent, 
    ReviewConfirmComponent,
    PaymentGatewayComponent
  ],
  template: `
    <div class="wizard-container">
      <!-- Progress Bar -->
      <div class="progress-stepper">
        <div 
          *ngFor="let s of [1, 2, 3, 4, 5]" 
          class="step-indicator" 
          [class.active]="currentStep() >= s"
          [class.completed]="currentStep() > s"
        >
          <span class="step-num">{{ s }}</span>
          <span class="step-label">{{ getStepLabel(s) }}</span>
        </div>
        <div class="progress-line">
          <div class="progress-fill" [style.width.%]="(currentStep() - 1) * 25"></div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="step-content glass-card">
        <app-agency-selector *ngIf="currentStep() === 1"></app-agency-selector>
        <app-parcel-specs *ngIf="currentStep() === 2"></app-parcel-specs>
        <app-quote-summary *ngIf="currentStep() === 3"></app-quote-summary>
        <app-review-confirm *ngIf="currentStep() === 4"></app-review-confirm>
        <app-payment-gateway *ngIf="currentStep() === 5"></app-payment-gateway>
      </div>

      <!-- Navigation -->
      <div class="wizard-actions">
        <button 
          *ngIf="currentStep() > 1 && currentStep() < 5" 
          class="btn-secondary" 
          (click)="wizardService.prevStep()"
        >
          Back
        </button>
        <button 
          *ngIf="currentStep() < 4" 
          class="btn-primary" 
          [disabled]="!canProceed()"
          (click)="handleNext()"
        >
          {{ currentStep() === 3 ? 'Review Shipment' : 'Continue' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .wizard-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      min-height: 100vh;
      background: radial-gradient(circle at top right, #1a1a2e, #16213e);
      color: white;
    }

    .progress-stepper {
      display: flex;
      justify-content: space-between;
      position: relative;
      margin-bottom: 3rem;
    }

    .step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 2;
      transition: all 0.3s ease;
    }

    .step-num {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #0f3460;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 2px solid transparent;
      margin-bottom: 0.5rem;
    }

    .active .step-num {
      background: #e94560;
      box-shadow: 0 0 15px rgba(233, 69, 96, 0.5);
      border-color: white;
    }

    .completed .step-num {
      background: #4ecca3;
    }

    .step-label {
      font-size: 0.8rem;
      opacity: 0.6;
    }

    .active .step-label {
      opacity: 1;
      font-weight: bold;
    }

    .progress-line {
      position: absolute;
      top: 20px;
      left: 5%;
      right: 5%;
      height: 2px;
      background: #0f3460;
      z-index: 1;
    }

    .progress-fill {
      height: 100%;
      background: #e94560;
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 2rem;
      min-height: 400px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }

    .wizard-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    button {
      padding: 0.8rem 2rem;
      border-radius: 12px;
      border: none;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #e94560;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #ff5e78;
      transform: translateY(-2px);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: transparent;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParcelWizardComponent {
  wizardService = inject(ParcelWizardService);
  currentStep = this.wizardService.currentStep;

  getStepLabel(step: number): string {
    const labels = ['Route', 'Details', 'Quote', 'Review', 'Payment'];
    return labels[step - 1];
  }

  canProceed(): boolean {
    const s = this.wizardService.state();
    if (this.currentStep() === 1) return !!s.sourceAgencyId && !!s.destAgencyId;
    if (this.currentStep() === 2) return !!s.receiverName && !!s.receiverPhone && s.weight > 0;
    if (this.currentStep() === 3) return !!s.quote;
    return true;
  }

  handleNext() {
    if (this.currentStep() === 2) {
      this.wizardService.fetchQuote();
    }
    this.wizardService.nextStep();
  }
}
