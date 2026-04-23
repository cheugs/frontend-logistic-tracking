import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService
  ) {}

  login(): void {
    this.loading = true;
    this.error = '';

    this.auth.login({
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: (res) => this.redirectByRole(res.user.role),
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Invalid credentials.';
      }
    });
  }

  private redirectByRole(role: UserRole): void {
    const route =
      role === 'ADMIN'
        ? '/admin/dashboard'
        : role === 'AGENT'
          ? '/agent/dashboard'
          : '/customer/dashboard';

    this.router.navigate([route]);
  }
}