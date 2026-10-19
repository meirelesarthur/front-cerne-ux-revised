// src/pages/Relatorios/GestaoPessoal/HorasLogadas/index.tsx
// -----------------------------------------------------------------------------
// Tela "Horas Logadas" (F-275, `logged-hours-report`, esteira 97-Esteiras/012,
// Tarefa 47 + correção pós-QA-manual esteira 012). Rota
// `/relatorios/gestao-pessoal/horas-logadas` — filtro→clique→PDF direto,
// SEM prévia/grade em tela (o legado `logged-hours-report` do agro365 nunca
// teve prévia; a Tarefa 47 introduziu esse fluxo por engano e o dono pediu a
// remoção completa após teste manual, esteira 012).
//
// Casco mirror `FormContainer` + `footer` com formulário + 1 único botão de
// ação (mirror estrutural `VacasPrenhas/index.tsx`/`FichaAnimal/index.tsx`).
//
// RISCOS DE FIDELIDADE (contrato de tela §2/§5-6, frontend-contract-horas-
// logadas.md v2, revalidados na correção pós-QA):
// 1. `DateInput` NÃO tem prop `error` — o erro é renderizado à mão como
//    `Text` abaixo do campo, e o `Select` de fazenda usa `error={...}`
//    (bug documentado em `CustoProducao/index.tsx:50-63`: sem isso o
//    `handleSubmit` reprova em silêncio e o botão parece morto).
// 2. Troca de fazenda ativa: `farm_uuid` é zerado no efeito de troca — sub-
//    filtro é farm-scoped, `tenant_uuid` NÃO é resetado (é tenant-wide).
// 3. `tenant_uuid` é PODADO do payload para quem não é `Gestor_Plataf`, mesmo
//    com valor residual de uma sessão anterior (mirror
//    `FilterSideUserAnalysis.tsx:96-97`).
// 4. `Gestor_Plataf` sem `tenant_uuid` selecionado: NÃO tem estado de UI
//    dedicado — o 422 do backend chega com mensagem de campo e o toast de
//    erro do `catch` já cobre honestamente o caso (`parseBlobError` com
//    prioridade a mensagem de campo, ver risco #7).
//
// RISCOS DE FIDELIDADE — export PDF (contrato §5.2/5.3):
// 5. `Content-Disposition: inline` (api-contract §6.3, `CL-17`) — abrir via
//    `URL.createObjectURL(blob)` + `window.open(url, '_blank')`. NUNCA
//    `downloadBlob()`: forçaria o save e quebraria a fidelidade ao legado
//    (mirror `VacasPrenhas/index.tsx:116-117`, `ProducaoArea/index.tsx:273`,
//    esteira irmã 012).
// 6. CORREÇÃO DEFINITIVA pós-QA-manual (2ª rodada, esteira 012): a keyword
//    `noreferrer` no terceiro argumento de `window.open` TAMBÉM implica
//    `noopener` por especificação (HTML Living Standard: "the noreferrer
//    keyword also enables the noopener keyword") — então mesmo só com
//    `'noreferrer'` (sem `noopener` explícito) o navegador ainda descarta a
//    referência à nova janela e `window.open` continua retornando `null`
//    mesmo com a aba abrindo normalmente, mantendo o falso "pop-up
//    bloqueado" reportado pelo dono. Como esta URL é um `blob:` do MESMO
//    ORIGEM (criado localmente via `URL.createObjectURL`), o risco de
//    reverse tabnabbing que `noopener`/`noreferrer` mitigam (navegação
//    cross-origin para site de terceiro) não se aplica — por isso o
//    terceiro argumento foi removido por completo, restaurando o retorno
//    confiável de referência de janela e permitindo que `!opened` detecte
//    bloqueio real de pop-up.
// 7. 422 chega como `Blob` opaco com `responseType:'blob'` — `parseBlobError`
//    + priorizar mensagem de campo sobre a genérica (mirror
//    `ApuracaoCusto/index.tsx:262-293`).
// 8. Pop-up de fato bloqueado (`window.open` retorna `null`) — toast
//    dedicado, nunca estado silencioso (mirror `ProducaoArea/index.tsx:273-
//    277`).
// 9. "Gerar PDF" usa o FORMULÁRIO VIVO (`handleSubmit(handleDownloadPdf)`) —
//    fluxo de um clique do legado, sem prévia prévia (contrato §5.3).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';

import { loggedHoursReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/logged-hours-report-filter-schema';

import { listFarms } from '@/services/v2/Farms/farm-service';
import {
  downloadLoggedHoursReportPdf,
  type LoggedHoursReportParams,
} from '@/services/v2/Relatorios/logged-hours-report-service';
import { listTenantOptions } from '@/services/v2/Tenants/tenant-options-service';

import type { Option } from '@/@types/option';
import type { FarmRef } from '@/@types/v2/Farms';
import type { TenantOptionItem } from '@/@types/v2/Tenants';

interface LoggedHoursReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  tenant_uuid: Option<string> | null;
  farm_uuid: Option<string> | null;
}

const pristineValues: LoggedHoursReportFilterForm = {
  start_date: null,
  end_date: null,
  tenant_uuid: null,
  farm_uuid: null,
};

