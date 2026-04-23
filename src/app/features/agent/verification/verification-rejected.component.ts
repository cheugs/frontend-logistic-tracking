import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TokenStorageService } from '../../../core/services/token-storage.service';

@Component({
  selector: 'app-verification-rejected',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="rejected-container">
      <div class="glass-card">
        <div class="status-icon">
          <i class="fas fa-user-times"></i>
        </div>
        <h1>Application Declined</h1>
        <p class="subtitle">Unfortunately, your agent application could not be approved at this time.</p>
        
        <div class="reason-box">
          <h3>Common reasons for rejection:</h3>
          <ul>
            <li>Incomplete background check data.</li>
            <li>Inconsistent identification documents.</li>
            <li>Restricted operational region.</li>
          </ul>
        </div>

        <div class="actions">
          <button class="btn-appeal" (click)="onAppeal()">Appeal Decision</button>
          <button class="btn-logout" (click)="onLogout()">Logout</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rejected-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a2e;
      color: white;
      padding: 2rem;
    }
    .glass-card {
      max-width: 500px;
      width: 100%;
      background: rgba(233, 69, 96, 0.05);
      border: 1px solid rgba(233, 69, 96, 0.2);
      border-radius: 32px;
      padding: 3rem;
      text-align: center;
    }
    .status-icon { font-size: 4rem; color: #e94560; margin-bottom: 2rem; }
    h1 { font-size: 2.2rem; color: #e94560; margin: 0; }
    .subtitle { opacity: 0.6; margin-top: 1rem; }
    .reason-box {
      margin: 2rem 0;
      text-align: left;
      background: rgba(0, 0, 0, 0.2);
      padding: 1.5rem;
      border-radius: 16px;
    }
    .reason-box h3 { font-size: 1rem; margin-top: 0; opacity: 0.8; }
    ul { font-size: 0.9rem; opacity: 0.6; padding-left: 1.5rem; margin-bottom: 0; }
    .actions { display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; }
    .btn-appeal {
      background: #e94560;
      color: white;
      border: none;
      padding: 1.2rem;
      border-radius: 12px;
      font-weight: 800;
      cursor: pointer;
    }
    .btn-logout {
      background: transparent;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 1rem;
      border-radius: 12px;
      cursor: pointer;
    }
  `]
})
export class VerificationRejectedComponent {
  private storage = inject(TokenStorageService);
  private router = inject(Router);

  onAppeal() {
    alert('Appeal submitted! Our team will contact you.');
  }

  onLogout() {
    this.storage.clear();
    this.router.navigate(['/login']);
  }
}
