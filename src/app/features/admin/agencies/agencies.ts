import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import * as L from 'leaflet';
import { AgencyService } from '../../../shared/services/agency.service';
import { Agency, AgencyRequest } from '../../../core/models/agency';
import { inject } from '@angular/core';

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

interface AgencyView {
  id: string;
  name: string;
  country: string;
  town: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  totalParcels?: number;
}

interface NavItem {
  id: string;
  svg: string;
  active?: boolean;
}

@Component({
  selector: 'app-admin-agencies',
  standalone: true,
  templateUrl: './agencies.html',
  styleUrls: ['./agencies.css'],
  imports: [CommonModule, FormsModule, SidebarComponent]
})
export class AdminAgenciesComponent implements OnInit, AfterViewInit {
  private map: any;
  private markers: any[] = [];
  private mapInitialized: boolean = false;
  private readonly agencyService = inject(AgencyService);

  navItems: NavItem[] = [
    {
      id: "grid",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>`
    },
    {
      id: "truck1",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>`
    },
    {
      id: "truck2",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="13" height="10" rx="1" />
              <path d="M15 9h3l3 3v5h-6V9z" />
              <circle cx="6" cy="19" r="2" />
              <circle cx="18" cy="19" r="2" />
            </svg>`
    },
    {
      id: "user",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>`
    },
    {
      id: "chat",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>`
    },
  ];

  agencies: AgencyView[] = [];
  loading = false;
  errorMessage = '';
  saving = false;

  filteredAgencies: AgencyView[] = [];
  selectedAgency: AgencyView | null = null;
  showModal: boolean = false;
  modalMode: 'add' | 'edit' = 'add';
  searchTerm: string = '';
  selectedCountry: string = '';
  selectedStatus: string = '';
  activeTab: string = 'agencies';

  formData: Partial<AgencyView> = {
    name: '',
    country: '',
    town: '',
    address: '',
    latitude: 0,
    longitude: 0,
    phone: '',
    email: '',
    status: 'active'
  };

  countries: string[] = ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Switzerland'];
  statuses: string[] = ['active', 'inactive'];

  stats = {
    totalAgencies: 0,
    activeAgencies: 0,
    totalParcelsHandled: 0,
    averageParcelsPerAgency: 0
  };

  constructor() {}

  ngOnInit(): void {
    this.retryFetchAgencies();
  }

  private fetchAgencies(): void {
    this.loading = true;
    this.errorMessage = '';
    this.agencyService.getAllAgencies().subscribe({
      next: (agencies: Agency[]) => {
        this.agencies = agencies.map((agency) => this.toAgencyView(agency));
        this.filteredAgencies = [...this.agencies];
        this.calculateStats();
        if (this.mapInitialized) {
          this.addMarkersToMap();
        }
        if (this.activeTab === 'map' && this.map) {
          setTimeout(() => this.map.invalidateSize(), 50);
        }
        this.loading = false;
      },
      error: () => {
        this.agencies = [];
        this.filteredAgencies = [];
        this.calculateStats();
        this.errorMessage = 'Failed to load agencies. Please try again.';
        this.loading = false;
      }
    });
  }

  retryFetchAgencies(): void {
    this.fetchAgencies();
  }

  private toAgencyView(agency: Agency): AgencyView {
    return {
      id: agency.id,
      name: agency.name,
      country: agency.country,
      town: agency.town,
      address: agency.addressLine,
      latitude: agency.latitude,
      longitude: agency.longitude,
      phone: 'N/A',
      email: 'N/A',
      status: 'active',
      createdAt: agency.createdAt ? new Date(agency.createdAt) : new Date(),
      totalParcels: 0
    };
  }

  ngAfterViewInit(): void {
    // Don't initialize map here since container might not be visible
    // Map will be initialized when tab is clicked
  }

  private initMap(): void {
    if (this.mapInitialized) return;
    
    const mapElement = document.getElementById('agencyMap');
    if (!mapElement) return;

    // Initialize map centered on Germany
    this.map = L.map('agencyMap').setView([51.1657, 10.4515], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 3
    }).addTo(this.map);

    this.mapInitialized = true;
    this.addMarkersToMap();
  }

  private addMarkersToMap(): void {
    if (!this.map) return;
    
    // Clear existing markers
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Add markers for each agency
    this.agencies.forEach(agency => {
      const markerColor = agency.status === 'active' ? '#10B981' : '#EF4444';
      
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
        iconSize: [12, 12],
        popupAnchor: [0, -6]
      });

      const marker = L.marker([agency.latitude, agency.longitude], { icon: customIcon })
        .bindPopup(`
          <div style="font-family: 'DM Sans', sans-serif; min-width: 200px;">
            <strong style="color: ${markerColor};">🏢 ${agency.name}</strong><br/>
            📍 ${agency.address}<br/>
            📞 ${agency.phone}<br/>
            ✉️ ${agency.email}<br/>
            <span style="font-size: 11px; color: #6B7280;">Status: ${agency.status.toUpperCase()} | Parcels: ${agency.totalParcels || 0}</span>
          </div>
        `)
        .addTo(this.map);
      
      this.markers.push(marker);
    });

    // Fit map to show all markers
    if (this.agencies.length > 0 && this.map) {
      const bounds = L.latLngBounds(this.agencies.map(a => [a.latitude, a.longitude]));
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  updateMapFilters(): void {
    if (!this.map) return;
    
    // Filter markers based on current filters
    const filteredAgencies = this.agencies.filter(agency => {
      const matchesSearch = this.searchTerm === '' || 
        agency.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        agency.town.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCountry = this.selectedCountry === '' || agency.country === this.selectedCountry;
      const matchesStatus = this.selectedStatus === '' || agency.status === this.selectedStatus;
      
      return matchesSearch && matchesCountry && matchesStatus;
    });

    // Update markers visibility
    this.markers.forEach((marker, index) => {
      const agency = this.agencies[index];
      const isVisible = filteredAgencies.some(f => f.id === agency.id);
      if (isVisible) {
        this.map.addLayer(marker);
      } else {
        this.map.removeLayer(marker);
      }
    });

    // Fit bounds to visible markers
    if (filteredAgencies.length > 0 && this.map) {
      const bounds = L.latLngBounds(filteredAgencies.map(a => [a.latitude, a.longitude]));
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  calculateStats(): void {
    this.stats.totalAgencies = this.agencies.length;
    this.stats.activeAgencies = this.agencies.filter(a => a.status === 'active').length;
    this.stats.totalParcelsHandled = this.agencies.reduce((sum, a) => sum + (a.totalParcels || 0), 0);
    this.stats.averageParcelsPerAgency = this.stats.totalAgencies > 0
      ? Math.round(this.stats.totalParcelsHandled / this.stats.totalAgencies)
      : 0;
  }

  filterAgencies(): void {
    this.filteredAgencies = this.agencies.filter(agency => {
      const matchesSearch = this.searchTerm === '' || 
        agency.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        agency.town.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        agency.address.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCountry = this.selectedCountry === '' || agency.country === this.selectedCountry;
      const matchesStatus = this.selectedStatus === '' || agency.status === this.selectedStatus;
      
      return matchesSearch && matchesCountry && matchesStatus;
    });
    
    // Update map when filters change
    if (this.activeTab === 'map' && this.map) {
      this.updateMapFilters();
    }
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterAgencies();
  }

  onCountryFilter(event: Event): void {
    this.selectedCountry = (event.target as HTMLSelectElement).value;
    this.filterAgencies();
  }

  onStatusFilter(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.filterAgencies();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCountry = '';
    this.selectedStatus = '';
    this.filterAgencies();
  }

  openAddModal(): void {
    this.modalMode = 'add';
    this.formData = {
      name: '',
      country: '',
      town: '',
      address: '',
      latitude: 0,
      longitude: 0,
      phone: '',
      email: '',
      status: 'active'
    };
    this.showModal = true;
  }

  openEditModal(agency: AgencyView): void {
    this.modalMode = 'edit';
    this.formData = { ...agency };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedAgency = null;
  }

  saveAgency(): void {
    this.errorMessage = '';
    if (this.modalMode === 'add') {
      const request: AgencyRequest = {
        name: this.formData.name || '',
        country: this.formData.country || '',
        town: this.formData.town || '',
        addressLine: this.formData.address || '',
        latitude: this.formData.latitude ?? 0,
        longitude: this.formData.longitude ?? 0
      };
      this.saving = true;
      this.agencyService.createAgency(request).subscribe({
        next: (agency) => {
          this.agencies.unshift(this.toAgencyView(agency));
          this.calculateStats();
          this.filterAgencies();
          if (this.mapInitialized) {
            this.addMarkersToMap();
          }
          this.saving = false;
          this.closeModal();
        },
        error: () => {
          this.errorMessage = 'Failed to create agency. Please verify fields and retry.';
          this.saving = false;
        }
      });
      return;
    } else if (this.modalMode === 'edit') {
      if (!this.formData.id) {
        this.closeModal();
        return;
      }
      const index = this.agencies.findIndex((a) => a.id === this.formData.id);
      if (index !== -1) {
        this.agencies[index] = {
          ...this.agencies[index],
          name: this.formData.name || this.agencies[index].name,
          country: this.formData.country || this.agencies[index].country,
          town: this.formData.town || this.agencies[index].town,
          address: this.formData.address || this.agencies[index].address,
          latitude: this.formData.latitude ?? this.agencies[index].latitude,
          longitude: this.formData.longitude ?? this.agencies[index].longitude,
          phone: this.formData.phone || this.agencies[index].phone,
          email: this.formData.email || this.agencies[index].email,
          status: (this.formData.status as 'active' | 'inactive') || this.agencies[index].status
        };
        this.calculateStats();
        this.filterAgencies();
        if (this.mapInitialized) {
          this.addMarkersToMap();
        }
      }
      this.closeModal();
      return;
    }
  }

  deleteAgency(id: string): void {
    if (confirm('Are you sure you want to delete this agency?')) {
      this.agencies = this.agencies.filter(a => a.id !== id);
      this.calculateStats();
      this.filterAgencies();
      if (this.mapInitialized) {
        this.addMarkersToMap();
      }
      
      if (this.selectedAgency?.id === id) {
        this.selectedAgency = null;
      }
    }
  }

  viewAgencyDetails(agency: AgencyView): void {
    this.selectedAgency = agency;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'map') {
      setTimeout(() => {
        if (!this.mapInitialized) {
          this.initMap();
        } else if (this.map) {
          this.map.invalidateSize();
          this.updateMapFilters();
        }
      }, 100);
    }
  }

  getStatusColor(status: string): string {
    return status === 'active' ? '#10B981' : '#EF4444';
  }

  getStatusBgColor(status: string): string {
    return status === 'active' ? '#D1FAE5' : '#FEE2E2';
  }

  getCountryDistribution(): { name: string; count: number; percentage: number }[] {
    const countryMap = new Map<string, number>();
    this.agencies.forEach(agency => {
      countryMap.set(agency.country, (countryMap.get(agency.country) || 0) + 1);
    });
    
    const total = this.agencies.length;
    return Array.from(countryMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Map controls
  zoomIn(): void {
    if (this.map) {
      this.map.zoomIn();
    }
  }

  zoomOut(): void {
    if (this.map) {
      this.map.zoomOut();
    }
  }

  centerMap(): void {
    if (this.map && this.agencies.length > 0) {
      const bounds = L.latLngBounds(this.agencies.map(a => [a.latitude, a.longitude]));
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}