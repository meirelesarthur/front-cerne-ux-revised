// Two-Factor Authentication Hooks
// Seguindo os padrões useRequest e useCustomFormQuery do projeto

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toaster } from '@/components/ui/toaster';
import { useLanguage } from './useLanguage';

import * as twoFactorService from '@/services/v2/Auth/two-factor-service';
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
} from '@/@types/v2/two-factor';
import type { LoginResponse } from '@/@types/auth';

// Query Keys
export const TWO_FACTOR_QUERY_KEYS = {
  status: 'two-factor-status',
  setup: 'two-factor-setup',
} as const;

// ============================================
// QUERIES
// ============================================

/**
 * Hook para obter o status atual do 2FA
 */
export function useTwoFactorStatus(enabled = true) {
  const query = useQuery({
    queryKey: [TWO_FACTOR_QUERY_KEYS.status],
    enabled,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await twoFactorService.getTwoFactorStatus();
      return response.data; // Response<TwoFactorStatus>
    },
    retry: false,
  });

  return query;
}

// ============================================
// MUTATIONS - CONFIGURAÇÃO
// ============================================

/**
 * Hook para configurar (setup) o 2FA - Gera QR Code
 */
export function useTwoFactorSetup(options?: {
  onSuccess?: (data: TwoFactorSetupResponse) => void;
  onError?: (error: Error) => void;
}) {
  const { languageGB } = useLanguage();
  
  return useMutation({
    mutationFn: async () => {
      const response = await twoFactorService.setupTwoFactor();
      return response.data.data; // Extrai o data interno da Response<T>
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toaster.error({
        title: 'Erro',
        description: 'Falha ao gerar configuração do 2FA',
        duration: 7000,
      });
      options?.onError?.(error);
    },
  });
}

/**
 * Hook para ativar o 2FA
 */
export function useTwoFactorEnable(options?: {
  onSuccess?: (data: TwoFactorEnableResponse) => void;
  onError?: (error: Error) => void;
}) {
  const client = useQueryClient();
  const { languageGB } = useLanguage();

  return useMutation({
    mutationFn: async (data: TwoFactorEnableRequest) => {
      const response = await twoFactorService.enableTwoFactor(data);
      return response.data.data; // Extrai o data interno da Response<T>
    },
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: [TWO_FACTOR_QUERY_KEYS.status] });
      
      toaster.success({
        title: '2FA',
        description: 'Autenticação de dois fatores ativada com sucesso!',
        duration: 7000,
      });
      
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toaster.error({
        title: 'Erro',
        description: 'Código inválido. Verifique e tente novamente.',
        duration: 7000,
      });
      options?.onError?.(error);
    },
  });
}

/**
 * Hook para desativar o 2FA
 */
export function useTwoFactorDisable(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const client = useQueryClient();
  const { languageGB } = useLanguage();

  return useMutation({
    mutationFn: async (data: TwoFactorDisableRequest) => {
      const response = await twoFactorService.disableTwoFactor(data);
      return response.data;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [TWO_FACTOR_QUERY_KEYS.status] });
      
      toaster.success({
        title: '2FA',
        description: 'Autenticação de dois fatores desativada.',
        duration: 7000,
      });
      
      options?.onSuccess?.();
    },
    onError: (error) => {
      toaster.error({
        title: 'Erro',
        description: 'Código inválido. Verifique e tente novamente.',
        duration: 7000,
      });
      options?.onError?.(error);
    },
  });
}

// ============================================
// MUTATIONS - VERIFICAÇÃO NO LOGIN
// ============================================

/**
 * Hook para verificar código TOTP durante o login
 */
export function useTwoFactorVerify(options?: {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: Error) => void;
}) {
  const { languageGB } = useLanguage();

  return useMutation({
    mutationFn: async (data: TwoFactorVerifyRequest) => {
      const response = await twoFactorService.verifyTwoFactorCode(data);
      return response.data.data as LoginResponse; // Extrai o data interno da Response<T>
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toaster.error({
        title: 'Erro',
        description: 'Código inválido ou expirado. Tente novamente.',
        duration: 7000,
      });
      options?.onError?.(error);
    },
  });
}

/**
 * Hook para verificar código de backup durante o login
 */
export function useTwoFactorVerifyBackup(options?: {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: Error) => void;
}) {
  const { languageGB } = useLanguage();

  return useMutation({
    mutationFn: async (data: TwoFactorVerifyBackupRequest) => {
      const response = await twoFactorService.verifyTwoFactorBackupCode(data);
      return response.data.data as LoginResponse; // Extrai o data interno da Response<T>
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toaster.error({
        title: 'Erro',
        description: 'Código de backup inválido ou já utilizado.',
        duration: 7000,
      });
      options?.onError?.(error);
    },
  });
}

// ============================================
// MUTATIONS - CÓDIGOS DE BACKUP
// ============================================

/**
 * Hook para regenerar códigos de backup
 */
export function useTwoFactorRegenerateBackupCodes(options?: {
  onSuccess?: (data: TwoFactorRegenerateBackupCodesResponse) => void;
  onError?: (error: Error) => void;
}) {
  const client = useQueryClient();
  const { languageGB } = useLanguage();

  return useMutation({
    mutationFn: async (data: TwoFactorRegenerateBackupCodesRequest) => {
      const response = await twoFactorService.regenerateBackupCodes(data);
      return response.data.data; // Extrai o data interno da Response<T>
    },
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: [TWO_FACTOR_QUERY_KEYS.status] });
      
      toaster.success({
        title: '2FA',
        description: 'Novos códigos de backup gerados com sucesso!',
        duration: 7000,
      });
      
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toaster.error({
        title: 'Erro',
        description: 'Código inválido. Verifique e tente novamente.',
        duration: 7000,
      });
      options?.onError?.(error);
    },
  });
}
