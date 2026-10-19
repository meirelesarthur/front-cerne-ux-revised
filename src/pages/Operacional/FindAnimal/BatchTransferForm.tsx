// src/pages/Operacional/FindAnimal/BatchTransferForm.tsx
// -----------------------------------------------------------------------------
// Form de transferência de lote da tela "Localizar Animal" (FindAnimal —
// Operacional > Pecuária > Manejo, F-042, TASK-FA-FE-05).
// SURF-ACTION-SALVAR-TRANSFER / SURF-SIDEEFFECT-CHANGE-BATCH.
//
// Renderizado por `index.tsx` SOMENTE quando há dossiê carregado (regra 1 —
// mirror do legado, que vive dentro do `@if (isset())`). A mutação em si
// (`transferBatchMutation`) já foi construída em `useFindAnimal.tsx`
// (TASK-FA-FE-02, via `useRequest`) e chega aqui por PROP — este componente
// não chama `useFindAnimal` de novo (evitaria duplicar o fetch do dossiê).
//
// ⚠️ Regra 2 do contrato (§6.3/§6.4) — options de `listBatchOptionsForForm`,
// NUNCA `listBatchOptions` (variante de FILTRO, preserva a sentinela "Sem
// lote" `uuid:'0'`; oferecê-la aqui permitiria transferir para um lote
// inexistente). `queryKey.batches.options` já existe — reusado, NÃO um
// `SelectAsyncPaginate` (o contrato pede `<Select>` síncrono alimentado por
// 1 `useQuery`, mirror `NfeItemsTab.tsx` — armazém por produto).
//
// D3 (toast de sucesso) já está coberto por `personalizedMessage` dentro do
// próprio `useRequest` de `useFindAnimal.tsx` — recibo
// `OD-lane-a-frontend-fidelidade-e-feedback` (sha256 `d966af95…`), desvio
// deliberado e homologado do as-is (o legado não dava retorno visual
// nenhum). Nada a fazer aqui além de consumir a mutação.
//
// ⚠️ CORREÇÃO (achado 3 do dono, run-001, `tp-front-exec-lane-a-04`):
// `data.current_batches[]` ("Lote Atual") — campo do contrato de tela
// §5.1/§6.3 e do manifesto FID-G3F §3.6 ("Lote Atual sempre ao lado de
// Transferir para Lote"), já tipado (`FindAnimalCurrentBatchRef`) e já
// traduzido (`fields.currentBatches`, 3 idiomas) desde a Tarefa 01/02, mas
// nunca renderizado em nenhum componente da fatia — infidelidade ao
// contrato (a API já devolve o dado; não é gap de escopo nem melhoria).
// Renderizado aqui como texto read-only (`DisplayFieldGroup`, nunca
// `<select>` — mirror do próprio `<select readonly>` inerte do legado,
// manifesto §3.6), FORA do `<Can permission="find-animal_edit">`: é dado do
// dossiê (sempre visível, mesma regra dos demais painéis), não a ação de
// transferir — só o formulário/botão `Salvar` é gateado pela permissão.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, Heading, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Can } from '@/components/Can';
import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import { findAnimalSchemaResolver } from '@/validations/schemas/Livestock/find-animal-schema';

import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';

import type { Option } from '@/@types/option';
import type { BatchOption } from '@/@types/v2/Batches';
import type {
  FindAnimalBatchTransferForm as FindAnimalBatchTransferFormValues,
  FindAnimalCurrentBatchRef,
} from '@/@types/v2/Livestock/findAnimal';

import type { useFindAnimal } from './useFindAnimal';

interface BatchTransferFormProps {
  /**
   * Mutação já construída em `useFindAnimal.tsx` (Lei 3 — Orquestração; a
   * `asyncFunction` já fecha sobre `animalUuid`, o corpo do POST é EXATO
   * `{ batch_uuid }`, contrato §5.2). Tipo derivado do próprio hook — evita
   * duplicar a assinatura de `UseMutationResult` aqui (fonte única).
   */
  transferBatchMutation: ReturnType<typeof useFindAnimal>['transferBatchMutation'];
  /**
   * `data.current_batches[]` do dossiê ("Lote Atual", contrato §5.1/§6.3) —
   * array, pode ser `[]`, nunca `null`. Vem de `index.tsx` (já carregado
   * pelo dossiê); este componente não refaz o fetch.
   */
  currentBatches: FindAnimalCurrentBatchRef[];
}

