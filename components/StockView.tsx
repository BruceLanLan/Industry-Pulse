import React, { useState, useEffect } from 'react';
import { StockTicker } from '../types';
import { Search, TrendingUp, TrendingDown, Activity, Star, Plus, BarChart2, Globe, ChevronDown, ChevronUp, X } from 'lucide-react';

interface StockViewProps {
  watchlist: string[];
}

// Extend window interface for TradingView
declare global {
  interface Window {
    TradingView: any;
  }
}

// Map Tickers to Chinese Names for better UI
const STOCK_NAMES: Record<string, string> = {
    'SPX': '标普500',
    'IXIC': '纳斯达克',
    'NVDA': '英伟达',
    'TSLA': '特斯拉',
    'GOOG': '谷歌',
    'AAPL': '苹果',
    'MSFT': '微软',
    'AMZN': '亚马逊',
    'META': 'Meta',
    'AMD': 'AMD',
    'COIN': 'Coinbase',
    'HOOD': 'Robinhood',
    'MSTR': 'MicroStrategy',
    'PLTR': 'Palantir',
    'CRCL': 'Circle'
};

const generateMockData = (symbols: string[]): StockTicker[] => {
    return symbols.map(sym => {
        const timeFactor = Date.now() / 10000; 
        const basePrice = sym === 'NVDA' ? 140 : sym === 'TSLA' ? 350 : sym === 'SPX' ? 5900 : sym === 'IXIC' ? 18000 : 100 + (sym.length * 20);
        const noise = Math.sin(timeFactor + sym.charCodeAt(0)) * (basePrice * 0.005);
        const price = basePrice + noise;
        const changePercent = (Math.sin(timeFactor * 0.5 + sym.charCodeAt(1)) * 1.5);
        
        return {
            symbol: sym,
            name: STOCK_NAMES[sym] || sym, 
            price: price,
            change: noise,
            changePercent: changePercent,
            volume: (Math.abs(noise * 1000000) + 5000000).toFixed(0)
        };
    });
};

const TradingViewChart = ({ symbol }: { symbol: string }) => {
    const containerId = `tv-chart-${symbol}`;
  
    useEffect(() => {
      const scriptId = 'tradingview-widget-script';
      
      const initWidget = () => {
        if (window.TradingView) {
          // Adjust symbol for indices if needed
          let tvSymbol = symbol;
          if (symbol === 'SPX') tvSymbol = 'SP:SPX';
          if (symbol === 'IXIC') tvSymbol = 'NASDAQ:IXIC';

          new window.TradingView.widget({
            "width": "100%",
            "height": 500,
            "symbol": tvSymbol,
            "interval": "D",
            "timezone": "Asia/Shanghai",
            "theme": "light",
            "style": "1",
            "locale": "zh_CN",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "allow_symbol_change": false,
            "container_id": containerId,
            "hide_side_toolbar": false
          });
        }
      };
  
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = initWidget;
        document.head.appendChild(script);
      } else {
        // If script exists, just init immediately (or small timeout to ensure load)
        setTimeout(initWidget, 100);
      }
    }, [symbol]);
  
    return (
        <div className="w-full bg-white border-t border-gray-100 p-4 animate-in slide-in-from-top-2">
            <div id={containerId} className="w-full h-[500px] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" />
        </div>
    );
};

