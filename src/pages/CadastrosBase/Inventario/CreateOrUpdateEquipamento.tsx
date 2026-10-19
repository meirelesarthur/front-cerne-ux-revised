// src/pages/CadastrosBase/Inventario/CreateOrUpdateEquipamento.tsx
// -----------------------------------------------------------------------------
// Tela ÂNCORA de CRIAÇÃO e EDIÇÃO de INVENTÁRIO (Equipment — Cadastros Base /
// Bens-Ativos, execução 026, `TASK-FE-1005`). MESMO arquivo para os dois
// casos (`isEditing = isValidGuid(equipmentId)`, mirror
// `CreateOrUpdateProduto.tsx`/`CreateOrUpdateKind.tsx`). Rotas previstas
// `/cadastros-base/inventario/novo` e `/:equipmentId` — wiring real de rota é
// `TASK-FE-1011` (CHOKEPOINT, NÃO tocado aqui).
//
// Casca de 5 ABAS (`Tabs.Root`, mirror `CreateOrUpdateProduto.tsx`) — Aba
// "Identificação" (`TASK-FE-1005`, ESTE arquivo, inline) + 4 abas em ARQUIVOS
// SEPARADOS, hoje STUBS vazios (`EquipamentoFinanceiroDepreciacaoTab.tsx`/
// `EquipamentoFiscalVeiculoTab.tsx`/`EquipamentoRateioCentroCustoTab.tsx`/
// `EquipamentoAnexosTab.tsx`) — cada uma recebe `control`/`errors`/`watch`/
// `setValue` do MESMO `useForm` raiz (nenhum `useForm` local por aba), mesmo
// mecanismo de `ProdutoEstoqueFinanceiroTab.tsx`/`ProdutoFiscalTab.tsx`. Isto
// é DELIBERADO: permite que `TASK-FE-1006..1009` rodem em PARALELO (4
// Executores simultâneos), cada um editando SÓ o seu próprio arquivo de aba,
// sem tocar de novo este arquivo âncora (ver Equipment-Frontend-Contrato.md
// §16, "Grafo de paralelismo").
//
// Schema Yup (`equipment-schema.ts`, `TASK-FE-1003`) já valida as 5 abas de
// uma vez (`equipmentSchemaResolver`) — mesmo achado de `product-schema.ts`.
// `EquipmentForm` (`@/@types/v2/Equipments`) foi por isso escrito COMPLETO
// por esta Tarefa (âncora), cobrindo os campos das 5 abas — as Tarefas
// 1006-1009 CONSOMEM esse tipo, nunca o editam (evita colisão de arquivo).
//
// Multipart (`FormData`, diferente de Produtos que usa JSON puro) — por
// causa de `image` (RN-9) + `attachments[]` (RN-9, aba própria). Método
// spoofing (`POST + _method=PUT`) no `update`, já implementado pelo service
// (`TASK-FE-1001`) — este arquivo só monta o `EquipmentPayload` e chama
// `createEquipment`/`updateEquipment`.
//
// -- Riscos + solução (task-packet) -----------------------------------------
// (1) `isEmpty()` invertido — guarda `!isEmpty(dirtyFields) || resetForce`
//     no `fillForm`, e `!isEmpty(dirtyFields) && !hasImageChange` no
//     `onSubmit` (mirror `CreateOrUpdateFamiliaBens.tsx`, imagem NÃO é campo
//     RHF).
// (2) RN-6 (autofill): `depreciation`/`life_bens`/`residual`/
//     `depreciation_type` moram na aba Financeiro (arquivo separado,
//     `TASK-FE-1006`), mas o disparo é AQUI, no `onChange` do Controller de
//     `family_equipment_uuid` — via `setValue` do RHF RAIZ (compartilhado),
//     NUNCA `useEffect`. FONTE: a própria option selecionada no
//     `SelectAsyncPaginate` (`mapOptions` embute o item COMPLETO de
//     `/family-equipments/options` em `option.template`, mirror
//     `AppropriationProductionTab.tsx`/`ChargeItemRow.tsx`) — NÃO MAIS `GET
//     /family-equipments/{uuid}` (gateado por `familyequipments_view`, 403
//     reproduzido pelo dev).
// (3) `whenLoaded()` — o prefill de edição depende do `GET /equipments/{uuid}`
//     trazer `family`/`product`/`provider`/`proprietary` aninhados; se algum
//     vier ausente, é bloqueio de backend (SINALIZAR, não contornar).
// (4) Upload de imagem — estado FORA do RHF (`useState` local), mirror EXATO
//     de `CreateOrUpdateFamiliaBens.tsx` (`imageFile`/`removeImage`/
//     `currentImageUrl`).
// (5) `equipment_type` (RN-5) — gate de edição por Família selecionada;
//     fallback por comparação de LABEL (a API de `/family-equipments/options`
//     não expõe um campo estável de categoria — ver §14.5 do contrato de
//     tela), documentado como decisão consciente, não bug.
//
// Guarda `onInvalid` (armadilha de formulário com abas: erro só visível numa
// aba que não é a atual) — cobre o FORM TODO (`handleSubmit(onSubmit,
// onInvalid)`), navega para a 1ª aba com erro e mostra um toast com a
// mensagem REAL do 1º erro (mensagens já 100% localizadas pelo próprio Yup,
// TASK-FE-1003 — evita precisar de 2 chaves i18n novas só para isso).
//
// ⚠️ WIZARD Voltar/Próximo (pedido do dev, correção E2E execução 026) — o
// rodapé fixo "Cancelar/Salvar" virou "Voltar/Próximo", "Próximo" vira
// "Salvar" (`type="submit"`) só na ÚLTIMA aba (Anexos). Decisão registrada:
// "Voltar" na 1ª aba SAI do formulário (`navigate(-1)`, mesmo destino do
// antigo "Cancelar") — mirror de `CreateOrUpdateFarm.tsx::handleBack`
// (`navigate(-1)` sem passo anterior), NÃO o `guardedBack`/dialog de
// confirmação de `CreateOrUpdatePessoa.tsx` (fora do escopo pedido; esta
// tela nunca teve esse guard). Diferente dos 2 wizards de precedente
// (`StepsRoot` controlado, clique só aceito em etapa `completed`, validação
// por etapa via `trigger()`), aqui o `Tabs.Root` nativo continua 100% livre
// (clique direto em qualquer aba, sem travar navegação linear — pedido
// explícito da Tarefa) e a validação continua ÚNICA, no `handleSubmit(
// onSubmit, onInvalid)` do form inteiro (o guard `onInvalid` cross-tab
// abaixo é que resolve erro em aba não visitada) — "Próximo" NÃO chama
// `trigger()` por aba, só avança `tabValue`.
//
// ⚠️ LIMITAÇÃO CONHECIDA E ESPERADA DESTA TAREFA (âncora, não bug): os
// campos OBRIGATÓRIOS pelo schema que vivem nas abas 2-5
// (`vl_time_productive`/`vl_acquisition`/`year_mod`/`has_depreciation`/
// `depreciation_type`) ainda não têm UI editável (stubs "sem lógica ainda",
// DoD da Tarefa) — um submit completo só é possível depois que
// `TASK-FE-1006` (no mínimo) publicar a aba Financeiro. Ver "Teste do dev
// (sugerido)" da Tarefa e o relatório de entrega desta execução.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { EmptyState, Icon, SimpleGrid, Tabs, VStack } from '@chakra-ui/react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { FiTool } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { ImageUpload } from '@/components/Form/ImageUpload';
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

