import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AccountService } from '../../../shared/services/account.service';
import { CustomerAccount } from '../../../core/models/account.model';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);

  protected readonly loading = signal(true);
  protected readonly editing = signal(false);
  protected readonly saveMessage = signal('');

  protected readonly accountForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    address: ['', [Validators.required]]
  });

  protected readonly account = signal<CustomerAccount | null>(null);

  constructor() {}

  ngOnInit(): void {
    this.loadAccount();
  }

  protected loadAccount(): void {
    this.loading.set(true);
    this.accountService.getAccount().subscribe({
      next: (data) => {
        this.account.set(data);
        this.accountForm.patchValue({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          city: data.city,
          state: data.state,
          address: data.address
        });
        this.loading.set(false);
      }
    });
  }

  protected enableEdit(): void {
    this.editing.set(true);
    this.saveMessage.set('');
  }

  protected cancelEdit(): void {
    const current = this.account();
    if (!current) return;

    this.accountForm.patchValue({
      firstName: current.firstName,
      lastName: current.lastName,
      email: current.email,
      phone: current.phone,
      city: current.city,
      state: current.state,
      address: current.address
    });

    this.editing.set(false);
  }

  protected saveAccount(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const current = this.account();
    if (!current) return;

    const formValue = this.accountForm.getRawValue();
    const payload: CustomerAccount = {
      ...current,
      ...formValue,
      avatarInitials: current.avatarInitials
    };

    this.accountService.updateAccount(payload).subscribe({
      next: (updated) => {
        this.account.set(updated);
        this.accountForm.patchValue({
          firstName: updated.firstName,
          lastName: updated.lastName,
          email: updated.email,
          phone: updated.phone,
          city: updated.city,
          state: updated.state,
          address: updated.address
        });
        this.editing.set(false);
        this.saveMessage.set('Account updated successfully.');
      }
    });
  }

  protected goToDashboard(): void {
    this.router.navigate(['/customer/dashboard']);
  }
}
