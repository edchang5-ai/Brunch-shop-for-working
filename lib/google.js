const PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';

const DETAILS_FIELDMASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.websiteUri',
  'places.openingHours',
  'places.reviews',
].join(',');

const SINGLE_FIELDMASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'types',
  'websiteUri',
  'openingHours',
  'reviews',
].join(',');

export class PlacesClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async searchText(query, count = 10) {
    const res = await fetch(PLACES_TEXT_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': DETAILS_FIELDMASK,
      },
      body: JSON.stringify({ textQuery: query, pageSize: count }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Places API 搜尋失敗 (${res.status}): ${text.slice(0, 500)}`);
    }

    const data = await res.json();
    return (data.places || []).map((p) => this.#toSummary(p));
  }

  async getDetails(placeId) {
    const url = `${PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': SINGLE_FIELDMASK,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Places API 取得詳細資訊失敗 (${res.status}): ${text.slice(0, 500)}`);
    }

    const data = await res.json();
    return {
      placeId,
      name: data.displayName?.text ?? '',
      address: data.formattedAddress ?? '',
      rating: data.rating ?? null,
      userRatingCount: data.userRatingCount ?? null,
      types: data.types ?? [],
      website: data.websiteUri ?? null,
      location: data.location ?? null,
      hours: data.openingHours?.weekdayDescriptions ?? [],
      reviews: (data.reviews || []).slice(0, 5).map((r) => r.text?.text ?? '').filter(Boolean),
    };
  }

  #toSummary(p) {
    return {
      placeId: p.id,
      name: p.displayName?.text ?? '',
      address: p.formattedAddress ?? '',
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? null,
      types: p.types ?? [],
      hasOpeningHours: !!p.openingHours?.weekdayDescriptions,
    };
  }
}