export default function HorasLogadasRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const { hasRole, hasFarm } = usePermissions();
  const text = languageGB.loggedHoursReport.report;

  // Só o admin de plataforma escolhe contratante — usuário comum é
  // farm-scoped (mirror `FilterSideUserAnalysis.tsx`/`UserAnalysis/index.tsx`).
  const isGestorPlataforma = hasRole('Gestor_Plataf');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoggedHoursReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: loggedHoursReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // Reação à troca de fazenda ativa: `farm_uuid` é farm-scoped e é limpo ao
  // trocar de fazenda ativa. `tenant_uuid` NÃO é resetado (é tenant-wide).
  useEffect(() => {
    setValue('farm_uuid', null);
  }, [activeFarmUuid, setValue]);

  // "Fazenda" — sub-filtro opcional, só visível com fazenda ativa (contrato
  // §4.2). `listFarms()` devolve array FLAT sem paginação real — `Select`
  // estático + `useQuery`, NÃO `SelectAsyncPaginate`.
  const farmsQuery = useQuery({
    queryKey: ['logged-hours-report', 'farms', activeFarmUuid],
    queryFn: listFarms,
    enabled: hasFarm,
  });
  const farmOptions: Option<string>[] = (farmsQuery.data ?? []).map((farm: FarmRef) => ({
    label: farm.description,
    value: farm.uuid,
  }));

  function buildParams(data: LoggedHoursReportFilterForm): LoggedHoursReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      // Poda real, não só visual — nunca vai ao payload para quem não é
      // `Gestor_Plataf`, mesmo com valor residual de uma sessão anterior
      // (mirror `FilterSideUserAnalysis.tsx:96-97`).
      tenant_uuid: isGestorPlataforma ? (data.tenant_uuid?.value ?? undefined) : undefined,
      farm_uuid: data.farm_uuid?.value ?? undefined,
    };
  }

  // "Gerar PDF" usa o FORMULÁRIO VIVO (`handleSubmit(handleDownloadPdf)`),
  // mirror `ApuracaoCusto/index.tsx` (contrato §5.3): fluxo de um clique do
  // legado, sem prévia prévia.
  async function handleDownloadPdf(data: LoggedHoursReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadLoggedHoursReportPdf(buildParams(data));
      // `Content-Disposition: inline` (api-contract §6.3, `CL-17`) — abre em
      // nova aba. NUNCA `downloadBlob()`: forçaria o save e quebraria a
      // fidelidade ao legado (mirror `VacasPrenhas/index.tsx:116-117`).
      const url = URL.createObjectURL(blob);
      // Correção DEFINITIVA pós-QA-manual (risco #6, 2ª rodada): SEM terceiro
      // argumento — `noreferrer` sozinho já implica `noopener` por
      // especificação, então qualquer uma das duas keywords faz
      // `window.open` retornar `null` mesmo com a aba abrindo com sucesso.
      // Como é um `blob:` do mesmo origem, o risco de tabnabbing não se
      // aplica, e sem as keywords o retorno volta a refletir corretamente
      // se a aba abriu ou não.
      const opened = window.open(url, '_blank');
      if (!opened) {
        // Nenhum estado silencioso (get_spa_ux_fidelity_pattern §3): o
        // bloqueador de pop-up impede a aba — sem este aviso o clique
        // simplesmente não faria nada.
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revogar o object URL logo em seguida — a aba recém-aberta ainda
      // o está lendo (mirror `ProducaoArea/index.tsx`).
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `ApuracaoCusto/index.tsx:262-293`). Isso cobre honestamente o caso de
      // `Gestor_Plataf` sem `tenant_uuid` selecionado, sem precisar de um
      // estado de UI dedicado. NUNCA `extractApiErrorMessage`
      // (`VacasPrenhas`) — perde as mensagens de campo do 422.
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? text.downloadError,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.downloadPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isDownloading}
            disabled={!hasValidRange || isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={4}>
          <Text fontSize="md" fontWeight="semibold">
            {text.filtersSectionTitle}
          </Text>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            {/* Dt. Início — obrigatório. `DateInput` não tem prop `error`;
                erro renderizado à mão abaixo do campo (risco #1). */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.startDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
              </Text>
              <Controller
                name="start_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.start_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.start_date?.message}
                </Text>
              )}
            </Box>

            {/* Dt. Fim — obrigatório, `>= start_date`. */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.endDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
              </Text>
              <Controller
                name="end_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            {/* Contratante — visível SÓ para `Gestor_Plataf` (contrato §4.1);
                `/tenants/options` é 403 para os demais. */}
            {isGestorPlataforma && (
              <Controller
                name="tenant_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.fields.tenant}
                    placeholder={text.tenantPlaceholder}
                    service={listTenantOptions}
                    mapOptions={(item: TenantOptionItem) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                  />
                )}
              />
            )}

            {/* Fazenda — sub-filtro opcional, visível SÓ com fazenda ativa
                (contrato §4.2); `farm_uuid` é conceito diferente de
                `activeFarmUuid`/`X-Farm-Id` (escopo). */}
            {hasFarm && (
              <Controller
                name="farm_uuid"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.farm}
                    placeholder={text.farmPlaceholder}
                    name={name}
                    value={value}
                    onChange={(option: Option<string> | null) => onChange(option ?? null)}
                    options={farmOptions}
                    loading={farmsQuery.isLoading}
                  />
                )}
              />
            )}
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
