// src/pages/Configuracoes/Config/VideoIntroUploadSection.tsx
// -----------------------------------------------------------------------------
// Upload do Vídeo Institucional — execução 032, TASK-FE-2602. Endpoint
// PRÓPRIO e DECOUPLED (`POST /config/video-intro`) do `PUT /config` da tela
// principal (TASK-FE-2601) — dispara IMEDIATAMENTE ao selecionar o arquivo,
// sem esperar o botão "Salvar" da seção de settings (que nem existe aqui, é
// uma mutation própria). Mirror EXATO de `BrandingForm.tsx`/`uploadLogo`
// (chamado direto do handler de seleção, sem passar pelo submit do form
// principal) — contrato de tela §4.3.
//
// `onRemove` é NO-OP documentado (não removido — assinatura obrigatória do
// `FileUpload`): o contrato de API não expõe `DELETE` para `video_intro` (só
// substituição via novo upload, §6.4/§8). `file={null}` sempre — mirror
// literal do contrato §4.3 (o upload é imediato; não há estado de "arquivo
// selecionado, aguardando salvar" intermediário para exibir).
// -----------------------------------------------------------------------------

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { uploadConfigVideoIntro } from '@/services/v2/Configuracoes/Config/config-service';

interface VideoIntroUploadSectionProps {
  videoIntroUrl: string | null;
  disabled?: boolean;
}

export function VideoIntroUploadSection({
  videoIntroUrl,
  disabled = false,
}: VideoIntroUploadSectionProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.configuracoes.config;
  const queryClient = useQueryClient();

  const uploadVideoMutation = useMutation({
    mutationFn: (file: File) => uploadConfigVideoIntro(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.configuracoes.config] });
      toaster.success({
        title: text.singularLabel,
        description: text.videoIntro.successToast,
        duration: 7000,
      });
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiFieldErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  return (
    <FileUpload
      accept=".mp4,.mov,.avi"
      maxSizeMb={100}
      file={null}
      onFileSelected={(file) => file && uploadVideoMutation.mutate(file)}
      onRemove={() => {}}
      currentFileUrl={videoIntroUrl}
      dropzoneTitle={text.videoIntro.uploadCta}
      changeLabel={text.videoIntro.replaceCta}
      replaceLabel={text.videoIntro.replaceCta}
      removeLabel={languageGB.defaltStrings.delete}
      disabled={disabled || uploadVideoMutation.isPending}
    />
  );
}

export default VideoIntroUploadSection;