import { columnsForm } from '@/constants/coluns-form';
import { FamilyEquipmentDepreciationType } from '@/constants/FamilyEquipmentDepreciationType';
import { queryKey } from '@/constants/query-key';

import { equipmentSchemaResolver } from '@/validations/schemas/CadastrosBase/equipment-schema';

import { listFamilyEquipmentOptions } from '@/services/v2/BaseRegistrations/familyEquipment-service';
import { createEquipment, updateEquipment } from '@/services/v2/Equipments/equipment-service';
import { listProducts } from '@/services/v2/Products/product-service';

import type { Option } from '@/@types/option';
import type { FamilyEquipmentOption } from '@/@types/v2/BaseRegistrations/familyEquipment';
import type {
  EquipmentData,
  EquipmentForm as EquipmentFormType,
  EquipmentPayload,
} from '@/@types/v2/Equipments';
import type { ProductListItem } from '@/@types/v2/Products';

import { EquipamentoAnexosTab } from './EquipamentoAnexosTab';
import { EquipamentoFinanceiroDepreciacaoTab } from './EquipamentoFinanceiroDepreciacaoTab';
import { EquipamentoFiscalVeiculoTab } from './EquipamentoFiscalVeiculoTab';
import { EquipamentoRateioCentroCustoTab } from './EquipamentoRateioCentroCustoTab';
import { useEquipmentProductPrefill } from './useEquipmentProductPrefill';
import { useEquipmentForm } from './useEquipments';

// RN-5 — 4 descrições fixas de Família que liberam a edição de
// `equipment_type` (Doc Bruta §7, `_forms.blade.php` linhas 390-411).
// Comparação por LABEL (fallback documentado — Equipment-Frontend-
// Contrato.md §6/§14.5): a API de `/family-equipments/options` devolve só
// `{uuid, description}` (lookup enxuto), sem campo estável de categoria.
const EQUIPMENT_TYPE_EDITABLE_FAMILIES = [
  'Máquinas Agrícolas',
  'Implementos Agrícolas',
  'Equipamentos Agrícolas',
  'Veículos Automotores',
];

