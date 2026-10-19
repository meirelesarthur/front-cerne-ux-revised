export interface FilterProps<TFilter = any> {
  handleFilterChange: (data: TFilter) => void;
  filter?: TFilter;
  languageGB?: LanguageDate;
}
