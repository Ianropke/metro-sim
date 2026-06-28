import React, { useState } from 'react';
import { ChevronRight, Check, Play, Database, ShoppingCart, ShieldAlert, MessageSquare, Sliders, User, Wrench, Info } from 'lucide-react';

interface WelcomeModalProps {
    onStart: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStart }) => {
    const [step, setStep] = useState(0);

    const tabs = [
        { label: "1. Din Rolle", icon: <User size={14} /> },
        { label: "2. Skærmlayout", icon: <Info size={14} /> },
        { label: "3. Driftsfejl", icon: <Wrench size={14} /> },
        { label: "4. Strategi", icon: <Sliders size={14} /> }
    ];

    const renderContent = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 text-center flex flex-col items-center gap-3">
                            <Play size={44} className="text-blue-400 animate-pulse" />
                            <h3 className="text-lg font-bold text-white">Metronetværkets Nye Hovedchef</h3>
                            <p className="text-sm text-slate-350 leading-relaxed max-w-md">
                                Du er nu udpeget som overordnede driftsleder for metroen i København.
                                Driften starter i det små med et enkelt førerløst tog, **TRN01**, og et par stationer.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-3 bg-slate-850/40 rounded-xl border border-slate-800/50">
                                <span className="font-bold text-emerald-450 block mb-1">🎫 Tjen Billetindtægter</span>
                                Passagerer betaler automatisk billetpris, når de stiger på og fragtes til deres destination.
                            </div>
                            <div className="p-3 bg-slate-850/40 rounded-xl border border-slate-800/50">
                                <span className="font-bold text-blue-400 block mb-1">😊 Bevar Tilfredshed</span>
                                Ventende passagerer mister tålmodigheden. Hvis tilfredsheden rammer 0%, er det game over!
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <p className="text-sm text-slate-300 text-center font-medium">
                            Skærmen er opbygget som et integreret driftsrum. Her er dine primære paneler:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[12px] leading-relaxed">
                            <div className="p-3 bg-slate-850/30 rounded-xl border border-slate-800/50 flex flex-col gap-1">
                                <span className="font-bold text-blue-400 uppercase tracking-wider text-[12px]">🖥️ Top HUD</span>
                                <span>Viser din økonomi, spillersatisfaktion, netværks-effektivitet, ur og tidshastighedskontroller (⏸ ▶ ⏩ ⏭).</span>
                            </div>
                            <div className="p-3 bg-slate-850/30 rounded-xl border border-slate-800/50 flex flex-col gap-1">
                                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[12px]">🗺️ Kortet (Center)</span>
                                <span>Realtidsovervågning. Klik på tog for detaljer. Halocirkler omkring stationerne viser passagermængden.</span>
                            </div>
                            <div className="p-3 bg-slate-850/30 rounded-xl border border-slate-800/50 flex flex-col gap-1">
                                <span className="font-bold text-orange-400 uppercase tracking-wider text-[12px]">📋 Operationelt (Venstre)</span>
                                <span>Viser dine aktuelle mål (checklist), scenarieknapper og manuelle overstyringspaneler.</span>
                            </div>
                            <div className="p-3 bg-slate-850/30 rounded-xl border border-slate-800/50 flex flex-col gap-1">
                                <span className="font-bold text-purple-400 uppercase tracking-wider text-[12px]">📊 Strategisk (Højre)</span>
                                <span>Viser flådens slitage, skinnens tilstand, steward-træning og anomali-status.</span>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl flex items-start gap-3">
                            <ShieldAlert className="text-rose-400 shrink-0 mt-0.5" size={24} />
                            <div>
                                <h4 className="font-bold text-sm text-rose-300 uppercase">Togfejl (Døre, Motor, HVAC, Bremser)</h4>
                                <p className="text-[12px] text-slate-350 leading-relaxed mt-0.5">
                                    Tog slides under kørsel. Ved 100% slitage opstår der et **Driftsstop**. Toget blinker rødt på kortet.
                                    Hold musen (hover) over toget på kortet og klik **'SEND STEWARD'** for at udbedre fejlen.
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-amber-955/20 border border-amber-500/20 rounded-xl flex items-start gap-3">
                            <Wrench className="text-amber-400 shrink-0 mt-0.5" size={24} />
                            <div>
                                <h4 className="font-bold text-sm text-amber-300 uppercase">Skinnefejl & Slitage (Track Wear)</h4>
                                <p className="text-[12px] text-slate-350 leading-relaxed mt-0.5">
                                    Skinnerne slides også. Følg skinnens tilstand i højre panel under **Infrastruktur**.
                                    Ved 100% opstår en **Baneinfrastruktur-fejl** og alt stopper. Forebyg dette ved at klikke **'Udfør sporvedligeholdelse' ($400)**.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <p className="text-sm text-slate-300 text-center font-medium">
                            Når de grundlæggende procedurer er lært, skal du styre metroen strategisk:
                        </p>
                        <div className="grid grid-cols-3 gap-2.5 text-[12px] leading-relaxed">
                            <div className="p-3 bg-slate-850/40 rounded-xl border border-slate-800/50 flex flex-col gap-1">
                                <Database size={18} className="text-purple-400 mb-1" />
                                <span className="font-bold text-slate-200 uppercase text-[9px]">1. F&U Center</span>
                                <span>Opgrader din vedligeholdelses-strategi (Reactive, Preventive, Conditional, Predictive) for at reducere omkostninger og forudsige fejl tidligt.</span>
                            </div>
                            <div className="p-3 bg-slate-850/40 rounded-xl border border-slate-800/50 flex flex-col gap-1">
                                <ShoppingCart size={18} className="text-green-400 mb-1" />
                                <span className="font-bold text-slate-200 uppercase text-[9px]">2. Flådebutik</span>
                                <span>Hyr stewards, køb ekstra tog, forbedr dørhastighed, reducer passager-indstigningstid, eller ansæt kontrollører til at fange snyltere.</span>
                            </div>
                            <div className="p-3 bg-slate-850/40 rounded-xl border border-slate-800/50 flex flex-col gap-1">
                                <MessageSquare size={18} className="text-blue-400 mb-1" />
                                <span className="font-bold text-slate-200 uppercase text-[9px]">3. Information</span>
                                <span>Brug perron-displays (PIDS) og broadcast manuelle højttalerudkald (📢) under driftsstop for at dæmpe passagerernes vrede markant.</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative overflow-hidden flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300">
                
                {/* Visual Top Highlight Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500"></div>

                {/* Modal Title */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
                        🚇 METRO TYCOON <span className="text-[12px] font-bold bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-800/30">DRIFTSLEDER PROTOKOL</span>
                    </h2>
                </div>

                {/* Tab Navigation Buttons */}
                <div className="grid grid-cols-4 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-850">
                    {tabs.map((tab, idx) => (
                        <button
                            key={idx}
                            onClick={() => setStep(idx)}
                            className={`py-2 px-1 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 select-none ${
                                step === idx
                                ? 'bg-slate-800 text-white shadow border border-slate-700/60'
                                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/40'
                            }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content Body */}
                <div className="min-h-[220px] flex flex-col justify-center py-1">
                    {renderContent()}
                </div>

                {/* Action Footer Button */}
                <div className="border-t border-slate-800 pt-4 flex gap-2 justify-between items-center">
                    <div className="flex gap-1.5">
                        {tabs.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-800'}`}
                            ></div>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            if (step < tabs.length - 1) {
                                setStep(step + 1);
                            } else {
                                onStart();
                            }
                        }}
                        className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-1.5 select-none"
                    >
                        {step < tabs.length - 1 ? (
                            <>Næste afsnit <ChevronRight size={14} /></>
                        ) : (
                            <>Start driftsovervågning <Check size={14} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
