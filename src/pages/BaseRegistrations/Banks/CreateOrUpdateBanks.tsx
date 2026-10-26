// src/pages/BaseRegistrations/Banks/CreateOrUpdateBanks.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de BANCO (mesmo arquivo para os dois casos,
// TASK-BANK-FE-02). Rotas: /cadastros-base/bancos/novo (criar) e
// /cadastros-base/bancos/:bankId (editar, GUID) — ambas registradas em
// src/router/index.tsx, guardadas por `banks_view`.
//
// Estrutura mecânica idêntica a CadastrosBase/GruposProduto/
// CreateOrUpdateGrupoProduto.tsx, simplificada ainda mais: 2 campos de TEXTO
// só (`code`+`name`), SEM NENHUM Select (Bank não tem FK nem booleano de
// status).
//
// ACHADO/DECISÃO DE IMPLEMENTAÇÃO — payload SEMPRE completo (TASK-BANK-FE-02,
// seção "Guard vs. Payload"): `BankRequest::rules()` exige `code` E `name`
// como `required` em AMBOS os verbos (POST e PUT) — confirmado por leitura
// direta de `api_root/app/Http/Requests/Api/V1/BankRequest.php`. Por isso
// `tryPersistBank` monta o payload INTEIRO em ambos os modos (create/update)
// — nunca um delta parcial de `dirtyFields`.
//
// GUARD EXPLÍCITO (instrução do dono, ver ficha) — este arquivo usa SEMPRE a
// forma EXPLÍCITA `Object.keys(dirtyFields).length === 0`, NUNCA
// `isEmpty()`/`!isEmpty()` de `src/utils/isEmpty.ts`: o nome dessa utilidade
// é ENGANOSO (retorna `true` quando o objeto TEM chaves — ou seja, quando
// NÃO está vazio — e `false` quando `{}`), confusão já catalogada 2x no
// histórico do projeto (TASK-LR-FE-02/TASK-PA-16). A forma explícita abaixo é
// literal e sem ambiguidade: `length === 0` = SEM mudança (objeto vazio);
// `length > 0` = HÁ mudança.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { bankSchemaResolver } from '@/validations/schemas/BaseRegistrations/bank-schema';

import { createBank, getBankByUuid, updateBank } from '@/services/v2/Banks/bank-service';

import type { BankDetail, BankForm as BankFormType, BankPayload } from '@/@types/v2/Banks';

export default function CreateOrUpdateBanks() {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:bankId` — é uma rota irmã distinta registrada em router/index.tsx).
  const isEditing = isValidGuid(bankId);

  // Guard de navegação: um `bankId` presente mas que NÃO é um GUID válido
  // (ex.: URL adulterada manualmente) não deve chegar ao hook de query nem
  // renderizar um form "fantasma" — redireciona para a listagem, mesmo
  // racional do guard de CreateOrUpdateGrupoProduto.tsx.
  useEffect(() => {
    if (bankId && !isValidGuid(bankId)) {
      navigate('/cadastros-base/bancos', { replace: true });
    }
  }, [bankId, navigate]);

  const text = languageGB.baseRegistrations.bank;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<BankFormType>({
    mode: 'onChange',
    resolver: bankSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      name: '',
    },
  });

  // Lei 2 (fillForm nomeada) — guarda EXPLÍCITA, nunca `isEmpty()`.
  function fillForm(data: BankDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        code: data.code,
        name: data.name,
      });
    }
  }

  const bankQuery = useCustomFormQueryByGuid<BankDetail>({
    registrationId: isEditing ? bankId : undefined,
    queryKey: queryKey.baseRegistrations.bank,
    asyncFunction: getBankByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([bankQuery as any]);

  // Sem flags de autorização por item no `BankResource` — permissão GLOBAL
  // basta (mesmo padrão de GruposProduto/Especies CreateOrUpdate*.tsx).
  const canSave = isEditing ? can('banks_edit') : can('banks_create');

  const bankMutation = useRequest({
    asyncFunction: tryPersistBank,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.banks,
    queryKey2: queryKey.baseRegistrations.bank,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Ver nota de cabeçalho: payload SEMPRE completo (create e update) —
  // `BankRequest::rules()` exige `code`/`name` em ambos os verbos, sem
  // suporte a PATCH parcial (full-resource-replace).
  async function tryPersistBank(data: BankFormType) {
    const payload: BankPayload = {
      code: data.code.trim(),
      name: data.name.trim(),
    };

    try {
      return isEditing && bankId ? await updateBank(bankId, payload) : await createBank(payload);
    } catch (error) {
      // 422 de `code` duplicado (Rule::unique('banks','code')) mapeado para o
      // campo — mesmo padrão local já usado em Safra/CreateOrUpdateSafra.tsx
      // (useRequest.tsx não tem onError customizável; setError aqui é LOCAL,
      // por cima do try/catch, sem tocar infraestrutura compartilhada). O
      // `throw` preserva o toast genérico de useRequest (soma, não substitui).
      // Mensagem FIXA de i18n (pedida pelo dono) — não a string crua vinda do
      // backend: a condição abaixo só CONFIRMA que o erro é de fato sobre
      // `code`, o texto exibido é o nosso.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors?.code?.[0]) {
          setError('code', { type: 'server', message: text.form.validation.codeDuplicate });
        }
      }
      throw error;
    }
  }

  // Guard do submit — forma EXPLÍCITA, NUNCA `isEmpty()`: em edição, só
  // dispara a chamada de update quando HÁ mudança real
  // (`Object.keys(dirtyFields).length === 0` = nada mudou → só volta, sem
  // chamada de rede). Em criação, sempre dispara.
  async function onSubmit(data: BankFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }

    await bankMutation.mutateAsync(data);
  }

  const isSubmitting = bankMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      showDivider
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
            label={text.form.fields.code}
            placeholder={text.form.placeholders.code}
            maxLength={4}
            {...register('code')}
            error={errors.code?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.name}
            placeholder={text.form.placeholders.name}
            maxLength={100}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
