// src/pages/Invoices/CreateOrUpdateInvoice.tsx
// -----------------------------------------------------------------------------
// Tela ÂNCORA de criação/edição de Invoice (Doc. Fiscal/Entrada) — TASK-FE-2763
// (execução 033/Onda 3). 1 `useForm` RAIZ com o resolver ÚNICO
// (`invoiceSchemaResolver`, TASK-FE-2761), casca de 4 abas (`Tabs.Root`,
// mirror `CreateOrUpdateEquipamento.tsx`) — aba "Cabeçalho" implementada
// AQUI, inline; "Itens & Totais"/"Parcelamento"/"Rateio" são arquivos
// separados (`InvoiceItemsTab.tsx`/`InvoiceInstallmentsTab.tsx`/
// `InvoiceApportionmentTab.tsx`) que recebem `control`/`errors`/`watch`/
// `setValue` do MESMO form raiz.
//
// ⚠️ 3 divergências Spec-visual↔Contrato (achadas na leitura do backend REAL,
// diferente do planejamento — que foi feito ANTES do backend existir):
//   1. "Fazenda" — NUNCA no form (`farm_id` sempre do header `X-Farm-Id`/
//      `FarmSwitcher` global). Confirmado, sem alteração.
//   2. "Filial" (`branch_uuid`) — OMITIDA (nullable no contrato, mas SEM
//      `belongsTo` ativo e SEM endpoint de catálogo — `grep -ri "branch"
//      services/` vazio). Confirmado, sem alteração.
//   3. "Tipo de Título" (`type_title_uuid`) — o planejamento (TASK-FE-2763
//      original) presumiu que não havia campo real e recomendou OMITIR. O
//      backend JÁ CONSTRUÍDO exige `type_title_uuid` (`InvoiceRequest::
//      rules()`, FK `type_titles`, OBRIGATÓRIO) — campo ADICIONADO aqui,
//      `SelectAsyncPaginate` sobre `listTypeTitleOptions` (TASK-FE-623,
//      DF-02, execução 035): achado de E2E mostrou o select sem opções para
//      usuário com `invoices_create` mas sem `typetitles_view` — a causa era
//      100% backend (endpoint `/type-titles` gateado, GAP-BE-620); o
//      Arquiteto API abriu `GET /type-titles/options` (TASK-BE-620, 9ª
//      instância do padrão GAP-BE-040 Opção B, sem gate de permissão) — o
//      FE só troca o serviço consumido, wiring já estava correto.
//
// `provider_uuid` — decisão registrada: "+add rápido" (`
// SelectAsyncPaginateEditable`) NÃO implementado nesta rodada.
// `CreateProviderRequest` real exige um payload de Person COMPLETO (nif/
// name/nickname/address/number/district/city_uuid + bloco `provider.type`),
// incompatível com o contrato simples `addItem(label: string)` do
// componente — implementá-lo direito exigiria um mini-formulário próprio
// (Tarefa nova, fora do escopo desta rodada). `SelectAsyncPaginate` comum
// aqui, com hint explicando a omissão.
//
// `classification` — pré-selecionado "Não Classificado" (`N`) nos
// `defaultValues`, satisfaz a spec-visual (aparência obrigatória) sem
// inventar `required` que o contrato não pede (nullable, default `N` na
// Action).
//
// Rateio (`categories`)/Parcelamento (`installments`) são WRITE-ONLY — o
// backend NUNCA devolve o rateio/parcelamento persistido, e `PUT` os IGNORA
// (Contas a Pagar imutáveis pós-criação). Em EDIÇÃO, as abas "Parcelamento"/
// "Rateio" ficam DESABILITADAS com aviso — não há dado para reidratar, e
// reenviá-las não teria efeito no servidor (ver `invoice-schema.ts`, os 2
// arrays deixam de ser obrigatórios/validados quando `isEditing`).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Tabs, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { FiUpload } from 'react-icons/fi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { formatPlateIfValid } from '@/utils/masks/plate';
import { suggestMeasurementOption } from '@/utils/measurement-suggestion';

import { columnsForm } from '@/constants/coluns-form';
import { FamilyEquipmentDepreciationType } from '@/constants/FamilyEquipmentDepreciationType';
import { invoiceApportionmentTypeOptions } from '@/constants/invoices/options/apportionment-type-options';
import { invoiceClassificationOptions } from '@/constants/invoices/options/classification-options';
import {
  invoiceDocumentTypeIndex,
  invoiceDocumentTypeOptions,
} from '@/constants/invoices/options/document-type-options';
import { queryKey } from '@/constants/query-key';

import { invoiceSchemaResolver } from '@/validations/schemas/Invoices/invoice-schema';

import { listTypeTitleOptions } from '@/services/v2/BaseRegistrations/typeTitles-service';
import { listProprietaries } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listHarvests } from '@/services/v2/Harvests/harvest-service';
import { createInvoice, updateInvoice } from '@/services/v2/Invoices/invoice-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';
import { listStateOptions } from '@/services/v2/States/state-service';

import type { Option } from '@/@types/option';
import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';
import type { Harvest } from '@/@types/v2/Harvests';
import type {
  InvoiceApportionmentForm,
  InvoiceDetail,
  InvoiceForm as InvoiceFormType,
  InvoiceItemForm,
  InvoicePayload,
  InvoiceXmlDraft,
} from '@/@types/v2/Invoices';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { StateOption } from '@/@types/v2/States';

