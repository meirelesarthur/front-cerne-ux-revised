// Password Recovery Service - API V2
// Baseado no Postman Collection: GB Cerne API v2

import type {
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse
} from '@/@types/auth';
import type { Response } from '@/@types/response-api';
import api from '@/services/api';

/**
 * POST /api/v2/auth/forgot-password
 * Solicita recuperação de senha - envia link para email
 * 
 * @param email - Email do usuário
 * @returns Resposta com mensagem de sucesso
 */
export async function requestPasswordRecovery(data: ForgotPasswordRequest) {
  return await api.V2.post<Response<ForgotPasswordResponse>>(
    '/auth/forgot-password',
    data
  );
}

/**
 * POST /api/v2/auth/reset-password
 * Reseta a senha usando o token enviado por email
 * 
 * @param token - Token de recuperação recebido por email
 * @param password - Nova senha
 * @param password_confirmation - Confirmação da nova senha
 * @returns Resposta com mensagem de sucesso
 */
export async function resetPassword(data: ResetPasswordRequest) {
  return await api.V2.post<Response<ResetPasswordResponse>>(
    '/auth/reset-password',
    data
  );
}
