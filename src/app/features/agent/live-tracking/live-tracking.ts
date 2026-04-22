import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { SidebarAgentComponent } from '../../../shared/sidebar-agent/sidebar-agent';
import * as L from 'leaflet';

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
  type: 'town' | 'highway' | 'motorway';
  distance: number;
  duration: number;
  startPoint: string;
  endPoint: string;
  color: string;
  icon: SafeHtml;
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
  isTracking: boolean = false;
  isPaused: boolean = false;
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
  
  // Route segments
  routeSegments: RouteSegment[] = [];
  
  // Delivery updates
  deliveryUpdates: DeliveryUpdate[] = [
    { timestamp: new Date('2025-01-21T14:30:00'), location: 'Berlin Central Hub', status: 'Picked Up', message: 'Package picked up from warehouse' },
    { timestamp: new Date('2025-01-21T14:45:00'), location: 'A100 Entrance', status: 'In Transit', message: 'Entered highway' },
    { timestamp: new Date('2025-01-21T15:30:00'), location: 'A9 Motorway', status: 'In Transit', message: 'Making good progress' }
  ];
  
  // GPS simulation
  private simulationInterval: any;
  private progressInterval: number = 1000;
  private progressIncrement: number = 0.5;
  
  // UI state
  selectedSegment: RouteSegment | null = null;
  showSpeedModal: boolean = false;
  customSpeed: number = 45;
  manualLatitude: number = 52.5200;
  manualLongitude: number = 13.4050;
  
  constructor(private sanitizer: DomSanitizer) {
    this.calculateAdjustedSpeed();
    this.initializeRouteSegments();
  }
  
  ngOnInit(): void {
    console.log('Live tracking component initialized');
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
    const progressRatio = this.currentProgress / 100;
    const currentLat = this.pickupCoords.lat + (this.deliveryCoords.lat - this.pickupCoords.lat) * progressRatio;
    const currentLng = this.pickupCoords.lng + (this.deliveryCoords.lng - this.pickupCoords.lng) * progressRatio;
    
    const currentIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #3B82F6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #3B82F6; animation: pulse 1.5s infinite;"></div>`,
      iconSize: [14, 14],
      popupAnchor: [0, -7]
    });
    
    this.currentMarker = L.marker([currentLat, currentLng], { icon: currentIcon })
      .bindPopup(`<strong>🚚 Current Position</strong><br/>${this.currentProgress}% complete<br/>ETA: ${this.formatDuration(this.etaMinutes)}`)
      .addTo(this.map);
    
    // Draw route line
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
    
    // Fit bounds to show route
    const bounds = L.latLngBounds(routePoints);
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
  
  initializeRouteSegments(): void {
    this.routeSegments = [
      { 
        type: 'town', 
        distance: 5, 
        duration: 15, 
        startPoint: 'Berlin Hub', 
        endPoint: 'A100', 
        color: '#10B981', 
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>`)
      },
      { 
        type: 'motorway', 
        distance: 110, 
        duration: 105, 
        startPoint: 'A100', 
        endPoint: 'A9 Munich', 
        color: '#3B82F6', 
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
          <rect x="2" y="7" width="13" height="10" rx="1"/>
          <path d="M15 9h3l3 3v5h-6V9z"/>
          <circle cx="6" cy="19" r="2"/>
          <circle cx="18" cy="19" r="2"/>
        </svg>`)
      },
      { 
        type: 'town', 
        distance: 10, 
        duration: 20, 
        startPoint: 'A9 Munich', 
        endPoint: 'Delivery Location', 
        color: '#10B981', 
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>`)
      }
    ];
  }
  
  ngOnDestroy(): void {
    this.stopSimulation();
    if (this.map) {
      this.map.remove();
    }
  }
  
  calculateAdjustedSpeed(): void {
    this.adjustedSpeed = this.baseSpeed * (1 - this.fragilityLevel / 15);
    if (this.isTracking && !this.isPaused) {
      this.currentSpeed = this.adjustedSpeed;
    }
  }
  
  getControlIcon(type: string): SafeHtml {
    const icons: any = {
      'play': this.sanitizer.bypassSecurityTrustHtml(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>`),
      'pause': this.sanitizer.bypassSecurityTrustHtml(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <rect x="6" y="4" width="4" height="16"/>
        <rect x="14" y="4" width="4" height="16"/>
      </svg>`),
      'reset': this.sanitizer.bypassSecurityTrustHtml(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>`)
    };
    return icons[type] || icons['play'];
  }
  
  startSimulation(): void {
    if (this.isDelivered) return;
    
    this.isTracking = true;
    this.isPaused = false;
    this.currentSpeed = this.adjustedSpeed;
    
    this.simulationInterval = setInterval(() => {
      if (!this.isPaused && this.currentProgress < 100) {
        this.currentProgress += this.progressIncrement;
        this.distanceRemaining = this.totalDistance * (1 - this.currentProgress / 100);
        this.etaMinutes = Math.max(0, Math.round(this.distanceRemaining / this.currentSpeed * 60));
        
        if (this.currentProgress >= 100) {
          this.completeDelivery();
        }
        
        this.updateCurrentPositionOnMap();
      }
    }, this.progressInterval);
  }
  
  pauseSimulation(): void {
    this.isPaused = true;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
  
  resumeSimulation(): void {
    if (!this.isDelivered && this.isPaused) {
      this.isPaused = false;
      this.startSimulation();
    }
  }
  
  stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isTracking = false;
    this.isPaused = false;
  }
  
  resetSimulation(): void {
    this.stopSimulation();
    this.currentProgress = 0;
    this.distanceRemaining = this.totalDistance;
    this.etaMinutes = Math.round(this.totalDistance / this.currentSpeed * 60);
    this.isDelivered = false;
    this.updateCurrentPositionOnMap();
  }
  
  completeDelivery(): void {
    this.stopSimulation();
    this.isDelivered = true;
    this.currentProgress = 100;
    this.distanceRemaining = 0;
    this.etaMinutes = 0;
    this.addUpdate('Delivery Location', 'Delivered', 'Package successfully delivered to customer');
    this.updateCurrentPositionOnMap();
  }
  
  markAsDelivered(): void {
    if (confirm('Mark this delivery as completed?')) {
      this.completeDelivery();
    }
  }
  
  updateManualPosition(): void {
    this.addUpdate('Manual Update', 'Location Updated', `Position set to (${this.manualLatitude}, ${this.manualLongitude})`);
  }
  
  updateSpeed(): void {
    this.currentSpeed = this.customSpeed;
    this.addUpdate('Speed Update', 'Speed Changed', `Delivery speed adjusted to ${this.currentSpeed} km/h`);
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