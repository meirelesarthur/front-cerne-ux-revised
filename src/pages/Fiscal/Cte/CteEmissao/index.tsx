// src/pages/Fiscal/Cte/CteEmissao/index.tsx
// -----------------------------------------------------------------------------
// Tela agregada readonly de Emissão SEFAZ do CT-e (S20-S23, D01-D17 —
// execução 045, Onda 2, TASK-CTE-FE-09/10/11). Rota `/fiscal/ctes/:id/emissao`
// (wiring de rota real é responsabilidade da TASK-CTE-FE-14 — chokepoint,
// ver recibo). Mirror `E8 GET /api/v1/ctes/{uuid}/emissao`
// (`CteEmissaoController::show()`, mesmo `CteDetailResource` da Onda 1).
//
// `useCustomFormQueryById` (Padrão 2/Lei 3) hidrata a leitura agregada;
// `issueId` (D14) é o único campo realmente editável — `useForm` mínimo,
// sem Yup dedicado (guarda local + `rules.required` no `Controller`, mirror
// `NfeEmitModal`), nunca populado pelo `fillForm` (não existe round-trip
// para esse campo, é escolhido pelo usuário no momento da transmissão).
//
// GAP-CTE-FE-04: `issue_id` (LK19/D14) depende de um endpoint de opções que
// ainda não existe no backend (`getIssueOptions`, ver
// `cte-emissao-service.ts`) — a Select aparece com erro honesto de
// carregamento até o Gap ser resolvido; não bloqueia o restante da tela
// (readonly D01-D13 + tabs S21-S23 funcionam independentemente).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid, Skeleton, Tabs, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  cancelarCte,
  corrigirCte,
  getCteCancelamentoImprimir,
  getCteCorrecaoImprimir,
  getCteDacte,
  getCteEmissao,
  getCteXml,
  getIssueOptions,
  transmitirCte,
} from '@/services/v2/Fiscal/cte-emissao-service';

import type { Option } from '@/@types/option';
import type { CteData } from '@/@types/v2/Fiscal/cte';
import type {
  CancelarCteRequest,
  CorrigirCteRequest,
  CorrigirCteResult,
  CteEmissaoData,
} from '@/@types/v2/Fiscal/cteEmissao';

import { ChavesReadonlyTab } from './ChavesReadonlyTab';
import { ComponentesReadonlyTab } from './ComponentesReadonlyTab';
import { CteCancelamentoDialog } from './CteCancelamentoDialog';
import { CteCorrecaoDialog } from './CteCorrecaoDialog';
import { MedidasReadonlyTab } from './MedidasReadonlyTab';
import { ResumoTab } from './ResumoTab';

const CTE_LIST_ROUTE = '/fiscal/ctes';

interface IssueSelectForm {
  issueId: Option<string> | null;
}

