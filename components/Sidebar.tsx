import React from 'react';
import { ViewMode, UserProfile } from '../types';
import { LayoutDashboard, Newspaper, Settings, Zap, Bookmark, Coins, LogIn, CandlestickChart, LayoutTemplate, Twitter } from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, user, onOpenAuth, onLogout }) => {
  const menuItems = [
    { id: ViewMode.BRIEFING, label: '每日早报 (Briefing)', icon: <Zap size={20} /> },
    { id: ViewMode.DASHBOARD, label: '数据看板 (Dashboard)', icon: <LayoutTemplate size={20} /> },
    { id: ViewMode.AGGREGATOR, label: '行业快讯 (Feed)', icon: <Newspaper size={20} /> },
    { id: ViewMode.SAVED, label: '我的收藏 (Saved)', icon: <Bookmark size={20} /> },
    { id: ViewMode.CRYPTO, label: '加密行情 (Crypto)', icon: <Coins size={20} /> },
    { id: ViewMode.STOCK, label: '美股行情 (Stock)', icon: <CandlestickChart size={20} /> },
    { id: ViewMode.SETTINGS, label: '系统设置 (Settings)', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-10 hidden md:flex">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-xl">
          <LayoutDashboard />
          <span>IndustryPulse</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Daily Intelligence & Aggregation</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        {/* Creator Twitter Link */}
        <a 
            href="https://x.com/BruceLLBlue" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 mb-6 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-900/40 to-slate-800 border border-blue-500/30 hover:border-blue-400 hover:from-blue-900/60 transition-all group"
        >
            <div className="p-1.5 bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <Twitter size={16} fill="currentColor" />
            </div>
            <div>
                <p className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider mb-0.5">Follow Creator</p>
                <p className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors">@BruceLLBlue</p>
            </div>
        </a>

        {user ? (
            <div className="flex items-center gap-3 mb-4 p-2 bg-slate-800 rounded-lg">
                <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-600" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <button onClick={onLogout} className="text-xs text-slate-400 hover:text-white">退出登录</button>
                </div>
            </div>
        ) : (
            <button 
                onClick={onOpenAuth}
                className="w-full mb-4 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors border border-slate-700"
            >
                <LogIn size={16} />
                <span>登录账号</span>
            </button>
        )}
        
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Powered by</p>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Google Gemini</span>
            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Live</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;