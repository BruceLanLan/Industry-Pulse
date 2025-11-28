import { GoogleGenAI } from "@google/genai";
import { BriefingData, NewsCardData, GroundingSource, AssetAnalysis } from "../types";

// Helper to generate a consistent ID from a string
const generateId = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

const parseNewsItems = (text: string): NewsCardData[] => {
  const items: NewsCardData[] = [];
  const chunks = text.split('### NEWS_ITEM ###');
  
  chunks.forEach(chunk => {
    if (!chunk.trim()) return;
    
    const titleMatch = chunk.match(/Title:\s*(.+)/);
    const summaryMatch = chunk.match(/Summary:\s*(.+)/);
    const tagsMatch = chunk.match(/Tags:\s*(.+)/);

    if (titleMatch && summaryMatch) {
      const title = titleMatch[1].trim();
      items.push({
        id: generateId(title),
        title: title,
        summary: summaryMatch[1].trim(),
        tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [],
        timestamp: Date.now()
      });
    }
  });

  return items;
};

const extractSection = (text: string, sectionName: string): string => {
    const regex = new RegExp(`# ${sectionName}\\s+([\\s\\S]*?)(?=# |$)`);
    const match = text.match(regex);
    return match ? match[1].trim() : "";
};

const parseAssetAnalysis = (text: string, sectionName: string): AssetAnalysis[] => {
    const raw = extractSection(text, sectionName);
    const lines = raw.split('\n').filter(l => l.trim().length > 0);
    const assets: AssetAnalysis[] = [];
    
    // Pattern: SYMBOL | Price | Change | Reason
    // e.g., NVDA | 178.9 | -0.9% | Reason...
    lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 4) {
            assets.push({
                ticker: parts[0],
                name: parts[0], // Simplified
                price: parts[1],
                change: parts[2],
                reason: parts[3]
            });
        }
    });
    return assets;
};

export const fetchIndustryBriefing = async (
  industry: string, 
  stockWatchlist: string[], 
  cryptoWatchlist: string[]
): Promise<BriefingData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const formatDate = (date: Date) => date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  
  const stocksList = stockWatchlist.join(', ');
  const cryptoList = cryptoWatchlist.join(', ');

  // Prompt updated to request Chinese output but keep English structure tags
  const prompt = `
    You are an elite financial analyst preparing a "Morning Briefing" (每日早报) for a professional trader.
    Time Window: ${formatDate(yesterday)} to ${formatDate(now)}.
    Language: Simplified Chinese (简体中文).

    [TASK 1: DATA GATHERING]
    Search for:
    1. Macro Market overview (Fed, Inflation, Global Tech Sentiment).
    2. Crypto Fear & Greed Index value.
    3. Latest prices and specific news for these STOCKS: [${stocksList}].
    4. Latest prices and specific news for these CRYPTOS: [${cryptoList}].
    5. General high-impact industry news for "${industry}".

    [TASK 2: FORMATTING]
    Format the output EXACTLY as follows (Keep the # HEADERS in English, write content in Chinese).

    # EXECUTIVE_SUMMARY
    [A concise paragraph in Chinese summarizing the most important event of the last 24h.]

    # MACRO_SUMMARY
    [One paragraph in Chinese on macro environment: S&P500/Nasdaq performance, Bond Yields, or Regulatory news.]

    # FEAR_GREED
    [Value 0-100] | [Label e.g. 极度恐惧]

    # STOCK_ANALYSIS
    (Format: Ticker | Price | Change% | One sentence analysis in Chinese of why it moved)
    ${stockWatchlist.map(s => `${s} | ... | ... | ...`).join('\n')}

    # CRYPTO_ANALYSIS
    (Format: Ticker | Price | Change% | One sentence analysis in Chinese of why it moved)
    ${cryptoWatchlist.map(c => `${c} | ... | ... | ...`).join('\n')}

    # KEY_TRENDS
    - [Trend 1 in Chinese]
    - [Trend 2 in Chinese]
    - [Trend 3 in Chinese]

    # SENTIMENT
    SENTIMENT_TYPE: [Positive/Neutral/Negative/Mixed]
    SENTIMENT_SCORE: [0-100]

    # DETAILED_NEWS
    (Find 5-7 distinct, high-impact news flashes. Use delimiter "### NEWS_ITEM ###").

    ### NEWS_ITEM ###
    Title: [Headline in Chinese]
    Summary: [Concise summary in Chinese]
    Tags: [Tag1, Tag2]
    
    ### NEWS_ITEM ###
    Title: [Headline 2]
    Summary: [Summary]
    Tags: [Tags]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No content generated.";
    
    // Parsing
    const summary = extractSection(text, "EXECUTIVE_SUMMARY");
    const macroSummary = extractSection(text, "MACRO_SUMMARY");
    
    const fgRaw = extractSection(text, "FEAR_GREED");
    const fgParts = fgRaw.split('|').map(s => s.trim());
    const fearGreedIndex = { 
        value: fgParts[0] || "50", 
        label: fgParts[1] || "Neutral" 
    };

    const stockAnalysis = parseAssetAnalysis(text, "STOCK_ANALYSIS");
    const cryptoAnalysis = parseAssetAnalysis(text, "CRYPTO_ANALYSIS");

    const trendsRaw = extractSection(text, "KEY_TRENDS");
    const keyTrends = trendsRaw.split('- ').map(t => t.trim()).filter(t => t.length > 0);

    // Sentiment Extraction
    const scoreMatch = text.match(/SENTIMENT_SCORE:\s*(\d+)/);
    const typeMatch = text.match(/SENTIMENT_TYPE:\s*(Positive|Neutral|Negative|Mixed)/i);
    const sentimentScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    const sentiment = (typeMatch ? typeMatch[1] : 'Neutral') as any;

    const newsItems = parseNewsItems(text);

    // Sources
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach(chunk => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri || "#"
          });
        }
      });
    }

    return {
      industry,
      date: new Date().toLocaleDateString(),
      timeRange: "Last 24 Hours",
      summary,
      macroSummary,
      sentiment,
      sentimentScore,
      fearGreedIndex,
      keyTrends,
      stockAnalysis,
      cryptoAnalysis,
      rawText: text,
      sources: sources.slice(0, 8),
      newsItems
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