const StockView: React.FC<StockViewProps> = ({ watchlist }) => {
  const [tickers, setTickers] = useState<StockTicker[]>([]);
  const [activeTab, setActiveTab] = useState<'market' | 'favorites'>('market');
  const [filterText, setFilterText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  
  // Local state for favorites (since we don't have a global stock watchlist prop in App yet like crypto)
  const [favorites, setFavorites] = useState<string[]>(watchlist);

  // Market symbols (Mocking a "Top List")
  const marketSymbols = Array.from(new Set([...watchlist, 'AAPL', 'MSFT', 'AMZN', 'META', 'AMD', 'MSTR', 'PLTR']));

  useEffect(() => {
    // Initial Load
    const symbolsToLoad = activeTab === 'market' ? marketSymbols : favorites;
    setTickers(generateMockData(symbolsToLoad));

    // Simulate Live Ticks
    const interval = setInterval(() => {
        setTickers(generateMockData(symbolsToLoad));
    }, 2000);

    return () => clearInterval(interval);
  }, [watchlist, activeTab, favorites]);

  const handleAddSymbol = (e: React.FormEvent) => {
      e.preventDefault();
      if(newSymbol && !favorites.includes(newSymbol.toUpperCase())) {
          setFavorites([...favorites, newSymbol.toUpperCase()]);
      }
      setNewSymbol('');
      setIsAdding(false);
  };

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(symbol)) {
        setFavorites(favorites.filter(s => s !== symbol));
    } else {
        setFavorites([...favorites, symbol]);
    }
  };

  const toggleExpand = (symbol: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedSymbol(expandedSymbol === symbol ? null : symbol);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatVolume = (vol: string) => {
    const v = parseFloat(vol);
    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + 'B';
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
    return v.toFixed(2);
  };

  const displayedTickers = tickers.filter(t => t.symbol.toLowerCase().includes(filterText.toLowerCase()));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-semibold text-gray-900">美股市场 (Stock Market)</h2>
            <p className="text-sm text-gray-500">追踪全球核心资产与指数</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
             <Activity size={14} />
             <span className="font-mono font-medium">模拟实时数据 (Live)</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
         
         {/* Left Controls */}
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
                <button 
                  onClick={() => setActiveTab('market')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'market' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  热门市场
                </button>
                <button 
                  onClick={() => setActiveTab('favorites')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'favorites' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  我的自选
                </button>
            </div>

             {/* Add Button */}
             <div className="relative ml-auto md:ml-0">
                {isAdding ? (
                    <form onSubmit={handleAddSymbol} className="absolute top-1/2 -translate-y-1/2 left-0 z-10 flex items-center bg-white shadow-lg border rounded-lg p-1 w-48 animate-in slide-in-from-left-2">
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full text-sm outline-none px-2 uppercase" 
                            placeholder="AAPL" 
                            value={newSymbol}
                            onChange={(e) => setNewSymbol(e.target.value)}
                            onBlur={() => setTimeout(() => setIsAdding(false), 200)}
                        />
                        <button type="submit" className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Plus size={16}/></button>
                    </form>
                ) : (
                    <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors bg-blue-50/50">
                        <Plus size={16} /> <span className="hidden sm:inline">添加代码</span>
                    </button>
                )}
            </div>
         </div>

         {/* Right Controls */}
         <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text" 
                placeholder="搜索股票代码..." 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
         </div>
      </div>

      {/* Table Layout */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                            <Star size={14} className="fill-gray-300 text-gray-300" />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            标的 (Ticker)
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                            价格 (Price)
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                            成交量 (Vol)
                        </th>
                         <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                            24h 涨跌幅
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider w-16">
                            图表
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {displayedTickers.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                                {activeTab === 'favorites' ? "暂无自选股票，请在热门市场添加。" : "加载中..."}
                            </td>
                        </tr>
                    )}

                    {displayedTickers.map((ticker) => {
                         const isPositive = ticker.changePercent >= 0;
                         const isFav = favorites.includes(ticker.symbol);
                         const isExpanded = expandedSymbol === ticker.symbol;
                         let badgeClass = isPositive ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fee2e2] text-[#991b1b]";
                         
                         return (
                            <React.Fragment key={ticker.symbol}>
                                <tr className={`group transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4 cursor-pointer" onClick={(e) => toggleFavorite(ticker.symbol, e)}>
                                        <Star 
                                            size={16} 
                                            className={`transition-all ${isFav ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-transparent group-hover:text-yellow-400'}`} 
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{ticker.symbol}</span>
                                            <span className="text-xs text-gray-400">{ticker.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-medium font-mono text-gray-900">
                                            ${formatPrice(ticker.price)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-500 tabular-nums">
                                        {formatVolume(ticker.volume)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`inline-flex items-center justify-end w-20 px-2 py-1.5 rounded-md text-xs font-bold tabular-nums ${badgeClass}`}>
                                            {ticker.changePercent > 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right cursor-pointer" onClick={(e) => toggleExpand(ticker.symbol, e)}>
                                        <div className={`p-2 rounded-full hover:bg-gray-200 inline-flex transition-transform ${isExpanded ? 'bg-gray-200 rotate-180' : ''}`}>
                                            <ChevronDown size={16} className="text-gray-500" />
                                        </div>
                                    </td>
                                </tr>
                                {/* Expanded Row for Chart */}
                                {isExpanded && (
                                    <tr>
                                        <td colSpan={6} className="p-0">
                                            <TradingViewChart symbol={ticker.symbol} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                         );
                    })}
                </tbody>
            </table>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200">
        <strong>提示:</strong> 列表数据为模拟值，但展开图表(TradingView)会加载真实的市场行情。
      </div>
    </div>
  );
};

export default StockView;
