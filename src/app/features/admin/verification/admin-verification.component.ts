import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../shared/services/user.service';
import { UserResponse } from '../../../core/models/auth.models';
import { User, VerificationStatus } from '../../../core/models/user';

@Component({
  selector: 'app-admin-verification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <header>
        <h1>Agent Verification Hub</h1>
        <p>Review and approve pending delivery agent applications.</p>
      </header>

      <div class="table-container glass-card">
        <table *ngIf="agents().length > 0; else empty">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of agents()">
              <td>{{ a.firstName }} {{ a.lastName }}</td>
              <td>{{ a.email }}</td>
              <td>{{ a.phoneNumber }}</td>
              <td>{{ a.address }}</td>
              <td class="actions">
                <button class="btn-approve" (click)="onVerify(a.userId, 'VERIFIED')">
                  <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-reject" (click)="onVerify(a.userId, 'REJECTED')">
                  <i class="fas fa-times"></i> Reject
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #empty>
          <div class="empty-state">
            <i class="fas fa-user-check"></i>
            <h3>No pending applications</h3>
            <p>All agent accounts have been processed.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 2rem;
      min-height: 100vh;
      background: #f8fafc;
      color: #1e293b;
    }
    header { margin-bottom: 2rem; }
    h1 { color: #1e293b; margin: 0; font-weight: 800; }
    p { opacity: 0.6; }
    .glass-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 1rem; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 0.8rem; text-transform: uppercase; }
    td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .actions { display: flex; gap: 0.5rem; }
    button {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .btn-approve { background: #dcfce7; color: #166534; }
    .btn-approve:hover { background: #bbf7d0; }
    .btn-reject { background: #fee2e2; color: #991b1b; }
    .btn-reject:hover { background: #fecaca; }
    .empty-state { text-align: center; padding: 4rem; opacity: 0.5; }
    .empty-state i { font-size: 3rem; margin-bottom: 1rem; }
  `]
})
export class AdminVerificationComponent implements OnInit {
  private userService = inject(UserService);
  agents = signal<User[]>([]);

  ngOnInit() {
    this.loadPending();
  }

  loadPending() {
    this.userService.getUsersByRole('AGENT').subscribe(data => {
      // Filter for pending agents
      this.agents.set(data.filter(u => u.verificationStatus === 'PENDING'));
    });
  }

  onVerify(userId: string, status: string) {
    this.userService.verifyUser(userId, status as VerificationStatus).subscribe(() => {
      this.loadPending();
    });
  }
}
