import React, { useEffect, useState } from 'react';
import { fetchFearAndGreedIndex } from '../services/external';
import { fetchLongShortRatio, fetchFundingRate, fetchOpenInterest, fetchCryptoTickers } from '../services/binance';
import { FearGreedData, LongShortRatio, CryptoTicker } from '../types';
import { TrendingUp, TrendingDown, Activity, DollarSign, Users, BarChart3, Info } from 'lucide-react';

const DashboardView: React.FC = () => {
    const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
    const [btcLsr, setBtcLsr] = useState<LongShortRatio | null>(null);
    const [funding, setFunding] = useState<any>(null);
    const [openInterest, setOpenInterest] = useState<any>(null);
    const [btcPrice, setBtcPrice] = useState<CryptoTicker | null>(null);
    const [loading, setLoading] = useState(true);

    const loadAllMetrics = async () => {
        setLoading(true);
        try {
            const [fgData, lsrData, fundingData, oiData, tickerData] = await Promise.all([
                fetchFearAndGreedIndex(),
                fetchLongShortRatio('BTCUSDT', '5m'),
                fetchFundingRate('BTCUSDT'),
                fetchOpenInterest('BTCUSDT'),
                fetchCryptoTickers(['BTCUSDT'])
            ]);

            setFearGreed(fgData);
            setBtcLsr(lsrData);
            setFunding(fundingData);
            setOpenInterest(oiData);
            if (tickerData.length > 0) setBtcPrice(tickerData[0]);

        } catch (e) {
            console.error("Dashboard error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllMetrics();
        const interval = setInterval(loadAllMetrics, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    // Helper to format large numbers
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', {
            notation: "compact",
            maximumFractionDigits: 1
        }).format(num);
    };

    const getFearColor = (val: number) => {
        if (val >= 75) return 'text-green-600';
        if (val >= 50) return 'text-green-500';
        if (val >= 25) return 'text-orange-500';
        return 'text-red-600';
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">数据看板 (Dashboard)</h2>
                    <p className="text-gray-500">BTC 核心指标 & 宏观趋势</p>
                </div>
                <div className="text-sm text-gray-400">
                    自动更新: 1m
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Fear & Greed Index */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-2 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Activity size={120} />
                    </div>
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Activity size={16}/> 恐慌 & 贪婪指数
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Source: Alternative.me</p>
                        </div>
                        {fearGreed && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                                {new Date(parseInt(fearGreed.timestamp) * 1000).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    <div className="mt-6 flex items-end gap-4 z-10">
                        {loading ? (
                            <div className="h-16 w-32 bg-gray-100 animate-pulse rounded"></div>
                        ) : fearGreed ? (
                            <>
                                <span className={`text-6xl font-black ${getFearColor(parseInt(fearGreed.value))}`}>
                                    {fearGreed.value}
                                </span>
                                <div className="mb-2">
                                    <p className={`text-xl font-bold ${getFearColor(parseInt(fearGreed.value))}`}>
                                        {fearGreed.value_classification}
                                    </p>
                                    <p className="text-sm text-gray-500">市场情绪</p>
                                </div>
                            </>
                        ) : (
                            <span className="text-gray-400">Unavailable</span>
                        )}
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-4 bg-gray-200 rounded-full mt-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 opacity-30"></div>
                        {fearGreed && (
                            <div 
                                className="absolute top-0 bottom-0 w-2 bg-black border-2 border-white shadow-lg transition-all duration-1000"
                                style={{ left: `${fearGreed.value}%` }}
                            ></div>
                        )}
                    </div>
                </div>

                {/* 2. Long/Short Ratio */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Users size={16}/> 多空持仓比 (L/S Ratio)
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Binance Futures (Global Accounts)</p>
                    </div>

                    <div className="mt-4">
                         {loading ? (
                            <div className="space-y-2">
                                <div className="h-8 bg-gray-100 animate-pulse rounded"></div>
                                <div className="h-4 bg-gray-100 animate-pulse rounded w-2/3"></div>
                            </div>
                        ) : btcLsr ? (
                            <div>
                                <div className="flex justify-between items-baseline mb-2">
                                    <span className="text-3xl font-bold text-gray-900">{btcLsr.longShortRatio}</span>
                                    <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">5m</span>
                                </div>
                                {/* Visual Bar */}
                                <div className="flex w-full h-3 rounded-full overflow-hidden mb-2">
                                    <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${parseFloat(btcLsr.longAccount) * 100}%` }}></div>
                                    <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${parseFloat(btcLsr.shortAccount) * 100}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-green-600">{(parseFloat(btcLsr.longAccount) * 100).toFixed(1)}% 多</span>
                                    <span className="text-red-600">{(parseFloat(btcLsr.shortAccount) * 100).toFixed(1)}% 空</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">Data unavailable</p>
                        )}
                    </div>
                </div>

                {/* 3. BTC Price & 24h Change */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-lg col-span-1 flex flex-col justify-between">
                     <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign size={16}/> BTC 价格
                        </h3>
                    </div>
                    <div>
                        {loading || !btcPrice ? (
                             <div className="h-10 bg-slate-700 animate-pulse rounded mb-2"></div>
                        ) : (
                            <>
                                <div className="text-3xl font-mono font-bold tracking-tight">
                                    ${parseFloat(btcPrice.lastPrice).toLocaleString()}
                                </div>
                                <div className={`flex items-center gap-1 mt-2 font-bold ${parseFloat(btcPrice.priceChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {parseFloat(btcPrice.priceChangePercent) >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                                    {parseFloat(btcPrice.priceChangePercent).toFixed(2)}%
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 4. Funding Rate & Open Interest */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
                     {/* Funding Rate */}
                     <div className="border-r border-gray-100 pr-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                            <BarChart3 size={16}/> 资金费率 (Funding)
                        </h3>
                        {loading ? <div className="h-8 bg-gray-100 animate-pulse rounded"></div> : (
                            <div>
                                <p className={`text-2xl font-bold ${funding && parseFloat(funding.lastFundingRate) > 0.01 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {funding ? `${(parseFloat(funding.lastFundingRate) * 100).toFixed(4)}%` : '--'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Per 8h (Binance)</p>
                                {funding && parseFloat(funding.lastFundingRate) > 0.01 && (
                                    <span className="inline-block mt-2 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold">费率偏高 (看空)</span>
                                )}
                            </div>
                        )}
                     </div>
                     
                     {/* Open Interest */}
                     <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Activity size={16}/> 合约持仓量 (OI)
                        </h3>
                         {loading ? <div className="h-8 bg-gray-100 animate-pulse rounded"></div> : (
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {openInterest ? `${formatNumber(parseFloat(openInterest.openInterestAmount))} BTC` : '--'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    ~${openInterest && btcPrice ? formatNumber(parseFloat(openInterest.openInterestAmount) * parseFloat(btcPrice.lastPrice)) : '--'} USD
                                </p>
                            </div>
                        )}
                     </div>
                </div>

                {/* 5. Placeholder for Ahr999 & Miner Cost */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 border-dashed col-span-1 md:col-span-2 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-white rounded-full shadow-sm mb-3 text-blue-500">
                        <Info size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900">高级链上指标</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs">
                        Ahr999 指数, 矿工成本, MVRV Z-Score 等数据预留位。
                    </p>
                    <span className="mt-3 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">需接入 Glassnode/CryptoQuant API</span>
                </div>

            </div>
        </div>
    );
};

export default DashboardView;
