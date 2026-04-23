import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParcelWizardService } from '../../../../core/services/parcel-wizard.service';

@Component({
  selector: 'app-quote-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container" *ngIf="quote(); else loading">
      <h2>Price Quote & ETA</h2>
      <p class="subtitle">Based on your selection, here is the estimate.</p>

      <div class="quote-card">
        <div class="price-display">
          <span class="label">Total Amount</span>
          <span class="amount">{{ quote()?.estimatedCost | number }} XAF</span>
        </div>

        <div class="details-grid">
          <div class="detail-item">
            <i class="fas fa-route"></i>
            <div class="text">
              <span class="label">Distance</span>
              <span class="val">{{ quote()?.distanceKm | number:'1.1-1' }} km</span>
            </div>
          </div>
          <div class="detail-item">
            <i class="fas fa-clock"></i>
            <div class="text">
              <span class="label">Est. Delivery</span>
              <span class="val">{{ quote()?.estimatedDeliveryTime | date:'medium' }}</span>
            </div>
          </div>
        </div>

        <div class="route-info">
          <div class="agency">
            <div class="dot source"></div>
            <span>{{ quote()?.sourceAgencyName }}</span>
          </div>
          <div class="line"></div>
          <div class="agency">
            <div class="dot dest"></div>
            <span>{{ quote()?.destAgencyName }}</span>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Calculating the best price for you...</p>
      </div>
    </ng-template>
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
    .quote-card {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 20px;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .price-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .price-display .label {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.5;
      margin-bottom: 0.5rem;
    }
    .price-display .amount {
      font-size: 3rem;
      font-weight: 800;
      color: #4ecca3;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .detail-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 12px;
    }
    .detail-item i {
      font-size: 1.2rem;
      color: #e94560;
    }
    .detail-item .text {
      display: flex;
      flex-direction: column;
    }
    .detail-item .label {
      font-size: 0.7rem;
      opacity: 0.5;
    }
    .detail-item .val {
      font-weight: bold;
    }
    .route-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
    }
    .agency {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-size: 0.9rem;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot.source { background: #e94560; }
    .dot.dest { background: #4ecca3; }
    .line {
      width: 2px;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
      margin-left: 4px;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      gap: 1.5rem;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(233, 69, 96, 0.1);
      border-top-color: #e94560;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class QuoteSummaryComponent {
  wizardService = inject(ParcelWizardService);
  quote = () => this.wizardService.state().quote;
}
