import { LanguageDate } from "./language";

export interface FilterModalProps<TFilter = any> {
  isOpen: boolean;
  onClose: () => void;
  handleReset: () => void;
  handleFilterChange: (data: TFilter) => void;
  filter?: TFilter | null;
  languageGB: LanguageDate;
}
