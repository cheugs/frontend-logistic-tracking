import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AgencyService, Agency } from '../../../shared/services/agency.service';
import { TripService } from '../../../core/services/trip.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-trip-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="planner-container">
      <div class="glass-card">
        <header>
          <button class="btn-back" routerLink="/agent/dashboard">
            <i class="fas fa-chevron-left"></i>
          </button>
          <h1>Plan Your Journey</h1>
          <p>Select your starting agency and destination to begin.</p>
        </header>

        <form (submit)="onCreateTrip()" class="planner-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Origin Agency</label>
              <select [(ngModel)]="sourceId" name="source" class="glass-input" required>
                <option value="" disabled>Select Origin</option>
                <option *ngFor="let a of agencies()" [value]="a.id">{{ a.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Destination Agency</label>
              <select [(ngModel)]="destId" name="dest" class="glass-input" required>
                <option value="" disabled>Select Destination</option>
                <option *ngFor="let a of agencies()" [value]="a.id">{{ a.name }}</option>
              </select>
            </div>
          </div>

          <div class="preview-section" *ngIf="sourceId && destId">
            <div class="route-preview">
              <div class="point">
                <span class="city">{{ getAgencyName(sourceId) }}</span>
                <span class="label">Origin</span>
              </div>
              <div class="arrow">
                <i class="fas fa-long-arrow-alt-right"></i>
              </div>
              <div class="point">
                <span class="city">{{ getAgencyName(destId) }}</span>
                <span class="label">Destination</span>
              </div>
            </div>
          </div>

          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="!sourceId || !destId || sourceId === destId || loading()">
              {{ loading() ? 'Creating...' : 'Initialize Trip' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .planner-container {
      padding: 2rem;
      min-height: 100vh;
      background: radial-gradient(circle at top left, #1a1a2e, #16213e);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .glass-card {
      width: 100%;
      max-width: 600px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }
    header {
      margin-bottom: 2.5rem;
      position: relative;
    }
    .btn-back {
      position: absolute;
      left: -1rem;
      top: -0.5rem;
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.2s;
    }
    .btn-back:hover { opacity: 1; }
    h1 { font-size: 2rem; color: #e94560; margin: 0; }
    p { opacity: 0.6; margin-top: 0.5rem; }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
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
    .glass-input option { background: #1a1a2e; }
    .preview-section {
      background: rgba(233, 69, 96, 0.1);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid rgba(233, 69, 96, 0.2);
    }
    .route-preview {
      display: flex;
      align-items: center;
      justify-content: space-around;
      text-align: center;
    }
    .point { display: flex; flex-direction: column; }
    .city { font-weight: 800; font-size: 1.1rem; }
    .label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.5; letter-spacing: 1px; }
    .arrow { font-size: 1.5rem; color: #e94560; }
    .btn-primary {
      width: 100%;
      background: #e94560;
      color: white;
      padding: 1.2rem;
      border-radius: 12px;
      font-weight: 800;
      font-size: 1.1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);
    }
    .btn-primary:hover:not(:disabled) {
      background: #ff5e78;
      transform: translateY(-2px);
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class TripPlannerComponent {
  private agencyService = inject(AgencyService);
  private tripService = inject(TripService);
  private storage = inject(TokenStorageService);
  private router = inject(Router);

  agencies = toSignal(this.agencyService.getAllAgencies(), { initialValue: [] as Agency[] });
  sourceId = '';
  destId = '';
  loading = signal(false);

  getAgencyName(id: string): string {
    return this.agencies().find(a => a.id === id)?.name || 'Unknown';
  }

  onCreateTrip() {
    const user = this.storage.getUser();
    if (!user) return;

    this.loading.set(true);
    const source = this.agencies().find(a => a.id === this.sourceId);
    const dest = this.agencies().find(a => a.id === this.destId);

    if (!source || !dest) return;

    this.tripService.createTrip({
      driverId: user.userId,
      sourceAgencyId: source.id,
      sourceAgencyName: source.name,
      destAgencyId: dest.id,
      destAgencyName: dest.name
    }).subscribe({
      next: (trip) => {
        this.router.navigate(['/agent/marketplace', trip.id]);
      },
      error: (err) => {
        console.error('Failed to create trip', err);
        this.loading.set(false);
      }
    });
  }
}
