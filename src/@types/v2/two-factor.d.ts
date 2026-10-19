// Two-Factor Authentication Types - API V2 (GB Cerne)

/**
 * Status do 2FA para o usuário autenticado
 * GET /api/v2/auth/2fa/status
 */
export interface TwoFactorStatus {
  enabled: boolean;
  verified_at: string | null;
  backup_codes_remaining: number;
}

/**
 * Resposta do setup do 2FA com QR Code
 * POST /api/v2/auth/2fa/setup
 */
export interface TwoFactorSetupResponse {
  secret: string;
  qr_code: string; // data:image/png;base64,...
  manual_entry_key: string;
  issuer: string;
  account: string;
}

/**
 * Request para ativar 2FA
 * POST /api/v2/auth/2fa/enable
 */
export interface TwoFactorEnableRequest {
  code: string; // Código TOTP de 6 dígitos
}

/**
 * Resposta ao ativar 2FA com códigos de backup
 * POST /api/v2/auth/2fa/enable
 */
export interface TwoFactorEnableResponse {
  message: string;
  backup_codes: string[];
}

/**
 * Request para verificar código TOTP no login
 * POST /api/v2/auth/2fa/verify
 */
export interface TwoFactorVerifyRequest {
  temp_token: string;
  code: string;
}

/**
 * Request para verificar código de backup no login
 * POST /api/v2/auth/2fa/verify-backup
 */
export interface TwoFactorVerifyBackupRequest {
  temp_token: string;
  backup_code: string;
}

/**
 * Request para desativar 2FA
 * DELETE /api/v2/auth/2fa/disable
 */
export interface TwoFactorDisableRequest {
  code: string; // Código TOTP de 6 dígitos
}

/**
 * Request para regenerar códigos de backup
 * POST /api/v2/auth/2fa/backup-codes
 */
export interface TwoFactorRegenerateBackupCodesRequest {
  code: string; // Código TOTP de 6 dígitos
}

/**
 * Resposta ao regenerar códigos de backup
 * POST /api/v2/auth/2fa/backup-codes
 */
export interface TwoFactorRegenerateBackupCodesResponse {
  message: string;
  backup_codes: string[];
  remaining: number;
}

/**
 * Resposta genérica de mensagem 2FA
 */
export interface TwoFactorMessageResponse {
  message: string;
}

/**
 * Resposta do login quando 2FA é necessário
 */
export interface TwoFactorRequiredResponse {
  requires_2fa: true;
  temp_token: string;
}
