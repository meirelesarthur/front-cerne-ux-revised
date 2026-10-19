// src/pages/BaseRegistrations/Apportionments/CreateOrUpdateApportionment.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de criação/edição de Rateio - Categoria Financeira
// (Apportionment, Cadastros Base → Estrutura, TASK-AP-FE-08). Rotas:
// `/cadastros-base/rateios-categorias/novo` (create) e
// `/cadastros-base/rateios-categorias/:apportionmentId` (edit) — registradas
// em TASK-AP-FE-09.
//
// `isEditing = isValidGuid(apportionmentId)` — mirror EXATO de
// `DiagnosisPregnancy/CreateOrUpdateDiagnosisPregnancy.tsx`/
// `IssueDfeSyncTimes/CreateOrUpdateIssueDfeSyncTimes.tsx` (o precedente de
// CÓDIGO vivo do protocolo ativo), NÃO a variante textual `!!apportionmentId
// && apportionmentId !== 'create'` citada na ficha — a rota de criação real
// (`.../novo`, TASK-AP-FE-09) é um path LITERAL distinto de `:apportionmentId`
// (mirror `/diagnostico-gestacao/novo`), então `apportionmentId` já chega
// `undefined` em modo create; `isValidGuid(undefined)` resolve para `false`
// sem precisar comparar contra a string `'create'`/`'novo'`. Divergência
// declarada por precedência "tool/protocolo/código" (mesma regra já usada
// pela própria ficha para a escolha de `useCustomFormQueryByGuid`).
//
// Hook de carga por uuid: `useCustomFormQueryByGuid` (não `ById`) — ver
// nota acima e "Leitura do dev" da ficha, item 1.
//
// Bloqueio "sem atividade cadastrada" (Doc Bruta §6 regra 3): replicado SÓ
// em modo CREATE (mesma assimetria do legado, ficha "Leitura do dev" item 2)
// — se `listEligibleActivities()` devolver vazio, renderiza um
// `Alert`/`EmptyState` bloqueante SEM o form. Em modo EDIT não repete a
// checagem (os `items` já vêm carregados do próprio registro via
// `getApportionment`).
//
// `financial_category_uuid` em modo EDIÇÃO passa `exclude=<uuid do próprio
// Apportionment>` para `listEligibleFinancialCategories` (DA-AP-04,
// reincluindo a categoria já vinculada a ESTE registro — mirror
// `?exclude_apportionment_id=` de DA-AP-06, mesmo princípio).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Alert, Badge, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Percent } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { ApportionmentActivityEditor } from '@/components/ApportionmentActivityEditor/ApportionmentActivityEditor';
import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { apportionmentSchemaResolver } from '@/validations/schemas/BaseRegistrations/apportionment-schema';

import {
  createApportionment,
  getApportionment,
  listEligibleActivities,
  listEligibleFinancialCategories,
  updateApportionment,
} from '@/services/v2/BaseRegistrations/apportionment-service';

import type { Option } from '@/@types/option';
import type {
  ApportionmentData,
  ApportionmentForm as ApportionmentFormType,
  ApportionmentPayload,
} from '@/@types/v2/BaseRegistrations/apportionment';

