import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TripService } from '../../../core/services/trip.service';
import { TripResponse, SegmentResponse } from '../../../core/models/trip.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-journey-hud',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="hud-container">
      <div class="map-view" id="journeyMap"></div>

      <div class="overlay-panel">
        <header>
          <div class="route-info">
            <span class="source">{{ trip()?.sourceAgencyName }}</span>
            <i class="fas fa-long-arrow-alt-right"></i>
            <span class="dest">{{ trip()?.destAgencyName }}</span>
          </div>
          <div class="trip-meta">
            <span>{{ trip()?.totalDistanceKm }} km</span>
            <span>•</span>
            <span>{{ trip()?.parcelsCount }} Parcels</span>
          </div>
        </header>

        <div class="segments-list">
          <h3>Journey Progress</h3>
          <div *ngFor="let s of trip()?.segments" class="segment-item" [class.reached]="s.status === 'REACHED'">
            <div class="segment-indicator">
              <div class="dot"></div>
              <div class="line"></div>
            </div>
            <div class="segment-content">
              <div class="segment-info">
                <span class="order">Segment {{ s.segmentOrder }}</span>
                <span class="distance">{{ s.distanceFromStartKm | number:'1.1-1' }} km</span>
              </div>
              <button 
                *ngIf="s.status !== 'REACHED'" 
                class="btn-reach" 
                [disabled]="!isNextSegment(s)"
                (click)="onReach(s.id)"
              >
                Mark Reached
              </button>
              <div *ngIf="s.status === 'REACHED'" class="reached-label">
                <i class="fas fa-check"></i> Reached
              </div>
            </div>
          </div>
        </div>

        <footer>
          <button class="btn-finish" *ngIf="isFinished()" (click)="onFinish()">
            Finish Journey & Sync Stats
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .hud-container {
      height: 100vh;
      display: flex;
      background: #0f172a;
    }
    .map-view {
      flex: 1;
      z-index: 1;
    }
    .overlay-panel {
      width: 400px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(10px);
      z-index: 10;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
    }
    header { margin-bottom: 2rem; }
    .route-info { display: flex; align-items: center; gap: 1rem; font-size: 1.2rem; font-weight: 800; color: #e94560; margin-bottom: 0.5rem; }
    .trip-meta { font-size: 0.8rem; opacity: 0.5; display: flex; gap: 0.5rem; }
    .segments-list { flex: 1; overflow-y: auto; }
    .segment-item { display: flex; gap: 1.5rem; margin-bottom: 0; min-height: 80px; }
    .segment-indicator { display: flex; flex-direction: column; align-items: center; width: 20px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; background: #334155; border: 2px solid #1e293b; z-index: 2; }
    .line { flex: 1; width: 2px; background: #334155; margin-top: -2px; margin-bottom: -2px; }
    .reached .dot { background: #4ecca3; box-shadow: 0 0 10px rgba(78, 204, 163, 0.5); }
    .reached .line { background: #4ecca3; }
    .segment-content { flex: 1; padding-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; }
    .segment-info { display: flex; flex-direction: column; }
    .order { font-weight: bold; }
    .distance { font-size: 0.7rem; opacity: 0.4; }
    .btn-reach {
      background: #e94560;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: bold;
      cursor: pointer;
    }
    .btn-reach:disabled { opacity: 0.3; cursor: not-allowed; }
    .reached-label { color: #4ecca3; font-weight: bold; font-size: 0.8rem; }
    .btn-finish {
      width: 100%;
      background: #4ecca3;
      color: #0f172a;
      padding: 1.2rem;
      border-radius: 12px;
      font-weight: 800;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(78, 204, 163, 0.3);
    }
  `]
})
export class JourneyHudComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripService = inject(TripService);

  trip = signal<TripResponse | null>(null);
  private map: any;
  private polyline: any;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    if (id) {
      this.fetchTrip(id);
    }
  }

  fetchTrip(id: string) {
    this.tripService.getAgentTrips('').subscribe(trips => {
      const found = trips.find(t => t.id === id);
      if (found) {
        this.trip.set(found);
        this.initMap(found);
      }
    });
  }

  initMap(trip: TripResponse) {
    setTimeout(() => {
      this.map = L.map('journeyMap', { zoomControl: false }).setView(trip.fullPath[0] as L.LatLngExpression, 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(this.map);
      
      this.polyline = L.polyline(trip.fullPath as L.LatLngExpression[], {
        color: '#e94560',
        weight: 5,
        opacity: 0.8
      }).addTo(this.map);

      this.map.fitBounds(this.polyline.getBounds(), { padding: [50, 50] });

      // Pulse for current segment
      const currentIdx = trip.segments.findIndex(s => s.status === 'PENDING');
      if (currentIdx !== -1) {
        const seg = trip.segments[currentIdx];
        L.circleMarker([seg.latitude, seg.longitude], {
          radius: 8,
          color: '#e94560',
          fillOpacity: 1,
          className: 'pulse-marker'
        }).addTo(this.map);
      }
    }, 100);
  }

  isNextSegment(s: SegmentResponse): boolean {
    const segments = this.trip()?.segments || [];
    const idx = segments.findIndex(seg => seg.id === s.id);
    if (idx === 0) return s.status === 'PENDING';
    return segments[idx - 1].status === 'REACHED' && s.status === 'PENDING';
  }

  onReach(segmentId: string) {
    const tid = this.trip()?.id;
    if (!tid) return;

    this.tripService.reachSegment(tid, segmentId).subscribe(updated => {
      this.trip.set(updated);
      this.updateMap(updated);
    });
  }

  updateMap(trip: TripResponse) {
    // Refresh map markers etc if needed
  }

  isFinished(): boolean {
    return this.trip()?.segments.every(s => s.status === 'REACHED') || false;
  }

  onFinish() {
    this.router.navigate(['/agent/dashboard']);
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }
}
