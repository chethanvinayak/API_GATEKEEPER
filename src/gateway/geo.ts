/**
 * IP Geolocation and Origin Mapping for Security Heatmap
 */

export interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  flag: string;
}

const KNOWN_GEO_RANGES: Record<string, GeoLocation> = {
  '198.51.100': {
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    city: 'Ashburn, VA',
    lat: 39.0437,
    lng: -77.4875,
    flag: '🇺🇸'
  },
  '203.0.113': {
    country: 'Germany',
    countryCode: 'DE',
    region: 'Western Europe',
    city: 'Frankfurt',
    lat: 50.1109,
    lng: 8.6821,
    flag: '🇩🇪'
  },
  '192.0.2': {
    country: 'Netherlands',
    countryCode: 'NL',
    region: 'Western Europe',
    city: 'Amsterdam',
    lat: 52.3676,
    lng: 4.9041,
    flag: '🇳🇱'
  },
  '185.220.101': {
    country: 'Russia',
    countryCode: 'RU',
    region: 'Eastern Europe',
    city: 'Moscow',
    lat: 55.7558,
    lng: 37.6173,
    flag: '🇷🇺'
  },
  '103.251.167': {
    country: 'China',
    countryCode: 'CN',
    region: 'East Asia',
    city: 'Shanghai',
    lat: 31.2304,
    lng: 121.4737,
    flag: '🇨🇳'
  },
  '177.124.88': {
    country: 'Brazil',
    countryCode: 'BR',
    region: 'South America',
    city: 'São Paulo',
    lat: -23.5505,
    lng: -46.6333,
    flag: '🇧🇷'
  },
  '103.45.12': {
    country: 'India',
    countryCode: 'IN',
    region: 'South Asia',
    city: 'Bengaluru',
    lat: 12.9716,
    lng: 77.5946,
    flag: '🇮🇳'
  },
  '51.89.144': {
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'Western Europe',
    city: 'London',
    lat: 51.5074,
    lng: -0.1278,
    flag: '🇬🇧'
  },
  '13.212.14': {
    country: 'Singapore',
    countryCode: 'SG',
    region: 'Southeast Asia',
    city: 'Singapore',
    lat: 1.3521,
    lng: 103.8198,
    flag: '🇸🇬'
  },
  '13.239.55': {
    country: 'Australia',
    countryCode: 'AU',
    region: 'Oceania',
    city: 'Sydney',
    lat: -33.8688,
    lng: 151.2093,
    flag: '🇦🇺'
  },
  '185.199.108': {
    country: 'Canada',
    countryCode: 'CA',
    region: 'North America',
    city: 'Montreal',
    lat: 45.5017,
    lng: -73.5673,
    flag: '🇨🇦'
  },
  '106.187.52': {
    country: 'Japan',
    countryCode: 'JP',
    region: 'East Asia',
    city: 'Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    flag: '🇯🇵'
  }
};

/**
 * Resolves IP address to geolocation metadata deterministically
 */
export function resolveIpGeo(ip: string): GeoLocation {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    return {
      country: 'Local Network',
      countryCode: 'LOC',
      region: 'Internal / Direct',
      city: 'Local Gateway',
      lat: 37.7749,
      lng: -122.4194,
      flag: '🛡️'
    };
  }

  // Check known prefixes
  for (const [prefix, geo] of Object.entries(KNOWN_GEO_RANGES)) {
    if (ip.startsWith(prefix)) {
      return geo;
    }
  }

  // Deterministic hash mapping for arbitrary IPs
  const parts = ip.split('.').map(Number);
  const sum = parts.reduce((acc, curr) => acc + (isNaN(curr) ? 0 : curr), 0);
  const geoKeys = Object.values(KNOWN_GEO_RANGES);
  return geoKeys[sum % geoKeys.length];
}
