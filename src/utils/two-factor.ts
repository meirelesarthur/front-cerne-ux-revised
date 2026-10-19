// Utilitários para Two-Factor Authentication
import type { TwoFactorRequiredResponse } from '@/@types/v2/two-factor';

/**
 * Type guard para verificar se resposta do login requer 2FA
 * @param response - Resposta da API de login
 * @returns true se o login requer verificação 2FA
 */
export function isTwoFactorRequired(response: any): response is TwoFactorRequiredResponse {
  return response && response.requires_2fa === true && typeof response.temp_token === 'string';
}
