// src/components/Suprimentos/QuotationsMapButton.tsx
// -----------------------------------------------------------------------------
// Botão "Mapa de Cotações" (execução 081, T-081-FE-01; contratos LEGADO 05
// AM-04 e 07; DEP-API-07). Baixa o xlsx de `GET request-purchases/{uuid}/
// quotation-map` (rota no singular) e só aparece quando há cotações.
//
// Gate de permissão (plano A-01/DEP-API-07): `request-quotation_view` OU
// `request-authorization_view`. Reusado na aba de Cotação, na Autorização e na
// visualização (seção Cotação Aprovada).
// -----------------------------------------------------------------------------

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { downloadBlob } from '@/utils/downloadBlob';

import { queryKey } from '@/constants/query-key';

import { downloadQuotationsMap } from '@/services/v2/RequestPurchases/request-purchase-service';

export const QUOTATIONS_MAP_PERMISSIONS = ['request-quotation_view', 'request-authorization_view'];

// Regra de exibição: há ao menos uma cotação E o usuário tem uma das duas permissões.
export function canShowQuotationsMap(
  quotationsCount: number | null | undefined,
  can: (permission: string) => boolean
): boolean {
  return (
    (quotationsCount ?? 0) > 0 && QUOTATIONS_MAP_PERMISSIONS.some((permission) => can(permission))
  );
}

interface QuotationsMapButtonProps {
  requestPurchaseUuid: string;
  /** Quantidade de cotações da solicitação (botão oculto com 0). */
  quotationsCount: number | null | undefined;
}

export function QuotationsMapButton({
  requestPurchaseUuid,
  quotationsCount,
}: QuotationsMapButtonProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase;
  const mapText = text.supply.quotationsMap;
  const { can } = usePermissions();

  const downloadMutation = useRequest<Blob>({
    asyncFunction: async () => {
      const blob = await downloadQuotationsMap(requestPurchaseUuid);
      downloadBlob(blob, mapText.filename);
      return { data: blob, notifications: [], success: true, statusCode: 200 };
    },
    entityName: text.singularLabel,
    queryKey: queryKey.requestPurchases.quotationsMap,
    typesRequest: 'export',
    personalizedMessage: mapText.success,
    actionSuccess: () => {},
  });

  if (!canShowQuotationsMap(quotationsCount, can)) return null;

  return (
    <Button
      title={mapText.button}
      variant="outline"
      type="button"
      onClick={() => downloadMutation.mutate(undefined)}
      loading={downloadMutation.isPending}
      disabled={downloadMutation.isPending}
    />
  );
}
