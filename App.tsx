import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import BriefingView from './components/BriefingView';
import AggregatorView from './components/AggregatorView';
import CryptoView from './components/CryptoView';
import StockView from './components/StockView'; 
import DashboardView from './components/DashboardView';
import AuthModal from './components/AuthModal';
import { ViewMode, AppState, UserProfile, NewsCardData } from './types';
import { fetchIndustryBriefing } from './services/gemini';
import { Search, Menu, X, AlertCircle, History, Edit3, Save } from 'lucide-react';

const INITIAL_INDUSTRY = 'Blockchain & Crypto';
const DEFAULT_WATCHLIST = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT'];

// Super Admin Defaults for Briefing Content
const DEFAULT_BRIEFING_STOCKS = ['SPX', 'IXIC', 'NVDA', 'TSLA', 'GOOG', 'CRCL', 'HOOD', 'COIN'];
const DEFAULT_BRIEFING_CRYPTO = ['BTC', 'ETH', 'SOL', 'BNB', 'HYPE'];

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.BRIEFING);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Search State
  const [searchInput, setSearchInput] = useState(INITIAL_INDUSTRY);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchContainerRef = useRef<HTMLFormElement>(null);

  // User & Data State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<NewsCardData[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);

  // Admin Config State
  const [briefingStocks, setBriefingStocks] = useState<string[]>(DEFAULT_BRIEFING_STOCKS);
  const [briefingCrypto, setBriefingCrypto] = useState<string[]>(DEFAULT_BRIEFING_CRYPTO);
  const [tempStocks, setTempStocks] = useState('');
  const [tempCrypto, setTempCrypto] = useState('');

  const [state, setState] = useState<AppState>({
    currentIndustry: INITIAL_INDUSTRY,
    isLoading: false,
    data: null,
    error: null,
    lastUpdated: null
  });

  // Load persistence and URL Params on mount
  useEffect(() => {
    // 1. Persistence
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));

    const savedBookmarks = localStorage.getItem('bookmarks');
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

    const savedWatchlist = localStorage.getItem('cryptoWatchlist');
    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));
    
    const savedUser = localStorage.getItem('userProfile');
    if (savedUser) setUser(JSON.parse(savedUser));

    // Load Admin Config
    const savedStocks = localStorage.getItem('briefingStocks');
    if (savedStocks) setBriefingStocks(JSON.parse(savedStocks));
    
    const savedCrypto = localStorage.getItem('briefingCrypto');
    if (savedCrypto) setBriefingCrypto(JSON.parse(savedCrypto));

    // Admin Config Defaults
    const initialStocks = savedStocks ? JSON.parse(savedStocks) : DEFAULT_BRIEFING_STOCKS;
    const initialCrypto = savedCrypto ? JSON.parse(savedCrypto) : DEFAULT_BRIEFING_CRYPTO;

    setTempStocks(initialStocks.join(', '));
    setTempCrypto(initialCrypto.join(', '));

    // 2. Check URL for Shared Topic
    const params = new URLSearchParams(window.location.search);
    const topicParam = params.get('topic');
    const startIndustry = topicParam ? decodeURIComponent(topicParam) : INITIAL_INDUSTRY;

    if (topicParam) {
        setSearchInput(startIndustry);
    }
    
    // Initial fetch
    doFetch(startIndustry, initialStocks, initialCrypto);
  }, []);

  // Click outside to close history dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doFetch = async (industry: string, stocks: string[], crypto: string[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, currentIndustry: industry }));
    try {
      const data = await fetchIndustryBriefing(industry, stocks, crypto);
      setState(prev => ({
        ...prev,
        isLoading: false,
        data,
        lastUpdated: Date.now()
      }));
      
      if (!searchHistory.includes(industry)) {
          const newHistory = [industry, ...searchHistory].slice(0, 8);
          setSearchHistory(newHistory);
          localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "无法获取早报数据，请检查网络或 API Key。"
      }));
    }
  };

  const loadData = (industry: string) => {
      doFetch(industry, briefingStocks, briefingCrypto);
  };

  const handleSearch = (e: React.FormEvent, term?: string) => {
    if (e) e.preventDefault();
    const query = term || searchInput;
    if (query.trim()) {
      setSearchInput(query);
      loadData(query);
      setView(ViewMode.BRIEFING);
      setShowHistory(false);
      
      // Update URL without reloading to allow easier sharing immediately after search
      const url = new URL(window.location.href);
      url.searchParams.set('topic', query);
      window.history.pushState({}, '', url);
    }
  };

  const toggleBookmark = (item: NewsCardData) => {
      let newBookmarks;
      if (bookmarks.some(b => b.id === item.id)) {
          newBookmarks = bookmarks.filter(b => b.id !== item.id);
      } else {
          newBookmarks = [...bookmarks, item];
      }
      setBookmarks(newBookmarks);
      localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const updateWatchlist = (newList: string[]) => {
      setWatchlist(newList);
      localStorage.setItem('cryptoWatchlist', JSON.stringify(newList));
  };

  const saveAdminConfig = () => {
      const sList = tempStocks.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
      const cList = tempCrypto.split(',').map(c => c.trim().toUpperCase()).filter(c => c);
      
      setBriefingStocks(sList);
      setBriefingCrypto(cList);
      
      localStorage.setItem('briefingStocks', JSON.stringify(sList));
      localStorage.setItem('briefingCrypto', JSON.stringify(cList));
      
      alert('配置已保存。请刷新早报以查看变更。');
  };

  const handleLogin = (newUser: UserProfile) => {
      setUser(newUser);
      localStorage.setItem('userProfile', JSON.stringify(newUser));
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('userProfile');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 flex">
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLogin={handleLogin}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Responsive) */}
      <div className={`fixed md:relative z-30 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
         <Sidebar 
            currentView={view} 
            onViewChange={(v) => { setView(v); setIsSidebarOpen(false); }} 
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={handleLogout}
         />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 w-full flex flex-col min-h-screen">
        
        {/* Top Navigation / Search Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-500 hover:text-gray-700">
                {isSidebarOpen ? <X /> : <Menu />}
              </button>
              
              <form 
                ref={searchContainerRef}
                onSubmit={(e) => handleSearch(e)} 
                className="relative group w-full max-w-md"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={18} />
                <input
                  type="text"
                  value={searchInput}
                  onFocus={() => setShowHistory(true)}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="输入行业或主题 (如: AI, 生物科技)..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-lg text-sm transition-all outline-none w-[200px] sm:w-[300px] focus:w-full"
                />
                
                {/* Search History Dropdown */}
                {showHistory && searchHistory.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                        <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">最近搜索</p>
                        {searchHistory.map((term, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSearch({} as any, term)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                            >
                                <History size={14} className="text-gray-400" />
                                {term}
                            </button>
                        ))}
                    </div>
                )}
              </form>
            </div>

            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                 <p className="text-xs text-gray-400">当前聚焦</p>
                 <p className="text-sm font-semibold text-gray-800 truncate max-w-[150px]">{state.currentIndustry}</p>
               </div>
               <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                 AI
               </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* Global Error State */}
          {state.error && view !== ViewMode.SETTINGS && (
             <div className="flex flex-col items-center justify-center h-[50vh] text-center">
               <AlertCircle className="text-red-500 mb-4" size={48} />
               <h3 className="text-lg font-bold text-gray-900">无法加载早报内容</h3>
               <p className="text-gray-500 mt-2 max-w-md">{state.error}</p>
               <button 
                 onClick={() => loadData(state.currentIndustry)}
                 className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
               >
                 重试
               </button>
             </div>
          )}

          {/* Views */}
          {!state.error && (
            <>
              {state.isLoading && view !== ViewMode.SETTINGS && view !== ViewMode.CRYPTO && view !== ViewMode.DASHBOARD && view !== ViewMode.STOCK && (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                  <div className="relative w-24 h-24">
                     <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <h2 className="mt-8 text-xl font-medium text-gray-700">正在分析 {state.currentIndustry} 行业数据...</h2>
                  <p className="text-gray-400 mt-2 text-sm">AI 正在聚合全网最新资讯</p>
                </div>
              )}

              {!state.isLoading && (
                  <>
                    {view === ViewMode.BRIEFING && state.data && (
                        <BriefingView 
                        data={state.data} 
                        isLoading={state.isLoading} 
                        onRefresh={() => loadData(state.currentIndustry)}
                        />
                    )}
                    {view === ViewMode.DASHBOARD && (
                        <DashboardView />
                    )}
                    {view === ViewMode.AGGREGATOR && state.data && (
                        <AggregatorView 
                            data={state.data} 
                            bookmarks={bookmarks}
                            onToggleBookmark={toggleBookmark}
                            title="行业快讯 (Feed)"
                            subtitle={`关于 ${state.data.industry} 的精选资讯`}
                        />
                    )}
                    {view === ViewMode.SAVED && (
                        <AggregatorView 
                            data={null}
                            newsItems={bookmarks}
                            bookmarks={bookmarks}
                            onToggleBookmark={toggleBookmark}
                            title="我的收藏"
                            subtitle="你保存的高价值信息库"
                        />
                    )}
                    {view === ViewMode.CRYPTO && (
                        <CryptoView 
                            watchlist={watchlist}
                            onUpdateWatchlist={updateWatchlist}
                        />
                    )}
                    {view === ViewMode.STOCK && (
                        <StockView 
                            watchlist={briefingStocks}
                        />
                    )}
                    {view === ViewMode.SETTINGS && (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* Super Admin Section */}
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                    <Edit3 size={24} className="text-blue-600"/>
                                    早报内容配置 (Briefing Config)
                                </h2>
                                <p className="text-gray-500 mb-6">
                                    配置 AI 每日早报中重点追踪的资产。请使用逗号分隔代码 (如 BTC, NVDA)。
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">追踪美股 (Stock Tickers)</label>
                                        <textarea 
                                            className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            rows={2}
                                            value={tempStocks}
                                            onChange={(e) => setTempStocks(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">追踪加密货币 (Crypto Tickers)</label>
                                        <textarea 
                                            className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            rows={2}
                                            value={tempCrypto}
                                            onChange={(e) => setTempCrypto(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="pt-2">
                                        <button 
                                            onClick={saveAdminConfig}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors"
                                        >
                                            <Save size={18} />
                                            保存配置
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-lg mb-4">关于系统</h3>
                                <p className="text-gray-600 mb-2">
                                    本应用由 <strong>Gemini 2.5 Flash</strong> 模型驱动，结合 Google Search 实时数据接地。
                                </p>
                                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                                    注意: 数据为 AI 实时生成。情感评分是基于新闻上下文的 AI 估算值，仅供参考，不构成投资建议。
                                </div>
                                <div className="mt-6 border-t pt-6">
                                    <h3 className="font-bold mb-2">账号状态</h3>
                                    <p className="text-gray-600">
                                        {user ? `当前登录: ${user.email}` : '未登录状态，数据仅保存在本地浏览器。'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                  </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
