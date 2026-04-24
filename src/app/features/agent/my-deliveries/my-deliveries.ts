import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule, Router } from '@angular/router';
import { SidebarAgentComponent } from '../../../shared/sidebar-agent/sidebar-agent';
import { TripService } from '../../../core/services/trip.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { TripResponse, TripStatus } from '../../../core/models/trip.model';
import { inject } from '@angular/core';

interface DeliveryTask {
  id: string;
  tripStatus: TripStatus;
  trackingNumber: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  statusColor: string;
  statusBg: string;
  fragilityLevel: number;
  weight: number;
  distance: number;
  estimatedTime: string;
  progress: number;
  priority: 'high' | 'medium' | 'low';
  scheduledTime?: Date;
  specialInstructions?: string;
}

interface StatCard {
  label: string;
  value: number;
  icon: SafeHtml;
  color: string;
  bgColor: string;
  trend?: number;
}

@Component({
  selector: 'app-my-deliveries',
  standalone: true,
  templateUrl: './my-deliveries.html',
  styleUrls: ['./my-deliveries.css'],
  imports: [CommonModule, FormsModule, RouterModule, SidebarAgentComponent]
})
export class MyDeliveriesComponent implements OnInit {
  Math = Math;
  private readonly tripService = inject(TripService);
  private readonly storage = inject(TokenStorageService);
  
  // Agent information
  agentName = 'Max Klinger';
  agentAvatar = 'MK';
  
  deliveries: DeliveryTask[] = [];
  loading = false;
  errorMessage = '';

  filteredDeliveries: DeliveryTask[] = [];
  selectedDelivery: DeliveryTask | null = null;
  showInstructionsModal: boolean = false;
  
  searchTerm: string = '';
  filterStatus: string = 'ALL';
  filterPriority: string = 'ALL';
  sortBy: string = 'scheduledTime';
  sortOrder: 'asc' | 'desc' = 'asc';
  activeTab: 'ALL' | TripStatus = 'ALL';
  
  // Stats
  statsCards: StatCard[] = [];
  
  constructor(private sanitizer: DomSanitizer, private router: Router) {
    this.calculateStats();
  }
  
  ngOnInit(): void {
    const user = this.storage.getUser();
    if (user) {
      this.agentName = `${user.firstName} ${user.lastName}`.trim();
      this.agentAvatar = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'AG';
    }
    this.fetchDeliveries();
  }

