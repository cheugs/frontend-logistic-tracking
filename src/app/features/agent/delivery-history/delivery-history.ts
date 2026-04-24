import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { SidebarAgentComponent } from '../../../shared/sidebar-agent/sidebar-agent';
import { inject } from '@angular/core';
import { TripService } from '../../../core/services/trip.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { TripResponse } from '../../../core/models/trip.model';

interface CompletedDelivery {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  pickupAddress: string;
  completedAt: Date;
  deliveryTime: number; // in minutes
  distance: number; // in km
  weight: number;
  fragilityLevel: number;
  earnings: number;
  rating: number;
  customerFeedback?: string;
  status: 'DELIVERED' | 'RETURNED';
  proofOfDelivery?: string;
}

interface StatsCard {
  label: string;
  value: number;
  icon: SafeHtml;
  color: string;
  bgColor: string;
  trend?: number;
  unit?: string;
}

@Component({
  selector: 'app-delivery-history',
  standalone: true,
  templateUrl: './delivery-history.html',
  styleUrls: ['./delivery-history.css'],
  imports: [CommonModule, FormsModule, RouterModule, SidebarAgentComponent]
})
export class DeliveryHistoryComponent implements OnInit {
  Math = Math;
  private readonly tripService = inject(TripService);
  private readonly storage = inject(TokenStorageService);

  // Agent info
  agentName = 'Max Klinger';
  agentAvatar = 'MK';
  
  completedDeliveries: CompletedDelivery[] = [];
  loading = false;
  errorMessage = '';

  filteredDeliveries: CompletedDelivery[] = [];
  selectedDelivery: CompletedDelivery | null = null;
  showFeedbackModal: boolean = false;
  
  searchTerm: string = '';
  selectedRating: string = '';
  selectedMonth: string = '';
  sortBy: string = 'completedAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  dateRange: string = 'all';
  
  // Stats
  statsCards: StatsCard[] = [];
  
  // Month options for filter
  monthOptions: string[] = ['ALL', 'January', 'February', 'March', 'April', 'May', 'June'];
  
  constructor(private sanitizer: DomSanitizer) {
    this.calculateStats();
  }
  
  ngOnInit(): void {
    const user = this.storage.getUser();
    if (user) {
      this.agentName = `${user.firstName} ${user.lastName}`.trim();
      this.agentAvatar = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'AG';
    }
    this.fetchCompletedDeliveries();
  }

