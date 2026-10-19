// src/pages/Operacional/PesagemRodoviaria/FinalizeModuleWeighing.tsx
// -----------------------------------------------------------------------------
// Tela de Finalização (`status 4→5`, FE-SCR-04, TASK-MWG-FE-07) — rota
// `/operacional/pesagem-rodoviaria/:uuid/finalizar` (`module-weighing_edit`).
//
// Efeito de estoque (`type=VendaSaida` decrementa; `type∈{CompraEntrada,
// EntradaColheita,EntradaTerceiros}` incrementa) é INTEIRAMENTE do servidor
// — a tela só exibe o resultado após `onSuccess`, nunca calcula ou assume o
// efeito antes da resposta.
//
// GAP-PES-06/07/08 — nenhuma delas bloqueia esta Tarefa (ver contrato de
// tela §8): `dfe_lookup_unavailable` tratado com estado vazio explícito
// (`DfeEligibleList`); mensagem de duplicidade de lote (se ainda
// `[SUGERIDO]`) exibida tal como vier da API, sem compensação no client.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Skeleton, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatWeight from '@/utils/formatWeight';

import { moduleWeighingType } from '@/constants/ModuleWeighing/module-weighing-type';
import { queryKey } from '@/constants/query-key';

import {
  finalizeModuleWeighing,
  getModuleWeighingFinish,
} from '@/services/v2/ModuleWeighing/module-weighing-service';

import type { FinalizeModuleWeighingPayload } from '@/@types/v2/ModuleWeighing/module-weighing';

import { DfeEligibleList } from './DfeEligibleList';

export default function FinalizeModuleWeighing() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.moduleWeighing.moduleWeighing;

  const [selectedDfeUuid, setSelectedDfeUuid] = useState<string | null>(null);

  const finishQuery = useQuery({
    queryKey: [queryKey.moduleWeighing.moduleWeighing, 'finish', uuid],
    queryFn: async () => (await getModuleWeighingFinish(uuid!)).data,
    enabled: !!uuid,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const hydration = finishQuery.data;
  const isLoading = finishQuery.isPending;

  const finalizeMutation = useMutation({
    mutationFn: (payload: FinalizeModuleWeighingPayload) => finalizeModuleWeighing(uuid!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.moduleWeighing.moduleWeighings] });
      toaster.success({
        title: text.singularLabel,
        description: text.finish.toasts.finalizedSuccess,
      });
      navigate('/operacional/pesagem-rodoviaria');
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 9000,
      });
    },
  });

  // Clique duplo não duplica a mutação — botão desabilitado durante `isPending`.
  function handleConfirm() {
    if (finalizeMutation.isPending) return;
    finalizeMutation.mutate({ dfe_uuid: selectedDfeUuid });
  }

  const weightUnit = hydration?.measurement_name || 'kg';
  const showDfeList = hydration?.type === moduleWeighingType.compraEntrada;

  return (
    <FormContainer
      title={text.finish.title}
      subtitle={hydration ? `${text.list.table.code}: ${hydration.code}` : undefined}
      footer={
        <Button
          title={text.finish.confirmButton}
          onClick={handleConfirm}
          loading={finalizeMutation.isPending}
          disabled={finalizeMutation.isPending || isLoading}
        />
      }
    >
      {isLoading ? (
        <Skeleton height="200px" borderRadius="md" />
      ) : (
        <VStack align="flex-start" gap={4}>
          <VStack align="flex-start" gap={1}>
            <Text>
              {text.finish.summary.grossWeight}: {formatWeight(hydration?.gross_weight, weightUnit)}
            </Text>
            <Text>
              {text.finish.summary.tareWeight}: {formatWeight(hydration?.tare_weight, weightUnit)}
            </Text>
            <Text>
              {text.finish.summary.discount}: {hydration?.classification_discount ?? '-'}
            </Text>
            <Text fontWeight="bold">
              {text.finish.summary.netWeight}: {formatWeight(hydration?.final_weight, weightUnit)}
            </Text>
          </VStack>

          {showDfeList && (
            <DfeEligibleList
              dfeLookupUnavailable={!!hydration?.dfe_lookup_unavailable}
              eligibleDfes={hydration?.eligible_dfes ?? []}
              selectedDfeUuid={selectedDfeUuid}
              onSelect={setSelectedDfeUuid}
              labels={text.finish.dfeList}
            />
          )}
        </VStack>
      )}
    </FormContainer>
  );
}
