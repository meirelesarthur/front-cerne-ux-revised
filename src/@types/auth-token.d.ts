export interface AuthToken {
  token: string | null;
  refreshToken: string | null;
}

export interface AuthTokenAdmin {
  tokenAdmin: string | null;
  refreshTokenAdmin: string | null;
}

export interface AuthTokenPlant {
  tokenPlant: string | null;
  refreshTokenPlant: string | null;
}