  fetchCompletedDeliveries(): void {
    const user = this.storage.getUser();
    if (!user) {
      this.errorMessage = 'No authenticated agent found.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.tripService.getAgentTrips(user.userId, 'COMPLETED').subscribe({
      next: (trips: TripResponse[]) => {
        this.completedDeliveries = trips.map((trip) => this.mapTripToCompletedDelivery(trip));
        this.filteredDeliveries = [...this.completedDeliveries];
        this.calculateStats();
        if (!this.selectedDelivery && this.filteredDeliveries.length > 0) {
          this.selectedDelivery = this.filteredDeliveries[0];
        }
        this.loading = false;
      },
      error: () => {
        this.completedDeliveries = [];
        this.filteredDeliveries = [];
        this.calculateStats();
        this.errorMessage = 'Failed to load delivery history.';
        this.loading = false;
      }
    });
  }

  private mapTripToCompletedDelivery(trip: TripResponse): CompletedDelivery {
    const completedAt = trip.startedAt ? new Date(trip.startedAt) : new Date(trip.createdAt);
    const estimatedMinutes = Math.max(10, Math.round((trip.totalDistanceKm / 45) * 60));
    return {
      id: trip.id,
      trackingNumber: trip.id.substring(0, 8).toUpperCase(),
      customerName: 'Agency Transfer',
      customerPhone: 'N/A',
      deliveryAddress: trip.destAgencyName || 'Destination agency',
      pickupAddress: trip.sourceAgencyName || 'Source agency',
      completedAt,
      deliveryTime: estimatedMinutes,
      distance: trip.totalDistanceKm,
      weight: 0,
      fragilityLevel: 1,
      earnings: Math.round((trip.totalDistanceKm * 120) / 100),
      rating: 5,
      customerFeedback: 'Delivery completed successfully.',
      status: 'DELIVERED'
    };
  }
  
  calculateStats(): void {
    const totalDeliveries = this.completedDeliveries.length;
    const totalEarnings = this.completedDeliveries.reduce((sum, d) => sum + d.earnings, 0);
    const avgRating = totalDeliveries > 0
      ? this.completedDeliveries.reduce((sum, d) => sum + d.rating, 0) / totalDeliveries
      : 0;
    const totalDistance = this.completedDeliveries.reduce((sum, d) => sum + d.distance, 0);
    const avgDeliveryTime = totalDeliveries > 0
      ? Math.round(this.completedDeliveries.reduce((sum, d) => sum + d.deliveryTime, 0) / totalDeliveries)
      : 0;
    
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
        bgColor: '#EFF6FF',
        trend: 15
      },
      {
        label: 'Total Earnings',
        value: totalEarnings,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2v20M2 12h20"/>
        </svg>`),
        color: '#10B981',
        bgColor: '#D1FAE5',
        trend: 12
      },
      {
        label: 'Avg Rating',
        value: avgRating,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>`),
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        trend: 5
      },
      {
        label: 'Total Distance',
        value: totalDistance,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2">
          <path d="M2 12h20M12 2v20"/>
        </svg>`),
        color: '#8B5CF6',
        bgColor: '#F3E8FF',
        unit: 'km'
      },
      {
        label: 'Avg Delivery Time',
        value: avgDeliveryTime,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>`),
        color: '#EF4444',
        bgColor: '#FEE2E2',
        unit: 'min'
      }
    ];
  }
  
  filterDeliveries(): void {
    this.filteredDeliveries = this.completedDeliveries.filter(delivery => {
      const matchesSearch = this.searchTerm === '' || 
        delivery.trackingNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        delivery.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        delivery.deliveryAddress.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesRating = this.selectedRating === '' || delivery.rating >= parseInt(this.selectedRating);
      
      let matchesMonth = true;
      if (this.selectedMonth !== '' && this.selectedMonth !== 'ALL') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const deliveryMonth = monthNames[delivery.completedAt.getMonth()];
        matchesMonth = deliveryMonth === this.selectedMonth;
      }
      
      return matchesSearch && matchesRating && matchesMonth;
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
        case 'completedAt':
          aVal = a.completedAt.getTime();
          bVal = b.completedAt.getTime();
          break;
        case 'earnings':
          aVal = a.earnings;
          bVal = b.earnings;
          break;
        case 'rating':
          aVal = a.rating;
          bVal = b.rating;
          break;
        case 'distance':
          aVal = a.distance;
          bVal = b.distance;
          break;
        default:
          aVal = a.completedAt.getTime();
          bVal = b.completedAt.getTime();
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
  
  onRatingFilter(event: Event): void {
    this.selectedRating = (event.target as HTMLSelectElement).value;
    this.filterDeliveries();
  }
  
  onMonthFilter(event: Event): void {
    this.selectedMonth = (event.target as HTMLSelectElement).value;
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
    this.selectedRating = '';
    this.selectedMonth = '';
    this.filterDeliveries();
  }
  
  viewDeliveryDetails(delivery: CompletedDelivery): void {
    this.selectedDelivery = delivery;
  }
  
  closeDetails(): void {
    this.selectedDelivery = null;
  }
  
  viewFeedback(delivery: CompletedDelivery): void {
    this.selectedDelivery = delivery;
    this.showFeedbackModal = true;
  }
  
  closeFeedbackModal(): void {
    this.showFeedbackModal = false;
    this.selectedDelivery = null;
  }
  
  getStarIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`);
  }
  
  getEmptyStarIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`);
  }
  
  getRatingStars(rating: number): string {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += i <= rating ? '★' : '☆';
    }
    return stars;
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
  
  formatCurrency(amount: number): string {
    return `€${amount.toFixed(2)}`;
  }
  
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}m`;
  }
}