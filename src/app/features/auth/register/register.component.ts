import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  phoneNumber = '';
  address = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService
  ) {}

  register(): void {
    this.loading = true;
    this.error = '';

    this.auth.register({
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      phoneNumber: this.phoneNumber.trim(),
      address: this.address.trim(),
      password: this.password,
      role: 'CUSTOMER'
    }).subscribe({
      next: () => this.router.navigate(['/customer/dashboard']),
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Registration failed.';
      }
    });
  }
}