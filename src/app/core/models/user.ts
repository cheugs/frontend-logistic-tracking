import { UserRole } from './auth.models';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserContactResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city?: string;
  state?: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}
