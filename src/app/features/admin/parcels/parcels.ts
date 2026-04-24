import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { ParcelAdminService } from '../../../core/services/parcel-admin.service';
import { ParcelStatus, ParcelSummary } from '../../../core/models/parcel.model';
import { inject } from '@angular/core';

interface Parcel {
  id: string;
  trackingNumber: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  weight: number;
  fragilityLevel: number;
  status: ParcelStatus;
  statusColor: string;
  statusBg: string;
  estimatedDelivery: Date;
  createdAt: Date;
  cost: number;
  assignedAgent?: string;
  progress: number;
  currentLocation?: string;
}

interface StatCard {
  label: string;
  value: number;
  icon: SafeHtml;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-admin-parcels',
  standalone: true,
  templateUrl: './parcels.html',
  styleUrls: ['./parcels.css'],
  imports: [CommonModule, FormsModule, SidebarComponent]
})
export class AdminParcelsComponent implements OnInit {
  parcels: Parcel[] = [];
  filteredParcels: Parcel[] = [];
  loading = false;
  errorMessage = '';
  selectedParcel: Parcel | null = null;
  showStatusModal: boolean = false;
  showDetailsModal: boolean = false;
  searchTerm: string = '';
  selectedStatus: string = '';
  selectedFragility: string = '';
  sortBy: string = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  activeTab: string = 'all';

