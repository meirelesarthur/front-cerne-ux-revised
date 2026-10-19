// src/pages/Relatorios/Pecuaria/RegistroGenealogico/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO "gerar e sair" (PDF inline em nova aba) de Registro
// Genealógico — Relatórios > Pecuária (esteira 055, F-222,
// roteiro-front-F222-registro-genealogico.md, TASK-055-F222-FE-02). Consome
// `GET /api/v1/animal-family-tree-report?animal={uuid}`, permissão
// `animal-family-tree-report_view` (rota + menu — vide REPORTE ao Maestro,
// arquivos compartilhados não tocados por esta task). A árvore genealógica
// (pedigree) é 100% renderizada dentro do PDF pelo backend — esta tela
// NUNCA desenha árvore.
//
// Molde principal: `Relatorios/Pecuaria/FichaAnimal/index.tsx` (mesmo hub,
// mesmo `useMutation` binário, mesmo `window.open` inline). Diferenças do
// irmão (contrato §2/§4): (1) UM único select (`animal`), não três (sem
// `category`/`batch` — SR-F222-DEPTH-HERD-FILTER = NAO_APLICAVEL, não
// inventar rebanho/geração); (2) `animal` é OBRIGATÓRIO — `isRequired` +
// schema Yup i18n + botão desabilitado sem animal (mirror `hasValidRange`→
// `hasAnimal`), diferente do irmão (que não tem nenhum campo obrigatório).
//
// Sem grid on-screen, sem estado `empty` (`NAO_APLICAVEL`) — não há
// superfície de dados on-screen, o "vazio" do domínio mora dentro do PDF.
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { columnsForm } from '@/constants/coluns-form';

import { animalFamilyTreeReportFilterSchema } from '@/validations/schemas/Animals/animal-family-tree-report-filter-schema';

import {
  downloadAnimalFamilyTreeReport,
  type AnimalFamilyTreeReportFilterParams,
} from '@/services/v2/Animals/animal-family-tree-report-service';
import { listAnimalOptions } from '@/services/v2/Animals/animal-service';

import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';

// Form values desta tela (page-scoped) — `animal` vira `Option<string>|null`
// (widget Chakra), desempacotado para `uuid` no submit (contrato §2/§4).
// Único campo, SEMPRE obrigatório (schema Yup abaixo).
interface RegistroGenealogicoReportFormValues {
  animal: Option<string> | null;
}

export default function RegistroGenealogicoRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.animalFamilyTreeReport.report;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistroGenealogicoReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(animalFamilyTreeReportFilterSchema(languageGB)) as any,
    defaultValues: {
      animal: null,
    },
  });

  const animalValue = watch('animal');

  // Botão desabilitado até o animal estar selecionado (mirror
  // `hasValidRange` de `HistoricoReprodutivo`/`VacasPrenhas`) — a validação
  // final continua a cargo do schema Yup (`animalRequired`) e do 422/404 do
  // backend.
  const hasAnimal = !!animalValue;

  // `useMutation` direto (mirror `FichaAnimal`/`VacasPrenhas`) — resposta
  // binária síncrona, SEMPRE PDF inline (sem campo `type`, esta tela não
  // tem Excel, CLM-015). Query key: NAO_APLICAVEL — mutation sem cache e
  // sem invalidação.
  const reportMutation = useMutation({
    mutationFn: (params: AnimalFamilyTreeReportFilterParams) =>
      downloadAnimalFamilyTreeReport(params),
    onSuccess: (blob) => {
      // PDF `Content-Disposition: inline` — abre em nova aba, NUNCA
      // `downloadBlob` (forçaria download, quebrando a fidelidade ao
      // legado, IG-002).
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');

      toaster.success({ title: text.pageTitle, description: text.successToast });
    },
    onError: (error) => {
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.errorToast,
      });
    },
  });

  // Payload único `{ animal: uuid }` — sem `farm_id`/`tenant_id` (`CL-10`),
  // `X-Farm-Id` é injetado pelo interceptor.
  function onSubmit(data: RegistroGenealogicoReportFormValues) {
    reportMutation.mutate({
      animal: data.animal!.value,
    });
  }

  const isGenerating = reportMutation.isPending;

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.submitButton}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isGenerating}
            disabled={!hasAnimal || isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <SimpleGrid columns={columnsForm.oneColumns} gap={4}>
          <Box>
            <Controller
              name="animal"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.filters.animal}
                  placeholder={text.animalPlaceholder}
                  helperText={text.hint.animalRequired}
                  error={errors.animal?.message as string | undefined}
                  isRequired
                  service={listAnimalOptions}
                  mapOptions={(item: AnimalOptionListItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isReadOnly={isGenerating}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </Box>
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
