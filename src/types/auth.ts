export interface JwtPayload {
  userId: string;
  email: string;
  uuid: string;
  lastUpdated: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token?: string;
  user?: {
    email: string;
    name?: string;
  };
  error?: string;
  message?: string;
} 