// src/components/Branding/BrandingForm.tsx
// Formulário compartilhado da Marca do relatório (usado por Perfil (usuário) e Equipe).
// Contrato completo da API: nome da empresa, 4 cores (primary/secondary/accent/text),
// site, texto de rodapé e 2 logos (primary/secondary). Salvar/excluir via useRequest;
// os logos são enviados/removidos imediatamente (endpoints próprios). Pré-visualização
// ao vivo da capa à direita.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

import {
  Box,
  Flex,
  Grid,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  Separator,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { FiTrash2, FiUploadCloud } from "react-icons/fi";

import type { Response } from "@/@types/response-api";

import { Button } from "@/components/Button";
import { CustomDialog } from "@/components/CustomDialog";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import { useLanguage } from "@/hooks/useLanguage";
import { useRequest } from "@/hooks/useRequest";
import type {
  BrandingData,
  BrandingLogoSlot,
  UpdateBrandingRequest,
} from "@/@types/v2/Common/branding";
import { ReportCoverPreview } from "./ReportCoverPreview";

const SWATCHES = ["#3b6fd4", "#0a0a5a", "#0e8aa8", "#6d4ad8", "#1f9d57", "#c2410c"];
const DEFAULTS = {
  primary_color: "#3b6fd4",
  secondary_color: "#0a0a5a",
  accent_color: "#1f9d57",
  text_color: "#ffffff",
};
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const MAX_LOGO_BYTES = 10 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface BrandingFormService {
  update: (req: UpdateBrandingRequest) => Promise<Response<any>>;
  remove: () => Promise<Response<any>>;
  uploadLogo: (slot: BrandingLogoSlot, file: File) => Promise<Response<any>>;
  deleteLogo: (slot: BrandingLogoSlot) => Promise<Response<any>>;
}

interface BrandingFormProps {
  branding: BrandingData | null;
  /** queryKey da consulta da marca (para o useRequest invalidar e refazer o GET). */
  queryKey: string;
  service: BrandingFormService;
  isTeam?: boolean;
  /** Callback opcional após excluir a marca (ex.: admin volta para a listagem). */
  onDeleted?: () => void;
  /** Conteúdo extra no topo do card (ex.: seletor de proprietário no admin create). */
  headerSlot?: ReactNode;
  /** Modo "stage": ao escolher um logo, guarda o arquivo (preview local) em vez de
   *  enviar na hora. Usado no admin create, onde a marca ainda não existe. */
  stageLogos?: boolean;
  /** Recebe os arquivos em stage (para o pai enviá-los após criar a marca). */
  onStagedLogosChange?: (staged: { primary: File | null; secondary: File | null }) => void;
  /** Callback opcional após salvar (ex.: admin create redireciona para a edição). */
  onSaved?: (data: BrandingData) => void;
  /** Validação extra antes de salvar; retorne uma mensagem para abortar. */
  validateBeforeSave?: () => string | null;
}

export function BrandingForm({
  branding,
  queryKey,
  service,
  isTeam,
  onDeleted,
  headerSlot,
  stageLogos = false,
  onStagedLogosChange,
  onSaved,
  validateBeforeSave,
}: BrandingFormProps) {
  const { languageGB } = useLanguage();

  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [footerText, setFooterText] = useState("");
  const [primaryColor, setPrimaryColor] = useState(DEFAULTS.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULTS.secondary_color);
  const [accentColor, setAccentColor] = useState(DEFAULTS.accent_color);
  const [textColor, setTextColor] = useState(DEFAULTS.text_color);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const initedRef = useRef(false);

  // Inicializa o formulário a partir da marca carregada (uma vez por marca).
  useEffect(() => {
    if (!branding || initedRef.current) return;
    initedRef.current = true;
    setCompanyName(branding.company_name ?? "");
    setWebsite(branding.website ?? "");
    setFooterText(branding.footer_text ?? "");
    setPrimaryColor(branding.primary_color ?? DEFAULTS.primary_color);
    setSecondaryColor(branding.secondary_color ?? DEFAULTS.secondary_color);
    setAccentColor(branding.accent_color ?? DEFAULTS.accent_color);
    setTextColor(branding.text_color ?? DEFAULTS.text_color);
  }, [branding]);

  const brandingPrimaryLogo =
    branding?.logos.find((l) => l.position === "primary")?.url ?? null;
  const brandingSecondaryLogo =
    branding?.logos.find((l) => l.position === "secondary")?.url ?? null;

  // Logos em stage (admin create): preview local via objectURL até a marca existir.
  const [stagedUrls, setStagedUrls] = useState<{
    primary: string | null;
    secondary: string | null;
  }>({ primary: null, secondary: null });
  const stagedFilesRef = useRef<{ primary: File | null; secondary: File | null }>({
    primary: null,
    secondary: null,
  });
  const stagedUrlsRef = useRef(stagedUrls);
  stagedUrlsRef.current = stagedUrls;
  useEffect(
    () => () => {
      if (stagedUrlsRef.current.primary) URL.revokeObjectURL(stagedUrlsRef.current.primary);
      if (stagedUrlsRef.current.secondary) URL.revokeObjectURL(stagedUrlsRef.current.secondary);
    },
    []
  );

  const primaryLogo = stageLogos ? stagedUrls.primary : brandingPrimaryLogo;
  const secondaryLogo = stageLogos ? stagedUrls.secondary : brandingSecondaryLogo;

  // ---- Mutations ----
  const isEditing = !!branding;

  async function tryPersistBranding(req: UpdateBrandingRequest) {
    return service.update(req);
  }
  const saveMutation = useRequest({
    asyncFunction: tryPersistBranding,
    entityName: languageGB.common.branding.entityName,
    queryKey,
    typesRequest: isEditing ? "update" : "create",
    personalizedMessage: languageGB.common.branding.saved,
    actionSuccess: (data: BrandingData) => {
      onSaved?.(data);
    },
  });

  async function tryDeleteBranding() {
    return service.remove();
  }
  const deleteMutation = useRequest({
    asyncFunction: tryDeleteBranding,
    entityName: languageGB.common.branding.entityName,
    queryKey,
    typesRequest: "revoke",
    personalizedMessage: languageGB.common.branding.deleted,
    actionSuccess: () => {
      initedRef.current = false;
      onDeleted?.();
    },
  });

  async function tryUploadLogo(payload: { slot: BrandingLogoSlot; file: File }) {
    return service.uploadLogo(payload.slot, payload.file);
  }
  const uploadLogoMutation = useRequest({
    asyncFunction: tryUploadLogo,
    entityName: languageGB.common.branding.entityName,
    queryKey,
    typesRequest: "update",
    personalizedMessage: languageGB.common.branding.logoUploaded,
    actionSuccess: () => {},
  });

  async function tryDeleteLogo(slot: BrandingLogoSlot) {
    return service.deleteLogo(slot);
  }
  const deleteLogoMutation = useRequest({
    asyncFunction: tryDeleteLogo,
    entityName: languageGB.common.branding.entityName,
    queryKey,
    typesRequest: "revoke",
    personalizedMessage: languageGB.common.branding.logoRemoved,
    actionSuccess: () => {},
  });

  const logoBusy = uploadLogoMutation.isPending || deleteLogoMutation.isPending;

  // ---- Handlers ----
  function handleSave() {
    if (validateBeforeSave) {
      const validationError = validateBeforeSave();
      if (validationError) {
        toaster.error({ title: "Error", description: validationError });
        return;
      }
    }
    const colors = [primaryColor, secondaryColor, accentColor, textColor];
    if (colors.some((c) => !HEX_RE.test(c))) {
      toaster.error({ title: "Error", description: languageGB.common.branding.invalidColor });
      return;
    }
    const req: UpdateBrandingRequest = {
      company_name: companyName.trim() || null,
      website: website.trim() || null,
      footer_text: footerText.trim() || null,
      primary_color: primaryColor.toLowerCase(),
      secondary_color: secondaryColor.toLowerCase(),
      accent_color: accentColor.toLowerCase(),
      text_color: textColor.toLowerCase(),
    };
    if (!req.company_name && !req.website && !req.footer_text && !req.primary_color) {
      toaster.error({ title: "Error", description: languageGB.common.branding.atLeastOneField });
      return;
    }
    saveMutation.mutate(req);
  }

  function handleReset() {
    setCompanyName(branding?.company_name ?? "");
    setWebsite(branding?.website ?? "");
    setFooterText(branding?.footer_text ?? "");
    setPrimaryColor(branding?.primary_color ?? DEFAULTS.primary_color);
    setSecondaryColor(branding?.secondary_color ?? DEFAULTS.secondary_color);
    setAccentColor(branding?.accent_color ?? DEFAULTS.accent_color);
    setTextColor(branding?.text_color ?? DEFAULTS.text_color);
  }

  function handleLogoFile(slot: BrandingLogoSlot, file?: File | null) {
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toaster.error({ title: "Error", description: languageGB.common.branding.invalidImage });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toaster.error({ title: "Error", description: languageGB.common.branding.imageTooLarge });
      return;
    }
    if (stageLogos) {
      const url = URL.createObjectURL(file);
      setStagedUrls((prev) => {
        if (prev[slot]) URL.revokeObjectURL(prev[slot]!);
        return { ...prev, [slot]: url };
      });
      stagedFilesRef.current = { ...stagedFilesRef.current, [slot]: file };
      onStagedLogosChange?.(stagedFilesRef.current);
      return;
    }
    uploadLogoMutation.mutate({ slot, file });
  }

  function handleRemoveLogo(slot: BrandingLogoSlot) {
    if (stageLogos) {
      setStagedUrls((prev) => {
        if (prev[slot]) URL.revokeObjectURL(prev[slot]!);
        return { ...prev, [slot]: null };
      });
      stagedFilesRef.current = { ...stagedFilesRef.current, [slot]: null };
      onStagedLogosChange?.(stagedFilesRef.current);
      return;
    }
    deleteLogoMutation.mutate(slot);
  }

  const previewValues = useMemo(
    () => ({
      company_name: companyName,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      text_color: textColor,
      website,
      footer_text: footerText,
      primaryLogoUrl: primaryLogo,
    }),
    [companyName, primaryColor, secondaryColor, accentColor, textColor, website, footerText, primaryLogo]
  );

  return (
    <>
      <Grid templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) 440px" }} gap={6} alignItems="stretch">
        {/* ---- Formulário (card) ---- */}
        <Box
          bg="cardBG"
          borderWidth="1px"
          borderColor="border"
          borderRadius="xl"
          p={{ base: 4, md: 5 }}
        >
          <VStack align="stretch" gap={5}>
            {headerSlot && (
              <>
                {headerSlot}
                <Separator borderColor="border" />
              </>
            )}

            {/* Logos */}
            <Box>
              <SectionTitle>{languageGB.common.branding.logoSectionLabel}</SectionTitle>
              <Text fontSize="sm" color="fg.muted" mb={3}>
                {languageGB.common.branding.logoHint}
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                <LogoSlot
                  label={languageGB.common.branding.logoPrimary}
                  url={primaryLogo}
                  uploadLabel={languageGB.common.branding.uploadLogo}
                  removeLabel={languageGB.common.branding.removeLogo}
                  dropzone={languageGB.common.branding.dropzone}
                  loading={logoBusy}
                  onFile={(f) => handleLogoFile("primary", f)}
                  onRemove={() => handleRemoveLogo("primary")}
                />
                <LogoSlot
                  label={languageGB.common.branding.logoSecondary}
                  url={secondaryLogo}
                  uploadLabel={languageGB.common.branding.uploadLogo}
                  removeLabel={languageGB.common.branding.removeLogo}
                  dropzone={languageGB.common.branding.dropzone}
                  loading={logoBusy}
                  onFile={(f) => handleLogoFile("secondary", f)}
                  onRemove={() => handleRemoveLogo("secondary")}
                />
              </SimpleGrid>
            </Box>

            <Separator borderColor="border" />

            {/* Cores — 4 em linha (quebra p/ 2 e depois 1 ao encolher); todas com swatches. */}
            <Box>
              <SectionTitle>{languageGB.common.branding.colorsLabel}</SectionTitle>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mt={1}>
                <ColorField label={languageGB.common.branding.primaryColor} value={primaryColor} onChange={setPrimaryColor} swatches />
                <ColorField label={languageGB.common.branding.secondaryColor} value={secondaryColor} onChange={setSecondaryColor} swatches />
                <ColorField label={languageGB.common.branding.accentColor} value={accentColor} onChange={setAccentColor} swatches />
                <ColorField label={languageGB.common.branding.textColor} value={textColor} onChange={setTextColor} swatches />
              </SimpleGrid>
            </Box>

            <Separator borderColor="border" />

            {/* Informações */}
            <VStack align="stretch" gap={4}>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                <Field label={languageGB.common.branding.companyName}>
                  <Input size="sm" variant="subtle" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={languageGB.common.branding.companyNamePlaceholder} maxLength={255} />
                </Field>
                <Field label={languageGB.common.branding.website}>
                  <Input size="sm" variant="subtle" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={languageGB.common.branding.websitePlaceholder} maxLength={255} spellCheck={false} />
                </Field>
              </SimpleGrid>
              <Field label={languageGB.common.branding.footerText}>
                <Textarea size="sm" variant="subtle" value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder={languageGB.common.branding.footerTextPlaceholder} maxLength={500} rows={2} resize="vertical" />
              </Field>
            </VStack>

            {/* Ações */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={3} pt={4} borderTopWidth="1px" borderColor="border">
              {isEditing ? (
                <Button
                  title={languageGB.common.branding.deleteBrand}
                  icon={FiTrash2 as ElementType}
                  variant="ghost_danger"
                  onClick={() => setConfirmDelete(true)}
                  loading={deleteMutation.isPending}
                />
              ) : (
                <Box />
              )}
              <HStack gap={3}>
                <Button title={languageGB.common.branding.reset} variant="ghost" onClick={handleReset} />
                <Button title={languageGB.common.branding.save} colorPalette="primary" onClick={handleSave} loading={saveMutation.isPending} />
              </HStack>
            </Flex>
          </VStack>
        </Box>

        {/* ---- Pré-visualização (alinhada à altura do painel) ---- */}
        <Box h={{ lg: "100%" }} display="flex" flexDirection="column">
          <Text
            flexShrink={0}
            fontSize="xs"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={2}
          >
            {languageGB.common.branding.previewLabel}
          </Text>
          <ReportCoverPreview values={previewValues} />
        </Box>
      </Grid>

      {/* Confirmação de exclusão */}
      <CustomDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        title={languageGB.common.branding.deleteTitle}
        titleIcon={FiTrash2}
        titleIconColor="red.500"
        footer={
          <HStack gap={3} justify="flex-end">
            <Button title={languageGB.common.branding.cancel} variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleteMutation.isPending} />
            <Button
              title={languageGB.common.branding.deleteConfirm}
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => {
                deleteMutation.mutate(undefined as never);
                setConfirmDelete(false);
              }}
            />
          </HStack>
        }
      >
        <Text fontSize="sm" color="fg.muted">
          {languageGB.common.branding.deleteDescription}
        </Text>
      </CustomDialog>
    </>
  );
}

