import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { SidebarAgentComponent } from '../../../shared/sidebar-agent/sidebar-agent';
import * as L from 'leaflet';
import { TripService } from '../../../core/services/trip.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { TripResponse, TripStatus } from '../../../core/models/trip.model';
import { inject, OnDestroy } from '@angular/core';
import { interval, startWith, Subject, switchMap, takeUntil } from 'rxjs';

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
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  statusColor: string;
  statusBg: string;
  fragilityLevel: number;
  weight: number;
  distance: number;
  estimatedTime: string;
  progress: number;
  currentLocation?: string;
  priority: 'high' | 'medium' | 'low';
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
  totalDeliveries = 1240;

  // Today's deliveries
  todayDeliveries: DeliveryTask[] = [];

  private readonly tripService = inject(TripService);
  private readonly storage = inject(TokenStorageService);

  constructor(private sanitizer: DomSanitizer) {
    const user = this.storage.getUser();
    if (user) {
      this.agentName = user.email;
      this.agentAvatar = user.email.substring(0, 2).toUpperCase();
    }
    this.calculateStats();
  }

  ngOnInit(): void {
    this.fetchTrips();
  }

  fetchTrips(): void {
    const user = this.storage.getUser();
    if (!user) return;

    interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => this.tripService.getAgentTrips(user.userId)),
        takeUntil(this.destroy$)
      )
      .subscribe((data: TripResponse[]) => {
        this.todayDeliveries = data.map(t => this.mapTripToTask(t));
        this.calculateStats();

        if (this.todayDeliveries.length > 0 && !this.selectedTask) {
          this.selectTask(this.todayDeliveries[0]);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private mapTripToTask(trip: TripResponse): DeliveryTask {
    const status = this.mapTripStatus(trip.status);
    const colors = this.getStatusColors(status);
    const reachedSegments = trip.segments.filter(s => s.status === 'REACHED').length;
    const progress = trip.status === 'COMPLETED' ? 100 : Math.round((reachedSegments / trip.segmentCount) * 100);

    return {
      id: trip.id,
      trackingNumber: trip.id.substring(0, 8).toUpperCase(),
      pickupAddress: trip.sourceAgencyName || 'Origin Agency',
      deliveryAddress: trip.destAgencyName || 'Destination Agency',
      customerName: 'Agency Transfer',
      customerPhone: 'N/A',
      status: status,
      statusColor: colors.color,
      statusBg: colors.bg,
      fragilityLevel: 1,
      weight: 0,
      distance: trip.totalDistanceKm,
      estimatedTime: trip.status === 'COMPLETED' ? 'Finished' : 'In Progress',
      progress: progress,
      priority: 'medium',
      pickupCoords: { lat: trip.segments[0].latitude, lng: trip.segments[0].longitude },
      deliveryCoords: { lat: trip.segments[trip.segments.length - 1].latitude, lng: trip.segments[trip.segments.length - 1].longitude }
    };
  }

  private mapTripStatus(status: TripStatus): 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' {
    switch (status) {
      case 'COLLECTING':
      case 'WAITING': return 'PENDING';
      case 'IN_PROGRESS': return 'IN_TRANSIT';
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
      .bindPopup(`<strong>📍 Delivery</strong><br/>${task.deliveryAddress.substring(0, 30)}...<br/>Customer: ${task.customerName}`)
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

  calculateStats(): void {
    const pendingCount = this.todayDeliveries.filter(t => t.status === 'PENDING').length;
    const inTransitCount = this.todayDeliveries.filter(t => t.status === 'IN_TRANSIT').length;
    const deliveredCount = this.completedToday;
    const totalDistance = this.todayDeliveries.reduce((sum, t) => sum + t.distance, 0);

    this.statsCards = [
      {
        label: 'Today\'s Deliveries',
        value: this.todayDeliveries.length,
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
        label: 'In Progress',
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
        task.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
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
      this.tripService.startTrip(task.id).subscribe(() => {
        this.fetchTrips();
      });
    } else if (task.status === 'IN_TRANSIT') {
      console.log('Continuing delivery for trip', task.id);
    }
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