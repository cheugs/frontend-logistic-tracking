import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { UserService } from '../../../shared/services/user.service';
import { User as ApiUser, VerificationStatus } from '../../../core/models/user';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SignupRequest } from '../../../core/models/auth.models';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN';
  status: 'active' | 'inactive' | 'suspended';
  avatar: string;
  phone: string;
  address: string;
  createdAt: Date;
  lastLogin: Date;
  totalDeliveries?: number;
  rating?: number;
  assignedParcels?: number;
  department?: string;
}

interface StatCard {
  label: string;
  value: number;
  icon: SafeHtml;
  color: string;
  bgColor: string;
  trend?: number;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
  imports: [CommonModule, FormsModule, SidebarComponent]
})
export class AdminUsersComponent implements OnInit {
  Math = Math;
  private readonly userService = inject(UserService);
  private readonly http = inject(HttpClient);

  users: User[] = [];
  loading = false;
  saving = false;
  errorMessage = '';

  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  showDetailsModal: boolean = false;
  showRoleModal: boolean = false;
  showAddUserModal: boolean = false;
  searchTerm: string = '';
  selectedRole: string = '';
  selectedStatus: string = '';
  sortBy: string = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  activeView: string = 'list';

  // Role options
  roleOptions: string[] = ['ALL', 'CUSTOMER', 'AGENT', 'ADMIN'];
  statusOptions: string[] = ['ALL', 'active', 'inactive', 'suspended'];

  // New role for update
  newRole: string = '';

  // Add User Modal properties
  newUser = {
    name: '',
    email: '',
    phone: '',
    role: 'CUSTOMER',
    status: 'active',
    address: '',
    department: ''
  };

  // Stats
  statsCards: StatCard[] = [];

