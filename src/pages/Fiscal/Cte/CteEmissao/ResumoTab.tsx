// src/pages/Fiscal/Cte/CteEmissao/ResumoTab.tsx
// -----------------------------------------------------------------------------
// Tab "Resumo" da tela de Emissão SEFAZ (D01-D13 readonly + D14 `issue_id` +
// ações — execução 045, Onda 2, TASK-CTE-FE-09/10/11). Todos os campos
// D01-D13 vêm do MESMO `CteDetailResource` já usado na Onda 1
// (`CteEmissaoData`/`CteData`), exibidos via `InputReadOnly` (mirror
// `get_pwa_ui_components_pattern`, nunca `Input` editável).
//
// `issueId` (D14) é o ÚNICO campo realmente editável desta tela — `Select`
// visível SÓ quando `estado === 'novo'` (mirror `D14 visibility: somente
// estado=novo`), populado por `getIssueOptions` (GAP-CTE-FE-04 — endpoint
// ainda não wired no backend, ver docblock do service).
//
// Ações (TASK-CTE-FE-10/11): "Gerar XML"/"Transmitir" exigem `estado=novo` +
// `issue_id` selecionado (mirror `state_condition`/`IG12`); "Carta de
// Correção"/"Cancelar" exigem `estado != novo` (`AC20`/`AC21`); "Imprimir
// DACTE" exige `estado != novo` (`AC22`); "Imprimir Correção" exige
// `sequencia_cce > 0` (`AC23`); "Imprimir Cancelamento" exige
// `estado === 'cancelado'` (`AC24`). Gates (legado,
// D-101-08): Transmitir/Carta de Correção = `cte_edit` (`canEmit`); Cancelar =
// `cte_delete` (`canCancel`); DACTE/PDFs = `cte_view` (`canView`).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { Control, Controller } from 'react-hook-form';
import { FiDownload, FiPrinter, FiSend, FiXCircle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { ClassificationBadge } from '@/components/ClassificationBadge';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';

import { getCteEstadoSlot } from '@/constants/Fiscal/cte/cte-estado-classification';
import { cteEstadoOptions } from '@/constants/Fiscal/cte/options/cte-estado-options';
import { cteTipoDocumentoOptions } from '@/constants/Fiscal/cte/options/cte-tipo-documento-options';
import { nfeCstIbsCbsOptions } from '@/constants/Fiscal/nfe-fiscal-catalogs';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CteEmissaoData } from '@/@types/v2/Fiscal/cteEmissao';

interface IssueSelectForm {
  issueId: Option<string> | null;
}

export interface ResumoTabProps {
  data: CteEmissaoData;
  languageGB: LanguageDate;
  control: Control<IssueSelectForm>;
  issueIdError?: { message?: string };
  issueOptions: Option<string>[];
  issueOptionsLoading: boolean;
  issueOptionsError: boolean;
  issueSelected: boolean;
  /** `cte_edit` — Emitir/Transmitir e Carta de Correção. */
  canEmit: boolean;
  /** `cte_delete` — Cancelar. */
  canCancel: boolean;
  /** `cte_view` — DACTE e PDFs de correção/cancelamento. */
  canView: boolean;
  onGerarXml: () => void;
  isGeneratingXml: boolean;
  onTransmitir: () => void;
  isTransmitting: boolean;
  onOpenCorrecao: () => void;
  onOpenCancelamento: () => void;
  onDacte: () => void;
  isDownloadingDacte: boolean;
  onImprimirCorrecao: () => void;
  isDownloadingCorrecaoImpressao: boolean;
  onImprimirCancelamento: () => void;
  isDownloadingCancelamentoImpressao: boolean;
}

