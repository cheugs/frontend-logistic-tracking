export type TripStatus = 'COLLECTING' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type SegmentStatus = 'PENDING' | 'REACHED';

export interface SegmentResponse {
  id: string;
  segmentOrder: number;
  latitude: number;
  longitude: number;
  distanceFromStartKm: number;
  status: SegmentStatus;
  reachedAt?: string;
}

export interface TripResponse {
  id: string;
  driverId: string;
  sourceAgencyId: string;
  sourceAgencyName: string;
  destAgencyId: string;
  destAgencyName: string;
  totalDistanceKm: number;
  segmentCount: number;
  status: TripStatus;
  segments: SegmentResponse[];
  fullPath: number[][];
  parcelsCount: number;
  startedAt?: string;
  createdAt: string;
}

export interface TripRequest {
  driverId: string;
  sourceAgencyId: string;
  sourceAgencyName: string;
  destAgencyId: string;
  destAgencyName: string;
}

export interface AvailableParcelResponse {
  id: string;
  userId: string;
  sourceAgencyId: string;
  sourceAgencyName: string;
  destAgencyId: string;
  destAgencyName: string;
  weight: number;
  fragility: number;
  status: string;
  estimatedCost: number;
  estimatedDeliveryTime: string;
}
