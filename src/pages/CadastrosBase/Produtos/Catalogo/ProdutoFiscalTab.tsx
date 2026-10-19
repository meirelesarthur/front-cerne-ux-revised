// src/pages/CadastrosBase/Produtos/Catalogo/ProdutoFiscalTab.tsx
// -----------------------------------------------------------------------------
// 3ª aba do formulário de Produto ("Fiscal", ~40 campos, `TASK-FE-507`) —
// ARQUIVO SEPARADO, mesmo padrão de `_examples/CreateOrUpdateRecurso.tsx` +
// `ProdutoEstoqueFinanceiroTab.tsx` (`TASK-FE-504`): recebe `control`/
// `register`/`errors` do form-pai (`CreateOrUpdateProduto.tsx`) — NÃO cria
// `useForm` próprio, só contribui campos ao MESMO form.
//
// MIRROR declarado (Regra de precedência do agente fino — `get_pwa_*`/
// `get_spa_*` não estão no runtime desta sessão): instrução direta do
// task-packet (`TASK-FE-507`, execução 025) + `ProdutoEstoqueFinanceiroTab.tsx`
// (casca de aba em arquivo separado, campo mascarado/numérico via `Controller`)
// + `CreateOrUpdateContaBancaria.tsx` (padrão "tolerante a fora-do-catálogo"
// do Select de `bank`) + `RegrasFiscais/CreateOrUpdateRegraFiscal.tsx`
// (MESMO domínio de ~40 campos fiscais, reaproveitado tal qual por
// `Product-contrato.md` D9 — 7 Enums de `App\Enums\TaxRule\*` idênticos;
// mirror mais específico que o genérico `_examples`, adotado para o
// agrupamento em 3 seções "Fiscal Clássico"/"Reforma Tributária"/"ZFM e
// Doação" e para a decisão de `NumberInput`, ver nota abaixo).
//
// ⚠️ REGRA MAIS IMPORTANTE (task-packet desta execução, não-negociável):
// o backend (`TASK-BE-504`, ✅ CONCLUÍDO, `GAP-BE-232` escopo reduzido) valida
// SÓ tipo/tamanho/precisão do schema físico real — ZERO regra de negócio
// fiscal nova. A tabela `products` carrega 543.983 linhas de dado histórico
// que passaram por um backend SEM validação nenhuma por anos. Consequência
// direta aqui:
//   (a) NENHUM Select de enum valida contra a lista de opções — todos usam
//       `withToleratedOption()` abaixo, que INJETA uma opção sintética
//       (`{value: cru, label: label_do_backend ?? cru}`) na lista de opções
//       SEMPRE que o valor atual do registro não bate com nenhum case do
//       catálogo — o valor cru aparece e é editável, nunca escondido/
//       forçado a "corrigir" para salvar (mirror do `bank` de
//       `CreateOrUpdateContaBancaria.tsx`, adaptado: aquele campo usa
//       `SelectAsyncPaginate`/react-select, que renderiza QUALQUER `value`
//       recebido independente de bater com as opções carregadas; o `Select`
//       nativo deste fork — Chakra v3/`createListCollection` — só resolve o
//       texto exibido a partir do item PRESENTE no array `options`, então a
//       injeção na lista de opções é o jeito real de obter o mesmo
//       resultado aqui, não um capricho estético);
//   (b) NENHUMA obrigatoriedade condicional a `is_fiscal` — todos os ~40
//       campos são opcionais, independente do valor de `is_fiscal`;
//   (c) a ABA em si fica SEMPRE VISÍVEL (mesma decisão "sem gate de
//       validação entre abas" já adotada pela Aba 2, `TASK-FE-504`) — `is_fiscal`
//       e `tax_rule_uuid` continuam sempre no `SimpleGrid` de topo. ⚠️
//       REVERSÃO (`TASK-FE-991`, 2026-07-31 — ver cabeçalho da Tarefa,
//       decisão nova do dev por cima de `TASK-FE-960` no MESMO dia): as 3
//       SEÇÕES internas ("Fiscal Clássico"/"Reforma Tributária"/"ZFM e
//       Doação") deixaram de ser incondicionais — agora renderizam só quando
//       `is_fiscal === true` (`isFiscalValue`, `useWatch` abaixo), e o
//       `onChange` de `is_fiscal` ZERA os ~40 campos ao desmarcar
//       (`clearFiscalFields`, `GAP-FE-190` Opção A, sem confirmação). Dado
//       fiscal histórico de um produto com `is_fiscal=false` no banco deixa
//       de ser preservado no client — é o comportamento pedido
//       explicitamente pelo dev, ciente do risco (ver Tarefa).
//
// ⚠️ DESVIO DELIBERADO vs. a instrução literal "Percentuais (perc_*,
// percent_reduction) com PercentInput" do task-packet — `PercentInput.tsx`
// FORMATA com `.toFixed(2)` fixo (2 casas decimais, sem prop de precisão) —
// adequado para `perc_icms`/`perc_pis`/`perc_cofins`/`perc_ipi`/
// `percent_reduction` (coluna real `numeric(5,2)`/`numeric(12,2)`), mas
// TRUNCARIA silenciosamente os 15 campos de Reforma Tributária
// (`perc_ibs_uf`/`perc_ibs_mun`/.../`perc_is_espec`, coluna real
// `numeric(7,4)`/`numeric(13,4)`) de 4 para 2 casas decimais no primeiro
// re-render após qualquer interação — corrompendo dado histórico de
// precisão fina, exatamente o que a "REGRA MAIS IMPORTANTE" acima proíbe.
// `NumberInput.tsx` (`decimalPlaces` configurável) resolve isso sem risco —
// e é EXATAMENTE o componente que `RegrasFiscais/CreateOrUpdateRegraFiscal.tsx`
// já usa para os MESMOS 19 campos (incluindo os de 2 casas), mirror mais
// forte e mais específico que a instrução genérica. `min`/`max` do
// `NumberInput` foram OMITIDOS de propósito (o componente clampeia no
// `onBlur` quando esses props existem — um clique-e-saída do campo sem
// intenção de editar poderia truncar silenciosamente um valor histórico
// fora da faixa "normal" antes mesmo do submit).
//
// Campos mascarados/numéricos SEMPRE via `Controller` (nunca `register()`
// puro, armadilha conhecida do domínio): `cfop_saida_interno`/
// `cfop_saida_externo` (`InputMask`, mask "9999"), `barcode` (`InputMask`,
// mask 13 dígitos), `cest` (`InputMask`, mask "99.999.99" — formato padrão
// de 7 dígitos). Texto puro sem máscara usa `register()` (`reference`,
// `cenq_ipi` — ~70 opções sem Enum nesta migração, D9 —, `cbenef`,
// `c_class_trib`, `cst_is` — sem Enum em `TaxRule` também, D9 —, `u_trib_is`).
//
// `is_fiscal`/`allow_pointing` — `Select` Sim/Não (NUNCA `Switch`, regra
// INVIOLÁVEL do task-packet), não-clareável, default `false` (mesmo default
// do schema físico, coluna nullable mas o Resource sempre expõe boolean).
// `ind_doacao` idem — o `ProductResource.php` real (lido em `api_root`)
// SEMPRE expõe `(bool)` (nunca `null`), diferente do 3-estado clareável de
// `RegrasFiscais/CreateOrUpdateRegraFiscal.tsx` (cujo Resource pode expor
// `null`) — simplificado aqui para 2 estados, fiel ao que este Resource
// realmente devolve.
//
// `modality_bc`/`percent_reduction` — colunas físicas `NOT NULL` (default
// `0`/`0.00`, contrato §2/§9) — o form-pai (`CreateOrUpdateProduto.tsx`)
// garante que o `useForm` NUNCA guarda `null` nesses 2 campos (default `0`
// na criação, hidratado do dado real na edição) e que o payload de saída
// nunca envia `null` (fallback `?? 0` redundante no submit).
//
// ⚠️ MIGRADO (TASK-FE-950, pedido direto do dev, 2026-07-31 — `GAP-FE-162`
// aprovado): o Select `tax_rule_uuid` MIGROU para cá de
// `ProdutoEstoqueFinanceiroTab.tsx` (Aba 2) — mesmo `name=`/`control`/
// `service` (`listTaxRuleEntityOptions`), só o arquivo onde renderiza. Razão:
// o `onChange` dele dispara o autofill fiscal (`GET
// /tax-rules/{uuid}/fiscal-defaults`, `TASK-BE-604`) que preenche os 35
// campos ABAIXO, nesta MESMA aba — o efeito fica visível na hora, sem
// cegueira entre abas (mesmo racional já aprovado na `TASK-FE-948`, causa
// raiz do `ERRO-FE-015` sobreviver a um ✅ de Tester). Semântica do autofill
// (Doc Bruta Product/02-Product-Autofill-Fiscal-TaxRule.md §5/§6,
// não-negociável): dispara SÓ no `change` do Select, NUNCA no load/prefill de
// edição; truthy sobrescreve incondicionalmente (mesmo campo editado à mão),
// falsy preserva (sem `getValues()`/checagem de "já preenchido" — a ausência
// de `setValue` já É a preservação); só os 35 campos de
// `PRODUCT_FISCAL_AUTOFILL_FIELDS` (`TASK-FE-949`), NUNCA um casamento
// genérico por nome (era isso que colidia incidentalmente com
// `tenant_id`/`is_enabled` no legado, DEC-013, não replicado — o Resource
// novo nunca expõe essas 2 chaves); `origem` é o ÚNICO campo com coerção
// (`Number(...)`, `TaxRuleFiscalDefaultsData.origem` é `string`,
// `ProductForm.origem` é `number | null`); os outros 34 aplicam o valor cru
// (zero conversão de moeda/percentual — `NumberInput`/`Select`/`InputMask`
// abaixo já tratam a máscara de EXIBIÇÃO, `TASK-FE-507`).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, Heading, SimpleGrid } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';

