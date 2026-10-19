// src/pages/Administrativo/Solicitacao/RequestPurchaseStatusLegend.tsx
// -----------------------------------------------------------------------------
// Legenda de status de `RequestPurchase` — TASK-CQ-FE-15, achado de
// homologação/fidelidade: o legado (`request-purchase/_legend.blade.php`,
// incluído por `request-quotations/index.blade.php:90`) tem, acima do grid,
// um rótulo "Legenda:" seguido de um PONTO COLORIDO + o NOME de cada status
// do enum — perdido na migração da listagem de Cotações (`FE-13`). Este
// componente recompõe fielmente essa legenda.
//
// Mirror ESTRUTURAL de `Status.tsx` (dot + label) já usado exatamente para
// este fim em `Operacional/Appropriations/index.tsx` (`Flex wrap` logo após
// `HeaderGrid`, antes do grid) — mesma composição, adaptada ao enum
// `RequestPurchaseStatus` (11 valores, não 3).
//
// Cor do ponto = MESMO `requestPurchaseStatusColor[status]` já usado no
// `Badge` de status do grid (consistência visual, regra do task-packet) — só
// acrescenta o shade `.500` (mesma convenção documentada em
// `Operacional/Appropriations/appropriationStatus.ts`: "token de cor Chakra
// para o dot, NUNCA hex cru"; `Status.tsx` não entende `colorPalette` de
// `Badge`, só um valor de cor Chakra em `backgroundColor`).
//
// ATUALIZADO (execução 081, T-081-FE-01): o ponto passa a usar os tokens
// `supplyStatus1..11` (cores do legado, `RequestPurchase::colors()`, com light e
// dark em `styles/theme/semantic`), via `requestPurchaseStatusDotToken` — não
// mais `requestPurchaseStatusColor` (paleta do Badge).
//
// Reutilizável: `statusOptions` é opcional — default é o enum COMPLETO (os
// 11 valores, via `requestPurchaseStatusOptions.options`, fiel ao legado que
// itera `\App\RequestPurchase::statusOptions()` sem filtro). Aceita um
// subconjunto por prop para reuso futuro (ex.: se a tela "Solicitação" vier a
// precisar de uma legenda restrita) — SEM alterar `Solicitacao/index.tsx`
// nesta Tarefa (escopo fechado ao hub de Cotações).
// -----------------------------------------------------------------------------

import { Flex, Text } from '@chakra-ui/react';

import { Status } from '@/components/Status';

import { useLanguage } from '@/hooks/useLanguage';

import { requestPurchaseStatusOptions } from '@/constants/RequestPurchases/options/request-purchase-status-options';
import { requestPurchaseStatusDotToken } from '@/constants/RequestPurchases/request-purchase-status';
import type { RequestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import type { Option } from '@/@types/option';

interface RequestPurchaseStatusLegendProps {
  /** Subconjunto de status a exibir — default: TODOS os 11 valores do enum
   *  (`requestPurchaseStatusOptions.options`), fiel ao legado. */
  statusOptions?: Option<RequestPurchaseStatus>[];
}

export function RequestPurchaseStatusLegend({ statusOptions }: RequestPurchaseStatusLegendProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase;

  const options = statusOptions ?? requestPurchaseStatusOptions.options(languageGB);

  return (
    <Flex align="center" gap={5} rowGap={2} wrap="wrap">
      <Text fontSize="sm" fontWeight="bold" color="fg.muted" flexShrink={0}>
        {text.supply.list.legend}:
      </Text>
      {options.map((option) => (
        <Status
          key={option.value}
          text={option.label}
          backgroundColor={requestPurchaseStatusDotToken[option.value]}
          fontSize="sm"
          color="fg.muted"
        />
      ))}
    </Flex>
  );
}