// TASK-AP-FE-13 — mirror `formatHa` de `ApportionmentActivityEditor.tsx`
// (função local, sem exportação naquele arquivo; duplicação deliberada de
// utilitário pequeno, mesmo padrão já usado por `formatCurrencyBRL` em
// `MovementAllocationEditor.tsx`).
function formatHa(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CreateOrUpdateApportionment() {
  const { apportionmentId } = useParams<{ apportionmentId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.apportionment;

  const isEditing = isValidGuid(apportionmentId);

  const canSave = isEditing ? can('apportionments_edit') : can('apportionments_create');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<ApportionmentFormType>({
    mode: 'onChange',
    resolver: apportionmentSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      financial_category_uuid: null,
      items: [],
    },
  });

  // `fillForm` NOMEADA, guarda `!isEmpty(dirtyFields) || resetForce` (Lei 2)
  // — zero `reset()` inline em `useEffect`. Reconstrói os 2 níveis
  // (atividade + centros) a partir do Resource já eager-loaded
  // (`Apportionment-contrato.md ## 4.7`), sem novo fetch de elegibilidade em
  // modo edição (os `items` do registro JÁ cobrem todas as atividades da
  // fazenda, Doc Bruta §6 regra 2/DA-AP-08).
  function fillApportionmentForm(data: ApportionmentData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        financial_category_uuid: {
          label: `${data.financial_category.code} — ${data.financial_category.description}`,
          value: data.financial_category.uuid,
        },
        items: data.items.map((item) => ({
          activity_uuid: item.activity.uuid,
          activity_description: item.activity.description,
          ha: item.ha,
          percentage: item.percentage,
          // TASK-AP-FE-15 — shape FLAT real de `items[].centers[]`
          // (`ApportionmentItemResource`, sem chave `center` aninhada, sem
          // `code`). Label do valor inicial usa só `description` (Opção 1,
          // default da ficha) — sem cruzar contra `costCenterOptions`
          // (evita reintroduzir dependência de timing entre queries, mesma
          // classe de bug do TASK-AP-FE-14).
          centers: item.centers.map((centerItem) => ({
            center_uuid: {
              label: centerItem.description,
              value: centerItem.uuid,
            },
            ha: centerItem.ha,
            ha_percentage: centerItem.ha_percentage,
          })),
        })),
      });
    }
  }

  const apportionmentQuery = useCustomFormQueryByGuid<ApportionmentData>({
    registrationId: isEditing ? apportionmentId : undefined,
    queryKey: queryKey.baseRegistrations.apportionment,
    asyncFunction: getApportionment,
    fillForm: fillApportionmentForm,
  });

  const isLoading = isEditing && checkLoadingStatus([apportionmentQuery as any]);

  // Atividades elegíveis (Doc Bruta §6 regra 2/DA-AP-05) — SÓ em modo
  // CREATE, popula o nível externo FIXO do `ApportionmentActivityEditor`
  // (`items[]`). Em modo edit, os `items` já vêm de `fillApportionmentForm`.
  const eligibleActivitiesQuery = useQuery({
    queryKey: [queryKey.baseRegistrations.apportionmentEligibleActivities],
    queryFn: async () => {
      const response = await listEligibleActivities();
      return response.data;
    },
    enabled: !isEditing,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!isEditing && eligibleActivitiesQuery.data) {
      // Populado pelo SERVIDOR — nunca marcado como alterado pelo usuário
      // (sem `shouldDirty`), mirror da natureza `readonly` de `ha[]`/
      // `percentage[]` (Doc Bruta §9 #4/#5).
      setValue(
        'items',
        eligibleActivitiesQuery.data.map((activity) => ({
          activity_uuid: activity.activity_uuid,
          activity_description: activity.description,
          ha: activity.ha,
          percentage: activity.percentage,
          centers: [],
        }))
      );
    }
  }, [eligibleActivitiesQuery.data, isEditing, setValue]);

  // Bloqueio "sem atividade cadastrada" (Doc Bruta §6 regra 3) — SÓ em modo
  // create (assimetria fiel ao legado, ver cabeçalho do arquivo).
  const isBlockedNoActivities =
    !isEditing && eligibleActivitiesQuery.isSuccess && eligibleActivitiesQuery.data.length === 0;

  // Categoria Financeira elegível — endpoint NÃO-paginado (DA-AP-04, mesmo
  // achado de `listEligibleCostCenters` documentado em
  // `ApportionmentActivityEditor.tsx`) → `SelectCombobox`. Em modo edição,
  // `exclude=<uuid do próprio registro>` reinclui a categoria já vinculada.
  const excludeFinancialCategoryUuid = isEditing ? apportionmentId : undefined;
  const eligibleFinancialCategoriesQuery = useQuery({
    queryKey: [
      queryKey.baseRegistrations.apportionmentEligibleFinancialCategories,
      excludeFinancialCategoryUuid,
    ],
    queryFn: async () => {
      const response = await listEligibleFinancialCategories({
        exclude: excludeFinancialCategoryUuid,
      });
      return response.data;
    },
    staleTime: 30 * 1000,
  });
  // TASK-AP-FE-16 — o `SelectCombobox` (Chakra v3/Zag.js) só consegue exibir
  // o valor pré-selecionado se ele estiver PRESENTE na `collection` derivada
  // de `options` no momento em que o `value` controlado (RHF) é sincronizado
  // (`@zag-js/combobox`, `syncSelectedItems`/`stringifyMany` — ver "Leitura
  // do dev" da ficha). Em modo EDIT, `apportionmentQuery` e
  // `eligibleFinancialCategoriesQuery` resolvem de forma assíncrona e
  // independente — se a categoria vinculada ao registro não estiver (ainda,
  // ou nunca) em `eligibleFinancialCategoriesQuery.data`, o campo fica
  // vazio. Fix no CALL SITE (não em `SelectCombobox.tsx`, componente
  // compartilhado): injeta a categoria atual do registro, se ausente da
  // lista elegível, dedupe por `uuid`. Zero chamada de rede nova — o dado já
  // está carregado por `apportionmentQuery`. Payload inalterado (segue
  // usando `value.value`, que é o `uuid`).
  const currentFinancialCategory = apportionmentQuery.data?.financial_category;
  const eligibleFinancialCategories = eligibleFinancialCategoriesQuery.data ?? [];
  const financialCategoryOptions: Option<string>[] = (
    isEditing &&
    currentFinancialCategory &&
    !eligibleFinancialCategories.some((category) => category.uuid === currentFinancialCategory.uuid)
      ? [currentFinancialCategory, ...eligibleFinancialCategories]
      : eligibleFinancialCategories
  ).map((category) => ({
    label: `${category.code} — ${category.description}`,
    value: category.uuid,
  }));

  const apportionmentMutation = useRequest({
    asyncFunction: tryPersistApportionment,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.apportionments,
    queryKey2: queryKey.baseRegistrations.apportionment,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistApportionment(data: ApportionmentFormType) {
    const payload: ApportionmentPayload = {
      financial_category_id: data.financial_category_uuid!.value,
      items: data.items.map((item) => ({
        activity_id: item.activity_uuid,
        ha: item.ha,
        percentage: item.percentage,
        // Só grava linha de centro de custo com Centro selecionado — mirror
        // da condição legada `$activityCenters['center_id'][0]` truthy
        // (Doc Bruta §6 regra 5/6): centros sem seleção não são enviados.
        centers: item.centers
          .filter((centerItem) => !!centerItem.center_uuid)
          .map((centerItem) => ({
            center_id: centerItem.center_uuid!.value,
            ha: centerItem.ha ?? 0,
            ha_percentage: centerItem.ha_percentage ?? null,
          })),
      })),
    };

    if (isEditing && apportionmentId) {
      return await updateApportionment(apportionmentId, payload);
    }
    return await createApportionment(payload);
  }

  // Guarda EXPLÍCITA (forma numérica, NUNCA `isEmpty(dirtyFields)`/
  // `!isEmpty(dirtyFields)` para esta decisão — mesma disciplina de
  // `IssueDfeSyncTimes`, que bane a forma invertida por ser
  // sistematicamente confundida): "editar sem alterar nada = Cancelar".
  async function onSubmit(data: ApportionmentFormType) {
    const hasChanges = Object.keys(dirtyFields).length > 0;

    if (isEditing && !hasChanges) {
      navigate(-1);
      return;
    }

    await apportionmentMutation.mutateAsync(data);
  }

  const isSubmitting = apportionmentMutation.isPending;

  // TASK-AP-FE-14 — em CREATE, `isLoading` (linha ~154) é SEMPRE `false`
  // (curto-circuita em `isEditing`) e nunca refletia o carregamento/erro de
  // `eligibleActivitiesQuery` — o botão "Salvar" ficava clicável mesmo com
  // `items` ainda vazio (bloqueio silencioso de validação, sem feedback).
  // Trava o botão enquanto a lista de atividades elegíveis não está pronta
  // OU falhou (isolado do `isLoading` de EDIT, que já cobre outro caminho).
  const isEligibleActivitiesBlocking =
    !isEditing && (eligibleActivitiesQuery.isLoading || eligibleActivitiesQuery.isError);

  // TASK-AP-FE-14 — erro de nível de ARRAY (`items.min(1)`, mensagem
  // `itemsMinLength`) nunca tinha lugar pra aparecer na tela: só existiam
  // blocos para `isBlockedNoActivities` (fetch já terminou e RESSOU vazio)
  // e para `errors.items[index].centers` (erro por linha). Cast local, mesmo
  // padrão de `centersError` em `ApportionmentActivityEditor.tsx`.
  const itemsArrayError = (errors as any)?.items?.message as string | undefined;

  // TASK-AP-FE-13 — "Total (ha)"/"Total (%)" do rodapé, soma client-side de
  // `items[].ha`/`items[].percentage` via `useWatch` (mirror
  // `_forms.blade.php:31,34,44,47` + `total_ha`/`total_percentage` do
  // Resource, `Apportionment-contrato.md:498-499`). Puramente cosmético —
  // não entra no payload (o Form Request nunca recebe estes 2 valores).
  const watchedItems = useWatch({ control, name: 'items' }) ?? [];
  const totalHa = watchedItems.reduce((sum, item) => sum + (Number(item?.ha) || 0), 0);
  const totalPercentage = watchedItems.reduce(
    (sum, item) => sum + (Number(item?.percentage) || 0),
    0
  );

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && !isBlockedNoActivities && (
            // Botão FORA do <form> (vive no footer da casca `FormContainer`,
            // fora da árvore DOM do `<Form id="apportionment-form">`),
            // ligado ao submit via `handleSubmit(onSubmit)` no `onClick` —
            // mirror EXATO do precedente de código vivo
            // (`DiagnosisPregnancy`/`IssueDfeSyncTimes`, `ButtonSaveAndNext`
            // é sempre `type="button"`). `form="apportionment-form"` mantido
            // por documentação/DoD (atributo nativo inerte em botão
            // `type="button"`, sem efeito colateral) — a ficha descreve o
            // requisito com o idioma de `type="submit" form=` (mirror
            // `CreateOrUpdateSolicitacao.tsx`), mas o precedente de código
            // do protocolo ativo usa o padrão `onClick`, que cumpre a MESMA
            // regra ("botão de submit fora do form").
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              form="apportionment-form"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading || isEligibleActivitiesBlocking}
            />
          )}
        </>
      }
    >
      {isBlockedNoActivities ? (
        <Alert.Root status="error" borderRadius="md">
          <Alert.Indicator>
            <Icon as={Percent} />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>{text.form.validation.itemsMinLength}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      ) : (
        <Form id="apportionment-form" noPadding onSubmit={handleSubmit(onSubmit)}>
          {/* TASK-AP-FE-14 — erro de nível de array (`items.min(1)`) hoje
              não tinha lugar pra aparecer: mesmo causa raiz de
              `isBlockedNoActivities` (nenhuma atividade elegível pronta),
              porém para o caso residual em que o fetch ainda está em curso
              ou falhou (`eligibleActivitiesQuery.isError`) sem que o botão
              trave a tempo — mirror visual do Alert acima, mutuamente
              exclusivo por estrutura (só renderiza dentro do ramo `else` de
              `isBlockedNoActivities`). */}
          {itemsArrayError && (
            <Alert.Root status="error" borderRadius="md" mb={6}>
              <Alert.Indicator>
                <Icon as={Percent} />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Title>{itemsArrayError}</Alert.Title>
              </Alert.Content>
            </Alert.Root>
          )}

          <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
            <Controller
              name="financial_category_uuid"
              control={control}
              render={({ field, fieldState }) => (
                <SelectCombobox
                  name={field.name}
                  label={text.form.fields.financialCategory}
                  placeholder={text.form.placeholders.financialCategory}
                  options={financialCategoryOptions}
                  loading={eligibleFinancialCategoriesQuery.isLoading}
                  value={field.value ?? null}
                  onChange={(option) => field.onChange(option ?? null)}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />
          </SimpleGrid>

          <ApportionmentActivityEditor
            control={control}
            errors={errors}
            languageGB={languageGB}
            disabled={!canSave || !!isLoading}
            excludeApportionmentUuid={isEditing ? apportionmentId : undefined}
            isEditing={isEditing}
            setValue={setValue}
          />

          {/* TASK-AP-FE-13 — rodapé "Total (ha)"/"Total (%)", mirror da
              posição EXATA do legado (`_forms.blade.php:28-49`, bloco logo
              APÓS o loop de cards de atividade e ANTES do botão de submit).
              Display/readonly (Badge), fora do fluxo de campos RHF. */}
          <Flex justify="flex-end" align="center" gap={6} mt={6} wrap="wrap">
            <Flex align="center" gap={2}>
              <Text fontSize="sm" color="fg.muted">
                {text.form.fields.totalHa}:
              </Text>
              <Badge colorPalette="gray" variant="outline">
                {formatHa(totalHa)}
              </Badge>
            </Flex>
            <Flex align="center" gap={2}>
              <Text fontSize="sm" color="fg.muted">
                {text.form.fields.totalPercentage}:
              </Text>
              <Badge colorPalette="gray" variant="outline">
                {formatHa(totalPercentage)}%
              </Badge>
            </Flex>
          </Flex>
        </Form>
      )}
    </FormContainer>
  );
}
