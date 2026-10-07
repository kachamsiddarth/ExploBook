import { config } from '../config/index.js';
import type { ExpeditionPlace } from '@explobook/shared';

export type PlaceSearchQuery =
  | 'bookstores near me'
  | 'libraries near me'
  | 'parks near me'
  | 'museums near me'
  | 'historical places near me'
  | 'landmarks near me'
  | 'nature trails near me'
  | 'cultural places near me';

/**
 * Maps expedition types to sensible SerpApi place-search queries.
 */
export const EXPEDITION_TYPE_TO_QUERY: Record<string, PlaceSearchQuery> = {
  DISCOVERY: 'bookstores near me',
  HISTORICAL: 'historical places near me',
  NATURE: 'parks near me',
  LITERARY: 'libraries near me',
  WANDER: 'parks near me',
  OBSERVATION: 'parks near me',
  MYSTERY: 'landmarks near me',
};

export interface SerpApiLocalResult {
  position?: number;
  title?: string;
  place_id?: string;
  address?: string;
  rating?: number;
  type?: string;
  types?: string[];
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
  links?: {
    website?: string;
    directions?: string;
  };
}

export interface NearbyPlaceCandidate extends ExpeditionPlace {
  /** Source confirmed as SerpApi verified result */
  _source: 'serpapi';
}

export class SerpApiService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = config.serpapi?.apiKey;
  }

  /**
   * Discovers nearby real-world places using SerpApi Google Maps search.
   *
   * Security: API key is strictly server-side.
   * Privacy: Coordinates are used ephemerally for this request only.
   * Grounding: Gemma MUST NOT invent places — only use results returned here.
   *
   * @returns Normalized place candidates or empty array if SerpApi is unavailable.
   */
  async searchNearbyPlaces(params: {
    latitude: number;
    longitude: number;
    query: PlaceSearchQuery | string;
    radiusMeters?: number;
  }): Promise<NearbyPlaceCandidate[]> {
    if (!this.apiKey) {
      console.warn('[SerpApiService]: SERPAPI_KEY is not configured. Returning empty place candidates.');
      return [];
    }

    const { latitude, longitude, query, radiusMeters = 5000 } = params;

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.warn('[SerpApiService]: Invalid coordinates provided. Skipping place search.');
      return [];
    }

    const searchParams = new URLSearchParams({
      api_key: this.apiKey,
      engine: 'google_maps',
      q: query,
      ll: `@${latitude},${longitude},14z`,
      type: 'search',
      num: '5',
    });

    try {
      const response = await fetch(
        `https://serpapi.com/search.json?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (!response.ok) {
        console.warn(`[SerpApiService]: API returned HTTP ${response.status}. Returning empty candidates.`);
        return [];
      }

      const data = (await response.json()) as { local_results?: SerpApiLocalResult[] };
      const rawResults = data.local_results ?? [];

      return this.normalizeResults(rawResults, radiusMeters);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[SerpApiService]: Place search failed (${msg}). Returning empty candidates.`);
      return [];
    }
  }

  /**
   * Normalizes raw SerpApi local_results into the shared ExpeditionPlace structure.
   * Removes unusable results (no name or address).
   */
  private normalizeResults(
    raw: SerpApiLocalResult[],
    _radiusMeters: number
  ): NearbyPlaceCandidate[] {
    const results: NearbyPlaceCandidate[] = [];

    for (const item of raw) {
      if (!item.title) continue;

      const place: NearbyPlaceCandidate = {
        _source: 'serpapi',
        placeId: item.place_id,
        name: item.title,
        category: Array.isArray(item.types) ? item.types[0] : item.type,
        address: item.address,
        latitude: item.gps_coordinates?.latitude,
        longitude: item.gps_coordinates?.longitude,
        rating: item.rating,
        mapsUrl: item.links?.directions ?? item.links?.website,
      };

      results.push(place);
    }

    return results.slice(0, 5);
  }
}

export const serpApiService = new SerpApiService();
