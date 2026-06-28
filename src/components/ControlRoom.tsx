import React, { useState, useEffect, useCallback } from 'react';
import { TopologicalMap } from './TopologicalMap';
import { TrainDetails } from './TrainDetails';
import { UpgradeShop } from './UpgradeShop';
import { DataDashboard } from './DataDashboard';
import { AlertTriangle, Users, Database, DollarSign, Menu, TrendingUp, Smile, Train, MessageSquare, Microscope, Plus, Square, CheckSquare, Brain, Clock, ShieldAlert } from 'lucide-react';
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
        trackWear: number;
        trainWear: { [trainId: string]: number };
        inspectorsCount: number;
        engineersCount: number;
        ticketInspectionTimer: number;
        dataAuditTimer: number;
        isDataAuditActive: boolean;
        milestones?: { id: string; name: string; target: number; reward: number; description: string; reached: boolean }[];
        activeMilestonePopup?: { id: string; name: string; reward: number; description: string } | null;
        timeScale: number;
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
    onPerformTrainMaintenance?: (trainId: string) => void;
    onPerformTrackMaintenance?: () => void;
    onStartTicketInspection?: () => void;
    onStartDataAudit?: () => void;
    onSetTimeScale?: (timeScale: number) => void;
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
    onStartResearch,
    onPerformTrainMaintenance,
    onPerformTrackMaintenance,
    onStartTicketInspection,
    onStartDataAudit,
    onSetTimeScale
}) => {
    const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
    const [showShop, setShowShop] = useState(false);
    const [showData, setShowData] = useState(false);
    const [showLog, setShowLog] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [eventHistory, setEventHistory] = useState<{ id: string, name: string, description: string, type: 'DELAY' | 'FAILURE' | 'INFO', timestamp: number }[]>([]);
    const lastEventIdRef = React.useRef<string | null>(null);
    
    const hasFailedTrain = anomalies && anomalies.some(a => a.failed && !a.stewardDeployed);
    const isDataLocked = (game.tutorialStep ?? 0) >= 5 && (game.totalPassengersTransported !== undefined && game.totalPassengersTransported < 50);

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

    // Prioritize Tutorial Steps first
    if (game.tutorialStep === 0) {
        advisorMessage = "Velkommen, Direktør! TRN01 kører allerede. Se pengene tikke ind når passagerer stiger af!";
        advisorType = 'TUTORIAL';
    } else if (game.tutorialStep === 1) {
        advisorMessage = "🚉 Tid til at vokse! Køb dit andet tog i BUTIKKEN (tog-ikonet i bund-docken) for at øge kapaciteten og tjene flere penge.";
        advisorType = 'TUTORIAL';
    } else if (game.tutorialStep === 2) {
        advisorMessage = "⚙️ Tog-slitage! TRN01 er ved at blive slidt. Klik på toget TRN01 på kortet (eller i højre panel) og vælg 'Eftersyn' før det bryder sammen.";
        advisorType = 'WARNING';
    } else if (game.tutorialStep === 3) {
        advisorMessage = "🚨 Din første fejl! TRN01 har en dørfejl. Hold musen over TRN01 (blinker rødt) og klik 'SEND STEWARD'.";
        advisorType = 'WARNING';
    } else if (game.tutorialStep === 4) {
        advisorMessage = "🔬 Forskningscenteret er klar! Åbn 'FORSKNINGSCENTER' i bund-docken og forsk i 'Fast Interval' (Preventive) for kun $100.";
        advisorType = 'TUTORIAL';
    } else {
        // Normal game tips / messages
        if (showData) {
            advisorMessage = "Du har åbnet Forskningscentret! Her kan du investere i R&D (f.eks. PREVENTIVE vedligeholdelse) for at opdage fejl tidligt og reducere nedbrud markant.";
            advisorType = 'TUTORIAL';
        } else if (showShop) {
            advisorMessage = "Indkøbscentret er åbent! Here kan du købe flere tog, uddanne dine stewards til højere niveauer, eller købe automatiseret PIDS for at mindske passagerernes vrede under fejl.";
            advisorType = 'TUTORIAL';
        } else if (selectedTrain?.isManualOverride) {
            advisorMessage = "Manuel styring aktiveret! Brug skyderne til Throttle (gas) og Brake (bremse) til at styre toget. Vær forsigtig med ikke at køre ind i andre tog!";
            advisorType = 'TUTORIAL';
        } else if (selectedTrain) {
            advisorMessage = "Tog valgt! Her kan du se togets hastighed, passagertal, slid-niveau og sende det til eftersyn på værkstedet. Du kan også vælge 'Manuel styring' for selv at styre toget.";
            advisorType = 'TUTORIAL';
        } else if (game.satisfaction < 50) {
            advisorMessage = "⚠️ Passagerernes tilfredshed er meget lav! Indsæt flere tog på ruten for at tømme perronerne, og husk at bruge højtalerudkald 📢 under uventede nedbrud.";
            advisorType = 'WARNING';
        } else if (game.efficiency < 80) {
            advisorMessage = "El-effektiviteten er lav, hvilket øger dine løbende udgifter. Overvej at købe 'Regen Braking' (bremse-energi genvinding) i butikken.";
            advisorType = 'TIP';
        } else {
            advisorMessage = "Systemet kører stabilt! Hold øje med togenes slid-niveauer under 'Flåde' og udfør eftersyn for at forhindre alvorlige nedbrud.";
            advisorType = 'TIP';
        }
    }

    // Calculate live metrics for the advisor
    const totalWaiting = stations ? stations.reduce((acc, s) => acc + s.pax, 0) : 0;
    
    // Live satisfaction decay factor matching the engine
    let decayFactor = 1.0;
    if (game.isAnnouncementActive) {
        decayFactor *= 0.25;
    } else if (game.automatedPIDS) {
        decayFactor *= 0.50;
    }
    const hasStewardWorking = anomalies ? anomalies.some(a => a.failed && a.stewardDeployed && (a.stewardTravelTime ?? 0) <= 0) : false;
    if (hasStewardWorking) {
        decayFactor *= 0.80;
    }

    const advisorAlerts: { id: string; title: string; type: 'CRITICAL' | 'WARNING' | 'TIP'; cause: string; action: string; icon: string }[] = [];

    // 0. Low overall satisfaction warning
    if (game.satisfaction < 70) {
        const activeHvacFailures = anomalies ? anomalies.filter(a => a.component === 'HVAC' && a.failed).length : 0;
        const mainCause = (activeHvacFailures * 0.5 * decayFactor) > (totalWaiting * 0.0004 * decayFactor) 
            ? "defekt HVAC/klima-anlæg i tog" 
            : "passagerkøer på stationerne";
        advisorAlerts.push({
            id: 'low_satisfaction_alert',
            title: `Kritisk lav tilfredshed! (${Math.round(game.satisfaction)}%)`,
            type: 'CRITICAL',
            cause: `Kundetilfredsheden falder pga. ${mainCause}. Falder den til 0%, slutter spillet.`,
            action: 'Køb flere tog, udbedr togfejl, og brug Højttalerudkald 📢 for at dæmpe tabet med 75%.',
            icon: '⚠️'
        });
    }

    // 1. Train failures
    const failedAnoms = anomalies ? anomalies.filter(a => a.failed) : [];
    failedAnoms.forEach(anom => {
        advisorAlerts.push({
            id: `fail_${anom.id}`,
            title: `Driftsstop: ${anom.trainId}`,
            type: 'CRITICAL',
            cause: `Toget holder helt stille pga. ${anom.component}-fejl. Passagerer ophobes, og tilfredsheden falder med -${(totalWaiting * 0.0004 * decayFactor * 100).toFixed(2)}%/s!`,
            action: `Hold musen over ${anom.trainId} på kortet og klik 'SEND STEWARD'. Udsend også Højttalerudkald (📢) under mål for at dæmpe vreden med 75%.`,
            icon: '🚨'
        });
    });

    // 2. Track failure
    const trackAnom = anomalies ? anomalies.find(a => a.trainId === 'TRACK' && a.failed) : null;
    if (trackAnom) {
        advisorAlerts.push({
            id: 'track_fail',
            title: 'Infrastruktur-fejl lammer linjen!',
            type: 'CRITICAL',
            cause: 'Skinnerne er slidt ned til 0% tilstand. Ingen tog kan køre, hvilket skaber massive perronkøer og kritisk fald i tilfredshed.',
            action: 'Klik på "Udfør sporvedligeholdelse ($400)" under Infrastruktur til venstre med det samme.',
            icon: '🚨'
        });
    }

    // 3. Recommend Auto Steward Call
    const hasFailedAnomaly = anomalies ? anomalies.some(a => a.failed) : false;
    const hasAutoSteward = game.activeUpgrades ? game.activeUpgrades.has('AUTO_STEWARD_CALL') : false;
    if (hasFailedAnomaly && !hasAutoSteward) {
        advisorAlerts.push({
            id: 'recommend_auto_steward',
            title: 'Tip: Automatiser Steward-kald',
            type: 'TIP',
            cause: 'Du sender i øjeblikket ledige stewards manuelt under driftsstop, hvilket kan være langsomt og stressende.',
            action: 'Åbn OPGRADERINGER & INDKØB i bunden og køb "Automatisk Steward-kald" ($500) for at sende dem afsted automatisk.',
            icon: '💡'
        });
    }

    // 4. No stewards
    if (failedAnoms.length > 0 && (game.stewardsCount - game.stewardsBusy <= 0)) {
        advisorAlerts.push({
            id: 'no_stewards',
            title: 'Mangler ledige Stewards!',
            type: 'WARNING',
            cause: 'Du har aktive togfejl, men alle dine stewards er optaget af andre nødreparationer.',
            action: 'Åbn "FLÅDE & INDKØB" i bunden og hyr en ekstra Steward ($1.000) for at kunne udbedre fejl parallelt.',
            icon: '👥'
        });
    }

    // 5. Track wear warning
    if (game.trackWear > 70 && !trackAnom) {
        advisorAlerts.push({
            id: 'track_wear',
            title: `Skinner er slidte (${Math.round(100 - game.trackWear)}% tilstand)`,
            type: 'WARNING',
            cause: 'Ved 0% opstår sporskiftefejl, og alle tog stopper, hvilket trækker tilfredsheden hurtigt ned.',
            action: 'Klik på "Slib Skinner & Vedligehold ($400)" i panelet til venstre, eller hyr en Baneingeniør i butikken.',
            icon: '🛠️'
        });
    }

    // 6. Train wear warning
    const wornTrainsList = Object.keys(game.trainWear || {}).filter(id => (game.trainWear[id] || 0) > 70);
    wornTrainsList.forEach(id => {
        if (!anomalies.some(a => a.trainId === id && a.failed)) {
            advisorAlerts.push({
                id: `wear_${id}`,
                title: `Høj slitage på ${id} (${Math.round(game.trainWear[id])}%)`,
                type: 'WARNING',
                cause: 'Tog med over 70% slid risikerer akutte dør- eller motorfejl, hvilket udløser driftsstop og driftsbøder.',
                action: `Vælg toget på kortet/højre panel og udfør "Eftersyn ($150)" for at nulstille slid til 0%.`,
                icon: '⚠️'
            });
        }
    });

    // 7. Overcrowded stations / General capacity warning
    const crowdedStationsList = stations ? stations.filter(s => s.pax > 80) : [];
    if (crowdedStationsList.length > 0) {
        advisorAlerts.push({
            id: 'crowded_stations',
            title: `Overfyldte perroner: ${crowdedStationsList.map(s => s.name).join(', ')}`,
            type: 'WARNING',
            cause: `Der venter ${totalWaiting} passagerer i alt. Køer dræner tilfredsheden med -${(totalWaiting * 0.0004 * decayFactor * 100).toFixed(2)}%/s!`,
            action: 'Køb et ekstra tog i butikken for at øge afgangsfrekvensen, eller opgrader med "Stationspersonale" ($2.050) for hurtigere indstigning.',
            icon: '👥'
        });
    } else if (totalWaiting > 100) {
        advisorAlerts.push({
            id: 'total_waiting_warning',
            title: `Højt passagerpres (${totalWaiting} ventende)`,
            type: 'WARNING',
            cause: `Mange passagerer venter fordelt på stationerne. Det dræner tilfredsheden med -${(totalWaiting * 0.0004 * decayFactor * 100).toFixed(2)}%/s.`,
            action: 'Køb/indsæt flere tog for at øge kapaciteten og køre passagererne væk hurtigere.',
            icon: '👥'
        });
    }

    // 8. Reactive strategy warning
    if (game.maintenanceStrategy === 'REACTIVE' && (game.tutorialStep ?? 0) >= 5) {
        advisorAlerts.push({
            id: 'reactive_strategy',
            title: 'Kører Reaktiv Vedligeholdelse',
            type: 'TIP',
            cause: 'Reaktive reparationer koster $800, giver $1000 i driftsbøder og advarer dig ikke på forhånd.',
            action: 'Åbn Forskningscentret i bunden og forsk i "Fast Interval" eller "Tilstandsbaseret" vedligeholdelse.',
            icon: '💡'
        });
    }

    // 9. Default stable status
    if (advisorAlerts.length === 0) {
        advisorAlerts.push({
            id: 'stable',
            title: 'Driften kører stabilt',
            type: 'TIP',
            cause: 'Ingen akutte fejl eller alvorlig slitage registreret. Passagererne fragtes hurtigt.',
            action: 'Spar op til ruteudvidelsen til Nørreport ($15.000) i butikken for at øge dine billetindtægter.',
            icon: '✅'
        });
    }

    return (
        <div className="grid h-screen w-screen grid-cols-[300px_1fr_300px] grid-rows-[80px_minmax(0,_1fr)_120px] bg-slate-900 text-white overflow-hidden font-sans">

            {/* 1. Map Layer (Center Grid Cell) */}
            <div className="col-start-2 row-start-2 w-full h-full relative overflow-hidden flex items-center justify-center pointer-events-auto">
                <TopologicalMap 
                    trains={trains} 
                    stations={stations}
                    moneyPopups={game.moneyPopups || []}
                    onTrainClick={(id) => setSelectedTrainId(id)}
                    isRouteExtended={game.activeUpgrades?.has('ROUTE_EXTENSION_1') || false}
                    anomalies={anomalies}
                    onResolveAnomaly={onResolveAnomaly}
                    stewardsCount={game.stewardsCount}
                    stewardsBusy={game.stewardsBusy}
                    maintenanceStrategy={game.maintenanceStrategy}
                />

                {/* Floating Advisor / Tutorial Overlay at the top-center of the map */}
                {advisorMessage && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-lg px-4 z-40 pointer-events-none">
                        <div className="pointer-events-auto">
                            <Advisor message={advisorMessage} type={advisorType} />
                        </div>
                    </div>
                )}
            </div>

            {/* HUD Top Bar (Top Row) */}
            <div className="col-start-1 col-span-3 row-start-1 flex items-center justify-between px-8 py-3 bg-slate-800/80 backdrop-blur-md border-b border-slate-700/80 shadow-xl z-25 pointer-events-auto h-20">
                {/* Left: Brand and Clock */}
                <div className="flex items-center gap-6">
                    <h1 className="text-base font-black text-white tracking-tight shrink-0">
                        METRO <span className="text-blue-500">TYCOON</span>
                    </h1>
                    <div className="w-px h-6 bg-white/10"></div>
                    
                    {/* Clock & Speed controls combined */}
                    <div className="group relative flex items-center gap-3 bg-slate-950/60 border border-white/5 rounded-full px-4 py-1.5 shadow-inner">
                        <div className="flex flex-col pr-3 border-r border-white/10">
                            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider text-center">Tid</span>
                            <span className="text-sm font-black font-mono text-emerald-400">
                                {Math.floor(game.timeOfDay / 3600).toString().padStart(2, '0')}:
                                {Math.floor((game.timeOfDay % 3600) / 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                        
                        {/* Speed Controls inline */}
                        <div className="flex items-center gap-1.5 ml-1">
                            <button
                                onClick={() => onSetTimeScale?.(0)}
                                className={`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer select-none border ${
                                    game.timeScale === 0 
                                    ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-md scale-105' 
                                    : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="Pause"
                            >
                                ⏸ PAUSE
                            </button>
                            <button
                                onClick={() => onSetTimeScale?.(1)}
                                className={`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer select-none border ${
                                    game.timeScale === 1 
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-md scale-105' 
                                    : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="Normal hastighed"
                            >
                                ▶ 1x
                            </button>
                            <button
                                onClick={() => onSetTimeScale?.(2)}
                                className={`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer select-none border ${
                                    game.timeScale === 2 
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-md scale-105' 
                                    : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="Hurtig hastighed"
                            >
                                ⏩ 2x
                            </button>
                            <button
                                onClick={() => onSetTimeScale?.(3)}
                                className={`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer select-none border ${
                                    game.timeScale === 3 
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md scale-105' 
                                    : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="Ekstra hurtig hastighed"
                            >
                                ⏭ 4x
                            </button>
                        </div>

                        {/* Clock Tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 hidden group-hover:block bg-slate-950/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 text-sm text-slate-200 pointer-events-none leading-relaxed animate-in fade-in duration-200">
                            <div className="font-bold text-emerald-400 mb-1">⏰ SIMULATIONSTID & TEMPO</div>
                            Simulationen kører i døgndrift. Du kan pause eller øge hastigheden for at accelerere indtægter og drift.
                        </div>
                    </div>
                </div>

                {/* Right: Operations Metrics */}
                <div className="flex items-center gap-6">
                    {/* Budget Widget */}
                    <div className="group relative flex items-center gap-2.5 bg-slate-900/60 border border-white/5 rounded-full pl-2.5 pr-4 py-1 hover:border-emerald-500/30 transition-all cursor-help">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <DollarSign size={14} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Budget</span>
                            <span className={`text-sm font-extrabold font-mono ${game.budget < 0 ? 'text-rose-450' : 'text-white'}`}>
                                ${game.budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div className="absolute top-full right-0 mt-2 w-64 hidden group-hover:block bg-slate-950/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 text-sm text-slate-200 pointer-events-none leading-relaxed">
                            <div className="font-bold text-emerald-400 mb-1">💵 DRIFTSBUDGET</div>
                            Tjen penge ved at transportere passagerer. Hvis budgettet rammer <span className="text-rose-400 font-bold">-$5.000</span>, går du konkurs!
                        </div>
                    </div>

                    {/* Satisfaction mood-bar Widget */}
                    {(() => {
                        const satisfaction = Math.round(game.satisfaction);
                        const moodEmoji = satisfaction >= 80 ? '😊' : satisfaction >= 50 ? '😐' : '😢';
                        const barColor = satisfaction >= 80 ? 'bg-emerald-500' : satisfaction >= 50 ? 'bg-amber-500' : 'bg-rose-500';

                        // Calculate live metrics
                        const totalWaiting = stations ? stations.reduce((acc, s) => acc + s.pax, 0) : 0;
                        const activeHvacFailures = anomalies ? anomalies.filter(a => a.component === 'HVAC' && a.failed).length : 0;

                        let decayFactor = 1.0;
                        if (game.isAnnouncementActive) {
                            decayFactor *= 0.25;
                        } else if (game.automatedPIDS) {
                            decayFactor *= 0.50;
                        }

                        const hasStewardWorking = anomalies ? anomalies.some(a => a.failed && a.stewardDeployed && (a.stewardTravelTime ?? 0) <= 0) : false;
                        if (hasStewardWorking) {
                            decayFactor *= 0.80;
                        }

                        const stationDecay = totalWaiting * 0.0004 * decayFactor;
                        const hvacDecay = activeHvacFailures * 0.5 * decayFactor;
                        const totalDecayRate = stationDecay + hvacDecay;
                        const isDroppingFast = totalDecayRate > 0.05;

                        return (
                            <div className={`group relative flex items-center gap-2.5 bg-slate-900/60 border rounded-full pl-2.5 pr-4 py-1 hover:border-blue-500/30 transition-all cursor-help ${
                                isDroppingFast ? 'border-rose-500/40 animate-pulse' : 'border-white/5'
                            }`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                    isDroppingFast 
                                    ? 'bg-rose-500/20 border border-rose-500 text-rose-400 animate-pulse' 
                                    : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                                }`}>
                                    {isDroppingFast ? '⚠️' : moodEmoji}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        Tilfredshed
                                        {totalDecayRate > 0 && (
                                            <span className="text-rose-450 font-black font-mono animate-bounce">↓</span>
                                        )}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-extrabold font-mono text-white">{satisfaction}%</span>
                                        <div className="w-12 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5 shrink-0">
                                            <div className={`h-full rounded-full ${barColor} transition-all duration-300`} style={{ width: `${satisfaction}%` }}></div>
                                        </div>
                                        {totalDecayRate > 0 && (
                                            <span className="text-sm font-bold font-mono text-rose-400 animate-pulse shrink-0 ml-0.5">
                                                -{totalDecayRate.toFixed(2)}%/s
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute top-full right-0 mt-2 w-64 hidden group-hover:block bg-slate-950/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 text-sm text-slate-200 pointer-events-none leading-relaxed">
                                    <div className="font-bold text-blue-400 mb-1 flex justify-between items-center">
                                        <span>😊 TILFREDSHED</span>
                                        <span className={totalDecayRate > 0 ? "text-rose-400 font-mono text-sm" : "text-emerald-400 font-mono text-sm"}>
                                            {totalDecayRate > 0 ? `-${totalDecayRate.toFixed(2)}%/s` : "STABIL"}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        Hvis tilfredsheden rammer <span className="text-rose-400 font-bold">0%</span>, bliver du fyret.
                                    </div>
                                    {totalDecayRate > 0 && (
                                        <div className="border-t border-white/10 pt-1.5 mt-1.5 flex flex-col gap-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">👥 Venter på station</span>
                                                <span className="text-rose-400 font-mono">-{stationDecay.toFixed(3)}%/s</span>
                                            </div>
                                            {activeHvacFailures > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-rose-400 font-bold">❄️ HVAC-fejl</span>
                                                    <span className="text-rose-500 font-mono">-{hvacDecay.toFixed(2)}%/s</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Efficiency Widget */}
                    <div className="group relative flex items-center gap-2.5 bg-slate-900/60 border border-white/5 rounded-full pl-2.5 pr-4 py-1 hover:border-amber-500/30 transition-all cursor-help">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <TrendingUp size={14} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Effektivitet</span>
                            <span className="text-sm font-extrabold font-mono text-white">
                                {game.efficiency.toFixed(0)}%
                            </span>
                        </div>
                        <div className="absolute top-full right-0 mt-2 w-64 hidden group-hover:block bg-slate-950/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 text-sm text-slate-200 pointer-events-none leading-relaxed">
                            <div className="font-bold text-amber-400 mb-1">⚡ ENERGIEFFEKTIVITET</div>
                            Systemets el-effektivitet. Højere effektivitet reducerer løbende el-omkostninger. Kan forbedres via Regen Braking i butikken.
                        </div>
                    </div>

                    {/* Passengers Widget */}
                    <div className="group relative flex items-center gap-2.5 bg-slate-900/60 border border-white/5 rounded-full pl-2.5 pr-4 py-1 hover:border-purple-500/30 transition-all cursor-help">
                        <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-[12px] font-black">
                            Px
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Passagerer</span>
                            <span className="text-sm font-extrabold font-mono text-white">
                                {Math.floor(game.totalPassengersTransported || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="absolute top-full right-0 mt-2 w-64 hidden group-hover:block bg-slate-950/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 text-sm text-slate-200 pointer-events-none leading-relaxed">
                            <div className="font-bold text-purple-400 mb-1">👥 TOTAL TRANSPORTERET</div>
                            Det samlede antal passagerer bragt frem. Nå over <span className="text-purple-400 font-bold">5.000</span> passagerer og mindst <span className="text-blue-400 font-bold">80% tilfredshed</span> for at vinde!
                        </div>
                    </div>

                    {/* Log button */}
                    <button 
                        onClick={() => setShowLog(prev => !prev)}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                            showLog 
                            ? 'bg-blue-600 border-blue-500 hover:bg-blue-500 shadow-md' 
                            : 'bg-slate-900/90 backdrop-blur-md border-slate-700 hover:bg-slate-800 hover:border-blue-500'
                        }`}
                        title="Vis beskedhistorik"
                    >
                        <MessageSquare size={16} />
                    </button>
                </div>
            </div>

                {/* Left Info Column (Row 2, Col 1) */}
                <div className="col-start-1 row-start-2 flex flex-col gap-4 pointer-events-auto p-4 z-10 w-full h-full overflow-y-auto pr-2">
                    {/* Combined Header & Mission Panel */}
                    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 z-10 shadow-xl p-3.5 rounded-2xl flex flex-col gap-2.5 w-full text-sm animate-in slide-in-from-left duration-300">
                        <div className="font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5 text-sm">
                            🎯 AKTUELLE MÅL
                        </div>
                        <div className="flex flex-col gap-2 font-medium text-slate-350">
                            {(game.tutorialStep ?? 0) === 0 && (
                                <div className="flex items-start gap-2 leading-relaxed text-blue-400">
                                    <Square size={15} className="text-blue-500 shrink-0 mt-0.5 animate-pulse" />
                                    <span>Vent på første passageraflevering...</span>
                                </div>
                            )}
                            {game.tutorialStep === 1 && (
                                <div className="flex items-start gap-2 leading-relaxed text-blue-400">
                                    <Square size={15} className="text-blue-500 shrink-0 mt-0.5 animate-pulse" />
                                    <span>Køb dit andet tog <span className="text-slate-400 font-normal text-sm">(Klik på tog-ikonet i bunden)</span></span>
                                </div>
                            )}
                            {game.tutorialStep === 2 && (
                                <div className="flex items-start gap-2 leading-relaxed text-amber-400">
                                    <Square size={15} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                                    <span>Efterse TRN01 <span className="text-slate-400 font-normal text-sm">(Klik på toget → 'Eftersyn')</span></span>
                                </div>
                            )}
                            {game.tutorialStep === 3 && (
                                <div className="flex items-start gap-2 leading-relaxed text-rose-400">
                                    <Square size={15} className="text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                                    <span>Udbedr TRN01 dørfejl <span className="text-slate-400 font-normal text-sm">(Hover TRN01 → 'SEND STEWARD')</span></span>
                                </div>
                            )}
                            {game.tutorialStep === 4 && (
                                <div className="flex items-start gap-2 leading-relaxed text-purple-400">
                                    <Square size={15} className="text-purple-500 shrink-0 mt-0.5 animate-pulse" />
                                    <span>Forsk i 'Fast Interval' <span className="text-slate-400 font-normal text-sm">(Åbn Forskningscenter)</span></span>
                                </div>
                            )}

                            {(game.tutorialStep ?? 0) >= 5 && (
                                <div className="flex flex-col gap-2">
                                    {game.milestones && game.milestones.filter((ms: any) => !ms.reached).slice(0, 1).map((ms: any) => (
                                        <div key={ms.id} className="flex items-start gap-2 leading-relaxed">
                                            <Square size={15} className="text-slate-400 shrink-0 mt-0.5" />
                                            <span className="text-slate-200">
                                                <span className="font-bold text-amber-400">Næste Mål:</span> {ms.name} ({Math.floor(Math.min(game.totalPassengersTransported || 0, ms.target))}/{ms.target} pax)
                                                {ms.reward > 0 && <span className="text-emerald-400 text-sm ml-1">+${ms.reward.toLocaleString()}</span>}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="border-t border-white/5 mt-1 pt-1" />
                                    <div className="flex items-start gap-2 leading-relaxed">
                                        {game.satisfaction >= 80 ? (
                                            <CheckSquare size={15} className="text-emerald-450 shrink-0 mt-0.5" />
                                        ) : (
                                            <Square size={15} className="text-slate-400 shrink-0 mt-0.5" />
                                        )}
                                        <span className={game.satisfaction >= 80 ? 'text-slate-400 line-through' : 'text-slate-200'}>
                                            Hold tilfredshed ≥ 80% (Nu: {Math.round(game.satisfaction)}%)
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operations Advisor Panel */}
                    {(() => {
                        const hasCriticalAlert = advisorAlerts.some(a => a.type === 'CRITICAL');
                        return (
                            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 z-10 shadow-xl p-3.5 rounded-2xl flex flex-col gap-2 w-full text-sm animate-in slide-in-from-left duration-300">
                                <div className={`font-black uppercase tracking-wider flex items-center gap-1.5 text-sm transition-all duration-300 ${
                                    hasCriticalAlert ? 'text-rose-400 font-black animate-pulse' : 'text-amber-400'
                                }`}>
                                    {hasCriticalAlert ? (
                                        <AlertTriangle size={14} className="text-rose-400 animate-bounce" />
                                    ) : (
                                        <Brain size={14} className="text-amber-400" />
                                    )}
                                    {hasCriticalAlert ? '🚨 DRIFTSRÅDGIVER (AKUT KRISE)' : '🤖 DRIFTSRÅDGIVER'}
                                </div>
                                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                    {advisorAlerts.slice(0, 2).map(alert => (
                                        <div key={alert.id} className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                                            alert.type === 'CRITICAL' 
                                            ? 'bg-rose-950/20 border-rose-500/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]' 
                                            : alert.type === 'WARNING'
                                                ? 'bg-amber-955/20 border-amber-500/20'
                                                : 'bg-emerald-950/20 border-emerald-500/20'
                                        }`}>
                                            <div className="flex items-center gap-1.5 font-bold text-slate-100">
                                                <span>{alert.icon}</span>
                                                <span className={alert.type === 'CRITICAL' ? 'text-rose-350' : alert.type === 'WARNING' ? 'text-amber-300' : 'text-emerald-450'}>
                                                    {alert.title}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-450 leading-relaxed">
                                                <span className="font-bold text-slate-350">Hvorfor:</span> {alert.cause}
                                            </div>
                                            <div className="text-sm text-slate-300 leading-relaxed font-semibold">
                                                <span className="font-bold text-slate-200">Råd:</span> {alert.action}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Tycoon Operations & Infrastructure Panel */}
                    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 z-10 shadow-xl p-3.5 rounded-2xl flex flex-col gap-1.5 w-full text-sm animate-in slide-in-from-left duration-300">
                        <div className="font-black text-orange-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5 text-sm">
                            🛠️ INFRASTRUKTUR & DRIFT
                        </div>
                        <div className="flex flex-col gap-2">
                            {/* Track Wear Condition */}
                            <div className="flex flex-col gap-1 text-slate-350">
                                <div className="flex justify-between text-sm">
                                    <span>Spor-tilstand:</span>
                                    <span className={`font-bold font-mono ${game.trackWear > 80 ? 'text-red-400 font-black animate-pulse' : game.trackWear > 45 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                        {Math.round(100 - game.trackWear)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-300 ${
                                            game.trackWear > 80 ? 'bg-red-500' : game.trackWear > 45 ? 'bg-yellow-500' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${100 - game.trackWear}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="group relative w-full">
                                <button
                                    onClick={() => {
                                        if (game.budget >= 400 && onPerformTrackMaintenance) {
                                            onPerformTrackMaintenance();
                                        }
                                    }}
                                    disabled={game.budget < 400}
                                    className={`w-full py-1.5 rounded-xl text-sm font-bold transition-all shadow-md mt-1 flex items-center justify-center gap-1 ${
                                        game.budget < 400
                                        ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
                                        : 'bg-orange-600 hover:bg-orange-500 text-white active:scale-95'
                                    }`}
                                >
                                    🔧 Slib Skinner & Vedligehold ($400)
                                </button>
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-64 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 delay-500 bg-slate-950/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 text-sm text-slate-200 leading-relaxed">
                                    <div className="font-bold text-orange-400 mb-1">🔧 SKINNESLIBNING</div>
                                    Udfører øjeblikkelig sporvedligeholdelse. Nulstiller skinneslitage til 0% for at forhindre alvorlige sporsignalfejl.
                                </div>
                            </div>

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
                                    trainWear={game.trainWear}
                                    onPerformTrainMaintenance={onPerformTrainMaintenance}
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

                {/* Right Info Column (Row 3, Col 3) */}
                <div className="col-start-3 row-start-2 flex flex-col items-end gap-4 pointer-events-auto p-4 z-10 w-full h-full overflow-y-auto pr-2">
                    {/* Drift & Udvikling Panel */}
                    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 z-10 shadow-xl p-3.5 rounded-2xl flex flex-col gap-2 w-full text-sm animate-in slide-in-from-right duration-300">
                        <div className="font-black text-blue-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5 text-sm">
                            👥 DRIFT & UDVIKLING
                        </div>
                        <div className="flex flex-col gap-2.5 text-slate-350">
                            {/* Stewards count progress bar */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-sm">
                                    <span>Steward status:</span>
                                    <span className="font-bold font-mono text-white">
                                        {game.stewardsCount - game.stewardsBusy}/{game.stewardsCount} Ledige
                                    </span>
                                </div>
                                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5 flex">
                                    <div 
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${((game.stewardsCount - game.stewardsBusy) / game.stewardsCount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Active Research Progress */}
                            {game.activeResearch && (
                                <div className="flex flex-col gap-1 bg-slate-900/30 p-2 rounded-xl border border-white/5 mt-1">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-1 font-bold text-amber-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></div>
                                            Forsker i {game.activeResearch}
                                        </span>
                                        <span className="font-mono text-sm text-white">
                                            {Math.round((game.researchProgress / game.researchDuration) * 100)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5 mt-0.5">
                                        <div 
                                            className="h-full bg-amber-500 transition-all duration-300"
                                            style={{ width: `${(game.researchProgress / game.researchDuration) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Current Maintenance Strategy */}
                            <div className="flex justify-between items-center border-b border-white/5 pb-1 text-sm mt-1">
                                <span className="text-slate-400">Vedligeholdelse:</span>
                                <span className="font-black font-mono text-purple-400 uppercase tracking-wider">
                                    {game.maintenanceStrategy}
                                </span>
                            </div>

                            {game.isAnnouncementActive && (
                                <div className="text-[12px] bg-blue-950/40 text-blue-400 px-1.5 py-1 rounded border border-blue-500/10 font-bold flex justify-between items-center animate-pulse">
                                    <span className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></div>
                                        Udkald i gang...
                                    </span>
                                    <span className="font-mono text-blue-300 font-black">{Math.ceil(game.announcementTimer)}s</span>
                                </div>
                            )}

                            <div className="group relative w-full mt-0.5">
                                <button
                                    onClick={() => {
                                        if (game.budget >= 25 && onBroadcastAnnouncement) {
                                            onBroadcastAnnouncement();
                                        }
                                    }}
                                    disabled={game.budget < 25 || game.isAnnouncementActive}
                                    className={`w-full py-1.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer ${
                                        game.isAnnouncementActive
                                        ? 'bg-blue-900/40 text-blue-400 border border-blue-800/40 cursor-not-allowed'
                                        : game.budget < 50
                                            ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-450/30 active:scale-95'
                                    }`}
                                >
                                    📢 Manuel Udkald ($25)
                                </button>
                                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-64 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 bg-slate-950/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 text-sm text-slate-200 leading-relaxed">
                                    <div className="font-bold text-blue-400 mb-1">📢 MANUELT UDKALD</div>
                                    Udsender et højtalerudkald om forsinkelser. Reducerer faldet i passagerernes tilfredshed med 75% i 15 sekunder.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Dock (Row 3, Col 2) */}
                <div className="col-start-1 col-span-3 row-start-3 flex items-center justify-center pointer-events-auto z-10">
                    <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur-md px-6 py-2.5 rounded-3xl border border-slate-700 shadow-2xl transform transition-all hover:scale-105 z-10">
                        <DockButton
                            icon={
                                <div className="relative">
                                    <Train size={24} />
                                    <span className="absolute -top-1.5 -right-1.5 text-[9px] font-black bg-blue-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center border border-slate-900">+</span>
                                </div>
                            }
                            label="FLÅDE & INDKØB"
                            color="blue"
                            onClick={() => setShowShop(true)}
                            disabled={(game.tutorialStep ?? 0) < 1}
                            glow={(game.tutorialStep ?? 0) === 1}
                        />

                        <DockButton
                            icon={<Microscope size={24} />}
                            label={isDataLocked ? "LÅST (50 PAX)" : "FORSKNINGSCENTER"}
                            color="orange"
                            onClick={() => setShowData(true)}
                            disabled={
                                (game.tutorialStep ?? 0) < 4
                                ? true
                                : ((game.tutorialStep ?? 0) >= 5 && isDataLocked)
                            }
                            glow={(game.tutorialStep ?? 0) === 4 || ((game.tutorialStep ?? 0) >= 5 && hasFailedTrain && !showData)}
                        />


                        <div className="w-px h-12 bg-white/10 mx-2"></div>

                        <DockButton
                            icon={<AlertTriangle size={24} />}
                            label="NØDSTOP"
                            color="red"
                            onClick={() => onEmergencyTrigger && onEmergencyTrigger()}
                            danger
                            disabled={(game.tutorialStep ?? 0) < 5}
                        />
                    </div>
                </div>

                {/* Notification Center */}
                <div className={`
                    absolute bottom-4 right-4 flex flex-col-reverse gap-3 items-end pointer-events-none w-[340px] transition-all duration-300 z-50
                    ${showLog ? '-translate-x-[340px]' : 'translate-x-0'}
                `}>
                    <ToastContainer toasts={toasts} onRemove={removeToast} />
                </div>

            {/* Modals */}
            {showShop && (
                <UpgradeShop
                    budget={game.budget}
                    activeUpgrades={game.activeUpgrades || new Set()}
                    onPurchase={(id, cost) => {
                        onPurchaseUpgrade?.(id, cost);
                        if (id === 'BUY_TRAIN') {
                            addToast({ id: `buy_${Date.now()}`, type: 'SUCCESS', title: 'Nyt Tog Leveret!', message: 'Toget holder nu klar i depotet (nederst til venstre).' });
                            setShowShop(false);
                        } else {
                            addToast({ id: `buy_${Date.now()}`, type: 'SUCCESS', title: 'Opgradering Købt', message: 'Driftssystemet er opgraderet.' });
                        }
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
                    inspectorsCount={game.inspectorsCount}
                    engineersCount={game.engineersCount}
                    ticketInspectionTimer={game.ticketInspectionTimer}
                    onStartTicketInspection={onStartTicketInspection}
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
                    dataAuditTimer={game.dataAuditTimer}
                    isDataAuditActive={game.isDataAuditActive}
                    onStartDataAudit={onStartDataAudit}
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
                            <div className="text-slate-400 text-sm italic text-center mt-10">
                                Ingen tidligere beskeder.
                            </div>
                        ) : (
                            eventHistory.map(evt => {
                                const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                return (
                                    <div key={evt.id} className={`p-3 rounded-xl border text-sm flex flex-col gap-1 text-left ${
                                        evt.type === 'FAILURE' 
                                        ? 'bg-rose-950/20 border-rose-500/25 text-rose-200' 
                                        : evt.type === 'DELAY'
                                            ? 'bg-amber-950/20 border-amber-500/25 text-amber-200'
                                            : 'bg-slate-900/60 border-slate-800 text-slate-350'
                                    }`}>
                                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-black uppercase tracking-wider">
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
        blue: disabled ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50',
        orange: disabled ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/50',
        yellow: disabled ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/50',
        red: disabled ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 shadow-red-900/50',
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
            <span className={`text-[12px] font-bold transition-colors ${disabled ? 'text-slate-600' : 'text-slate-400 group-hover:text-white'}`}>{label}</span>
        </button>
    );
};
