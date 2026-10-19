// src/pages/MeuPerfil/PersonalDataCard.tsx
// -----------------------------------------------------------------------------
// Card "Dados pessoais" — Execução 071, TASK-071-FE-03. Contrato de tela §4.
// Foto (preview local + "Alterar foto"/"Remover seleção", D8: só descarta a
// SELEÇÃO local, nunca a foto salva), Nome (obrigatório, 3..120) e E-mail
// (readonly, nunca enviado — P-01). Rodapé: "Descartar alterações"/"Salvar
// alterações".
//
// Dirty = `formState.isDirty || photoFile !== null`. PROIBIDO isEmpty (a função, sem parênteses aqui de propósito)
// (ERRO-FE-001 — a implementação deste projeto está INVERTIDA). O guard de
// reset (Lei 2) usa `Object.keys(dirtyFields).length === 0`, explícito,
// mirror `CreateOrUpdateEvento.tsx`.
//
// Adaptado (não copiado) de `GB.Cerne.UX@ffe92bc` `PerfilUsuario.tsx:274-330`.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Avatar, Box, Flex, Heading, Input as ChakraInput, Skeleton, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { PageCard } from '@/components/ui/PageCard';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQuery } from '@/hooks/useCustomFormQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { personalDataSchemaResolver } from '@/validations/schemas/MeuPerfil/personal-data-schema';

import { getOwnProfile, updateOwnProfile } from '@/services/v2/Me/me-service';

import type { OwnProfile } from '@/@types/v2/Me';

const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// Contrato API §2.2: `max:5120` (KB) — 5 MB em bytes.
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

interface PersonalDataForm {
  name: string;
  email: string;
}

interface PersonalDataCardProps {
  onDirtyChange: (dirty: boolean) => void;
}

