// src/pages/BaseRegistrations/TenantParameters/index.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de Parametrizações (settings-form de registro único, D3/§16 do
// contrato TenantParameter). SEM /novo, SEM /:id — o "registro" é sempre o
// conjunto de parâmetros do tenant corrente. Ao salvar, NÃO navega (não há
// lista) — só toast + reset de dirtyFields (fillForm(data, true)).
//
// Passo UX (TASK-FE-070): UX-GAP — nenhuma tela de settings-form de tenant no
// design system `cerne`. Estrutura adotada: `FormContainer` (mesmo
// container de título/subtítulo/divisor de CreateOrUpdate*.tsx), SEM
// grid/listagem; card "Fiscais" ad hoc (Box/Heading, mesmo estilo de
// RecursoConfiguracoesTab.tsx); campo booleano via `Select` Sim/Não, mirror
// EXATO do padrão já usado por `is_enabled` em
// GruposProduto/CreateOrUpdateGrupoProduto.tsx.
//
// ⚠️ LANDMINE `src/utils/isEmpty.ts` (ERRO-FE-001) — nome INVERTIDO (retorna
// `true` quando HÁ chaves). Guard usado aqui é o mesmo padrão CORRIGIDO de
// CreateOrUpdateUnidadeMedida.tsx/CreateOrUpdateGrupoProduto.tsx.
//
// Guard de farm ativa (primeira tela do projeto a lidar com `farm.context`
// ESTRITO, D1 do contrato): a TELA verifica `usePermissions().hasFarm` e, se
// `false`, renderiza um estado informativo em vez de chamar o GET (evita um
// 403 cru para um cenário esperado).
// -----------------------------------------------------------------------------

import { Box, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { FormFooter } from '@/components/FormFooter';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { useCustomFormQuery } from '@/hooks/useCustomFormQuery';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import {
  getTenantParameters,
  updateTenantParameters,
} from '@/services/v2/BaseRegistrations/tenantParameters-service';

import type { Option } from '@/@types/option';
import type {
  TenantParameterData,
  TenantParameterForm as TenantParameterFormType,
  TenantParameterPayload,
} from '@/@types/v2/BaseRegistrations/tenantParameters';

import { tenantParametersSchemaResolver } from '@/validations/schemas/BaseRegistrations/tenantParameters-schema';

export default function TenantParameters() {
  const { languageGB } = useLanguage();
  const { can, hasFarm } = usePermissions();
  const text = languageGB.baseRegistrations.tenantParameters;

  const canSave = can('tenant-parameters_edit');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<TenantParameterFormType>({
    mode: 'onChange',
    resolver: tenantParametersSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: { calc_icms_desonerado: 'false' },
  });

  function fillForm(data: TenantParameterData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({ calc_icms_desonerado: data.calc_icms_desonerado ? 'true' : 'false' });
    }
  }

  // Query inline (settings-form de registro único, SEM `registrationId` — não
  // há endereçamento individual, D5 do contrato). `enabled` é o guard de farm
  // ativa (`hasFarm`) — evita disparar o GET sem fazenda ativa (backend
  // `farm.context` ESTRITO, 403 sem X-Farm-Id).
  const query = useCustomFormQuery<TenantParameterData>({
    queryKey: queryKey.baseRegistrations.tenantParameters,
    asyncFunction: getTenantParameters,
    fillForm,
    enabled: hasFarm,
  });
  const isLoading = hasFarm && checkLoadingStatus([query as any]);

  const mutation = useRequest({
    asyncFunction: tryPersistTenantParameters,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.tenantParameters,
    typesRequest: 'update',
    personalizedMessage: text.form.savedToast,
    actionSuccess: (data) => fillForm(data, true),
  });

  async function tryPersistTenantParameters(data: TenantParameterFormType) {
    const payload: TenantParameterPayload = {
      calc_icms_desonerado: data.calc_icms_desonerado === 'true',
    };
    return await updateTenantParameters(payload);
  }

  // Guard do submit: só dispara a mutation quando HÁ mudança real
  // (`isEmpty(dirtyFields)` é INVERTIDO — retorna `true` quando o objeto TEM
  // chaves). Não há "voltar" com sentido aqui (não há lista), então o guard
  // só evita uma chamada de rede desnecessária.
  async function onSubmit(data: TenantParameterFormType) {
    if (!isEmpty(dirtyFields)) return;
    await mutation.mutateAsync(data);
  }

  const booleanOptions: Option<string>[] = [
    { value: 'true', label: text.form.booleanOptions.yes },
    { value: 'false', label: text.form.booleanOptions.no },
  ];

  if (!hasFarm) {
    return (
      <FormContainer title={text.form.title} showDivider>
        <VStack align="flex-start" gap={2} p={4} bg="bg.subtle" borderRadius="md">
          <Text fontWeight="medium">{text.form.noFarmSelected.title}</Text>
          <Text fontSize="sm" color="fg.muted">
            {text.form.noFarmSelected.description}
          </Text>
        </VStack>
      </FormContainer>
    );
  }

  return (
    <FormContainer title={text.form.title} showDivider>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={4} mb={6}>
          <Heading size="sm" mb={4}>
            {text.form.sections.fiscais}
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Controller
              name="calc_icms_desonerado"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.form.fields.calcIcmsDesonerado}
                  name={name}
                  value={booleanOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value)}
                  options={booleanOptions}
                  error={errors.calc_icms_desonerado?.message}
                  noClearable
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Box>

        <FormFooter noPadding>
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="submit"
              loading={mutation.isPending}
              disabled={mutation.isPending || isLoading}
            />
          )}
        </FormFooter>
      </Form>
    </FormContainer>
  );
}
