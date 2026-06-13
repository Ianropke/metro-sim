import React from 'react';
import { Microscope, Server, Activity, Brain, ShieldAlert, Cpu } from 'lucide-react';


interface DataDashboardProps {
    logs: { id: string, tag: string, value: string | number | boolean, timestamp: number }[];
    anomalies?: { 
        id: string; 
        trainId: string; 
        component: string; 
        severity: number; 
        detected: boolean; 
        failed?: boolean;
        stewardDeployed?: boolean;
        stewardTravelTime?: number;
        stewardRepairTime?: number;
    }[];
    currentStrategy?: 'REACTIVE' | 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE';
    onClose: () => void;
    onResolveAnomaly?: (id: string) => void;
    onSetStrategy?: (strategy: 'REACTIVE' | 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE') => void;
    tutorialStep?: number;
    dataLakeSavings?: number;
    stewardsCount?: number;
    stewardsBusy?: number;
    activeResearch?: 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE' | null;
    researchProgress?: number;
    researchDuration?: number;
    researchTimeRemaining?: number;
    unlockedStrategies?: Set<string>;
    dataAnalystsCount?: number;
    sensorLevel?: number;
    totalPassengersTransported?: number;
    onStartResearch?: (strategy: 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE', cost: number) => void;
}

export const DataDashboard: React.FC<DataDashboardProps> = ({ 
    logs, 
    anomalies = [], 
    currentStrategy = 'REACTIVE', 
    onClose, 
    onResolveAnomaly, 
    onSetStrategy, 
    tutorialStep,
    dataLakeSavings = 0,
    stewardsCount = 1,
    stewardsBusy = 0,
    activeResearch = null,
    researchProgress = 0,
    researchDuration = 0,
    researchTimeRemaining = 0,
    unlockedStrategies = new Set(['REACTIVE']),
    dataAnalystsCount = 0,
    sensorLevel = 1,
    totalPassengersTransported = 0,
    onStartResearch
}) => {
    return (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-[1000] flex flex-col p-6 font-mono text-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-orange-500 flex items-center gap-2">
                    <Microscope /> Forskningscenter <span className="text-xs bg-orange-900/30 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30">DATABRICKS CONNECTED</span>
                </h2>

                <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            {/* 3-Column Layout */}
            <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
                
                {/* Column 1: Cluster Health & Strategy Status */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Server size={16} /> Cluster Health
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/30 p-3 rounded border border-slate-700">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Active Nodes</div>
                            <div className="text-lg font-black text-green-400 mt-1">8 / 8</div>
                        </div>
                        <div className="bg-slate-800/30 p-3 rounded border border-slate-700">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Memory</div>
                            <div className="text-lg font-black text-yellow-400 mt-1">64%</div>
                        </div>
                        <div className="bg-slate-800/30 p-3 rounded border border-slate-700">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Ingest Rate</div>
                            <div className="text-lg font-black text-blue-400 mt-1">2.4 GB/s</div>
                        </div>
                        <div className="bg-slate-800/30 p-3 rounded border border-slate-700">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Latency</div>
                            <div className="text-lg font-black text-green-400 mt-1">12 ms</div>
                        </div>
                    </div>
                    
                    <div className="h-32 bg-slate-950 rounded border border-slate-800 relative overflow-hidden p-2">
                        <div className="absolute inset-0 flex items-end justify-between px-2 pb-2 gap-1 opacity-50">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="w-full bg-blue-500/50 rounded-t" style={{ height: `${30 + ((i * 17) % 60)}%` }}></div>
                            ))}
                        </div>
                        <div className="absolute top-2 left-2 text-[10px] text-slate-500 uppercase font-bold">Cluster Load (1m)</div>
                    </div>

                    {/* AI Engine Status Card */}
                    <div className="mt-2 bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col gap-2">
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Cpu size={14} className="text-orange-400" /> Model Insights
                        </div>
                        {currentStrategy === 'REACTIVE' && (
                            <div className="text-[11px] text-rose-400/80 leading-relaxed">
                                ML modeller er deaktiveret under REACTIVE strategi. Sensoranomalier beregnes ikke live, og RUL er utilgængelig. Reparationer kan kun gøres efter nedbrud!
                            </div>
                        )}
                        {currentStrategy === 'PREVENTIVE' && (
                            <div className="text-[11px] text-amber-400/80 leading-relaxed">
                                Tidsstyret forebyggende model aktiv. Risiko for uventede nedbrud reduceres, men live anomali-forudsigelser er begrænsede.
                            </div>
                        )}
                        {currentStrategy === 'CONDITIONAL' && (
                            <div className="text-[11px] text-orange-400/80 leading-relaxed">
                                Tilstandsbaseret model aktiv. Sensoranomalier opdages når de overstiger grænsen (tærskel: {sensorLevel === 1 ? '60%' : sensorLevel === 2 ? '40%' : '20%'}).
                            </div>
                        )}
                        {currentStrategy === 'PREDICTIVE' && (
                            <div className="text-[11px] text-green-400/80 leading-relaxed">
                                Live LSTM + XGBoost model er AKTIV. Systemet scanner live telemetri, forudsiger RUL (Remaining Useful Life) og guider dig til tidlig, billig vedligeholdelse ($100 vs $800).
                            </div>
                        )}
                    </div>

                    {/* Strategy Comparison Card */}
                    <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex flex-col gap-3">
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            📊 Økonomi & Konsekvenser
                        </div>
                        <div className="flex flex-col gap-2 text-[10px] leading-relaxed text-slate-400">
                            <div className="flex justify-between items-start border-b border-slate-800/50 pb-1.5">
                                <span className="text-rose-450 font-bold">REACTIVE ($0/t)</span>
                                <span className="text-slate-500 text-right">Reparation: $800<br/>Bøde v. fejl: $1.000<br/>Ingen advarsel</span>
                            </div>
                            <div className="flex justify-between items-start border-b border-slate-800/50 pb-1.5">
                                <span className="text-yellow-500 font-bold">PREVENTIVE ($400/t)</span>
                                <span className="text-slate-500 text-right">-60% fejlrate<br/>Reparation: $800<br/>Ingen bøder</span>
                            </div>
                            <div className="flex justify-between items-start border-b border-slate-800/50 pb-1.5">
                                <span className="text-orange-450 font-bold">CONDITIONAL ($600/t)</span>
                                <span className="text-slate-500 text-right">Reparation: $250<br/>Bøde v. fejl: $500<br/>Tærskel-advarsel</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-emerald-450 font-bold">PREDICTIVE ($800/t)</span>
                                <span className="text-slate-500 text-right">Prædiktiv rep.: $100<br/>Fejlbøder undgås<br/>RUL-forudsigelse</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2: Live Ingestion Stream (Bronze Layer) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2 mb-1 cursor-help" title="Bronze Layer: Rå og ubehandlede sensordata direkte fra metrotogene i realtid.">
                        <Activity size={16} className="text-blue-400" /> Telemetry (Bronze Layer) <span className="text-[10px] text-slate-500 font-normal">(Info ℹ️)</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mb-2">Rå realtids sensordata direkte fra togene.</p>
                    <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1 custom-scrollbar bg-black/50 p-3 rounded border border-slate-950">
                        {logs.map(log => (
                            <div key={log.id} className="flex gap-4 border-b border-slate-900 pb-1 text-slate-400 hover:bg-slate-900/50 transition-colors">
                                <span className="text-slate-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className="text-blue-500 font-bold shrink-0 w-24 truncate">{log.tag}</span>
                                <span className="text-emerald-500 font-bold truncate">{String(log.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Column 3: AI Predictive Operations (Silver & Gold Layers) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2 mb-1 cursor-help" title="Silver Layer: Udvundne og rensede sensormønstre. Gold Layer: Trænede ML-modeller, der forudsiger nedbrud (RUL) og foreslår forebyggende vedligeholdelse.">
                        <Brain size={16} className="text-purple-400" /> AI Predictions (Gold Layer) <span className="text-[10px] text-slate-500 font-normal">(Info ℹ️)</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mb-2">Silver: Filtrerede fejl. Gold: ML-forudsigelser og RUL.</p>

                    {/* Gold Layer Cumulative Savings Card */}
                    <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/25 p-3 rounded-xl flex flex-col gap-1 mb-3 shrink-0">
                        <div className="text-[9px] text-purple-300 font-bold uppercase tracking-wider">Samlet Gevinst (ML Modeller)</div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-xs text-slate-400">Penge sparet via data:</span>
                            <span className="text-lg font-black text-emerald-400 font-mono">${dataLakeSavings.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Predictions list */}
                    <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-3 custom-scrollbar bg-black/50 p-3 rounded border border-slate-950 mb-3">
                        {anomalies.filter(a => a.detected).length === 0 ? (
                            <div className="text-slate-600 italic text-center mt-10">
                                Ingen anomalier eller fejl detekteret live af ML-modellerne.
                            </div>
                        ) : (
                            anomalies.filter(a => a.detected).map(anom => {
                                const rulMinutes = Math.max(0, Math.floor((1.0 - anom.severity) / 0.04));
                                const probability = Math.round(anom.severity * 100);
                                const cost = anom.failed ? 800 : (currentStrategy === 'PREDICTIVE' ? 100 : (currentStrategy === 'CONDITIONAL' ? 250 : 300));

                                return (
                                    <div key={anom.id} className={`p-3 rounded-xl border flex flex-col gap-2 ${
                                        anom.failed 
                                        ? 'bg-rose-950/20 border-rose-500/30' 
                                        : 'bg-amber-950/20 border-amber-500/30'
                                    }`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold flex items-center gap-1.5">
                                                    <span className={anom.failed ? 'text-rose-400' : 'text-amber-400'}>{anom.trainId}</span>
                                                    <span className="text-slate-600">|</span>
                                                    <span className="text-slate-300">{anom.component}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-1">
                                                    {anom.failed ? (
                                                        <span className="text-rose-400 font-bold flex items-center gap-1">
                                                            <ShieldAlert size={10} /> KRITISK DRIFTSSTOP
                                                        </span>
                                                    ) : (
                                                        <span>Severity: <span className="text-slate-300">{probability}%</span></span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                anom.failed 
                                                ? 'bg-rose-900/40 text-rose-300 border border-rose-500/20' 
                                                : 'bg-amber-900/40 text-amber-300 border border-amber-500/20'
                                            }`}>
                                                {anom.failed ? 'Nedbrud' : 'Anomali'}
                                            </span>
                                        </div>

                                        {/* Predictions details */}
                                        {!anom.failed && (
                                            <div className="bg-slate-950/50 p-2 rounded border border-slate-900 text-[10px] flex flex-col gap-1 text-slate-400">
                                                <div className="flex justify-between">
                                                    <span>Estimeret RUL:</span>
                                                    <span className="text-amber-400 font-bold font-mono">~{rulMinutes} spil-min</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Nedbrudsrisiko:</span>
                                                    <span className="text-rose-400 font-bold font-mono">{probability}%</span>
                                                </div>
                                                <div className="flex justify-between border-t border-slate-900 pt-1 mt-1 text-green-400">
                                                    <span>Prædiktiv besparelse:</span>
                                                    <span className="font-bold font-mono">Spar $700</span>
                                                </div>
                                            </div>
                                        )}

                                        {anom.failed && anom.stewardDeployed && (
                                            <div className="bg-slate-950/50 p-2 rounded border border-slate-900 text-[10px] flex flex-col gap-1 text-slate-400">
                                                {anom.stewardTravelTime !== undefined && anom.stewardTravelTime > 0 ? (
                                                    <>
                                                        <div className="text-blue-400 font-bold">STEWARD UDSENDT</div>
                                                        <div className="flex justify-between">
                                                            <span>Status:</span>
                                                            <span className="text-amber-400 font-bold">Rejser dertil...</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Ankomst om:</span>
                                                            <span className="text-white font-bold font-mono">~{anom.stewardTravelTime.toFixed(1)}s</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-emerald-400 font-bold">REPARATION I GANG</div>
                                                        <div className="flex justify-between">
                                                            <span>Status:</span>
                                                            <span className="text-emerald-400 font-bold">Udbedrer fejl...</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Færdig om:</span>
                                                            <span className="text-white font-bold font-mono">~{anom.stewardRepairTime?.toFixed(1) ?? '0'}s</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {!anom.stewardDeployed && (
                                            <button
                                                onClick={() => {
                                                    const availableStewards = (stewardsCount ?? 1) - (stewardsBusy ?? 0);
                                                    if (anom.failed && availableStewards <= 0) return;
                                                    if (onResolveAnomaly) onResolveAnomaly(anom.id);
                                                }}
                                                disabled={anom.failed && ((stewardsCount ?? 1) - (stewardsBusy ?? 0) <= 0)}
                                                className={`w-full py-1.5 rounded-lg text-center font-bold text-[11px] transition-all active:scale-95 ${
                                                    anom.failed 
                                                    ? 'bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white border border-rose-500/25' 
                                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                                }`}
                                            >
                                                {anom.failed 
                                                    ? ((stewardsCount ?? 1) - (stewardsBusy ?? 0) <= 0 ? 'INGEN LEDIGE STEWARDS' : 'SEND STEWARD ($800)') 
                                                    : `REPARER ($${cost})`
                                                }
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Gold Layer Accuracy stats */}
                    <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex flex-col gap-0.5">
                            <span className="uppercase font-bold text-slate-400">Model Præcision</span>
                            <span>LSTM model inference</span>
                        </div>
                        <span className="font-bold text-purple-400 font-mono text-xs">98.4% F1-SCORE</span>
                    </div>
                </div>
            </div>

            {/* Maintenance Policy Panel */}
            {totalPassengersTransported < 150 ? (
                <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center shrink-0">
                    <Brain className="text-slate-500 mb-2 animate-pulse" size={32} />
                    <h3 className="text-sm font-semibold text-slate-350">🔬 F&U Vedligeholdelses Center</h3>
                    <p className="text-xs text-slate-400 mt-2">
                        Forskningscenteret åbnes, når du har transporteret mindst 150 passagerer i det fulde spil.
                    </p>
                    <div className="mt-3 bg-slate-950/60 border border-slate-850 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 font-mono">
                        Fremskridt: <span className="text-orange-400">{totalPassengersTransported}</span> / 150 passagerer
                    </div>
                </div>
            ) : (
                <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shrink-0">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                                🔬 F&U Vedligeholdelses Center
                                {tutorialStep !== undefined && tutorialStep < 3 && (
                                    <span className="text-[10px] bg-red-950 text-rose-400 px-2 py-0.5 rounded border border-rose-900/50 uppercase font-black animate-pulse">Låst under tutorial</span>
                                )}
                            </h3>
                            <p className="text-xs text-slate-500">Invester i Forskning & Udvikling for at opgradere din vedligeholdelses-strategi (Forsknings-hastighed: +{Math.round((1.0 + dataAnalystsCount * 0.3) * 100)}%).</p>
                        </div>
                        {activeResearch && (
                            <div className="flex flex-col items-end gap-1 text-[10px] text-slate-400 max-w-[200px] w-full">
                                <div className="flex justify-between w-full font-bold">
                                    <span>Forskning i gang...</span>
                                    <span className="text-blue-400 font-mono">~{Math.ceil(researchTimeRemaining)}s</span>
                                </div>
                                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                                    <div className="bg-blue-500 h-full animate-pulse" style={{ width: `${(researchProgress / researchDuration) * 100}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                        {/* 1. Reactive */}
                        <div className={`p-3 rounded-xl border flex flex-col gap-2 ${currentStrategy === 'REACTIVE' ? 'bg-red-950/20 border-red-500/50' : 'bg-slate-950/40 border-slate-850'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold text-slate-200">1. Reaktiv</span>
                                    <div className="text-[9px] text-slate-500 uppercase mt-0.5 font-bold">Ingen løbende pris</div>
                                </div>
                                <span className="text-[9px] bg-slate-800 text-slate-450 px-1 py-0.5 rounded font-black">LÅST OP</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-normal min-h-[30px]">Nødreparationer efter driftsstop. Høj risiko for bøder ($1.000) og standsede tog.</p>
                            <button
                                onClick={() => onSetStrategy && onSetStrategy('REACTIVE')}
                                disabled={currentStrategy === 'REACTIVE' || (tutorialStep !== undefined && tutorialStep < 3)}
                                className={`w-full py-1.5 rounded text-[10px] font-bold border transition-colors ${
                                    currentStrategy === 'REACTIVE'
                                    ? 'bg-red-900/40 border-red-500 text-red-200 cursor-default'
                                    : 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'
                                }`}
                            >
                                {currentStrategy === 'REACTIVE' ? 'AKTIV' : 'AKTIVER'}
                            </button>
                        </div>

                        {/* 2. Preventive */}
                        {(() => {
                            const isUnlocked = unlockedStrategies?.has('PREVENTIVE');
                            const isResearching = activeResearch === 'PREVENTIVE';
                            const canResearch = !isResearching && !isUnlocked && !activeResearch && (tutorialStep === undefined || tutorialStep >= 3);
                            return (
                                <div className={`p-3 rounded-xl border flex flex-col gap-2 ${currentStrategy === 'PREVENTIVE' ? 'bg-yellow-950/20 border-yellow-500/50' : 'bg-slate-950/40 border-slate-850'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-bold text-slate-200">2. Fast Interval</span>
                                            <div className="text-[9px] text-slate-500 uppercase mt-0.5 font-bold">Pris: $400/t</div>
                                        </div>
                                        <span className={`text-[9px] px-1 py-0.5 rounded font-black ${
                                            isUnlocked ? 'bg-slate-800 text-slate-450' : isResearching ? 'bg-blue-950 text-blue-400 animate-pulse' : 'bg-red-950 text-red-400'
                                        }`}>
                                            {isUnlocked ? 'LÅST OP' : isResearching ? 'FORSKER' : 'LÅST'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-normal min-h-[30px]">Forebyggende vedligehold. Sænker fejlrate med 60%. Reparer for $800, ingen bøde.</p>
                                    {isUnlocked ? (
                                        <button
                                            onClick={() => onSetStrategy && onSetStrategy('PREVENTIVE')}
                                            disabled={currentStrategy === 'PREVENTIVE' || (tutorialStep !== undefined && tutorialStep < 3)}
                                            className={`w-full py-1.5 rounded text-[10px] font-bold border transition-colors ${
                                                currentStrategy === 'PREVENTIVE'
                                                ? 'bg-yellow-900/40 border-yellow-500 text-yellow-200 cursor-default'
                                                : 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                            {currentStrategy === 'PREVENTIVE' ? 'AKTIV' : 'AKTIVER'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onStartResearch && onStartResearch('PREVENTIVE', 1000)}
                                            disabled={!canResearch}
                                            className={`w-full py-1.5 rounded text-[10px] font-bold border transition-colors ${
                                                isResearching
                                                ? 'bg-blue-900/20 border-blue-900/50 text-blue-400 cursor-default animate-pulse'
                                                : 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white disabled:bg-slate-850 disabled:border-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                            {isResearching ? 'FORSKER...' : 'FORSK ($1.000, 60s)'}
                                        </button>
                                    )}
                                </div>
                            );
                        })()}

                        {/* 3. Conditional */}
                        {(() => {
                            const isUnlocked = unlockedStrategies?.has('CONDITIONAL');
                            const isResearching = activeResearch === 'CONDITIONAL';
                            const isPrevUnlocked = unlockedStrategies?.has('PREVENTIVE');
                            const canResearch = !isResearching && !isUnlocked && isPrevUnlocked && !activeResearch && (tutorialStep === undefined || tutorialStep >= 3);
                            return (
                                <div className={`p-3 rounded-xl border flex flex-col gap-2 ${currentStrategy === 'CONDITIONAL' ? 'bg-orange-950/20 border-orange-500/50' : 'bg-slate-950/40 border-slate-850'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-bold text-slate-200">3. Konditionel</span>
                                            <div className="text-[9px] text-slate-500 uppercase mt-0.5 font-bold">Pris: $600/t</div>
                                        </div>
                                        <span className={`text-[9px] px-1 py-0.5 rounded font-black ${
                                            isUnlocked ? 'bg-slate-800 text-slate-450' : isResearching ? 'bg-blue-950 text-blue-400 animate-pulse' : 'bg-red-950 text-red-400'
                                        }`}>
                                            {isUnlocked ? 'LÅST OP' : isResearching ? 'FORSKER' : 'LÅST'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-normal min-h-[30px]">Fejl opdages ved tærskel (60%, 40% el. 20% m. sensorer). Reparer for $250, $500 bøde.</p>
                                    {isUnlocked ? (
                                        <button
                                            onClick={() => onSetStrategy && onSetStrategy('CONDITIONAL')}
                                            disabled={currentStrategy === 'CONDITIONAL' || (tutorialStep !== undefined && tutorialStep < 3)}
                                            className={`w-full py-1.5 rounded text-[10px] font-bold border transition-colors ${
                                                currentStrategy === 'CONDITIONAL'
                                                ? 'bg-orange-900/40 border-orange-500 text-orange-200 cursor-default'
                                                : 'bg-slate-855 border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                            {currentStrategy === 'CONDITIONAL' ? 'AKTIV' : 'AKTIVER'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onStartResearch && onStartResearch('CONDITIONAL', 2500)}
                                            disabled={!canResearch}
                                            title={!isPrevUnlocked ? "Kræver Forebyggende (Fast Interval) vedligeholdelse låst op først" : undefined}
                                            className={`w-full py-1.5 rounded text-[10px] font-bold border transition-colors ${
                                                isResearching
                                                ? 'bg-blue-900/20 border-blue-900/50 text-blue-400 cursor-default animate-pulse'
                                                : 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white disabled:bg-slate-850 disabled:border-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                            {isResearching ? 'FORSKER...' : 'FORSK ($2.500, 120s)'}
                                        </button>
                                    )}
                                </div>
                            );
                        })()}

                        {/* 4. Predictive */}
                        {(() => {
                            const isUnlocked = unlockedStrategies?.has('PREDICTIVE');
                            const isResearching = activeResearch === 'PREDICTIVE';
                            const isCondUnlocked = unlockedStrategies?.has('CONDITIONAL');
                            const canResearch = !isResearching && !isUnlocked && isCondUnlocked && !activeResearch && (tutorialStep === undefined || tutorialStep >= 3);
                            return (
                                <div className={`p-3 rounded-xl border flex flex-col gap-2 ${currentStrategy === 'PREDICTIVE' ? 'bg-green-950/20 border-green-500/50' : 'bg-slate-950/40 border-slate-850'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-bold text-slate-200">4. Prædiktiv</span>
                                            <div className="text-[9px] text-slate-500 uppercase mt-0.5 font-bold">Pris: $800/t</div>
                                        </div>
                                        <span className={`text-[9px] px-1 py-0.5 rounded font-black ${
                                            isUnlocked ? 'bg-slate-800 text-slate-450' : isResearching ? 'bg-blue-950 text-blue-400 animate-pulse' : 'bg-red-950 text-red-400'
                                        }`}>
                                            {isUnlocked ? 'LÅST OP' : isResearching ? 'FORSKER' : 'LÅST'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-normal min-h-[30px]">ML forudsiger RUL live. Advarsler fra 0% severity. Prædiktiv rep: $100, ingen bøde.</p>
                                    {isUnlocked ? (
                                        <button
                                            onClick={() => onSetStrategy && onSetStrategy('PREDICTIVE')}
                                            disabled={currentStrategy === 'PREDICTIVE' || (tutorialStep !== undefined && tutorialStep < 3)}
                                            className={`w-full py-1.5 rounded text-[10px] font-bold border transition-colors ${
                                                currentStrategy === 'PREDICTIVE'
                                                ? 'bg-green-900/40 border-green-500 text-green-200 cursor-default'
                                                : 'bg-slate-855 border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                            {currentStrategy === 'PREDICTIVE' ? 'AKTIV' : 'AKTIVER'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onStartResearch && onStartResearch('PREDICTIVE', 5000)}
                                            disabled={!canResearch}
                                            title={!isCondUnlocked ? "Kræver Tilstandsbaseret (Konditionel) vedligeholdelse låst op først" : undefined}
                                            className={`w-full py-1.5 rounded text-[10px] font-bold border transition-colors ${
                                                isResearching
                                                ? 'bg-blue-900/20 border-blue-900/50 text-blue-400 cursor-default animate-pulse'
                                                : 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white disabled:bg-slate-850 disabled:border-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                            {isResearching ? 'FORSKER...' : 'FORSK ($5.000, 180s)'}
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};
