// src/pages/CadastrosBase/Embalagens/CreateOrUpdateEmbalagem.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de EMBALAGEM (Package — mesmo arquivo para os dois
// casos, mirror estrutural de Produtos/Classes/CreateOrUpdateKind.tsx, mesmo
// grupo de menu "Estrutura"). Rotas: /cadastros-base/embalagens/novo (criar)
// e /cadastros-base/embalagens/:packageId (editar, GUID) — wiring real de
// rota em TASK-FE-523 (NÃO tocado por esta Tarefa), guardadas por
// `product-packages_view`.
//
// Cadastro de 3 campos, sem wizard (Package-Frontend-Contrato.md §3.5, Regra
// F/YAGNI, mesmo racional de Kind/GruposProduto).
//
// `size` — Controller + `MaskedInput kind="quantity"` (NUNCA `register()`
// puro em campo mascarado — armadilha conhecida do domínio, mordeu
// Fazendas/Pessoas na execução 024): `decimalPlaces={2}`, `min={0.01}`.
// Migrado de `NumberInput`/`allowDot` na esteira 001, Wave 2 (correção
// KB-06) — mesmo contrato de payload (`Number` puro).
//
// `measurement_uuid` — Controller + SelectAsyncPaginate contra
// `listMeasurements` (mesmo `mapOptions`/`findParams` do filtro da listagem,
// FilterSideEmbalagens.tsx) — guarda o par `Option<string>` completo no form,
// convertido para uuid cru só no submit.
//
// Payload SEMPRE completo (create e update) — `PackageRequest::rules()` usa
// `sometimes` no update mas aceita os 3 campos completos sem problema;
// `dirtyFields` só decide se há algo a salvar (rótulo do botão), nunca monta
// PATCH parcial (mirror Kind/FamiliaBens).
//
// CORREÇÃO (achado nesta execução, ver @types/v2/Packages/index.d.ts): o
// `PackageResource` real NÃO aninha `measurement` — devolve
// `measurement_uuid`/`measurement_name` FLAT. `fillForm` resolve o label
// diretamente desses dois campos (já vêm juntos no mesmo registro, sem
// precisar de 2º fetch) — sem esse cuidado, o select de edição abriria vazio
// (bug recorrente já visto em `next_category`/Categorias Animais).
//
// Guard de fazenda ativa (Contrato §3.3): a query de DETALHE (edição) só
// dispara com `hasFarm` verdadeiro — resolvido em `usePackages.tsx`
// (`usePackageForm`) desabilitando o `registrationId`, não o form em si. A
// CRIAÇÃO sem fazenda ativa ainda renderiza o form (o 403 do backend no
// submit é aceitável, mirror de outros formulários farm-scoped) — só a
// EDIÇÃO troca o form por um EmptyState informativo, pois sem fazenda ativa
// não há como buscar os dados do registro a editar.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { EmptyState, Icon, SimpleGrid, VStack } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FiPackage } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { packageSchemaResolver } from '@/validations/schemas/CadastrosBase/package-schema';

import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';
import { createPackage, updatePackage } from '@/services/v2/Packages/package-service';

import type { MeasurementOption } from '@/@types/v2/Measurements';
import type {
  PackageData,
  PackageForm as PackageFormType,
  PackagePayload,
} from '@/@types/v2/Packages';

import { usePackageForm } from './usePackages';

// GET /measurements/options é FLAT (catálogo global, 56 linhas totais, `meta`
// sempre `null`) — `pageSize` MAIOR que o volume real evita que o
// `SelectAsyncPaginate` (`items.length === pageSize`) dispare uma 2ª página
// fantasma ao rolar o menu. Constante LOCAL (mirror de
// `CreateOrUpdateProduto.tsx::FLAT_CATALOG_PAGE_SIZE`, TASK-FE-940) —
// deliberadamente não importada de outro módulo.
const FLAT_CATALOG_PAGE_SIZE = 200;

