// src/pages/CadastrosBase/Usuarios/CreateOrUpdateUsuario.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de USUÁRIO — Cadastros Base. Rotas:
// /cadastros-base/usuarios/novo e /cadastros-base/usuarios/:userId (GUID),
// guardadas por `users_view` (rota) + `users_create`/`users_edit` (salvar).
//
// ⚠️ REVERSÃO E2E (2026-08-03, User-contrato.md §18, `GAP-BE-470`
// `[AVALIADO]`) — TASK-FE-900/903/904. O dev reprovou no E2E o desenho em que
// `POST/PUT /users` só REFERENCIAVA uma Person já existente (picker
// `SelectAsyncPaginate` de `person_uuid`) — no legado o cadastro de Usuário
// SEMPRE foi um formulário PLANO (nif/name/phone/city/address digitados
// direto), com a Pessoa criada/atualizada em cascata (upsert por NIF).
// Decisão verbatim do dev: "Restaurar o legado literalmente". Este arquivo
// reverte para esse modelo — CREATE e EDIT com os MESMOS campos de Pessoa
// inline, a tela NUNCA envia `person_uuid` (o backend resolve por `nif`,
// `PersonRepositoryInterface::upsertByNif()`, mesmo mecanismo já usado por
// Partner/People — efeito colateral aceito no `GAP-BE-470`: editar um
// Usuário com o NIF de OUTRA pessoa sobrescreve os dados dela).
//
// Molde MECÂNICO: CreateOrUpdateFuncao.tsx (isEditing por GUID via
// useCustomFormQueryByGuid, mutação via `useRequest`, 422 mapeado por campo
// via `setError`) + CreateOrUpdateMarcador.tsx (upload de imagem multipart
// inline, `onRemove`/`removeIcon`, estado dedicado fora do RHF) +
// CreateOrUpdateCliente.tsx (mirror LITERAL de `handleNifBlur`, TASK-FE-903).
// NÃO copia CreateOrUpdatePessoa.tsx — aquele é o wizard antigo fundido
// Pessoa+Usuário, fora de escopo (mandato explícito do task-packet, a
// tentação é grande aqui porque Pessoas também é wizard de pessoa).
//
// ⚠️ AJUSTE — 2º E2E do dev (2026-08-03, TASK-FE-912), 3 itens já decididos:
//
// A) UM único campo de e-mail, rotulado "Email", no bloco Pessoa (junto com
//    CPF/Nome/Telefone). O bloco "Conta" perdeu o Input de e-mail de login —
//    o `email` do RHF agora vive fisicamente no bloco Pessoa e o MESMO valor
//    alimenta os 2 destinos do payload (`email`/`contact_email`), mirror
//    literal do legado (1 único `<input name="email">`). `contact_email`
//    SAIU do `UserForm` como campo distinto — ver `tryPersistUser`. D-02
//    continua válida no MODELO DE DADOS (2 colunas seguem desacopladas no
//    banco); só a TELA passou a oferecer 1 input em vez de 2.
//
// B) `nif` ganhou `readOnly` na EDIÇÃO (mirror do legado — os 2 campos,
//    CPF/CNPJ e e-mail, aparecem travados na tela legada). Só na edição —
//    na criação o CPF continua digitável (é ele que dispara o prefill).
//
// C) `number`/`district` REMOVIDOS da tela (sem equivalente no legado, que
//    usa 1 único campo de endereço livre) E DO PAYLOAD nos 2 verbos — as
//    colunas `people.number`/`people.district` existem e o módulo Pessoas as
//    usa em produção; como esta tela é full-resource-replace, enviá-las
//    vazias apagaria em silêncio quem já as tem. Mesma família de defeito já
//    corrigida nesta feature (`is_purchasing_assistant`/`contact_email`/
//    `nickname`) — ver `@types/v2/Users/index.d.ts` e `user-service.ts`
//    (`buildUserFormData` nunca mais anexa as 2 chaves).
//
// ⚠️ CHECKLIST OBRIGATÓRIO:
//
// 1) Guard `onSubmit`/`fillUserForm` — forma EXPLÍCITA
//    `Object.keys(dirtyFields).length === 0`, NUNCA `isEmpty`/`!isEmpty` do
//    utilitário mal-nomeado (`@/utils/isEmpty` retorna `true` quando HÁ
//    chaves — armadilha já registrada, 6 recorrências reais em outras
//    telas). Este arquivo NÃO importa `@/utils/isEmpty`.
//
// 2) Bloco "Pessoa" — `nif`/`name`/`email`/`phone`/`city_uuid`/`address`,
//    CREATE e EDIT com os MESMOS campos (sem picker, sem snapshot readonly).
//    `nickname` viaja "invisível" (sem `Input` próprio — o legado nunca
//    perguntou apelido), hidratado do `GET` (`data.person.nickname`,
//    TASK-BE-909) e/ou via `handleNifBlur` (item 7), sempre reenviado no
//    payload (TASK-FE-909).
//
// 3) `password`/`password_confirmation`: só existem no CREATE — no EDIT o
//    bloco inteiro é OMITIDO (não desabilitado), com aviso textual no lugar
//    (mirror EXATO de `StepUsuario.tsx` da Pessoas, `u.editPasswordNotice`).
//
// 4) `email` (ÚNICO campo, item A acima): `readOnly` no EDIT, COM a exceção
//    restaurada do legado (§18.5.2) — `Gestor_Plataf` PODE editar o e-mail de
//    qualquer conta (`hasRole('Gestor_Plataf')`, mesmo padrão documentado de
//    exceção pontual por papel em `usePermissions.ts`).
//
// 5) `photo`: remoção RELIGADA (TASK-FE-904, `GAP-BE-471` resolvido) — o
//    backend voltou a suportar `remove_photo` (`UpdateUserAction` dá
//    precedência sobre um `photo` novo se os dois vierem, mas a UI garante
//    mutuamente exclusivo: selecionar um arquivo novo limpa `removePhoto`,
//    clicar "Remover" limpa `photoFile`). Estado dedicado
//    `photoFile`/`removePhoto`/`currentPhotoUrl` (mirror `iconFile`/
//    `removeIcon`/`currentIconUrl` de `CreateOrUpdateMarcador.tsx`).
//
// 6) Payload sempre FULL-RESOURCE-REPLACE — EXCETO `password` (só enviado se
//    preenchido no create; no update é omitido quando vazio) e EXCETO
//    `number`/`district` (item C acima, NUNCA enviados, em NENHUM verbo).
//    `nickname` continua enviado INCONDICIONALMENTE (TASK-FE-909) — o
//    backend corrigiu `UserDetailResource.person` para devolver o campo no
//    `GET` (TASK-BE-909), então o `GET` sempre traz o valor real e o
//    `fillUserForm` hidrata o form com ele. `contact_email` também é sempre
//    enviado, mas agora como espelho LITERAL do `email` único (item A) —
//    nunca como um 2º valor de form independente.
//
// 7) Prefill por NIF (`handleNifBlur`, TASK-FE-903) — mirror QUASE LITERAL de
//    `CreateOrUpdateCliente.tsx::handleNifBlur`: dispara no `onBlur` do campo
//    `nif`, guard "só dispara se o NIF mudou de fato" vs. o valor carregado
//    da API (`originalNifDigitsRef`, comparação por dígitos), ativo em CREATE
//    (na EDIÇÃO o campo é `readOnly`, item B, então o valor nunca muda e o
//    guard já impede refetch), 404 NÃO limpa nada já digitado (pessoa nova),
//    200 preenche `name`/`nickname`/`email`/`phone`/`city_uuid`/`address`
//    via `setValue({shouldDirty:true})`. Reusa `getPersonByNif` de
//    `person-service.ts` — ZERO serviço novo.
//
// 8) Vínculos (`role_uuids`/`farm_uuids`/`boss_uuids`) — mesmo
//    `CheckboxListField`. Na EDIÇÃO, os pickers de Perfis e Fazendas passam
//    `include_user_uuid={userId}` (TASK-BE-808) — sem isso, um vínculo
//    cross-tenant já atribuído ao usuário fica invisível no picker e o
//    operador NÃO CONSEGUE desmarcá-lo (achado E2E, usuária Alexsandra).
//    `boss_uuids` usa outro parâmetro, de outro endpoint (`exclude_uuid` em
//    `GET /users/boss-options`, TASK-FE-918/TASK-BE-910) — NÃO confundir com
//    `include_user_uuid` acima: aqui o efeito é o OPOSTO (excluir o próprio
//    usuário da lista de chefes candidatos, mirror do legado
//    `where('users.id','!=',$id)`, antes feito no cliente e agora resolvido
//    no backend).
// -----------------------------------------------------------------------------

