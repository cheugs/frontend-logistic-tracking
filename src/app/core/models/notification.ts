export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: string;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface TokenRegistrationRequest {
  userId: string;
  token: string;
}
