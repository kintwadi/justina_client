export type UserRole = 'ADMIN' | 'OPERATOR' | 'CUSTOMER';

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** Generic acknowledgement returned by the integration endpoints. */
export interface ApiMessage {
  status: string;
  message: string;
}

/** Error envelope produced by the backend `@ControllerAdvice`. */
export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: { field: string; message: string }[];
}