import { Input } from '@/components/Form/Input';
import { InputMask } from '@/components/Form/InputMask';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { PRODUCT_FISCAL_AUTOFILL_FIELDS } from '@/constants/cadastrosBase/product/product-fiscal-autofill-fields';
import { columnsForm } from '@/constants/coluns-form';
import {
  isMotDesIcmsVisible,
  isPercDifVisible,
  isPercFcpVisible,
  normalizePercFcp,
  sanitizeC1ForCst,
} from '@/constants/Fiscal/fiscal-field-visibility';
import { getMotDesIcmsOptions } from '@/constants/Fiscal/mot-des-icms-catalog';
import {
  CSOSN_CATALOG,
  COFINS_PIS_CATALOG,
  CST_IBS_CBS_CATALOG,
  IPI_CATALOG,
  MODALITY_BC_CATALOG,
  ORIGEM_CATALOG,
  TP_CRED_PRES_IBS_ZFM_CATALOG,
} from '@/constants/FiscalCatalogs';

import { listTaxRuleEntityOptions } from '@/services/v2/TaxRules/tax-rule-service';

import type { Option } from '@/@types/option';
import type { ProductData, ProductForm as ProductFormType } from '@/@types/v2/Products';
import type { TaxRuleEntityOption } from '@/@types/v2/TaxRules';

