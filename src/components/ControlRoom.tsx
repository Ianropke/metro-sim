import React, { useState, useEffect } from 'react';
import { TopologicalMap } from './TopologicalMap';
import { TrainDetails } from './TrainDetails';
import { UpgradeShop } from './UpgradeShop';
import { DataDashboard } from './DataDashboard';
import { AlertTriangle, ShoppingCart, Users, Database, Zap, Activity, DollarSign, Clock, Menu, TrendingUp, Smile } from 'lucide-react';
import { type Toast, ToastContainer } from './ToastNotification';
import { Advisor } from './Advisor';

interface ControlRoomProps {
    trains: any[];
    stations: any[];
    alarms: any[];
    logs: any[];
    anomalies: any[];
    game: { satisfaction: number, efficiency: number, budget: number, events: any[], maintenanceStrategy: any };
    onEmergencyTrigger: () => void;
    onPurchaseUpgrade: (id: string, cost: number) => void;
    onScenarioTrigger?: (scenario: string) => void;
    onResolveAnomaly?: (id: string) => void;
    onSetStrategy?: (strategy: string) => void;
}

export const ControlRoom: React.FC<ControlRoomProps> = ({ trains, stations, alarms, logs, anomalies, game, onEmergencyTrigger, onPurchaseUpgrade, onScenarioTrigger, onResolveAnomaly, onSetStrategy }) => {
    const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
    const [showShop, setShowShop] = useState(false);
    const [showData, setShowData] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [advisorMessage, setAdvisorMessage] = useState<string>("Welcome, Director! Check the Shop to upgrade your fleet.");

    // Convert Game Events to Toasts & Advisor Messages
    useEffect(() => {
        if (game.events.length > 0) {
            const latestEvent = game.events[game.events.length - 1];
            addToast({
                id: latestEvent.id,
                type: latestEvent.type === 'FAILURE' ? 'ERROR' : 'INFO',
                title: latestEvent.name || 'Event',
                message: latestEvent.description
            });

            // Advisor reaction
            if (latestEvent.type === 'FAILURE') {
                setAdvisorMessage(`Critical failure detected! Open the Data Dashboard to fix it immediately!`);
            }
        }
    }, [game.events.length]);

    // Advisor tips based on stats
    useEffect(() => {
        if (game.satisfaction < 50) {
            setAdvisorMessage("Passengers are unhappy! Try running more trains or upgrading station facilities.");
        } else if (game.efficiency < 0.8) {
            setAdvisorMessage("Energy efficiency is low. Consider buying Regenerative Braking upgrades.");
        }
    }, [game.satisfaction, game.efficiency]);

    const addToast = (toast: Toast) => {
        setToasts(prev => {
            if (prev.find(t => t.id === toast.id)) return prev;
            return [...prev, toast];
        });
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const selectedTrain = trains.find(t => t.id === selectedTrainId);

    return (
        <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col font-sans">

            {/* 1. Fullscreen Map Layer (Background) */}
            <div className="absolute inset-0 z-0">
                <TopologicalMap
                    trains={trains}
                    stations={stations}
                    onTrainClick={setSelectedTrainId}
                />
            </div>

            {/* 2. HUD - Top Bar (Tycoon Style) */}
            <div className="relative z-10 w-full p-4 pointer-events-none flex justify-between items-start">

                {/* Left: Game Info */}
                <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-xl flex flex-col gap-1 pointer-events-auto">
                    <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        METRO <span className="text-blue-500">TYCOON</span>
                    </h1>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        LIVE OPERATIONS
                    </div>
                </div>

                {/* Center: Stat Bubbles */}
                <div className="flex gap-4 pointer-events-auto">
                    {/* Budget Bubble */}
                    <div className="bg-slate-900/90 backdrop-blur-md pl-3 pr-6 py-2 rounded-full border-2 border-slate-700 shadow-xl flex items-center gap-3 transition-transform hover:scale-105">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                            <DollarSign size={20} strokeWidth={3} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Budget</span>
                            <span className={`text - xl font - black ${game.budget < 0 ? 'text-rose-400' : 'text-white'} `}>
                                ${game.budget.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Satisfaction Bubble */}
                    <div className="bg-slate-900/90 backdrop-blur-md pl-3 pr-6 py-2 rounded-full border-2 border-slate-700 shadow-xl flex items-center gap-3 transition-transform hover:scale-105">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Smile size={20} strokeWidth={3} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fans</span>
                            <span className="text-xl font-black text-white">
                                {Math.round(game.satisfaction)}%
                            </span>
                        </div>
                    </div>

                    {/* Efficiency Bubble */}
                    <div className="bg-slate-900/90 backdrop-blur-md pl-3 pr-6 py-2 rounded-full border-2 border-slate-700 shadow-xl flex items-center gap-3 transition-transform hover:scale-105">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                            <TrendingUp size={20} strokeWidth={3} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Efficiency</span>
                            <span className="text-xl font-black text-white">
                                {(game.efficiency * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Menu */}
                <div className="pointer-events-auto">
                    <button className="w-12 h-12 bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-700 flex items-center justify-center text-white hover:bg-slate-800 transition-colors shadow-xl">
                        <Menu size={24} />
                    </button>
                </div>
            </div>

            {/* 3. Toast Layer */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* 4. Advisor Layer */}
            <Advisor message={advisorMessage} />

            {/* 5. Main Content Area (Empty for now, map is behind) */}
            <div className="flex-1 relative z-0 pointer-events-none">
                {/* Train Details Overlay (Floating) */}
                {selectedTrain && (
                    <div className="absolute top-4 left-4 pointer-events-auto">
                        <TrainDetails
                            train={selectedTrain}
                            onClose={() => setSelectedTrainId(null)}
                        />
                    </div>
                )}
            </div>

            {/* 5. Bottom Dock (Controls) */}
            <div className="relative z-20 w-full p-6 flex justify-center items-end pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4 bg-slate-950/80 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/10 shadow-2xl transform transition-all hover:scale-105">

                    <DockButton
                        icon={<ShoppingCart size={24} />}
                        label="SHOP"
                        color="blue"
                        onClick={() => setShowShop(true)}
                    />

                    <DockButton
                        icon={<Database size={24} />}
                        label="DATA"
                        color="orange"
                        onClick={() => setShowData(true)}
                    />

                    <div className="w-px h-12 bg-white/10 mx-2"></div>

                    <DockButton
                        icon={<Users size={24} />}
                        label="RUSH HOUR"
                        color="yellow"
                        onClick={() => onScenarioTrigger && onScenarioTrigger('MORNING_RUSH')}
                    />

                    <DockButton
                        icon={<AlertTriangle size={24} />}
                        label="EMERGENCY"
                        color="red"
                        onClick={onEmergencyTrigger}
                        danger
                    />
                </div>
            </div>

            {/* Modals */}
            {showShop && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-10">
                    <div className="w-full max-w-4xl h-full max-h-[800px] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative">
                        <button
                            onClick={() => setShowShop(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
                        >
                            <Activity size={24} /> {/* Close Icon Placeholder */}
                        </button>
                        <UpgradeShop
                            budget={game.budget}
                            onPurchase={(id, cost) => {
                                onPurchaseUpgrade(id, cost);
                                addToast({ id: `buy_${Date.now()} `, type: 'SUCCESS', title: 'Upgrade Purchased', message: 'System upgraded successfully.' });
                            }}
                            onClose={() => setShowShop(false)}
                        />
                    </div>
                </div>
            )}

            {showData && (
                <DataDashboard
                    logs={logs}
                    anomalies={anomalies}
                    currentStrategy={game.maintenanceStrategy}
                    onClose={() => setShowData(false)}
                    onResolveAnomaly={(id) => {
                        if (onResolveAnomaly) {
                            onResolveAnomaly(id);
                            addToast({ id: `fix_${Date.now()} `, type: 'SUCCESS', title: 'Anomaly Resolved', message: 'Maintenance completed. Efficiency restored.' });
                        }
                    }}
                    onSetStrategy={onSetStrategy}
                />
            )}
        </div>
    );
};

// Helper Component for Dock Buttons
const DockButton: React.FC<{ icon: React.ReactNode, label: string, color: string, onClick: () => void, danger?: boolean }> = ({ icon, label, color, onClick, danger }) => {
    const colorClasses: { [key: string]: string } = {
        blue: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50',
        orange: 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/50',
        yellow: 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/50',
        red: 'bg-red-600 hover:bg-red-500 shadow-red-900/50',
    };

    return (
        <button
            onClick={onClick}
            className={`
                group relative flex flex - col items - center justify - center gap - 1 w - 20 h - 20 rounded - 2xl
transition - all duration - 200 active: scale - 95
                ${danger ? 'bg-red-950/50 border border-red-500/50 hover:bg-red-900/50' : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50'}
`}
        >
            <div className={`
p - 2 rounded - xl text - white shadow - lg transition - all duration - 300 group - hover: -translate - y - 1
                ${colorClasses[color]}
`}>
                {icon}
            </div>
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">{label}</span>
        </button>
    );
};
