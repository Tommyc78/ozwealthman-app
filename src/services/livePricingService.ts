import { demoData } from '@/data/seed';
import {
  getCryptoPrice,
  getETFPrice,
  getFallbackQuoteFromStoredPrice,
  getGoldSpotPrice,
  getSilverSpotPrice,
  PriceQuote,
} from './pricing';

function withStoredFallback(quote: PriceQuote, fallback: PriceQuote) {
  return quote.status === 'available' || quote.status === 'stale' ? quote : fallback;
}

export async function getBullionSpotQuotes() {
  const [goldQuote, silverQuote] = await Promise.all([getGoldSpotPrice(), getSilverSpotPrice()]);
  const goldFallbackLot = demoData.bullionLots.find((lot) => lot.metal_type === 'gold');
  const silverFallbackLot = demoData.bullionLots.find((lot) => lot.metal_type === 'silver');

  return {
    gold: withStoredFallback(
      goldQuote,
      getFallbackQuoteFromStoredPrice({
        assetClass: 'metal',
        symbol: 'XAU',
        name: 'Gold spot',
        storedPrice: goldFallbackLot?.current_spot_price ?? 0,
        unit: 'oz',
      }),
    ),
    silver: withStoredFallback(
      silverQuote,
      getFallbackQuoteFromStoredPrice({
        assetClass: 'metal',
        symbol: 'XAG',
        name: 'Silver spot',
        storedPrice: silverFallbackLot?.current_spot_price ?? 0,
        unit: 'kg',
      }),
    ),
  };
}

export async function getPortfolioMarketQuotes() {
  const etfSymbols = Array.from(new Set(demoData.shareHoldings.map((holding) => holding.symbol)));
  const cryptoSymbols = Array.from(new Set(demoData.cryptoHoldings.map((holding) => holding.symbol)));

  const [etfQuotes, cryptoQuotes, bullionQuotes] = await Promise.all([
    Promise.all(
      etfSymbols.map(async (symbol) => {
        const quote = await getETFPrice(symbol);
        const holding = demoData.shareHoldings.find((item) => item.symbol === symbol);
        return withStoredFallback(
          quote,
          getFallbackQuoteFromStoredPrice({
            assetClass: 'etf',
            symbol,
            name: holding?.name ?? `${symbol} ETF`,
            storedPrice: holding?.current_price ?? 0,
          }),
        );
      }),
    ),
    Promise.all(
      cryptoSymbols.map(async (symbol) => {
        const quote = await getCryptoPrice(symbol);
        const holding = demoData.cryptoHoldings.find((item) => item.symbol === symbol);
        return withStoredFallback(
          quote,
          getFallbackQuoteFromStoredPrice({
            assetClass: 'crypto',
            symbol,
            name: holding?.name ?? symbol,
            storedPrice: holding?.current_price ?? 0,
          }),
        );
      }),
    ),
    getBullionSpotQuotes(),
  ]);

  return {
    etfs: etfQuotes,
    crypto: cryptoQuotes,
    bullion: bullionQuotes,
  };
}