import { useTaxRuleFiscalDefaultsAutofill } from './useProducts';
import { WRAPPING_SELECT_COMPONENTS } from './WrappingSingleValue';

interface ProdutoFiscalTabProps {
  control: Control<ProductFormType>;
  register: UseFormRegister<ProductFormType>;
  errors: FieldErrors<ProductFormType>;
  isLoading: boolean;
  canSave: boolean;
  /** Fonte dos `{campo}_label` tolerantes (`ProductResource.php` real,
   *  `tryFrom()` nos 7 Enums de `TaxRule`) — só disponível em edição. */
  productData?: ProductData;
  /** `setValue` do form-pai (`CreateOrUpdateProduto.tsx`) — usado SÓ pelo
   *  autofill fiscal (`TASK-FE-950`) disparado no `onChange` do Select
   *  `tax_rule_uuid` (abaixo). Aplica os 35 campos desta aba via
   *  `PRODUCT_FISCAL_AUTOFILL_FIELDS`, NUNCA no load/prefill (Doc Bruta §6,
   *  ver Tarefa). */
  setValue: UseFormSetValue<ProductFormType>;
  /** TASK-FE-036-B16 — repassado pelo form-pai (`ProductFormFields.tsx`) SÓ
   *  quando este componente monta dentro de um `Dialog`
   *  (`ProductFormModal`), mirror `disablePortal` de `ClientFormFields.tsx`/
   *  `ProdutoEstoqueFinanceiroTab.tsx`. `undefined`/`false` na página cheia
   *  (fora de qualquer Dialog), comportamento intocado. */
  disablePortal?: boolean;
}

/**
 * Injeta uma opção SINTÉTICA na lista de catálogo quando o valor atual do
 * registro não bate com nenhum `value` do catálogo estático — "padrão
 * tolerante a fora-do-catálogo" (ver nota de topo do arquivo). Usa o
 * `{campo}_label` do backend quando disponível (já formatado, ex. "00 -
 * Tributa integralmente"); se o backend devolveu `label: null` (valor cru
 * fora do domínio do Enum, dado histórico), cai para o próprio valor cru —
 * NUNCA esconde o dado, NUNCA força o usuário a trocar para salvar.
 * @param {Option<T>[]} catalog - Catálogo estático (ex. `CSOSN_CATALOG`).
 * @param {T | null | undefined} rawValue - Valor cru atual do registro.
 * @param {string | null} [backendLabel] - `{campo}_label` tolerante do
 *   `ProductResource.php` (`null` quando o valor cru foge do domínio do Enum).
 * @return {Option<T>[]} Catálogo original, ou catálogo + opção sintética.
 */
function withToleratedOption<T extends string | number>(
  catalog: Option<T>[],
  rawValue: T | null | undefined,
  backendLabel?: string | null
): Option<T>[] {
  if (rawValue === null || rawValue === undefined) return catalog;
  if (catalog.some((option) => option.value === rawValue)) return catalog;
  return [...catalog, { value: rawValue, label: backendLabel || String(rawValue) }];
}

