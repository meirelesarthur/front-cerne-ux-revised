// src/pages/Operacional/ContratosVenda/CreateOrUpdateContratoVenda.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de criação/edição/visualização de Contratos de Venda
// (Operacional / Agricultura, esteira 036, TASK-FE-036-206). MESMO arquivo
// para os 3 casos (`isEditing = isValidGuid(saleContractId)`; view = mesmo
// componente com `canSave=false`, mirror `CreateOrUpdateContrato.tsx` — sem
// tela `Detalhe` separada, decisão registrada no contrato de tela §1).
//
// SEM ABAS — 2 blocos (cabeçalho + bloco de cálculo) não justificam
// `Tabs.Root` (mesma regra de proporcionalidade já aplicada ao `Contract`).
//
// `useCustomFormQueryByGuid` (mirror `CreateOrUpdateContrato`) para o `GET`
// de edição + `fillForm` nomeada com guarda `!isEmpty(dirtyFields) ||
// resetForce` (o `!` é OBRIGATÓRIO — `ERRO-FE-001`, `isEmpty()` retorna
// `true` quando HÁ chaves).
//
// `code`/`status`/`entregue`/`saldo` NUNCA são campos editáveis — lidos
// direto de `saleContractData`, SÓ em edição (`isEditing && saleContractData`).
// Em criação nenhum dos 4 existe ainda (mesma lógica de "não existe ainda"
// de `code`/`amount` do `Contract`). `status` é um `Badge` (não
// `InputReadOnly`) — corrige DIV-007, ver `saleContractStatus.ts`.
//
// REWORK DE FIDELIDADE (`audit-contratos-de-venda.md`, P0 rupturas de
// Resource §(E)): `status` é sempre objeto `{value,label,color}` — Badge
// usa `saleContractData.status.value`, nunca o objeto inteiro. O nome real
// do campo "Entregue" é `delivered_quantity` (não `delivered` — o front
// lia um campo que a API nunca manda, ficava sempre `undefined`).
// "Entregue"/"Saldo" agora formatados via `formatSaleContractQuantity`
// (mirror `money()` legado — nunca número cru, `SC-LST-003`/formulário
// "Saldo"). `SC-JS-005`: o legado SEMPRE envia PUT ao salvar edição, mesmo
// sem alterações — o atalho que navegava de volta sem PUT foi removido do
// `onSubmit`.
//
// Payload é sempre JSON puro (`SaleContractPayload`, sem `FormData`/method
// spoofing). `vl_funrural` NUNCA entra no payload — campo local do bloco de
// cálculo (`SaleContractCalculationFields`, TASK-FE-036-204).
//
// Guarda de navegação: `saleContractId` presente mas NÃO é GUID válido (URL
// adulterada) → redireciona para a listagem.
//
// Botão de submit FORA do `<form>` (`FormContainer footer`).
//
// `GAP-FE-036-201` (edição protegida só por ocultação de botão na
// listagem, sem guarda de ROTA/redirect adicional aqui) — decisão do dev:
// Opção A (réplica fiel do legado, aprovada em
// `DECISOES-DO-DEV-2026-08-13.md`). Nenhum redirect adicional é adicionado
// nesta tela: continua possível navegar direto para a URL de edição de um
// contrato com `status >= 2` (mesmo risco que já existia no legado).
//
// `SC2-A03` (2ª auditoria, `REAUDITORIA-036-2a-rodada.md` Anexo C): isso é
// DIFERENTE de o formulário abrir EDITÁVEL. O legado esconde Editar na
// listagem quando `status >= 2` (`index.blade.php:139`, `$item->status <
// 2`), mas a API só aceita o PUT quando `status === 1`
// (`UpdateSaleContractAction.php:43`) — sem guarda aqui, clicar na linha
// abria os campos habilitados e o botão Salvar, e o PUT terminava em 422.
// `canSave` abaixo agora também exige `saleContractData.status.value < 2`
// quando em edição (mirror exato da mesma condição `status.value < 2` já
// usada em `index.tsx` para mostrar/esconder Editar/Excluir) — o formulário
// abre SOMENTE-LEITURA (sem Salvar, todos os campos desabilitados) para
// status >= 2, nunca chega a tentar o PUT que a API rejeitaria.
//
// `product_uuid` usa `listProductOptions({ category_type:
// categoryProductType.production })` (contrato de tela §3) — RECONCILIADO
// após merge com `origin/develop` (`GAP-FE-036-202`, resolvido: o endpoint
// dedicado `/products/options` e a constante `categoryProductType` não
// existiam na base antiga da branch, agora existem via rebase). Mirror
// `ContractItemRow.tsx` (`Financeiro/Contrato`), que usa o mesmo mecanismo
// com `category_type: categoryProductType.input`.
//
// HOMOLOGAÇÃO 036fix5, itens B15/B16/"Visualizar":
//   - Botão ÚNICO criar/editar Cliente ao lado do select (mirror EXATO
//     `CreateOrUpdateMovimento.tsx`/`CreateOrUpdateNfe.tsx`, reusa 100% o
//     `ClientFormModal` genérico — nenhum modal novo, nenhum
//     endpoint/schema novo).
//   - Botão criar/editar Produto ao lado do select (TASK-FE-036-B16,
//     resolve a dependência acima) — mirror EXATO do botão de Cliente,
//     reusa 100% o `ProductFormModal` genérico (`useProductFormController`/
//     `ProductFormFields`, extraídos de `CreateOrUpdateProduto.tsx`, mesmo
//     schema/service/validação da página cheia).
//   - Rota "/visualizar" (`/operacional/contratos-venda/:saleContractId/
//     visualizar`, `router/index.tsx`) — o item 3 do parágrafo inicial já
//     anunciava "view = mesmo componente com canSave=false"; esta entrega
//     LIGA a rota de fato: `isViewOnlyRoute` (`location.pathname.endsWith
//     ('/visualizar')`) força `canSave=false` independente de permissão/
//     status, mirror EXATO `CreateOrUpdateExpense.tsx`.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Badge, Box, Flex, Icon, IconButton, SimpleGrid, useDisclosure } from '@chakra-ui/react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { FiEdit, FiPlus } from 'react-icons/fi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ClientFormModal } from '@/pages/CadastrosBase/Clientes/ClientFormModal';
import { ProductFormModal } from '@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { categoryProductType } from '@/constants/CategoryProducts/category-product-type';
import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  SALE_CONTRACT_TEXT_FIELD_MAX_LENGTH,
  saleContractSchemaResolver,
} from '@/validations/schemas/SaleContracts/sale-contract-schema';

