import { MetalType } from '@/types/models';

export type PriceAssetClass = 'metal' | 'etf' | 'crypto';
export type PriceStatus = 'available' | 'unavailable' | 'stale' | 'error';

export type PriceQuote = {
  assetClass: PriceAssetClass;
  symbol: string;
  name: string;
  currency: 'AUD';
  unit?: string;
  price: number | null;
  status: PriceStatus;
  source: string | null;
  updatedAt: string | null;
  message?: string;
};

export type MetalSpotRequest = {
  metalType: MetalType;
  currency?: 'AUD';
};

export type MarketPriceRequest = {
  symbol: string;
  currency?: 'AUD';
};

export interface MetalPriceProvider {
  getGoldSpot(request?: Omit<MetalSpotRequest, 'metalType'>): Promise<PriceQuote>;
  getSilverSpot(request?: Omit<MetalSpotRequest, 'metalType'>): Promise<PriceQuote>;
}

export interface ETFPriceProvider {
  getETFPrice(request: MarketPriceRequest): Promise<PriceQuote>;
}

export interface CryptoPriceProvider {
  getCryptoPrice(request: MarketPriceRequest): Promise<PriceQuote>;
}

export interface LivePricingProvider extends MetalPriceProvider, ETFPriceProvider, CryptoPriceProvider {
  providerName: string;
}

function unavailableQuote(assetClass: PriceAssetClass, symbol: string, name: string, unit?: string): PriceQuote {
  return {
    assetClass,
    symbol,
    name,
    currency: 'AUD',
    unit,
    price: null,
    status: 'unavailable',
    source: null,
    updatedAt: null,
    message: 'Live pricing is not connected yet. Showing stored values where available.',
  };
}

export class UnconfiguredPricingProvider implements LivePricingProvider {
  providerName = 'unconfigured';

  async getGoldSpot() {
    return unavailableQuote('metal', 'XAU', 'Gold spot', 'oz');
  }

  async getSilverSpot() {
    return unavailableQuote('metal', 'XAG', 'Silver spot', 'kg');
  }

  async getETFPrice({ symbol }: MarketPriceRequest) {
    return unavailableQuote('etf', symbol.toUpperCase(), `${symbol.toUpperCase()} ETF`);
  }

  async getCryptoPrice({ symbol }: MarketPriceRequest) {
    return unavailableQuote('crypto', symbol.toUpperCase(), symbol.toUpperCase());
  }
}

export class SeededDemoPricingProvider implements LivePricingProvider {
  providerName = 'seeded-demo';

  async getGoldSpot() {
    return {
      assetClass: 'metal',
      symbol: 'XAU',
      name: 'Gold spot',
      currency: 'AUD',
      unit: 'oz',
      price: 4250,
      status: 'stale',
      source: 'Seeded demo data',
      updatedAt: '2026-04-18T00:00:00.000Z',
      message: 'Demo price only. Replace provider before using live market data.',
    } satisfies PriceQuote;
  }

  async getSilverSpot() {
    return {
      assetClass: 'metal',
      symbol: 'XAG',
      name: 'Silver spot',
      currency: 'AUD',
      unit: 'kg',
      price: 1510,
      status: 'stale',
      source: 'Seeded demo data',
      updatedAt: '2026-04-18T00:00:00.000Z',
      message: 'Demo price only. Replace provider before using live market data.',
    } satisfies PriceQuote;
  }

  async getETFPrice({ symbol }: MarketPriceRequest) {
    const normalized = symbol.toUpperCase();
    const demoPrices: Record<string, { name: string; price: number }> = {
      IVV: { name: 'iShares S&P 500 ETF', price: 171.2 },
      VAS: { name: 'Vanguard Australian Shares ETF', price: 101.4 },
      VGS: { name: 'Vanguard MSCI International Shares ETF', price: 124.8 },
    };
    const quote = demoPrices[normalized];
    if (!quote) {
      return unavailableQuote('etf', normalized, `${normalized} ETF`);
    }
    return {
      assetClass: 'etf',
      symbol: normalized,
      name: quote.name,
      currency: 'AUD',
      price: quote.price,
      status: 'stale',
      source: 'Seeded demo data',
      updatedAt: '2026-04-18T00:00:00.000Z',
      message: 'Demo price only. Replace provider before using live market data.',
    } satisfies PriceQuote;
  }

  async getCryptoPrice({ symbol }: MarketPriceRequest) {
    const normalized = symbol.toUpperCase();
    const demoPrices: Record<string, { name: string; price: number }> = {
      BTC: { name: 'Bitcoin', price: 142000 },
    };
    const quote = demoPrices[normalized];
    if (!quote) {
      return unavailableQuote('crypto', normalized, normalized);
    }
    return {
      assetClass: 'crypto',
      symbol: normalized,
      name: quote.name,
      currency: 'AUD',
      price: quote.price,
      status: 'stale',
      source: 'Seeded demo data',
      updatedAt: '2026-04-18T00:00:00.000Z',
      message: 'Demo price only. Replace provider before using live market data.',
    } satisfies PriceQuote;
  }
}

let pricingProvider: LivePricingProvider = new UnconfiguredPricingProvider();

export function setPricingProvider(provider: LivePricingProvider) {
  pricingProvider = provider;
}

export function getPricingProvider() {
  return pricingProvider;
}

export async function getGoldSpotPrice() {
  return pricingProvider.getGoldSpot({ currency: 'AUD' });
}

export async function getSilverSpotPrice() {
  return pricingProvider.getSilverSpot({ currency: 'AUD' });
}

export async function getMetalSpotPrice(metalType: MetalType) {
  return metalType === 'gold' ? getGoldSpotPrice() : getSilverSpotPrice();
}

export async function getETFPrice(symbol: string) {
  return pricingProvider.getETFPrice({ symbol, currency: 'AUD' });
}

export async function getCryptoPrice(symbol: string) {
  return pricingProvider.getCryptoPrice({ symbol, currency: 'AUD' });
}

export function getFallbackQuoteFromStoredPrice(params: {
  assetClass: PriceAssetClass;
  symbol: string;
  name: string;
  storedPrice: number;
  unit?: string;
}): PriceQuote {
  return {
    assetClass: params.assetClass,
    symbol: params.symbol,
    name: params.name,
    currency: 'AUD',
    unit: params.unit,
    price: params.storedPrice,
    status: 'stale',
    source: 'Stored portfolio value',
    updatedAt: null,
    message: 'Live pricing unavailable. Using the last stored price from portfolio data.',
  };
}