/**
 * Os ~40 campos fiscais zerados quando `is_fiscal` vira `false` (TASK-FE-991,
 * `GAP-FE-190` Opção A — zerar direto, sem modal de confirmação, risco
 * assumido conscientemente pelo dev). `null` para toda coluna nullable —
 * NUNCA `0`/`""`, um valor real de alíquota `0` é DADO, diferente de "sem
 * dado". As 2 exceções `modality_bc`/`percent_reduction` são colunas físicas
 * `NOT NULL` (Product-contrato.md §2/§9) e caem no próprio default neutro `0`
 * que o resto do form já usa; os 2 booleanos (`allow_pointing`/`ind_doacao`)
 * caem em `false`. `tax_rule_uuid` entra por ser o campo-mestre do autofill
 * (`TASK-FE-950`) — zerá-lo evita uma Regra Fiscal "fantasma" selecionada sem
 * os campos que ela originou.
 */
const FISCAL_FIELDS_CLEAR_MAP: [keyof ProductFormType, unknown][] = [
  ['tax_rule_uuid', null],
  ['allow_pointing', false],
  ['reference', null],
  ['barcode', null],
  ['cfop_saida_interno', null],
  ['cfop_saida_externo', null],
  ['cst_csosn', null],
  ['cst_csosn_exp', null],
  ['cst_pis', null],
  ['cst_cofins', null],
  ['cst_ipi', null],
  ['perc_icms', null],
  ['perc_pis', null],
  ['perc_cofins', null],
  ['perc_ipi', null],
  ['percent_reduction', 0],
  // C1: colunas NULLABLE (nunca 0) — limpam para null.
  ['mot_des_icms', null],
  ['perc_dif', null],
  ['perc_fcp', null],
  ['origem', null],
  ['cest', null],
  ['modality_bc', 0],
  ['cenq_ipi', null],
  ['cbenef', null],
  ['c_class_trib', null],
  ['cst_ibs_cbs', null],
  ['perc_ibs_uf', null],
  ['perc_ibs_mun', null],
  ['perc_reducao_aliq_ibs_uf', null],
  ['perc_reducao_aliq_ibs_mun', null],
  ['perc_dif_ibs_uf', null],
  ['perc_dif_ibs_mun', null],
  ['perc_cbs', null],
  ['perc_reducao_aliq_cbs', null],
  ['perc_dif_cbs', null],
  ['cst_is', null],
  ['perc_is', null],
  ['perc_is_espec', null],
  ['u_trib_is', null],
  ['ad_rem_ibs', null],
  ['ad_rem_cbs', null],
  ['tp_cred_pres_ibs_zfm', null],
  ['ind_doacao', false],
];

// C1 (D-101-19): tratados a parte no autofill (dependem do CST efetivo).
const C1_FIELDS: ReadonlySet<string> = new Set(['mot_des_icms', 'perc_dif', 'perc_fcp']);

/**
 * Aplica `FISCAL_FIELDS_CLEAR_MAP` via `setValue` (mesmo `setValue` do
 * form-pai já recebido para o autofill, `TASK-FE-950` — nenhuma prop nova).
 * `{ shouldDirty: true }` mirror da opção já usada pelo autofill, garante que
 * o guard `onSubmit` do form-pai (`ERRO-FE-019`/`TASK-FE-995`) reconheça a
 * limpeza como edição real.
 * @param {UseFormSetValue<ProductFormType>} setValue - `setValue` do form-pai.
 */
function clearFiscalFields(setValue: UseFormSetValue<ProductFormType>) {
  FISCAL_FIELDS_CLEAR_MAP.forEach(([fieldName, clearedValue]) => {
    setValue(fieldName, clearedValue as never, { shouldDirty: true });
  });
}

