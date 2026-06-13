import React, { useState, useEffect, useCallback } from 'react';
import { TopologicalMap } from './TopologicalMap';
import { TrainDetails } from './TrainDetails';
import { UpgradeShop } from './UpgradeShop';
import { DataDashboard } from './DataDashboard';
import { AlertTriangle, ShoppingCart, Users, Database, DollarSign, Menu, TrendingUp, Smile, Train, MessageSquare } from 'lucide-react';
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
    failed?: boolean;
    stewardDeployed?: boolean;
    stewardTravelTime?: number;
    stewardRepairTime?: number;
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
        timeOfDay: number;
        satisfaction: number; 
        efficiency: number; 
        budget: number; 
        totalPassengersTransported?: number;
        events: EventStateProps[]; 
        maintenanceStrategy: 'REACTIVE' | 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE'; 
        activeUpgrades?: Set<string>; 
        tutorialStep?: number;
        dataLakeSavings?: number;
        moneyPopups: { id: string; amount: number; x: number; timestamp: number }[];
        stewardsCount: number;
        stewardsBusy: number;
        stewardTrainingLevel: number;
        automatedPIDS: boolean;
        isAnnouncementActive: boolean;
        announcementTimer: number;
        sensorLevel: number;
        dataAnalystsCount: number;
        hasARIIS: boolean;
        hasTRES: boolean;
        stewardSpecialTraining: boolean;
        autoStewardCall: boolean;
        unlockedStrategies: Set<string>;
        activeResearch: 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE' | null;
        researchProgress: number;
        researchDuration: number;
        researchTimeRemaining: number;
    };
    fleet?: {
        total: number;
        active: number;
        depot: number;
        broken: number;
    };
    onSetManualOverride?: (trainId: string, isManual: boolean) => void;
    onSetManualCommands?: (trainId: string, throttle: number, brake: number) => void;
    onPurchaseUpgrade?: (upgradeId: string, cost: number) => void;
    onEmergencyTrigger?: () => void;
    onScenarioTrigger?: (scenarioId: string) => void;
    onSetStrategy?: (strategy: 'REACTIVE' | 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE') => void;
    onResolveAnomaly?: (anomalyId: string) => void;
    onDeployTrain?: (trainId: string) => void;
    onReturnToDepot?: (trainId: string) => void;
    onResetEmergency?: (trainId: string) => void;
    onBroadcastAnnouncement?: () => void;
    onStartResearch?: (strategy: 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE', cost: number) => void;
}

export const ControlRoom: React.FC<ControlRoomProps> = ({ 
    trains, 
    stations, 
    logs, 
    anomalies, 
    game, 
    fleet,
    onSetManualOverride, 
    onSetManualCommands,
    onPurchaseUpgrade,
    onEmergencyTrigger,
    onScenarioTrigger,
    onSetStrategy,
    onResolveAnomaly,
    onDeployTrain,
    onReturnToDepot,
    onResetEmergency,
    onBroadcastAnnouncement,
    onStartResearch
}) => {
    const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
    const [showShop, setShowShop] = useState(false);
    const [showData, setShowData] = useState(false);
    const [showLog, setShowLog] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [eventHistory, setEventHistory] = useState<{ id: string, name: string, description: string, type: 'DELAY' | 'FAILURE' | 'INFO', timestamp: number }[]>([]);
    const lastEventIdRef = React.useRef<string | null>(null);
    
    const hasFailedTrain = anomalies && anomalies.some(a => a.failed && !a.stewardDeployed);
    const isDataLocked = (game.tutorialStep ?? 0) >= 3 && (game.totalPassengersTransported !== undefined && game.totalPassengersTransported < 50);

    const addToast = useCallback((toast: Toast) => {
        setToasts(prev => {
            if (prev.find(t => t.id === toast.id)) return prev;
            const updated = [...prev, toast];
            if (updated.length > 3) {
                return updated.slice(updated.length - 3);
            }
            return updated;
        });
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Convert Game Events to Toasts & Accumulate History
    useEffect(() => {
        if (game.events.length > 0) {
            setEventHistory(prev => {
                const updated = [...prev];
                let changed = false;
                game.events.forEach(evt => {
                    if (!updated.some(e => e.id === evt.id)) {
                        updated.push(evt);
                        changed = true;
                    }
                });
                let sorted = changed ? updated.sort((a, b) => b.timestamp - a.timestamp) : prev;
                if (sorted.length > 100) {
                    sorted = sorted.slice(0, 100);
                }
                return sorted;
            });

            const latestEvent = game.events[game.events.length - 1];
            if (lastEventIdRef.current !== latestEvent.id) {
                lastEventIdRef.current = latestEvent.id;
                
                // Only show toast notifications for high-priority/impact events to avoid flooding the screen
                const isHighPriority = latestEvent.type === 'FAILURE' || 
                                       latestEvent.name === 'FORSKNING' || 
                                       latestEvent.name === 'Train Dispatched' || 
                                       latestEvent.name === 'Morning Rush' ||
                                       latestEvent.name === 'NØDSTOP' ||
                                       latestEvent.name === 'TUTORIAL';
                                       
                if (isHighPriority) {
                    setTimeout(() => {
                        addToast({
                            id: latestEvent.id,
                            type: latestEvent.type === 'FAILURE' ? 'ERROR' : 'INFO',
                            title: latestEvent.name || 'Hændelse',
                            message: latestEvent.description
                        });
                    }, 0);
                }
            }
        }
    }, [game.events, addToast]);

    const selectedTrain = trains.find(t => t.id === selectedTrainId);

    // Advisor Message and Type computed dynamically based on tutorial/operational state
    let advisorMessage = "";
    let advisorType: 'TUTORIAL' | 'WARNING' | 'TIP' = 'TUTORIAL';

    const activeAnomalies = anomalies.filter(a => a.severity > 0);

    // Prioritize Tutorial Steps first
    if (game.tutorialStep === 0) {
        advisorMessage = "Velkommen, Direktør! Driften er i gang, og TRN01 kører på linjen. Vent på, at toget samler sine første passagerer op og tjener penge.";
        advisorType = 'TUTORIAL';
    } else if (game.tutorialStep === 1) {
        advisorMessage = "Hov, der er opstået en kritisk dørfejl på TRN01! Klik på 'SEND STEWARD' i alarmpanelet til højre for at udbedre fejlen.";
        advisorType = 'WARNING';
    } else if (game.tutorialStep === 2) {
        advisorMessage = "Flot arbejde! Toget kører igen. Nu hvor du har tjent nogle penge, kan du åbne SHOP-fanen og købe et nyt tog (Buy New Train) for at udvide driften.";
        advisorType = 'TUTORIAL';
    } else {
        // Normal game tips / messages
        if (showData) {
            advisorMessage = "Her er DATA-dashboardet. Vælg 'PREDICTIVE' (prædiktiv) vedligeholdelse for at opdage fejl før de sker, og udbedre dem her.";
            advisorType = 'TUTORIAL';
        } else if (showShop) {
            advisorMessage = "Butikken er åben! Køb opgraderinger som 'Buy New Train' eller 'High-Speed Doors' for at øge kapaciteten og hastigheden.";
            advisorType = 'TUTORIAL';
        } else if (selectedTrain?.isManualOverride) {
            advisorMessage = "Manuel styring aktiveret! Brug skyderne til Throttle (gas) og Brake (bremse) til at køre toget.";
            advisorType = 'TUTORIAL';
        } else if (selectedTrain) {
            advisorMessage = "Tog valgt! Se detaljer til venstre. Du kan aktivere 'Manuel styring' (Manual Override) for selv at styre toget!";
            advisorType = 'TUTORIAL';
        } else if (activeAnomalies.length > 0) {
            advisorMessage = `Kritisk fejl på ${activeAnomalies[0].trainId} (${activeAnomalies[0].component})! Klik på 'SEND STEWARD' i alarmpanelet til højre!`;
            advisorType = 'WARNING';
        } else if (game.satisfaction < 50) {
            advisorMessage = "Passagererne er utilfredse! Køb flere tog og deploy dem for at mindske ventetiden.";
            advisorType = 'TIP';
        } else if (game.efficiency < 80) {
            advisorMessage = "Systemets energieffektivitet er lav. Opgrader til 'Regen Braking Mk II' i butikken for at spare penge.";
            advisorType = 'TIP';
        } else {
            advisorMessage = "Alt kører stabilt! Hold øje med økonomien, og overvej at udvide din flåde i SHOPPEN.";
            advisorType = 'TIP';
        }
    }

    return (
        <div className="relative w-screen h-screen bg-slate-950 overflow-hidden font-sans">

            {/* 1. Fullscreen Map Layer (Background) */}
            <div className="absolute inset-0 z-0">
                <TopologicalMap 
                    trains={trains} 
                    stations={stations}
                    moneyPopups={game.moneyPopups || []}
                    onTrainClick={(id) => setSelectedTrainId(id)}
                    isRouteExtended={game.activeUpgrades?.has('ROUTE_EXTENSION_1') || false}
                    anomalies={anomalies}
                />
            </div>

            {/* 2. UI Layer (CSS Grid Layout based on 4-Zone Strategy) */}
            <div className="absolute inset-0 z-10 pointer-events-none grid grid-cols-[280px_1fr_280px] grid-rows-[auto_1fr_auto] p-4 gap-4">
                
                {/* HUD Top Bar (Top Row) */}
                <div className="col-start-1 pointer-events-none"></div>

                {/* Center: Stat Bubbles */}
                <div className="col-start-2 justify-self-center flex gap-4 pointer-events-auto">
                    {/* Clock Bubble */}
                    <div className="group relative bg-slate-900/90 backdrop-blur-md pl-4 pr-6 py-2 rounded-full border-2 border-slate-700 shadow-xl flex items-center gap-3 transition-all hover:scale-105 hover:border-emerald-500 cursor-help">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider text-center">Tid</span>
                            <span className="text-xl font-black font-mono text-emerald-400">
                                {Math.floor(game.timeOfDay / 3600).toString().padStart(2, '0')}:
                                {Math.floor((game.timeOfDay % 3600) / 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                        {/* Custom Tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 hidden group-hover:block bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl z-50 text-xs text-slate-200 pointer-events-none leading-relaxed animate-in fade-in duration-200">
                            <div className="font-bold text-emerald-400 mb-1">⏰ KLOKKESLÆT</div>
                            Klokkeslæt i simulationen. Driften kører i døgndrift. Tiden går hurtigere end i virkeligheden.
                        </div>
                    </div>

                    {/* Budget Bubble */}
                    <div className="group relative bg-slate-900/90 backdrop-blur-md pl-3 pr-6 py-2 rounded-full border-2 border-slate-700 shadow-xl flex items-center gap-3 transition-all hover:scale-105 hover:border-emerald-500 cursor-help">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                            <DollarSign size={20} strokeWidth={3} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Budget</span>
                            <span className={`text-xl font-black font-mono ${game.budget < 0 ? 'text-rose-400' : 'text-white'}`}>
                                ${game.budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        {/* Custom Tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 hidden group-hover:block bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl z-50 text-xs text-slate-200 pointer-events-none leading-relaxed animate-in fade-in duration-200">
                            <div className="font-bold text-emerald-400 mb-1">💵 DRIFTSBUDGET</div>
                            Dit nuværende budget. Tjen penge ved at transportere passagerer. Hvis budgettet rammer <span className="text-rose-400 font-bold">-$5.000</span>, går du konkurs!
                        </div>
                    </div>

                    {/* Satisfaction Bubble */}
                    <div className="group relative bg-slate-900/90 backdrop-blur-md pl-3 pr-6 py-2 rounded-full border-2 border-slate-700 shadow-xl flex items-center gap-3 transition-all hover:scale-105 hover:border-blue-500 cursor-help">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Smile size={20} strokeWidth={3} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Tilfredshed</span>
                            <span className="text-xl font-black font-mono text-white">
                                {Math.round(game.satisfaction)}%
                            </span>
                        </div>
                        {/* Custom Tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 hidden group-hover:block bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl z-50 text-xs text-slate-200 pointer-events-none leading-relaxed animate-in fade-in duration-200">
                            <div className="font-bold text-blue-400 mb-1">😊 PASSAGER-TILFREDSHED</div>
                            Gennemsnitlig tilfredshed. Falder gradvist hvis folk venter for længe på stationerne. Hvis den rammer <span className="text-rose-400 font-bold">0%</span>, bliver du fyret!
                        </div>
                    </div>

                    {/* Efficiency Bubble */}
                    <div className="group relative bg-slate-900/90 backdrop-blur-md pl-3 pr-6 py-2 rounded-full border-2 border-slate-700 shadow-xl flex items-center gap-3 transition-all hover:scale-105 hover:border-amber-500 cursor-help">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                            <TrendingUp size={20} strokeWidth={3} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Effektivitet</span>
                            <span className="text-xl font-black font-mono text-white">
                                {game.efficiency.toFixed(0)}%
                            </span>
                        </div>
                        {/* Custom Tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 hidden group-hover:block bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl z-50 text-xs text-slate-200 pointer-events-none leading-relaxed animate-in fade-in duration-200">
                            <div className="font-bold text-amber-400 mb-1">⚡ ENERGIEFFEKTIVITET</div>
                            Systemets energieffektivitet. Højere effektivitet reducerer løbende el-omkostninger. Kan forbedres via regenerativ bremsning i butikken.
                        </div>
                    </div>
                    
                    {/* Passengers Bubble */}
                    <div className="group relative bg-slate-900/90 backdrop-blur-md pl-3 pr-6 py-2 rounded-full border-2 border-slate-700 shadow-xl flex items-center gap-3 transition-all hover:scale-105 hover:border-purple-500 cursor-help">
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                            <span className="font-bold">Px</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Passagerer</span>
                            <span className="text-xl font-black font-mono text-white">
                                {Math.floor(game.totalPassengersTransported || 0).toLocaleString()}
                            </span>
                        </div>
                        {/* Custom Tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 hidden group-hover:block bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl z-50 text-xs text-slate-200 pointer-events-none leading-relaxed animate-in fade-in duration-200">
                            <div className="font-bold text-purple-400 mb-1">👥 TOTAL TRANSPORTERET</div>
                            Det samlede antal passagerer bragt frem. Nå over <span className="text-purple-400 font-bold">5.000</span> passagerer og mindst <span className="text-blue-400 font-bold">80% tilfredshed</span> for at vinde!
                        </div>
                    </div>
                </div>

                {/* Right: Message Log Toggle */}
                <div className="col-start-3 justify-self-end pointer-events-auto">
                    <button 
                        onClick={() => setShowLog(prev => !prev)}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center text-white transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer ${
                            showLog 
                            ? 'bg-blue-600 border-blue-500 hover:bg-blue-500' 
                            : 'bg-slate-900/90 backdrop-blur-md border-slate-700 hover:bg-slate-800 hover:border-blue-500'
                        }`}
                        title="Vis beskedhistorik"
                    >
                        <MessageSquare size={20} />
                    </button>
                </div>

                {/* Left Info Column (Row 2, Col 1) */}
                <div className="col-start-1 row-start-2 flex flex-col gap-2.5 pointer-events-auto self-start">
                    {/* Combined Header & Mission Panel */}
                    <div className="bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 shadow-xl flex flex-col gap-2 w-64 text-xs animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
                            <h1 className="text-base font-black text-white tracking-tight">
                                METRO <span className="text-blue-500">TYCOON</span>
                            </h1>
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 font-bold">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                LIVE
                            </div>
                        </div>

                        <div className="font-bold text-blue-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                            🎯 OPGAVE / MISSION
                        </div>
                        {(game.tutorialStep ?? 0) === 0 && (
                            <div className="flex flex-col gap-1.5">
                                <div className="text-slate-200 font-bold">Fase 0: Kom i gang</div>
                                <div className="text-slate-400 leading-normal mb-1">TRN01 kører på linjen. Vent på, at det ankommer til Flintholm, afleverer passagerer og tjener penge.</div>
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-400/90 font-mono">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                                    <span>☐ Afventer passageraflevering...</span>
                                </div>
                            </div>
                        )}
                        {game.tutorialStep === 1 && (
                            <div className="flex flex-col gap-1.5">
                                <div className="text-rose-400 font-bold">Fase 1: Udbedr fejl!</div>
                                <div className="text-slate-400 leading-normal mb-1">Dørene på TRN01 har en kritisk fejl. Klik på <span className="font-bold text-rose-400">SEND STEWARD</span> i alarmpanelet til højre for at udbedre fejlen.</div>
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-rose-400 font-mono">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                    <span>☐ Udsend steward til TRN01 (Højre side)</span>
                                </div>
                            </div>
                        )}
                        {game.tutorialStep === 2 && (
                            <div className="flex flex-col gap-1.5">
                                <div className="text-blue-400 font-bold">Fase 2: Udvid flåden</div>
                                <div className="text-slate-400 leading-normal mb-1">Driften skal udvides! Åbn <span className="font-bold text-blue-400">BUTIK-knappen</span> i bunden, og køb et nyt tog (<span className="font-bold text-emerald-450">Buy New Train</span>) for $8.000.</div>
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-400 font-mono">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span>☐ Køb nyt tog i BUTIK (Bund)</span>
                                </div>
                            </div>
                        )}
                        {(game.tutorialStep ?? 0) >= 3 && (
                            <div className="flex flex-col gap-1.5">
                                <div className="text-emerald-400 font-bold">Fase 3: Fri leg (Mål)</div>
                                <div className="flex flex-col gap-1.5 text-[11px] font-mono">
                                    <div className="flex justify-between items-center border-b border-slate-800 pb-1 text-slate-300">
                                        <span>{game.activeUpgrades?.has('ROUTE_EXTENSION_1') ? '☒' : '☐'} 1. Nørreport rute</span>
                                        <span className={game.activeUpgrades?.has('ROUTE_EXTENSION_1') ? 'text-emerald-400 font-bold' : 'text-slate-500 font-bold'}>
                                            {game.activeUpgrades?.has('ROUTE_EXTENSION_1') ? '✓ KLAR' : 'MANGLER'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-800 pb-1 text-slate-300">
                                        <span>{(game.totalPassengersTransported || 0) >= 5000 ? '☒' : '☐'} 2. Transporter pax</span>
                                        <span className={(game.totalPassengersTransported || 0) >= 5000 ? 'text-emerald-400 font-bold' : 'text-slate-350 font-bold'}>
                                            {Math.floor(game.totalPassengersTransported || 0)}/5.000
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-300">
                                        <span>{game.satisfaction >= 80 ? '☒' : '☐'} 3. Tilfredshed ≥ 80%</span>
                                        <span className={game.satisfaction >= 80 ? 'text-emerald-400 font-bold' : 'text-rose-450 font-bold'}>
                                            {Math.round(game.satisfaction)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Personnel & Announcements Panel */}
                    <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-xl flex flex-col gap-2.5 w-64 text-xs animate-in slide-in-from-left duration-300">
                        <div className="font-bold text-blue-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                            👥 PERSONALE & INFO
                        </div>
                        <div className="flex flex-col gap-1.5 text-slate-350">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                                <span>Stewards:</span>
                                <span className="font-bold font-mono text-slate-200">
                                    {game.stewardsCount - game.stewardsBusy} / {game.stewardsCount} ledige
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                                <span>Dataanalytikere:</span>
                                <span className="font-bold font-mono text-slate-200">
                                    {game.dataAnalystsCount} ansatte
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                                <span>Uddannelse:</span>
                                <span className="font-bold text-slate-200">
                                    {game.stewardTrainingLevel === 1 ? 'Lvl 1: Basis' : game.stewardTrainingLevel === 2 ? 'Lvl 2: Certificeret' : 'Lvl 3: Ekspert'}
                                </span>
                            </div>
                            {game.automatedPIDS ? (
                                <div className="text-[10px] bg-emerald-950/40 text-emerald-400 px-2 py-1.5 rounded border border-emerald-500/20 font-bold flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                    AUTO PIDS AKTIV (-50% vrede)
                                </div>
                            ) : (
                                <div className="text-[10px] bg-slate-950/40 text-slate-400 px-2 py-1.5 rounded border border-slate-800 font-bold flex items-center gap-1.5">
                                    Intet auto-info system
                                </div>
                            )}
                            {game.hasARIIS && (
                                <div className="text-[10px] bg-indigo-950/40 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20 font-bold">
                                    ✓ ARIIS Infrastruktur-scanner
                                </div>
                            )}
                            {game.hasTRES && (
                                <div className="text-[10px] bg-cyan-950/40 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 font-bold">
                                    ✓ TRES Togtelemetri
                                </div>
                            )}
                            {game.stewardSpecialTraining && (
                                <div className="text-[10px] bg-amber-950/40 text-amber-400 px-2 py-1 rounded border border-amber-500/20 font-bold">
                                    ✓ Stewards: Specialuddannet
                                </div>
                            )}

                            {game.isAnnouncementActive && (
                                <div className="text-[10px] bg-blue-950/40 text-blue-400 px-2 py-1.5 rounded border border-blue-500/20 font-bold flex justify-between items-center animate-pulse">
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></div>
                                        HØJTALER INFO AKTIV
                                    </span>
                                    <span className="font-mono text-[10px] text-blue-300 font-black">{Math.ceil(game.announcementTimer)}s</span>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    if (game.budget >= 50 && onBroadcastAnnouncement) {
                                        onBroadcastAnnouncement();
                                    }
                                }}
                                disabled={game.budget < 50 || game.isAnnouncementActive}
                                className={`w-full py-2 rounded-xl text-[11px] font-bold transition-all shadow-md mt-1 flex items-center justify-center gap-1.5 ${
                                    game.isAnnouncementActive
                                    ? 'bg-blue-900/40 text-blue-400 border border-blue-800/40 cursor-not-allowed'
                                    : game.budget < 50
                                        ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/30 active:scale-95'
                                }`}
                            >
                                📢 Manuel Udkald ($50)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Middle Interactive Zone / Floating Panels (Row 2, Col 2) */}
                <div className="col-start-2 row-start-2 relative flex items-start justify-start pointer-events-none px-4">
                    {selectedTrain && (() => {
                        const isSpawnBlocked = trains.some(t => t.state !== 'DEPOT' && t.position < 300);
                        return (
                            <div className="pointer-events-auto z-[100] animate-in fade-in slide-in-from-left duration-300">
                                <TrainDetails
                                    train={selectedTrain}
                                    onClose={() => setSelectedTrainId(null)}
                                    onSetManualOverride={onSetManualOverride}
                                    onSetManualCommands={onSetManualCommands}
                                    anomalies={anomalies.filter(a => a.trainId === selectedTrain.id && a.severity > 0)}
                                    maintenanceStrategy={game.maintenanceStrategy}
                                    isSpawnBlocked={isSpawnBlocked}
                                    stewardsCount={game.stewardsCount}
                                    stewardsBusy={game.stewardsBusy}
                                    onRepairAnomaly={(id) => {
                                        if (onResolveAnomaly) {
                                            onResolveAnomaly(id);
                                            addToast({ id: `fix_${Date.now()}`, type: 'SUCCESS', title: 'Tog Repareret', message: 'Systemet er nu fuldt funktionsdygtigt.' });
                                        }
                                    }}
                                    onDeploy={() => {
                                        if (game.budget < 500) {
                                            addToast({ id: 'err', type: 'ERROR', title: 'Utilstrækkelige Midler', message: 'Det koster $500 at indsætte et tog.' });
                                            return;
                                        }
                                        if (onDeployTrain) onDeployTrain(selectedTrain.id);
                                    }}
                                    onReturnToDepot={() => {
                                        if (onReturnToDepot) onReturnToDepot(selectedTrain.id);
                                    }}
                                    onResetEmergency={() => {
                                        if (onResetEmergency) onResetEmergency(selectedTrain.id);
                                    }}
                                />
                            </div>
                        );
                    })()}
                </div>

                {/* Right Operations Column (Row 2, Col 3) */}
                <div className="col-start-3 row-start-2 flex flex-col items-end gap-4 pointer-events-auto self-start">
                    {/* Fleet Overview Panel */}
                    {fleet && (
                        <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-xl flex flex-col gap-2 w-48 text-sm animate-in slide-in-from-right duration-500">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                <Train size={14} /> FLÅDESTATUS
                            </div>
                            <div className="flex justify-between items-center text-slate-200">
                                <span>Total Tog</span>
                                <span className="font-bold font-mono">{fleet.total}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-400">
                                <span>I Drift</span>
                                <span className="font-bold font-mono">{fleet.active}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-500">
                                <span>I Depot</span>
                                <span className="font-bold font-mono">{fleet.depot}</span>
                            </div>
                            <div className={`flex justify-between items-center ${fleet.broken > 0 ? 'text-rose-400 animate-pulse font-bold' : 'text-slate-600'}`}>
                                <span>Værksted</span>
                                <span className="font-mono">{fleet.broken}</span>
                            </div>
                        </div>
                    )}

                    {/* Alarmer & Fejl Panel */}
                    {anomalies.filter(a => a.detected).length > 0 && (
                        <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-rose-500/30 shadow-xl flex flex-col gap-2 w-64 text-xs animate-in slide-in-from-right duration-300">
                            <div className="font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 animate-pulse">
                                <AlertTriangle size={14} className="text-rose-500" /> ALARMER & FEJL
                            </div>
                            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto custom-scrollbar">
                                {anomalies.filter(a => a.detected).map(anom => {
                                    const cost = anom.failed ? 800 : (game.maintenanceStrategy === 'PREDICTIVE' ? 100 : (game.maintenanceStrategy === 'CONDITIONAL' ? 250 : 300));
                                    const availableStewards = game.stewardsCount - game.stewardsBusy;

                                    return (
                                        <div key={anom.id} className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex flex-col gap-1.5 text-left">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className={`font-bold ${anom.failed ? 'text-rose-400' : 'text-amber-400'}`}>{anom.trainId}</span>
                                                    <span className="text-slate-600 mx-1">|</span>
                                                    <span className="text-slate-350">{anom.component}</span>
                                                </div>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                                                    anom.failed 
                                                    ? 'bg-rose-950/60 text-rose-400 border border-rose-500/20' 
                                                    : 'bg-amber-950/60 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                    {anom.failed ? 'Nedbrud' : 'Anomali'}
                                                </span>
                                            </div>

                                            {anom.stewardDeployed ? (
                                                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-850 text-[10px] text-slate-450">
                                                    {anom.stewardTravelTime !== undefined && anom.stewardTravelTime > 0 ? (
                                                        <div className="flex justify-between items-center text-blue-400 font-bold">
                                                            <span>Udsendt steward...</span>
                                                            <span className="text-white font-mono">~{Math.ceil(anom.stewardTravelTime)}s</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-between items-center text-emerald-455 font-bold">
                                                            <span>Udbedrer fejl...</span>
                                                            <span className="text-white font-mono">~{Math.ceil(anom.stewardRepairTime ?? 0)}s</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        if (onResolveAnomaly) {
                                                            onResolveAnomaly(anom.id);
                                                            if (anom.failed) {
                                                                addToast({ id: `deploy_${Date.now()}`, type: 'SUCCESS', title: 'Steward Udsendt', message: 'Personale sendt til nødstop.' });
                                                            } else {
                                                                addToast({ id: `fix_${Date.now()}`, type: 'SUCCESS', title: 'Reparation Igangsat', message: 'Tidlig forebyggende vedligehold udført.' });
                                                            }
                                                        }
                                                    }}
                                                    disabled={anom.failed && availableStewards <= 0}
                                                    className={`w-full py-1.5 rounded-lg text-center font-bold text-[10px] transition-all active:scale-95 ${
                                                        anom.failed 
                                                        ? 'bg-rose-600 hover:bg-rose-500 text-white disabled:bg-slate-850 disabled:text-slate-650 disabled:cursor-not-allowed' 
                                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                                                    }`}
                                                >
                                                    {anom.failed 
                                                        ? (availableStewards <= 0 ? 'INGEN LEDIGE STEWARDS' : `SEND STEWARD ($${cost})`) 
                                                        : `REPARER ($${cost})`
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Dock (Row 3, Col 2) */}
                <div className="col-start-2 row-start-3 justify-self-center pointer-events-auto pb-4">
                    {(game.tutorialStep ?? 0) !== 0 && (
                        <div className="flex items-center gap-4 bg-slate-950/80 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/10 shadow-2xl transform transition-all hover:scale-105">
                            <DockButton
                                icon={<ShoppingCart size={24} />}
                                label="BUTIK"
                                color="blue"
                                onClick={() => setShowShop(true)}
                                disabled={(game.tutorialStep ?? 0) === 1}
                                glow={(game.tutorialStep ?? 0) === 2}
                            />

                            <DockButton
                                icon={<Database size={24} />}
                                label={isDataLocked ? "LÅST (50 PAX)" : "DATA"}
                                color="orange"
                                onClick={() => setShowData(true)}
                                disabled={(game.tutorialStep ?? 0) === 1 ? false : ((game.tutorialStep ?? 0) < 3 || isDataLocked)}
                                glow={(game.tutorialStep ?? 0) === 1 || (hasFailedTrain && !showData)}
                            />

                            <div className="w-px h-12 bg-white/10 mx-2"></div>

                            <DockButton
                                icon={<Users size={24} />}
                                label="MYLDRETID"
                                color="yellow"
                                onClick={() => onScenarioTrigger && onScenarioTrigger('MORNING_RUSH')}
                                disabled={(game.tutorialStep ?? 0) < 3}
                            />

                            <DockButton
                                icon={<AlertTriangle size={24} />}
                                label="NØDSTOP"
                                color="red"
                                onClick={() => onEmergencyTrigger && onEmergencyTrigger()}
                                danger
                                disabled={(game.tutorialStep ?? 0) < 3}
                            />
                        </div>
                    )}
                </div>

                {/* Notification Center (Row 3, Col 3) */}
                <div className={`
                    col-start-3 row-start-3 justify-self-end flex flex-col-reverse gap-3 items-end pointer-events-none w-full transition-all duration-300 pb-4
                    ${showLog ? '-translate-x-[340px]' : 'translate-x-0'}
                `}>
                    <Advisor message={advisorMessage} type={advisorType} />
                    <ToastContainer toasts={toasts} onRemove={removeToast} />
                </div>

            </div>

            {/* Modals */}
            {showShop && (
                <UpgradeShop
                    budget={game.budget}
                    activeUpgrades={game.activeUpgrades || new Set()}
                    onPurchase={(id, cost) => {
                        onPurchaseUpgrade?.(id, cost);
                        addToast({ id: `buy_${Date.now()}`, type: 'SUCCESS', title: 'Opgradering Købt', message: 'Driftssystemet er opgraderet.' });
                    }}
                    onClose={() => setShowShop(false)}
                    tutorialStep={game.tutorialStep}
                    stewardTrainingLevel={game.stewardTrainingLevel}
                    stewardsCount={game.stewardsCount}
                    sensorLevel={game.sensorLevel}
                    dataAnalystsCount={game.dataAnalystsCount}
                    hasARIIS={game.hasARIIS}
                    hasTRES={game.hasTRES}
                    stewardSpecialTraining={game.stewardSpecialTraining}
                    autoStewardCall={game.autoStewardCall}
                    totalPassengersTransported={game.totalPassengersTransported}
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
                            addToast({ id: `fix_${Date.now()} `, type: 'SUCCESS', title: 'Fejl Udbedret', message: 'Vedligeholdelse fuldført, og driften er normaliseret.' });
                        }
                    }}
                    onSetStrategy={onSetStrategy}
                    tutorialStep={game.tutorialStep}
                    dataLakeSavings={game.dataLakeSavings}
                    stewardsCount={game.stewardsCount}
                    stewardsBusy={game.stewardsBusy}
                    activeResearch={game.activeResearch}
                    researchProgress={game.researchProgress}
                    researchDuration={game.researchDuration}
                    researchTimeRemaining={game.researchTimeRemaining}
                    unlockedStrategies={game.unlockedStrategies}
                    dataAnalystsCount={game.dataAnalystsCount}
                    sensorLevel={game.sensorLevel}
                    totalPassengersTransported={game.totalPassengersTransported}
                    onStartResearch={onStartResearch}
                />
            )}

            {showLog && (
                <div className="absolute right-0 top-0 h-full w-80 bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 z-40 p-6 flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                        <h3 className="font-black text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare size={16} className="text-blue-400" /> Beskedhistorik
                        </h3>
                        <button onClick={() => setShowLog(false)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {eventHistory.length === 0 ? (
                            <div className="text-slate-500 text-xs italic text-center mt-10">
                                Ingen tidligere beskeder.
                            </div>
                        ) : (
                            eventHistory.map(evt => {
                                const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                return (
                                    <div key={evt.id} className={`p-3 rounded-xl border text-xs flex flex-col gap-1 text-left ${
                                        evt.type === 'FAILURE' 
                                        ? 'bg-rose-950/20 border-rose-500/25 text-rose-200' 
                                        : evt.type === 'DELAY'
                                            ? 'bg-amber-950/20 border-amber-500/25 text-amber-200'
                                            : 'bg-slate-900/60 border-slate-800 text-slate-350'
                                    }`}>
                                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-black uppercase tracking-wider">
                                            <span>{evt.name}</span>
                                            <span className="text-slate-600 font-mono font-normal">{timeStr}</span>
                                        </div>
                                        <p className="leading-relaxed text-slate-400 mt-1">{evt.description}</p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Component for Dock Buttons
const DockButton: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    color: string; 
    onClick: () => void; 
    danger?: boolean;
    disabled?: boolean;
    glow?: boolean;
}> = ({ icon, label, color, onClick, danger, disabled, glow }) => {
    const colorClasses: { [key: string]: string } = {
        blue: disabled ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50',
        orange: disabled ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/50',
        yellow: disabled ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/50',
        red: disabled ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 shadow-red-900/50',
    };

    return (
        <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`
                group relative flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-2xl
                transition-all duration-200 
                ${disabled ? 'opacity-40 cursor-not-allowed bg-slate-900/30 border-slate-800' : 'active:scale-95'}
                ${!disabled && danger ? 'bg-red-950/50 border border-red-500/50 hover:bg-red-900/50' : ''}
                ${!disabled && !danger ? 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50' : ''}
                ${glow ? 'ring-4 ring-emerald-500 animate-pulse' : ''}
            `}
        >
            <div className={`
                p-2 rounded-xl text-white shadow-lg transition-all duration-300 
                ${!disabled ? 'group-hover:-translate-y-1' : ''}
                ${colorClasses[color]}
            `}>
                {icon}
            </div>
            <span className={`text-[10px] font-bold transition-colors ${disabled ? 'text-slate-600' : 'text-slate-400 group-hover:text-white'}`}>{label}</span>
        </button>
    );
};