import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listHarvestOptions } from '@/services/v2/Harvests/harvest-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import {
  createSaleContract,
  getSaleContract,
  updateSaleContract,
} from '@/services/v2/SaleContracts/sale-contract-service';

import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { Harvest } from '@/@types/v2/Harvests';
import type {
  SaleContractData,
  SaleContractForm as SaleContractFormType,
  SaleContractPayload,
} from '@/@types/v2/SaleContracts';

import { SaleContractCalculationFields } from './SaleContractCalculationFields';
import { formatSaleContractQuantity } from './saleContractFormat';
import {
  getSaleContractStatusLabel,
  SALE_CONTRACT_STATUS_BADGE_VARIANT,
} from './saleContractStatus';

// Moeda: única opção fixa aceita pela API (`coin => in:BRL`, contrato §3) —
// nunca `SelectAsyncPaginate` para 1 opção estática.
const COIN_OPTION = { label: 'REAL', value: 'BRL' };

/**
 * Data de hoje no fuso LOCAL do navegador (`YYYY-MM-DD`) — mirror do
 * `today()` do servidor legado (`_forms.blade.php:18`). `SC2-B08` (2ª
 * auditoria): `new Date().toISOString().slice(0, 10)` converte para UTC
 * ANTES de fatiar — em `America/Sao_Paulo` (UTC-3), da meia-noite às 3h o
 * resultado já é o dia seguinte. Monta a string a partir dos componentes
 * LOCAIS (`getFullYear`/`getMonth`/`getDate`), nunca `toISOString()`, para
 * casar com o dia civil do usuário.
 * @return {string} Data local de hoje, formato `YYYY-MM-DD`.
 */