  fetchDeliveries(): void {
    const user = this.storage.getUser();
    if (!user) {
      this.errorMessage = 'No authenticated agent found.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.tripService.getAgentTrips(user.userId).subscribe({
      next: (trips: TripResponse[]) => {
        this.deliveries = trips.map((trip) => this.mapTripToDelivery(trip));
        this.filteredDeliveries = [...this.deliveries];
        this.calculateStats();
        if (!this.selectedDelivery && this.filteredDeliveries.length > 0) {
          this.selectedDelivery = this.filteredDeliveries[0];
        }
        this.loading = false;
      },
      error: () => {
        this.deliveries = [];
        this.filteredDeliveries = [];
        this.calculateStats();
        this.errorMessage = 'Failed to load deliveries.';
        this.loading = false;
      }
    });
  }

  private mapTripToDelivery(trip: TripResponse): DeliveryTask {
    const mappedStatus = this.mapTripStatus(trip.status);
    const statusColors = this.getStatusColors(mappedStatus);
    const reachedSegments = trip.segments.filter((s) => s.status === 'REACHED').length;
    const progress = trip.status === 'COMPLETED' ? 100 : Math.round((reachedSegments / Math.max(1, trip.segmentCount)) * 100);
    return {
      id: trip.id,
      tripStatus: trip.status,
      trackingNumber: trip.id.substring(0, 8).toUpperCase(),
      customerName: 'Agency Transfer',
      customerPhone: 'N/A',
      pickupAddress: trip.sourceAgencyName || 'Source agency',
      deliveryAddress: trip.destAgencyName || 'Destination agency',
      status: mappedStatus,
      statusColor: statusColors.color,
      statusBg: statusColors.bg,
      fragilityLevel: 1,
      weight: 0,
      distance: trip.totalDistanceKm,
      estimatedTime: trip.status === 'COMPLETED' ? 'Completed' : 'In progress',
      progress,
      priority: 'medium',
      scheduledTime: new Date(trip.createdAt)
    };
  }

  private mapTripStatus(status: TripStatus): 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' {
    if (status === 'ACTIVE') return 'IN_TRANSIT';
    if (status === 'COMPLETED') return 'DELIVERED';
    return 'PENDING';
  }

  private getStatusColors(status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED'): { color: string; bg: string } {
    if (status === 'IN_TRANSIT') return { color: '#2563EB', bg: '#EFF6FF' };
    if (status === 'DELIVERED') return { color: '#10B981', bg: '#D1FAE5' };
    return { color: '#D97706', bg: '#FFFBEB' };
  }

  getTripStatusLabel(delivery: DeliveryTask): string {
    if (delivery.tripStatus === 'ACTIVE') return 'ACTIVE';
    if (delivery.tripStatus === 'COMPLETED') return 'COMPLETED';
    return 'COLLECTING';
  }
  
  calculateStats(): void {
    const totalDeliveries = this.deliveries.length;
    const pendingCount = this.deliveries.filter(d => d.status === 'PENDING').length;
    const inTransitCount = this.deliveries.filter(d => d.status === 'IN_TRANSIT').length;
    const highPriorityCount = this.deliveries.filter(d => d.priority === 'high').length;
    
    this.statsCards = [
      {
        label: 'Total Deliveries',
        value: totalDeliveries,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
          <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>`),
        color: '#3B82F6',
        bgColor: '#EFF6FF'
      },
      {
        label: 'Pending',
        value: pendingCount,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>`),
        color: '#F59E0B',
        bgColor: '#FEF3C7'
      },
      {
        label: 'In Transit',
        value: inTransitCount,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
          <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>`),
        color: '#10B981',
        bgColor: '#D1FAE5'
      },
      {
        label: 'High Priority',
        value: highPriorityCount,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        </svg>`),
        color: '#EF4444',
        bgColor: '#FEE2E2'
      }
    ];
  }
  
  filterDeliveries(): void {
    this.filteredDeliveries = this.deliveries.filter(delivery => {
      const matchesSearch = this.searchTerm === '' || 
        delivery.trackingNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        delivery.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        delivery.deliveryAddress.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.filterStatus === 'ALL' || delivery.status === this.filterStatus;
      const matchesPriority = this.filterPriority === 'ALL' || delivery.priority === this.filterPriority;
      const matchesTab = this.activeTab === 'ALL' || delivery.tripStatus === this.activeTab;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesTab;
    });
    
    this.sortDeliveries();
  }
  
  sortDeliveries(): void {
    this.filteredDeliveries.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch(this.sortBy) {
        case 'trackingNumber':
          aVal = a.trackingNumber;
          bVal = b.trackingNumber;
          break;
        case 'customerName':
          aVal = a.customerName;
          bVal = b.customerName;
          break;
        case 'distance':
          aVal = a.distance;
          bVal = b.distance;
          break;
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          aVal = priorityOrder[a.priority];
          bVal = priorityOrder[b.priority];
          break;
        case 'scheduledTime':
          aVal = a.scheduledTime?.getTime() || 0;
          bVal = b.scheduledTime?.getTime() || 0;
          break;
        default:
          aVal = a.scheduledTime?.getTime() || 0;
          bVal = b.scheduledTime?.getTime() || 0;
      }
      
      if (this.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }
  
  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterDeliveries();
  }
  
  onStatusFilter(event: Event): void {
    this.filterStatus = (event.target as HTMLSelectElement).value;
    this.filterDeliveries();
  }
  
  onPriorityFilter(event: Event): void {
    this.filterPriority = (event.target as HTMLSelectElement).value;
    this.filterDeliveries();
  }
  
  onSortChange(event: Event): void {
    this.sortBy = (event.target as HTMLSelectElement).value;
    this.sortDeliveries();
  }
  
  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortDeliveries();
  }
  
  clearFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'ALL';
    this.filterPriority = 'ALL';
    this.activeTab = 'ALL';
    this.filterDeliveries();
  }
  
  setActiveTab(tab: 'ALL' | TripStatus): void {
    this.activeTab = tab;
    this.filterDeliveries();
  }
  
  selectDelivery(delivery: DeliveryTask): void {
    this.selectedDelivery = delivery;
  }
  
  startDelivery(delivery: DeliveryTask): void {
    if (delivery.status === 'PENDING') {
      this.tripService.startTrip(delivery.id).subscribe({
        next: () => {
          this.fetchDeliveries();
          this.router.navigate(['/agent/live-tracking']);
        },
        error: () => {
          this.errorMessage = 'Failed to start delivery.';
        }
      });
      return;
    }
    this.router.navigate(['/agent/live-tracking']);
  }

  getDeliveryActionLabel(delivery: DeliveryTask): string {
    if (delivery.tripStatus === 'ACTIVE') return 'Continue Delivery';
    if (delivery.tripStatus === 'COMPLETED') return 'View Trip';
    return 'Start Delivery';
  }
  
  viewInstructions(delivery: DeliveryTask): void {
    this.selectedDelivery = delivery;
    this.showInstructionsModal = true;
  }
  
  closeInstructionsModal(): void {
    this.showInstructionsModal = false;
    this.selectedDelivery = null;
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
  
  getPriorityText(priority: string): string {
    switch(priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Medium';
    }
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
  
  formatTime(date?: Date): string {
    if (!date) return 'Not scheduled';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  formatDate(date?: Date): string {
    if (!date) return 'Not scheduled';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}