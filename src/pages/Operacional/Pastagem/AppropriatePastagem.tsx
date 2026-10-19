// src/pages/Operacional/Pastagem/AppropriatePastagem.tsx
// -----------------------------------------------------------------------------
// Tela de Apropriação/rateio de Pastagem — TASK-PAST-FE-07. Rota dedicada
// `operacional/pastagem/:uuid/apropriacao`. Consome `GET/PUT
// /pastures/{uuid}/appropriation`. Reusa o padrão da feature irmã
// `Operacional/Appropriations` (rateio center/class por linha) — `Select`
// estático (não `SelectAsyncPaginate`: os centros elegíveis já vêm
// resolvidos e COMPLETOS no `GET`, sem paginação).
//
// Atalho auto-A (CLM-32) — quando as 4 categorias de satélite estão
// vazias, `GetPastureAppropriationAction` JÁ aplicou `status=A` no
// servidor e devolve `eligible_centers: []`; o front detecta isso (nenhum
// item nas 4 coleções) e navega de volta com toast, sem renderizar
// formulário (mirror exato do comportamento do backend, AC-EP-06 §5.7).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiAlertTriangle } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { FormFooter } from '@/components/FormFooter';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { isValidGuid } from '@/utils/guid';

import { opClassOptions } from '@/constants/pastures/options/op-class-options';
import { queryKey } from '@/constants/query-key';

import { appropriatePasture, getPastureAppropriation } from '@/services/v2/Pastures';

import type { Option } from '@/@types/option';
import type {
  AppropriatePastureForm,
  AppropriatePastureRequestPayload,
  AppropriationData,
} from '@/@types/v2/Pastures';

import { mapAppropriationDataToFormValues } from './appropriation-mapper';
import { AppropriationHeaderPastagem } from './AppropriationHeaderPastagem';

import type { Control } from 'react-hook-form';

const PASTAGEM_LIST_ROUTE = '/operacional/pastagem';

type AppropriationCollectionName = 'equipments' | 'inputs' | 'productions' | 'services';

interface AppropriationTexts {
  fields: { costCenter: string; class: string; vlTime: string };
  placeholders: { costCenter: string };
}

