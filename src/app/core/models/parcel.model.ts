export type ParcelStatus = 'PENDING_PAYMENT' | 'WAITING_FOR_AGENT' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
export type DeliveryMode = 'INSTANT' | 'SCHEDULED';
export type PackageSize = 'SMALL' | 'LARGE';
export type PaymentMethod = 'MTN_MOBILE_MONEY' | 'ORANGE_MONEY' | 'WALLET';

export interface AgencyCoordinates {
  latitude: number;
  longitude: number;
}

export interface ParcelSummary {
  id: string;
  title: string;
  reference: string;
  status: ParcelStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  estimatedDeliveryTime?: string;
  destination?: string;
}

export interface CreateParcelDraft {
  deliveryMode: DeliveryMode;
  packageSize: PackageSize;
  serviceName: string;
  quantityLabel: string;
  amount: number;
  estimatedDuration: string;
}

export interface DeliveryDetailsFormValue {
  sourceAgency: string;
  sourceLatitude: number;
  sourceLongitude: number;
  destinationAgency: string;
  destinationLatitude: number;
  destinationLongitude: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weight: number;
  fragility: number;
  status: ParcelStatus;
  landmark?: string;
}

export interface PaymentCheckoutValue {
  paymentMethod: PaymentMethod;
}

