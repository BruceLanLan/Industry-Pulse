import { CryptoTicker, LongShortRatio } from "../types";

const BASE_URL = 'https://api.binance.com/api/v3';
// Switching to corsproxy.io as it is generally more reliable/faster for client-side requests than allorigins
const PROXY_URL = 'https://corsproxy.io/?';
const FUTURES_BASE = 'https://fapi.binance.com/fapi/v1';

export const fetchCryptoTickers = async (symbols: string[]): Promise<CryptoTicker[]> => {
  // Binance public API endpoint for 24hr ticker
  try {
    const symbolsParam = JSON.stringify(symbols.map(s => s.toUpperCase()));
    const url = `${BASE_URL}/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;
    
    // Note: Spot API sometimes allows direct CORS, but if it fails, a proxy might be needed. 
    // Currently assuming Spot works based on previous context.
    const response = await fetch(url);
    if (!response.ok) {
        // Try proxy fallback if direct spot fails
        const proxyUrl = `${PROXY_URL}${encodeURIComponent(url)}`;
        const proxyResponse = await fetch(proxyUrl);
        if(!proxyResponse.ok) throw new Error("Binance API Error (Spot)");
        const proxyData = await proxyResponse.json();
        const results = Array.isArray(proxyData) ? proxyData : [proxyData];
        return mapTickerData(results);
    }

    const data = await response.json();
    const results = Array.isArray(data) ? data : [data];
    return mapTickerData(results);

  } catch (error) {
    console.warn("Failed to fetch crypto spot data, trying proxy fallback...", error);
    return [];
  }
};

const mapTickerData = (results: any[]): CryptoTicker[] => {
    return results.map((item: any) => ({
      symbol: item.symbol,
      priceChangePercent: item.priceChangePercent,
      lastPrice: item.lastPrice,
      volume: item.volume,
      quoteVolume: item.quoteVolume,
      highPrice: item.highPrice,
      lowPrice: item.lowPrice
    }));
};

// Futures Data: Long/Short Ratio
export const fetchLongShortRatio = async (symbol: string = 'BTCUSDT', period: string = '5m'): Promise<LongShortRatio | null> => {
    try {
        const targetUrl = `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=1`;
        const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
        
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            return data[0] as LongShortRatio;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch Long/Short Ratio", error);
        return null;
    }
};

// Futures Data: Funding Rate
export const fetchFundingRate = async (symbol: string = 'BTCUSDT'): Promise<{lastFundingRate: string} | null> => {
    try {
        const targetUrl = `${FUTURES_BASE}/premiumIndex?symbol=${symbol}`;
        const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;

        const response = await fetch(url);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch Funding Rate", error);
        return null;
    }
};

// Futures Data: Open Interest
export const fetchOpenInterest = async (symbol: string = 'BTCUSDT'): Promise<{openInterest: string, openInterestAmount: string} | null> => {
    try {
        const targetUrl = `${FUTURES_BASE}/openInterest?symbol=${symbol}`;
        const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;

        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch Open Interest", error);
        return null;
    }
};
