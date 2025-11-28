import React from 'react';
import { BriefingData } from '../types';
import { TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw, Clock, Copy, Check, Twitter, Share, Link as LinkIcon } from 'lucide-react';

interface BriefingViewProps {
  data: BriefingData;
  isLoading: boolean;
  onRefresh: () => void;
}

const BriefingView: React.FC<BriefingViewProps> = ({ data, isLoading, onRefresh }) => {
  const [copied, setCopied] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return <TrendingUp className="text-green-500" size={32} />;
      case 'Negative': return <TrendingDown className="text-red-500" size={32} />;
      default: return <Minus className="text-yellow-500" size={32} />;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score <= 30) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const handleCopyForTwitter = () => {
    // Generate Twitter formatted string
    const date = new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    let tweet = `📅 每日早报 (${date})\n\n`;
    
    tweet += `🌍 宏观市场\n${data.macroSummary}\n\n`;
    tweet += `😨 恐慌/贪婪: ${data.fearGreedIndex.value} (${data.fearGreedIndex.label})\n\n`;
    
    tweet += `📉 核心美股\n`;
    data.stockAnalysis.forEach(s => {
        tweet += `$${s.ticker}: ${s.price} (${s.change}) - ${s.reason}\n`;
    });
    
    tweet += `\n💎 加密货币\n`;
    data.cryptoAnalysis.forEach(c => {
        tweet += `$${c.ticker}: ${c.price} (${c.change}) - ${c.reason}\n`;
    });

    tweet += `\n💡 关键趋势\n`;
    data.keyTrends.slice(0,3).forEach(t => tweet += `• ${t}\n`);

    tweet += `\n#Crypto #Stocks #Macro #Trading`;

    navigator.clipboard.writeText(tweet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('topic', data.industry);
      navigator.clipboard.writeText(url.toString());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
  };

  // Generate Issue Number based on day of year (rough approximation)
  const getIssueNumber = () => {
      const start = new Date(new Date().getFullYear(), 0, 0);
      const diff = Number(new Date()) - Number(start);
      const oneDay = 1000 * 60 * 60 * 24;
      return Math.floor(diff / oneDay);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                2024年{new Date().getMonth() + 1}月刊
             </span>
             <span className="text-xs text-gray-400 font-mono">NO.{getIssueNumber()}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">市场早间情报 (Morning Briefing)</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
             <button 
                onClick={handleShareLink}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors shadow-sm text-sm font-medium"
            >
                {linkCopied ? <Check size={16} /> : <LinkIcon size={16} />}
                {linkCopied ? "链接已复制" : "分享链接"}
            </button>
            <button 
                onClick={handleCopyForTwitter}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm text-sm font-medium"
            >
                {copied ? <Check size={16} /> : <Twitter size={16} />}
                {copied ? "已复制" : "复制到 X"}
            </button>
            <button 
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium text-gray-700 disabled:opacity-50"
            >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "更新中..." : "刷新"}
            </button>
        </div>
      </div>

      {/* Top Cards: Macro & Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Macro Card */}
         <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                🌍 宏观市场背景 (Macro Context)
            </h3>
            <p className="text-gray-800 font-serif leading-relaxed">
                {data.macroSummary || data.summary}
            </p>
         </div>
         {/* Fear & Greed Card */}
         <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-center items-center text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">恐慌 & 贪婪指数</h3>
            <div className="text-5xl font-black mb-1">{data.fearGreedIndex?.value}</div>
            <div className={`text-sm font-bold px-2 py-1 rounded bg-white/10`}>
                {data.fearGreedIndex?.label}
            </div>
         </div>
      </div>

      {/* Asset Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stocks */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span> 核心关注 (Stocks)
                </h3>
            </div>
            <div className="divide-y divide-gray-100">
                {data.stockAnalysis.map((item, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-gray-900 text-lg">{item.ticker}</span>
                            <div className="text-right">
                                <span className="font-mono font-medium text-gray-900 mr-2">{item.price}</span>
                                <span className={`text-sm font-bold ${item.change.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                                    {item.change}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-snug">
                            {item.reason}
                        </p>
                    </div>
                ))}
                {data.stockAnalysis.length === 0 && (
                    <div className="p-6 text-center text-gray-400 text-sm">暂无数据，请检查设置。</div>
                )}
            </div>
        </section>

        {/* Crypto */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span> 加密市场 (Crypto)
                </h3>
            </div>
            <div className="divide-y divide-gray-100">
                {data.cryptoAnalysis.map((item, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-gray-900 text-lg">{item.ticker}</span>
                            <div className="text-right">
                                <span className="font-mono font-medium text-gray-900 mr-2">{item.price}</span>
                                <span className={`text-sm font-bold ${item.change.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                                    {item.change}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-snug">
                            {item.reason}
                        </p>
                    </div>
                ))}
                {data.cryptoAnalysis.length === 0 && (
                     <div className="p-6 text-center text-gray-400 text-sm">暂无数据，请检查设置。</div>
                )}
            </div>
        </section>
      </div>

      {/* Key Trends */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
            🔥 关键趋势 & 叙事 (Trends)
        </h3>
        <div className="grid gap-3">
            {data.keyTrends.map((trend, idx) => (
            <div key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-purple-500 mt-2"></div>
                <p className="text-gray-800">{trend}</p>
            </div>
            ))}
        </div>
      </section>

      {/* Sources Footer */}
      <div className="text-xs text-gray-400 flex flex-wrap gap-4 pt-4 border-t border-gray-200">
         <span className="font-bold">参考来源:</span>
         {data.sources.slice(0, 5).map((s, i) => (
             <a key={i} href={s.uri} target="_blank" className="hover:text-blue-500 underline decoration-dotted">{s.title}</a>
         ))}
      </div>
    </div>
  );
};

export default BriefingView;