// src/components/RichTextEditor/index.tsx
// -----------------------------------------------------------------------------
// Editor WYSIWYG reutilizável — decisão do dono §7.1 (contrato-front-
// atualizacoes-sistema.md, execução 031): Tiptap (`@tiptap/react` +
// `@tiptap/starter-kit` + extensões de Tabela/Imagem), dependência NOVA (não
// havia nenhum editor rich-text no `frontend_root` nem no Storybook `cerne`
// antes desta Tarefa — UX-GAP declarado no contrato, §2). Encapsulado aqui
// para ser reaproveitável por qualquer módulo futuro que precise de HTML
// rico, não amarrado a `SystemUpdate`.
//
// Toolbar mínima equivalente ao legado (Summernote): negrito, itálico,
// sublinhado, listas (com/sem marcador), tabela, link, imagem, limpar
// formatação, desfazer/refazer — capacidade, não a lib do legado (instrução
// do gatilho: "sem replicar a lib do legado, só a capacidade").
//
// Componente CONTROLADO: `value` é a string HTML (mesmo shape do contrato de
// API, `description: string`); `onChange(html)` é chamado a cada edição. A
// sincronização externa→interna (`fillForm`/`reset` do React Hook Form) só
// reescreve o conteúdo do editor quando ele não está em foco, para não
// atropelar o cursor do usuário digitando (padrão consolidado de wrappers
// controlados do Tiptap).
//
// Fidelidade ao design system `cerne`: como o `cerne` nunca desenhou esta
// tela nem um padrão de WYSIWYG (UX-GAP do contrato, §2), a casca usa o
// MESMO `Field` (label/erro/obrigatório) dos demais campos de formulário do
// projeto (`@/components/Form/Field`) e os MESMOS tokens semânticos
// (`border.subtle`/`bg.muted`/`fg.muted`/`fg.default`) — light+dark
// automáticos, sem cor hardcoded.
//
// CORREÇÃO PÓS-E2E (rodada 1, C5/C6 — correcoes-e2e-dev-rodada-1.md): as
// inserções de Imagem/Link usavam `window.prompt()` (paridade mínima,
// insuficiente) — o dev pediu paridade real com o modal do Summernote
// legado. `setLink`/`addImage` (baseadas em prompt) foram REMOVIDAS,
// substituídas por `RichTextLinkModal`/`RichTextImageModal` (Dialog Chakra
// v3, mesma casca `Dialog.Root/Portal/...` de `GerarDepreciacaoModal.tsx`/
// `SystemUpdatePendingModal.tsx`, deste mesmo módulo):
//   - Imagem: 2 opções (Enviar arquivo — reaproveita `@/components/Form/
//     ImageUpload`, o dropzone já consolidado do projeto — OU informar URL).
//     `[LACUNA]` não existe endpoint de storage para upload de imagem deste
//     editor no backend — a via "Enviar arquivo" converte o arquivo para
//     base64 (`FileReader.readAsDataURL`) e embute como `data:` URI no
//     próprio HTML de `description` (aceito por `sanitizeHtml`, que já
//     permite `data:` em `<img src>` — comportamento padrão do DOMPurify).
//     Sem round-trip com o servidor; registrado, não inventado endpoint novo.
//   - Link: modal com Texto para exibir / URL / "Abrir em nova janela"
//     (`target="_blank" rel="noopener noreferrer"`) / "Use default protocol"
//     (prefixa `http://` quando a URL não tem esquema, mesma semântica do
//     Summernote legado) — via extensão `Link` do `@tiptap/starter-kit` v3
//     (já embutida, `@tiptap/extension-link` é dependência transitiva do
//     kit nesta versão — confirmado em `node_modules`, nenhuma dependência
//     nova instalada para esta correção).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import {
  Box,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Portal,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Image } from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import {
  Bold,
  Eraser,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo,
} from 'lucide-react';

import { Button } from '@/components/Button';
import { Field } from '@/components/Form/Field';
import { ImageUpload } from '@/components/Form/ImageUpload';
import { Input } from '@/components/Form/Input';
import { Checkbox } from '@/components/ui/checkbox';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

interface ToolbarButtonProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

function ToolbarButton({ icon: IconEl, label, isActive, isDisabled, onClick }: ToolbarButtonProps) {
  return (
    <IconButton
      aria-label={label}
      title={label}
      size="xs"
      variant={isActive ? 'solid' : 'ghost'}
      colorPalette={isActive ? 'green' : 'gray'}
      disabled={isDisabled}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <IconEl size={16} />
    </IconButton>
  );
}

