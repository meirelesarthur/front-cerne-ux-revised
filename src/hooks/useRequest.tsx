import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { Response } from "@/@types/response-api";

import { useLanguage } from "./useLanguage";

import { getBusinessMutationErrorMessage } from "@/utils/extractApiErrorMessage";

import { toaster } from "@/components/ui/toaster";

const typeRequest = {
  update: "update",
  create: "create",
  apply: "apply",
  export: "export",
  revoke: "revoke",
  restore: "restore",
} as const;

export type TypesRequest = (typeof typeRequest)[keyof typeof typeRequest];

interface RequesteProps<TData = any> {
  asyncFunction(data: any): Promise<Response<TData> | undefined>;
  queryKey: string;
  queryKey2?: string;
  queryKey3?: string;
  queryKey4?: string;
  typesRequest: TypesRequest;
  entityName: string;
  personalizedMessage?: string;
  /**
   * Opcional/aditivo: decide o toast de sucesso a partir do resultado.
   * Retornar `{ type: 'warning', description }` troca o toast de sucesso por
   * aviso (ou, com `type: 'success'`, por um sucesso com texto próprio —
   * UT-000743, código definitivo no criar); retornar `undefined` mantém o
   * comportamento padrão.
   */
  resolveSuccessToast?: (
    data: TData | undefined
  ) => { type: 'warning' | 'info' | 'success'; description: string } | undefined;
  actionSuccess: (data: TData) => void;
}

export function useRequest<TData = any>({
  asyncFunction,
  actionSuccess,
  queryKey,
  typesRequest,
  entityName,
  personalizedMessage,
  resolveSuccessToast,
  queryKey2,
  queryKey3,
  queryKey4,
}: RequesteProps<TData>) {
  const client = useQueryClient();
  const { languageGB } = useLanguage();

  const requestMutation = useMutation({
    mutationFn: asyncFunction,
    onSuccess(data) {
      client.invalidateQueries({ queryKey: [queryKey] });
      client.invalidateQueries({ queryKey: [queryKey2] });
      client.invalidateQueries({ queryKey: [queryKey3] });
      client.invalidateQueries({ queryKey: [queryKey4] });

      const message = personalizedMessage
        ? personalizedMessage
        : `${entityName} ${
            typesRequest === typeRequest.update
              ? languageGB.defaltStrings.updateRegister
              : typesRequest === typeRequest.create
                ? languageGB.defaltStrings.createRegister
                : typesRequest === typeRequest.export
                  ? languageGB.defaltStrings.exportRegister
                  : typesRequest === typeRequest.revoke
                    ? languageGB.defaltStrings.revokeRegister
                    : typesRequest === typeRequest.restore
                      ? languageGB.defaltStrings.restoreRegister
                      : languageGB.defaltStrings.appliedRegister
          }`;

      const override = resolveSuccessToast?.(data?.data);

      if (override) {
        toaster.create({
          title: entityName,
          description: override.description,
          type: override.type,
          duration: 7000,
        });
      } else {
        toaster.success({
          title: entityName,
          description: message,
          duration: 7000,
        });
      }

      actionSuccess(data?.data!);
    },
    onError(error) {
      console.error("useRequest - error:", error);

      // Se é 403 de tier, não mostrar toast — o interceptor já tratou via useTierAccessDenied
      if (isAxiosError(error) && (error as any)._tierHandled) {
        return;
      }

      // 401 (sessão expirada) — o interceptor (api.ts) já disparou auth-logout
      // e redireciona ao login; sem toast, para não vazar "401 — Unauthenticated."
      // por 1 frame antes do redirect.
      if (isAxiosError(error) && error.response?.status === 401) {
        return;
      }

      const errorMessage = getBusinessMutationErrorMessage(error, languageGB);

      // O log já é emitido pelo interceptor axios (emitAxiosError)
      // Aqui só mostra o toast pro usuário
      toaster.error({
        title: entityName,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  return requestMutation;
}