import { useRef, useState } from 'react';

import { Box, Separator, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { ImageUpload } from '@/components/Form/ImageUpload';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidCpfCnpj, normalizeDocument } from '@/utils/cpfCnpj';
import { formatDocument } from '@/utils/format-document';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { userSchemaResolver } from '@/validations/schemas/Users/user-schema';

import { listCityOptions } from '@/services/v2/Cities/city-service';
import { listFarmsForUser } from '@/services/v2/Farms/farm-service';
import { getPersonByNif } from '@/services/v2/People/person-service';
import { listRoles } from '@/services/v2/Roles/role-service';
import { createUser, listUserBossOptions, updateUser } from '@/services/v2/Users/user-service';

import type { CityListItem } from '@/@types/v2/Cities';
import type { CreateUserRequest, UpdateUserRequest, UserDetail, UserForm } from '@/@types/v2/Users';

import { useUserForm } from './useUsuario';

export default function CreateOrUpdateUsuario() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can, hasRole } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(userId);

  const text = languageGB.users.user;

  const canSave = isEditing ? can('users_edit') : can('users_create');

  // Checklist item 4 — exceção restaurada do legado: `Gestor_Plataf` pode
  // editar o e-mail de LOGIN de qualquer conta na edição.
  const canEditLoginEmail = !isEditing || hasRole('Gestor_Plataf');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<UserForm>({
    mode: 'onChange',
    resolver: userSchemaResolver(languageGB, isEditing),
    reValidateMode: 'onChange',
    defaultValues: {
      nif: '',
      name: '',
      email: '',
      phone: '',
      city_uuid: null,
      address: '',
      nickname: undefined,
      password: '',
      password_confirmation: '',
      is_active: true,
      is_purchasing_assistant: false,
      role_uuids: [],
      farm_uuids: [],
      boss_uuids: [],
    },
  });

  // ---- Estado da foto (NÃO é campo RHF — checklist item 5, upload
  // multipart inline). `photoFile` = arquivo novo selecionado nesta sessão;
  // `removePhoto` = flag local (só se aplica no update, TASK-FE-904); só um
  // dos dois pode estar "ativo" por vez (mutuamente exclusivos, ver
  // handlers); `currentPhotoUrl` = espelho de `data.photo` (edição), só para
  // preview; `photoError` = 422 de `photo` interceptado ANTES do loop
  // genérico de `setError` (mesma técnica de `iconError` em
  // `CreateOrUpdateMarcador.tsx` — `photo` não é campo RHF).
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>(undefined);

  function handlePhotoSelected(file: File | null) {
    setPhotoFile(file);
    setRemovePhoto(false);
    setPhotoError(undefined);
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setRemovePhoto(true);
    setCurrentPhotoUrl(null);
  }

  // Checklist item 7 — baseline do NIF carregado da API na abertura do
  // formulário, em DÍGITOS CRUS. Guard 1 de `handleNifBlur`: o prefill só
  // pode disparar quando o documento REALMENTE MUDOU em relação a este
  // valor — comparação por dígitos (não pela string mascarada).
  const originalNifDigitsRef = useRef('');

  // Checklist item 2/6 — guard EXPLÍCITO `dirtyFields`, nunca
  // `isEmpty`/`!isEmpty`. `farm_uuids`/`boss_uuids`/`role_uuids` já vêm com
  // uuid real do `UserDetailResource` (`farms`/`bosses`/`roles`), preenchidos
  // direto no reset.
  function fillUserForm(data: UserDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (hasNoFormChanges || resetForce) {
      originalNifDigitsRef.current = normalizeDocument(data.person?.nif ?? '');
      reset({
        nif: formatDocument(data.person?.nif ?? ''),
        name: data.person?.name ?? data.name,
        // TASK-FE-912 — campo ÚNICO (item A do 2º E2E): hidrata com o e-mail
        // de LOGIN (`data.email`, sempre presente, obrigatório) — é o valor
        // que volta a ser reenviado para os 2 destinos (`email`/
        // `contact_email`) no `tryPersistUser`.
        email: data.email,
        phone: data.person?.phone ?? '',
        city_uuid: data.person?.city
          ? {
              value: data.person.city.uuid,
              label: `${data.person.city.name}${data.person.city.state ? ` — ${data.person.city.state.uf}` : ''}`,
            }
          : null,
        address: data.person?.address ?? '',
        nickname: data.person?.nickname ?? undefined,
        password: '',
        password_confirmation: '',
        is_active: !!data.is_active,
        // TASK-BE-802 — preserva o valor real no edit em vez do default fixo
        // `false` (defeito original do GAP-FE-202).
        is_purchasing_assistant: !!data.is_purchasing_assistant,
        role_uuids: (data.roles ?? []).map((role) => role.uuid),
        farm_uuids: (data.farms ?? []).map((farm) => farm.uuid),
        boss_uuids: (data.bosses ?? []).map((boss) => boss.uuid),
      });
    }

    // Foto — só sincroniza o preview "atual" quando o usuário ainda não
    // escolheu localmente um arquivo novo nem marcou remoção (evita clobar
    // uma seleção em andamento).
    if (!photoFile && !removePhoto) {
      setCurrentPhotoUrl(data.photo_url ?? null);
    }
  }

  const userQuery = useUserForm({
    registrationId: isEditing ? userId : undefined,
    fillForm: fillUserForm,
  });

  const isLoading = isEditing && checkLoadingStatus([userQuery as any]);

  // Checklist item 7 — prefill por NIF, mirror QUASE LITERAL de
  // `CreateOrUpdateCliente.tsx::handleNifBlur`.
  async function handleNifBlur() {
    const current = watch('nif');
    if (!isValidCpfCnpj(current)) return;

    const currentDigits = normalizeDocument(current);
    if (isEditing && currentDigits === originalNifDigitsRef.current) return;

    const found = await getPersonByNif(currentDigits).catch(() => null);
    if (!found) return; // 404 — pessoa nova, não altera nada já digitado

    setValue('name', found.name, { shouldDirty: true, shouldValidate: true });
    setValue('nickname', found.nickname, { shouldDirty: true, shouldValidate: true });
    // TASK-FE-912 — campo ÚNICO: prefill continua vindo do e-mail da Person
    // encontrada, mesma posição que `contact_email` ocupava antes da fusão.
    setValue('email', found.email ?? '', { shouldDirty: true, shouldValidate: true });
    setValue('phone', found.phone ?? '', { shouldDirty: true, shouldValidate: true });
    setValue('address', found.address ?? '', { shouldDirty: true, shouldValidate: true });
    setValue(
      'city_uuid',
      found.city
        ? {
            value: found.city.uuid,
            label: `${found.city.name}${found.city.state ? ` — ${found.city.state.uf}` : ''}`,
          }
        : null,
      { shouldDirty: true, shouldValidate: true }
    );

    toaster.create({
      type: 'warning',
      title: text.singularLabel,
      description: isEditing ? text.form.nifFoundWarningEditing : text.form.nifFoundWarning,
    });
  }

  // ---- Bloco Vínculos — mirror LITERAL de `StepUsuario.tsx` (mesmos 3
  // services, mesmas queryKeys, mesmo `CheckboxListField`). Checklist item 8
  // — `include_user_uuid` nos pickers de Perfis/Fazendas só na EDIÇÃO.
  const [farmSearch, setFarmSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [bossSearch, setBossSearch] = useState('');

  const includeUserUuid = isEditing ? userId : undefined;

  const { data: farms, isLoading: farmsLoading } = useQuery({
    queryKey: ['usuarios-farms-options', includeUserUuid],
    queryFn: () => listFarmsForUser(includeUserUuid),
  });
  const farmItems = (farms ?? [])
    .filter((farm) => farm.description.toLowerCase().includes(farmSearch.toLowerCase()))
    .map((farm) => ({ value: farm.uuid, label: farm.description }));

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['usuarios-role-options', roleSearch, includeUserUuid],
    queryFn: () =>
      listRoles({
        page: 1,
        per_page: 50,
        search: roleSearch || undefined,
        include_user_uuid: includeUserUuid,
      }),
  });
  const roleItems = (rolesData?.data.items ?? []).map((role) => ({
    value: role.uuid,
    label: role.name,
  }));

  // TASK-FE-918 (fechamento do laço, defeito nº1 do 2º E2E) — fonte trocada
  // de `listUserOptions` (`GET /users` administrativo, 17 candidatos, sem
  // filtro de elegibilidade) para `listUserBossOptions` (`GET
  // /users/boss-options`, TASK-BE-910), que já aplica no backend a MESMA
  // regra de elegibilidade da escrita (farm do tenant E autorizador de
  // requisição) — leitura e escrita voltam a concordar (legado: 3
  // encarregados, não 17). O endpoint não pagina nem aceita `search`
  // (`UserController::bossOptions` só valida `exclude_uuid`), então a busca
  // continua client-side (mesmo padrão de `farmItems` acima). `excludeBossUuid`
  // é um parâmetro DISTINTO de `includeUserUuid` acima (checklist item 8 —
  // outro endpoint, outra semântica: aqui exclui o próprio usuário sendo
  // editado da lista de chefes candidatos, mirror do legado
  // `where('users.id','!=',$id)`, agora resolvido no backend).
  const excludeBossUuid = isEditing ? userId : undefined;

  const { data: bossOptions, isLoading: usersLoading } = useQuery({
    queryKey: ['usuarios-boss-options', excludeBossUuid],
    queryFn: () => listUserBossOptions(excludeBossUuid),
    retry: false,
  });
  // Rótulo SÓ o nome (mirror do legado) — o endpoint novo nem devolve
  // e-mail (`UserBossOptionResource`: só `uuid`+`name`).
  const bossItems = (bossOptions ?? [])
    .filter((user) => user.name.toLowerCase().includes(bossSearch.toLowerCase()))
    .map((user) => ({
      value: user.uuid,
      label: user.name,
    }));

  const userMutation = useRequest({
    asyncFunction: tryPersistUser,
    entityName: text.singularLabel,
    queryKey: queryKey.users.usersList,
    queryKey2: queryKey.users.user,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistUser(data: UserForm) {
    try {
      // Checklist item 6 — payload sempre FULL-RESOURCE (TASK-FE-909:
      // `nickname` continua incondicional, o backend devolve no `GET` —
      // `UpdateUserRequest.password` continua sendo a única exceção real,
      // condicionada a estar preenchido). TASK-FE-912 (2º E2E, item A) —
      // `contact_email` deixou de ser um valor de form independente: espelha
      // SEMPRE o mesmo `data.email` (campo único da tela). TASK-FE-912 (item
      // C) — `number`/`district` NÃO existem mais nestes payloads (ver
      // `@types/v2/Users/index.d.ts`), nunca enviados em nenhum verbo.
      const emailTrimmed = data.email.trim();
      if (isEditing && userId) {
        const payload: UpdateUserRequest = {
          nif: normalizeDocument(data.nif),
          name: data.name.trim(),
          contact_email: emailTrimmed,
          phone: data.phone || undefined,
          city_uuid: data.city_uuid!.value,
          address: data.address.trim(),
          nickname: data.nickname || undefined,
          email: emailTrimmed,
          password: data.password ? data.password : undefined,
          is_active: !!data.is_active,
          is_purchasing_assistant: !!data.is_purchasing_assistant,
          photo: photoFile,
          remove_photo: removePhoto || undefined,
          role_uuids: data.role_uuids,
          farm_uuids: data.farm_uuids,
          boss_uuids: data.boss_uuids,
        };
        return await updateUser(userId, payload);
      }

      // Create — bloco Pessoa sempre enviado por completo (upsert por NIF,
      // §18.2 — a tela NUNCA envia `person_uuid`).
      const payload: CreateUserRequest = {
        nif: normalizeDocument(data.nif),
        name: data.name.trim(),
        contact_email: emailTrimmed,
        phone: data.phone || undefined,
        city_uuid: data.city_uuid!.value,
        address: data.address.trim(),
        nickname: data.nickname || undefined,
        email: emailTrimmed,
        password: data.password!,
        is_active: !!data.is_active,
        is_purchasing_assistant: !!data.is_purchasing_assistant,
        photo: photoFile,
        role_uuids: data.role_uuids,
        farm_uuids: data.farm_uuids,
        boss_uuids: data.boss_uuids,
      };
      return await createUser(payload);
    } catch (error) {
      // 422 do backend mapeado por campo — mesma técnica de
      // `CreateOrUpdateFuncao.tsx`/`CreateOrUpdateMarcador.tsx`.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        // `photo` NÃO é campo RHF (checklist item 5) — intercepta ANTES do
        // loop genérico, roteado para `photoError`.
        if (fieldErrors?.photo?.[0]) {
          setPhotoError(fieldErrors.photo[0]);
        }
        // `city_uuid` (RHF) recebe o erro de `city_uuid` do backend
        // diretamente — mesmo nome nos dois lados.
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (field === 'photo') return;
          if (messages?.[0]) {
            setError(field as keyof UserForm, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  // Checklist item 1 — guard `onSubmit` EXPLÍCITO, nunca `isEmpty`/`!isEmpty`.
  // `hasPhotoChange` é um segundo fator necessário porque a foto não é campo
  // RHF, então uma troca/remoção de foto sozinha nunca suja `dirtyFields`.
  async function onSubmit(data: UserForm) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    const hasPhotoChange = !!photoFile || removePhoto;
    if (isEditing && hasNoFormChanges && !hasPhotoChange) {
      navigate(-1);
    } else {
      await userMutation.mutateAsync(data);
    }
  }

  const isSubmitting = userMutation.isPending;

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
        {/* Bloco "Pessoa" — campos inline, CREATE e EDIT iguais. Ordem do
            legado: nif · name · email (item A, TASK-FE-912 — ÚNICO campo,
            alimenta login E contato) · phone · city · address. */}
        <Text fontSize="sm" fontWeight="semibold" color="fg.default" mb={3}>
          {text.form.sectionPerson}
        </Text>
        <SimpleGrid columns={columnsForm.default} gap={6} mb={6}>
          <Controller
            name="nif"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <MaskedInput
                kind="cpfCnpj"
                label={text.form.fields.nif}
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  handleNifBlur();
                }}
                error={error?.message}
                isRequired
                loading={isLoading}
                // Item B (2º E2E, TASK-FE-912) — readOnly SÓ na edição, mirror
                // do legado (CPF/CNPJ trava após criado). Na criação continua
                // digitável (é ele que dispara o prefill, `handleNifBlur`).
                readOnly={isEditing}
                disabled={!canSave}
              />
            )}
          />
          <Input
            label={text.form.fields.name}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
          <Input
            label={text.form.fields.email}
            placeholder={text.form.placeholders.email}
            type="email"
            {...register('email')}
            error={errors.email?.message}
            tooltip={isEditing && !canEditLoginEmail ? text.form.emailReadonlyNotice : undefined}
            isRequired
            loading={isLoading}
            // Checklist item 4 — readOnly no edit, COM exceção `Gestor_Plataf`.
            readOnly={isEditing && !canEditLoginEmail}
            disabled={!canSave}
          />
          <MaskedInput
            kind="phone"
            label={text.form.fields.phone}
            {...register('phone')}
            error={errors.phone?.message}
            disabled={!canSave}
          />
        </SimpleGrid>
        <SimpleGrid columns={columnsForm.default} gap={6} mb={6}>
          <Controller
            name="city_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.city}
                service={listCityOptions}
                mapOptions={(item: CityListItem) => ({
                  label: `${item.title} — ${item.state?.letter ?? ''}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isReadOnly={!canSave}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
          <Input
            label={text.form.fields.address}
            {...register('address')}
            error={errors.address?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>

        <Separator my={6} borderColor="border2" />

        {/* Bloco "Conta" — o Input de e-mail de login SAIU daqui (item A,
            TASK-FE-912): o único `email` da tela agora vive no bloco Pessoa
            acima. Este bloco fica só com senha/confirmação (create) ou o
            aviso (edit). */}
        <Text fontSize="sm" fontWeight="semibold" color="fg.default" mb={3}>
          {text.form.sectionAccount}
        </Text>

        {/* Checklist item 3 — bloco de senha OMITIDO (não desabilitado) no
            edit, mirror EXATO de `StepUsuario.tsx`. */}
        {isEditing ? (
          <Box fontSize="sm" color="fg.muted" bg="bg.subtle" borderRadius="md" px={4} py={3} mb={6}>
            {text.form.editPasswordNotice}
          </Box>
        ) : (
          <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
            <Input
              label={text.form.fields.password}
              type="password"
              autoComplete="new-password"
              {...register('password')}
              error={errors.password?.message}
              isRequired
              disabled={!canSave}
            />
            <Input
              label={text.form.fields.passwordConfirmation}
              type="password"
              autoComplete="new-password"
              {...register('password_confirmation')}
              error={errors.password_confirmation?.message}
              isRequired
              disabled={!canSave}
            />
          </SimpleGrid>
        )}

        <SimpleGrid columns={columnsForm.default} gap={6} mb={6}>
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <Box display="flex" alignItems="center" justifyContent="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isActive}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isActive}
                />
              </Box>
            )}
          />

          <Controller
            name="is_purchasing_assistant"
            control={control}
            render={({ field }) => (
              <Box display="flex" alignItems="center" justifyContent="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isPurchasingAssistant}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isPurchasingAssistant}
                />
              </Box>
            )}
          />
        </SimpleGrid>

        <Box mb={6}>
          {/* Checklist item 5 (TASK-FE-904) — `onRemove` RELIGADO: o backend
              voltou a suportar `remove_photo` (GAP-BE-471 resolvido). */}
          <ImageUpload
            label={text.form.fields.photo}
            hint={`${text.form.hints.photoAccepted} ${text.form.hints.photoMaxSize}`}
            maxSizeMb={2}
            currentImageUrl={currentPhotoUrl}
            file={photoFile}
            onFileSelected={handlePhotoSelected}
            onRemove={handleRemovePhoto}
            disabled={!canSave || isLoading}
            error={photoError}
            dropzoneTitle={text.form.image.dropzoneTitle}
            dropzoneDraggingTitle={text.form.image.dropzoneDragging}
            changeLabel={text.form.image.changeLabel}
            removeLabel={text.form.image.removeLabel}
            errorTypeMessage={text.form.image.errorType}
            errorSizeMessage={text.form.image.errorSize}
          />
        </Box>

        <Separator my={6} borderColor="border2" />

        {/* Bloco "Vínculos" — mirror LITERAL de `StepUsuario.tsx`. */}
        <Text fontSize="sm" fontWeight="semibold" color="fg.default" mb={3}>
          {text.form.sectionLinks}
        </Text>

        <Box mb={6}>
          <Controller
            name="role_uuids"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CheckboxListField
                label={text.form.fields.roleUuids}
                items={roleItems}
                selectedValues={value}
                onChange={onChange}
                searchValue={roleSearch}
                onSearchChange={setRoleSearch}
                searchPlaceholder={text.form.rolesSearchPlaceholder}
                selectedCountLabel={text.form.selectedCount}
                isLoading={rolesLoading}
                isDisabled={!canSave}
              />
            )}
          />
          {errors.role_uuids?.message && (
            <Text fontSize="xs" color="fg.error" mt={1}>
              {errors.role_uuids.message as string}
            </Text>
          )}
        </Box>

        <Box mb={6}>
          <Controller
            name="farm_uuids"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CheckboxListField
                label={text.form.fields.farmUuids}
                items={farmItems}
                selectedValues={value}
                onChange={onChange}
                searchValue={farmSearch}
                onSearchChange={setFarmSearch}
                searchPlaceholder={text.form.farmsSearchPlaceholder}
                selectedCountLabel={text.form.selectedCount}
                isLoading={farmsLoading}
                isDisabled={!canSave}
              />
            )}
          />
          {/* 97-Esteiras/030 — fazenda passou a ser obrigatória (mínimo 1,
              `user-schema.ts::farm_uuids`), mesmo espelho literal do bloco de
              erro de `role_uuids` acima. */}
          {errors.farm_uuids?.message && (
            <Text fontSize="xs" color="fg.error" mt={1}>
              {errors.farm_uuids.message as string}
            </Text>
          )}
        </Box>

        <Box>
          <Controller
            name="boss_uuids"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CheckboxListField
                label={text.form.fields.bossUuids}
                items={bossItems}
                selectedValues={value}
                onChange={onChange}
                searchValue={bossSearch}
                onSearchChange={setBossSearch}
                searchPlaceholder={text.form.bossesSearchPlaceholder}
                selectedCountLabel={text.form.selectedCount}
                isLoading={usersLoading}
                isDisabled={!canSave}
              />
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