// `GET /family-equipments/options` (`FamilyEquipmentOption`, tipo COMPARTILHADO
// em `@/@types/v2/BaseRegistrations/familyEquipment`) — UNGATED, sem permissão
// dedicada (mirror `cost-centers/options`/`proprietaries/options`), PAGINADO
// (`search`/`page`/`per_page`, `listFamilyEquipmentOptions`, mirror
// `src/pages/Relatorios/Bens/Inventario/index.tsx`). CORREÇÃO UT-000750
// (esteira 114): este Select listava só os 15 primeiros registros da página 1
// (nunca paginava/buscava) — era `Select` estático com fetch bulk de 1 página.
// Trocado por `SelectAsyncPaginate` (busca por digitação + paginação real),
// com `is_enabled: 'true'` (mirror `FilterSideInventario.tsx`/
// `FilterSideCatalogo.tsx`, ERRO-04a — sem o filtro o endpoint também devolve
// Famílias desabilitadas, que o legado escondia). O item COMPLETO de cada
// opção (incluindo os 4 campos de molde de depreciação) é embutido em
// `option.template` por `mapOptions` — RN-6 (`handleFamilyAutofill`, abaixo)
// lê DAQUI, não mais de `GET /family-equipments/{uuid}` (endpoint gateado por
// `familyequipments_view`, 403 quando o usuário não tem essa permissão — bug
// original já corrigido numa execução anterior, preservado aqui).
interface FamilyEquipmentSelectOption extends Option<string> {
  template?: FamilyEquipmentOption;
}

type EquipmentTabKey = '0' | '1' | '2' | '3' | '4';

// ⚠️ ADITIVO (pedido do dev, correção E2E execução 026) — wizard
// Voltar/Próximo no rodapé, "Próximo" vira "Salvar" só na ÚLTIMA aba.
// Ordem FIXA das 5 abas (mesma ordem visual de `Tabs.List` abaixo) — usada
// só para achar o vizinho anterior/seguinte de `tabValue`, NUNCA para
// travar a navegação por clique direto na aba (que continua livre, mirror
// do comportamento pré-existente desta tela — diferente de
// `CreateOrUpdateFarm.tsx`/`CreateOrUpdatePessoa.tsx`, cujo `StepsRoot`
// controlado só aceita clique em etapa já `completed`; aqui o `Tabs.Root`
// nativo do Chakra sempre foi livre e a Tarefa pediu para PRESERVAR isso).
const TAB_ORDER: EquipmentTabKey[] = ['0', '1', '2', '3', '4'];

const TAB_FIELDS: Record<EquipmentTabKey, (keyof EquipmentFormType)[]> = {
  '0': [
    'family_equipment_uuid',
    'description',
    'specification',
    'model',
    'patrimony',
    'product_uuid',
    'status',
    'equipment_type',
    'features',
  ],
  '1': [
    'vl_time_productive',
    'provider_uuid',
    'dt_acquisition',
    'vl_acquisition',
    'hour_meter',
    'year_mod',
    'has_depreciation',
    'life_bens',
    'depreciation_type',
    'residual',
    'vl_residual',
    'vl_depreciate',
    'depreciation',
  ],
  '2': [
    'use_fiscal',
    'chassi',
    'renavam',
    'serie',
    'plate',
    'color',
    'uf',
    'brand',
    'rntrc',
    'type',
    'body_type',
    'wheel_type',
    'tara',
    'capacity',
    'owner_type',
    'owner_document',
    'owner_name',
    'owner_ie',
    'owner_uf',
    'owner_tp',
  ],
  '3': ['cost_centers'],
  '4': ['attachments'],
};

const FIELD_TAB_MAP: Partial<Record<keyof EquipmentFormType, EquipmentTabKey>> = Object.fromEntries(
  (Object.entries(TAB_FIELDS) as [EquipmentTabKey, (keyof EquipmentFormType)[]][]).flatMap(
    ([tab, fields]) => fields.map((field) => [field, tab])
  )
);