  constructor(private sanitizer: DomSanitizer) {
    this.calculateStats();
  }

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.userService.getAllUsers().subscribe({
      next: (users: ApiUser[]) => {
        this.users = users.map((user) => this.mapApiUserToView(user));
        this.filteredUsers = [...this.users];
        this.calculateStats();
        this.loading = false;
      },
      error: () => {
        this.users = [];
        this.filteredUsers = [];
        this.calculateStats();
        this.errorMessage = 'Failed to load users. Please try again.';
        this.loading = false;
      }
    });
  }

  private mapApiUserToView(user: ApiUser): User {
    return {
      id: user.userId,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      status: this.mapVerificationStatusToUiStatus(user.verificationStatus),
      avatar: `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase(),
      phone: user.phoneNumber || 'N/A',
      address: user.address || 'N/A',
      createdAt: new Date(user.createdAt),
      lastLogin: new Date(user.updatedAt),
      totalDeliveries: 0,
      rating: user.role === 'AGENT' ? 0 : undefined,
      assignedParcels: user.role === 'AGENT' ? 0 : undefined,
      department: user.role === 'AGENT' ? 'Delivery' : undefined
    };
  }

  private mapVerificationStatusToUiStatus(status: VerificationStatus): 'active' | 'inactive' | 'suspended' {
    if (status === 'VERIFIED') return 'active';
    if (status === 'PENDING') return 'inactive';
    return 'suspended';
  }

  calculateStats(): void {
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter(u => u.status === 'active').length;
    const customers = this.users.filter(u => u.role === 'CUSTOMER').length;
    const agents = this.users.filter(u => u.role === 'AGENT').length;
    
    this.statsCards = [
      {
        label: 'Total Users',
        value: totalUsers,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>`),
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        trend: 12
      },
      {
        label: 'Active Users',
        value: activeUsers,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>`),
        color: '#10B981',
        bgColor: '#D1FAE5',
        trend: 8
              },
      {
        label: 'Customers',
        value: customers,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>`),
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        trend: 15
      },
      {
        label: 'Delivery Agents',
        value: agents,
        icon: this.sanitizer.bypassSecurityTrustHtml(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2">
          <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>`),
        color: '#8B5CF6',
        bgColor: '#F3E8FF',
        trend: 5
      }
    ];
  }

  getStarIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`);
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = this.searchTerm === '' || 
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.phone.includes(this.searchTerm);
      
      const matchesRole = this.selectedRole === '' || this.selectedRole === 'ALL' || 
        user.role === this.selectedRole;
      
      const matchesStatus = this.selectedStatus === '' || this.selectedStatus === 'ALL' || 
        user.status === this.selectedStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    this.sortUsers();
  }

  sortUsers(): void {
    this.filteredUsers.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch(this.sortBy) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'email':
          aVal = a.email;
          bVal = b.email;
          break;
        case 'role':
          aVal = a.role;
          bVal = b.role;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'lastLogin':
          aVal = a.lastLogin.getTime();
          bVal = b.lastLogin.getTime();
          break;
        case 'createdAt':
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
          break;
        default:
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
      }
      
      if (this.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterUsers();
  }

  onRoleFilter(event: Event): void {
    this.selectedRole = (event.target as HTMLSelectElement).value;
    this.filterUsers();
  }

  onStatusFilter(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.filterUsers();
  }

  onSortChange(event: Event): void {
    this.sortBy = (event.target as HTMLSelectElement).value;
    this.sortUsers();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortUsers();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.filterUsers();
  }

  setActiveView(view: string): void {
    this.activeView = view;
  }

  viewUserDetails(user: User): void {
    this.selectedUser = user;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedUser = null;
  }

  openRoleModal(user: User): void {
    this.selectedUser = user;
    this.newRole = user.role;
    this.showRoleModal = true;
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.selectedUser = null;
    this.newRole = '';
  }

  updateUserRole(): void {
    this.errorMessage = 'Role update endpoint is not available yet.';
    this.closeRoleModal();
  }

  toggleUserStatus(user: User): void {
    const nextVerificationStatus: VerificationStatus = user.status === 'active' ? 'REJECTED' : 'VERIFIED';
    const verb = nextVerificationStatus === 'VERIFIED' ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${verb} ${user.name}?`)) {
      return;
    }

    this.saving = true;
    this.userService.verifyUser(user.id, nextVerificationStatus).subscribe({
      next: () => {
        this.fetchUsers();
        this.saving = false;
      },
      error: () => {
        this.errorMessage = 'Failed to update user verification status.';
        this.saving = false;
      }
    });
  }

  deleteUser(id: string): void {
    this.errorMessage = 'Delete user endpoint is not available yet.';
  }

  promoteToAgent(user: User): void {
    this.errorMessage = 'Promote flow requires role update endpoint (not available yet).';
  }

  // Add User Modal methods
  openAddUserModal(): void {
    this.resetNewUserForm();
    this.showAddUserModal = true;
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.resetNewUserForm();
  }

  resetNewUserForm(): void {
    this.newUser = {
      name: '',
      email: '',
      phone: '',
      role: 'CUSTOMER',
      status: 'active',
      address: '',
      department: ''
    };
  }

  addNewUser(): void {
    this.errorMessage = '';
    if (!this.newUser.name || !this.newUser.email || !this.newUser.phone) {
      this.errorMessage = 'Please fill in all required user fields.';
      return;
    }
    const [firstName, ...rest] = this.newUser.name.trim().split(/\s+/);
    const lastName = rest.join(' ') || 'User';
    const payload: SignupRequest = {
      firstName,
      lastName,
      email: this.newUser.email.trim(),
      phoneNumber: this.newUser.phone.trim(),
      address: this.newUser.address.trim() || 'N/A',
      password: 'Temp1234!',
      role: this.newUser.role as 'CUSTOMER' | 'AGENT' | 'ADMIN'
    };
    this.saving = true;
    this.http.post(`${environment.apiUrl}/logistics/auth/register`, payload).subscribe({
      next: () => {
        this.closeAddUserModal();
        this.fetchUsers();
        this.saving = false;
      },
      error: () => {
        this.errorMessage = 'Failed to create user. Check if the email already exists.';
        this.saving = false;
      }
    });
  }

  getRoleColor(role: string): string {
    switch(role) {
      case 'ADMIN': return '#EF4444';
      case 'AGENT': return '#10B981';
      case 'CUSTOMER': return '#3B82F6';
      default: return '#6B7280';
    }
  }

  getRoleBgColor(role: string): string {
    switch(role) {
      case 'ADMIN': return '#FEE2E2';
      case 'AGENT': return '#D1FAE5';
      case 'CUSTOMER': return '#EFF6FF';
      default: return '#F3F4F6';
    }
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'active': return '#10B981';
      case 'inactive': return '#F59E0B';
      case 'suspended': return '#EF4444';
      default: return '#6B7280';
    }
  }

  getStatusBgColor(status: string): string {
    switch(status) {
      case 'active': return '#D1FAE5';
      case 'inactive': return '#FEF3C7';
      case 'suspended': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  }
}