export default function AppropriatePastagem() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.pastures.pasture.appropriation;
  const formTabs = languageGB.pastures.pasture.form.tabs;
  const canSave = can('pastures_edit');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting: isValidating },
  } = useForm<AppropriatePastureForm>({
    mode: 'onChange',
    defaultValues: { equipments: [], inputs: [], productions: [], services: [] },
  });

  const appropriationQuery = useQuery({
    queryKey: [queryKey.pastures.pasture, 'appropriation', uuid],
    queryFn: async () => {
      const response = await getPastureAppropriation(uuid!);
      return response.data;
    },
    enabled: isValidGuid(uuid),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const data = appropriationQuery.data as AppropriationData | undefined;
  const isLoading = appropriationQuery.isPending;
  const notFound = !isValidGuid(uuid) || appropriationQuery.isError;

  const hasCosts =
    !!data &&
    (data.pasture.equipments.length > 0 ||
      data.pasture.inputs.length > 0 ||
      data.pasture.productions.length > 0 ||
      data.pasture.services.length > 0);

  useEffect(() => {
    if (!data) return;
    if (!hasCosts) {
      toaster.success({ title: text.autoAppropriatedToast, duration: 6000 });
      navigate(PASTAGEM_LIST_ROUTE, { replace: true });
      return;
    }
    reset(mapAppropriationDataToFormValues(data));
  }, [data]);

  const centerOptions: Option<string>[] = (data?.eligible_centers ?? []).map((center) => ({
    label: `${center.code} — ${center.description}`,
    value: center.uuid,
  }));
  const classOptions: Option<number>[] = opClassOptions.options(languageGB);

  const appropriateMutation = useRequest({
    asyncFunction: async (payload: AppropriatePastureRequestPayload) =>
      appropriatePasture(uuid!, payload),
    entityName: languageGB.pastures.pasture.singularLabel,
    queryKey: queryKey.pastures.pastures,
    queryKey2: queryKey.pastures.pasture,
    typesRequest: 'update',
    personalizedMessage: text.appropriatedToast,
    actionSuccess: () => navigate(PASTAGEM_LIST_ROUTE),
  });

  async function onSubmit(formData: AppropriatePastureForm) {
    const payload: AppropriatePastureRequestPayload = {
      equipments: formData.equipments
        .filter((row) => row.center_uuid && row.class)
        .map((row) => ({
          uuid: row.uuid,
          center_uuid: row.center_uuid!.value,
          class: row.class!.value,
          vl_time: row.vl_time ?? 0,
        })),
      inputs: formData.inputs
        .filter((row) => row.center_uuid && row.class)
        .map((row) => ({
          uuid: row.uuid,
          center_uuid: row.center_uuid!.value,
          class: row.class!.value,
        })),
      productions: formData.productions
        .filter((row) => row.center_uuid && row.class)
        .map((row) => ({
          uuid: row.uuid,
          center_uuid: row.center_uuid!.value,
          class: row.class!.value,
        })),
      services: formData.services
        .filter((row) => row.center_uuid && row.class)
        .map((row) => ({
          uuid: row.uuid,
          center_uuid: row.center_uuid!.value,
          class: row.class!.value,
        })),
    };
    await appropriateMutation.mutateAsync(payload);
  }

  if (notFound) {
    return (
      <FormContainer title={text.title}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>
                  {languageGB.pastures.pasture.show.notFound.title}
                </EmptyState.Title>
              </VStack>
              <Button
                title={languageGB.pastures.pasture.show.notFound.back}
                variant="outline"
                size="sm"
                onClick={() => navigate(PASTAGEM_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer title={text.title} subtitle={text.subtitle} showDivider>
      <Skeleton loading={isLoading}>
        {data && hasCosts && (
          <Form onSubmit={handleSubmit(onSubmit)} noPadding>
            <Box mb={6}>
              <Text fontSize="sm" fontWeight="semibold" mb={4}>
                {text.headerTitle}
              </Text>
              <AppropriationHeaderPastagem pasture={data.pasture} />
            </Box>

            <AppropriationCollection
              title={formTabs.equipments}
              name="equipments"
              control={control}
              centerOptions={centerOptions}
              classOptions={classOptions}
              canSave={canSave}
              showVlTime
              text={text}
            />
            <AppropriationCollection
              title={formTabs.inputs}
              name="inputs"
              control={control}
              centerOptions={centerOptions}
              classOptions={classOptions}
              canSave={canSave}
              text={text}
            />
            <AppropriationCollection
              title={formTabs.productions}
              name="productions"
              control={control}
              centerOptions={centerOptions}
              classOptions={classOptions}
              canSave={canSave}
              text={text}
            />
            <AppropriationCollection
              title={formTabs.services}
              name="services"
              control={control}
              centerOptions={centerOptions}
              classOptions={classOptions}
              canSave={canSave}
              text={text}
            />

            <FormFooter noPadding>
              <Button
                title={text.back}
                variant="outline"
                type="button"
                onClick={() => navigate(-1)}
                disabled={isValidating}
              />
              {canSave && (
                <Button title={text.submit} type="submit" loading={appropriateMutation.isPending} />
              )}
            </FormFooter>
          </Form>
        )}
      </Skeleton>
    </FormContainer>
  );
}

interface AppropriationCollectionProps {
  title: string;
  name: AppropriationCollectionName;
  control: Control<AppropriatePastureForm>;
  centerOptions: Option<string>[];
  classOptions: Option<number>[];
  canSave: boolean;
  showVlTime?: boolean;
  text: AppropriationTexts;
}

function AppropriationCollection({
  title,
  name,
  control,
  centerOptions,
  classOptions,
  canSave,
  showVlTime,
  text,
}: AppropriationCollectionProps) {
  const { fields } = useFieldArray({ control, name });

  if (fields.length === 0) return null;

  return (
    <Box mb={6}>
      <Text fontSize="sm" fontWeight="semibold" mb={3}>
        {title}
      </Text>
      <Flex direction="column" gap={3}>
        {fields.map((field, index) => (
          <Box
            key={field.id}
            p={3}
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
          >
            <SimpleGrid columns={{ base: 1, sm: 2, md: showVlTime ? 3 : 2 }} gap={4}>
              <Controller
                name={`${name}.${index}.center_uuid`}
                control={control}
                render={({ field: rowField }) => (
                  <Select
                    label={text.fields.costCenter}
                    placeholder={text.placeholders.costCenter}
                    name={rowField.name}
                    value={rowField.value}
                    onChange={(option: Option<string> | null) => rowField.onChange(option ?? null)}
                    options={centerOptions}
                    isRequired
                    isDisabled={!canSave}
                  />
                )}
              />
              <Controller
                name={`${name}.${index}.class`}
                control={control}
                render={({ field: rowField }) => (
                  <Select
                    label={text.fields.class}
                    name={rowField.name}
                    value={rowField.value}
                    onChange={(option: Option<number> | null) => rowField.onChange(option ?? null)}
                    options={classOptions}
                    isRequired
                    isDisabled={!canSave}
                  />
                )}
              />
              {showVlTime && (
                <Controller
                  name={`${name}.${index}.vl_time`}
                  control={control}
                  render={({ field: rowField }) => (
                    <NumberInput
                      name={rowField.name}
                      label={text.fields.vlTime}
                      allowDot
                      decimalPlaces={2}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      disabled={!canSave}
                    />
                  )}
                />
              )}
            </SimpleGrid>
          </Box>
        ))}
      </Flex>
    </Box>
  );
}
