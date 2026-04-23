import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TokenStorageService } from '../../../core/services/token-storage.service';

@Component({
  selector: 'app-verification-pending',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="pending-container">
      <div class="glass-card">
        <div class="status-icon">
          <i class="fas fa-user-clock"></i>
        </div>
        <h1>Verification Pending</h1>
        <p class="subtitle">Your agent account is currently being reviewed by our administration team.</p>
        
        <div class="info-list">
          <div class="info-item">
            <i class="fas fa-shield-alt"></i>
            <span>This normally takes 12-24 hours.</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>We will email you once approved.</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn-refresh" (click)="onRefresh()">Check Status</button>
          <button class="btn-logout" (click)="onLogout()">Logout</button>
        </div>

        <div class="support-footer">
          Need help? <a href="mailto:support@logistics.com">Contact Support</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pending-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top right, #1a1a2e, #16213e);
      color: white;
      padding: 2rem;
    }
    .glass-card {
      max-width: 500px;
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 32px;
      padding: 3rem;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    }
    .status-icon {
      font-size: 4rem;
      color: #F59E0B;
      margin-bottom: 2rem;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
    h1 { font-size: 2.2rem; color: #F59E0B; margin: 0; }
    .subtitle { opacity: 0.6; margin-top: 1rem; line-height: 1.6; }
    .info-list {
      margin: 2.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      text-align: left;
      background: rgba(255, 255, 255, 0.03);
      padding: 1.5rem;
      border-radius: 16px;
    }
    .info-item { display: flex; align-items: center; gap: 1rem; font-size: 0.9rem; opacity: 0.8; }
    .info-item i { color: #F59E0B; width: 20px; }
    .actions { display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; }
    .btn-refresh {
      background: #F59E0B;
      color: #1a1a2e;
      border: none;
      padding: 1.2rem;
      border-radius: 12px;
      font-weight: 800;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-refresh:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); }
    .btn-logout {
      background: transparent;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 1rem;
      border-radius: 12px;
      cursor: pointer;
    }
    .support-footer { margin-top: 2rem; font-size: 0.8rem; opacity: 0.4; }
    .support-footer a { color: #F59E0B; text-decoration: none; font-weight: bold; }
  `]
})
export class VerificationPendingComponent {
  private storage = inject(TokenStorageService);
  private router = inject(Router);

  onRefresh() {
    // In a real app, this would call a "me" endpoint to refresh user data
    // For demo, we'll just reload the page to re-trigger the guard
    window.location.reload();
  }

  onLogout() {
    this.storage.clear();
    this.router.navigate(['/login']);
  }
}
