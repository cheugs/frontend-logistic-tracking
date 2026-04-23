import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';

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

  // Sample users data
  users: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'CUSTOMER',
      status: 'active',
      avatar: 'JD',
      phone: '+49 123 456 7890',
      address: 'Berlin, Germany',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date('2025-01-21'),
      totalDeliveries: 24
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'CUSTOMER',
      status: 'active',
      avatar: 'JS',
      phone: '+49 123 456 7891',
      address: 'Munich, Germany',
      createdAt: new Date('2024-02-20'),
      lastLogin: new Date('2025-01-20'),
      totalDeliveries: 18
    },
    {
      id: '3',
      name: 'Max Klinger',
      email: 'max.klinger@logistics.com',
      role: 'AGENT',
      status: 'active',
      avatar: 'MK',
      phone: '+49 123 456 7892',
      address: 'Hamburg, Germany',
      createdAt: new Date('2024-01-10'),
      lastLogin: new Date('2025-01-21'),
      totalDeliveries: 1240,
      rating: 4.9,
      assignedParcels: 5,
      department: 'Delivery'
    },
    {
      id: '4',
      name: 'Anna Weber',
      email: 'anna.weber@logistics.com',
      role: 'AGENT',
      status: 'active',
      avatar: 'AW',
      phone: '+49 123 456 7893',
      address: 'Cologne, Germany',
      createdAt: new Date('2024-03-05'),
      lastLogin: new Date('2025-01-19'),
      totalDeliveries: 892,
      rating: 4.8,
      assignedParcels: 3,
      department: 'Delivery'
    },
    {
      id: '5',
      name: 'Klaus Richter',
      email: 'klaus.richter@logistics.com',
      role: 'AGENT',
      status: 'inactive',
      avatar: 'KR',
      phone: '+49 123 456 7894',
      address: 'Frankfurt, Germany',
      createdAt: new Date('2024-02-15'),
      lastLogin: new Date('2025-01-15'),
      totalDeliveries: 567,
      rating: 4.7,
      assignedParcels: 0,
      department: 'Express'
    },
    {
      id: '6',
      name: 'Admin User',
      email: 'admin@logistics.com',
      role: 'ADMIN',
      status: 'active',
      avatar: 'AU',
      phone: '+49 123 456 7895',
      address: 'Berlin, Germany',
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date('2025-01-21'),
      totalDeliveries: 0,
      department: 'Management'
    },
    {
      id: '7',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      role: 'CUSTOMER',
      status: 'suspended',
      avatar: 'SW',
      phone: '+49 123 456 7896',
      address: 'Stuttgart, Germany',
      createdAt: new Date('2024-04-10'),
      lastLogin: new Date('2025-01-10'),
      totalDeliveries: 6
    },
    {
      id: '8',
      name: 'Thomas Brown',
      email: 'thomas.brown@example.com',
      role: 'CUSTOMER',
      status: 'active',
      avatar: 'TB',
      phone: '+49 123 456 7897',
      address: 'Düsseldorf, Germany',
      createdAt: new Date('2024-05-20'),
      lastLogin: new Date('2025-01-18'),
      totalDeliveries: 12
    }
  ];

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
    this.filteredUsers = [...this.users];
    this.calculateStats();
  }

  ngOnInit(): void {}

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
    if (this.selectedUser && this.newRole) {
      const index = this.users.findIndex(u => u.id === this.selectedUser!.id);
      if (index !== -1) {
        this.users[index].role = this.newRole as any;
        this.calculateStats();
        this.filterUsers();
      }
    }
    this.closeRoleModal();
  }

  toggleUserStatus(user: User): void {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    if (confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${user.name}?`)) {
      const index = this.users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        this.users[index].status = newStatus;
        this.calculateStats();
        this.filterUsers();
      }
    }
  }

  deleteUser(id: string): void {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.users = this.users.filter(u => u.id !== id);
      this.calculateStats();
      this.filterUsers();
      
      if (this.selectedUser?.id === id) {
        this.closeDetailsModal();
      }
    }
  }

  promoteToAgent(user: User): void {
    if (user.role === 'CUSTOMER') {
      if (confirm(`Promote ${user.name} to Delivery Agent?`)) {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index].role = 'AGENT';
          this.users[index].department = 'Delivery';
          this.users[index].rating = 0;
          this.users[index].assignedParcels = 0;
          this.calculateStats();
          this.filterUsers();
        }
      }
    }
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
    // Validation
    if (!this.newUser.name || !this.newUser.email || !this.newUser.phone) {
      alert('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newUser.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Check if email already exists
    if (this.users.some(u => u.email === this.newUser.email)) {
      alert('A user with this email already exists');
      return;
    }

    // Create initials for avatar
    const initials = this.newUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    // Create new user
    const newUser: User = {
      id: (this.users.length + 1).toString(),
      name: this.newUser.name,
      email: this.newUser.email,
      role: this.newUser.role as 'CUSTOMER' | 'AGENT' | 'ADMIN',
      status: this.newUser.status as 'active' | 'inactive' | 'suspended',
      avatar: initials,
      phone: this.newUser.phone,
      address: this.newUser.address || 'Not specified',
      createdAt: new Date(),
      lastLogin: new Date(),
      totalDeliveries: 0,
      ...(this.newUser.role === 'AGENT' && {
        rating: 0,
        assignedParcels: 0,
        department: this.newUser.department || 'Delivery'
      })
    };

    // Add to users array
    this.users.push(newUser);
    
    // Refresh filtered users and stats
    this.calculateStats();
    this.filterUsers();
    
    // Close modal and show success
    this.closeAddUserModal();
    alert(`User ${newUser.name} has been added successfully!`);
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