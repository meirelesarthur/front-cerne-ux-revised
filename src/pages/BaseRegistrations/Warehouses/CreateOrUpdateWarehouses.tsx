// src/pages/BaseRegistrations/Warehouses/CreateOrUpdateWarehouses.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de ARMAZÉM — Cadastros Base. Rotas:
// /cadastros-base/armazens/novo (criar) e /cadastros-base/armazens/:warehouseId
// (editar, GUID) — ambas registradas em TASK-FE-020, mesmo componente nas duas
// (Warehouse-contrato-frontend.md §5.2/§5.3, APROVADO v1.1).
//
// Mirror mecânico de CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto.tsx,
// DRASTICAMENTE simplificado (Modelo A — CRUD flat, "Leitura do dev" da
// Tarefa): 3 campos de negócio (Sigla/Tipo/Descrição) + 1 toggle (Ativo) —
// SEM Antecessor/SelectAsyncPaginate, SEM Classe/Código gerado (caixa
// dedicada), SEM seção de Rateio/useFieldArray, SEM banner de "criar
// descendente" — nenhum desses existe no domínio de Warehouse (sem
// hierarquia, sem sub-recurso). Permissão de salvar é GLOBAL nos dois modos
// (`warehouses_create`/`warehouses_edit`, sem flag por item — diferente de
// CostCenter/DEC-005, `WarehouseResource` não expõe `can_edit`/`can_create`).
//
// ⚠️ LANDMINE `ERRO-FE-001` (confirmada por leitura direta de
// src/utils/isEmpty.ts, 6 linhas): `isEmpty(obj)` retorna `true` quando `obj`
// TEM ao menos uma chave — semântica INVERTIDA em relação ao nome. Já causou
// salvamento silenciosamente ignorado em Centro de Custo/Safras (edição não
// persiste, sem erro nenhum, o form some sem salvar). A forma CORRETA — a
// única aceitável neste arquivo — é sempre `!isEmpty(dirtyFields) ||
// resetForce`; NUNCA remover o `!` por parecer redundante lendo o nome da
// função. Usada em 2 pontos deste arquivo:
//   1) `fillWarehouseForm` — só sobrescreve o form quando NÃO há edição do
//      usuário em andamento (dirtyFields vazio) OU quando forçado
//      (`resetForce`). Nota técnica: o call site real
//      (`useCustomFormQueryByGuid`) hoje sempre passa `resetForce=true` no
//      seu `useEffect` interno — a guarda `!isEmpty(dirtyFields)` fica
//      "dormente" nesse caminho específico, mas a forma completa é mantida
//      LITERAL por ser o padrão documentado no contrato (Lei 2 do
//      `get_pwa_form_query_pattern`) e por proteger qualquer call site futuro
//      que não force o reset (ex.: um botão "descartar alterações").
//   2) `onSubmit` — replica o atalho de CentroCusto: em edição, se NADA
//      mudou (`dirtyFields` vazio), só volta pra lista sem chamar a mutação
//      (evita PUT vazio). Esta é a guarda que o cenário de teste manual do
//      dev ("editar, mudar 1 campo e salvar — a edição persiste de verdade")
//      realmente exercita na prática: se alguém remover o `!` aqui, salvar
//      com 1 campo alterado passaria a `navigate(-1)` SEM chamar o PUT, sem
//      toast — sintoma idêntico ao descrito na Tarefa ("o dado antigo
//      reaparece").
//
// Achado registrado (NÃO é Gap bloqueante desta Tarefa — a mesma lacuna já
// existe nos dois precedentes lidos): a Referência UX (`ArmazemForm.tsx`) tem
// um dialog de "alterações não salvas" ao tentar sair com o form sujo.
// Verificado no `frontend_root` (grep por unsaved/beforeunload/hook
// equivalente em todo `src/`) — NENHUM hook desse tipo existe no app real, e
// nem `CreateOrUpdateCentroCusto.tsx` nem `CreateOrUpdatePerfil.tsx` o
// implementam. Por instrução explícita da Tarefa ("verificar antes de criar
// um novo... se não existir hook equivalente, registrar como achado/Gap, não
// inventar"), este comportamento NÃO foi implementado aqui — fica como
// candidato a Gap de INFRAESTRUTURA COMPARTILHADA (não específico de
// Armazém) para o coordenador avaliar.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { warehouseSchemaResolver } from '@/validations/schemas/BaseRegistrations/warehouse-schema';

import {
  createWarehouse,
  getWarehouse,
  updateWarehouse,
} from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type {
  WarehouseDetail,
  WarehouseForm as WarehouseFormType,
  WarehousePayload,
  WarehouseTypeSlug,
} from '@/@types/v2/Warehouses';

