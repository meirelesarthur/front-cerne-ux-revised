// src/constants/languages/languageEnUs/languageSystemLogs.ts
// en-US translation of the Log Viewer (execution 079). See
// `@/@types/language/module-system-logs` for the full contract.

import { ModuleSystemLogs } from '@/@types/language/module-system-logs';

export const languageSystemLogs: ModuleSystemLogs = {
  systemLog: {
    singularLabel: 'system-log',
    pluralLabel: 'system-logs',
    titleModule: 'System Logs',

    explorer: {
      pageTitle: 'System Logs',
      pageSubtitle:
        'Browse the platform log files, open one to read its latest lines or download the full file.',
      breadcrumbAriaLabel: 'Folder path',
      breadcrumbRoot: 'logs',
      table: {
        name: 'Name',
        size: 'Size',
        modifiedAt: 'Modified at',
        actions: 'Actions',
        folder: 'Folder',
        file: 'File',
        sortBy: 'Sort by',
      },
      actions: {
        open: 'Open',
        download: 'Download',
        refresh: 'Refresh',
      },
      filter: {
        placeholder: 'Filter by name',
        ariaLabel: 'Filter files and folders by name',
        clear: 'Clear filter',
      },
      truncatedNotice:
        'The listing was cut at the API limit. Use the name filter to find the file you need.',
      emptyState: {
        title: 'This folder is empty',
        description: 'There are no log files or folders here.',
      },
      noResultsState: {
        title: 'No items found',
        description: 'No file or folder matches the given filter.',
        clear: 'Clear filter',
      },
      notFoundState: {
        title: 'Folder not found',
        description: 'The given folder does not exist or was removed.',
        back: 'Back to logs',
      },
      error: {
        message: 'Could not load the log listing.',
        retry: 'Try again',
      },
    },

    viewer: {
      pageTitle: 'Log file',
      pageSubtitle: 'Showing the latest lines. Load older chunks as needed.',
      fields: { size: 'Size', modifiedAt: 'Modified at' },
      actions: {
        refresh: 'Refresh',
        download: 'Download',
        backToFolder: 'Back to folder',
        loadOlder: 'Load older',
        wrapLines: 'Wrap lines',
        backToEnd: 'Back to end of file',
        retry: 'Try again',
      },
      contentAriaLabel: 'Log file content',
      emptyFile: 'Empty file',
      startOfFile: 'Start of file',
      loadedSummary: 'Loaded: {lines} lines · {size}',
      limitReached: 'Viewing limit reached — download the file to see the rest.',
      lineTruncated: '…(line truncated in view)',
      partialLine:
        'A line is larger than the read block and is shown partially. Download the file to see the whole line.',
      sizeChangedWarning:
        'The file got smaller (rotation or truncation). The content was reloaded from the end.',
      contextNotice: 'Showing the context of a search match.',
      loadMoreError: 'Could not load more lines. The content already loaded was preserved.',
      error: { message: 'Could not load the file content.' },
      notFoundState: {
        title: 'File not found or removed (rotation)',
        description:
          'The file may have been rotated or deleted. Go back to the folder and open another file.',
        back: 'Back to folder',
      },
      binaryState: {
        title: 'Binary file',
        description: 'This file cannot be shown as text. Use the download.',
      },
      invalidCursorState: {
        title: 'The file changed since the last read',
        description: 'The read position is beyond the current file size. Reload to see the end.',
        action: 'Reload from the end',
      },
      missingPathState: {
        title: 'No file given',
        description: 'Open a file from the log listing.',
        back: 'Back to logs',
      },
    },

    search: {
      placeholder: 'Search the whole file',
      ariaLabel: 'Search text in the whole file',
      submit: 'Search',
      clear: 'Clear search',
      scopeNote:
        'The search scans the whole file, from the newest lines to the oldest. Press Enter to search.',
      minChars: 'Type at least {min} characters.',
      resultsTitle: 'Search results',
      resultCount: '{count} match(es) loaded',
      noResults: 'No matches found in the searched range.',
      loadMore: 'Keep searching older chunks',
      moreAvailable: 'Older parts of the file have not been searched yet.',
      openContext: 'Open context',
      lineTruncated: '(line truncated)',
      error: 'Could not search the file.',
    },

    download: {
      success: 'Download complete.',
      error: 'Could not download the file.',
      progress: 'Downloading… {percent}%',
      inProgress: 'Downloading…',
      ariaLabel: 'Download {name}',
    },
  },
};
