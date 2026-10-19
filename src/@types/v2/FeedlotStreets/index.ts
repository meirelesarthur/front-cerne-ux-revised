// src/@types/v2/FeedlotStreets/index.ts
// Tipagem de FeedlotStreet ("Rua") — TASK-FE-042-207. Mirror 1:1
// `FeedlotStreetResource`/`FeedlotStreetRequest` (GB.Cerne.Api).

import type { FeedlotStreetOrientation } from '@/constants/FeedlotMap/feedlot-street-orientation';

import type { Option } from '@/@types/option';

export interface FeedlotStreetDetail {
  uuid: string;
  description: string;
  orientation: FeedlotStreetOrientation;
  line: number | null;
  column: number | null;
  created_at: string | null;
  updated_at: string | null;
}

// `feedlot_sector_uuid` só no CREATE (`required` no POST, `prohibited` no PUT/PATCH).
export interface CreateFeedlotStreetRequest {
  description: string;
  orientation: FeedlotStreetOrientation;
  feedlot_sector_uuid: string;
}

export interface UpdateFeedlotStreetRequest {
  description?: string;
  orientation?: FeedlotStreetOrientation;
}

export interface FeedlotStreetForm {
  description: string;
  orientation: Option<FeedlotStreetOrientation>;
}