import { computeVlTotal, InvoiceApportionmentTab } from './InvoiceApportionmentTab';
import { InvoiceInstallmentsTab } from './InvoiceInstallmentsTab';
import { InvoiceItemsTab } from './InvoiceItemsTab';
import { InvoiceXmlUploadModal } from './InvoiceXmlUploadModal';
import { useInvoiceForm } from './useInvoices';

// TASK-FE-XXX (execução 035) — paridade com o legado no import de XML NFe.
// Nem "Tipo Nota" nem "Tipo de Título" vêm do XML (reconfirmado: `'type' =>
// null` explícito em `GeneralService.php:160`; `type_id` nunca setado por
// `xmlToInvoice()`) — mas no legado a TELA aparece com os dois já
// preenchidos: são DEFAULTS DO FORMULÁRIO, não dado extraído do documento.
// "Tipo Nota" = 1/"NF-e" porque `_forms.blade.php:101` renderiza
// `Form::select('type', ..., Invoice::types())` SEM `->value()` e SEM opção
// vazia (`Invoice::types()`, `app/Invoice.php:63-74`, começa em `1=>'NF-e'`)
// — sem nenhuma `<option selected>`, o PRÓPRIO NAVEGADOR seleciona a 1ª
// opção do DOM. "Tipo de Título" = default EXPLÍCITO no código
// (`_forms.blade.php:104`: `->value(... ?: 4)`) — `type_titles.id=4` é
// "Nota Fiscal - NFe" (dado real, confirmado ao vivo no banco legado
// `agro`/`docker/mysql/init_db.sql`). Reproduzido aqui SÓ no import de XML
// (nunca na criação manual — fora do escopo desta Tarefa). `TypeTitle` é
// catálogo por tenant no fork (sem id fixo herdável) — resolvido por MATCH
// DE LABEL no catálogo real (`/type-titles/options`, `search` ILIKE
// parcial em `description`, `TypeTitleRepository.php:23`); sem match
// exato, fica `null` (mesmo padrão silencioso de `suggestMeasurementOption`
// acima — nunca força um valor errado).
const TYPE_TITLE_NFE_LABEL = 'Nota Fiscal - NFe';

function findTypeTitleNfeOption(items: TypeTitleOptionItem[]): Option<string> | null {
  const normalizedTarget = TYPE_TITLE_NFE_LABEL.trim().toLowerCase();
  const match = items.find((item) => item.description.trim().toLowerCase() === normalizedTarget);
  return match ? { label: match.description, value: match.uuid } : null;
}

type InvoiceTabKey = '0' | '1' | '2' | '3';

const TAB_FIELDS: Record<InvoiceTabKey, (keyof InvoiceFormType)[]> = {
  '0': [
    'number',
    'series',
    'provider_uuid',
    'proprietary_uuid',
    'state_registration',
    'harvest_uuid',
    'dt_emission',
    'delivery_date',
    'state_uuid',
    'type_title_uuid',
    'type',
    'classification',
    'apportionment_type',
    'note',
  ],
  '1': ['items', 'vl_freight', 'vl_safe', 'vl_expense', 'vl_ipi', 'vl_discount', 'conveyor'],
  '2': ['installments'],
  '3': ['categories'],
};

const FIELD_TAB_MAP: Partial<Record<keyof InvoiceFormType, InvoiceTabKey>> = Object.fromEntries(
  (Object.entries(TAB_FIELDS) as [InvoiceTabKey, (keyof InvoiceFormType)[]][]).flatMap(
    ([tab, fields]) => fields.map((field) => [field, tab])
  )
);