  statusOptions: ParcelStatus[] = ['PENDING_PAYMENT', 'WAITING_FOR_AGENT', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
  fragilityOptions: string[] = ['ALL', 'Low (1-3)', 'Medium (4-7)', 'High (8-10)'];
  statsCards: StatCard[] = [];

  // New status for update
  newStatus: string = '';

  private readonly parcelService = inject(ParcelAdminService);

  constructor(private sanitizer: DomSanitizer) {
    this.calculateStats();
  }

  ngOnInit(): void {
    this.fetchParcels();
  }

  fetchParcels(): void {
    this.loading = true;
    this.errorMessage = '';
    this.parcelService.getAllParcels().subscribe({
      next: (data: ParcelSummary[]) => {
        this.parcels = data.map((p) => this.mapParcel(p));
        this.filterParcels();
        this.calculateStats();
        this.loading = false;
      },
      error: () => {
        this.parcels = [];
        this.filteredParcels = [];
        this.calculateStats();
        this.errorMessage = 'Failed to load parcels. Please try again.';
        this.loading = false;
      }
    });
  }

  private mapParcel(apiParcel: ParcelSummary): Parcel {
    const status = apiParcel.status as ParcelStatus;
    const colors = this.getStatusColors(status);

    return {
      id: apiParcel.id,
      trackingNumber: (apiParcel.reference || apiParcel.id).substring(0, 8).toUpperCase(),
      senderName: 'N/A',
      receiverName: apiParcel.title || 'Unknown',
      origin: 'N/A',
      destination: apiParcel.destination || 'N/A',
      weight: 0,
      fragilityLevel: 1,
      status: status,
      statusColor: colors.color,
      statusBg: colors.bg,
      estimatedDelivery: new Date(apiParcel.estimatedDeliveryTime || apiParcel.createdAt),
      createdAt: new Date(apiParcel.createdAt),
      cost: 0,
      assignedAgent: 'Not assigned',
      progress: this.calculateProgress(status),
      currentLocation: apiParcel.destination || 'In network'
    };
  }

  private calculateProgress(status: ParcelStatus): number {
    switch(status) {
      case 'PENDING_PAYMENT': return 5;
      case 'WAITING_FOR_AGENT': return 25;
      case 'IN_TRANSIT': return 65;
      case 'DELIVERED': return 100;
      case 'CANCELLED': return 0;
      default: return 0;
    }
  }

  private getStatusColors(status: ParcelStatus): { color: string, bg: string } {
    const colors: any = {
      'PENDING_PAYMENT': { color: '#6B7280', bg: '#F3F4F6' },
      'WAITING_FOR_AGENT': { color: '#D97706', bg: '#FFFBEB' },
      'IN_TRANSIT': { color: '#2563EB', bg: '#EFF6FF' },
      'DELIVERED': { color: '#10B981', bg: '#D1FAE5' },
      'CANCELLED': { color: '#EF4444', bg: '#FEE2E2' }
    };
    return colors[status] || colors['PENDING_PAYMENT'];
  }

  calculateStats(): void {
    const averageFragility = this.parcels.length > 0
      ? Math.round(this.parcels.reduce((sum, p) => sum + p.fragilityLevel, 0) / this.parcels.length)
      : 0;
    this.statsCards = [
      {
        label: 'Total Parcels',
        value: this.parcels.length,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>`),
        color: '#3B82F6',
        bgColor: '#EFF6FF'
      },
      {
        label: 'In Transit',
        value: this.parcels.filter(p => p.status === 'IN_TRANSIT').length,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2">
          <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>`),
        color: '#2563EB',
        bgColor: '#DBEAFE'
      },
      {
        label: 'Delivered',
        value: this.parcels.filter(p => p.status === 'DELIVERED').length,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>`),
        color: '#10B981',
        bgColor: '#D1FAE5'
      },
      {
        label: 'Cancelled',
        value: this.parcels.filter(p => p.status === 'CANCELLED').length,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>`),
        color: '#EF4444',
        bgColor: '#FEE2E2'
      },
      {
        label: 'Avg Fragility',
        value: averageFragility,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>`),
        color: '#F59E0B',
        bgColor: '#FEF3C7'
      },
      {
        label: 'Revenue',
        value: this.parcels.reduce((sum, p) => sum + p.cost, 0),
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v20M2 12h20" />
        </svg>`),
        color: '#8B5CF6',
        bgColor: '#F3E8FF'
      }
    ];
  }

  getStatusIcon(status: string): SafeHtml {
    const icons: any = {
      'PENDING_PAYMENT': this.sanitizer.bypassSecurityTrustHtml(`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>`),
      'WAITING_FOR_AGENT': this.sanitizer.bypassSecurityTrustHtml(`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20M2 12h20" />
      </svg>`),
      'IN_TRANSIT': this.sanitizer.bypassSecurityTrustHtml(`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>`),
      'DELIVERED': this.sanitizer.bypassSecurityTrustHtml(`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>`),
      'CANCELLED': this.sanitizer.bypassSecurityTrustHtml(`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>`)
    };
    return icons[status] || icons['PENDING_PAYMENT'];
  }

  filterParcels(): void {
    this.filteredParcels = this.parcels.filter(parcel => {
      const matchesSearch = this.searchTerm === '' ||
        parcel.trackingNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        parcel.senderName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        parcel.receiverName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        parcel.origin.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        parcel.destination.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = this.selectedStatus === '' || this.selectedStatus === 'ALL' ||
        parcel.status === this.selectedStatus;

      let matchesFragility = true;
      if (this.selectedFragility === 'Low (1-3)') {
        matchesFragility = parcel.fragilityLevel >= 1 && parcel.fragilityLevel <= 3;
      } else if (this.selectedFragility === 'Medium (4-7)') {
        matchesFragility = parcel.fragilityLevel >= 4 && parcel.fragilityLevel <= 7;
      } else if (this.selectedFragility === 'High (8-10)') {
        matchesFragility = parcel.fragilityLevel >= 8 && parcel.fragilityLevel <= 10;
      }

      let matchesTab = true;
      if (this.activeTab !== 'all') {
        matchesTab = parcel.status === this.activeTab.toUpperCase();
      }

      return matchesSearch && matchesStatus && matchesFragility && matchesTab;
    });

    this.sortParcels();
  }

  sortParcels(): void {
    this.filteredParcels.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch(this.sortBy) {
        case 'trackingNumber':
          aVal = a.trackingNumber;
          bVal = b.trackingNumber;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'weight':
          aVal = a.weight;
          bVal = b.weight;
          break;
        case 'fragilityLevel':
          aVal = a.fragilityLevel;
          bVal = b.fragilityLevel;
          break;
        case 'cost':
          aVal = a.cost;
          bVal = b.cost;
          break;
        case 'createdAt':
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
          break;
        default:
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
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
    this.filterParcels();
  }

  onStatusFilter(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.filterParcels();
  }

  onFragilityFilter(event: Event): void {
    this.selectedFragility = (event.target as HTMLSelectElement).value;
    this.filterParcels();
  }

  onSortChange(event: Event): void {
    this.sortBy = (event.target as HTMLSelectElement).value;
    this.sortParcels();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortParcels();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedFragility = '';
    this.activeTab = 'all';
    this.filterParcels();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.filterParcels();
  }

  viewParcelDetails(parcel: Parcel): void {
    this.selectedParcel = parcel;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedParcel = null;
  }

  openStatusModal(parcel: Parcel): void {
    this.selectedParcel = parcel;
    this.newStatus = parcel.status;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedParcel = null;
    this.newStatus = '';
  }

  updateParcelStatus(): void {
    if (!this.selectedParcel) return;

    if (this.newStatus === this.selectedParcel.status) {
      this.closeStatusModal();
      return;
    }

    if (this.newStatus === 'CANCELLED') {
      this.parcelService.cancelParcel(this.selectedParcel.id).subscribe({
        next: () => {
          this.fetchParcels();
          this.closeStatusModal();
        },
        error: () => {
          this.errorMessage = 'Failed to cancel parcel. Please retry.';
        }
      });
      return;
    }

    this.errorMessage = 'Only cancellation is currently supported by backend manual status update.';
  }

  deleteParcel(id: string): void {
    // Usually admin wouldn't delete but cancel.
    // Implementation left for consistency if needed.
    if (confirm('Are you sure you want to delete this parcel?')) {
      this.closeDetailsModal();
    }
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'PENDING_PAYMENT': '#6B7280',
      'WAITING_FOR_AGENT': '#D97706',
      'IN_TRANSIT': '#2563EB',
      'DELIVERED': '#10B981',
      'CANCELLED': '#EF4444'
    };
    return colors[status] || '#6B7280';
  }

  getStatusBgColor(status: string): string {
    const colors: any = {
      'PENDING_PAYMENT': '#F3F4F6',
      'WAITING_FOR_AGENT': '#FFFBEB',
      'IN_TRANSIT': '#EFF6FF',
      'DELIVERED': '#D1FAE5',
      'CANCELLED': '#FEE2E2'
    };
    return colors[status] || '#F3F4F6';
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
}
