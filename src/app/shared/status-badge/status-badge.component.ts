import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParcelStatus } from '../../core/models/parcel.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-badge" [ngClass]="statusClass">{{ label }}</span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }
    .created { background: #e8f1ff; color: #1657c0; }
    .in-transit { background: #fff1d9; color: #8a5300; }
    .delivered { background: #e6f7ee; color: #18794e; }
    .cancelled { background: #fdecec; color: #c03636; }
    .pending { background: #f4f4f7; color: #49495f; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: ParcelStatus;

  get label(): string {
    if (this.status === 'IN_TRANSIT') return 'On Delivery';
    if (this.status === 'DELIVERED') return 'Completed';
    if (this.status === 'PENDING') return 'Pending';
    return this.status.replace('_', ' ');
  }

  get statusClass(): string {
    switch (this.status) {
      case 'CREATED':
        return 'created';
      case 'IN_TRANSIT':
        return 'in-transit';
      case 'DELIVERED':
        return 'delivered';
      case 'CANCELLED':
        return 'cancelled';
      case 'PENDING':
        return 'pending';
      default:
        return 'pending';
    }
  }
}