// ---- Subcomponentes ----

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text fontWeight="semibold" color="brandColorText" mb={1}>
      {children}
    </Text>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" color="brandColorText" mb={1.5}>
        {label}
      </Text>
      {children}
    </Box>
  );
}

function LogoSlot({
  label,
  url,
  uploadLabel,
  removeLabel,
  dropzone,
  loading,
  onFile,
  onRemove,
}: {
  label: string;
  url: string | null;
  uploadLabel: string;
  removeLabel: string;
  dropzone: string;
  loading?: boolean;
  onFile: (file?: File | null) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <Box>
      <Text fontSize="xs" fontWeight="medium" color="fg.muted" mb={1.5}>
        {label}
      </Text>
      <Box
        role="button"
        aria-label={uploadLabel}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
        position="relative"
        borderWidth="1.5px"
        borderStyle="dashed"
        borderColor={drag ? "primaryMain" : "border"}
        borderRadius="lg"
        bg={drag ? "secondaryLighter" : "formBG"}
        cursor="pointer"
        transition="border-color 0.15s, background 0.15s"
        _hover={{ borderColor: "primaryMain" }}
        minH="70px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={2}
        textAlign="center"
      >
        {url ? (
          <>
            <Image src={url} alt={label} maxH="48px" maxW="88%" objectFit="contain" />
            <Tooltip content={removeLabel}>
              <IconButton
                size="xs"
                variant="destructive"
                aria-label={removeLabel}
                position="absolute"
                top="6px"
                right="6px"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Icon as={FiTrash2} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <VStack gap={0.5}>
            <Icon as={FiUploadCloud} boxSize={5} color="primaryMain" />
            <Text fontSize="xs" fontWeight="medium" color="brandColorText">
              {uploadLabel}
            </Text>
            <Text fontSize="2xs" color="fg.muted" lineHeight="1.2" lineClamp="1">
              {dropzone}
            </Text>
          </VStack>
        )}
        {loading && <Spinner size="sm" position="absolute" top="8px" left="8px" colorPalette="blue" />}
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </Box>
  );
}

