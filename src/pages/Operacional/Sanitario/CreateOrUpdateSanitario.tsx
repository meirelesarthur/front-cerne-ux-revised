// src/pages/Operacional/Sanitario/CreateOrUpdateSanitario.tsx
// -----------------------------------------------------------------------------
// Casca ÚNICA de criação/edição de Sanitário — `san-screen-create`/
// `san-screen-edit`, `san-action-save` (F-062, TASK-SAN-FE-03, contrato-tela-
// lane-c-sanitario-frontend.md §6.3). Rotas `/operacional/sanitario/novo` e
// `/operacional/sanitario/:uuid/editar` (registradas só na TASK-SAN-FE-33 —
// esta Tarefa só entrega o componente).
//
// Esqueleto mirror `Weaning/CreateOrUpdateWeaning.tsx` +
// `Reproducao/LoteReproducao/CreateOrUpdateLoteReproducao.tsx` (guard de
// uuid malformado, `useCustomFormQueryById` + `fillForm` nomeada com guarda
// `!isEmpty(dirtyFields) || resetForce`, `FormContainer` com `footer` opt-in
// `Cancelar` + `ButtonSaveAndNext`, `useUnsavedChangesGuard` +
// `DeleteConfirmDialog tone="warning"`).
//
// ESCOPO ORIGINAL (TASK-SAN-FE-03): casca + cabeçalho
// (`SanitarioHeaderFields.tsx`) + cascata lote→animais. `time_control` já
// está funcional (`Switch` ligado via `useController`/`Controller` dentro
// de `SanitarioHeaderFields`) — reservou o espaço, não o bloco condicional
// em si.
//
// TASK-SAN-FE-04: montou `SanitaryItemsSection`/`SanitaryItemRow` de
// verdade (contrato-tela §6.4) no lugar do placeholder reservado pela
// Tarefa 03.
//
// TASK-SAN-FE-05 (esta atualização, contrato-tela §6.5/§6.6): monta
// `SanitaryLaborSection`/`SanitaryLaborRow` de verdade (bloco condicional,
// visível só quando `time_control=true`) no lugar do comentário reservado
// pela Tarefa 03, e centraliza TODO o form↔payload (cabeçalho + itens + mão
// de obra, hidratação de edição E submit) em `sanitario-form-mapper.ts`
// (`toFormValues`/`toPayload`) — único ponto de verdade agora, substitui o
// `mapItemFormValueToPayload` local e os arrays `items:[]`/`labor:[]` fixos
// do `fillForm` anterior. Ver cabeçalho de `sanitario-form-mapper.ts` para
// o achado de arquitetura (leitura direta do worktree irmão da API) que
// mostra por que itens reconciliam por `uuid` explícito e mão de obra
// sempre por full-replace no `update()`, e para as limitações honestas de
// re-hidratação (armazém/medida/centro de custo do item, medida da mão de
// obra) impostas pelo shape real de `SanitaryResource`.
//
// `code`/`responsible_name` NUNCA são campos do `useForm` (Regras 1/2 da
// Tarefa 03) — `responsible_name` é sempre o usuário logado em criação e o
// `user.name` do detalhe em edição — nunca reenviado no payload.
//
// CORREÇÃO (97-Esteiras/002 execução 002 lane C, correção reportada pelo
// dono ao vivo): `code` em modo CRIAÇÃO agora busca a prévia real via
// `GET /sanitaries/next-code` (`getSanitaryNextCode`, `nextCodeQuery`
// abaixo) — o texto estático `formText.hints.codeGeneratedOnSave` só
// permanece como FALLBACK enquanto a query carrega ou falha (SEM MOCK: o
// código ainda é gerado atomicamente no servidor no submit, isto é só a
// prévia de exibição, mirror EXATO `getServiceOrderNextCode`/
// `getBreedingSeasonNextCode`). `next-code` NUNCA é chamado em edição —
// `code` vem do próprio detalhe carregado (`sanitarioQuery.data?.code`).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import { sanitarySchemaResolver } from '@/validations/schemas/Sanitaries/sanitaries-schema';

import {
  createSanitary,
  getSanitaryByUuid,
  getSanitaryNextCode,
  updateSanitary,
} from '@/services/v2/Sanitaries/sanitaries-service';

import type { SanitaryDetail, SanitaryFormValues } from '@/@types/v2/Sanitaries';

import { toFormValues, toPayload } from './sanitario-form-mapper';
import { SanitarioHeaderFields } from './SanitarioHeaderFields';
import { SanitaryItemsSection } from './SanitaryItemsSection';
import { SanitaryLaborSection } from './SanitaryLaborSection';

