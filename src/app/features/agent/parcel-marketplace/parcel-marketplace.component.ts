import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TripService } from '../../../core/services/trip.service';
import { AvailableParcelResponse } from '../../../core/models/trip.model';

@Component({
  selector: 'app-parcel-marketplace',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="marketplace-container">
      <header>
        <h1>Parcel Marketplace</h1>
        <p>Available packages at your source agency matching your route.</p>
      </header>

      <div class="parcel-grid" *ngIf="!loading(); else loadingTpl">
        <div *ngFor="let p of parcels()" class="parcel-card" [class.selected]="isSelected(p.id)" (click)="toggleSelection(p.id)">
          <div class="parcel-header">
            <span class="weight">{{ p.weight }} kg</span>
            <span class="fragility" [class.high]="p.fragility > 7">
              <i class="fas fa-wine-glass-alt"></i> {{ p.fragility }}/10
            </span>
          </div>
          <div class="parcel-body">
            <div class="route">
              <span>{{ p.sourceAgencyName }}</span>
              <i class="fas fa-arrow-right"></i>
              <span>{{ p.destAgencyName }}</span>
            </div>
            <div class="details">
              <span class="cost">{{ p.estimatedCost | number }} XAF</span>
              <span class="eta">Est. {{ p.estimatedDeliveryTime | date:'shortDate' }}</span>
            </div>
          </div>
          <div class="selection-indicator">
            <i class="fas fa-check-circle"></i>
          </div>
        </div>

        <div *ngIf="parcels().length === 0" class="empty-state">
          <i class="fas fa-box-open"></i>
          <h3>No parcels available</h3>
          <p>There are no parcels at this agency waiting for your destination.</p>
          <button class="btn-secondary" routerLink="/agent/dashboard">Go to Dashboard</button>
        </div>
      </div>

      <footer *ngIf="parcels().length > 0">
        <div class="selection-info">
          <span>{{ selectedIds().size }} Parcels Selected</span>
        </div>
        <button class="btn-primary" [disabled]="selectedIds().size === 0 || processing()" (click)="onLoadParcels()">
          {{ processing() ? 'Loading...' : 'Load Parcels & Start Journey' }}
        </button>
      </footer>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Fetching available parcels...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .marketplace-container {
      padding: 2rem;
      min-height: 100vh;
      background: #0f172a;
      color: white;
      padding-bottom: 8rem;
    }
    header { margin-bottom: 2rem; }
    h1 { color: #e94560; margin: 0; }
    p { opacity: 0.6; }
    .parcel-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .parcel-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }
    .parcel-card:hover { transform: translateY(-5px); background: rgba(255, 255, 255, 0.08); }
    .parcel-card.selected { border-color: #4ecca3; background: rgba(78, 204, 163, 0.1); }
    .parcel-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
    .weight { font-weight: 800; font-size: 1.2rem; }
    .fragility { font-size: 0.8rem; opacity: 0.7; }
    .fragility.high { color: #e94560; opacity: 1; }
    .route { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; font-size: 0.9rem; }
    .route i { color: #e94560; font-size: 0.7rem; }
    .details { display: flex; justify-content: space-between; font-size: 0.8rem; opacity: 0.6; }
    .cost { font-weight: bold; color: #4ecca3; opacity: 1; }
    .selection-indicator {
      position: absolute;
      top: -10px;
      right: -10px;
      color: #4ecca3;
      font-size: 1.5rem;
      background: #0f172a;
      border-radius: 50%;
      display: none;
    }
    .parcel-card.selected .selection-indicator { display: block; }
    footer {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 600px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1.5rem 2rem;
      border-radius: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    .btn-primary {
      background: #4ecca3;
      color: #0f172a;
      padding: 0.8rem 2rem;
      border-radius: 10px;
      border: none;
      font-weight: 800;
      cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.5; }
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem;
      opacity: 0.4;
    }
    .empty-state i { font-size: 4rem; margin-bottom: 1rem; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(233, 69, 96, 0.1);
      border-top-color: #e94560;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 2rem auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ParcelMarketplaceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripService = inject(TripService);

  tripId = '';
  parcels = signal<AvailableParcelResponse[]>([]);
  selectedIds = signal<Set<string>>(new Set());
  loading = signal(true);
  processing = signal(false);

  ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id') || '';
    if (this.tripId) {
      this.fetchParcels();
    }
  }

  fetchParcels() {
    this.tripService.getAvailableParcels(this.tripId).subscribe({
      next: (data) => {
        this.parcels.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch parcels', err);
        this.loading.set(false);
      }
    });
  }

  toggleSelection(id: string) {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedIds.set(next);
  }

  isSelected(id: string) {
    return this.selectedIds().has(id);
  }

  onLoadParcels() {
    this.processing.set(true);
    const ids = Array.from(this.selectedIds());
    this.tripService.assignParcels(this.tripId, ids).subscribe({
      next: () => {
        // Start the trip immediately for demo
        this.tripService.startTrip(this.tripId).subscribe(() => {
          this.router.navigate(['/agent/hud', this.tripId]);
        });
      },
      error: (err) => {
        console.error('Failed to assign parcels', err);
        this.processing.set(false);
      }
    });
  }
}
