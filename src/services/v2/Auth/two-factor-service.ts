// Two-Factor Authentication Service - API V2
// Baseado no 2FA_GUIA.txt

import type { Response } from '@/@types/response-api';
import type {
    TwoFactorStatus,
    TwoFactorSetupResponse,
    TwoFactorEnableRequest,
    TwoFactorEnableResponse,
    TwoFactorVerifyRequest,
    TwoFactorVerifyBackupRequest,
    TwoFactorDisableRequest,
    TwoFactorRegenerateBackupCodesRequest,
    TwoFactorRegenerateBackupCodesResponse,
    TwoFactorMessageResponse,
} from '@/@types/v2/two-factor';
import type { LoginResponse } from '@/@types/auth';
import api from '@/services/api';

// ============================================
// STATUS DO 2FA
// ============================================

/**
 * GET /api/v2/auth/2fa/status
 * Verifica o status atual do 2FA do usuário
 */
export async function getTwoFactorStatus() {
    return await api.V2.get<Response<TwoFactorStatus>>('/auth/2fa/status');
}

// ============================================
// CONFIGURAÇÃO DO 2FA
// ============================================

/**
 * POST /api/v2/auth/2fa/setup
 * Gera o segredo e QR Code para configurar 2FA
 */
export async function setupTwoFactor() {
    return await api.V2.post<Response<TwoFactorSetupResponse>>('/auth/2fa/setup');
}

/**
 * POST /api/v2/auth/2fa/enable
 * Ativa o 2FA após verificação do código TOTP
 */
export async function enableTwoFactor(data: TwoFactorEnableRequest) {
    return await api.V2.post<Response<TwoFactorEnableResponse>>('/auth/2fa/enable', data);
}

/**
 * DELETE /api/v2/auth/2fa/disable
 * Desativa o 2FA (requer código TOTP de 6 dígitos)
 */
export async function disableTwoFactor(data: TwoFactorDisableRequest) {
    return await api.V2.delete('/auth/2fa/disable', {
        data,
    });
}

// ============================================
// VERIFICAÇÃO NO LOGIN
// ============================================

/**
 * POST /api/v2/auth/2fa/verify
 * Verifica o código TOTP durante o login
 * Usado quando o login retorna requires_2fa: true
 * 
 * IMPORTANTE: O temp_token deve ser enviado no header Authorization
 */
export async function verifyTwoFactorCode(data: TwoFactorVerifyRequest) {
    return await api.V2.post<Response<LoginResponse>>(
        '/auth/2fa/verify',
        data,
    );
}

/**
 * POST /api/v2/auth/2fa/verify-backup
 * Verifica um código de backup durante o login
 * Alternativa quando o usuário não tem acesso ao app autenticador
 * 
 * IMPORTANTE: O temp_token deve ser enviado no header Authorization
 */
export async function verifyTwoFactorBackupCode(data: TwoFactorVerifyBackupRequest) {
    return await api.V2.post<Response<LoginResponse>>(
        '/auth/2fa/verify-backup',
        data,

    );
}

// ============================================
// CÓDIGOS DE BACKUP
// ============================================

/**
 * POST /api/v2/auth/2fa/backup-codes
 * Regenera os códigos de backup (invalida os anteriores)
 * Requer senha para confirmar
 */
export async function regenerateBackupCodes(data: TwoFactorRegenerateBackupCodesRequest) {
    return await api.V2.post<Response<TwoFactorRegenerateBackupCodesResponse>>(
        '/auth/2fa/backup-codes',
        data
    );
}
