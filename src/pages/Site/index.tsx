// src/pages/Site/index.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de configuração do Site (config pública da fazenda) — 97-Esteiras/
// 061, TASK-SITE-06. Form singleton (mirror `Configuracoes/Config`/
// `BaseRegistrations/TenantParameters`) — sem listagem, sem create/edit por
// rota: 1 GET (`getSite`) + 1 PUT/upsert (`updateSite`) no mesmo lugar. `Site`
// é farm-scoped via `X-Farm-Id` (diferente de `Config`, que é global) — guard
// de "sem fazenda ativa" ANTES da query (mirror `TenantParameters/
// index.tsx:127-138`).
//
// Orquestração/guard (TASK-SITE-05, decisão já fechada, transcrita aqui):
//  1) `useCustomFormQuery` SEM `registrationId` (GET fixo, singleton),
//     `enabled: can('site_edit')` — mirror `Config/index.tsx` (`enabled:
//     can('config_view')`).
//  2) Guard de "sem fazenda ativa" ANTES do `useCustomFormQuery` —
//     `usePermissions().hasFarm`, mirror `TenantParameters/index.tsx`. Site
//     usa `X-Farm-Id` (diferente de `Config`, global).
//  3) Guard de submit — `if (!isEmpty(dirtyFields) && !hasImageChange)
//     return;` COPIADO LITERALMENTE do precedente real de `Config/index.tsx`/
//     `FamilyEquipments/CreateOrUpdateFamilyEquipments.tsx`.
//     `src/utils/isEmpty.ts` tem nome INVERTIDO (retorna `true` quando HÁ
//     chaves) — NÃO rederivar a partir da doc genérica do MCP.
//     `hasImageChange = !!imageFile` (SEM `removeImage` — SEM-001 do
//     contrato legado: não existe remoção isolada de banner, só troca).
//  4) `fillSiteForm(data)` — função nomeada, guardada por
//     `!isEmpty(dirtyFields)`, `reset({ ...data, published: data.published
//     })` (`boolean` puro — SUR-004 é toggle, não select).
//
// Ordem dos 8 campos (fidelidade ao contrato legado, matriz FID-G3F §3 de
// `061/CONTRATOS/03-ARQUITETURA-frontend-site.md`): banner → published →
// [link "Ver Site" condicional] → instagram → facebook → twitter → youtube →
// whatsapp → about.
//
// ⚠️ DIVERGÊNCIA task-packet × contrato/roteiro aprovados (registrada, NÃO
// fabricada silenciosamente): o task-packet recebido por este Executor pedia
// `whatsapp` via `Controller` + `InputMask` ("NUNCA spread de register —
// armadilha item 31"). Nenhum artefato GATE-aprovado do run 061 menciona esse
// "item 31" (grep confirmado em `061/CONTRATOS/*.md` e `061/ROTEIROS/*.md`) —
// pelo contrário, `03-ARQUITETURA-frontend-site.md` (Risco #2/SUR-010) e
// `02-roteiro-execucao-frontend-site.md` (TASK-SITE-06, "Componentes a
// REUSAR") decidem o OPOSTO, de forma explícita: `PhoneInput`
// (`register()`-based, `src/components/Form/PhoneInput.tsx`) — o único dos 2
// componentes de máscara do repo que resolve o dinâmico 10/11 dígitos exigido
// pelo dono (`InputMask` só aplica máscara ESTÁTICA de string fixa). Seguida
// aqui a fonte primária GATE-aprovada (contrato + roteiro) em vez do resumo
// do task-packet — reportar ao Arquiteto/dono para reconciliar o texto do
// task-packet com o contrato já fechado.
//
// G-FE-01 / SUR-PUB-15 (link "Ver Site", TASK-SITE-08, `061/ROTEIROS/
// 03-roteiro-execucao-frontend-site-publico.md`): o botão aponta agora para a
// rota PÚBLICA da própria SPA (`/site/{slug}`, path relativo — o browser
// resolve pela origem atual, sem precisar de `window.location.origin` nem de
// env var), substituindo o link antigo via `LEGACY_PUBLIC_BASE_URL`
// (monólito legado). Guard inalterado: `published && slug` (mirror
// `_forms.blade.php:21`). `LEGACY_PUBLIC_BASE_URL` (`env.ts`) fica sem
// nenhum outro consumidor após esta troca (confirmado por grep) — candidato
// a remoção numa Tarefa FUTURA separada, fora do escopo cirúrgico desta.
//
// FIX (homologação, 97-Esteiras/061) — 1ª abertura não populava os campos
// (só o banner, que fica fora do RHF): causa-raiz CONFIRMADA por reprodução
// isolada (vitest) — `RichTextEditor` chama `editor.setEditable(!isDisabled)`
// no seu `useEffect([isDisabled, editor])` SEM o 2º argumento `emitUpdate:
// false` do Tiptap (`setEditable(editable, emitUpdate = true)` — default
// TRUE). Isso dispara um `onUpdate`/`onChange` ESPONTÂNEO (confirmado:
// `onChange('<p></p>')` chamado sem nenhuma interação do usuário) já na
// MONTAGEM do editor — antes do GET `getSite` resolver pela 1ª vez (cache
// frio) — sujando `dirtyFields.about` via `Controller`. Como `fillSiteForm`
// só chamava `reset(...)` quando `!isEmpty(dirtyFields)` (formulário
// pristino), o `about` já dirty fazia o guard PULAR o `reset` inteiro (todos
// os campos, não só `about`). Em aberturas seguintes o `queryKey.site` já
// está em cache — `fillSiteForm` roda no mesmo ciclo de montagem, antes de
// qualquer transição de `isDisabled` reincidir a mesma dirtiagem, por isso
// "funcionava". `hasHydratedRef` abaixo faz a 1ª carga bem-sucedida SEMPRE
// popular o form, preservando o guard de `dirtyFields` só para refetch em
// background (não atropela edição do usuário em andamento).
// -----------------------------------------------------------------------------