function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CreateOrUpdateContratoVenda() {
  const { saleContractId } = useParams<{ saleContractId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user } = useAuth();

  const isEditing = isValidGuid(saleContractId);

  // Rota "/visualizar" (item 2 da homologação 036fix5, mirror legado
  // `sale-contracts` `show` + padrão já em produção em
  // `CreateOrUpdateExpense.tsx`) — reaproveita ESTE MESMO componente,
  // forçada somente-leitura independente de o usuário também ter
  // `sale-contracts_edit`. Sem tela dedicada separada (mesma decisão já
  // registrada no cabeçalho: 1 arquivo para os 3 casos).
  const isViewOnlyRoute = location.pathname.endsWith('/visualizar');

  // Guard de navegação: `saleContractId` presente mas NÃO é um GUID válido
  // (URL adulterada) — redireciona para a listagem.
  useEffect(() => {
    if (saleContractId && !isValidGuid(saleContractId)) {
      navigate('/operacional/contratos-venda', { replace: true });
    }
  }, [saleContractId, navigate]);

  const text = languageGB.saleContracts.saleContract;

  const canCreate = can('sale-contracts_create');
  const canEdit = can('sale-contracts_edit');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<SaleContractFormType>({
    mode: 'onChange',
    resolver: saleContractSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      client_uuid: null,
      product_uuid: null,
      harvest_uuid: null,
      number: '',
      // Default = hoje só em criação (client-side) — mirror contrato §3.
      // `getLocalTodayDateString()`, nunca `toISOString()` (`SC2-B08`, ver
      // comentário da função acima).
      date: isEditing ? null : getLocalTodayDateString(),
      quantity: null,
      bag_weight: null,
      price: null,
      funrural: null,
      coin: COIN_OPTION,
      delivery_place: '',
      delivery_start_date: null,
      delivery_end_date: null,
      payment_date: null,
      payment_method: '',
      note: '',
    },
  });

  function fillForm(data: SaleContractData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        client_uuid: data.client
          ? { label: data.client.label ?? data.client.uuid, value: data.client.uuid }
          : null,
        product_uuid: data.product
          ? { label: data.product.label ?? data.product.uuid, value: data.product.uuid }
          : null,
        harvest_uuid: data.harvest
          ? { label: data.harvest.label ?? data.harvest.uuid, value: data.harvest.uuid }
          : null,
        number: data.number,
        date: data.date,
        quantity: data.quantity,
        bag_weight: data.bag_weight,
        price: data.price,
        funrural: data.funrural,
        coin: COIN_OPTION,
        delivery_place: data.delivery_place,
        delivery_start_date: data.delivery_start_date,
        delivery_end_date: data.delivery_end_date,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        note: data.note ?? '',
      });
    }
  }

  const saleContractQuery = useCustomFormQueryByGuid<SaleContractData>({
    registrationId: isEditing ? saleContractId : undefined,
    queryKey: queryKey.saleContracts.saleContract,
    asyncFunction: getSaleContract,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([saleContractQuery as any]);
  const saleContractData = (saleContractQuery as any)?.data as SaleContractData | undefined;

  // `SC2-A03` (2ª auditoria): em edição, além da permissão, exige
  // `status.value < 2` (mirror exato de `index.tsx`, condição que já esconde
  // Editar/Excluir na listagem para o mesmo contrato). Enquanto os dados
  // ainda não chegaram (`saleContractData` undefined) o guard de status não
  // se aplica — os campos já ficam desabilitados por `isLoading` durante a
  // espera, nenhuma diferença visual. Assim que o `status.value >= 2` chega,
  // `canSave` cai para `false`: some o botão Salvar e todos os campos ficam
  // somente-leitura, sem depender de a API rejeitar o PUT (que hoje termina
  // em 422 para esses status, `UpdateSaleContractAction.php:43`).
  const canEditByStatus = !isEditing || !saleContractData || saleContractData.status.value < 2;
  // Item 2 (homologação 036fix5) — `isViewOnlyRoute` força somente-leitura
  // independente de permissão/status (mirror `CreateOrUpdateExpense.tsx`).
  const canSave = !isViewOnlyRoute && (isEditing ? canEdit : canCreate) && canEditByStatus;

  // Item 1 (homologação 036fix5, B15/B16) — disclosure do modal de
  // criar/editar Cliente + chave de invalidação do cache do
  // `SelectAsyncPaginate` (mirror EXATO `CreateOrUpdateMovimento.tsx`/
  // `CreateOrUpdateNfe.tsx`).
  const clientModalDisclosure = useDisclosure();
  const [clientOptionsCacheKey, setClientOptionsCacheKey] = useState(0);

  // TASK-FE-036-B16 — mesmo mecanismo, agora também para Produto: o modal
  // genérico de Produto (`ProductFormModal`) deixou de ser uma dependência
  // faltante (ver nota do botão abaixo).
  const productModalDisclosure = useDisclosure();
  const [productOptionsCacheKey, setProductOptionsCacheKey] = useState(0);

  // -- Persistência (create/update, JSON puro via service TASK-FE-036-202) --
  async function tryPersistSaleContract(data: SaleContractFormType) {
    const payload: SaleContractPayload = {
      client_uuid: data.client_uuid!.value,
      product_uuid: data.product_uuid!.value,
      harvest_uuid: data.harvest_uuid!.value,
      number: data.number.trim(),
      date: data.date!,
      quantity: data.quantity!,
      bag_weight: data.bag_weight!,
      funrural: data.funrural!,
      price: data.price!,
      coin: data.coin!.value,
      delivery_place: data.delivery_place.trim(),
      delivery_start_date: data.delivery_start_date!,
      delivery_end_date: data.delivery_end_date!,
      payment_date: data.payment_date!,
      payment_method: data.payment_method.trim(),
      note: data.note?.trim() || undefined,
    };

    if (isEditing && saleContractId) {
      return await updateSaleContract(saleContractId, payload);
    }
    return await createSaleContract(payload);
  }

  const saleContractMutation = useRequest({
    asyncFunction: tryPersistSaleContract,
    entityName: text.singularLabel,
    queryKey: queryKey.saleContracts.saleContractsList,
    queryKey2: queryKey.saleContracts.saleContract,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // `SC-JS-005` da auditoria: o legado SEMPRE envia PUT ao salvar a edição,
  // mesmo sem nenhum campo alterado (`edit.blade.php:20`) — o atalho
  // anterior ("editar sem alterar nada = Cancelar", que navegava de volta
  // sem PUT quando `dirtyFields` estava vazio) foi removido; salvar sempre
  // persiste, mirror 1:1 do comportamento legado.
  async function onSubmit(data: SaleContractFormType) {
    await saleContractMutation.mutateAsync(data);
  }

  // Guarda `onInvalid` — mostra a mensagem REAL do 1º erro (já 100%
  // localizada pelo Yup).
  function onInvalid(formErrors: FieldErrors<SaleContractFormType>) {
    const firstErrorMessage = Object.values(formErrors).find(
      (fieldError): fieldError is { message?: string } =>
        !!fieldError && typeof fieldError === 'object' && 'message' in fieldError
    )?.message;

    toaster.error({
      title: isEditing ? text.form.title.edit : text.form.title.create,
      description: firstErrorMessage,
      duration: 6000,
    });
  }

  // Repassado ao bloco de cálculo (`SaleContractCalculationFields`) —
  // `vl_funrural` nunca é campo deste formulário; só o `funrural`
  // recalculado a partir dele chega aqui.
  function handleFunruralChange(value: number) {
    setValue('funrural', value, { shouldDirty: true, shouldValidate: true });
  }

  const isSubmitting = saleContractMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
      headerActions={
        isEditing && saleContractData ? (
          <Badge
            colorPalette={SALE_CONTRACT_STATUS_BADGE_VARIANT[saleContractData.status.value]}
            variant="subtle"
            py={1}
            px={3}
          >
            {getSaleContractStatusLabel(saleContractData.status.value, languageGB)}
          </Badge>
        ) : undefined
      }
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          />
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="submit"
              form="sale-contract-form"
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form id="sale-contract-form" onSubmit={handleSubmit(onSubmit, onInvalid)} noPadding>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="client_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.client}
                placeholder={text.form.placeholders.client}
                error={fieldState.error?.message as string | undefined}
                service={listClients}
                mapOptions={(item: ClientListItem) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_enabled: true,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave || !!isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                // Item 1 (homologação 036fix5, B15/B16) — força reler a
                // página 1 depois de criar/editar um cliente pelo modal
                // ao lado, mirror EXATO `CreateOrUpdateMovimento.tsx`/
                // `CreateOrUpdateNfe.tsx`.
                cacheUniqs={[clientOptionsCacheKey]}
                // EST-07 — botão ÚNICO criar/editar Cliente migrado do
                // `IconButton` avulso para o `labelAction`, mirror EXATO do
                // padrão `CreateOrUpdateNfe.tsx` (reusa 100% o
                // `ClientFormModal` genérico). Ícone contextual: `FiPlus`
                // com o campo vazio (criar), `FiEdit` com um cliente já
                // selecionado (editar aquele mesmo registro).
                labelActionTooltip={
                  field.value ? text.form.actions.editClientAria : text.form.actions.addClientAria
                }
                labelAction={
                  <IconButton
                    aria-label={
                      field.value
                        ? text.form.actions.editClientAria
                        : text.form.actions.addClientAria
                    }
                    variant="ghost"
                    size="2xs"
                    minH="0"
                    h="20px"
                    w="20px"
                    minW="0"
                    p="0"
                    disabled={
                      !canSave || !!isLoading || !(can('clients_create') || can('clients_edit'))
                    }
                    onClick={clientModalDisclosure.onOpen}
                  >
                    <Icon as={field.value ? FiEdit : FiPlus} boxSize="16px" color="primaryMain" />
                  </IconButton>
                }
              />
            )}
          />

          <Controller
            name="product_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.product}
                placeholder={text.form.placeholders.product}
                error={fieldState.error?.message as string | undefined}
                service={listProductOptions}
                mapOptions={(item: ProductOptionItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  category_type: categoryProductType.production,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave || !!isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                // TASK-FE-036-B16 — força reler a página 1 depois de
                // criar/editar um produto pelo modal ao lado, mirror
                // EXATO do mesmo mecanismo já usado pelo Cliente acima.
                cacheUniqs={[productOptionsCacheKey]}
                // TASK-FE-036-B16 — botão ÚNICO criar/editar Produto
                // migrado do `IconButton` avulso para o `labelAction`,
                // MESMO padrão do Cliente acima. Reusa 100% o
                // `ProductFormModal` genérico.
                labelActionTooltip={
                  field.value
                    ? text.form.actions.editProductAria
                    : text.form.actions.addProductAria
                }
                labelAction={
                  <IconButton
                    aria-label={
                      field.value
                        ? text.form.actions.editProductAria
                        : text.form.actions.addProductAria
                    }
                    variant="ghost"
                    size="2xs"
                    minH="0"
                    h="20px"
                    w="20px"
                    minW="0"
                    p="0"
                    disabled={
                      !canSave || !!isLoading || !(can('products_create') || can('products_edit'))
                    }
                    onClick={productModalDisclosure.onOpen}
                  >
                    <Icon as={field.value ? FiEdit : FiPlus} boxSize="16px" color="primaryMain" />
                  </IconButton>
                }
              />
            )}
          />

          <Controller
            name="harvest_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.harvest}
                placeholder={text.form.placeholders.harvest}
                error={fieldState.error?.message as string | undefined}
                service={listHarvestOptions}
                mapOptions={(item: Harvest) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave || !!isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Input
            label={text.form.fields.number}
            // `autoComplete="off"` — reduz o aviso de autofill do Chrome em
            // http ("preenchimento automático das formas de pagamento
            // desativado..."), que é do NAVEGADOR (autofill heurístico em
            // conexão insegura), não um bug desta tela; some em https.
            autoComplete="off"
            {...register('number')}
            error={errors.number?.message}
            isRequired
            loading={!!isLoading}
            disabled={!canSave}
          />

          <Box>
            <Box mb={1} fontSize="sm" fontWeight="medium">
              {text.form.fields.date}
              <Box as="span" color="fg.error">
                {' '}
                *
              </Box>
            </Box>
            <Controller
              name="date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={!canSave || !!isLoading}
                />
              )}
            />
            {errors.date?.message && (
              <Box color="fg.error" fontSize="xs" mt={1}>
                {errors.date.message as string}
              </Box>
            )}
          </Box>

          <Box>
            <Box mb={1} fontSize="sm" fontWeight="medium">
              {text.form.fields.deliveryStartDate}
              <Box as="span" color="fg.error">
                {' '}
                *
              </Box>
            </Box>
            <Controller
              name="delivery_start_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={!canSave || !!isLoading}
                />
              )}
            />
            {errors.delivery_start_date?.message && (
              <Box color="fg.error" fontSize="xs" mt={1}>
                {errors.delivery_start_date.message as string}
              </Box>
            )}
          </Box>

          <Box>
            <Box mb={1} fontSize="sm" fontWeight="medium">
              {text.form.fields.deliveryEndDate}
              <Box as="span" color="fg.error">
                {' '}
                *
              </Box>
            </Box>
            <Controller
              name="delivery_end_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={!canSave || !!isLoading}
                />
              )}
            />
            {errors.delivery_end_date?.message && (
              <Box color="fg.error" fontSize="xs" mt={1}>
                {errors.delivery_end_date.message as string}
              </Box>
            )}
          </Box>

          <Box>
            <Box mb={1} fontSize="sm" fontWeight="medium">
              {text.form.fields.paymentDate}
              <Box as="span" color="fg.error">
                {' '}
                *
              </Box>
            </Box>
            <Controller
              name="payment_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={!canSave || !!isLoading}
                />
              )}
            />
            {errors.payment_date?.message && (
              <Box color="fg.error" fontSize="xs" mt={1}>
                {errors.payment_date.message as string}
              </Box>
            )}
          </Box>

          <Controller
            name="quantity"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.quantity}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                allowDot
                decimalPlaces={2}
                min={0.01}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="bag_weight"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.bagWeight}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                allowDot
                decimalPlaces={2}
                min={0}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="price"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.price}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                allowDot
                // `price` tem 4 casas decimais (schema `decimal(12,4)`,
                // Doc Bruta `mask: money4`) — diferente dos demais campos
                // monetários (2 casas).
                decimalPlaces={4}
                min={0.01}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="funrural"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.funrural}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                allowDot
                decimalPlaces={2}
                min={0}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="coin"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                name={field.name}
                label={text.form.fields.coin}
                options={[COIN_OPTION]}
                value={field.value ?? COIN_OPTION}
                onChange={(option) => field.onChange(option ?? COIN_OPTION)}
                error={fieldState.error?.message}
                isRequired
                isDisabled={!canSave || !!isLoading}
                noClearable
                loading={!!isLoading}
              />
            )}
          />

          {/* `responsible` — SEMPRE somente-leitura, em create E edit
              (`SC2-B02`, 2ª auditoria: a API já devolvia `responsible
              {uuid,name}`, `SaleContractResource::responsible`, só a tela
              omitia o campo). Mirror do select readonly do legado
              (`_forms.blade.php:14`, `auth()->user()->people->name`): em
              criação exibe o usuário AUTENTICADO local (`useAuth` — a API
              resolve/ignora `user_id` enviado pelo client, `SC2-E04`,
              não há responsável "de servidor" ainda para buscar); em edição
              exibe `saleContractData.responsible.name` vindo do `GET`. Nunca
              um `Controller`/`register` — não existe no
              `SaleContractForm`/payload. */}
          <InputReadOnly
            label={text.form.fields.responsible}
            value={(isEditing ? saleContractData?.responsible?.name : user?.username) ?? ''}
            loading={!!isLoading}
          />

          {/* `code` — SÓ EM EDIÇÃO, gerado pelo servidor (fora do
              `useForm`/payload). */}
          {isEditing && (
            <InputReadOnly
              label={text.form.fields.code}
              value={saleContractData?.code ?? ''}
              loading={!!isLoading}
            />
          )}

          {/* `entregue`/`saldo` — SÓ EM EDIÇÃO, vêm prontos do
              `GetSaleContractAction` (contrato §6), fora do
              `useForm`/payload. Nome real do campo é `delivered_quantity`
              (não `delivered` — a API nunca manda esse nome, o valor ficava
              `undefined`, `P0` da auditoria); formatados via
              `formatSaleContractQuantity` (mirror `money()` legado, nunca
              número cru). */}
          {isEditing && saleContractData && (
            <InputReadOnly
              label={text.form.fields.delivered}
              value={formatSaleContractQuantity(saleContractData.delivered_quantity)}
              loading={!!isLoading}
            />
          )}
          {isEditing && saleContractData && (
            <InputReadOnly
              label={text.form.fields.balance}
              value={formatSaleContractQuantity(saleContractData.balance)}
              loading={!!isLoading}
            />
          )}
        </SimpleGrid>

        <Box mt={6}>
          <SaleContractCalculationFields
            watch={watch}
            onFunruralChange={handleFunruralChange}
            isLoading={!!isLoading}
            disabled={!canSave}
          />
        </Box>

        <SimpleGrid columns={columnsForm.twoColumns} gap={6} mt={6}>
          <Textarea
            label={text.form.fields.deliveryPlace}
            {...register('delivery_place')}
            error={errors.delivery_place?.message}
            maxLength={SALE_CONTRACT_TEXT_FIELD_MAX_LENGTH}
            isRequired
            loading={!!isLoading}
            disabled={!canSave}
          />

          <Textarea
            label={text.form.fields.paymentMethod}
            {...register('payment_method')}
            error={errors.payment_method?.message}
            maxLength={SALE_CONTRACT_TEXT_FIELD_MAX_LENGTH}
            isRequired
            loading={!!isLoading}
            disabled={!canSave}
          />

          <Textarea
            label={text.form.fields.note}
            {...register('note')}
            error={errors.note?.message}
            maxLength={250}
            loading={!!isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>
      </Form>

      {/* Item 1 (homologação 036fix5, B15/B16) — modal de criar/editar
          Cliente. `client_uuid` lido direto de `watch` (não um `useState`
          paralelo) — o modal sempre reflete o valor ATUAL do campo deste
          formulário, mirror EXATO `CreateOrUpdateMovimento.tsx`/
          `CreateOrUpdateNfe.tsx`. */}
      <ClientFormModal
        isOpen={clientModalDisclosure.open}
        onClose={clientModalDisclosure.onClose}
        clientUuid={watch('client_uuid')?.value}
        onSaved={(client) => {
          setValue(
            'client_uuid',
            { value: client.uuid, label: client.label },
            { shouldDirty: true, shouldValidate: true }
          );
          setClientOptionsCacheKey((key) => key + 1);
        }}
      />

      {/* TASK-FE-036-B16 — modal de criar/editar Produto, mesmo racional do
          modal de Cliente acima: `product_uuid` lido direto de `watch`, o
          modal sempre reflete o valor ATUAL do campo deste formulário. */}
      <ProductFormModal
        isOpen={productModalDisclosure.open}
        onClose={productModalDisclosure.onClose}
        productUuid={watch('product_uuid')?.value}
        onSaved={(product) => {
          setValue(
            'product_uuid',
            { value: product.uuid, label: product.label },
            { shouldDirty: true, shouldValidate: true }
          );
          setProductOptionsCacheKey((key) => key + 1);
        }}
      />
    </FormContainer>
  );
}