export default function CreateOrUpdateEmbalagem() {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can, hasFarm } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:packageId` — rota irmã distinta, wiring real em TASK-FE-523).
  const isEditing = isValidGuid(packageId);

  // Guard de navegação: `packageId` presente mas NÃO é um GUID válido (URL
  // adulterada) não deve renderizar um form "fantasma" — redireciona para a
  // listagem (mesmo racional de CreateOrUpdateKind.tsx).
  useEffect(() => {
    if (packageId && !isValidGuid(packageId)) {
      navigate('/cadastros-base/embalagens', { replace: true });
    }
  }, [packageId, navigate]);

  const text = languageGB.packages.package;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<PackageFormType>({
    mode: 'onChange',
    resolver: packageSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      size: null,
      measurement_uuid: null,
    },
  });

  function fillForm(data: PackageData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        description: data.description,
        size: Number(data.size),
        // Shape FLAT real do PackageResource — measurement_uuid/measurement_name
        // já vêm juntos no mesmo registro (sem 2º fetch para resolver o label).
        measurement_uuid: data.measurement_uuid
          ? { label: data.measurement_name ?? data.measurement_uuid, value: data.measurement_uuid }
          : null,
      });
    }
  }

  // Guard hasFarm (§3.3 do Contrato) — a query de detalhe só dispara com
  // fazenda ativa selecionada (ver usePackages.tsx/usePackageForm).
  const packageQuery = usePackageForm({
    registrationId: isEditing ? packageId : undefined,
    fillForm,
    enabled: hasFarm,
  });

  const isLoading = isEditing && hasFarm && checkLoadingStatus([packageQuery as any]);

  // Permissões REAIS do backend (product-packages_*, grafia com hífen,
  // idêntica ao backend — sem divergência, Contrato §1).
  const canSave = isEditing ? can('product-packages_edit') : can('product-packages_create');

  const packageMutation = useRequest({
    asyncFunction: tryPersistPackage,
    entityName: text.singularLabel,
    queryKey: queryKey.packages.list,
    queryKey2: queryKey.packages.detail,
    // ERRO-FE-018: criar/editar Embalagem precisa invalidar também o cache do
    // multiselect de Produto (`usePackageOptionsList`), senão a Embalagem nova
    // só aparece lá depois de 5min de staleTime ou F5.
    queryKey3: queryKey.packages.options,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo (create e update) — `PackageRequest::rules()`
  // aceita os 3 campos em ambos os verbos; `dirtyFields` não decide o
  // payload, só se há algo a salvar (mirror Kind/FamiliaBens).
  async function tryPersistPackage(data: PackageFormType) {
    const payload: PackagePayload = {
      description: data.description.trim(),
      size: data.size!,
      measurement_uuid: data.measurement_uuid!.value,
    };

    if (isEditing && packageId) {
      return await updatePackage(packageId, payload);
    }
    return await createPackage(payload);
  }

  // Guard `onSubmit` — fórmula VERIFICADA (`!isEmpty(dirtyFields)`, NUNCA sem
  // o `!`: `utils/isEmpty()` retorna `true` quando HÁ chaves — armadilha
  // ERRO-FE-001, 5+ recorrências).
  async function onSubmit(data: PackageFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await packageMutation.mutateAsync(data);
    }
  }

  const isSubmitting = packageMutation.isPending;

  // Sem fazenda ativa E em edição: não há como buscar o registro a editar —
  // EmptyState informativo em vez do form (mesmo texto `noFarmSelected` da
  // listagem, TASK-FE-521). CRIAÇÃO continua renderizando o form normalmente.
  if (isEditing && !hasFarm) {
    return (
      <FormContainer title={text.form.title.edit} showDivider>
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiPackage} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.form.noFarmSelected.title}</EmptyState.Title>
              <EmptyState.Description>
                {text.form.noFarmSelected.description}
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Controller
            name="size"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                allowDot
                name={field.name}
                label={text.form.fields.size}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                min={0.01}
                decimalPlaces={2}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="measurement_uuid"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.measurement}
                placeholder={text.form.placeholders.measurement}
                error={errors.measurement_uuid?.message as string | undefined}
                service={listMeasurementOptions}
                pageSize={FLAT_CATALOG_PAGE_SIZE}
                mapOptions={(item: MeasurementOption) => ({
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
                // Mesmo fix de portal de CreateOrUpdateKind.tsx: o menu
                // não-portalizado é recortado pelo container do form.
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