/**
 * Mapeia `BatchOption` (`{uuid,label}`, envelope da API) para `Option<string>` do Select (Lei 1).
 * @param {BatchOption} item - Item cru devolvido por `listBatchOptionsForForm`.
 * @return {Option<string>} Opção no formato `{label, value}` consumido pelo `<Select>`.
 */
function mapBatchOption(item: BatchOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

export function BatchTransferForm({
  transferBatchMutation,
  currentBatches,
}: BatchTransferFormProps) {
  const { languageGB } = useLanguage();
  const dossierText = languageGB.livestock.findAnimal;
  const text = dossierText.transfer;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FindAnimalBatchTransferFormValues>({
    resolver: findAnimalSchemaResolver(languageGB),
    defaultValues: { batch: null },
  });

  // Fetch ÚNICO (não paginado, não remoto por keystroke) — `queryKey.batches.options`
  // reusado (contrato §6.3/6.4). `listBatchOptionsForForm` já filtra a
  // sentinela "Sem lote" (defesa em profundidade, `batch-service.ts`).
  const batchOptionsQuery = useQuery({
    queryKey: [queryKey.batches.options],
    queryFn: () => listBatchOptionsForForm({}),
  });

  const batchOptions = useMemo(
    () => (batchOptionsQuery.data?.data.items ?? []).map(mapBatchOption),
    [batchOptionsQuery.data]
  );

  async function onSubmit(data: FindAnimalBatchTransferFormValues) {
    if (!data.batch) return; // guarda de tipo — o resolver Yup já barra isso antes (regra 4)

    // Round-trip (regra 6, contrato §6.4): a invalidação do dossiê
    // (`queryKey.findAnimals.findAnimal`) e o toast de sucesso (D3) já
    // acontecem DENTRO do `useRequest` (`useFindAnimal.tsx`). `reset()`
    // só roda em sucesso — `mutateAsync` rejeita a Promise em erro
    // (422/403/404 já tratados via toast pelo `onError` interno do
    // `useRequest`) e a linha abaixo não executa. PROIBIDO
    // `window.location.reload()` (regra 6) — não usado.
    await transferBatchMutation.mutateAsync({ batch_uuid: data.batch.value });
    reset();
  }

  return (
    <VStack align="stretch" gap={4} mt={6} pt={6} borderTop="1px solid" borderColor="borderGrid">
      {/* Achado 3 (correção) — "Lote Atual" (`data.current_batches[]`),
          sempre visível (dado do dossiê, não a ação de transferir). Texto
          read-only via `DisplayFieldGroup` — nunca `<select>` (manifesto
          FID-G3F §3.6). Array vazio → placeholder `dash`, mesmo tratamento
          de ausência usado em `employeeName` (`BatchLocationPanel.tsx`). */}
      <DisplayFieldGroup
        loading={false}
        displayFields={[
          {
            label: dossierText.fields.currentBatches,
            value:
              currentBatches.length > 0
                ? currentBatches.map((item) => item.label).join(', ')
                : dossierText.placeholders.dash,
          },
        ]}
      />

      {/* Regra 9 — conveniência de UI; a barreira real é o 403 do backend em
          `find-animal_edit`. Sem a permissão, o bloco de transferência não
          renderiza; o dossiê (painéis acima, incluindo "Lote Atual") continua
          visível. */}
      <Can permission="find-animal_edit">
        <Box>
          <Heading as="h2" fontSize="lg" fontWeight="semibold" color="brandColorText" mb={4}>
            {text.label}
          </Heading>

          {/* Regra 10 — sem `<ModalAction>` de confirmação (paridade com o
              legado, que executa no primeiro clique, `D-transfer`). */}
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="batch"
              control={control}
              render={({ field }) => (
                // Regra 3 — `<Select>` de `src/components/Form/` sob
                // `<Controller>` (react-select nunca aceita `register`).
                <Select
                  name={field.name}
                  label={text.label}
                  placeholder={text.placeholder}
                  options={batchOptions}
                  loading={batchOptionsQuery.isPending}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  error={errors.batch?.message}
                  isRequired
                  disablePortal
                />
              )}
            />

            {/* Regra 5 — `isPending` (TanStack v5), NUNCA `isLoading` em
                mutação (não existe em `UseMutationResult` v5, quebra o `tsc`). */}
            <Button
              type="submit"
              title={text.submit}
              mt={4}
              loading={transferBatchMutation.isPending}
            />
          </Form>
        </Box>
      </Can>
    </VStack>
  );
}