import { useRef, useState } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  Link,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FiAlertTriangle, FiExternalLink } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { ImageUpload } from '@/components/Form/ImageUpload';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { FormContainer } from '@/components/Layout/FormContainer';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Switch } from '@/components/ui/switch';

import { useCustomFormQuery } from '@/hooks/useCustomFormQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { siteSchemaResolver } from '@/validations/schemas/Site/site-schema';

import { getSite, updateSite } from '@/services/v2/Site/site-service';

import type { SiteData, SiteForm as SiteFormType, UpdateSiteRequest } from '@/@types/v2/Site';

import type { UseQueryResult } from '@tanstack/react-query';

export default function Site() {
  const { languageGB } = useLanguage();
  const { can, hasFarm } = usePermissions();
  const text = languageGB.site;

  const canEdit = can('site_edit');

  // Estado do banner — NÃO é campo RHF (SUR-003), mirror `FamilyEquipments/
  // CreateOrUpdateFamilyEquipments.tsx`. `imageFile` = arquivo novo escolhido
  // nesta sessão; `currentImageUrl` = espelho de `data.banner_url` (preview),
  // só atualizado quando não há seleção local em andamento.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  // Guard de hidratação da 1ª carga (fix desta execução) — ver nota de
  // cabeçalho do arquivo. `false` até a 1ª chamada bem-sucedida de
  // `fillSiteForm`; depois disso o guard normal de `dirtyFields` volta a
  // valer sozinho (refetch em background não deve atropelar edição do
  // usuário).
  const hasHydratedRef = useRef(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<SiteFormType>({
    mode: 'onChange',
    resolver: siteSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      published: false,
      instagram: '',
      facebook: '',
      twitter: '',
      youtube: '',
      whatsapp: '',
      about: '',
    },
  });

  // Guard #4 (TASK-SITE-05) — função nomeada, guardada por `dirtyFields`,
  // `published` boolean puro (SUR-004). FIX desta execução: a 1ª carga
  // bem-sucedida SEMPRE popula (`!hasHydratedRef.current`), mesmo que algum
  // Controller tenha sujado `dirtyFields` na montagem (ver nota de cabeçalho
  // — causa-raiz confirmada no `RichTextEditor`/`about`); depois da 1ª
  // hidratação, só refaz o `reset` se o form seguir pristino (não atropela
  // edição do usuário num refetch em background).
  function fillSiteForm(data: SiteData) {
    if (!hasHydratedRef.current || !isEmpty(dirtyFields)) {
      reset({
        published: data.published,
        instagram: data.instagram ?? '',
        facebook: data.facebook ?? '',
        twitter: data.twitter ?? '',
        youtube: data.youtube ?? '',
        whatsapp: data.whatsapp ?? '',
        about: data.about,
      });
      hasHydratedRef.current = true;
    }
    // Banner não é campo RHF — só sincroniza o preview "atual" quando o
    // usuário ainda não escolheu localmente um arquivo novo (evita clobar
    // uma seleção em andamento caso o hook refaça o fetch em background).
    if (!imageFile) {
      setCurrentImageUrl(data.banner_url);
    }
  }

  // Guard #1/#2 (TASK-SITE-05) — GET fixo (sem `registrationId`); `enabled`
  // combina farm ativa + permissão de edição (mirror `Config`: `enabled:
  // can('config_view')`, adaptado para o guard extra de farm-scope).
  const siteQuery = useCustomFormQuery<SiteData>({
    asyncFunction: getSite,
    queryKey: queryKey.site,
    fillForm: fillSiteForm,
    enabled: hasFarm && canEdit,
  }) as unknown as UseQueryResult<SiteData>;

  const isLoading = hasFarm && checkLoadingStatus([siteQuery]);

  const siteMutation = useRequest({
    asyncFunction: tryPersistSite,
    entityName: text.singularLabel,
    queryKey: queryKey.site,
    typesRequest: 'update',
    personalizedMessage: text.saveSuccessToast,
    actionSuccess: () => setImageFile(null),
  });

  async function tryPersistSite(data: SiteFormType) {
    const payload: UpdateSiteRequest = {
      published: data.published,
      instagram: data.instagram,
      facebook: data.facebook,
      twitter: data.twitter,
      youtube: data.youtube,
      whatsapp: data.whatsapp,
      about: data.about,
    };
    return await updateSite(payload, imageFile);
  }

  // Risco #3 do contrato (SUR-003): `dirtyFields` nunca reflete troca de
  // banner (fora do `control` RHF) — `hasImageChange` é o 2º fator do guard.
  const hasImageChange = !!imageFile;

  // Guard #3 (TASK-SITE-05) — expressão copiada LITERALMENTE de
  // `Config/index.tsx`/`FamilyEquipments` (ver nota de cabeçalho do arquivo).
  async function onSubmit(data: SiteFormType) {
    if (!isEmpty(dirtyFields) && !hasImageChange) return;
    await siteMutation.mutateAsync(data);
  }

  const isFieldDisabled = !canEdit || isLoading;

  // Link "Ver Site" condicional (SUR-005/SUR-PUB-15/G-FE-01) — ver nota de
  // cabeçalho. Rota interna da própria SPA (`/site/{slug}`), mesma condição
  // de sempre (`published && slug`).
  const viewSiteHref = siteQuery.data?.slug ? `/site/${siteQuery.data.slug}` : null;
  const showViewSiteLink = !!(siteQuery.data?.published && viewSiteHref);

  // Guard de "sem fazenda ativa" (CL-017) — ANTES de qualquer renderização
  // de form/query, mirror `TenantParameters/index.tsx:127-138`.
  if (!hasFarm) {
    return (
      <FormContainer title={text.pageTitle} subtitle={text.pageSubtitle}>
        <VStack align="flex-start" gap={2} p={4} bg="bg.subtle" borderRadius="md">
          <Text fontWeight="medium">{text.noFarmSelected.title}</Text>
          <Text fontSize="sm" color="fg.muted">
            {text.noFarmSelected.description}
          </Text>
        </VStack>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        canEdit ? (
          <Button
            title={languageGB.defaltStrings.save}
            type="submit"
            form="site-form"
            loading={siteMutation.isPending}
            disabled={siteMutation.isPending || isLoading}
          />
        ) : undefined
      }
    >
      {siteQuery.isError ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={3}>
              <VStack gap={1}>
                <EmptyState.Title>{languageGB.common.errorLog.unknownError}</EmptyState.Title>
              </VStack>
              <Button
                title={languageGB.defaltStrings.tryAgain}
                variant="outline"
                onClick={() => siteQuery.refetch()}
              />
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <Form id="site-form" noPadding onSubmit={handleSubmit(onSubmit)}>
          {!canEdit && (
            <Box
              mb={6}
              px={4}
              py={3}
              borderWidth="1px"
              borderColor="border.subtle"
              borderRadius="md"
              bg="bg.subtle"
            >
              {text.readOnlyNotice}
            </Box>
          )}

          {/* 1 — banner (ImageUpload, fora do RHF — SUR-003) */}
          <Box mb={6}>
            <ImageUpload
              label={text.fields.banner}
              hint={text.image.hint}
              file={imageFile}
              currentImageUrl={currentImageUrl}
              onFileSelected={setImageFile}
              disabled={isFieldDisabled}
              dropzoneTitle={text.image.dropzoneTitle}
              dropzoneDraggingTitle={text.image.dropzoneDragging}
              changeLabel={text.image.changeLabel}
              errorTypeMessage={text.image.errorType}
              errorSizeMessage={text.image.errorSize}
            />
          </Box>

          {/* 2 — published (toggle/switch, SUR-004) */}
          <Controller
            name="published"
            control={control}
            render={({ field }) => (
              <Flex align="center" justifyContent="space-between" mb={2} h={10}>
                <Text fontSize="sm" fontWeight="medium">
                  {text.fields.published}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={isFieldDisabled}
                  aria-label={text.fields.published}
                />
              </Flex>
            )}
          />

          {/* link "Ver Site" condicional (SUR-005/G-FE-01) */}
          {showViewSiteLink && (
            <Flex mb={6}>
              <Link
                href={viewSiteHref!}
                target="_blank"
                rel="noopener noreferrer"
                color="brandColorText"
                fontSize="sm"
                display="inline-flex"
                alignItems="center"
                gap={1}
              >
                {text.viewSiteLink}
                <Icon as={FiExternalLink} boxSize={3.5} />
              </Link>
            </Flex>
          )}
          {!showViewSiteLink && <Box mb={6} />}

          {/* 3-6 — redes sociais (instagram/facebook/twitter/youtube, input url) */}
          <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
            <Input
              label={text.fields.instagram}
              placeholder={text.placeholders.instagram}
              type="url"
              {...register('instagram')}
              error={errors.instagram?.message}
              disabled={isFieldDisabled}
              loading={isLoading}
            />
            <Input
              label={text.fields.facebook}
              placeholder={text.placeholders.facebook}
              type="url"
              {...register('facebook')}
              error={errors.facebook?.message}
              disabled={isFieldDisabled}
              loading={isLoading}
            />
            <Input
              label={text.fields.twitter}
              placeholder={text.placeholders.twitter}
              type="url"
              {...register('twitter')}
              error={errors.twitter?.message}
              disabled={isFieldDisabled}
              loading={isLoading}
            />
            <Input
              label={text.fields.youtube}
              placeholder={text.placeholders.youtube}
              type="url"
              {...register('youtube')}
              error={errors.youtube?.message}
              disabled={isFieldDisabled}
              loading={isLoading}
            />
          </SimpleGrid>

          {/* 7 — whatsapp (PhoneInput, register()-based — máscara dinâmica
              10/11 dígitos, SUR-010; ver nota de cabeçalho sobre a
              divergência com o texto do task-packet) */}
          <Skeleton loading={isLoading} borderRadius="md" mb={6}>
            <MaskedInput
              kind="phone"
              label={text.fields.whatsapp}
              placeholder={text.placeholders.whatsapp}
              {...register('whatsapp')}
              error={errors.whatsapp?.message}
              disabled={isFieldDisabled}
            />
          </Skeleton>

          {/* 8 — about (RichTextEditor/TipTap via Controller, SUR-011) */}
          <Controller
            name="about"
            control={control}
            render={({ field, fieldState }) => (
              <RichTextEditor
                label={text.fields.about}
                placeholder={text.placeholders.about}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                isRequired
                isDisabled={isFieldDisabled}
              />
            )}
          />
        </Form>
      )}
    </FormContainer>
  );
}
