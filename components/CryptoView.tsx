import React, { useState, useEffect, useRef } from 'react';
import { CryptoTicker } from '../types';
import { fetchCryptoTickers } from '../services/binance';
import { Search, Star, Plus, ExternalLink, Twitter, BarChart2, Globe } from 'lucide-react';

interface CryptoViewProps {
  watchlist: string[];
  onUpdateWatchlist: (newList: string[]) => void;
}

const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'TRXUSDT', 'DOTUSDT',
  'MATICUSDT', 'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'ATOMUSDT',
  'UNIUSDT', 'FILUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT'
];

const CryptoView: React.FC<CryptoViewProps> = ({ watchlist, onUpdateWatchlist }) => {
  const [tickers, setTickers] = useState<CryptoTicker[]>([]);
  const [activeTab, setActiveTab] = useState<'market' | 'favorites'>('market');
  const [filterText, setFilterText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');

  // Determine which symbols to fetch based on active tab
  // If in Market, we fetch popular + watchlist (to show star status correctly)
  // If in Favorites, only watchlist
  const symbolsToFetch = React.useMemo(() => {
    if (activeTab === 'market') {
      // Merge popular and watchlist, deduplicate
      return Array.from(new Set([...POPULAR_SYMBOLS, ...watchlist]));
    }
    return watchlist;
  }, [activeTab, watchlist]);

  const loadData = async () => {
    if (symbolsToFetch.length === 0) {
        setTickers([]);
        return;
    }
    try {
      const data = await fetchCryptoTickers(symbolsToFetch);
      setTickers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000); // 1 second update
    return () => clearInterval(interval);
  }, [symbolsToFetch]);

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol) return;
    const formatted = newSymbol.toUpperCase().trim();
    const symbolToAdd = formatted.endsWith('USDT') || formatted.endsWith('BTC') ? formatted : `${formatted}USDT`;
    
    if (!watchlist.includes(symbolToAdd)) {
        onUpdateWatchlist([...watchlist, symbolToAdd]);
    }
    setNewSymbol('');
    setIsAdding(false);
    // Switch to favorites to see the new addition or stay in market if it's there
  };

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (watchlist.includes(symbol)) {
      onUpdateWatchlist(watchlist.filter(s => s !== symbol));
    } else {
      onUpdateWatchlist([...watchlist, symbol]);
    }
  };

  const formatVolume = (vol: string) => {
    const v = parseFloat(vol);
    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + 'B';
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
    if (v >= 1_000) return (v / 1_000).toFixed(2) + 'K';
    return v.toFixed(2);
  };

  const formatPrice = (price: string) => {
    const p = parseFloat(price);
    if (p < 1) return p.toPrecision(4);
    return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Filter the tickers based on search text AND the current tab logic
  const displayedTickers = tickers.filter(t => {
    const matchesSearch = t.symbol.toLowerCase().includes(filterText.toLowerCase());
    if (activeTab === 'favorites') {
      return matchesSearch && watchlist.includes(t.symbol);
    }
    // Market tab: show all fetched (popular + watchlist)
    return matchesSearch; 
  }).sort((a, b) => {
     // Optional: Sort by Favorites first, then Volume desc
     const aFav = watchlist.includes(a.symbol) ? 1 : 0;
     const bFav = watchlist.includes(b.symbol) ? 1 : 0;
     if (activeTab === 'market') {
         // Sort by volume in Market view usually
         return parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume);
     }
     return 0;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Binance 现货市场</h2>
        <div className="flex items-center gap-2 text-sm text-green-500 bg-green-50 px-3 py-1 rounded-full border border-green-100 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="font-mono font-medium">实时数据 (1s)</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Left Controls */}
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto no-scrollbar">
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
                  自选关注
                </button>
            </div>
            <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap hidden md:block">
              {activeTab === 'market' ? '交易量排名' : '你的关注列表'}
            </span>
            
            {/* Add Button */}
            <div className="relative ml-auto md:ml-0">
                {isAdding ? (
                    <form onSubmit={handleAddSymbol} className="absolute top-1/2 -translate-y-1/2 left-0 z-10 flex items-center bg-white shadow-lg border rounded-lg p-1 w-48 animate-in slide-in-from-left-2">
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full text-sm outline-none px-2 uppercase" 
                            placeholder="ETHUSDT" 
                            value={newSymbol}
                            onChange={(e) => setNewSymbol(e.target.value)}
                            onBlur={() => setTimeout(() => setIsAdding(false), 200)}
                        />
                        <button type="submit" className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Plus size={16}/></button>
                    </form>
                ) : (
                    <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors bg-blue-50/50">
                        <Plus size={16} /> <span className="hidden sm:inline">添加币种</span>
                    </button>
                )}
            </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                <span className="text-gray-400">计价:</span>
                <span className="font-medium">USDT</span>
             </div>
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="搜索币种..." 
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
             </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                            <Star size={14} className="fill-gray-300 text-gray-300" />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            币种 (Token)
                        </th>
                         <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            链接
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                            价格 (Price)
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                            24h 成交量
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                            24h 最高
                        </th>
                         <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                            24h 最低
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                            24h 涨跌幅
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {displayedTickers.length === 0 && (
                        <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                                {activeTab === 'favorites' 
                                    ? "暂无自选，请在市场页面添加！" 
                                    : "加载市场数据中..."}
                            </td>
                        </tr>
                    )}
                    
                    {displayedTickers.map((ticker) => {
                        const change = parseFloat(ticker.priceChangePercent);
                        const isPositive = change >= 0;
                        const isZero = change === 0;
                        const isFav = watchlist.includes(ticker.symbol);
                        
                        // Link Generators
                        const baseSymbol = ticker.symbol.replace('USDT', '');
                        const binanceLink = `https://www.binance.com/en/trade/${baseSymbol}_USDT?type=spot`;
                        const tvLink = `https://www.tradingview.com/chart/?symbol=BINANCE:${baseSymbol}USDT`;
                        const xLink = `https://twitter.com/search?q=$${baseSymbol}`;

                        // Color logic
                        let badgeClass = "";
                        if (isZero) badgeClass = "bg-gray-100 text-gray-600";
                        else if (isPositive) badgeClass = "bg-[#dcfce7] text-[#166534]"; 
                        else badgeClass = "bg-[#fee2e2] text-[#991b1b]";

                        return (
                            <tr key={ticker.symbol} className="group hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 cursor-pointer" onClick={(e) => toggleFavorite(ticker.symbol, e)}>
                                    <Star 
                                        size={16} 
                                        className={`transition-all ${isFav ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-transparent group-hover:text-yellow-400'}`} 
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <span className="font-bold text-gray-900">{baseSymbol}</span>
                                        <span className="text-xs text-gray-400 ml-1 font-medium">/USDT</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <a href={binanceLink} target="_blank" rel="noopener noreferrer" title="Trade on Binance" className="hover:text-yellow-500 text-gray-400">
                                            <Globe size={14} />
                                        </a>
                                        <a href={tvLink} target="_blank" rel="noopener noreferrer" title="View on TradingView" className="hover:text-blue-500 text-gray-400">
                                            <BarChart2 size={14} />
                                        </a>
                                        <a href={xLink} target="_blank" rel="noopener noreferrer" title="Search on X" className="hover:text-black text-gray-400">
                                            <Twitter size={14} />
                                        </a>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`text-sm font-medium font-mono ${isPositive ? 'text-gray-900' : 'text-gray-900'}`}>
                                        {formatPrice(ticker.lastPrice)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-500 tabular-nums">
                                    {formatVolume(ticker.quoteVolume)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-500 tabular-nums hidden sm:table-cell">
                                    {formatPrice(ticker.highPrice)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-500 tabular-nums hidden sm:table-cell">
                                    {formatPrice(ticker.lowPrice)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className={`inline-flex items-center justify-end w-20 px-2 py-1.5 rounded-md text-xs font-bold tabular-nums ${badgeClass}`}>
                                        {change > 0 ? '+' : ''}{change.toFixed(2)}%
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
         </div>
         <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
            <span className="flex items-center gap-2">数据来源: Binance API <ExternalLink size={10}/></span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> 连接正常</span>
         </div>
      </div>
    </div>
  );
};

export default CryptoView;