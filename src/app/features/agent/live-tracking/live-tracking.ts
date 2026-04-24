import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { SidebarAgentComponent } from '../../../shared/sidebar-agent/sidebar-agent';
import * as L from 'leaflet';
import { inject } from '@angular/core';
import { concatMap, from } from 'rxjs';
import { TripService } from '../../../core/services/trip.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { TripResponse } from '../../../core/models/trip.model';

// Fix Leaflet default icon issue
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

interface RoutePoint {
  lat: number;
  lng: number;
  address: string;
  type: 'pickup' | 'delivery' | 'current';
  progress: number;
}

interface RouteSegment {
  id: string;
  type: 'town' | 'highway' | 'motorway';
  distance: number;
  duration: number;
  startPoint: string;
  endPoint: string;
  color: string;
  icon: SafeHtml;
  reached: boolean;
}

interface DeliveryUpdate {
  timestamp: Date;
  location: string;
  status: string;
  message: string;
}

@Component({
  selector: 'app-live-tracking',
  standalone: true,
  templateUrl: './live-tracking.html',
  styleUrls: ['./live-tracking.css'],
  imports: [CommonModule, FormsModule, RouterModule, SidebarAgentComponent]
})
export class LiveTrackingComponent implements OnInit, OnDestroy, AfterViewInit {
  Math = Math;
  private map: any;
  private mapInitialized: boolean = false;
  private currentMarker: any;
  private routeLine: any;
  private pickupMarker: any;
  private deliveryMarker: any;
  private segmentMarkers: any[] = [];
  private readonly tripService = inject(TripService);
  private readonly storage = inject(TokenStorageService);
  private currentTrip: TripResponse | null = null;
  
  // Parcel information
  parcelId: string = '1';
  trackingNumber: string = 'AD345Jk758';
  customerName: string = 'Anna Bauer';
  customerPhone: string = '+49 30 987 654';
  deliveryAddress: string = 'Goethestraße 1, 10115 Berlin';
  pickupAddress: string = 'Berlin Central Hub, Mohrenstrasse 37';
  
  // Coordinates
  pickupCoords: { lat: number; lng: number } = { lat: 52.5123, lng: 13.3889 };
  deliveryCoords: { lat: number; lng: number } = { lat: 52.5240, lng: 13.4100 };
  
  // Tracking state
  isDelivered: boolean = false;
  currentProgress: number = 66;
  currentSpeed: number = 45;
  baseSpeed: number = 60;
  fragilityLevel: number = 3;
  adjustedSpeed: number = 48;
  distanceRemaining: number = 24;
  totalDistance: number = 125;
  etaMinutes: number = 30;
  
  // Route points
  routePoints: RoutePoint[] = [
    { lat: 52.5123, lng: 13.3889, address: 'Berlin Central Hub', type: 'pickup', progress: 0 },
    { lat: 52.5200, lng: 13.4050, address: 'Current Position', type: 'current', progress: 66 },
    { lat: 52.5240, lng: 13.4100, address: 'Goethestraße 1, Berlin', type: 'delivery', progress: 100 }
  ];
  fullPathPoints: [number, number][] = [];
  
  // Route segments
  routeSegments: RouteSegment[] = [];
  
  // Delivery updates
  deliveryUpdates: DeliveryUpdate[] = [
    { timestamp: new Date('2025-01-21T14:30:00'), location: 'Berlin Central Hub', status: 'Picked Up', message: 'Package picked up from warehouse' },
    { timestamp: new Date('2025-01-21T14:45:00'), location: 'A100 Entrance', status: 'In Transit', message: 'Entered highway' },
    { timestamp: new Date('2025-01-21T15:30:00'), location: 'A9 Motorway', status: 'In Transit', message: 'Making good progress' }
  ];
  
  // UI state
  selectedSegment: RouteSegment | null = null;
  showSpeedModal: boolean = false;
  customSpeed: number = 45;
  loading = false;
  errorMessage = '';
  segmentActionLoading = false;
  activeAction: 'start' | 'reach' | 'complete' | null = null;
  
