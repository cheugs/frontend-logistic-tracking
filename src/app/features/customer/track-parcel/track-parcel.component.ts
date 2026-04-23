import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TrackParcelService } from '../../../shared/services/track-parcel.service';
import { ParcelRoute } from '../../../core/models/track-parcel.model';

@Component({
  selector: 'app-track-parcel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './track-parcel.html',
  styleUrls: ['./track-parcel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackParcelComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly parcels = signal<ParcelRoute[]>([]);
  protected readonly activeParcelId = signal<string>('');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly trackService: TrackParcelService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') ?? '';
      this.activeParcelId.set(id);
      this.loadRoutes(id || undefined);
    });
  }

  protected loadRoutes(id?: string): void {
    this.loading.set(true);
    this.trackService.getRoute(id).subscribe({
      next: (data) => {
        this.parcels.set(data);
        this.loading.set(false);
      }
    });
  }

  protected formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }
}