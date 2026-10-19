/**
 * Response do GET /api/v2/auth/verify-email?token={token}
 *
 * API retorna:
 * { "success": true, "data": { "message": "Email verified successfully...", "verified": true } }
 */
export interface VerifyEmailResponse {
  message: string;
  verified: boolean;
}

/**
 * Response do POST /api/v2/auth/resend-verification
 *
 * API retorna:
 * { "success": true, "data": { "message": "Verification email sent" } }
 */
export interface ResendVerificationResponse {
  message: string;
}