export default function CreateOrUpdateInvoice() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { languageGB } = useLanguage();
  const { can, hasFarm } = usePermissions();

  const isEditing = isValidGuid(invoiceId);

  const text = languageGB.invoices.invoice;
  const formText = text.form;

  const canSave = isEditing ? can('invoices_edit') : can('invoices_create');

  useEffect(() => {
    if (invoiceId && !isValidGuid(invoiceId)) {
      navigate('/administrativo/doc-fiscal', { replace: true });
    }
  }, [invoiceId, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<InvoiceFormType>({
    mode: 'onChange',
    resolver: invoiceSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    context: { isEditing },
    defaultValues: {
      number: '',
      series: '',
      dt_emission: null,
      delivery_date: null,
      provider_uuid: null,
      proprietary_uuid: null,
      state_uuid: null,
      type_title_uuid: null,
      conveyor: null,
      type: null,
      classification: { label: text.classificationOptions.notClassified, value: 'N' },
      apportionment_type: null,
      harvest_uuid: null,
      note: null,
      state_registration: null,
      vl_freight: 0,
      vl_safe: 0,
      vl_expense: 0,
      vl_ipi: 0,
      vl_discount: 0,
      // TASK-FE-628 (DF-03) — client-only, seedado só pelo import de XML.
      chave: null,
      items: [],
      installments: [],
      categories: [],
    },
  });

  // TASK-FE-687/DF-29 — quando "Tipo Rateio" = Por Produto (`'P'`), a aba
  // Rateio é reconstruída automaticamente a partir de Categoria+Centro do
  // ITEM (mirror legado, `_card-item.blade.php:692-780`, adaptado à unidade
  // PERCENTUAL do fork: `percentage = (item.total_amount / vlTotal) × 100`,
  // reaproveitando `computeVlTotal` — MESMA fonte de
  // `InvoiceApportionmentTab.tsx`, nunca recalculada 2×). WRITE-ONLY, ATIVO
  // só em criação (mirror "desabilitado em edição" já existente na aba
  // Rateio) e só com Tipo Rateio = Por Produto — em "Por Valor" a aba volta
  // a ser 100% manual (useEffect inativo, Rateio já preenchido preservado).
  // 1 linha por item ELEGÍVEL (categoria+centro preenchidos) — sem replicar
  // a linha de "resíduo não classificado"/desconto proporcional do legado
  // (decisão default registrada na Tarefa; a validação de soma
  // `APPORTIONMENT_SUM_TOLERANCE` já cobre arredondamento).
  const apportionmentTypeValue = watch('apportionment_type')?.value;
  const apportionmentItemsKey = JSON.stringify(
    (watch('items') ?? []).map((item) => [
      item?.category_uuid?.value ?? null,
      item?.center_uuid?.value ?? null,
      item?.quantity ?? null,
      item?.amount ?? null,
      item?.discount ?? null,
    ])
  );

  useEffect(() => {
    if (isEditing) return;
    if (apportionmentTypeValue !== 'P') return;

    const vlTotal = computeVlTotal(watch);
    const eligibleRows: InvoiceApportionmentForm[] = (watch('items') ?? [])
      .filter((item) => item?.category_uuid && item?.center_uuid)
      .map((item) => {
        const itemTotalAmount =
          item.total_amount ?? (Number(item.quantity) || 0) * (Number(item.amount) || 0);
        return {
          category_uuid: item.category_uuid,
          center_uuid: item.center_uuid,
          percentage: vlTotal > 0 ? (Number(itemTotalAmount) / vlTotal) * 100 : 0,
        };
      });

    setValue('categories', eligibleRows, { shouldDirty: true });
    // `watch` é estável (ref do RHF); as deps reais são as 2 chaves abaixo.
  }, [isEditing, apportionmentTypeValue, apportionmentItemsKey]);

  const [tabValue, setTabValue] = useState<InvoiceTabKey>('0');

  // TASK-FE-628 (DF-03, execução 035) — SÓ na criação (mirror do legado,
  // `create.blade.php`, não replicado em `edit.blade.php`).
  const xmlUploadModal = useDisclosure();

  // Mapeia o DRAFT (`InvoiceXmlDraft`, `POST /invoices/parse-xml`, TASK-BE-
  // 624) para um `reset()` do form raiz — MESMO mecanismo de
  // `fillInvoiceForm` (edição), mas a partir do shape do draft, não de
  // `InvoiceDetail`. Usuário REVISA/salva manualmente (sem persistência
  // automática, fiel ao legado).
  async function handleXmlImported(draft: InvoiceXmlDraft) {
    // `state_uuid` do draft só tem `uuid` (sem `abbreviation` p/ exibir no
    // `SelectAsyncPaginate`) — resolve o label pelo CATÁLOGO
    // (`listStateOptions`/`GET /states/options`, MESMO serviço já usado pelo
    // próprio Select de UF do formulário, linha ~908 abaixo), não pelo
    // `getStateByUuid` (`GET /states/{uuid}`, gated por `states_view`).
    // TASK-FE-667 (DF-24, BUG) — causa raiz confirmada: usuário sem
    // `states_view` recebia 403 do endpoint por-uuid, o `catch` engolia em
    // silêncio, e a UF nunca era pré-preenchida. `/states/options` é
    // explicitamente ungated (`StateController.php`, comentário "lookup sem
    // states_view") — mesmo padrão de `measurementOptions`/
    // `typeTitleNfeOption` já resolvidos por listagem neste mesmo handler.
    let stateOption: Option<string> | null = null;
    if (draft.state_uuid) {
      try {
        const stateOptionsResponse = await listStateOptions({ per_page: 100 });
        const found = (stateOptionsResponse.data.items ?? []).find(
          (item) => item.uuid === draft.state_uuid
        );
        stateOption = found ? { label: found.letter, value: draft.state_uuid } : null;
      } catch {
        stateOption = null;
      }
    }

    // GAP-BE-630/DF-13 (TASK-FE-653) — catálogo de Un. Medida (pequeno, sem
    // paginação real) buscado 1x para sugerir `measurement_uuid` de TODOS os
    // itens do draft, via `item.um` (texto crú do XML) — ver
    // `suggestMeasurementOption` acima.
    let measurementOptions: MeasurementOption[] = [];
    try {
      const measurementResponse = await listMeasurementOptions({});
      measurementOptions = measurementResponse.data.items ?? [];
    } catch {
      measurementOptions = [];
    }

    // Paridade com o legado (ver nota de `findTypeTitleNfeOption` acima) —
    // busca por LABEL no catálogo real de Tipo de Título (por tenant, sem id
    // fixo herdável do legado). `search` do backend é ILIKE PARCIAL só em
    // `description` (`TypeTitleRepository.php:23`) — a string completa evita
    // colidir com outros tipos que também contêm "Nota Fiscal" (ex. "Nota
    // Fiscal Serviço - NFSe", que não contém a substring exata buscada).
    let typeTitleNfeOption: Option<string> | null = null;
    try {
      const typeTitleResponse = await listTypeTitleOptions({
        search: TYPE_TITLE_NFE_LABEL,
        per_page: 20,
      });
      typeTitleNfeOption = findTypeTitleNfeOption(typeTitleResponse.data.items ?? []);
    } catch {
      typeTitleNfeOption = null;
    }

    reset({
      number: draft.number,
      series: draft.series,
      // DF-13 — `dt_emission` do draft é o `dhEmi` CRÚ do XML (datetime
      // completo com timezone, ex. "2024-01-15T10:30:00-03:00", mirror
      // `ParseInvoiceXmlAction.php:83`) — `DateInput` exige estritamente
      // `yyyy-MM-dd` (`isoToDate()`, `DateInput/index.tsx`) e falha
      // silenciosamente (campo fica vazio) com qualquer sufixo de
      // hora/timezone. Truncar para os 10 primeiros chars é o MESMO idioma
      // que o backend já usa para a parcela fallback (`substr(...,0,10)`,
      // `ParseInvoiceXmlAction.php:197`) — sem perda de fidelidade (o campo
      // do form é só de DATA, sem hora).
      dt_emission: draft.dt_emission ? draft.dt_emission.slice(0, 10) : null,
      delivery_date: null,
      provider_uuid:
        draft.provider.matched && draft.provider.uuid
          ? { label: draft.provider.name, value: draft.provider.uuid }
          : null,
      // `proprietary` do draft só tem `nif` (sem nome p/ exibir) — mesmo
      // limite do backend documentado em `InvoiceXmlDraftData`; deixado
      // null mesmo quando `matched===true` para não fabricar um label —
      // usuário reconfirma manualmente (SEM MOCK).
      proprietary_uuid: null,
      state_uuid: stateOption,
      // DF-13 (reconfirmado por leitura direta do legado, `GeneralService::
      // xmlToInvoice()`, `GeneralService.php:160` — `'type' => null`
      // explícito dentro do próprio `$invoice->fill()`) — "Tipo Nota" NUNCA
      // é derivado do CONTEÚDO do XML, nem pelo legado. Mesma conclusão para
      // `type_title_uuid` (sem equivalente na tabela `invoices` do legado —
      // a FK `type_titles` ali é usada só por Expense/Income/Transfer,
      // nunca por Invoice; campo NOVO do contrato do fork).
      // Execução 035 (paridade de tela) — AMBOS recebem, ainda assim, um
      // DEFAULT DE FORMULÁRIO para import de XML NFe (mod 55, único fluxo
      // que `POST /invoices/parse-xml` aceita — `ParseInvoiceXmlAction::
      // parseNfeNode()` rejeita qualquer XML que não seja NFe) — mirror do
      // que a TELA do legado mostra: "Tipo Nota" = "NF-e" (`type=1`, 1ª
      // option de um `<select>` sem opção vazia, `Invoice::types()`) e "Tipo
      // de Título" = "Nota Fiscal - NFe" (`type_id=4`, default explícito em
      // `_forms.blade.php:104`). Ver `findTypeTitleNfeOption`/comentário
      // acima para o porquê de resolver por MATCH DE LABEL em vez de id
      // fixo. `apportionment_type`/`harvest_uuid` seguem SEM default — nenhum
      // equivalente encontrado no legado para eles neste fluxo.
      type_title_uuid: typeTitleNfeOption,
      conveyor: null,
      type: {
        label: invoiceDocumentTypeOptions.getLabel(invoiceDocumentTypeIndex.NFE, languageGB),
        value: invoiceDocumentTypeIndex.NFE,
      },
      classification: { label: text.classificationOptions.notClassified, value: 'N' },
      apportionment_type: null,
      harvest_uuid: null,
      note: draft.note ?? null,
      state_registration: draft.state_registration ?? null,
      chave: draft.chave,
      vl_freight: draft.vl_freight ?? 0,
      vl_safe: draft.vl_safe ?? 0,
      vl_expense: 0,
      vl_ipi: draft.vl_ipi ?? 0,
      vl_discount: draft.vl_discount ?? 0,
      items: draft.items.map((item): InvoiceItemForm => ({
        product_uuid:
          item.product_matched && item.product_uuid
            ? { label: item.description, value: item.product_uuid }
            : null,
        quantity: item.quantity,
        amount: item.amount,
        total_amount: item.total_amount,
        has_lot: item.has_lot,
        // Fixo `null`/`false` no draft (fiel ao legado, `GeneralService.
        // php:132-133`) — usuário decide no submit final.
        warehouse_uuid: null,
        center_uuid: null,
        category_uuid: null,
        cultivation_uuid: null,
        // GAP-BE-630/DF-13 (TASK-FE-653) — SUGESTÃO client-side a partir do
        // texto crú da unidade do XML (`item.um`), fuzzy/exato contra
        // `Measurement.name`; `null` quando não casa (usuário escolhe).
        measurement_uuid: suggestMeasurementOption(item.um, measurementOptions),
        generates_stock: false,
        is_equipment: false,
        provider_lot: null,
        shelf_life: null,
        ipi: item.ipi ?? null,
        icms: item.icms ?? null,
        discount: item.discount ?? 0,
        appropriation_type: null,
        equipment: null,
        // GAP-BE-630/DF-13 (TASK-FE-653) — hint client-only preservado SÓ
        // quando o Produto não casou (`product_matched===false`): exibido
        // ao lado do Select "Produto" + prefill do botão "+ Criar Produto"
        // (`InvoiceItemsTab.tsx`). NUNCA enviado no payload.
        xml_description: !item.product_matched ? item.description : null,
        xml_ncm: !item.product_matched ? item.ncm : null,
        // TASK-FE-668 (DF-25, rework, execução 034) — texto CRÚ da unidade
        // do XML preservado SÓ quando o Produto não casou, mirror EXATO de
        // `xml_description`/`xml_ncm` acima — prefill de "1ª Un. Medida" no
        // Modal "Criar Produto a partir do XML" (`CreateProductFromXmlModal.
        // tsx`, via `suggestMeasurementOption`, MESMA função já usada acima
        // para `measurement_uuid` do próprio item). NUNCA enviado no
        // payload (não existe em `InvoiceItemPayload`).
        xml_um: !item.product_matched ? item.um : null,
        aprop_cultivation_uuid: null,
        aprop_area_uuid: null,
        aprop_operation_uuid: null,
        aprop_activity_uuid: null,
      })),
      installments: draft.installments.map((installment) => ({
        due_date: installment.due_date,
        value: installment.value,
      })),
      categories: [],
    });

    if (!draft.provider.matched) {
      toaster.warning({
        title: formText.xmlImport.buttonLabel,
        description: formText.xmlImport.providerUnmatchedHint,
        duration: 8000,
      });
    }
  }

  // TASK-DFE-FE-08 (lançamento cross-módulo "Lançar Produto" — DFe Recebidas
  // já baixou o XML e chamou `parseInvoiceXml` DIRETO, ver
  // `Fiscal/Dfe/index.tsx::handleLaunchInvoice`) — o draft já resolvido
  // chega pronto via `state` de navegação; aplica o MESMO `handleXmlImported`
  // do upload manual (nenhuma lógica de criação duplicada), SEM abrir
  // `InvoiceXmlUploadModal` (o picker não faz sentido, o arquivo já foi
  // processado). Roda 1x no mount, só em criação — mirror da regra "SÓ na
  // tela de CRIAÇÃO" já aplicada ao modal manual (cabeçalho do arquivo).
  useEffect(() => {
    if (isEditing) return;
    const incomingDraft = (location.state as { dfeXmlDraft?: InvoiceXmlDraft } | null)?.dfeXmlDraft;
    if (!incomingDraft) return;

    handleXmlImported(incomingDraft);
    // Limpa o `state` da entrada de histórico — evita reaplicar o draft ao
    // voltar/atualizar a página (mirror do racional de "consumir uma vez"
    // já usado por outras telas que recebem contexto via navegação).
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  function fillInvoiceForm(data: InvoiceDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        number: data.number,
        series: data.series,
        dt_emission: data.dt_emission,
        delivery_date: data.delivery_date ?? null,
        provider_uuid: data.provider
          ? { label: data.provider.name, value: data.provider.uuid }
          : null,
        proprietary_uuid: data.proprietary
          ? { label: data.proprietary.name, value: data.proprietary.uuid }
          : null,
        state_uuid: data.state ? { label: data.state.abbreviation, value: data.state.uuid } : null,
        // `type_title_uuid` NÃO volta no InvoiceResource (write-only, sem
        // relação exposta) — não é possível reidratar a seleção em edição;
        // o usuário precisa reconfirmar o Tipo de Título ao editar.
        type_title_uuid: null,
        conveyor: data.conveyor ?? null,
        type: {
          label: invoiceDocumentTypeOptions.getLabel(data.type, languageGB),
          value: data.type,
        },
        classification: data.classification
          ? {
              label: invoiceClassificationOptions.getLabel(data.classification, languageGB),
              value: data.classification,
            }
          : { label: text.classificationOptions.notClassified, value: 'N' },
        apportionment_type: {
          label: invoiceApportionmentTypeOptions.getLabel(data.apportionment_type, languageGB),
          value: data.apportionment_type,
        },
        harvest_uuid: data.harvest ? { label: data.harvest.uuid, value: data.harvest.uuid } : null,
        note: data.note ?? null,
        state_registration: data.state_registration ?? null,
        // WRITE-ONLY, client-only — nunca reidratado em edição (a API não
        // devolve `chave` para reimportação; edição não usa o fluxo de XML).
        chave: null,
        vl_freight: data.vl_freight ?? 0,
        vl_safe: data.vl_safe ?? 0,
        vl_expense: data.vl_expense ?? 0,
        vl_ipi: data.vl_ipi ?? 0,
        vl_discount: data.vl_discount ?? 0,
        items: (data.items ?? []).map((item) => ({
          product_uuid: item.product
            ? { label: item.product.description, value: item.product.uuid }
            : null,
          quantity: item.quantity,
          amount: item.amount,
          // TASK-FE-624 (DF-04) — reidrata o preview de "V. Total(R$)" em
          // edição (campo write-only/preview, servidor sempre recalcula).
          total_amount: item.total_amount ?? null,
          // TASK-FE-627 (DF-09) — bug real era este campo NUNCA ser
          // semeado a partir do item carregado (`has_lot` do
          // `ItemInvoiceDetail` já vem da API); mirror exato do seed de
          // `generates_stock: !!item.warehouse` abaixo.
          has_lot: !!item.has_lot,
          warehouse_uuid: item.warehouse
            ? { label: item.warehouse.description, value: item.warehouse.uuid }
            : null,
          center_uuid: item.center ? { label: item.center.uuid, value: item.center.uuid } : null,
          category_uuid: item.category
            ? { label: item.category.description, value: item.category.uuid }
            : null,
          cultivation_uuid: item.cultivation
            ? { label: item.cultivation.uuid, value: item.cultivation.uuid }
            : null,
          measurement_uuid: item.measurement
            ? { label: item.measurement.uuid, value: item.measurement.uuid }
            : null,
          generates_stock: !!item.warehouse,
          is_equipment: !!item.is_equipment,
          provider_lot: item.provider_lot ?? null,
          shelf_life: item.shelf_life ?? null,
          ipi: item.ipi ?? null,
          icms: item.icms ?? null,
          discount: item.discount ?? 0,
          appropriation_type:
            item.appropriation_type !== null && item.appropriation_type !== undefined
              ? { label: String(item.appropriation_type), value: item.appropriation_type }
              : null,
          equipment: null,
          // GAP-BE-630/DF-13 — hint só existe no fluxo de upload de XML
          // (`handleXmlImported`); edição nunca tem draft, sempre `null`.
          xml_description: null,
          xml_ncm: null,
          xml_um: null,
          // TASK-FE-625/DF-05 — mesma limitação pré-existente de
          // `aprop_area_uuid`/`aprop_activity_uuid`/`aprop_operation_uuid`
          // (nunca reidratados em edição, fora do escopo desta Tarefa — ver
          // "Chokepoint"/DoD do task-packet, só ADICIONA os campos novos).
          aprop_cultivation_uuid: null,
          aprop_area_uuid: null,
          aprop_operation_uuid: null,
          aprop_activity_uuid: null,
        })),
        // WRITE-ONLY — nunca reidratados em edição (ver cabeçalho do arquivo).
        installments: [],
        categories: [],
      });
    }
  }

  const invoiceQuery = useInvoiceForm({
    registrationId: isEditing ? invoiceId : undefined,
    fillForm: fillInvoiceForm,
  });

  const isLoading = isEditing && hasFarm && checkLoadingStatus([invoiceQuery as any]);

  const invoiceMutation = useRequest({
    asyncFunction: tryPersistInvoice,
    entityName: text.singularLabel,
    queryKey: queryKey.invoices.invoices,
    queryKey2: queryKey.invoices.invoice,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistInvoice(data: InvoiceFormType) {
    const items = data.items.map((item) => ({
      product_uuid: item.product_uuid!.value,
      quantity: Number(item.quantity),
      amount: Number(item.amount),
      warehouse_uuid: item.warehouse_uuid?.value ?? null,
      center_uuid: item.center_uuid?.value ?? null,
      category_uuid: item.category_uuid?.value ?? null,
      cultivation_uuid: item.cultivation_uuid?.value ?? null,
      measurement_uuid: item.measurement_uuid?.value ?? null,
      is_equipment: !!item.is_equipment,
      provider_lot: item.provider_lot?.trim() || null,
      shelf_life: item.shelf_life || null,
      ipi: item.ipi ?? null,
      icms: item.icms ?? null,
      discount: Number(item.discount ?? 0),
      appropriation_type: item.appropriation_type?.value ?? null,
      // TASK-FE-629/630/631 (DF-10, execução 035) — expandido de 5 para 24
      // campos (GAP-BE-623/TASK-BE-623, `InvoiceRequest::rules()` real).
      // `product_uuid`/`provider_uuid`/`use_fiscal` NUNCA enviados — são
      // SEMPRE auto-derivados no servidor (`PrepareInvoiceEquipmentDataAction`,
      // GAP-BE-623 §2), nem aceitos pelo `InvoiceRequest` neste contexto.
      // `equipment_type` fixo `'P'` — Doc.Fiscal só cria bens PRÓPRIOS.
      // `residual` só enviado quando `depreciation_type===COM_RESIDUAL` (mirror
      // EXATO de `CreateOrUpdateEquipamento.tsx::tryPersistEquipment`).
      equipment:
        item.is_equipment && item.equipment
          ? {
              family_equipment_uuid: item.equipment.family_equipment_uuid!.value,
              description: item.equipment.description.trim(),
              vl_time_productive: Number(item.equipment.vl_time_productive ?? 0),
              vl_time_unproductive: 0,
              vl_acquisition: Number(item.equipment.vl_acquisition ?? 0),
              status: Number(item.equipment.status?.value ?? 1),
              proprietary_uuid: item.equipment.proprietary_uuid?.value ?? null,
              equipment_type: 'P' as const,
              hour_meter: item.equipment.hour_meter ?? null,
              year_mod: item.equipment.year_mod?.trim() || null,
              brand: item.equipment.brand?.trim() || null,
              patrimony: item.equipment.patrimony?.trim() || null,
              chassi: item.equipment.chassi?.trim() || null,
              renavam: item.equipment.renavam?.trim() || null,
              serie: item.equipment.serie?.trim() || null,
              plate: item.equipment.plate?.trim()
                ? formatPlateIfValid(item.equipment.plate.trim())
                : null,
              uf: item.equipment.uf || null,
              color: item.equipment.color?.trim() || null,
              model: item.equipment.model?.trim() || null,
              has_depreciation: !!item.equipment.has_depreciation,
              depreciation_type: item.equipment.depreciation_type ?? null,
              residual:
                item.equipment.depreciation_type === FamilyEquipmentDepreciationType.COM_RESIDUAL
                  ? (item.equipment.residual ?? null)
                  : null,
              life_bens: item.equipment.life_bens ?? null,
              dt_acquisition: item.equipment.dt_acquisition || null,
              specification: item.equipment.specification?.trim() || null,
            }
          : null,
      aprop_equipment_uuid: null,
      // TASK-FE-625/DF-05 (GAP-BE-621/TASK-BE-621) — só lido pelo backend
      // quando `appropriation_type=AGRICOLA`; enviado sempre (mesmo padrão
      // dos 3 irmãos abaixo), backend ignora nos demais ramos.
      aprop_cultivation_uuid: item.aprop_cultivation_uuid?.value ?? null,
      aprop_area_uuid: item.aprop_area_uuid?.value ?? null,
      aprop_operation_uuid: item.aprop_operation_uuid?.value ?? null,
      aprop_activity_uuid: item.aprop_activity_uuid?.value ?? null,
    }));

    const payload: InvoicePayload = {
      number: data.number.trim(),
      series: data.series.trim(),
      dt_emission: data.dt_emission!,
      delivery_date: data.delivery_date || undefined,
      provider_uuid: data.provider_uuid!.value,
      proprietary_uuid: data.proprietary_uuid!.value,
      state_uuid: data.state_uuid!.value,
      type_title_uuid: data.type_title_uuid!.value,
      conveyor: data.conveyor?.trim() || undefined,
      type: data.type!.value,
      classification: data.classification?.value ?? 'N',
      apportionment_type: data.apportionment_type!.value,
      harvest_uuid: data.harvest_uuid?.value ?? undefined,
      vl_freight: Number(data.vl_freight ?? 0),
      vl_safe: Number(data.vl_safe ?? 0),
      vl_expense: Number(data.vl_expense ?? 0),
      vl_ipi: Number(data.vl_ipi ?? 0),
      vl_discount: Number(data.vl_discount ?? 0),
      note: data.note?.trim() || undefined,
      state_registration: data.state_registration?.trim() || undefined,
      // TASK-FE-628 (DF-03) — presente só quando o form foi populado por
      // upload de XML (TASK-BE-625 promove o XML staged a definitivo).
      chave: data.chave || undefined,
      items,
      // WRITE-ONLY, `sometimes` no update — omitidos por completo na edição
      // (o backend ignora mesmo se enviados; enviar array vazio falharia o
      // `min:1` do próprio Request quando a chave está presente).
      ...(isEditing
        ? {}
        : {
            installments: data.installments.map((installment) => ({
              due_date: installment.due_date!,
              value: Number(installment.value),
            })),
            categories: data.categories.map((category) => ({
              category_uuid: category.category_uuid!.value,
              percentage: Number(category.percentage),
              center_uuid: category.center_uuid!.value,
            })),
          }),
    };

    if (isEditing && invoiceId) {
      return await updateInvoice(invoiceId, payload);
    }
    return await createInvoice(payload);
  }

  const isSubmitting = invoiceMutation.isPending;

  async function onSubmit(data: InvoiceFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await invoiceMutation.mutateAsync(data);
    }
  }

  function onInvalid(formErrors: FieldErrors<InvoiceFormType>) {
    const erroredFieldNames = Object.keys(formErrors) as (keyof InvoiceFormType)[];
    if (erroredFieldNames.length === 0) return;

    const erroredTab = erroredFieldNames
      .map((field) => FIELD_TAB_MAP[field])
      .find((tab): tab is InvoiceTabKey => !!tab && tab !== tabValue);

    if (erroredTab) {
      setTabValue(erroredTab);
    }

    const firstErrorMessage = Object.values(formErrors).find(
      (fieldError): fieldError is { message?: string } =>
        !!fieldError && typeof fieldError === 'object' && 'message' in fieldError
    )?.message;

    toaster.error({
      title: isEditing ? formText.title.edit : formText.title.create,
      description: firstErrorMessage ?? formText.errors.invalidFields,
      duration: 6000,
    });
  }

  const documentTypeOptions = invoiceDocumentTypeOptions.options(languageGB);
  const classificationOptions = invoiceClassificationOptions.options(languageGB);
  const apportionmentTypeOptions = invoiceApportionmentTypeOptions.options(languageGB);

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      subtitle={isEditing ? formText.subtitle.edit : formText.subtitle.create}
      showDivider
      headerActions={
        // TASK-FE-628 (DF-03) — SÓ na criação, mirror do legado
        // (`create.blade.php`, não replicado em `edit.blade.php`).
        !isEditing ? (
          <Button
            title={formText.xmlImport.buttonLabel}
            icon={FiUpload as any}
            variant="outline"
            size="sm"
            onClick={xmlUploadModal.onOpen}
            disabled={isSubmitting}
          />
        ) : undefined
      }
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            onClick={() => navigate(-1)}
            type="button"
            disabled={isSubmitting}
          />
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      {!isEditing && (
        <InvoiceXmlUploadModal
          isOpen={xmlUploadModal.open}
          onClose={xmlUploadModal.onClose}
          onImported={handleXmlImported}
        />
      )}

      <Form onSubmit={handleSubmit(onSubmit, onInvalid)} noPadding>
        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(details: { value: string }) =>
            setTabValue(details.value as InvoiceTabKey)
          }
          variant="outline"
        >
          {/* @ts-ignore - Tab List fixa (sticky) no topo do body: as abas ficam
              sempre visíveis; só o conteúdo da aba rola. `bg` cobre o conteúdo
              que passa por baixo ao rolar. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">{formText.tabs.header}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{formText.tabs.items}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="2">{formText.tabs.installments}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="3">{formText.tabs.apportionment}</Tabs.Trigger>
          </Tabs.List>

          {/* ---- ABA 1: Cabeçalho (TASK-FE-2763, ESTE arquivo) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="0">
            <SimpleGrid columns={columnsForm.default} gap={6} pt={4}>
              <Input
                label={formText.fields.number}
                placeholder={formText.placeholders.number}
                maxLength={15}
                {...register('number')}
                error={errors.number?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
              />

              <Input
                label={formText.fields.series}
                placeholder={formText.placeholders.series}
                maxLength={3}
                {...register('series')}
                error={errors.series?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
              />

              <Controller
                name="provider_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.provider}
                    placeholder={formText.placeholders.provider}
                    tooltip={formText.hints.providerQuickAddUnavailable}
                    error={errors.provider_uuid?.message as string | undefined}
                    service={listProviders}
                    mapOptions={(item: { uuid: string; name: string }) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isRequired
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="proprietary_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.proprietary}
                    placeholder={formText.placeholders.proprietary}
                    error={errors.proprietary_uuid?.message as string | undefined}
                    service={listProprietaries}
                    mapOptions={(item: { uuid: string; name: string }) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isRequired
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Input
                label={formText.fields.stateRegistration}
                {...register('state_registration')}
                error={errors.state_registration?.message}
                loading={isLoading}
                disabled={!canSave}
              />

              <Controller
                name="harvest_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.harvest}
                    placeholder={formText.placeholders.harvest}
                    service={listHarvests}
                    mapOptions={(item: Harvest) => ({ label: item.description, value: item.uuid })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              {/* TASK-FE-620 (DF-01) — `DateInput` não tem prop `label`; wrapper
                  Box+Text é o MESMO padrão já usado para `shelf_life` em
                  `InvoiceItemsTab.tsx` (campo `hasLot`). */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.fields.dtEmission}
                </Text>
                <Controller
                  name="dt_emission"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={onChange}
                      disabled={!canSave || isLoading}
                    />
                  )}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.fields.deliveryDate}
                </Text>
                <Controller
                  name="delivery_date"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={onChange}
                      disabled={!canSave || isLoading}
                    />
                  )}
                />
              </Box>

              <Controller
                name="state_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.state}
                    placeholder={formText.placeholders.state}
                    error={errors.state_uuid?.message as string | undefined}
                    service={listStateOptions}
                    mapOptions={(item: StateOption) => ({ label: item.letter, value: item.uuid })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isRequired
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="type_title_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.typeTitle}
                    placeholder={formText.placeholders.typeTitle}
                    error={errors.type_title_uuid?.message as string | undefined}
                    service={listTypeTitleOptions}
                    mapOptions={(item: TypeTitleOptionItem) => ({
                      label: item.description,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isRequired
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.type}
                    placeholder={formText.placeholders.type}
                    name={name}
                    value={
                      documentTypeOptions.find((option) => option.value === value?.value) ?? null
                    }
                    onChange={(option: Option<number> | null) => onChange(option ?? null)}
                    options={documentTypeOptions}
                    error={errors.type?.message as string | undefined}
                    isRequired
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="classification"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.classification}
                    placeholder={formText.placeholders.classification}
                    name={name}
                    value={
                      classificationOptions.find((option) => option.value === value?.value) ?? null
                    }
                    onChange={(option) => onChange(option ?? null)}
                    options={classificationOptions}
                    tooltip={formText.hints.classificationDefault}
                    noClearable
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="apportionment_type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.apportionmentType}
                    placeholder={formText.placeholders.apportionmentType}
                    name={name}
                    value={
                      apportionmentTypeOptions.find((option) => option.value === value?.value) ??
                      null
                    }
                    onChange={(option) => onChange(option ?? null)}
                    options={apportionmentTypeOptions}
                    error={errors.apportionment_type?.message as string | undefined}
                    isRequired
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />
            </SimpleGrid>

            {/* TASK-FE-685/DF-28 — Chave NFe: campo já existente no
                form/payload (populado por `handleXmlImported` no import de
                XML), sem visibilidade até aqui. Área destacada (mirror do
                card `Box border+borderRadius="lg" p={4}` já usado em
                `InvoiceItemsTab.tsx:523`/`AppropriationOccurrencesTab.tsx:
                172`), readonly, só renderiza quando `chave` está preenchido
                (ausente em criação manual/edição sem XML). */}
            {watch('chave') && (
              <Box mt={4} p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
                <InputReadOnly label={formText.fields.nfeKey} value={watch('chave') as string} />
              </Box>
            )}

            <Box mt={6} w="full">
              <Textarea
                label={formText.fields.note}
                {...register('note')}
                error={errors.note?.message}
                disabled={!canSave || isLoading}
              />
            </Box>
          </Tabs.Content>

          {/* ---- ABA 2: Itens & Totais (TASK-FE-2764) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="1">
            <InvoiceItemsTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
            />
          </Tabs.Content>

          {/* ---- ABA 3: Parcelamento (TASK-FE-2765) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="2">
            <InvoiceInstallmentsTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              isEditing={isEditing}
            />
          </Tabs.Content>

          {/* ---- ABA 4: Rateio (TASK-FE-2766) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="3">
            <InvoiceApportionmentTab
              control={control}
              errors={errors}
              watch={watch}
              isLoading={!!isLoading}
              canSave={canSave}
              isEditing={isEditing}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Form>
    </FormContainer>
  );
}
