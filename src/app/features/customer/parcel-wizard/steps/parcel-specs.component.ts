import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParcelWizardService } from '../../../../core/services/parcel-wizard.service';

@Component({
  selector: 'app-parcel-specs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2>Parcel Details</h2>
      <p class="subtitle">Tell us more about the package and the receiver.</p>

      <div class="form-grid">
        <div class="form-group">
          <label>Receiver Name</label>
          <input 
            type="text" 
            [(ngModel)]="receiverName" 
            (ngModelChange)="update('receiverName', $event)"
            placeholder="John Doe"
            class="glass-input"
          >
        </div>
        <div class="form-group">
          <label>Receiver Phone</label>
          <input 
            type="text" 
            [(ngModel)]="receiverPhone" 
            (ngModelChange)="update('receiverPhone', $event)"
            placeholder="+237 6XX XXX XXX"
            class="glass-input"
          >
        </div>
        <div class="form-group">
          <label>Weight (kg)</label>
          <div class="range-wrapper">
            <input 
              type="range" 
              min="0.1" 
              max="50" 
              step="0.1"
              [(ngModel)]="weight" 
              (ngModelChange)="update('weight', $event)"
              class="glass-range"
            >
            <span class="range-val">{{ weight() }} kg</span>
          </div>
        </div>
        <div class="form-group">
          <label>Fragility Level (1-10)</label>
          <div class="range-wrapper">
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="1"
              [(ngModel)]="fragility" 
              (ngModelChange)="update('fragility', $event)"
              class="glass-range"
            >
            <span class="range-val">{{ fragility() }}</span>
          </div>
        </div>
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
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .glass-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1rem;
      color: white;
      outline: none;
    }
    .range-wrapper {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .glass-range {
      flex: 1;
      accent-color: #e94560;
    }
    .range-val {
      min-width: 60px;
      text-align: right;
      font-weight: bold;
      color: #e94560;
    }
  `]
})
export class ParcelSpecsComponent {
  wizardService = inject(ParcelWizardService);
  
  receiverName = this.wizardService.state().receiverName;
  receiverPhone = this.wizardService.state().receiverPhone;
  weight = () => this.wizardService.state().weight;
  fragility = () => this.wizardService.state().fragility;

  update(field: string, value: any) {
    this.wizardService.updateState({ [field]: value });
  }
}
