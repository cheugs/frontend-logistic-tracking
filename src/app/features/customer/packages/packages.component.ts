import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ParcelService } from '../../../shared/services/parcel.service';
import { BottomNavComponent } from '../../../shared/bottom-nav/bottom-nav.component';
import { ParcelSummary, ParcelStatus } from '../../../core/models/parcel.model';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-packages', 
  standalone: true,
  imports: [CommonModule, RouterModule, BottomNavComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.scss']
})
export class PackagesComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly activeTab = signal<'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED'>('IN_TRANSIT');
  protected readonly parcels = signal<ParcelSummary[]>([]);

  protected readonly visibleParcels = computed(() => {
    const tab = this.activeTab();
    const all = [...this.parcels()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    if (tab === 'SCHEDULED') {
      return all.filter(p => p.status === 'PENDING_PAYMENT' || p.status === 'WAITING_FOR_AGENT');
    }

    if (tab === 'IN_TRANSIT') {
      return all.filter(p => p.status === 'IN_TRANSIT');
    }

    return all.filter(p => p.status === 'DELIVERED');
  });

  constructor(private readonly parcelService: ParcelService) {}

  ngOnInit(): void {
    this.loadParcels();
  }

  protected loadParcels(): void {
    this.loading.set(true);
    this.parcelService.getCurrentUserParcels().subscribe({
      next: (data) => {
        this.parcels.set(data);
        this.loading.set(false);
      }
    });
  }

  protected setTab(tab: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED'): void {
    this.activeTab.set(tab);
  }

  protected formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }

  protected trackByParcelId(_index: number, item: ParcelSummary): string {
    return item.id;
  }

  protected openParcel(parcel: ParcelSummary): void {
    window.location.href = `/customer/track-parcel/${parcel.id}`;
  }

  protected isStatus(parcel: ParcelSummary, status: ParcelStatus): boolean {
    return parcel.status === status;
  }
}