function ColorField({
  label,
  value,
  onChange,
  swatches,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  swatches?: boolean;
}) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" color="brandColorText" mb={1.5}>
        {label}
      </Text>
      <HStack gap={2}>
        <Box
          as="label"
          boxSize="34px"
          borderRadius="md"
          borderWidth="1px"
          borderColor="border"
          flexShrink={0}
          cursor="pointer"
          style={{ background: value }}
          position="relative"
          overflow="hidden"
        >
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: "absolute",
              top: "-4px",
              left: "-4px",
              width: "60px",
              height: "60px",
              border: "none",
              cursor: "pointer",
              opacity: 0,
            }}
          />
        </Box>
        <Input
          variant="subtle"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          fontFamily="mono"
          spellCheck={false}
          maxLength={7}
          size="sm"
        />
      </HStack>
      {swatches && (
        <HStack gap={1.5} mt={2} wrap="wrap">
          {SWATCHES.map((c) => (
            <Box
              key={c}
              as="button"
              boxSize="18px"
              borderRadius="full"
              borderWidth={c.toLowerCase() === value.toLowerCase() ? "2px" : "1px"}
              borderColor={c.toLowerCase() === value.toLowerCase() ? "primaryMain" : "border"}
              style={{ background: c }}
              aria-label={c}
              onClick={() => onChange(c)}
            />
          ))}
        </HStack>
      )}
    </Box>
  );
}

export default BrandingForm;
