import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParcelWizardService } from '../../../../core/services/parcel-wizard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-review-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2>Final Review</h2>
      <p class="subtitle">Please confirm the details before proceeding to payment.</p>

      <div class="review-grid">
        <div class="review-section">
          <h3><i class="fas fa-map-marker-alt"></i> Route</h3>
          <div class="info-row">
            <span class="label">From:</span>
            <span class="val">{{ state().quote?.sourceAgencyName }}</span>
          </div>
          <div class="info-row">
            <span class="label">To:</span>
            <span class="val">{{ state().quote?.destAgencyName }}</span>
          </div>
        </div>

        <div class="review-section">
          <h3><i class="fas fa-user"></i> Receiver</h3>
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="val">{{ state().receiverName }}</span>
          </div>
          <div class="info-row">
            <span class="label">Phone:</span>
            <span class="val">{{ state().receiverPhone }}</span>
          </div>
        </div>

        <div class="review-section">
          <h3><i class="fas fa-box"></i> Package</h3>
          <div class="info-row">
            <span class="label">Weight:</span>
            <span class="val">{{ state().weight }} kg</span>
          </div>
          <div class="info-row">
            <span class="label">Fragility:</span>
            <span class="val">{{ state().fragility }}/10</span>
          </div>
        </div>
      </div>

      <div class="confirm-box">
        <button class="btn-pay" (click)="onConfirm()">
          Pay {{ state().quote?.estimatedCost | number }} XAF & Create Parcel
        </button>
      </div>
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
    .review-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .review-section {
      background: rgba(255, 255, 255, 0.05);
      padding: 1.5rem;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .review-section h3 {
      font-size: 1rem;
      margin-top: 0;
      margin-bottom: 1rem;
      color: #e94560;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .info-row .label {
      opacity: 0.5;
    }
    .info-row .val {
      font-weight: bold;
    }
    .confirm-box {
      margin-top: 3rem;
    }
    .btn-pay {
      width: 100%;
      background: #4ecca3;
      color: #1a1a2e;
      padding: 1.2rem;
      border-radius: 12px;
      font-weight: 800;
      font-size: 1.1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(78, 204, 163, 0.3);
    }
    .btn-pay:hover {
      background: #45b691;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(78, 204, 163, 0.4);
    }
  `]
})
export class ReviewConfirmComponent {
  wizardService = inject(ParcelWizardService);
  router = inject(Router);
  state = this.wizardService.state;

  onConfirm() {
    this.wizardService.nextStep();
  }
}
