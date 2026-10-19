// src/pages/CadastrosBase/Safra/CreateOrUpdateSafra.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de SAFRA — Cadastros Base.
// Rotas (registradas em TASK-FE-011): /cadastros-base/safras/novo (create) e
// /cadastros-base/safras/:harvestId (edit, GUID).
//
// Mirror ESTRUTURAL de CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto.tsx
// (MIRROR PRIMÁRIO desta Tarefa): um único `useForm`, `isEditing =
// isValidGuid(harvestId)`, `fillForm` nomeada com guarda de `dirtyFields`
// (Lei 2), `useRequest` para a mutação, mesmo catálogo de componentes. SEM
// abas — esta Tarefa cobre só os campos centrais (Dados Gerais); a seção de
// Semanas é TASK-FE-009, que estende ESTE MESMO ARQUIVO logo abaixo do bloco
// de datas (ver marcador de extensão abaixo), exatamente como TASK-FE-004
// (Rateio) estendeu este mesmo form central de Centro de Custo.
//
// Fidelidade à Referência UX (GB.Cerne.UX/.../SafraCadastro.tsx, commit
// 73b5fa86) COM ADAPTAÇÃO nos pontos em que o mock diverge do contrato real
// da API (tabela de divergências de 07-Tarefas_Frontend/08-safras-formulario
// -dados-gerais.md é a fonte da verdade, não o mock):
//   - `herd_control` real tem só 2 valores (individual/lote), não os 3 do
//     mock (individual/coletivo/nenhum) — rótulos batem com
//     `HarvestHerdControl::label()` do backend (replicados em i18n);
//   - `auto_evolution`/`is_enabled` são booleanos reais (Switch), não Select
//     "Habilitado/Desabilitado"/"Ativa/Inativa" como o mock;
//   - `first_month`/`second_month` são inteiros 1-12 (Select numérico com
//     nome de mês por extenso), não sigla de 3 letras como string (`s1`/`s2`);
//   - `description` tem limite real de 100 (mock não tinha contador; Centro
//     de Custo usa /40 — aqui é /100);
//   - o mock usa `Stepper`/`StepHeader`/`StepFooter` (2 passos) — sem
//     equivalente no catálogo real desta SPA. Decisão de adaptação (já
//     registrada no contrato da feature): página única, sem wizard, com a
//     seção de Semanas inline e condicional (TASK-FE-009), no mesmo idioma
//     visual que Centro de Custo já usa para Rateio;
//   - `periods` NUNCA no payload (sem endpoint `/periods` no v1 — ver
//     harvest-service.ts).
//
// Decisão de adaptação — 422 por campo: este projeto NÃO tem, hoje, nenhum
// mecanismo compartilhado que mapeie erros 422 do backend para
// `formState.errors` (nenhum `setError` em `useRequest.tsx` nem em nenhum
// outro CRUD já migrado, incluindo o mirror primário Centro de Custo — só o
// toast genérico com a `message` de nível superior). Para cumprir a DoD desta
// Tarefa ("422 tratado no mesmo campo") sem alterar infraestrutura
// compartilhada (fora do escopo de Arquivos Afetados e fora do lote SOLO
// desta Tarefa), `tryPersistHarvest` abaixo mapeia `error.response.data.errors`
// para `setError` LOCALMENTE, por cima do try/catch, e relança o erro — o
// toast genérico de `useRequest` continua funcionando exatamente como antes
// (nenhuma duplicação, só soma). Ver nota completa no corpo da função.
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';