function Toolbar({
  editor,
  isDisabled,
  onOpenLinkModal,
  onOpenImageModal,
}: {
  editor: Editor;
  isDisabled?: boolean;
  onOpenLinkModal: () => void;
  onOpenImageModal: () => void;
}) {
  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <Flex
      align="center"
      gap={1}
      wrap="wrap"
      px={2}
      py={1.5}
      bg="bg.muted"
      borderBottom="1px solid"
      borderColor="border.subtle"
      borderTopRadius="md"
    >
      <ToolbarButton
        icon={Bold}
        label="Negrito"
        isActive={editor.isActive('bold')}
        isDisabled={isDisabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label="Itálico"
        isActive={editor.isActive('italic')}
        isDisabled={isDisabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        label="Sublinhado"
        isActive={editor.isActive('underline')}
        isDisabled={isDisabled}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <Separator orientation="vertical" height="20px" mx={1} />
      <ToolbarButton
        icon={List}
        label="Lista com marcadores"
        isActive={editor.isActive('bulletList')}
        isDisabled={isDisabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label="Lista numerada"
        isActive={editor.isActive('orderedList')}
        isDisabled={isDisabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <Separator orientation="vertical" height="20px" mx={1} />
      <ToolbarButton
        icon={Link2}
        label="Link"
        isActive={editor.isActive('link')}
        isDisabled={isDisabled}
        onClick={onOpenLinkModal}
      />
      <ToolbarButton
        icon={ImageIcon}
        label="Imagem"
        isDisabled={isDisabled}
        onClick={onOpenImageModal}
      />
      <ToolbarButton
        icon={TableIcon}
        label="Tabela"
        isDisabled={isDisabled}
        onClick={insertTable}
      />
      <Separator orientation="vertical" height="20px" mx={1} />
      <ToolbarButton
        icon={Eraser}
        label="Limpar formatação"
        isDisabled={isDisabled}
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      />
      <ToolbarButton
        icon={Undo}
        label="Desfazer"
        isDisabled={isDisabled}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={Redo}
        label="Refazer"
        isDisabled={isDisabled}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </Flex>
  );
}

export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder,
  helperText,
  error,
  isRequired,
  isDisabled,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      // CORREÇÃO PÓS-E2E (rodada 2, D1 — correcao-e2e-front-rodada-2.md):
      // `@tiptap/extension-image` tem `allowBase64: false` por padrão — a
      // regra de parse HTML vira `img[src]:not([src^="data:"])`, então TODA
      // vez que o editor reparseia HTML (`content` inicial no mount E
      // `editor.commands.setContent()` no useEffect de sincronização abaixo)
      // o `<img src="data:...">` embutido pela via "Enviar arquivo" (base64,
      // ver `RichTextImageModal`) é DESCARTADO do documento — a imagem só
      // aparece logo após a inserção (nó ProseMirror direto via `setImage`,
      // não passa por parse HTML) e some ao reabrir o registro (reset()/
      // reparse). `sanitizeHtml`/DOMPurify (RichTextContent, Visualização)
      // já permitia `data:` em `<img>` (comportamento padrão do DOMPurify) —
      // não era a causa. Fix: habilitar explicitamente `allowBase64` nesta
      // extensão (mesma allowlist de `data:image/...` do `sanitizeHtml`,
      // sem reabrir vetor de XSS — a extensão não valida esquema além do
      // `data:`, e o HTML segue sanitizado no read-only).
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value || '',
    editable: !isDisabled,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        'aria-label': label ?? 'Editor de texto rico',
      },
    },
  });

  // Sincroniza valor externo → editor (ex.: `reset()` do RHF ao carregar o
  // registro em modo edição) — só quando o editor NÃO está em foco, para não
  // atropelar o cursor de uma digitação em andamento (mesmo racional de
  // `InputDate`/campos controlados do projeto).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '';
    if (next !== current && !editor.isFocused) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isDisabled);
  }, [isDisabled, editor]);

  // Correção C5/C6 — estado dos modais de Link/Imagem (casca própria do
  // componente, não do formulário pai: `RichTextEditor` já é autocontido).
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <Field label={label} helperText={helperText} errorText={error} isRequired={isRequired}>
      <Box
        width="full"
        border="1px solid"
        borderColor={error ? 'feedBack.errorMain' : 'border.subtle'}
        borderRadius="md"
        overflow="hidden"
        opacity={isDisabled ? 0.6 : 1}
      >
        {editor && (
          <Toolbar
            editor={editor}
            isDisabled={isDisabled}
            onOpenLinkModal={() => setIsLinkModalOpen(true)}
            onOpenImageModal={() => setIsImageModalOpen(true)}
          />
        )}
        <Box
          minH="160px"
          maxH="360px"
          overflowY="auto"
          px={3}
          py={2}
          bg="bg.panel"
          css={{
            '& .ProseMirror': {
              outline: 'none',
              minHeight: '140px',
              color: 'fg.default',
              fontSize: 'sm',
            },
            '& .ProseMirror p.is-editor-empty:first-of-type::before': {
              content: 'attr(data-placeholder)',
              color: 'fg.muted',
              float: 'left',
              height: 0,
              pointerEvents: 'none',
            },
            '& p': { marginBottom: '0.5em' },
            '& ul, & ol': { paddingInlineStart: '1.5em', marginBottom: '0.5em' },
            '& a': { color: 'brandColorText', textDecoration: 'underline' },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              marginBottom: '0.75em',
            },
            '& th, & td': {
              border: '1px solid',
              borderColor: 'border.subtle',
              padding: '6px 8px',
            },
            '& th': { bg: 'bg.muted', fontWeight: 'semibold' },
            '& img': { maxWidth: '100%', borderRadius: 'sm' },
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      </Box>

      {editor && (
        <RichTextLinkModal
          editor={editor}
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
        />
      )}
      {editor && (
        <RichTextImageModal
          editor={editor}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </Field>
  );
}

// -----------------------------------------------------------------------------
// RichTextLinkModal (correção C6) — modal de inserção/edição de link, casca
// `Dialog` v3 headless mirror `GerarDepreciacaoModal.tsx` (mesmos `@ts-ignore`
// de tipos ainda incompatíveis da versão instalada). Campos literais pedidos
// pelo dev (paridade Summernote): "Texto para exibir" / "Para qual URL este
// link leva?" / "Abrir em uma nova janela" / "Use default protocol".
// -----------------------------------------------------------------------------

const URL_WITH_SCHEME_REGEXP = /^[a-z][a-z0-9+.-]*:/i;

interface RichTextLinkModalProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

function RichTextLinkModal({ editor, isOpen, onClose }: RichTextLinkModalProps) {
  const [displayText, setDisplayText] = useState('');
  const [url, setUrl] = useState('');
  const [openInNewWindow, setOpenInNewWindow] = useState(true);
  const [useDefaultProtocol, setUseDefaultProtocol] = useState(true);

  // Reidrata os campos a cada abertura — prefill com a seleção atual (texto
  // + link já existente sob o cursor, se houver), mirror do antigo
  // `window.prompt(previousUrl)`.
  useEffect(() => {
    if (!isOpen) return;
    const { state } = editor;
    const { from, to, empty } = state.selection;
    const selectedText = empty ? '' : state.doc.textBetween(from, to, ' ');
    const currentLinkAttrs = editor.getAttributes('link');
    setDisplayText(selectedText);
    setUrl((currentLinkAttrs.href as string | undefined) ?? '');
    setOpenInNewWindow(currentLinkAttrs.href ? currentLinkAttrs.target === '_blank' : true);
    setUseDefaultProtocol(true);
  }, [isOpen, editor]);

  const canInsert = url.trim().length > 0;

  function handleInsert() {
    if (!canInsert) return;

    let finalUrl = url.trim();
    // "Use default protocol" — mesma semântica do Summernote legado: se a
    // URL não tem esquema (nem é âncora/relativa), prefixa `http://` em vez
    // de deixar o link quebrado/relativo por engano.
    if (
      useDefaultProtocol &&
      !URL_WITH_SCHEME_REGEXP.test(finalUrl) &&
      !finalUrl.startsWith('#') &&
      !finalUrl.startsWith('/')
    ) {
      finalUrl = `http://${finalUrl}`;
    }

    const linkAttrs: Record<string, string | null> = {
      href: finalUrl,
      target: openInNewWindow ? '_blank' : null,
      rel: openInNewWindow ? 'noopener noreferrer' : null,
    };
    const label = displayText.trim() || finalUrl;

    // `extendMarkRange('link')` cobre o caso de EDITAR um link existente sob
    // o cursor (substitui o nó inteiro); `insertContent` também cobre
    // inserção nova, com ou sem seleção prévia (ProseMirror substitui a
    // seleção atual quando não-vazia, insere no cursor quando vazia).
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .insertContent({
        type: 'text',
        text: label,
        marks: [{ type: 'link', attrs: linkAttrs }],
      })
      .run();

    onClose();
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => !details.open && onClose()}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>Inserir Link</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <Input
                  label="Texto para exibir"
                  placeholder="Texto do link"
                  value={displayText}
                  onChange={(event) => setDisplayText(event.target.value)}
                />
                <Input
                  label="Para qual URL este link leva?"
                  placeholder="https://exemplo.com"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  isRequired
                />
                <Checkbox
                  checked={openInNewWindow}
                  onCheckedChange={(details: { checked: boolean | 'indeterminate' }) =>
                    setOpenInNewWindow(details.checked === true)
                  }
                >
                  Abrir em uma nova janela
                </Checkbox>
                <Checkbox
                  checked={useDefaultProtocol}
                  onCheckedChange={(details: { checked: boolean | 'indeterminate' }) =>
                    setUseDefaultProtocol(details.checked === true)
                  }
                >
                  Use default protocol
                </Checkbox>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button title="Cancelar" variant="outline" type="button" onClick={onClose} />
              <Button title="Inserir" type="button" onClick={handleInsert} disabled={!canInsert} />
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// -----------------------------------------------------------------------------
// RichTextImageModal (correção C5) — modal de inserção de imagem, mesma
// casca `Dialog` do link acima. 2 opções, mirror Summernote legado: subir
// arquivo (reaproveita `@/components/Form/ImageUpload`, dropzone já
// consolidado do projeto) OU informar URL. Ver nota de cabeçalho do arquivo
// para a LACUNA de upload server-side (sem endpoint dedicado — via base64).
// -----------------------------------------------------------------------------

interface RichTextImageModalProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

function RichTextImageModal({ editor, isOpen, onClose }: RichTextImageModalProps) {
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) return;
    setMode('url');
    setUrl('');
    setFile(null);
    setFileDataUrl(null);
    setFileError(undefined);
  }, [isOpen]);

  function handleFileSelected(selected: File | null) {
    setFile(selected);
    setFileError(undefined);
    if (!selected) {
      setFileDataUrl(null);
      return;
    }
    // Sem endpoint de storage para este editor (ver nota de cabeçalho) —
    // converte para base64 e embute como `data:` URI no HTML de
    // `description`. `sanitizeHtml` já permite `data:` em `<img src>`
    // (default do DOMPurify para a tag `img`).
    const reader = new FileReader();
    reader.onload = () => setFileDataUrl(reader.result as string);
    reader.onerror = () => setFileError('Não foi possível ler o arquivo selecionado.');
    reader.readAsDataURL(selected);
  }

  const canInsert = mode === 'url' ? url.trim().length > 0 : !!fileDataUrl;

  function handleInsert() {
    const src = mode === 'url' ? url.trim() : fileDataUrl;
    if (!src) return;
    editor.chain().focus().setImage({ src }).run();
    onClose();
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => !details.open && onClose()}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>Inserir Imagem</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <HStack gap={2}>
                  <Button
                    title="Informar URL"
                    size="sm"
                    type="button"
                    variant={mode === 'url' ? 'solid' : 'outline'}
                    onClick={() => setMode('url')}
                  />
                  <Button
                    title="Enviar arquivo"
                    size="sm"
                    type="button"
                    variant={mode === 'file' ? 'solid' : 'outline'}
                    onClick={() => setMode('file')}
                  />
                </HStack>

                {mode === 'url' ? (
                  <Input
                    label="URL da imagem"
                    placeholder="https://exemplo.com/imagem.png"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                  />
                ) : (
                  <>
                    <ImageUpload
                      label="Arquivo de imagem"
                      hint="Formatos aceitos: JPEG, PNG, JPG, GIF, SVG."
                      error={fileError}
                      file={file}
                      onFileSelected={handleFileSelected}
                      dropzoneTitle="Arraste uma imagem ou clique para selecionar"
                      dropzoneDraggingTitle="Solte a imagem aqui"
                      changeLabel="Trocar imagem"
                    />
                    <Text fontSize="xs" color="fg.muted">
                      [LACUNA] sem endpoint de upload de imagem no backend para este editor — o
                      arquivo é embutido como base64 no próprio conteúdo salvo (aumenta o tamanho do
                      campo). Avaliar endpoint de storage dedicado antes de uso com arquivos grandes
                      em produção.
                    </Text>
                  </>
                )}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button title="Cancelar" variant="outline" type="button" onClick={onClose} />
              <Button title="Inserir" type="button" onClick={handleInsert} disabled={!canInsert} />
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default RichTextEditor;