export function ResumoTab({
  data,
  languageGB,
  control,
  issueIdError,
  issueOptions,
  issueOptionsLoading,
  issueOptionsError,
  issueSelected,
  canEmit,
  canCancel,
  canView,
  onGerarXml,
  isGeneratingXml,
  onTransmitir,
  isTransmitting,
  onOpenCorrecao,
  onOpenCancelamento,
  onDacte,
  isDownloadingDacte,
  onImprimirCorrecao,
  isDownloadingCorrecaoImpressao,
  onImprimirCancelamento,
  isDownloadingCancelamentoImpressao,
}: ResumoTabProps) {
  const text = languageGB.ctes.cte.emission;
  const noValue = text.fields.noValue;

  const isNovo = data.estado === 'novo';

  const canShowEmitActions = canEmit && isNovo;
  const canShowCorrecao = canEmit && !isNovo;
  const canShowCancelar = canCancel && !isNovo;
  const canShowDacte = canView && !isNovo;
  const canShowImprimirCorrecao = canView && data.sequencia_cce > 0;
  const canShowImprimirCancelamento = canView && data.estado === 'cancelado';

  return (
    <Box pt={4}>
      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={6}>
        <InputReadOnly
          label={text.fields.cteNumero}
          value={data.cte_numero ? String(data.cte_numero) : noValue}
        />
        <InputReadOnly label={text.fields.chave} value={data.chave || noValue} />
        <Box>
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1}>
            {text.fields.estado}
          </Text>
          <ClassificationBadge slot={getCteEstadoSlot(data.estado)}>
            {cteEstadoOptions.getLabel(data.estado, languageGB)}
          </ClassificationBadge>
        </Box>
        {data.sequencia_cce > 0 && (
          <InputReadOnly label={text.fields.sequenciaCce} value={String(data.sequencia_cce)} />
        )}
      </SimpleGrid>

      {/* ---- D01-D13 readonly (mirror CteDetailResource) ---- */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <InputReadOnly
          label={text.fields.dataEmissao}
          value={data.created_at ? formatDate(data.created_at, 'dd/MM/yyyy HH:mm') : noValue}
        />
        <InputReadOnly label={text.fields.natureza} value={data.natureza?.descricao || noValue} />
        <InputReadOnly label={text.fields.cst} value={data.cst || noValue} />
        <InputReadOnly label={text.fields.percIcms} value={`${data.perc_icms ?? 0}%`} />
        {/* UT-000776 (M5) — IBS/CBS (snapshot da natureza), somente leitura. */}
        <InputReadOnly label={text.fields.cClassTrib} value={data.c_class_trib || noValue} />
        <InputReadOnly
          label={text.fields.cstIbsCbs}
          value={
            data.cst_ibs_cbs
              ? (nfeCstIbsCbsOptions.find((option) => option.value === data.cst_ibs_cbs)?.label ??
                data.cst_ibs_cbs)
              : noValue
          }
        />
        <InputReadOnly
          label={text.fields.vIbs}
          value={data.v_ibs != null ? formatCurrencyBRL(data.v_ibs) : noValue}
        />
        <InputReadOnly
          label={text.fields.vCbs}
          value={data.v_cbs != null ? formatCurrencyBRL(data.v_cbs) : noValue}
        />
        <InputReadOnly label={text.fields.remetente} value={data.remetente?.nome || noValue} />
        <InputReadOnly
          label={text.fields.destinatario}
          value={data.destinatario?.nome || noValue}
        />
        <InputReadOnly
          label={text.fields.produtoPredominante}
          value={data.produto_predominante || noValue}
        />
        <InputReadOnly
          label={text.fields.dataPrevistaEntrega}
          value={data.data_prevista_entrega ? formatDate(data.data_prevista_entrega) : noValue}
        />
        <InputReadOnly
          label={text.fields.tpDoc}
          value={data.tpDoc ? cteTipoDocumentoOptions.getLabel(data.tpDoc) : noValue}
        />
        <InputReadOnly label={text.fields.valorCarga} value={formatCurrencyBRL(data.valor_carga)} />
        <InputReadOnly
          label={text.fields.valorTransporte}
          value={formatCurrencyBRL(data.valor_transporte)}
        />
        <InputReadOnly
          label={text.fields.valorReceber}
          value={formatCurrencyBRL(data.valor_receber)}
        />
        <Box gridColumn={{ base: 'auto', md: 'span 3' }}>
          <InputReadOnly label={text.fields.observacao} value={data.observacao || noValue} />
        </Box>
      </SimpleGrid>

      {/* ---- D14 — issue_id, visível só estado=novo ---- */}
      {isNovo && canEmit && (
        <Box mt={6} maxW={{ base: 'full', md: 'sm' }}>
          <Controller
            name="issueId"
            control={control}
            rules={{ required: text.issuer.required }}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.issuer.label}
                placeholder={text.issuer.placeholder}
                name={name}
                value={value}
                onChange={onChange}
                options={issueOptions}
                error={issueIdError?.message}
                helperText={issueOptionsError ? text.issuer.loadError : undefined}
                loading={issueOptionsLoading}
                isRequired
                disablePortal
              />
            )}
          />
        </Box>
      )}

      {/* ---- Ações ---- */}
      <Box mt={6} display="flex" flexWrap="wrap" gap={3}>
        {canShowEmitActions && (
          <>
            <Button
              title={text.actions.gerarXmlButton}
              icon={FiDownload as ElementType}
              variant="outline"
              size="sm"
              loading={isGeneratingXml}
              disabled={!issueSelected}
              onClick={onGerarXml}
            />
            <Button
              title={text.actions.transmitirButton}
              icon={FiSend as ElementType}
              size="sm"
              loading={isTransmitting}
              disabled={!issueSelected}
              onClick={onTransmitir}
            />
          </>
        )}
        {canShowCorrecao && (
          <Button
            title={text.actions.corrigirButton}
            variant="outline"
            size="sm"
            onClick={onOpenCorrecao}
          />
        )}
        {canShowCancelar && (
          <Button
            title={text.actions.cancelarButton}
            icon={FiXCircle as ElementType}
            variant="secondary"
            colorPalette="red"
            size="sm"
            onClick={onOpenCancelamento}
          />
        )}
        {canShowDacte && (
          <Button
            title={text.actions.dacteButton}
            icon={FiPrinter as ElementType}
            variant="outline"
            size="sm"
            loading={isDownloadingDacte}
            onClick={onDacte}
          />
        )}
        {canShowImprimirCorrecao && (
          <Button
            title={text.actions.imprimirCorrecaoButton}
            icon={FiPrinter as ElementType}
            variant="outline"
            size="sm"
            loading={isDownloadingCorrecaoImpressao}
            onClick={onImprimirCorrecao}
          />
        )}
        {canShowImprimirCancelamento && (
          <Button
            title={text.actions.imprimirCancelamentoButton}
            icon={FiPrinter as ElementType}
            variant="secondary"
            size="sm"
            loading={isDownloadingCancelamentoImpressao}
            onClick={onImprimirCancelamento}
          />
        )}
      </Box>
    </Box>
  );
}

export default ResumoTab;