const SANITARIO_LIST_ROUTE = '/operacional/sanitario';

const defaultValues: SanitaryFormValues = {
  date: null,
  batch_uuid: null,
  time_control: false,
  animal_uuids: [],
  items: [],
  labor: [],
};

export default function CreateOrUpdateSanitario() {
  const { sanitarioUuid: uuid } = useParams<{ sanitarioUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();

  const text = languageGB.sanitary.sanitary;
  const formText = text.form;

  // Guard de navegação: `uuid` presente mas NÃO é um GUID válido (URL
  // adulterada) — redireciona para a listagem ANTES de renderizar o form
  // (mirror `CreateOrUpdateLoteReproducao.tsx`/`CreateOrUpdateEstacaoDeMonta.tsx`).
  const hasMalformedRouteParam = uuid !== undefined && !isValidGuid(uuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(SANITARIO_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(uuid);
  const canSave = isEditing ? can('sanitary_edit') : can('sanitary_create');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { dirtyFields },
  } = useForm<SanitaryFormValues>({
    mode: 'onChange',
    resolver: sanitarySchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues,
  });

  // ---- Guarda de saída sem salvar ----------------------------------------
  // `isEmpty(dirtyFields)` SEM negação — `src/utils/isEmpty.ts` tem nome
  // invertido (retorna `true` quando o objeto TEM alguma chave própria, ou
  // seja, já significa "há campo sujo"). Para ESTE uso ("há alteração não
  // salva?"), o valor correto É `isEmpty(dirtyFields)` direto. A negação
  // `!isEmpty(dirtyFields)` (copiada em outras telas-irmãs para este MESMO
  // hook) produziria o oposto do desejado aqui — mostraria o aviso de saída
  // quando NADA mudou e o omitiria quando HÁ alteração real, o que
  // contradiria o cenário manual desta Tarefa ("confirmar que sair do form
  // com alterações não salvas dispara o aviso"). Divergência deliberada e
  // documentada; não é correção retroativa de outras telas (fora de escopo).
  const hasUnsavedChanges = isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  // ---- "Responsável" — SEMPRE read-only (Regra 2 da Tarefa). Criação:
  // usuário autenticado local. Edição: `user.name` do detalhe carregado,
  // semeado por `fillForm`. -------------------------------------------------
  const [responsibleName, setResponsibleName] = useState<string>('—');

  useEffect(() => {
    if (!isEditing) {
      setResponsibleName(authUser?.username ?? '—');
    }
  }, [isEditing, authUser?.username]);

  // ---- Guarda EXPLÍCITA `!isEmpty(dirtyFields) || resetForce` — mirror
  // EXATO `CreateOrUpdateBudget.tsx`/`CreateOrUpdateLoteReproducao.tsx`.
  // `useCustomFormQueryById` sempre chama com `resetForce=true`, então o
  // termo `dirtyFields` só importa para uma futura chamada manual (nenhuma
  // existe nesta Tarefa). --------------------------------------------------
  function fillForm(data: SanitaryDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      // TASK-SAN-FE-05 — hidratação REAL de itens/mão de obra via
      // `sanitario-form-mapper.ts` (`toFormValues`), fechando o round-trip
      // de edição que a Tarefa 03 deixou reservado (arrays vazios). Ver
      // cabeçalho de `sanitario-form-mapper.ts` para as limitações
      // honestas de re-hidratação (armazém/medida/centro de custo do item,
      // medida da mão de obra) impostas pelo shape real de
      // `SanitaryResource`/`SanitaryLaborItemData` — não são mock, são o
      // que o servidor de fato devolve.
      reset(toFormValues(data, languageGB));
      setResponsibleName(data.user?.name ?? '—');
    }
  }

  const sanitarioQuery = useCustomFormQueryById<SanitaryDetail>({
    registrationId: isEditing ? (uuid ?? '') : '',
    queryKey: queryKey.sanitary.sanitary,
    asyncFunction: getSanitaryByUuid,
    fillForm,
  });

  // `useCustomFormQueryById` tipa o retorno como `Response<TData>` (sem
  // `isError`/`isLoading`) embora o objeto real em runtime seja o
  // `UseQueryResult` do TanStack Query — mesma divergência já contornada
  // com `as any` em outros módulos (`CreateOrUpdateBudget.tsx`/
  // `CreateOrUpdateWeaning.tsx`).
  const sanitarioQueryIsError = (sanitarioQuery as any).isError as boolean;

  // 404 (outro tenant)/erro de leitura em modo editar → toast + volta à
  // listagem (mirror `CreateOrUpdateWeaning.tsx`).
  useEffect(() => {
    if (isEditing && sanitarioQueryIsError) {
      toaster.error({
        title: text.singularLabel,
        description: text.list.error.message,
        duration: 7000,
      });
      navigate(SANITARIO_LIST_ROUTE);
    }
  }, [isEditing, sanitarioQueryIsError]);

  const isLoading = isEditing && checkLoadingStatus([sanitarioQuery as any]);

  // ---- Código sugerido (SÓ em modo criação, `GET /sanitaries/next-code`) --
  // `next-code` NUNCA é chamado em edição (mirror `EstacaoDeMonta`/
  // `LoteReproducao`/`ServiceOrder`) — `code` vem do próprio detalhe
  // carregado nesse caso.
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.sanitary.sanitary, 'next-code'],
    queryFn: getSanitaryNextCode,
    enabled: !isEditing,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const codeDisplay = isEditing
    ? (sanitarioQuery.data?.code ?? '')
    : (nextCodeQuery.data?.data?.next_code ?? formText.hints.codeGeneratedOnSave);

  async function tryPersistSanitario(data: SanitaryFormValues) {
    // TASK-SAN-FE-05 — payload completo (cabeçalho + itens + mão de obra)
    // agora vem de `sanitario-form-mapper.ts` (`toPayload`), única fonte de
    // verdade do form↔payload (Regras 2/3/4 da Tarefa: sem `amount`,
    // `labor` omitido quando `time_control=false`, itens reconciliados por
    // `uuid` explícito quando a linha já existe — achado confirmado por
    // leitura direta de `SanitaryRequest`/`UpdateSanitaryAction` no
    // worktree irmão da API). O schema Yup (`items: min(1)`) já impede este
    // payload de ser enviado sem nenhum item — a Tarefa 28
    // (`SanitaryItemsSection`) garante a linha mínima.
    const payload = toPayload(data);

    if (isEditing && uuid) {
      return updateSanitary(uuid, payload);
    }
    return createSanitary(payload);
  }

  const sanitarioMutation = useRequest<SanitaryDetail>({
    asyncFunction: tryPersistSanitario,
    entityName: text.singularLabel,
    queryKey: queryKey.sanitary.sanitaries,
    queryKey2: queryKey.sanitary.sanitary,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(SANITARIO_LIST_ROUTE);
    },
  });

  // Guarda `isEditing && !isEmpty(dirtyFields)` (mirror EXATO
  // `CreateOrUpdateLoteReproducao.tsx`) — "nada mudou" (`!isEmpty` aqui
  // significa "dirtyFields vazio", sentido OPOSTO ao de `hasUnsavedChanges`
  // acima, que é o motivo da divergência documentada lá em cima).
  async function onSubmit(data: SanitaryFormValues) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await sanitarioMutation.mutateAsync(data);
  }

  const isSubmitting = sanitarioMutation.isPending;

  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <>
      <FormContainer
        title={isEditing ? formText.title.edit : formText.title.create}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="outline"
              type="button"
              onClick={() => guardedNavigate(-1)}
              disabled={isSubmitting}
            />
            {canSave && (
              <ButtonSaveAndNext
                create={!isEditing}
                dirtyFields={dirtyFields}
                type="button"
                onClick={handleSubmit(onSubmit)}
                languageGB={languageGB}
                loading={isSubmitting}
                disabled={isSubmitting || !!isLoading}
              />
            )}
          </>
        }
      >
        <Form id="sanitario-form" noPadding onSubmit={handleSubmit(onSubmit)}>
          <SanitarioHeaderFields
            control={control}
            watch={watch}
            setValue={setValue}
            languageGB={languageGB}
            canSave={canSave}
            isEditing={!!isEditing}
            isLoading={!!isLoading}
            codeDisplay={codeDisplay}
            responsibleName={responsibleName}
          />

          <SanitaryItemsSection
            control={control}
            languageGB={languageGB}
            animalsCount={watch('animal_uuids')?.length ?? 0}
            isDisabled={!canSave || !!isLoading}
          />

          <SanitaryLaborSection
            control={control}
            watch={watch}
            languageGB={languageGB}
            isDisabled={!canSave || !!isLoading}
          />
        </Form>
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={formText.unsavedChangesDialog.title}
        description={formText.unsavedChangesDialog.description}
        confirmButtonText={formText.unsavedChangesDialog.confirm}
        cancelButtonText={formText.unsavedChangesDialog.cancel}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
