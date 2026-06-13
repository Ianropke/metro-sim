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
}

export const TrainDetails: React.FC<TrainDetailsProps> = ({ train, onClose, onSetManualOverride, onSetManualCommands }) => {
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
