export interface Agency {
  id: string;
  name: string;
  country: string;
  town: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgencyRequest {
  name: string;
  country: string;
  town: string;
  addressLine: string;
  latitude: number;
  longitude: number;
}

export interface CoordinatesResponse {
  latitude: number;
  longitude: number;
}