import { Box, Flex, Skeleton, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { createHarvest, updateHarvest } from '@/services/v2/Harvests/harvest-service';

import type { Option } from '@/@types/option';
import type {
  Harvest,
  HarvestForm as HarvestFormType,
  HarvestHerdControl,
  HarvestPayload,
} from '@/@types/v2/Harvests';

import { safraSchemaResolver } from './safra-schema';
import { generateWeeks, WEEK_COLOR_CYCLE } from './safra-weeks';
import { useHarvestForm } from './useHarvests';
import { WeeksCanvas } from './WeeksCanvas';

import type { WeekColorKey } from './safra-weeks';

export default function CreateOrUpdateSafra() {
  const { harvestId } = useParams<{ harvestId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(harvestId);
  const canSave = isEditing ? can('harvests_edit') : can('harvests_create');

  const text = languageGB.harvests.harvest;

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    setFocus,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<HarvestFormType>({
    mode: 'onChange',
    resolver: safraSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      start_date: '',
      end_date: '',
      is_enabled: true, // sem default no banco (coluna NOT NULL) — segue o default de UX de Centro de Custo
      herd_control: 'individual', // default real do banco
      first_month: 5, // default real do banco (Maio)
      second_month: 9, // default real do banco (Setembro)
      auto_evolution: false, // default real do banco
      weeks: [], // populado pela seção de TASK-FE-009 assim que start_date/end_date forem válidos
    },
  });

  function fillForm(data: Harvest, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        start_date: data.start_date,
        end_date: data.end_date,
        is_enabled: !!data.is_enabled,
        herd_control: data.herd_control,
        first_month: data.first_month,
        second_month: data.second_month,
        auto_evolution: !!data.auto_evolution,
        // uuid de cada semana NÃO é guardado no form — upsert no backend é
        // por number_week (DA-H-07), não por uuid.
        weeks: data.weeks.map((week) => ({
          number_week: week.number_week,
          start_date: week.start_date,
          end_date: week.end_date,
          color: week.color,
        })),
      });
    }
  }

  const harvestQuery = useHarvestForm({
    registrationId: isEditing ? harvestId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([harvestQuery as any]);

  const harvestMutation = useRequest({
    asyncFunction: tryPersistHarvest,
    entityName: text.singularLabel,
    queryKey: queryKey.harvests.list,
    queryKey2: queryKey.harvests.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistHarvest(data: HarvestFormType) {
    const payload: HarvestPayload = {
      description: data.description.trim(),
      start_date: data.start_date,
      end_date: data.end_date,
      is_enabled: !!data.is_enabled,
      herd_control: data.herd_control,
      // TASK-FE-009: populado pela seção de Semanas (geração algorítmica +
      // pintura). Mapeamento EXPLÍCITO (não `data.weeks` cru) por decisão
      // deliberada: `GeneratedWeek` (`safra-weeks.ts`) é um superset
      // estrutural de `WeekVintagePayload` (carrega `year`/`month` a mais,
      // só para agrupamento visual em `WeeksCanvas`) — como `replace()` do
      // `useFieldArray` grava o objeto inteiro no estado do form, essas
      // chaves extras sobreviveriam até aqui se não fossem removidas. Este
      // `.map()` garante que o payload enviado ao backend seja SEMPRE
      // exatamente `{number_week, start_date, end_date, color}`, fiel ao
      // contrato real (nunca `year`/`month` no corpo da requisição).
      weeks: data.weeks.map((week) => ({
        number_week: week.number_week,
        start_date: week.start_date,
        end_date: week.end_date,
        color: week.color,
      })),
    };

    if (data.first_month != null) payload.first_month = data.first_month;
    if (data.second_month != null) payload.second_month = data.second_month;
    if (data.auto_evolution != null) payload.auto_evolution = data.auto_evolution;
    // `periods` NUNCA enviado no v1 — sem endpoint `/periods` (ver harvest-service.ts).

    try {
      return isEditing && harvestId
        ? await updateHarvest(harvestId, payload)
        : await createHarvest(payload);
    } catch (error) {
      // 422 do backend mapeado por campo (mesma chave de HarvestForm) — este
      // projeto não tem, hoje, um mecanismo compartilhado para isso (nenhum
      // `setError` em `useRequest.tsx`, ver nota de cabeçalho do arquivo).
      // Mapeamento feito LOCALMENTE aqui, sem tocar infraestrutura
      // compartilhada; o `throw` abaixo preserva o toast genérico que
      // `useRequest` já mostra para qualquer erro (soma, não substitui).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof HarvestFormType, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  async function onSubmit(data: HarvestFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await harvestMutation.mutateAsync(data);
    }
  }

  const isSubmitting = harvestMutation.isPending;

  const herdControlOptions: Option<HarvestHerdControl>[] = useMemo(
    () => [
      { value: 'individual', label: text.form.herdControlOptions.individual },
      { value: 'lote', label: text.form.herdControlOptions.lote },
    ],
    [text]
  );

  // Select numérico 1-12 — rótulo por extenso vem do i18n (índice 0 = Janeiro).
  const monthOptions: Option<number>[] = useMemo(
    () => text.form.monthOptions.map((label, index) => ({ value: index + 1, label })),
    [text]
  );

  const watchedDescription = watch('description');
  const descriptionLength = (watchedDescription ?? '').length;

  // `watch('start_date')`/`watch('end_date')` — usados aqui como guarda
  // client-side extra (min/max nativos do `<input type="date">`, além da
  // validação Yup) E é o MESMO par de variáveis que a seção de Semanas
  // (TASK-FE-009) vai reaproveitar para regenerar as semanas quando as datas
  // mudarem — não pré-declarado sem uso: já serve aos dois propósitos aqui.
  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  // TASK-FE-009 — Semanas (`weeks`) sobre o MESMO `useForm` acima. Diferente
  // do Rateio de Centro de Custo (linhas adicionadas/removidas livremente
  // pelo usuário), as linhas aqui são 100% geradas algoritmicamente a partir
  // das datas — `append`/`remove` NUNCA são usados; só `replace()` (ao
  // (re)gerar por mudança de data ou reiniciar o ciclo de cores) e
  // `update(index, ...)` (ao pintar uma semana individual).
  const {
    fields: weekFields,
    replace: replaceWeeks,
    update: updateWeek,
  } = useFieldArray({
    control,
    name: 'weeks',
  });

  // Regenera as semanas sempre que start_date/end_date mudarem (preservando
  // a cor de semanas já existentes por {number_week, year} — ver
  // `generateWeeks`). Deliberadamente NÃO inclui `weekFields`/`fields` nas
  // dependências (só `watchedStartDate`/`watchedEndDate` + as referências
  // ESTÁVEIS `getValues`/`replaceWeeks`, que o `react-hook-form` garante não
  // mudarem de identidade entre renders): incluir `weekFields` criaria um
  // laço, já que `replaceWeeks()` também altera `weekFields`. `getValues`
  // sempre lê o valor MAIS RECENTE de `weeks` no momento em que o efeito
  // roda (não uma captura desatualizada), então o casamento de cor por
  // {number_week, year} funciona tanto ao gerar pela primeira vez (criação)
  // quanto ao regenerar depois de um `fillForm` (edição, onde `weeks` já
  // chega preenchido do servidor).
  useEffect(() => {
    // Leitura AO VIVO via `getValues` (não `watchedStartDate`/`watchedEndDate`
    // de `watch()`, presos ao fechamento do render em que o efeito foi
    // agendado) — corrige ERRO-FE-004: quando `fillForm`/`reset()`
    // (`useCustomFormQueryByGuid.tsx`) e este efeito rodam na MESMA leva de
    // efeitos de montagem (query de detalhe resolvida do cache do TanStack
    // Query), `watch()` ainda não propagou o `reset()` recém-aplicado, mas
    // `getValues()` já reflete o estado interno real do RHF. Mesmo padrão já
    // usado corretamente para `currentWeeks` abaixo. `watchedStartDate`/
    // `watchedEndDate` seguem SÓ como gatilho de dependência — o efeito
    // continua reagindo normalmente a qualquer mudança de data.
    const startDate = getValues('start_date');
    const endDate = getValues('end_date');
    if (!startDate || !endDate || endDate < startDate) return;
    const currentWeeks = getValues('weeks');
    replaceWeeks(generateWeeks(startDate, endDate, currentWeeks));
  }, [watchedStartDate, watchedEndDate, getValues, replaceWeeks]);

  // Pinta UMA semana com a cor ativa da paleta — reconstrói o objeto
  // explicitamente (não espalha `weekFields[index]`) para nunca propagar a
  // chave interna `id` do `useFieldArray` nem `year`/`month` (ver nota em
  // `tryPersistHarvest`) para dentro do estado do campo.
  function handleWeekColorChange(index: number, color: WeekColorKey) {
    const current = weekFields[index];
    if (!current) return;
    updateWeek(index, {
      number_week: current.number_week,
      start_date: current.start_date,
      end_date: current.end_date,
      color,
    });
  }

  // "Reiniciar ciclo de cores" — reatribui a cor de TODAS as semanas atuais
  // pela posição no ciclo padrão (mesma semântica de `resetCycle` da
  // Referência UX: por ÍNDICE no array atual, não por nova geração a partir
  // das datas — preserva `number_week`/datas de cada semana tal como estão).
  function handleResetColorCycle() {
    replaceWeeks(
      weekFields.map((field, index) => ({
        number_week: field.number_week,
        start_date: field.start_date,
        end_date: field.end_date,
        color: WEEK_COLOR_CYCLE[index % WEEK_COLOR_CYCLE.length],
      }))
    );
  }

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
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
        {/* Linha 1: Controle de Rebanho | Descrição | Ativa | Evolução Automática */}
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="herd_control"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.herdControl}
                name={name}
                value={herdControlOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<HarvestHerdControl> | null) => onChange(opt?.value)}
                options={herdControlOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            helperText={errors.description?.message ? undefined : `${descriptionLength}/100`}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isEnabled}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isEnabled}
                />
              </Flex>
            )}
          />

          <Controller
            name="auto_evolution"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.autoEvolution}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.autoEvolution}
                />
              </Flex>
            )}
          />
        </SimpleGrid>

        {/* Linha 2: Datas — bloco referenciado pela Tarefa como ponto de
            inserção da seção de Semanas (ver marcador abaixo). */}
        <Box mt={6}>
          <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <DateInput
                  label={text.form.fields.startDate}
                  maxDate={watchedEndDate ? new Date(`${watchedEndDate}T00:00:00`) : undefined}
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? '')}
                  error={errors.start_date?.message}
                  isRequired
                  disabled={!canSave || isLoading}
                />
              )}
            />
            <Controller
              name="end_date"
              control={control}
              render={({ field }) => (
                <DateInput
                  label={text.form.fields.endDate}
                  minDate={watchedStartDate ? new Date(`${watchedStartDate}T00:00:00`) : undefined}
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? '')}
                  error={errors.end_date?.message}
                  isRequired
                  disabled={!canSave || isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Box>

        {/* Semanas (TASK-FE-009) — mesmo idioma visual (Box com borda) que a
            seção de Rateio já estabeleceu em Centro de Custo. Renderizada
            SEMPRE (não só quando `weekFields.length > 0`): o próprio
            `WeeksCanvas` cobre o estado vazio ("Nenhuma semana gerada...")
            com CTA de volta às datas — esconder a caixa inteira até haver
            semanas tornaria esse estado (exigido pela Tarefa) inatingível
            nesta tela. `Skeleton` cobre o carregamento em modo edição
            (aguardando `fillForm`), distinto do estado vazio. */}
        <Box mt={6}>
          <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
            <Skeleton loading={isLoading}>
              {/* Rede de segurança: só aparece se `generateWeeks` falhar em
                  produzir ao menos 1 semana com datas já válidas — não
                  esperado no uso normal (ver `safra-schema.ts`). */}
              {typeof errors.weeks?.message === 'string' && (
                <Text fontSize="sm" color="fg.error" mb={3}>
                  {errors.weeks.message}
                </Text>
              )}
              <WeeksCanvas
                weeks={weekFields}
                editable={canSave}
                onWeekColorChange={handleWeekColorChange}
                onResetCycle={handleResetColorCycle}
                onEmptyAction={() => setFocus('start_date')}
                iniLabel={watchedStartDate || undefined}
                fimLabel={watchedEndDate || undefined}
                text={text}
              />
            </Skeleton>
          </Box>
        </Box>

        {/* Linha 3: 1º/2º Semestre inicia em */}
        <Box mt={6}>
          <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
            <Controller
              name="first_month"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.firstMonth}
                  name={name}
                  value={monthOptions.find((option) => option.value === value) ?? null}
                  onChange={(opt: Option<number> | null) => onChange(opt?.value ?? null)}
                  options={monthOptions}
                  error={error?.message}
                  isDisabled={!canSave}
                  loading={isLoading}
                />
              )}
            />
            <Controller
              name="second_month"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.secondMonth}
                  name={name}
                  value={monthOptions.find((option) => option.value === value) ?? null}
                  onChange={(opt: Option<number> | null) => onChange(opt?.value ?? null)}
                  options={monthOptions}
                  error={error?.message}
                  isDisabled={!canSave}
                  loading={isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Box>
      </Form>
    </FormContainer>
  );
}