export function PersonalDataCard({ onDirtyChange }: PersonalDataCardProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.common.myProfile.personalData;
  const { refreshProfile } = useAuth();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [hydratedPhotoUrl, setHydratedPhotoUrl] = useState<string | null>(null);
  // Última foto/valores confirmados pelo servidor (GET inicial ou PUT/POST de
  // sucesso) — é para ELES que "Descartar alterações" volta (contrato de
  // tela §4.2 SRF-071-02f), nunca para os `defaultValues` vazios do useForm.
  const [hydratedValues, setHydratedValues] = useState<PersonalDataForm>({ name: '', email: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<PersonalDataForm>({
    mode: 'onTouched',
    resolver: personalDataSchemaResolver(languageGB),
    defaultValues: { name: '', email: '' },
  });

  // Lei 2 — função NOMEADA. `useCustomFormQuery` (sem ID de contexto) chama
  // `fillForm(data)` sem `resetForce`; aqui não há guarda de dirtyFields
  // porque a query só roda uma vez (perfil do usuário logado, sem parâmetro
  // reativo que force um refetch concorrente com edição em andamento).
  function fillPersonalDataForm(data: OwnProfile) {
    const values = { name: data.name, email: data.email };
    reset(values);
    setHydratedValues(values);
    setHydratedPhotoUrl(data.photo_url);
  }

  const profileQuery = useCustomFormQuery<OwnProfile>({
    asyncFunction: getOwnProfile,
    queryKey: queryKey.me.profile,
    fillForm: fillPersonalDataForm,
  }) as unknown as { isLoading: boolean; isError: boolean; refetch: () => void };

  function clearPhotoSelection() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
  }

  // Única fonte de revogação do objectURL: roda no cleanup a cada troca de
  // `photoPreview` (nova seleção, "Remover seleção" ou Descartar) E no
  // unmount — nunca há um objectURL órfão nem revogação duplicada.
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const isDirty = Object.keys(dirtyFields).length > 0 || photoFile !== null;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const profileMutation = useRequest<OwnProfile>({
    asyncFunction: tryPersistProfile,
    entityName: text.title,
    queryKey: queryKey.me.profile,
    typesRequest: 'update',
    personalizedMessage: text.saveSuccessMessage,
    actionSuccess: (data) => {
      const values = { name: data.name, email: data.email };
      reset(values);
      setHydratedValues(values);
      setHydratedPhotoUrl(data.photo_url);
      clearPhotoSelection();
      refreshProfile();
    },
  });

  async function tryPersistProfile(data: PersonalDataForm) {
    try {
      return photoFile
        ? await updateOwnProfile({ name: data.name, photo: photoFile })
        : await updateOwnProfile({ name: data.name });
    } catch (error) {
      // 422 do backend mapeado por campo — mesma técnica de
      // `CreateOrUpdateEvento.tsx` (o `throw` preserva o toast genérico que
      // `useRequest` já mostra). `photo` não é campo do RHF: vai para o
      // estado local `photoError`, exibido junto do hint da foto.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const message = messages?.[0];
          if (!message) return;
          if (field === 'photo') {
            setPhotoError(message);
          } else if (field === 'name' || field === 'email') {
            setError(field, { type: 'server', message });
          }
        });
      }
      throw error;
    }
  }

  function handlePhotoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Permite reselecionar o MESMO arquivo (contrato de tela §4.1).
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError(text.photo.errorType);
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError(text.photo.errorSize);
      return;
    }

    // A troca de `photoPreview` aqui aciona o cleanup do efeito acima, que
    // revoga o objectURL ANTERIOR sozinho — sem revogação manual duplicada.
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoError(null);
  }

  function handleDiscard() {
    reset(hydratedValues);
    clearPhotoSelection();
  }

  async function onSubmit(data: PersonalDataForm) {
    if (!isDirty) return;
    // `useRequest.onError` já mostra o toast de erro (e o 422 já populou os
    // campos via `setError`, acima) — o `.catch` aqui só evita que a
    // rejeição de `mutateAsync` (o mesmo erro relançado por
    // `tryPersistProfile`) suba como unhandled promise rejection.
    await profileMutation.mutateAsync(data).catch(() => {});
  }

  const avatarSrc = photoPreview ?? hydratedPhotoUrl ?? undefined;
  const isSaving = profileMutation.isPending;
  const isLoading = profileQuery.isLoading;

  if (profileQuery.isError) {
    return (
      <PageCard>
        <Box p={5}>
          <Heading size="sm" mb={2} color="fg.default">
            {text.title}
          </Heading>
          <Text color="feedBack.errorMain" mb={3}>
            {text.loadErrorTitle}
          </Text>
          <Button
            title={text.retryButton}
            variant="outline"
            onClick={() => profileQuery.refetch()}
          />
        </Box>
      </PageCard>
    );
  }

  return (
    <PageCard>
      <Box
        as="form"
        // @ts-expect-error - `Box as="form"` (Chakra v3) não tipa os atributos
        // nativos do elemento alvo; `noValidate` é HTML válido (desliga a
        // validação nativa do browser, que bloquearia o submit ANTES do
        // resolver do RHF/yup rodar — mirror `Form/index.tsx`, `noValidate`).
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        p={5}
      >
        <Heading size="sm" mb={4} color="fg.default">
          {text.title}
        </Heading>

        <Flex align="center" gap={4} mb={5}>
          <Skeleton loading={isLoading} borderRadius="full">
            <Avatar.Root
              size="xl"
              bgGradient="to-br"
              gradientFrom="loginButtonPrimary"
              gradientTo="green.300"
              color="white"
            >
              <Avatar.Image src={avatarSrc} />
              <Avatar.Fallback name="U" />
            </Avatar.Root>
          </Skeleton>

          <Box>
            <Flex gap={2} align="center">
              <Button
                title={text.photo.changeButton}
                variant="outline"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || isLoading}
              />
              {photoFile !== null && (
                <Button
                  title={text.photo.removeSelectionButton}
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={clearPhotoSelection}
                  disabled={isSubmitting}
                />
              )}
            </Flex>
            <ChakraInput
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_PHOTO_TYPES.join(',')}
              onChange={handlePhotoSelect}
              display="none"
            />
            <Text
              fontSize="xs"
              color={photoError ? 'feedBack.errorMain' : 'text.secondary'}
              mt={1}
              aria-live="polite"
              role={photoError ? 'alert' : undefined}
            >
              {photoError ?? text.photo.hint}
            </Text>
          </Box>
        </Flex>

        <Flex direction="column" gap={4}>
          <Input
            label={text.name.label}
            isRequired
            maxLength={120}
            loading={isLoading}
            disabled={isSubmitting}
            error={errors.name?.message}
            {...register('name')}
          />

          <InputReadOnly
            label={text.email.label}
            helperText={text.email.hint}
            loading={isLoading}
            error={errors.email?.message}
            value={watch('email') ?? ''}
          />
        </Flex>

        <Flex justify="flex-end" gap={2} mt={5} pt={4} borderTop="1px solid" borderColor="border1">
          <Button
            title={text.discardButton}
            variant="ghost"
            type="button"
            onClick={handleDiscard}
            disabled={!isDirty || isSaving}
          />
          <Button
            title={text.saveButton}
            type="submit"
            loading={isSaving}
            disabled={!isDirty || isSaving}
          />
        </Flex>
      </Box>
    </PageCard>
  );
}

export default PersonalDataCard;
