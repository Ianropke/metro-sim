import React, { useState } from 'react';
import { Train, X, ShieldAlert, Zap, AlertCircle, Compass } from 'lucide-react';

interface TrainDetailsProps {
    train: { 
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
    } | null;
    onClose: () => void;
    onSetManualOverride?: (trainId: string, isManual: boolean) => void;
    onSetManualCommands?: (trainId: string, throttle: number, brake: number) => void;
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
    onRepairAnomaly?: (id: string) => void;
    onDeploy?: () => void;
    onReturnToDepot?: () => void;
    onResetEmergency?: () => void;
    maintenanceStrategy?: 'REACTIVE' | 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE';
    isSpawnBlocked?: boolean;
    stewardsCount?: number;
    stewardsBusy?: number;
}

export const TrainDetails: React.FC<TrainDetailsProps> = ({ 
    train, 
    onClose, 
    onSetManualOverride, 
    onSetManualCommands,
    anomalies,
    onRepairAnomaly,
    onDeploy,
    onReturnToDepot,
    onResetEmergency,
    maintenanceStrategy,
    isSpawnBlocked,
    stewardsCount = 1,
    stewardsBusy = 0
}) => {
    const [throttle, setThrottle] = useState(0.0);
    const [brake, setBrake] = useState(0.0);
    if (!train) return null;

    const speedKmh = train.velocity * 3.6;
    const capacityPct = (train.passengerCount / train.maxCapacity) * 100;

    const handleThrottleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setThrottle(val);
        // If applying throttle, zero out service brake for natural driving
        let newBrake = brake;
        if (val > 0) {
            newBrake = 0.0;
            setBrake(0.0);
        }
        if (onSetManualCommands) {
            onSetManualCommands(train.id, val, newBrake);
        }
    };

    const handleBrakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setBrake(val);
        let newThrottle = throttle;
        if (val > 0) {
            newThrottle = 0.0;
            setThrottle(0.0);
        }
        if (onSetManualCommands) {
            onSetManualCommands(train.id, newThrottle, val);
        }
    };

    // State Badge Colors
    const getStateBadgeColor = (state: string) => {
        switch (state) {
            case 'AUTO_DRIVE': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'DWELL': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'EMERGENCY': return 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse';
            case 'RESTRICTED_MANUAL': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-5 z-20 flex flex-col gap-4 pointer-events-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                        <Train size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">{train.id}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Compass size={10} className="text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {train.direction === 1 ? 'Eastbound (To Nørreport)' : 'Westbound (To Vanløse)'}
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* General Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/30 border border-slate-800 p-2.5 rounded-xl flex flex-col gap-0.5">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Status</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border text-center mt-0.5 ${getStateBadgeColor(train.state)}`}>
                        {train.state.replace('_', ' ')}
                    </span>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 p-2.5 rounded-xl flex flex-col gap-0.5">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Velocity</span>
                    <span className="font-mono font-black text-slate-200 text-sm mt-0.5">{speedKmh.toFixed(1)} km/h</span>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 p-2.5 rounded-xl flex flex-col gap-0.5 col-span-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Position</span>
                    <div className="flex justify-between items-baseline mt-0.5">
                        <span className="font-mono font-black text-slate-200 text-sm">{train.position.toFixed(0)} m</span>
                        <span className="text-[10px] text-slate-500 font-semibold font-mono">Line: 5,000m</span>
                    </div>
                </div>
            </div>

            {/* Passenger Load */}
            <div className="bg-slate-800/30 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Passenger Load</span>
                    <span className="font-mono font-black text-slate-200">{train.passengerCount} / {train.maxCapacity}</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                    <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                            capacityPct > 85 ? 'bg-rose-500' : capacityPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, capacityPct)}%` }}
                    ></div>
                </div>
            </div>

            {/* Dwell Countdown */}
            {train.state === 'DWELL' && train.dwellTimer > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl flex flex-col gap-1.5 animate-pulse">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-amber-400/90 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                            <AlertCircle size={10} /> Dwell Boarding Cycle
                        </span>
                        <span className="font-mono font-black text-amber-300">{train.dwellTimer.toFixed(1)}s</span>
                    </div>
                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-amber-500"
                            style={{ width: `${(train.dwellTimer / train.totalDwellTime) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Emergency Management */}
            {train.state === 'EMERGENCY' && (
                <button 
                    onClick={onResetEmergency}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors border border-rose-500/50"
                >
                    RESET EMERGENCY BRAKE
                </button>
            )}

            {/* Depot Management */}
            {train.state === 'DEPOT' && (
                <button 
                    onClick={isSpawnBlocked ? undefined : onDeploy}
                    disabled={isSpawnBlocked}
                    className={`w-full font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors border ${
                        isSpawnBlocked
                        ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/50 active:scale-95'
                    }`}
                    title={isSpawnBlocked ? "Vanløse station er blokeret af et andet tog. Vent til det er kørt." : undefined}
                >
                    <Compass size={14} /> {isSpawnBlocked ? 'SPOR BLOKERET' : 'DEPLOY TO MAINLINE'}
                </button>
            )}

            
            {(train.state !== 'DEPOT' && train.state !== 'TO_DEPOT' && !train.isManualOverride) && (
                <button 
                    onClick={onReturnToDepot}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 shadow-inner transition-colors border border-slate-700"
                >
                    RETURN TO DEPOT
                </button>
            )}

            {train.state === 'TO_DEPOT' && (
                <div className="w-full bg-slate-800/50 text-slate-400 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 border border-slate-800 animate-pulse">
                    RETURNING AT NEXT TERMINUS...
                </div>
            )}

            {/* Anomalies & Repair */}
            {anomalies && anomalies.length > 0 && (
                <div className="border-t border-rose-900/30 pt-3 flex flex-col gap-2">
                    {anomalies.map(a => {
                        const cost = a.failed ? 800 : (maintenanceStrategy === 'PREDICTIVE' ? 100 : (maintenanceStrategy === 'CONDITIONAL' ? 250 : 300));
                        const availableStewards = (stewardsCount ?? 1) - (stewardsBusy ?? 0);
                        return (
                            <div key={a.id} className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 flex flex-col gap-2">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={14} className="text-rose-500 mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-rose-400 uppercase">{a.component} {a.failed ? 'FAILURE' : 'ANOMALY'}</span>
                                        <span className="text-[10px] text-rose-300/70 leading-tight">
                                            {a.failed ? 'Causes severe disruption. Needs immediate repair.' : 'Degrading performance detected. Early fix recommended.'}
                                        </span>
                                    </div>
                                </div>
                                
                                {a.failed && a.stewardDeployed ? (
                                    <div className="bg-slate-950/50 p-2 rounded border border-slate-900 text-[10px] flex flex-col gap-1 text-slate-400 font-mono">
                                        {a.stewardTravelTime !== undefined && a.stewardTravelTime > 0 ? (
                                            <>
                                                <div className="text-blue-400 font-bold">STEWARD UDSENDT</div>
                                                <div className="flex justify-between">
                                                    <span>Status:</span>
                                                    <span className="text-amber-400 font-bold">Rejser dertil...</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Ankomst om:</span>
                                                    <span className="text-white font-bold font-mono">~{a.stewardTravelTime.toFixed(1)}s</span>
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
                                                    <span className="text-white font-bold font-mono">~{a.stewardRepairTime?.toFixed(1) ?? '0'}s</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            if (a.failed && availableStewards <= 0) return;
                                            if (onRepairAnomaly) onRepairAnomaly(a.id);
                                        }}
                                        disabled={a.failed && availableStewards <= 0}
                                        className={`w-full font-black text-xs py-2 rounded-lg transition-all shadow-lg active:scale-95 text-center ${
                                            a.failed
                                            ? 'bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white border border-rose-500/25'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/25'
                                        }`}
                                    >
                                        {a.failed
                                            ? (availableStewards <= 0 ? 'INGEN LEDIGE STEWARDS' : 'SEND STEWARD ($800)')
                                            : `REPARER ($${cost})`
                                        }
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Manual Override Control Panel */}
            <div className="border-t border-slate-800 pt-3 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert size={12} className={train.isManualOverride ? "text-purple-400" : "text-slate-500"} />
                        Manual Control Override
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                            type="checkbox" 
                            checked={train.isManualOverride} 
                            onChange={(e) => {
                                const checked = e.target.checked;
                                if (onSetManualOverride) onSetManualOverride(train.id, checked);
                                if (!checked) {
                                    setThrottle(0.0);
                                    setBrake(0.0);
                                    if (onSetManualCommands) onSetManualCommands(train.id, 0, 0);
                                }
                            }}
                            className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white border border-slate-800"></div>
                    </label>
                </div>

                {train.isManualOverride && (
                    <div className="bg-purple-950/20 border border-purple-900/30 p-3.5 rounded-xl flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
                        {/* Throttle slider */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-purple-300 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                                    <Zap size={10} /> Throttle Command
                                </span>
                                <span className="font-mono text-purple-400 font-bold">{(throttle * 100).toFixed(0)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={throttle}
                                onChange={handleThrottleChange}
                                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        {/* Brake slider */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-purple-300 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                                    <ShieldAlert size={10} /> Service Brake
                                </span>
                                <span className="font-mono text-purple-400 font-bold">{(brake * 100).toFixed(0)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={brake}
                                onChange={handleBrakeChange}
                                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};
