import { format, isValid, parseISO, Locale } from 'date-fns';

interface OptionsProps {
  locale?: Locale;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  firstWeekContainsDate?: 1 | 4;
  useAdditionalWeekYearTokens?: boolean;
  useAdditionalDayOfYearTokens?: boolean;
}

/**
 * Formats a given date or ISO 8601 string using the specified pattern and options.
 *
 * @param {string | Date} date - The date or ISO 8601 string to format.
 * @param {string} pattern - The string pattern that specifies how the date should be formatted.
 * @param {OptionsProps} [options={}] - An optional object that contains additional configuration options for formatting the date.
 *
 * @return {string} The formatted date.
 */

export default function formatDate(
  date: string | Date,
  pattern = 'dd/MM/yyyy',
  options: OptionsProps = {},
): string {
  let parsedDate: Date;
  if (!date) return '--';

  if (typeof date === 'string') {
    parsedDate = parseISO(date);
    if (!isValid(parsedDate)) {
      console.error(`Error: Invalid ISO 8601 string. ISO String: ${date}`);
      return '';
    }
  } else {
    parsedDate = date;
    if (!isValid(parsedDate)) {
      console.error(`Error: Invalid date object. Date: ${date.toString()}`);
      return '';
    }
  }

  try {
    return format(parsedDate, pattern, options);
  } catch (error) {
    console.error(
      `Error: Unable to format date. Date: ${parsedDate.toString()}, Pattern: ${pattern}, Error: ${error}`,
    );
    return '';
  }
}
