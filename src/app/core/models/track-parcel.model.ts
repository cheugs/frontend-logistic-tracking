export interface TrackingPoint {
  label: string;
  latitude: number;
  longitude: number;
  time?: string;
}

export interface ParcelRoute {
  id: string;
  title: string;
  reference: string;
  status: 'PENDING' | 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'PENDING_PAYMENT' | 'WAITING_FOR_AGENT';
  createdAt: string;
  source: TrackingPoint;
  destination: TrackingPoint;
  current: TrackingPoint;
  progress: number;
}