export default function CreateOrUpdateEquipamento() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can, hasFarm } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:equipmentId`).
  const isEditing = isValidGuid(equipmentId);

  // Guard de navegação: `equipmentId` presente mas NÃO é um GUID válido (URL
  // adulterada) — redireciona para a listagem (mirror
  // `CreateOrUpdateProduto.tsx`).
  useEffect(() => {
    if (equipmentId && !isValidGuid(equipmentId)) {
      navigate('/cadastros-base/inventario', { replace: true });
    }
  }, [equipmentId, navigate]);

  const text = languageGB.equipments.equipment;
  const formText = text.form;

  const canSave = isEditing ? can('equipments_edit') : can('equipments_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<EquipmentFormType>({
    mode: 'onChange',
    resolver: equipmentSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      // -- Aba "Identificação" --
      family_equipment_uuid: null,
      description: '',
      specification: null,
      model: null,
      patrimony: null,
      product_uuid: null,
      status: null,
      equipment_type: 'P',
      features: [],

      // -- Aba "Financeiro/Depreciação" (stub, TASK-FE-1006) --
      vl_time_productive: null,
      provider_uuid: null,
      dt_acquisition: null,
      vl_acquisition: null,
      hour_meter: null,
      year_mod: '',
      has_depreciation: true,
      life_bens: null,
      depreciation_type: FamilyEquipmentDepreciationType.SEM_RESIDUAL,
      residual: null,
      vl_residual: 0,
      vl_depreciate: 0,
      depreciation: null,

      // -- Aba "Fiscal/Veículo" (stub, TASK-FE-1007) --
      use_fiscal: true,
      chassi: null,
      renavam: null,
      serie: null,
      plate: null,
      color: null,
      uf: null,
      brand: null,
      rntrc: null,
      type: null,
      body_type: null,
      wheel_type: null,
      tara: null,
      capacity: null,
      owner_type: null,
      owner_document: null,
      owner_name: null,
      owner_ie: null,
      owner_uf: null,
      owner_tp: null,

      // -- Aba "Rateio — Centro de Custo" (stub, TASK-FE-1008) --
      cost_centers: [],

      // -- Aba "Anexos" (stub, TASK-FE-1009) --
      attachments: [],
    },
  });

  const [tabValue, setTabValue] = useState<EquipmentTabKey>('0');

  // ---- Estado da imagem (NÃO é campo RHF — mirror EXATO de
  // `CreateOrUpdateFamiliaBens.tsx`). `imageFile` = arquivo novo selecionado
  // nesta sessão; `removeImage` = flag local que vira `remove_image=1` no
  // submit; `currentImageUrl` = espelho de `data.image_url` (edição), só
  // para preview.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  function handleFileSelected(file: File | null) {
    setImageFile(file);
    setRemoveImage(false);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setRemoveImage(true);
    setCurrentImageUrl(null);
  }

  // RN-5 + RN-6 — disparado no MESMO `onChange` do Controller de
  // `family_equipment_uuid` (nunca `useEffect`, ver Risco (2) do cabeçalho).
  // CORREÇÃO UT-000750 — `option` agora vem do `SelectAsyncPaginate`
  // (`FamilyEquipmentSelectOption`, ver cabeçalho do arquivo), não mais do
  // array bulk de `familyOptionsQuery.data`.
  function handleFamilyAutofill(option: FamilyEquipmentSelectOption | null) {
    if (!option) {
      setValue('equipment_type', 'P', { shouldDirty: true });
      return;
    }

    // RN-5 — trava `equipment_type` em 'P' fora do conjunto de 4 Famílias
    // que liberam a edição (fallback por label, ver cabeçalho do arquivo).
    if (!EQUIPMENT_TYPE_EDITABLE_FAMILIES.includes(option.label)) {
      setValue('equipment_type', 'P', { shouldDirty: true });
    }

    // RN-6 — autofill dos campos de depreciação (aba Financeiro) a partir do
    // molde da Família selecionada. FONTE: `option.template` — o item
    // COMPLETO de `/family-equipments/options` embutido pelo `mapOptions` do
    // próprio `SelectAsyncPaginate` (ver cabeçalho do arquivo) — NÃO mais
    // `getFamilyEquipmentByUuid` (`GET /family-equipments/{uuid}`, endpoint
    // gateado por `familyequipments_view`, 403 quando o usuário não tem essa
    // permissão). Troca de FONTE apenas — RN-6 preservada como estava (mesmos
    // 4 campos, mesmo `shouldDirty: true`, mesmo silêncio quando o molde não
    // vem embutido).
    const familyTemplate = option.template;
    if (familyTemplate) {
      setValue('depreciation', familyTemplate.depreciation, { shouldDirty: true });
      setValue('life_bens', familyTemplate.life_bens, { shouldDirty: true });
      setValue('residual', familyTemplate.residual, { shouldDirty: true });
      // Mapeamento de nome: backend expõe `type_depreciation` (coluna da
      // Família) → campo do formulário do equipamento é `depreciation_type`
      // (mesmo nome que `EquipamentoFinanceiroDepreciacaoTab.tsx` consome).
      setValue('depreciation_type', familyTemplate.type_depreciation, { shouldDirty: true });
    }
  }

  function fillForm(data: EquipmentData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        family_equipment_uuid: { label: data.family.description, value: data.family.uuid },
        description: data.description,
        specification: data.specification ?? null,
        model: data.model ?? null,
        patrimony: data.patrimony ?? null,
        product_uuid: data.product
          ? { label: `${data.product.description}`, value: data.product.uuid }
          : null,
        status: data.status ?? null,
        equipment_type: data.equipment_type ?? 'P',
        features: data.features ?? [],

        vl_time_productive: data.vl_time_productive ?? null,
        provider_uuid: data.provider
          ? { label: data.provider.label, value: data.provider.uuid }
          : null,
        dt_acquisition: data.dt_acquisition ?? null,
        vl_acquisition: data.vl_acquisition ?? null,
        hour_meter: data.hour_meter ?? null,
        year_mod: data.year_mod ?? '',
        has_depreciation: !!data.has_depreciation,
        life_bens: data.life_bens ?? null,
        depreciation_type: data.depreciation_type,
        residual: data.residual ?? null,
        vl_residual: data.vl_residual ?? 0,
        vl_depreciate: data.vl_depreciate ?? 0,
        depreciation: data.depreciation ?? null,

        use_fiscal: !!data.use_fiscal,
        chassi: data.chassi ?? null,
        renavam: data.renavam ?? null,
        serie: data.serie ?? null,
        // UT-000787: placa válida sem hífen vira ABC-1234; legado fora do padrão intacto.
        plate: data.plate ? formatPlateIfValid(data.plate) : null,
        color: data.color ?? null,
        uf: data.uf ?? null,
        brand: data.brand ?? null,
        rntrc: data.rntrc ?? null,
        type: data.type ?? null,
        body_type: data.body_type ?? null,
        wheel_type: data.wheel_type ?? null,
        tara: data.tara ?? null,
        capacity: data.capacity ?? null,
        owner_type: data.owner_type ?? null,
        owner_document: data.owner_document ?? null,
        owner_name: data.owner_name ?? null,
        owner_ie: data.owner_ie ?? null,
        owner_uf: data.owner_uf ?? null,
        owner_tp: data.owner_tp ?? null,

        cost_centers: (data.cost_centers ?? []).map((row) => ({
          cost_center_uuid: row.uuid,
          percentage: row.percentage,
        })),

        attachments: (data.attachments ?? []).map((row) => ({
          uuid: row.uuid,
          name: row.name,
          file: null,
        })),
      });
    }
    // Imagem não é campo RHF — só sincroniza o preview "atual" quando o
    // usuário ainda não escolheu localmente um arquivo novo nem marcou
    // remoção (mirror `CreateOrUpdateFamiliaBens.tsx`).
    if (!imageFile && !removeImage) {
      setCurrentImageUrl(data.image_url);
    }
  }

  // Guard `hasFarm` (Equipment-contrato.md §12, `farm.context` ESTRITO —
  // "Inventário sempre exige Farm ativa") — a query de detalhe só dispara
  // com fazenda ativa selecionada (`useEquipments.tsx`, TASK-FE-1001).
  const equipmentQuery = useEquipmentForm({
    registrationId: isEditing ? equipmentId : undefined,
    fillForm,
    enabled: hasFarm,
  });

  const isLoading = isEditing && hasFarm && checkLoadingStatus([equipmentQuery as any]);
  const equipmentData = equipmentQuery.data;

  // UT-000781 — pré-seleção do Produto vinda do pós-salvar do cadastro de
  // Produto (`?product_uuid=`). Só em criação; um único `setValue` (sem
  // `reset`, Lei 2); o select continua editável. Produto não encontrado/não
  // equipamento => campo vazio, sem erro.
  const prefillProduct = useEquipmentProductPrefill(isEditing);
  const prefillAppliedRef = useRef(false);
  useEffect(() => {
    if (!prefillProduct || prefillAppliedRef.current) return;
    prefillAppliedRef.current = true;
    setValue('product_uuid', prefillProduct, { shouldDirty: true });
  }, [prefillProduct, setValue]);

  const equipmentMutation = useRequest({
    asyncFunction: tryPersistEquipment,
    entityName: text.singularLabel,
    queryKey: queryKey.equipments.equipmentsList,
    queryKey2: queryKey.equipments.equipment,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo (create e update, multipart por causa de
  // `image`/`attachments[]`) — `code` NUNCA entra no payload (RN-1).
  async function tryPersistEquipment(data: EquipmentFormType) {
    const isComResidual = data.depreciation_type === FamilyEquipmentDepreciationType.COM_RESIDUAL;

    const payload: EquipmentPayload = {
      family_equipment_uuid: data.family_equipment_uuid!.value,
      description: data.description.trim(),
      specification: data.specification?.trim() || null,
      model: data.model?.trim() || null,
      patrimony: data.patrimony?.trim() || null,
      product_uuid: data.product_uuid?.value ?? null,
      vl_time_productive: Number(data.vl_time_productive ?? 0),
      // Hidden input fixo no legado — sempre 0, nunca editável (Doc Bruta §2).
      vl_time_unproductive: 0,
      provider_uuid: data.provider_uuid?.value ?? null,
      dt_acquisition: data.dt_acquisition || null,
      vl_acquisition: Number(data.vl_acquisition ?? 0),
      status: Number(data.status),
      hour_meter: data.hour_meter ?? null,
      year_mod: data.year_mod?.trim() ?? '',
      has_depreciation: !!data.has_depreciation,
      life_bens: data.life_bens ?? null,
      depreciation_type: data.depreciation_type,
      // `residual` só é relevante quando COM_RESIDUAL — mesma disciplina de
      // `CreateOrUpdateFamiliaBens.tsx` (não envia valor "fantasma").
      residual: isComResidual ? (data.residual ?? null) : null,
      vl_residual: Number(data.vl_residual ?? 0),
      vl_depreciate: Number(data.vl_depreciate ?? 0),
      depreciation: data.depreciation ?? null,

      use_fiscal: !!data.use_fiscal,
      chassi: data.chassi?.trim() || null,
      renavam: data.renavam?.trim() || null,
      serie: data.serie?.trim() || null,
      plate: data.plate?.trim() || null,
      color: data.color?.trim() || null,
      uf: data.uf || null,
      brand: data.brand?.trim() || null,
      rntrc: data.rntrc?.trim() || null,
      type: data.type || null,
      body_type: data.body_type || null,
      wheel_type: data.wheel_type || null,
      tara: data.tara ?? null,
      capacity: data.capacity ?? null,
      owner_type: data.owner_type || null,
      owner_document: data.owner_document?.trim() || null,
      owner_name: data.owner_name?.trim() || null,
      owner_ie: data.owner_ie?.trim() || null,
      owner_uf: data.owner_uf || null,
      owner_tp: data.owner_tp ?? null,

      equipment_type: data.equipment_type ?? 'P',
      features: (data.features ?? []) as EquipmentPayload['features'],

      image: imageFile,
      removeImage,

      cost_centers: (data.cost_centers ?? [])
        .filter((row) => !!row.cost_center_uuid)
        .map((row) => ({
          cost_center_uuid: row.cost_center_uuid as string,
          percentage: Number(row.percentage ?? 0),
        })),

      attachments: (data.attachments ?? []).map((row) => ({
        uuid: row.uuid ?? null,
        name: row.name?.trim() || formText.attachmentRow.defaultName,
        file: row.file ?? null,
      })),
    };

    if (isEditing && equipmentId) {
      return await updateEquipment(equipmentId, payload);
    }
    return await createEquipment(payload);
  }

  const hasImageChange = !!imageFile || removeImage;

  // Guarda `onSubmit` — `!isEmpty(dirtyFields)` (armadilha ERRO-FE-001, o
  // `!` é OBRIGATÓRIO) + `!hasImageChange` (a imagem não é campo RHF, mirror
  // `CreateOrUpdateFamiliaBens.tsx`).
  async function onSubmit(data: EquipmentFormType) {
    if (isEditing && !isEmpty(dirtyFields) && !hasImageChange) {
      navigate(-1);
    } else {
      await equipmentMutation.mutateAsync(data);
    }
  }

  // Guarda `onInvalid` (armadilha de formulário com abas — cobre o FORM
  // TODO, navega para a 1ª aba com erro e mostra a mensagem REAL do 1º erro,
  // já 100% localizada pelo Yup — sem precisar de chaves i18n novas).
  function onInvalid(formErrors: FieldErrors<EquipmentFormType>) {
    const erroredFieldNames = Object.keys(formErrors) as (keyof EquipmentFormType)[];
    if (erroredFieldNames.length === 0) return;

    const erroredTab = erroredFieldNames
      .map((field) => FIELD_TAB_MAP[field])
      .find((tab): tab is EquipmentTabKey => !!tab && tab !== tabValue);

    if (erroredTab) {
      setTabValue(erroredTab);
    }

    const firstErrorMessage = Object.values(formErrors).find(
      (fieldError): fieldError is { message?: string } =>
        !!fieldError && typeof fieldError === 'object' && 'message' in fieldError
    )?.message;

    toaster.error({
      title: isEditing ? formText.title.edit : formText.title.create,
      description: firstErrorMessage,
      duration: 6000,
    });
  }

  const isSubmitting = equipmentMutation.isPending;

  // ---- Navegação do wizard (Voltar/Próximo, pedido do dev) ------------------
  const tabIdx = TAB_ORDER.indexOf(tabValue);
  const isLastTab = tabIdx === TAB_ORDER.length - 1;

  // "Voltar": aba anterior; na 1ª aba, sai do formulário — mesmo destino do
  // antigo botão "Cancelar" desta tela (`navigate(-1)`), mirror
  // `CreateOrUpdateFarm.tsx::handleBack` (que também faz `navigate(-1)`
  // quando não há passo anterior, sem dialog de confirmação — diferente do
  // `guardedBack` de `CreateOrUpdatePessoa.tsx`, fora do escopo pedido aqui:
  // esta tela nunca teve esse guard).
  function handleWizardBack() {
    if (tabIdx > 0) {
      setTabValue(TAB_ORDER[tabIdx - 1]);
    } else {
      navigate(-1);
    }
  }

  // "Próximo": só avança a aba — NÃO valida por aba (a Tarefa proíbe mudar a
  // validação; `onInvalid` cross-tab, já existente, continua sendo a única
  // guarda). Na ÚLTIMA aba este mesmo botão vira "Salvar" (`type="submit"`,
  // ver JSX abaixo) e o clique dispara `handleSubmit(onSubmit, onInvalid)`
  // normalmente — nenhum `onClick` custom nesse caso.
  function handleWizardNext() {
    if (!isLastTab) {
      setTabValue(TAB_ORDER[tabIdx + 1]);
    }
  }

  const familyValue = watch('family_equipment_uuid');
  const equipmentTypeEditable = !!familyValue?.label
    ? EQUIPMENT_TYPE_EDITABLE_FAMILIES.includes(familyValue.label)
    : false;

  const equipmentStatusOptions: Option<number>[] = [
    { value: 1, label: formText.fields.statusActive },
    { value: 2, label: formText.fields.statusInactive },
  ];

  const equipmentTypeOptions: Option<'P' | 'T'>[] = [
    { value: 'P', label: formText.fields.equipmentTypeOwn },
    { value: 'T', label: formText.fields.equipmentTypeOutsourced },
  ];

  const featureOptions: Option<string>[] = [
    { value: 'AB', label: formText.fields.featureFuelSupply },
    { value: 'MA', label: formText.fields.featureMaintenance },
    { value: 'BA', label: formText.fields.featureBatch },
    { value: 'AP', label: formText.fields.featureAppropriation },
  ];

  // Sem fazenda ativa E em edição: não há como buscar o registro a editar —
  // `EmptyState` informativo em vez do form (mirror
  // `CreateOrUpdateProduto.tsx`). CRIAÇÃO continua renderizando o form
  // normalmente.
  if (isEditing && !hasFarm) {
    return (
      <FormContainer title={formText.title.edit} showDivider>
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiTool} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.list.noFarmSelected.title}</EmptyState.Title>
              <EmptyState.Description>
                {text.list.noFarmSelected.description}
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      showDivider
      footer={
        <>
          <Button
            title={formText.footer.back}
            variant="outline"
            onClick={handleWizardBack}
            type="button"
            disabled={isSubmitting}
          />
          {canSave && (
            <Button
              title={isLastTab ? languageGB.defaltStrings.save : formText.footer.next}
              type="button"
              onClick={isLastTab ? handleSubmit(onSubmit, onInvalid) : handleWizardNext}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form onSubmit={handleSubmit(onSubmit, onInvalid)} noPadding>
        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(details: { value: string }) =>
            setTabValue(details.value as EquipmentTabKey)
          }
          variant="outline"
        >
          {/* @ts-ignore - Tab List fixa (sticky) no topo do body: abas sempre
              visíveis; só o conteúdo rola. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">{formText.tabs.identification}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{formText.tabs.financialDepreciation}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="2">{formText.tabs.fiscalVehicle}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="3">{formText.tabs.costCenterApportionment}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="4">{formText.tabs.attachments}</Tabs.Trigger>
          </Tabs.List>

          {/* ---- ABA 1: Identificação (TASK-FE-1005, ESTE arquivo) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="0">
            <SimpleGrid columns={columnsForm.default} gap={6} pt={4}>
              <Controller
                name="family_equipment_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.family}
                    placeholder={formText.placeholders.family}
                    // CORREÇÃO UT-000750 (esteira 114) — ver cabeçalho do
                    // arquivo: paginado + busca por digitação, com
                    // `is_enabled: 'true'` (mirror
                    // `src/pages/Relatorios/Bens/Inventario/index.tsx`).
                    service={(params) =>
                      listFamilyEquipmentOptions({ ...params, is_enabled: 'true' })
                    }
                    mapOptions={(item: FamilyEquipmentOption) => ({
                      label: item.description,
                      value: item.uuid,
                      // RN-6 — embute o item COMPLETO (molde de depreciação)
                      // na própria option, lido por `handleFamilyAutofill`.
                      template: item,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: FamilyEquipmentSelectOption | null | unknown) => {
                      const typedOption = (option ?? null) as FamilyEquipmentSelectOption | null;
                      field.onChange(typedOption);
                      handleFamilyAutofill(typedOption);
                    }}
                    error={errors.family_equipment_uuid?.message as string | undefined}
                    isRequired
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Input
                label={formText.fields.description}
                placeholder=""
                maxLength={60}
                {...register('description')}
                error={errors.description?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
              />

              {/* `code` — SÓ EM EDIÇÃO, nunca no formulário de criação
                  (RN-1, gerado pelo servidor). Fora do `useForm`/payload. */}
              {isEditing && (
                <InputReadOnly
                  label={formText.fields.code}
                  helperText={formText.hints.codeGeneratedByServer}
                  value={equipmentData?.code ?? ''}
                  loading={isLoading}
                />
              )}

              <Controller
                name="model"
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    label={formText.fields.model}
                    name={field.name}
                    maxLength={30}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={fieldState.error?.message}
                    loading={isLoading}
                    disabled={!canSave}
                  />
                )}
              />

              <Controller
                name="patrimony"
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    label={formText.fields.patrimony}
                    name={field.name}
                    maxLength={40}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={fieldState.error?.message}
                    loading={isLoading}
                    disabled={!canSave}
                  />
                )}
              />
            </SimpleGrid>

            {/* Linha A (pedido do dev, execução 026, AJUSTE 1) — Produto/Status/
                Tipo de Equipamento isolados em grid de 3 colunas (`threeColumns`,
                não `default` de 4) para ganhar largura e não truncar (antes
                dividiam linha com "Recursos" e o texto concatenado das opções
                cortava, ex. "Abastecimento, Manutenção, Batelad…"). Mesmo
                sistema de grid do resto do formulário (`columnsForm`,
                `@/constants/coluns-form`) — só a variante de colunas muda. */}
            <SimpleGrid columns={columnsForm.threeColumns} gap={6} mt={6}>
              <Controller
                name="product_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.product}
                    placeholder={formText.placeholders.product}
                    error={errors.product_uuid?.message as string | undefined}
                    service={listProducts}
                    mapOptions={(item: ProductListItem) => ({
                      label: `${item.code} — ${item.description}`,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                      // Filtro por categoria Equipamento — RN da Doc Bruta §2
                      // (unifica o mismatch create/edit do legado, ver
                      // contrato §6).
                      is_equipment: 'true' as const,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.status}
                    name={name}
                    value={equipmentStatusOptions.find((option) => option.value === value) ?? null}
                    onChange={(opt: Option<number> | null) => onChange(opt?.value ?? null)}
                    options={equipmentStatusOptions}
                    error={errors.status?.message as string | undefined}
                    isRequired
                    isDisabled={!canSave}
                    loading={isLoading}
                  />
                )}
              />

              <Controller
                name="equipment_type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.equipmentType}
                    name={name}
                    value={equipmentTypeOptions.find((option) => option.value === value) ?? null}
                    onChange={(opt: Option<'P' | 'T'> | null) => onChange(opt?.value ?? 'P')}
                    options={equipmentTypeOptions}
                    tooltip={
                      !equipmentTypeEditable
                        ? formText.hints.equipmentTypeLockedByFamily
                        : undefined
                    }
                    noClearable
                    isDisabled={!canSave || isLoading || !equipmentTypeEditable}
                    loading={isLoading}
                  />
                )}
              />
            </SimpleGrid>

            {/* Linha B (pedido do dev, execução 026, AJUSTE 1) — "Recursos"
                (features) desceu para dividir linha com "Especificação"
                (`twoColumns`, 2 colunas), em vez de espremer com Produto/
                Status/Tipo acima. */}
            <SimpleGrid columns={columnsForm.twoColumns} gap={6} mt={6}>
              <Controller
                name="features"
                control={control}
                render={({ field }) => (
                  <Select
                    multiple
                    label={formText.fields.features}
                    name={field.name}
                    value={featureOptions.filter((option) =>
                      (field.value ?? []).includes(option.value)
                    )}
                    onChange={(opts: Option<string>[]) =>
                      field.onChange(opts.map((opt) => opt.value))
                    }
                    options={featureOptions}
                    isDisabled={!canSave || isLoading}
                    loading={isLoading}
                  />
                )}
              />

              <Controller
                name="specification"
                control={control}
                render={({ field, fieldState }) => (
                  <Textarea
                    label={formText.fields.specification}
                    name={field.name}
                    maxLength={200}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={fieldState.error?.message}
                    loading={isLoading}
                    disabled={!canSave}
                  />
                )}
              />
            </SimpleGrid>

            <VStack align="stretch" mt={6}>
              <ImageUpload
                label={formText.fields.image}
                hint={undefined}
                accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml"
                maxSizeMb={2}
                currentImageUrl={currentImageUrl}
                file={imageFile}
                onFileSelected={handleFileSelected}
                onRemove={handleRemoveImage}
                disabled={!canSave || isLoading}
                dropzoneTitle={formText.image.dropzoneTitle}
                dropzoneDraggingTitle={formText.image.dropzoneDragging}
                changeLabel={formText.image.changeLabel}
                removeLabel={formText.image.removeLabel}
                errorTypeMessage={formText.image.errorType}
                errorSizeMessage={formText.image.errorSize}
              />
            </VStack>
          </Tabs.Content>

          {/* ---- ABA 2: Financeiro/Depreciação (STUB — TASK-FE-1006) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="1">
            <EquipamentoFinanceiroDepreciacaoTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              isEditing={isEditing}
              equipmentData={equipmentData}
            />
          </Tabs.Content>

          {/* ---- ABA 3: Fiscal/Veículo (STUB — TASK-FE-1007) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="2">
            <EquipamentoFiscalVeiculoTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              isEditing={isEditing}
              equipmentData={equipmentData}
            />
          </Tabs.Content>

          {/* ---- ABA 4: Rateio — Centro de Custo (STUB — TASK-FE-1008) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="3">
            <EquipamentoRateioCentroCustoTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              isEditing={isEditing}
              equipmentData={equipmentData}
            />
          </Tabs.Content>

          {/* ---- ABA 5: Anexos (STUB — TASK-FE-1009) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="4">
            <EquipamentoAnexosTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              isEditing={isEditing}
              equipmentData={equipmentData}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Form>
    </FormContainer>
  );
}
