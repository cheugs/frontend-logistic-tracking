export type UserRole = 'CUSTOMER' | 'ADMIN' | 'AGENT';

export interface AuthRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  password: string;
  role: UserRole;
}

export interface UserResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}