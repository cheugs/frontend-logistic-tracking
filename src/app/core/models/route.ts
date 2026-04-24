export interface RouteCache {
  id: string;
  sourceAgencyId: string;
  destinationAgencyId: string;
  routeData: string;
  distanceKm: number;
  estimatedMinutes: number;
  createdAt: string;
}
