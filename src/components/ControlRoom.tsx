import React, { useState, useEffect, useCallback } from 'react';
import { TopologicalMap } from './TopologicalMap';
import { TrainDetails } from './TrainDetails';
import { UpgradeShop } from './UpgradeShop';
import { DataDashboard } from './DataDashboard';
import { AlertTriangle, ShoppingCart, Users, Database, DollarSign, Menu, TrendingUp, Smile } from 'lucide-react';
import { type Toast, ToastContainer } from './ToastNotification';
import { Advisor } from './Advisor';

interface TrainStateProps {
    id: string;
    position: number;
    velocity: number;
    state: string;
    direction: number;
    passengerCount: number;
    maxCapacity: number;
    dwellTimer: number;
    totalDwellTime: number;
    isManualOverride: boolean;
}

interface StationStateProps {
    name: string;
    position: number;
    pax: number;
}

interface LogStateProps {
    id: string;
    tag: string;
    value: string | number | boolean;
    timestamp: number;
}

interface AnomalyStateProps {
    id: string;
    trainId: string;
    component: string;
    severity: number;
    detected: boolean;
}

interface EventStateProps {
    id: string;
    name: string;
    description: string;
    type: 'DELAY' | 'FAILURE' | 'INFO';
    timestamp: number;
}

interface ControlRoomProps {
    trains: TrainStateProps[];
    stations: StationStateProps[];
    alarms: { id: string; message: string; priority: number; active: boolean; timestamp: number }[];
    logs: LogStateProps[];
    anomalies: AnomalyStateProps[];
    game: { 
        satisfaction: number; 
        efficiency: number; 
        budget: number; 
        events: EventStateProps[]; 
        maintenanceStrategy: 'REACTIVE' | 'PREVENTIVE' | 'PREDICTIVE'; 
        activeUpgrades?: Set<string>; 
    };
    onEmergencyTrigger: () => void;
    onPurchaseUpgrade: (id: string, cost: number) => void;
    onScenarioTrigger?: (scenario: string) => void;
    onResolveAnomaly?: (id: string) => void;
    onSetStrategy?: (strategy: string) => void;
    onSetManualOverride?: (trainId: string, isManual: boolean) => void;
    onSetManualCommands?: (trainId: string, throttle: number, brake: number) => void;
}

export const ControlRoom: React.FC<ControlRoomProps> = ({ 
    trains, 
    stations, 
    // alarms is unused, omitting from destructuring to avoid warning
    logs, 
    anomalies, 
    game, 
    onEmergencyTrigger, 
    onPurchaseUpgrade, 
    onScenarioTrigger, 
    onResolveAnomaly, 
    onSetStrategy,
    onSetManualOverride,
    onSetManualCommands
}) => {
    const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
    const [showShop, setShowShop] = useState(false);
    const [showData, setShowData] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const lastEventIdRef = React.useRef<string | null>(null);

    const addToast = useCallback((toast: Toast) => {
        setToasts(prev => {
            if (prev.find(t => t.id === toast.id)) return prev;
            return [...prev, toast];
        });
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Convert Game Events to Toasts
    useEffect(() => {
        if (game.events.length > 0) {
            const latestEvent = game.events[game.events.length - 1];
            if (lastEventIdRef.current !== latestEvent.id) {
                lastEventIdRef.current = latestEvent.id;
                setTimeout(() => {
                    addToast({
                        id: latestEvent.id,
                        type: latestEvent.type === 'FAILURE' ? 'ERROR' : 'INFO',
                        title: latestEvent.name || 'Event',
                        message: latestEvent.description
                    });
                }, 0);
            }
        }
    }, [game.events, addToast]);

    const selectedTrain = trains.find(t => t.id === selectedTrainId);

    // Advisor Message and Type computed dynamically based on tutorial/operational state
    let advisorMessage = "Velkommen, Direktør! Klik på et tog på kortet for at se dets diagnostik og status.";
    let advisorType: 'TUTORIAL' | 'WARNING' | 'TIP' = 'TUTORIAL';

    if (showData) {
        advisorMessage = "Her er DATA-dashboardet. Vælg 'PREDICTIVE' (prædiktiv) vedligeholdelse for at opdage fejl før de sker, og udbedre dem her.";
        advisorType = 'TUTORIAL';
    } else if (showShop) {
        advisorMessage = "Butikken er åben! Køb opgraderinger som 'Buy New Train' eller 'High-Speed Doors' for at øge kapaciteten og hastigheden.";
        advisorType = 'TUTORIAL';
    } else if (selectedTrain?.isManualOverride) {
        advisorMessage = "Manuel styring aktiveret! Brug skyderne til Throttle (gas) og Brake (bremse) til at køre toget. Åbn SHOP bagefter.";
        advisorType = 'TUTORIAL';
    } else if (selectedTrain) {
        advisorMessage = "Tog valgt! Se detaljer til venstre. Prøv nu at aktivere 'Manuel styring' (Manual Override) for selv at styre toget!";
        advisorType = 'TUTORIAL';
    } else {
        // Fallback to active failures, warnings, and general tips
        const activeFailures = anomalies.filter(a => a.severity >= 1.0);
        if (activeFailures.length > 0) {
            advisorMessage = `Kritisk fejl opdaget på ${activeFailures[0].trainId} (${activeFailures[0].component})! Åbn DATA-dashboardet for at reparere den!`;
            advisorType = 'WARNING';
        } else if (game.events.length > 0 && game.events[game.events.length - 1].type === 'FAILURE') {
            advisorMessage = "Systemadvarsel! En kritisk fejl kræver akut opmærksomhed. Åbn DATA for detaljer.";
            advisorType = 'WARNING';
        } else if (game.satisfaction < 50) {
            advisorMessage = "Passagererne er utilfredse! Overvej at købe 'Add 4th Car' eller køre flere tog for at mindske ventetiden.";
            advisorType = 'TIP';
        } else if (game.efficiency < 0.8) {
            advisorMessage = "Systemets energieffektivitet er lav. Opgrader til 'Regen Braking Mk II' i butikken for at spare penge.";
            advisorType = 'TIP';
        } else {
            // General tip if everything is fine
            advisorMessage = "Alt kører stabilt! Hold øje med økonomien, og overvej at udvide din flåde i myldretiden (RUSH HOUR).";
            advisorType = 'TIP';
        }
    }

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
                            <span className={`text-xl font-black font-mono ${game.budget < 0 ? 'text-rose-400' : 'text-white'}`}>
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
                            <span className="text-xl font-black font-mono text-white">
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
                            <span className="text-xl font-black font-mono text-white">
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
            <Advisor message={advisorMessage} type={advisorType} />

            {/* 5. Main Content Area (Empty for now, map is behind) */}
            <div className="flex-1 relative z-0 pointer-events-none">
                {/* Train Details Overlay (Floating) */}
                {selectedTrain && (
                    <div className="absolute top-4 left-4 pointer-events-auto">
                        <TrainDetails
                            train={selectedTrain}
                            onClose={() => setSelectedTrainId(null)}
                            onSetManualOverride={onSetManualOverride}
                            onSetManualCommands={onSetManualCommands}
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
                <UpgradeShop
                    budget={game.budget}
                    activeUpgrades={game.activeUpgrades || new Set()}
                    onPurchase={(id, cost) => {
                        onPurchaseUpgrade(id, cost);
                        addToast({ id: `buy_${Date.now()}`, type: 'SUCCESS', title: 'Upgrade Purchased', message: 'System upgraded successfully.' });
                    }}
                    onClose={() => setShowShop(false)}
                />
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
