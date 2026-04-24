export interface AdminStatsResponse {
  totalParcels: number;
  activeParcels: number;
  deliveredParcels: number;
  totalRevenue: number;
  activeTrips: number;
  agencyUsage: { name: string; count: number }[];
}