export default function CteEmissao() {
  const { id: uuid } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.ctes.cte.emission;

  const hasMalformedRouteParam = !isValidGuid(uuid);

  useEffect(() => {
    if (hasMalformedRouteParam) navigate(CTE_LIST_ROUTE, { replace: true });
  }, [hasMalformedRouteParam, navigate]);

  // Permissões do legado (D-101-08), espelho de `CteEmissaoController`:
  // abrir/visualizar a tela, DACTE e PDFs = `cte_view`; emitir/transmitir e
  // CC-e = `cte_edit`; cancelar = `cte_delete`.
  const canEmit = can('cte_edit');
  const canCancel = can('cte_delete');
  const canView = can('cte_view');

  const {
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<IssueSelectForm>({ mode: 'onChange', defaultValues: { issueId: null } });

  // Lei 2 — `issueId` nunca vem hidratado pela leitura (D14 não tem
  // round-trip, é escolhido pelo usuário no momento da transmissão); o
  // `fillForm` só garante que o select nasce limpo a cada troca de `uuid`.
  function fillEmissaoForm(_data: CteEmissaoData, resetForce?: boolean) {
    if (resetForce) reset({ issueId: null });
  }

  const cteQuery = useCustomFormQueryById<CteEmissaoData>({
    registrationId: !hasMalformedRouteParam && uuid ? uuid : '',
    queryKey: queryKey.ctes.cteEmissao,
    asyncFunction: getCteEmissao,
    fillForm: fillEmissaoForm,
  });

  const isLoading = !hasMalformedRouteParam && checkLoadingStatus([cteQuery as any]);
  const data = cteQuery.data as CteEmissaoData | undefined;
  const cteQueryIsError = (cteQuery as any).isError as boolean;

  useEffect(() => {
    if (cteQueryIsError) {
      toaster.error({ title: text.pageTitle, description: text.loadErrorToast });
      navigate(CTE_LIST_ROUTE, { replace: true });
    }
  }, [cteQueryIsError, navigate, text.pageTitle, text.loadErrorToast]);

  const issueIdValue = watch('issueId');
  const isNovo = data?.estado === 'novo';

  // GAP-CTE-FE-04 — só busca quando o select realmente aparece (evita 404
  // inútil em CT-e já transmitido/cancelado/rejeitado).
  const issueOptionsQuery = useQuery({
    queryKey: [queryKey.ctes.issueOptions],
    queryFn: getIssueOptions,
    enabled: isNovo && canEmit,
    retry: false,
  });

  const issueOptions: Option<string>[] = (issueOptionsQuery.data ?? []).map((issue) => ({
    label: issue.razao_social ?? issue.nome_fantasia ?? issue.uuid,
    value: issue.uuid,
  }));

  const correcaoDisclosure = useDisclosure();
  const cancelamentoDisclosure = useDisclosure();

  // ---- Gerar XML (S24) — leitura local, force-download (mirror
  // `NfeEmissionPanel::handleDownloadXml`), sem `useRequest` (não persiste
  // entidade nenhuma). ---------------------------------------------------
  const [isGeneratingXml, setIsGeneratingXml] = useState(false);

  async function handleGerarXml() {
    if (!uuid) return;
    setIsGeneratingXml(true);
    try {
      const blob = await getCteXml(uuid);
      downloadBlob(blob, `cte-${data?.chave || data?.cte_numero || uuid}.xml`);
      toaster.success({ title: text.pageTitle, description: text.toasts.xmlGeneratedSuccess });
    } catch (error) {
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.toasts.xmlError,
      });
    } finally {
      setIsGeneratingXml(false);
    }
  }

  // ---- Transmitir (E10/S25-S26) ---------------------------------------------
  const transmitirMutation = useRequest<CteData>({
    asyncFunction: async () => transmitirCte(uuid!, { issue_id: issueIdValue!.value }),
    queryKey: queryKey.ctes.cteEmissao,
    queryKey2: queryKey.ctes.cte,
    queryKey3: queryKey.ctes.ctesList,
    typesRequest: 'apply',
    entityName: text.pageTitle,
    personalizedMessage: text.toasts.transmitirSuccess,
    actionSuccess: () => {},
  });

  function handleTransmitir() {
    // Guarda local (`IG12 condition: issue_id`) — evita chamada inválida;
    // a mensagem de campo obrigatório já aparece via `errors.issueId` no
    // próprio `Controller` da Select (validação no clique, mirror `IG12`).
    if (!issueIdValue?.value) return;
    transmitirMutation.mutate(undefined);
  }

  // ---- Carta de Correção (E11/S27-S29) --------------------------------------
  const corrigirMutation = useRequest<CorrigirCteResult>({
    asyncFunction: async (payload: CorrigirCteRequest) => corrigirCte(uuid!, payload),
    queryKey: queryKey.ctes.cteEmissao,
    queryKey2: queryKey.ctes.cte,
    typesRequest: 'apply',
    entityName: text.pageTitle,
    personalizedMessage: text.toasts.corrigirSuccess,
    actionSuccess: () => correcaoDisclosure.onClose(),
  });

  // ---- Cancelamento (E12/S30-S32) -------------------------------------------
  const cancelarMutation = useRequest<CteData>({
    asyncFunction: async (payload: CancelarCteRequest) => cancelarCte(uuid!, payload),
    queryKey: queryKey.ctes.cteEmissao,
    queryKey2: queryKey.ctes.cte,
    queryKey3: queryKey.ctes.ctesList,
    typesRequest: 'apply',
    entityName: text.pageTitle,
    personalizedMessage: text.toasts.cancelarSuccess,
    actionSuccess: () => cancelamentoDisclosure.onClose(),
  });

  // ---- Impressão (S33-S35) — blob + object URL, NUNCA `window.open` cru
  // (a rota exige `X-Farm-Id`, mirror `getCteReport`/`Cte/index.tsx`). ------
  const [isDownloadingDacte, setIsDownloadingDacte] = useState(false);
  const [isDownloadingCorrecaoImpressao, setIsDownloadingCorrecaoImpressao] = useState(false);
  const [isDownloadingCancelamentoImpressao, setIsDownloadingCancelamentoImpressao] =
    useState(false);

  async function handleDacte() {
    if (!uuid) return;
    setIsDownloadingDacte(true);
    try {
      const blob = await getCteDacte(uuid);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.toasts.dacteError,
      });
    } finally {
      setIsDownloadingDacte(false);
    }
  }

  async function handleImprimirCorrecao() {
    if (!uuid || !data?.sequencia_cce) return;
    setIsDownloadingCorrecaoImpressao(true);
    try {
      const blob = await getCteCorrecaoImprimir(uuid, data.sequencia_cce);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.toasts.imprimirCorrecaoError,
      });
    } finally {
      setIsDownloadingCorrecaoImpressao(false);
    }
  }

  async function handleImprimirCancelamento() {
    if (!uuid) return;
    setIsDownloadingCancelamentoImpressao(true);
    try {
      const blob = await getCteCancelamentoImprimir(uuid);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.toasts.imprimirCancelamentoError,
      });
    } finally {
      setIsDownloadingCancelamentoImpressao(false);
    }
  }

  if (hasMalformedRouteParam) return null;

  if (isLoading || !data) {
    return (
      <FormContainer title={text.pageTitle} showDivider>
        <Box pt={4}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} height="40px" borderRadius="md" />
            ))}
          </SimpleGrid>
        </Box>
      </FormContainer>
    );
  }

  return (
    <FormContainer title={text.pageTitle} showDivider>
      <Tabs.Root defaultValue="0" variant="line">
        {/* @ts-ignore ChakraUI v3 headless tabs: tipos ainda não compatíveis */}
        <Tabs.List>
          {/* @ts-ignore */}
          <Tabs.Trigger value="0">{text.tabs.resumo}</Tabs.Trigger>
          {/* @ts-ignore */}
          <Tabs.Trigger value="1">{text.tabs.componentes}</Tabs.Trigger>
          {/* @ts-ignore */}
          <Tabs.Trigger value="2">{text.tabs.medidas}</Tabs.Trigger>
          {/* @ts-ignore */}
          <Tabs.Trigger value="3">{text.tabs.chaves}</Tabs.Trigger>
        </Tabs.List>

        {/* @ts-ignore */}
        <Tabs.Content value="0">
          <ResumoTab
            data={data}
            languageGB={languageGB}
            control={control}
            issueIdError={errors.issueId}
            issueOptions={issueOptions}
            issueOptionsLoading={issueOptionsQuery.isLoading}
            issueOptionsError={issueOptionsQuery.isError}
            issueSelected={!!issueIdValue?.value}
            canEmit={canEmit}
            canCancel={canCancel}
            canView={canView}
            onGerarXml={handleGerarXml}
            isGeneratingXml={isGeneratingXml}
            onTransmitir={handleTransmitir}
            isTransmitting={transmitirMutation.isPending}
            onOpenCorrecao={correcaoDisclosure.onOpen}
            onOpenCancelamento={cancelamentoDisclosure.onOpen}
            onDacte={handleDacte}
            isDownloadingDacte={isDownloadingDacte}
            onImprimirCorrecao={handleImprimirCorrecao}
            isDownloadingCorrecaoImpressao={isDownloadingCorrecaoImpressao}
            onImprimirCancelamento={handleImprimirCancelamento}
            isDownloadingCancelamentoImpressao={isDownloadingCancelamentoImpressao}
          />
        </Tabs.Content>

        {/* @ts-ignore */}
        <Tabs.Content value="1">
          <ComponentesReadonlyTab componentes={data.componentes} languageGB={languageGB} />
        </Tabs.Content>

        {/* @ts-ignore */}
        <Tabs.Content value="2">
          <MedidasReadonlyTab medidas={data.medidas} languageGB={languageGB} />
        </Tabs.Content>

        {/* @ts-ignore */}
        <Tabs.Content value="3">
          <ChavesReadonlyTab chavesNfe={data.chaves_nfe} languageGB={languageGB} />
        </Tabs.Content>
      </Tabs.Root>

      <CteCorrecaoDialog
        isOpen={correcaoDisclosure.open}
        onClose={correcaoDisclosure.onClose}
        languageGB={languageGB}
        mutation={corrigirMutation}
        onConfirm={(payload) => corrigirMutation.mutate(payload)}
      />

      <CteCancelamentoDialog
        isOpen={cancelamentoDisclosure.open}
        onClose={cancelamentoDisclosure.onClose}
        languageGB={languageGB}
        mutation={cancelarMutation}
        onConfirm={(payload) => cancelarMutation.mutate(payload)}
      />
    </FormContainer>
  );
}