export default function CreateOrUpdateWarehouses() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID) — mesmo
  // padrão de `costCenterId`/`roleId` dos precedentes.
  const isEditing = isValidGuid(warehouseId);

  const text = languageGB.warehouses.warehouse;

  // Permissão GLOBAL, sem flag por item (`WarehouseResource` não expõe
  // `can_edit`/`can_create` — diferente de CostCenter/DEC-005). Contrato §7.
  const canSave = isEditing ? can('warehouses_edit') : can('warehouses_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<WarehouseFormType>({
    mode: 'onChange',
    resolver: warehouseSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      initials: '',
      description: '',
      type: '',
      is_active: true,
    },
  });

  // ⚠️ ERRO-FE-001 — ver nota no cabeçalho do arquivo (guarda #1).
  // `!isEmpty(dirtyFields)` só é `true` quando `dirtyFields` está VAZIO
  // (nenhuma edição do usuário em andamento) — condição em que é seguro
  // sobrescrever o form com o dado do servidor. NUNCA remover o `!`.
  function fillWarehouseForm(data: WarehouseDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        initials: data.initials,
        description: data.description,
        type: data.type,
        is_active: !!data.is_active,
      });
    }
  }

  const warehouseQuery = useCustomFormQueryByGuid<WarehouseDetail>({
    registrationId: isEditing ? warehouseId : undefined,
    queryKey: queryKey.warehouses.detail,
    asyncFunction: getWarehouse,
    fillForm: fillWarehouseForm,
  });

  const isLoading = isEditing && checkLoadingStatus([warehouseQuery as any]);

  const warehouseMutation = useRequest({
    asyncFunction: tryPersistWarehouse,
    entityName: text.singularLabel,
    queryKey: queryKey.warehouses.list,
    queryKey2: queryKey.warehouses.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // PUT parcial (update): o payload é montado a partir do snapshot ATUAL do
  // próprio `useForm` (`data`), que já chega com os 4 campos completos — os
  // valores VIGENTES preenchidos por `fillWarehouseForm` mesclados com o que
  // o usuário efetivamente mudou nesta sessão (RHF mantém um único estado
  // para os campos tocados e não tocados). Nunca um payload parcial "só do
  // delta" — o backend espera o objeto completo em `PUT`, igual a
  // CostCenter/Perfil. `farm_id` NUNCA entra no payload em nenhum modo —
  // imutável após a criação (DEC-007 pt.5), nem sequer é lido de lugar
  // nenhum nesta tela (não existe no `AuthContext`/localStorage consumido
  // aqui; quem injeta o tenant é o header `X-Farm-Id` do client HTTP
  // compartilhado).
  async function tryPersistWarehouse(data: WarehouseFormType) {
    const payload: WarehousePayload = {
      initials: data.initials.trim(),
      description: data.description.trim(),
      type: data.type as WarehouseTypeSlug,
      is_active: !!data.is_active,
    };

    if (isEditing && warehouseId) {
      return await updateWarehouse(warehouseId, payload);
    }

    return await createWarehouse(payload);
  }

  // ⚠️ ERRO-FE-001 — ver nota no cabeçalho do arquivo (guarda #2). Mesmo
  // atalho de CentroCusto: em edição, se NADA mudou (`dirtyFields` vazio),
  // só volta pra lista sem chamar a mutação (evita um PUT vazio). Manter o
  // `!` aqui é o que faz "editar, mudar 1 campo e salvar" realmente chamar o
  // PUT — removê-lo reproduziria exatamente o sintoma já catalogado (volta
  // para a lista sem chamar a API, sem toast, dado antigo reaparece).
  async function onSubmit(data: WarehouseFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await warehouseMutation.mutateAsync(data);
    }
  }

  const isSubmitting = warehouseMutation.isPending;

  // 3 opções fixas locais (sem endpoint de enum, mesma necessidade que
  // CostCenter já tem para o próprio enum de 2 valores) — mesmos rótulos que
  // `type_label` da API já usa na grid (contrato §4/§10 item 9), reaproveitando
  // as strings de `filter.typeOptions` (mesmo precedente de reaproveitamento
  // já usado por CentroCusto entre `form`/`filter`).
  const typeOptions: Option<string>[] = useMemo(
    () => [
      { value: 'insumos', label: text.filter.typeOptions.insumos },
      { value: 'producao', label: text.filter.typeOptions.producao },
      { value: 'formulacao', label: text.filter.typeOptions.formulacao },
    ],
    [text]
  );

  const watchedInitials = watch('initials') ?? '';
  const watchedDescription = watch('description') ?? '';

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
            label={text.form.fields.initials}
            placeholder={text.form.placeholders.initials}
            {...register('initials')}
            helperText={errors.initials?.message ? undefined : `${watchedInitials.length}/6`}
            error={errors.initials?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.form.fields.type}
                name={name}
                value={typeOptions.find((o) => o.value === value) ?? null}
                onChange={(opt: Option<string> | null) => onChange(opt?.value ?? '')}
                options={typeOptions}
                error={errors.type?.message}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            helperText={errors.description?.message ? undefined : `${watchedDescription.length}/80`}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Flex direction="column" pr={4}>
                  <Text fontSize="sm" fontWeight="medium">
                    {text.form.fields.isActive}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {text.form.hints.isActiveHelp}
                  </Text>
                </Flex>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isActive}
                />
              </Flex>
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
