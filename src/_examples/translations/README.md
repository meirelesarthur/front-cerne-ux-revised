# Traduções do módulo de exemplo

**A tradução real deste exemplo NÃO mora aqui.** Se um módulo mantivesse seus
próprios textos numa pasta isolada, ele estaria fora do sistema de i18n do
projeto — e é exatamente esse o anti-padrão que esta camada de exemplo existe
para corrigir.

A tradução foi registrada **de verdade**, seguindo em tudo a mesma convenção dos
módulos de produto (`languageAdmin.ts`, `languageCommon.ts`, etc.), nestes
arquivos:

- **Interface** (contrato de tipos):
  `src/@types/language/module-examples/index.ts` → `ModuleExamples`
- **Registro na interface global**:
  `src/@types/language/index.d.ts` → campo `examples: ModuleExamples` em `LanguageDate`
- **Conteúdo por idioma** (1 arquivo por idioma):
  - `src/constants/languages/languagePtBr/languageExamples.ts`
  - `src/constants/languages/languageEnUs/languageExamples.ts`
  - `src/constants/languages/languageEsEs/languageExamples.ts`
- **Registro no agregado de cada idioma**:
  `src/constants/languages/{languagePtBr,languageEnUs,languageEsEs}/index.ts`
  → `examples: { ...languageExamples }`

No ponto de uso (páginas/componentes), o texto é lido navegando o caminho
completo a partir de `useLanguage()`:

```tsx
const { languageGB } = useLanguage();
// ...
<Text>{languageGB.examples.resource.list.pageTitle}</Text>
```

## Trecho ILUSTRATIVO do arquivo real

O trecho abaixo é **uma cópia ilustrativa** de
`src/constants/languages/languagePtBr/languageExamples.ts` — apenas para mostrar
como fica o arquivo de tradução de um módulo novo. **A fonte de verdade é o
arquivo real**, não esta cópia.

```ts
// src/constants/languages/languagePtBr/languageExamples.ts (trecho)
import { ModuleExamples } from "@/@types/language/module-examples";

export const languageExamples: ModuleExamples = {
  resource: {
    singularLabel: "Recurso",
    list: {
      pageTitle: "Recursos (Exemplo)",
      pageSubtitle:
        "Módulo de referência do padrão CRUD. Não faz parte dos módulos do GB Cerne.",
      // ...
    },
    // ...
  },
};
```
