import { PaymentMethod, PaymentStatus } from './parcel.model';

export interface PaymentResponse {
  id: string;
  parcelId: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayRequest {
  paymentMethod: PaymentMethod;
  transactionId?: string;
}