export function ProdutoFiscalTab({
  control,
  register,
  errors,
  isLoading,
  canSave,
  productData,
  setValue,
  disablePortal,
}: ProdutoFiscalTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.products.product;

  // Leitura reativa de `is_fiscal` (TASK-FE-960) — gate de `tax_rule_uuid`
  // logo abaixo. `useWatch` (não `watch`, que este componente não recebe do
  // form-pai — só `control`) evita adicionar mais um prop novo à interface
  // só para isto.
  const isFiscalValue = useWatch({ control, name: 'is_fiscal' });

  // C1 (D-101-19): visibilidade/dominio pelo CST do proprio formulario.
  const watchedCst = useWatch({ control, name: 'cst_csosn' });
  const watchedMotDesIcms = useWatch({ control, name: 'mot_des_icms' });
  const watchedPercDif = useWatch({ control, name: 'perc_dif' });
  const watchedPercFcp = useWatch({ control, name: 'perc_fcp' });
  const showMotDesIcms = isMotDesIcmsVisible(watchedCst);
  const showPercDif = isPercDifVisible(watchedCst);
  const showPercFcp = isPercFcpVisible(watchedCst);
  const motDesIcmsOptions = getMotDesIcmsOptions(watchedCst);

  // Reconcilia os 3 campos C1 com o CST efetivo: zera (null) o que nao pertence a ele, sem
  // marcar dirty quando nada muda (R4 do plano).
  function reconcileC1(
    cst: string | null | undefined,
    desired: { mot_des_icms?: number | null; perc_dif?: number | null; perc_fcp?: number | null }
  ) {
    const clean = sanitizeC1ForCst(cst, desired);
    const actual = {
      mot_des_icms: watchedMotDesIcms ?? null,
      perc_dif: watchedPercDif ?? null,
      perc_fcp: watchedPercFcp ?? null,
    };
    (Object.keys(clean) as (keyof typeof clean)[]).forEach((key) => {
      if (actual[key] !== clean[key]) {
        setValue(key, clean[key] as never, { shouldDirty: true, shouldValidate: true });
      }
    });
  }

  // Autofill fiscal (TASK-FE-950) — mutation bespoke, ver justificativa
  // completa na Tarefa (fetch IMPERATIVO por evento discreto, não leitura
  // declarativa; sem chave de cache reutilizável entre seleções).
  const autofillMutation = useTaxRuleFiscalDefaultsAutofill();

  // Catálogos efetivos (base + opção sintética quando o dado histórico do
  // registro foge do domínio do Enum) — recalculados só quando o `productData`
  // muda (não a cada keystroke: depois que o usuário troca para uma opção
  // real do catálogo, a entrada sintética permanece na lista, inofensiva).
  const cstCsosnOptions = useMemo(
    () => withToleratedOption(CSOSN_CATALOG, productData?.cst_csosn, productData?.cst_csosn_label),
    [productData?.cst_csosn, productData?.cst_csosn_label]
  );
  const cstCsosnExpOptions = useMemo(
    () =>
      withToleratedOption(
        CSOSN_CATALOG,
        productData?.cst_csosn_exp,
        productData?.cst_csosn_exp_label
      ),
    [productData?.cst_csosn_exp, productData?.cst_csosn_exp_label]
  );
  const cstPisOptions = useMemo(
    () => withToleratedOption(COFINS_PIS_CATALOG, productData?.cst_pis, productData?.cst_pis_label),
    [productData?.cst_pis, productData?.cst_pis_label]
  );
  const cstCofinsOptions = useMemo(
    () =>
      withToleratedOption(
        COFINS_PIS_CATALOG,
        productData?.cst_cofins,
        productData?.cst_cofins_label
      ),
    [productData?.cst_cofins, productData?.cst_cofins_label]
  );
  const cstIpiOptions = useMemo(
    () => withToleratedOption(IPI_CATALOG, productData?.cst_ipi, productData?.cst_ipi_label),
    [productData?.cst_ipi, productData?.cst_ipi_label]
  );
  const origemOptions = useMemo(
    () => withToleratedOption(ORIGEM_CATALOG, productData?.origem, productData?.origem_label),
    [productData?.origem, productData?.origem_label]
  );
  const modalityBcOptions = useMemo(
    () =>
      withToleratedOption(
        MODALITY_BC_CATALOG,
        productData?.modality_bc,
        productData?.modality_bc_label
      ),
    [productData?.modality_bc, productData?.modality_bc_label]
  );
  const cstIbsCbsOptions = useMemo(
    () =>
      withToleratedOption(
        CST_IBS_CBS_CATALOG,
        productData?.cst_ibs_cbs,
        productData?.cst_ibs_cbs_label
      ),
    [productData?.cst_ibs_cbs, productData?.cst_ibs_cbs_label]
  );
  const tpCredPresIbsZfmOptions = useMemo(
    () =>
      withToleratedOption(
        TP_CRED_PRES_IBS_ZFM_CATALOG,
        productData?.tp_cred_pres_ibs_zfm,
        productData?.tp_cred_pres_ibs_zfm_label
      ),
    [productData?.tp_cred_pres_ibs_zfm, productData?.tp_cred_pres_ibs_zfm_label]
  );

  // Sim/Não genérico — `is_fiscal`/`allow_pointing`/`ind_doacao` (NUNCA
  // `Switch`, regra INVIOLÁVEL). Não-clareável: os 3 campos sempre expõem
  // boolean no `ProductResource.php` real (nunca `null`), diferente do
  // 3-estado de `ind_doacao` em `RegrasFiscais` (ver nota de topo).
  const yesNoOptions: Option<boolean>[] = [
    { value: true, label: languageGB.defaltStrings.yes },
    { value: false, label: languageGB.defaltStrings.no },
  ];

  return (
    <Box pt={4}>
      {/* `is_fiscal` (TASK-FE-960, pedido direto do dev) — MOVIDO para ANTES
          de `tax_rule_uuid`, mesmo `SimpleGrid` de topo (1ª coluna). Gate:
          `tax_rule_uuid` só habilita quando `is_fiscal === true` (ver
          `isDisabled` abaixo). MESMO `Controller`/lógica que existia dentro
          do bloco "Fiscal Clássico" — só mudou de posição no JSX. */}
      <SimpleGrid columns={columnsForm.default} gap={6} mb={6}>
        <Controller
          name="is_fiscal"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={text.form.fields.isFiscal}
              name={name}
              value={yesNoOptions.find((o) => o.value === value) ?? null}
              onChange={(opt: Option<boolean> | null) => {
                const newIsFiscalValue = !!opt?.value;
                onChange(newIsFiscalValue);
                // TASK-FE-991 — reverte TASK-FE-960 ("só ocultar, fiel ao
                // legado"): o dev revisou a própria decisão após o E2E e
                // pediu ocultar E ZERAR (GAP-FE-190, Opção A, sem
                // confirmação — risco de clique errado assumido
                // conscientemente pelo dev). Zera SÓ ao desmarcar — remarcar
                // não restaura nada (comportamento esperado, ver Tarefa).
                if (!newIsFiscalValue) {
                  clearFiscalFields(setValue);
                }
              }}
              options={yesNoOptions}
              isDisabled={!canSave}
              loading={isLoading}
              noClearable
              disablePortal={disablePortal}
            />
          )}
        />

        {/* Select `tax_rule_uuid` (TASK-FE-950, migrado de
            `ProdutoEstoqueFinanceiroTab.tsx` — ver cabeçalho do arquivo). O
            `onChange` dispara o autofill fiscal dos 35 campos abaixo, na MESMA
            aba — só quando `option?.value` existe (limpar a seleção NÃO
            dispara fetch, mesma semântica de "só o `change` com uma regra
            escolhida").
            TASK-FE-960: `isDisabled`/`helperText` ganham o gate de
            `is_fiscal` — desabilitar NÃO limpa nada (nem este campo, nem os
            35 autopreenchidos), decisão do dev, ver Tarefa. */}
        <Controller
          name="tax_rule_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.form.fields.taxRule}
              placeholder={text.form.placeholders.taxRule}
              tooltip={!isFiscalValue ? text.form.hints.taxRuleRequiresFiscalProduct : undefined}
              service={listTaxRuleEntityOptions}
              mapOptions={(item: TaxRuleEntityOption) => ({
                label: item.label,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // Limpar a seleção não aplica nada — Doc Bruta §6: só o
                // `change` com uma regra ESCOLHIDA dispara o autofill.
                if (!option?.value) return;
                autofillMutation.mutate(option.value, {
                  onSuccess: ({ data: fiscalDefaults }) => {
                    PRODUCT_FISCAL_AUTOFILL_FIELDS.forEach((autofillFieldName) => {
                      // C1 tratado a parte (abaixo): depende do CST efetivo pos-autofill.
                      if (C1_FIELDS.has(autofillFieldName)) return;
                      const rawValue = fiscalDefaults[autofillFieldName];
                      // Falsy preserva — Doc Bruta §5: NUNCA `getValues()`/
                      // checagem de "já preenchido", a ausência da chamada
                      // já É a preservação do valor atual do campo.
                      if (!rawValue) return;
                      // `origem` é o ÚNICO dos 35 com coerção de tipo
                      // (`string` no lado TaxRule, `number | null` em
                      // `ProductForm` — ver `@types/v2/TaxRules/index.d.ts`).
                      const valueToApply =
                        autofillFieldName === 'origem' ? Number(rawValue) : rawValue;
                      setValue(autofillFieldName, valueToApply as never, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    });
                    // C1: regra -> produto copia mot_des_icms/perc_dif/perc_fcp (so valores
                    // preenchidos, como os demais) e reconcilia com o CST efetivo.
                    reconcileC1(fiscalDefaults.cst_csosn || watchedCst, {
                      mot_des_icms: fiscalDefaults.mot_des_icms || watchedMotDesIcms,
                      perc_dif: fiscalDefaults.perc_dif || watchedPercDif,
                      perc_fcp: fiscalDefaults.perc_fcp || watchedPercFcp,
                    });
                    toaster.success({
                      title: text.form.fields.taxRule,
                      description: text.form.toasts.taxRuleAutofillApplied,
                      duration: 5000,
                    });
                  },
                  onError: () => {
                    toaster.error({
                      title: text.form.fields.taxRule,
                      description: text.form.errors.taxRuleAutofillFailed,
                      duration: 7000,
                    });
                  },
                });
              }}
              isDisabled={!canSave || isLoading || !isFiscalValue}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              disablePortal={disablePortal}
              components={WRAPPING_SELECT_COMPONENTS}
            />
          )}
        />
      </SimpleGrid>

      {isFiscalValue && (
        <>
          <Heading size="sm" fontWeight="600" mb={4}>
            {text.form.fiscalSections.classic}
          </Heading>
          <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={6} mb={6}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              {/* `is_fiscal` MIGROU para o `SimpleGrid` de topo (TASK-FE-960,
              antes de `tax_rule_uuid`) — `allow_pointing` passa a ser o
              primeiro campo deste bloco. */}
              <Controller
                name="allow_pointing"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.form.fields.allowPointing}
                    name={name}
                    value={yesNoOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                    options={yesNoOptions}
                    isDisabled={!canSave}
                    loading={isLoading}
                    noClearable
                    disablePortal={disablePortal}
                  />
                )}
              />

              <Input
                label={text.form.fields.reference}
                maxLength={30}
                {...register('reference')}
                error={errors.reference?.message}
                loading={isLoading}
                disabled={!canSave}
              />

              <Controller
                name="barcode"
                control={control}
                render={({ field, fieldState }) => (
                  <InputMask
                    label={text.form.fields.barcode}
                    name={field.name}
                    mask="9999999999999"
                    maskPlaceholder={null}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="cfop_saida_interno"
                control={control}
                render={({ field, fieldState }) => (
                  <InputMask
                    label={text.form.fields.cfopSaidaInterno}
                    name={field.name}
                    mask="9999"
                    maskPlaceholder={null}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="cfop_saida_externo"
                control={control}
                render={({ field, fieldState }) => (
                  <InputMask
                    label={text.form.fields.cfopSaidaExterno}
                    name={field.name}
                    mask="9999"
                    maskPlaceholder={null}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="cst_csosn"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.cstCsosn}
                    name={name}
                    placeholder={text.form.placeholders.cstCsosn}
                    value={cstCsosnOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<string> | null) => {
                      onChange(opt?.value ?? null);
                      // C1: troca de CST limpa o que deixa de pertencer ao novo CST.
                      reconcileC1(opt?.value ?? null, {
                        mot_des_icms: watchedMotDesIcms,
                        perc_dif: watchedPercDif,
                        perc_fcp: watchedPercFcp,
                      });
                    }}
                    options={cstCsosnOptions}
                    error={error?.message}
                    isDisabled={!canSave}
                    loading={isLoading}
                    disablePortal={disablePortal}
                  />
                )}
              />

              <Controller
                name="cst_csosn_exp"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.cstCsosnExp}
                    name={name}
                    placeholder={text.form.placeholders.cstCsosnExp}
                    value={cstCsosnExpOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                    options={cstCsosnExpOptions}
                    error={error?.message}
                    isDisabled={!canSave}
                    loading={isLoading}
                    disablePortal={disablePortal}
                  />
                )}
              />

              <Controller
                name="cst_pis"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.cstPis}
                    name={name}
                    placeholder={text.form.placeholders.cstPis}
                    value={cstPisOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                    options={cstPisOptions}
                    error={error?.message}
                    isDisabled={!canSave}
                    loading={isLoading}
                    disablePortal={disablePortal}
                  />
                )}
              />

              <Controller
                name="cst_cofins"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.cstCofins}
                    name={name}
                    placeholder={text.form.placeholders.cstCofins}
                    value={cstCofinsOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                    options={cstCofinsOptions}
                    error={error?.message}
                    isDisabled={!canSave}
                    loading={isLoading}
                    disablePortal={disablePortal}
                  />
                )}
              />

              <Controller
                name="cst_ipi"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.cstIpi}
                    name={name}
                    placeholder={text.form.placeholders.cstIpi}
                    value={cstIpiOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                    options={cstIpiOptions}
                    error={error?.message}
                    isDisabled={!canSave}
                    loading={isLoading}
                    disablePortal={disablePortal}
                  />
                )}
              />

              <Controller
                name="perc_icms"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percIcms}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={2}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_pis"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percPis}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={2}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_cofins"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percCofins}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={2}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_ipi"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percIpi}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={2}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              {/* Coluna NOT NULL (default 0.00) — ver nota de topo do arquivo,
              nunca envia `null` (fallback no submit do form-pai). */}
              <Controller
                name="percent_reduction"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percentReduction}
                    value={field.value ?? 0}
                    onValueChange={(value) => field.onChange(value ?? 0)}
                    allowDot
                    decimalPlaces={2}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              {showMotDesIcms && (
                <Controller
                  name="mot_des_icms"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <Select
                      label={text.form.fields.motDesIcms}
                      helperText={text.form.fields.motDesIcmsHint}
                      name={name}
                      value={motDesIcmsOptions.find((o) => o.value === value) ?? null}
                      onChange={(opt: Option<number> | null) => onChange(opt?.value ?? null)}
                      options={motDesIcmsOptions}
                      error={error?.message}
                      isDisabled={!canSave}
                      loading={isLoading}
                      disablePortal={disablePortal}
                    />
                  )}
                />
              )}

              {showPercDif && (
                <Controller
                  name="perc_dif"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      name={field.name}
                      label={text.form.fields.percDif}
                      helperText={text.form.fields.percDifHint}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      min={0}
                      max={100}
                      allowDot
                      decimalPlaces={4}
                      error={fieldState.error?.message}
                      disabled={!canSave || isLoading}
                    />
                  )}
                />
              )}

              {showPercFcp && (
                <Controller
                  name="perc_fcp"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      name={field.name}
                      label={text.form.fields.percFcp}
                      helperText={text.form.fields.percFcpHint}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(normalizePercFcp(value))}
                      min={0}
                      max={100}
                      allowDot
                      decimalPlaces={4}
                      error={fieldState.error?.message}
                      disabled={!canSave || isLoading}
                    />
                  )}
                />
              )}

              <Controller
                name="origem"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.origem}
                    name={name}
                    placeholder={text.form.placeholders.origem}
                    value={origemOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<number> | null) => onChange(opt?.value ?? null)}
                    options={origemOptions}
                    error={error?.message}
                    isDisabled={!canSave}
                    loading={isLoading}
                    disablePortal={disablePortal}
                  />
                )}
              />

              <Controller
                name="cest"
                control={control}
                render={({ field, fieldState }) => (
                  <InputMask
                    label={text.form.fields.cest}
                    name={field.name}
                    mask="99.999.99"
                    maskPlaceholder={null}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              {/* Coluna NOT NULL (default 0) — mesma nota de `percent_reduction`. */}
              <Controller
                name="modality_bc"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.modalityBc}
                    name={name}
                    placeholder={text.form.placeholders.modalityBc}
                    value={modalityBcOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<number> | null) => onChange(opt?.value ?? 0)}
                    options={modalityBcOptions}
                    error={error?.message}
                    isDisabled={!canSave}
                    loading={isLoading}
                    noClearable
                    disablePortal={disablePortal}
                  />
                )}
              />

              <Input
                label={text.form.fields.cenqIpi}
                maxLength={3}
                {...register('cenq_ipi')}
                error={errors.cenq_ipi?.message}
                loading={isLoading}
                disabled={!canSave}
              />

              <Input
                label={text.form.fields.cbenef}
                maxLength={191}
                {...register('cbenef')}
                error={errors.cbenef?.message}
                loading={isLoading}
                disabled={!canSave}
              />
            </SimpleGrid>
          </Box>
        </>
      )}

      {isFiscalValue && (
        <>
          <Heading size="sm" fontWeight="600" mb={4}>
            {text.form.fiscalSections.taxReform}
          </Heading>
          <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={6} mb={6}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Input
                label={text.form.fields.cClassTrib}
                maxLength={6}
                {...register('c_class_trib')}
                error={errors.c_class_trib?.message}
                loading={isLoading}
                disabled={!canSave}
              />

              <Controller
                name="cst_ibs_cbs"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.cstIbsCbs}
                    name={name}
                    placeholder={text.form.placeholders.cstIbsCbs}
                    value={cstIbsCbsOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                    options={cstIbsCbsOptions}
                    error={error?.message}
                    isDisabled={!canSave}
                    loading={isLoading}
                    disablePortal={disablePortal}
                  />
                )}
              />

              <Controller
                name="perc_ibs_uf"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percIbsUf}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_ibs_mun"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percIbsMun}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_reducao_aliq_ibs_uf"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percReducaoAliqIbsUf}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_reducao_aliq_ibs_mun"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percReducaoAliqIbsMun}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_dif_ibs_uf"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percDifIbsUf}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_dif_ibs_mun"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percDifIbsMun}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_cbs"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percCbs}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_reducao_aliq_cbs"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percReducaoAliqCbs}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_dif_cbs"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percDifCbs}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Input
                label={text.form.fields.cstIs}
                maxLength={3}
                {...register('cst_is')}
                error={errors.cst_is?.message}
                loading={isLoading}
                disabled={!canSave}
              />

              <Controller
                name="perc_is"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percIs}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="perc_is_espec"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.percIsEspec}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Input
                label={text.form.fields.uTribIs}
                maxLength={6}
                {...register('u_trib_is')}
                error={errors.u_trib_is?.message}
                loading={isLoading}
                disabled={!canSave}
              />

              <Controller
                name="ad_rem_ibs"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.adRemIbs}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="ad_rem_cbs"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.adRemCbs}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    allowDot
                    decimalPlaces={4}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />
            </SimpleGrid>
          </Box>
        </>
      )}

      {isFiscalValue && (
        <>
          <Heading size="sm" fontWeight="600" mb={4}>
            {text.form.fiscalSections.zfmDonation}
          </Heading>
          <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={6} mb={6}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Controller
                name="tp_cred_pres_ibs_zfm"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.tpCredPresIbsZfm}
                    name={name}
                    placeholder={text.form.placeholders.tpCredPresIbsZfm}
                    value={tpCredPresIbsZfmOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<number> | null) => onChange(opt?.value ?? null)}
                    options={tpCredPresIbsZfmOptions}
                    error={error?.message}
                    isDisabled={!canSave}
                    loading={isLoading}
                    disablePortal={disablePortal}
                  />
                )}
              />

              <Controller
                name="ind_doacao"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.form.fields.indDoacao}
                    name={name}
                    value={yesNoOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                    options={yesNoOptions}
                    isDisabled={!canSave}
                    loading={isLoading}
                    noClearable
                    disablePortal={disablePortal}
                  />
                )}
              />
            </SimpleGrid>
          </Box>
        </>
      )}
    </Box>
  );
}