  constructor(private sanitizer: DomSanitizer) {
    this.calculateAdjustedSpeed();
  }
  
  ngOnInit(): void {
    this.fetchActiveTrip();
  }

  fetchActiveTrip(): void {
    const user = this.storage.getUser();
    if (!user) {
      this.errorMessage = 'No authenticated agent found.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.tripService.getAgentTrips(user.userId).subscribe({
      next: (trips) => {
        const activeTrip = trips.find((t) => t.status === 'ACTIVE') ??
          trips.find((t) => t.status === 'COLLECTING');
        if (!activeTrip) {
          this.errorMessage = 'No active trip available for live tracking.';
          this.loading = false;
          return;
        }
        this.applyTripToTrackingState(activeTrip);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load live trip data.';
        this.loading = false;
      }
    });
  }

  private applyTripToTrackingState(trip: TripResponse): void {
    this.currentTrip = trip;
    this.parcelId = trip.id;
    this.trackingNumber = trip.id.substring(0, 8).toUpperCase();
    this.pickupAddress = trip.sourceAgencyName || 'Source agency';
    this.deliveryAddress = trip.destAgencyName || 'Destination agency';
    this.customerName = 'Agency Transfer';
    this.customerPhone = 'N/A';
    this.totalDistance = trip.totalDistanceKm;

    const first = trip.segments[0];
    const last = trip.segments[trip.segments.length - 1];
    if (first) {
      this.pickupCoords = { lat: first.latitude, lng: first.longitude };
    }
    if (last) {
      this.deliveryCoords = { lat: last.latitude, lng: last.longitude };
    }

    const reached = trip.segments.filter((s) => s.status === 'REACHED').length;
    this.currentProgress = trip.status === 'COMPLETED'
      ? 100
      : Math.round((reached / Math.max(1, trip.segmentCount)) * 100);
    this.isDelivered = trip.status === 'COMPLETED';
    this.distanceRemaining = Math.max(0, this.totalDistance * (1 - this.currentProgress / 100));
    this.etaMinutes = Math.max(0, Math.round((this.distanceRemaining / Math.max(10, this.currentSpeed)) * 60));

    this.routePoints = trip.segments.map((s) => ({
      lat: s.latitude,
      lng: s.longitude,
      address: `Segment ${s.segmentOrder}`,
      type: s.status === 'REACHED' ? 'current' : 'delivery',
      progress: trip.status === 'COMPLETED'
        ? 100
        : Math.round((s.segmentOrder / Math.max(1, trip.segmentCount)) * 100)
    }));
    if (this.routePoints.length < 2) {
      this.routePoints = [
        {
          lat: this.pickupCoords.lat,
          lng: this.pickupCoords.lng,
          address: this.pickupAddress,
          type: 'pickup',
          progress: 0
        },
        {
          lat: this.deliveryCoords.lat,
          lng: this.deliveryCoords.lng,
          address: this.deliveryAddress,
          type: 'delivery',
          progress: 100
        }
      ];
    }

    this.routeSegments = this.mapTripSegments(trip);
    this.fullPathPoints = this.mapFullPath(trip);
    this.deliveryUpdates = [
      {
        timestamp: new Date(trip.createdAt),
        location: this.pickupAddress,
        status: 'Trip Created',
        message: `Trip ${this.trackingNumber} created`
      },
      {
        timestamp: new Date(),
        location: this.deliveryAddress,
        status: trip.status === 'COMPLETED' ? 'Delivered' : 'In Transit',
        message: `${reached}/${trip.segmentCount} segments reached`
      }
    ];

    if (this.mapInitialized) {
      this.updateMapMarkers();
    }
  }

  private mapTripSegments(trip: TripResponse): RouteSegment[] {
    const ordered = [...trip.segments].sort((a, b) => a.segmentOrder - b.segmentOrder);
    return ordered.map((segment, index) => {
      const previousDistance = index === 0 ? 0 : ordered[index - 1].distanceFromStartKm;
      const distance = Math.max(0.3, segment.distanceFromStartKm - previousDistance);
      const duration = Math.max(5, Math.round((distance / 45) * 60));
      const type: RouteSegment['type'] = distance > 15 ? 'motorway' : distance > 6 ? 'highway' : 'town';
      return {
        id: segment.id,
        type,
        distance: Number(distance.toFixed(1)),
        duration,
        startPoint: index === 0 ? 'Start' : `Segment ${ordered[index - 1].segmentOrder}`,
        endPoint: `Segment ${segment.segmentOrder}`,
        color: type === 'town' ? '#10B981' : type === 'highway' ? '#2563EB' : '#3B82F6',
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${type === 'town' ? '#10B981' : '#3B82F6'}" stroke-width="2"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`),
        reached: segment.status === 'REACHED'
      };
    });
  }

  private mapFullPath(trip: TripResponse): [number, number][] {
    const fromBackend = (trip.fullPath || [])
      .filter((p) => Array.isArray(p) && p.length >= 2)
      .map((p) => [p[0], p[1]] as [number, number]);
    if (fromBackend.length >= 2) return fromBackend;
    return [
      [this.pickupCoords.lat, this.pickupCoords.lng],
      [this.deliveryCoords.lat, this.deliveryCoords.lng]
    ];
  }

  private getNextPendingSegmentId(): string | null {
    if (!this.currentTrip) return null;
    const ordered = [...this.currentTrip.segments].sort((a, b) => a.segmentOrder - b.segmentOrder);
    return ordered.find((s) => s.status === 'PENDING')?.id ?? null;
  }

  private getCurrentCoordinates(): { lat: number; lng: number } {
    if (!this.currentTrip) return this.pickupCoords;
    const ordered = [...this.currentTrip.segments].sort((a, b) => a.segmentOrder - b.segmentOrder);
    const reached = ordered.filter((s) => s.status === 'REACHED');
    if (reached.length > 0) {
      const latest = reached[reached.length - 1];
      return { lat: latest.latitude, lng: latest.longitude };
    }
    if (ordered.length > 0) {
      return { lat: ordered[0].latitude, lng: ordered[0].longitude };
    }
    return this.pickupCoords;
  }

  getNextPendingSegment(): RouteSegment | null {
    return this.routeSegments.find((s) => !s.reached) || null;
  }

  canStartTrip(): boolean {
    return !!this.currentTrip
      && this.currentTrip.status === 'COLLECTING'
      && !this.segmentActionLoading;
  }

  canReachNextSegment(): boolean {
    return !!this.currentTrip
      && this.currentTrip.status === 'ACTIVE'
      && !!this.getNextPendingSegment()
      && !this.segmentActionLoading;
  }

  canMarkDelivered(): boolean {
    return !!this.currentTrip
      && this.currentTrip.status === 'ACTIVE'
      && !this.segmentActionLoading
      && !this.isDelivered;
  }

  startTripFromTracking(): void {
    if (!this.currentTrip || this.currentTrip.status !== 'COLLECTING') {
      this.errorMessage = 'Trip cannot be started in its current status.';
      return;
    }
    this.segmentActionLoading = true;
    this.activeAction = 'start';
    this.errorMessage = '';
    this.tripService.startTrip(this.currentTrip.id).subscribe({
      next: (updatedTrip) => {
        this.applyTripToTrackingState(updatedTrip);
        this.segmentActionLoading = false;
        this.activeAction = null;
      },
      error: () => {
        this.errorMessage = 'Failed to start trip.';
        this.segmentActionLoading = false;
        this.activeAction = null;
      }
    });
  }

  reachNextSegment(): void {
    const nextSegmentId = this.getNextPendingSegmentId();
    if (!this.currentTrip || !nextSegmentId) {
      this.errorMessage = 'No pending segment to mark as reached.';
      return;
    }
    this.segmentActionLoading = true;
    this.activeAction = 'reach';
    this.errorMessage = '';
    this.tripService.reachSegment(this.currentTrip.id, nextSegmentId).subscribe({
      next: (updatedTrip) => {
        this.applyTripToTrackingState(updatedTrip);
        this.segmentActionLoading = false;
        this.activeAction = null;
      },
      error: () => {
        this.errorMessage = 'Failed to mark segment as reached.';
        this.segmentActionLoading = false;
        this.activeAction = null;
      }
    });
  }
  
  ngAfterViewInit(): void {
    // Don't initialize map immediately - wait for view to be ready
    setTimeout(() => {
      this.initMap();
    }, 100);
  }
  
  private initMap(): void {
    if (this.mapInitialized) return;
    
    const mapElement = document.getElementById('liveMap');
    if (!mapElement) return;
    
    this.map = L.map('liveMap').setView([52.5200, 13.4050], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 3
    }).addTo(this.map);
    
    this.mapInitialized = true;
    this.updateMapMarkers();
  }
  
  private updateMapMarkers(): void {
    if (!this.map) return;
    
    // Clear existing markers
    if (this.pickupMarker) this.map.removeLayer(this.pickupMarker);
    if (this.deliveryMarker) this.map.removeLayer(this.deliveryMarker);
    if (this.currentMarker) this.map.removeLayer(this.currentMarker);
    if (this.routeLine) this.map.removeLayer(this.routeLine);
    this.segmentMarkers.forEach((marker) => this.map.removeLayer(marker));
    this.segmentMarkers = [];
    
    // Add pickup marker (Green)
    const pickupIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #10B981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
      iconSize: [12, 12],
      popupAnchor: [0, -6]
    });
    
    this.pickupMarker = L.marker([this.pickupCoords.lat, this.pickupCoords.lng], { icon: pickupIcon })
      .bindPopup(`<strong>📦 Pickup</strong><br/>${this.pickupAddress}`)
      .addTo(this.map);
    
    // Add delivery marker (Red)
    const deliveryIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #EF4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
      iconSize: [12, 12],
      popupAnchor: [0, -6]
    });
    
    this.deliveryMarker = L.marker([this.deliveryCoords.lat, this.deliveryCoords.lng], { icon: deliveryIcon })
      .bindPopup(`<strong>📍 Delivery</strong><br/>${this.deliveryAddress}<br/>Customer: ${this.customerName}`)
      .addTo(this.map);
    
    // Add current position marker (Blue, animated)
    const currentCoords = this.getCurrentCoordinates();
    
    const currentIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #3B82F6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #3B82F6; animation: pulse 1.5s infinite;"></div>`,
      iconSize: [14, 14],
      popupAnchor: [0, -7]
    });
    
    this.currentMarker = L.marker([currentCoords.lat, currentCoords.lng], { icon: currentIcon })
      .bindPopup(`<strong>🚚 Current Position</strong><br/>${this.currentProgress}% complete<br/>ETA: ${this.formatDuration(this.etaMinutes)}`)
      .addTo(this.map);

    // Draw full path from backend
    this.routeLine = L.polyline(this.fullPathPoints, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.8
    }).addTo(this.map);

    // Draw segment checkpoints
    if (this.currentTrip) {
      const orderedSegments = [...this.currentTrip.segments].sort((a, b) => a.segmentOrder - b.segmentOrder);
      orderedSegments.forEach((segment) => {
        const checkpointIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${segment.status === 'REACHED' ? '#10B981' : '#F59E0B'}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [10, 10],
          popupAnchor: [0, -5]
        });
        const marker = L.marker([segment.latitude, segment.longitude], { icon: checkpointIcon })
          .bindPopup(`<strong>Checkpoint ${segment.segmentOrder}</strong><br/>${segment.status}`)
          .addTo(this.map);
        this.segmentMarkers.push(marker);
      });
    }

    // Fit bounds to show path
    const bounds = L.latLngBounds(this.fullPathPoints);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }
  
  private updateCurrentPositionOnMap(): void {
    if (!this.map || !this.currentMarker) return;
    
    const progressRatio = this.currentProgress / 100;
    const currentLat = this.pickupCoords.lat + (this.deliveryCoords.lat - this.pickupCoords.lat) * progressRatio;
    const currentLng = this.pickupCoords.lng + (this.deliveryCoords.lng - this.pickupCoords.lng) * progressRatio;
    
    this.currentMarker.setLatLng([currentLat, currentLng]);
    this.currentMarker.bindPopup(`<strong>🚚 Current Position</strong><br/>${this.currentProgress}% complete<br/>ETA: ${this.formatDuration(this.etaMinutes)}`);
    
    // Update route line
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }
    
    const routePoints: [number, number][] = [
      [this.pickupCoords.lat, this.pickupCoords.lng],
      [currentLat, currentLng],
      [this.deliveryCoords.lat, this.deliveryCoords.lng]
    ];
    
    this.routeLine = L.polyline(routePoints, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(this.map);
  }
  
  // Map controls
  zoomIn(): void {
    if (this.map) this.map.zoomIn();
  }
  
  zoomOut(): void {
    if (this.map) this.map.zoomOut();
  }
  
  centerMap(): void {
    if (this.map) {
      const bounds = L.latLngBounds([
        [this.pickupCoords.lat, this.pickupCoords.lng],
        [this.deliveryCoords.lat, this.deliveryCoords.lng]
      ]);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
  
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
  
  calculateAdjustedSpeed(): void {
    this.adjustedSpeed = this.baseSpeed * (1 - this.fragilityLevel / 15);
    this.currentSpeed = this.adjustedSpeed;
  }
  
  markAsDelivered(): void {
    if (!this.currentTrip) {
      this.errorMessage = 'No active trip available.';
      return;
    }
    if (!confirm('Complete this trip now?')) {
      return;
    }

    const pendingSegmentIds = this.routeSegments
      .filter((segment) => !segment.reached)
      .map((segment) => segment.id);

    if (pendingSegmentIds.length === 0) {
      this.fetchActiveTrip();
      return;
    }

    this.segmentActionLoading = true;
    this.activeAction = 'complete';
    this.errorMessage = '';

    let latestTrip: TripResponse | null = null;
    from(pendingSegmentIds)
      .pipe(concatMap((segmentId) => this.tripService.reachSegment(this.currentTrip!.id, segmentId)))
      .subscribe({
        next: (updatedTrip) => {
          latestTrip = updatedTrip;
        },
        error: () => {
          this.errorMessage = 'Failed to complete trip on backend.';
          this.segmentActionLoading = false;
          this.activeAction = null;
        },
        complete: () => {
          if (latestTrip) {
            this.applyTripToTrackingState(latestTrip);
          } else {
            this.fetchActiveTrip();
          }
          this.segmentActionLoading = false;
          this.activeAction = null;
        }
      });
  }
  
  updateSpeed(): void {
    this.currentSpeed = this.customSpeed;
    this.addUpdate('Speed Update', 'Speed Changed', `Trip speed adjusted to ${this.currentSpeed} km/h`);
    this.showSpeedModal = false;
  }
  
  addUpdate(location: string, status: string, message: string): void {
    this.deliveryUpdates.unshift({
      timestamp: new Date(),
      location: location,
      status: status,
      message: message
    });
    
    if (this.deliveryUpdates.length > 20) {
      this.deliveryUpdates.pop();
    }
  }
  
  selectSegment(segment: RouteSegment): void {
    this.selectedSegment = segment;
  }
  
  closeSegmentModal(): void {
    this.selectedSegment = null;
  }
  
  openSpeedModal(): void {
    this.customSpeed = this.currentSpeed;
    this.showSpeedModal = true;
  }
  
  closeSpeedModal(): void {
    this.showSpeedModal = false;
  }
  
  getFragilityClass(level: number): string {
    if (level <= 3) return 'fragility-low';
    if (level <= 7) return 'fragility-medium';
    return 'fragility-high';
  }
  
  getFragilityText(level: number): string {
    if (level <= 3) return 'Low';
    if (level <= 7) return 'Medium';
    return 'High';
  }
  
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}m`;
  }
  
  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}