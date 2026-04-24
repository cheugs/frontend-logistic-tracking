import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule, Router } from '@angular/router';
import { SidebarAgentComponent } from '../../../shared/sidebar-agent/sidebar-agent';
import * as L from 'leaflet';
import { TripService } from '../../../core/services/trip.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { TripResponse, TripStatus } from '../../../core/models/trip.model';
import { inject, OnDestroy } from '@angular/core';
import { forkJoin, interval, startWith, Subject, takeUntil } from 'rxjs';

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

interface DeliveryTask {
  id: string;
  trackingNumber: string;
  tripStatus: TripStatus;
  pickupAddress: string;
  deliveryAddress: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  statusColor: string;
  statusBg: string;
  distance: number;
  estimatedTime: string;
  progress: number;
  currentLocation?: string;
  parcelsCount: number;
  segmentCount: number;
  reachedSegments: number;
  pickupCoords?: { lat: number; lng: number };
  deliveryCoords?: { lat: number; lng: number };
}

interface StatCard {
  label: string;
  value: number;
  icon: SafeHtml;
  color: string;
  bgColor: string;
  trend?: number;
  unit?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  parcelId: string;
  timestamp: Date;
  status: string;
}

interface AvailableParcelItem {
  id: string;
  sourceAgencyName: string;
  destAgencyName: string;
  weight: number;
  fragility: number;
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [CommonModule, FormsModule, RouterModule, SidebarAgentComponent]
})
export class AgentDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  Math = Math;
  private map: any;
  private mapInitialized: boolean = false;
  private currentRouteLayer: any;
  private markers: any[] = [];
  private destroy$ = new Subject<void>();

  // Agent information
  agentName = 'Max Klinger';
  agentAvatar = 'MK';
  agentRating = 4.9;
  totalTrips = 0;

  // Today's deliveries
  todayDeliveries: DeliveryTask[] = [];
  loading = false;
  errorMessage = '';
  actionLoading = false;

  showAssignModal = false;
  selectedTripForAssignment: DeliveryTask | null = null;
  availableParcels: AvailableParcelItem[] = [];
  selectedParcelIds = new Set<string>();

  private readonly tripService = inject(TripService);
  private readonly storage = inject(TokenStorageService);

  constructor(private sanitizer: DomSanitizer, private router: Router) {
    const user = this.storage.getUser();
    if (user) {
      this.agentName = user.email;
      this.agentAvatar = user.email.substring(0, 2).toUpperCase();
    }
    this.calculateStats(0, 0);
  }

  ngOnInit(): void {
    this.fetchTrips();
    this.startPolling();
  }

  fetchTrips(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPolling(): void {
    interval(30000)
      .pipe(startWith(0), takeUntil(this.destroy$))
      .subscribe(() => this.loadDashboardData());
  }

  private loadDashboardData(): void {
    const user = this.storage.getUser();
    if (!user) {
      this.errorMessage = 'No authenticated agent found.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      trips: this.tripService.getAgentTrips(user.userId),
      stats: this.tripService.getAgentStats(user.userId)
    }).subscribe({
      next: ({ trips, stats }) => {
        this.todayDeliveries = trips.map(t => this.mapTripToTask(t));
        this.totalTrips = stats.totalTrips;
        this.completedToday = stats.completedTrips;
        this.calculateStats(stats.activeTrips, stats.totalDistanceKm);

        if (this.todayDeliveries.length > 0 && !this.selectedTask) {
          this.selectTask(this.todayDeliveries[0]);
        }
        if (this.selectedTask) {
          const refreshedSelected = this.todayDeliveries.find((t) => t.id === this.selectedTask!.id);
          if (refreshedSelected) this.selectedTask = refreshedSelected;
        }
        this.loading = false;
      },
      error: () => {
        this.todayDeliveries = [];
        this.selectedTask = null;
        this.calculateStats(0, 0);
        this.errorMessage = 'Failed to load agent dashboard data.';
        this.loading = false;
      }
    });
  }

  private mapTripToTask(trip: TripResponse): DeliveryTask {
    const status = this.mapTripStatus(trip.status);
    const colors = this.getStatusColors(status);
    const reachedSegments = trip.segments.filter(s => s.status === 'REACHED').length;
    const progress = trip.status === 'COMPLETED'
      ? 100
      : Math.round((reachedSegments / Math.max(1, trip.segmentCount)) * 100);
    const firstSegment = trip.segments[0];
    const lastSegment = trip.segments[trip.segments.length - 1];

    return {
      id: trip.id,
      trackingNumber: trip.id.substring(0, 8).toUpperCase(),
      tripStatus: trip.status,
      pickupAddress: trip.sourceAgencyName || 'Origin Agency',
      deliveryAddress: trip.destAgencyName || 'Destination Agency',
      status: status,
      statusColor: colors.color,
      statusBg: colors.bg,
      distance: trip.totalDistanceKm,
      estimatedTime: trip.status === 'COMPLETED' ? 'Finished' : 'In progress',
      progress: progress,
      parcelsCount: trip.parcelsCount,
      segmentCount: trip.segmentCount,
      reachedSegments: reachedSegments,
      pickupCoords: firstSegment ? { lat: firstSegment.latitude, lng: firstSegment.longitude } : undefined,
      deliveryCoords: lastSegment ? { lat: lastSegment.latitude, lng: lastSegment.longitude } : undefined
    };
  }

  private mapTripStatus(status: TripStatus): 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' {
    switch (status) {
      case 'COLLECTING':
        return 'PENDING';
      case 'ACTIVE':
        return 'IN_TRANSIT';
      case 'COMPLETED': return 'DELIVERED';
      default: return 'PENDING';
    }
  }

  private getStatusColors(status: string): { color: string, bg: string } {
    if (status === 'PENDING') return { color: '#6B7280', bg: '#F3F4F6' };
    if (status === 'IN_TRANSIT') return { color: '#2563EB', bg: '#EFF6FF' };
    if (status === 'DELIVERED') return { color: '#10B981', bg: '#D1FAE5' };
    return { color: '#6B7280', bg: '#F3F4F6' };
  }

  // Completed deliveries today
  completedToday = 2;

  // Statistics
  statsCards: StatCard[] = [];

  // Activity logs
  activityLogs: ActivityLog[] = [
    {
      id: '1',
      action: 'Parcel delivered successfully',
      parcelId: 'AD345Jk758',
      timestamp: new Date('2025-01-21T14:30:00'),
      status: 'DELIVERED'
    },
    {
      id: '2',
      action: 'Started delivery',
      parcelId: 'FR156KL89K',
      timestamp: new Date('2025-01-21T13:15:00'),
      status: 'IN_TRANSIT'
    },
    {
      id: '3',
      action: 'Picked up parcel',
      parcelId: 'LN236NBB9R',
      timestamp: new Date('2025-01-21T11:45:00'),
      status: 'PICKED_UP'
    },
    {
      id: '4',
      action: 'Completed delivery',
      parcelId: 'ZT234PO89M',
      timestamp: new Date('2025-01-21T10:30:00'),
      status: 'DELIVERED'
    }
  ];

  selectedTask: DeliveryTask | null = null;
  searchTerm: string = '';
  filterStatus: string = 'ALL';
  activeTab: string = 'today';



  ngAfterViewInit(): void {
    // Don't initialize map here - wait for tab click or task selection
  }

  private initMap(): void {
    if (this.mapInitialized) return;

    const mapElement = document.getElementById('agentMap');
    if (!mapElement) return;

    this.map = L.map('agentMap').setView([51.1657, 10.4515], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 3
    }).addTo(this.map);

    this.mapInitialized = true;
  }

  private updateMapForTask(task: DeliveryTask): void {
    if (!this.map || !task.pickupCoords || !task.deliveryCoords) return;

    // Clear existing layers
    if (this.currentRouteLayer) {
      this.map.removeLayer(this.currentRouteLayer);
    }
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Add pickup marker (Green)
    const pickupIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #10B981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
      iconSize: [12, 12],
      popupAnchor: [0, -6]
    });

    const pickupMarker = L.marker([task.pickupCoords.lat, task.pickupCoords.lng], { icon: pickupIcon })
      .bindPopup(`<strong>📦 Pickup</strong><br/>${task.pickupAddress.substring(0, 30)}...`)
      .addTo(this.map);
    this.markers.push(pickupMarker);

    // Add delivery marker (Red)
    const deliveryIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #EF4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
      iconSize: [12, 12],
      popupAnchor: [0, -6]
    });

    const deliveryMarker = L.marker([task.deliveryCoords.lat, task.deliveryCoords.lng], { icon: deliveryIcon })
      .bindPopup(`<strong>📍 Destination</strong><br/>${task.deliveryAddress.substring(0, 30)}...`)
      .addTo(this.map);
    this.markers.push(deliveryMarker);

    // Add current position marker (Blue, animated)
    if (task.currentLocation && task.pickupCoords && task.deliveryCoords) {
      const progressRatio = task.progress / 100;
      const currentLat = task.pickupCoords.lat + (task.deliveryCoords.lat - task.pickupCoords.lat) * progressRatio;
      const currentLng = task.pickupCoords.lng + (task.deliveryCoords.lng - task.pickupCoords.lng) * progressRatio;

      const currentIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #3B82F6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #3B82F6; animation: pulse 1.5s infinite;"></div>`,
        iconSize: [14, 14],
        popupAnchor: [0, -7]
      });

      const currentMarker = L.marker([currentLat, currentLng], { icon: currentIcon })
        .bindPopup(`<strong>🚚 Current Position</strong><br/>${task.progress}% complete`)
        .addTo(this.map);
      this.markers.push(currentMarker);
    }

    // Draw route line
    const routePoints: [number, number][] = [
      [task.pickupCoords.lat, task.pickupCoords.lng],
      [task.deliveryCoords.lat, task.deliveryCoords.lng]
    ];

    this.currentRouteLayer = L.polyline(routePoints, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(this.map);

    // Fit bounds to show both points
    const bounds = L.latLngBounds(routePoints);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  // Map controls
  zoomIn(): void {
    if (this.map) this.map.zoomIn();
  }

  zoomOut(): void {
    if (this.map) this.map.zoomOut();
  }

  centerMap(): void {
    if (this.map && this.selectedTask?.pickupCoords && this.selectedTask?.deliveryCoords) {
      const bounds = L.latLngBounds([
        [this.selectedTask.pickupCoords.lat, this.selectedTask.pickupCoords.lng],
        [this.selectedTask.deliveryCoords.lat, this.selectedTask.deliveryCoords.lng]
      ]);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  calculateStats(activeTrips = 0, totalDistanceKm = 0): void {
    const pendingCount = this.todayDeliveries.filter(t => t.status === 'PENDING').length;
    const inTransitCount = activeTrips || this.todayDeliveries.filter(t => t.status === 'IN_TRANSIT').length;
    const deliveredCount = this.completedToday;
    const totalDistance = totalDistanceKm || this.todayDeliveries.reduce((sum, t) => sum + t.distance, 0);

    this.statsCards = [
      {
        label: 'Total Trips',
        value: this.totalTrips,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
          <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>`),
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        trend: 5
      },
      {
        label: 'Completed',
        value: deliveredCount,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>`),
        color: '#10B981',
        bgColor: '#D1FAE5',
        trend: 12
      },
      {
        label: 'Active',
        value: inTransitCount,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>`),
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        trend: -2
      },
      {
        label: 'Total Distance',
        value: Math.round(totalDistance),
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2">
          <path d="M2 12h20M12 2v20"/>
        </svg>`),
        color: '#8B5CF6',
        bgColor: '#F3E8FF',
        unit: 'km'
      }
    ];
  }

  getFilteredDeliveries(): DeliveryTask[] {
    let filtered = this.todayDeliveries;

    if (this.searchTerm) {
      filtered = filtered.filter(task =>
        task.trackingNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.pickupAddress.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.deliveryAddress.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.filterStatus !== 'ALL') {
      filtered = filtered.filter(task => task.status === this.filterStatus);
    }

    return filtered;
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  onStatusFilter(event: Event): void {
    this.filterStatus = (event.target as HTMLSelectElement).value;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'ALL';
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  selectTask(task: DeliveryTask): void {
    this.selectedTask = task;
    setTimeout(() => {
      if (!this.mapInitialized) {
        this.initMap();
      }
      if (this.map) {
        this.updateMapForTask(task);
        this.map.invalidateSize();
      }
    }, 100);
  }

  startDelivery(task: DeliveryTask): void {
    if (task.status === 'PENDING') {
      this.actionLoading = true;
      this.tripService.startTrip(task.id).subscribe({
        next: () => {
          this.loadDashboardData();
          this.router.navigate(['/agent/live-tracking']);
          this.actionLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to start trip.';
          this.actionLoading = false;
        }
      });
    } else if (task.status === 'IN_TRANSIT') {
      this.router.navigate(['/agent/live-tracking']);
    }
  }

  getTripStatusLabel(task: DeliveryTask): string {
    if (task.tripStatus === 'ACTIVE') return 'ACTIVE';
    if (task.tripStatus === 'COMPLETED') return 'COMPLETED';
    return 'COLLECTING';
  }

  getTripGroups(): Array<{ title: string; items: DeliveryTask[] }> {
    const collecting = this.getFilteredDeliveries().filter((t) => t.tripStatus === 'COLLECTING');
    const active = this.getFilteredDeliveries().filter((t) => t.tripStatus === 'ACTIVE');
    const completed = this.getFilteredDeliveries().filter((t) => t.tripStatus === 'COMPLETED');
    return [
      { title: 'Collecting', items: collecting },
      { title: 'Active', items: active },
      { title: 'Completed', items: completed }
    ];
  }

  canAssignParcels(task: DeliveryTask): boolean {
    return task.tripStatus === 'COLLECTING' && !this.actionLoading;
  }

  canStartTrip(task: DeliveryTask): boolean {
    return task.tripStatus === 'COLLECTING' && !this.actionLoading;
  }

  openTracking(task: DeliveryTask): void {
    this.selectedTask = task;
    this.router.navigate(['/agent/live-tracking']);
  }

  openTripSummary(task: DeliveryTask): void {
    this.selectTask(task);
  }

  openAssignParcels(task: DeliveryTask): void {
    if (!this.canAssignParcels(task)) return;
    this.selectedTripForAssignment = task;
    this.showAssignModal = true;
    this.selectedParcelIds.clear();
    this.availableParcels = [];
    this.actionLoading = true;
    this.tripService.getAvailableParcels(task.id).subscribe({
      next: (parcels) => {
        this.availableParcels = parcels.map((p) => ({
          id: p.id,
          sourceAgencyName: p.sourceAgencyName,
          destAgencyName: p.destAgencyName,
          weight: p.weight,
          fragility: p.fragility
        }));
        this.actionLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load available parcels.';
        this.actionLoading = false;
      }
    });
  }

  closeAssignParcels(): void {
    this.showAssignModal = false;
    this.selectedTripForAssignment = null;
    this.availableParcels = [];
    this.selectedParcelIds.clear();
  }

  toggleParcelSelection(parcelId: string): void {
    if (this.selectedParcelIds.has(parcelId)) {
      this.selectedParcelIds.delete(parcelId);
    } else {
      this.selectedParcelIds.add(parcelId);
    }
  }

  assignSelectedParcels(): void {
    if (!this.selectedTripForAssignment || this.selectedParcelIds.size === 0) return;
    this.actionLoading = true;
    this.tripService.assignParcels(this.selectedTripForAssignment.id, [...this.selectedParcelIds]).subscribe({
      next: () => {
        this.closeAssignParcels();
        this.loadDashboardData();
        this.actionLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to assign selected parcels.';
        this.actionLoading = false;
      }
    });
  }

  getPriorityIcon(priority: string): SafeHtml {
    const icons: any = {
      high: this.sanitizer.bypassSecurityTrustHtml(`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      </svg>`),
      medium: this.sanitizer.bypassSecurityTrustHtml(`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      </svg>`),
      low: this.sanitizer.bypassSecurityTrustHtml(`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      </svg>`)
    };
    return icons[priority] || icons['medium'];
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

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getStarIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`);
  }
}