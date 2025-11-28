import React, { useState } from 'react';
import { BriefingData, NewsCardData } from '../types';
import { Clock, Tag, Share2, Bookmark, ChevronDown } from 'lucide-react';

interface AggregatorViewProps {
  data: BriefingData | null;
  newsItems?: NewsCardData[]; // Optional override for direct lists (like bookmarks)
  bookmarks: NewsCardData[];
  onToggleBookmark: (item: NewsCardData) => void;
  title?: string;
  subtitle?: string;
}

const AggregatorView: React.FC<AggregatorViewProps> = ({ 
  data, 
  newsItems, 
  bookmarks, 
  onToggleBookmark,
  title,
  subtitle
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Determine which list to show: custom list (e.g. saved) or data from briefing
  const itemsToShow = newsItems || data?.newsItems || [];
  const displayTitle = title || "Industry News Feed";
  const displaySubtitle = subtitle || (data ? `Curated articles and updates for ${data.industry}` : "");

  const handleToggle = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{displayTitle}</h2>
        {displaySubtitle && <p className="text-gray-500 mt-2">{displaySubtitle}</p>}
      </div>

      <div className="grid gap-6">
        {itemsToShow.map((item, idx) => {
          const isExpanded = expandedIndex === idx;
          const isBookmarked = bookmarks.some(b => b.id === item.id);
          
          return (
            <article 
              key={item.id || idx} 
              onClick={() => handleToggle(idx)}
              className={`
                relative bg-white rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
                ${isExpanded 
                  ? 'shadow-lg border-blue-500 ring-1 ring-blue-500 scale-[1.02] z-10' 
                  : 'shadow-sm border-gray-200 hover:shadow-md hover:border-blue-300'
                }
              `}
            >
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Pseudo-image placeholder */}
                <div className={`
                  hidden md:flex flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg items-center justify-center text-slate-300 transition-all duration-300
                  ${isExpanded ? 'w-48 h-auto min-h-[12rem]' : 'w-48 h-32'}
                `}>
                   <span className="text-4xl font-serif font-bold opacity-20">{idx + 1}</span>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2 flex-wrap">
                          {item.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              <Tag size={10} className="mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button className={`text-gray-400 hover:text-blue-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown size={20} />
                        </button>
                    </div>
                    
                    <h3 className={`text-xl font-bold text-gray-900 mb-2 leading-tight transition-colors ${isExpanded ? 'text-blue-700' : ''}`}>
                      {item.title}
                    </h3>
                    
                    <p className={`text-gray-600 transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {item.summary}
                    </p>
                    
                    {isExpanded && (
                       <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in duration-300">
                          <p className="text-sm text-gray-500 italic">
                             Extended view: This is a news flash item.
                          </p>
                       </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                       <Clock size={14} className="mr-1" />
                       <span>{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Today'}</span>
                       <span className="mx-2">•</span>
                       <span>Briefing AI</span>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            onToggleBookmark(item);
                        }} 
                        className={`transition-colors ${isBookmarked ? 'text-blue-600 fill-current' : 'text-gray-400 hover:text-blue-600'}`}
                        title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
                      >
                        <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"}/>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); }}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Share"
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {itemsToShow.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">
                {title ? "No items in this collection." : "No news items found."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AggregatorView;
