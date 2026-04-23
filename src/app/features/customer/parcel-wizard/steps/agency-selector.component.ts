import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParcelWizardService } from '../../../../core/services/parcel-wizard.service';
import { AgencyService, Agency } from '../../../../shared/services/agency.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-agency-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2>Select Agencies</h2>
      <p class="subtitle">Where are we shipping from and to?</p>

      <div class="agency-grids">
        <!-- Source Agency -->
        <div class="agency-select">
          <label>Source Agency</label>
          <div class="select-wrapper">
            <select 
              [value]="state().sourceAgencyId || ''" 
              (change)="onSourceChange($event)"
              class="glass-input"
            >
              <option value="" disabled>Select Source</option>
              <option *ngFor="let a of agencies()" [value]="a.id">
                {{ a.name }} ({{ a.town }})
              </option>
            </select>
          </div>
        </div>

        <div class="divider-icon">
          <i class="fas fa-arrow-right"></i>
        </div>

        <!-- Destination Agency -->
        <div class="agency-select">
          <label>Destination Agency</label>
          <div class="select-wrapper">
            <select 
              [value]="state().destAgencyId || ''" 
              (change)="onDestChange($event)"
              class="glass-input"
            >
              <option value="" disabled>Select Destination</option>
              <option *ngFor="let a of agencies()" [value]="a.id">
                {{ a.name }} ({{ a.town }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="map-preview-placeholder">
        <div class="placeholder-overlay">
          <i class="fas fa-map-marked-alt"></i>
          <span>Map Preview Integration Coming Soon</span>
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
    .agency-grids {
      display: flex;
      gap: 2rem;
      align-items: center;
      margin-bottom: 2rem;
    }
    .agency-select {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .glass-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1rem;
      color: white;
      outline: none;
    }
    .glass-input option {
      background: #1a1a2e;
    }
    .divider-icon {
      font-size: 1.5rem;
      color: #e94560;
      opacity: 0.5;
    }
    .map-preview-placeholder {
      height: 200px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed rgba(255, 255, 255, 0.2);
    }
    .placeholder-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      opacity: 0.4;
    }
    .placeholder-overlay i {
      font-size: 3rem;
    }
  `]
})
export class AgencySelectorComponent {
  wizardService = inject(ParcelWizardService);
  agencyService = inject(AgencyService);
  
  state = this.wizardService.state;
  agencies = toSignal(this.agencyService.getAllAgencies(), { initialValue: [] as Agency[] });

  onSourceChange(event: any) {
    this.wizardService.updateState({ sourceAgencyId: event.target.value });
  }

  onDestChange(event: any) {
    this.wizardService.updateState({ destAgencyId: event.target.value });
  }
}
