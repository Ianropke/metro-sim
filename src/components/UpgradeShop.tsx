import React from 'react';
import { ShoppingCart, Zap, Timer, Users, Gauge, PlusCircle, Train, Map, Award, MessageSquare, Cpu, Activity, Eye, ShieldCheck, BookOpen } from 'lucide-react';

interface UpgradeShopProps {
    budget: number;
    activeUpgrades: Set<string>;
    onPurchase: (id: string, cost: number) => void;
    onClose: () => void;
    tutorialStep?: number;
    stewardTrainingLevel?: number;
    stewardsCount?: number;
    sensorLevel?: number;
    dataAnalystsCount?: number;
    hasARIIS?: boolean;
    hasTRES?: boolean;
    stewardSpecialTraining?: boolean;
    autoStewardCall?: boolean;
    totalPassengersTransported?: number;
}

export const UpgradeShop: React.FC<UpgradeShopProps> = ({ 
    budget, 
    activeUpgrades, 
    onPurchase, 
    onClose, 
    tutorialStep,
    stewardTrainingLevel = 1,
    stewardsCount = 1,
    sensorLevel = 1,
    dataAnalystsCount = 0,
    hasARIIS = false,
    hasTRES = false,
    stewardSpecialTraining = false,
    autoStewardCall = false,
    totalPassengersTransported = 0
}) => {
    const upgrades = [
        { id: 'ROUTE_EXTENSION_1', name: 'Ruteudvidelse: Forum -> Nørreport', description: 'Lås op for de sidste 2 stationer på linjen. Øger passagerpotentialet markant.', cost: 15000, icon: Map },
        { id: 'REGEN_BRAKING', name: 'Regen Bremser Mk II', description: 'Genvind op til 85% of bremseenergien for at sænke el-omkostninger.', cost: 5000, icon: Zap },
        { id: 'FAST_DOORS', name: 'Hurtige Døre', description: 'Reducerer dørtid på stationerne fra 6s til 3s.', cost: 3000, icon: Timer },
        { id: 'CROWD_CONTROL', name: 'Stationspersonale', description: 'Reducerer passagerers ind- og udstigningstid med 66%.', cost: 2000, icon: Users },
        { id: 'MOTOR_UPGRADE', name: 'Trakionsmotor Opgradering', description: 'Øger tophastigheden fra 80 km/t til 100 km/t.', cost: 4000, icon: Gauge },
        { id: 'CAPACITY_UPGRADE', name: '4-Vogns Forlængelse', description: 'Øger togenes kapacitet fra 200 til 350 passagerer.', cost: 6000, icon: PlusCircle },
        { id: 'BUY_TRAIN', name: 'Køb Nyt Tog', description: 'Indsæt et ekstra førerløst tog for at øge frekvensen.', cost: 8000, icon: Train },
        { id: 'HIRE_STEWARD', name: 'Hyr Metro Steward', description: 'Hyr personale til at afhjælpe nødstop og berolige passagerer.', cost: 1000, icon: Users },
        { id: 'TRAIN_STEWARDS', name: 'Stewards: Certificering', description: 'Uddan stewards til at rejse og reparere 33% hurtigere.', cost: 2500, icon: Award },
        { id: 'AUTOMATED_PIDS', name: 'Automatiseret PIDS', description: 'Dynamiske perron-displays. Fjerner 50% af vrede under forsinkelser.', cost: 2000, icon: MessageSquare },
        { id: 'SENSOR_UPGRADE', name: 'Avancerede IoT-sensorer', description: 'Maks Lvl 3. Forbedrer Konditionel strategi ved at opdage fejl tidligere.', cost: 2000, icon: Cpu },
        { id: 'HIRE_ANALYST', name: 'Ansæt Dataanalytiker', description: 'Maks 3. Dataanalytikere fremskynder din F&U hastighed med 30%.', cost: 1500, icon: Activity },
        { id: 'BUY_ARIIS', name: 'ARIIS Infrastruktur-scanner', description: 'Overvåger skinner og signaler. Sænker tilfældige uheld og glitches med 60%.', cost: 3500, icon: ShieldCheck },
        { id: 'BUY_TRES', name: 'TRES Telemetrisystem', description: 'Giver basale anomali-advarsler i DATA selv under Reaktiv strategi.', cost: 4000, icon: Eye },
        { id: 'AUTO_STEWARD_CALL', name: 'Automatisk Steward-kald', description: 'Udsender automatisk ledige stewards til nødstop.', cost: 500, icon: ShieldCheck },
        { id: 'STEWARD_SPECIAL_TRAINING', name: 'Steward Specialuddannelse', description: 'Giver stewards 25% hurtigere rejse- og nødreparationstid.', cost: 3000, icon: BookOpen }
    ];

    return (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 w-[650px] shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
                        <ShoppingCart className="text-blue-500" /> OPGRADERINGER & BUTIK
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold transition-colors">&times;</button>
                </div>

                <div className="mb-4 p-4 bg-slate-800/60 rounded-2xl flex justify-between items-center border border-slate-700/40">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Driftsbudget</span>
                    <span className={`font-mono font-black text-2xl ${budget > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {upgrades.map(upgrade => {
                        const isMultiPurchase = ['BUY_TRAIN', 'HIRE_STEWARD', 'TRAIN_STEWARDS', 'SENSOR_UPGRADE', 'HIRE_ANALYST'].includes(upgrade.id);
                        const isOwned = !isMultiPurchase && activeUpgrades.has(upgrade.id);
                        const isLockedInTutorial = tutorialStep !== undefined && tutorialStep < 3 && upgrade.id !== 'BUY_TRAIN';
                        
                        const isMaxSensor = upgrade.id === 'SENSOR_UPGRADE' && sensorLevel >= 3;
                        const isMaxAnalyst = upgrade.id === 'HIRE_ANALYST' && dataAnalystsCount >= 3;
                        const isMaxStewardTraining = upgrade.id === 'TRAIN_STEWARDS' && stewardTrainingLevel >= 3;
                        const isMaxed = isMaxSensor || isMaxAnalyst || isMaxStewardTraining;

                        // Progressive lock logic
                        let lockReason = "";
                        if (totalPassengersTransported < 50) {
                            if (!['BUY_TRAIN', 'HIRE_STEWARD', 'AUTO_STEWARD_CALL'].includes(upgrade.id)) {
                                lockReason = "Kræver 50 passagerer";
                            }
                        } else if (totalPassengersTransported < 150) {
                            if (['SENSOR_UPGRADE', 'HIRE_ANALYST', 'BUY_ARIIS', 'BUY_TRES', 'STEWARD_SPECIAL_TRAINING', 'ROUTE_EXTENSION_1'].includes(upgrade.id)) {
                                lockReason = "Kræver 150 passagerer";
                            }
                        }
                        const isLockedProgressively = lockReason !== "";

                        const isButtonDisabled = budget < upgrade.cost || isOwned || isLockedInTutorial || isMaxed || isLockedProgressively;

                        let displayDescription = upgrade.description;
                        if (upgrade.id === 'HIRE_STEWARD') {
                            displayDescription = `${upgrade.description} (Hyrdet: ${stewardsCount})`;
                        } else if (upgrade.id === 'TRAIN_STEWARDS') {
                            displayDescription = `${upgrade.description} (Niveau: ${stewardTrainingLevel}/3)`;
                        } else if (upgrade.id === 'SENSOR_UPGRADE') {
                            displayDescription = `${upgrade.description} (Niveau: ${sensorLevel}/3)`;
                        } else if (upgrade.id === 'HIRE_ANALYST') {
                            displayDescription = `${upgrade.description} (Ansatte: ${dataAnalystsCount}/3)`;
                        } else if (upgrade.id === 'BUY_ARIIS') {
                            displayDescription = `${upgrade.description} (Købt: ${hasARIIS ? 'Ja' : 'Nej'})`;
                        } else if (upgrade.id === 'BUY_TRES') {
                            displayDescription = `${upgrade.description} (Købt: ${hasTRES ? 'Ja' : 'Nej'})`;
                        } else if (upgrade.id === 'AUTO_STEWARD_CALL') {
                            displayDescription = `${upgrade.description} (Købt: ${autoStewardCall ? 'Ja' : 'Nej'})`;
                        } else if (upgrade.id === 'STEWARD_SPECIAL_TRAINING') {
                            displayDescription = `${upgrade.description} (Købt: ${stewardSpecialTraining ? 'Ja' : 'Nej'})`;
                        }
                        
                        return (
                            <div key={upgrade.id} className={`p-4 rounded-2xl flex justify-between items-center transition-all duration-200 border ${
                                isLockedInTutorial 
                                ? 'bg-slate-900/40 border-slate-900 opacity-40' 
                                : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/50 hover:border-slate-750'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl border ${isLockedInTutorial || isLockedProgressively ? 'bg-slate-950 text-slate-600 border-slate-900' : 'bg-blue-500/10 text-blue-400 border-blue-500/10'}`}>
                                        <upgrade.icon size={22} />
                                    </div>
                                    <div className="max-w-[340px]">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-200 text-sm">{upgrade.name}</h3>
                                            {(isLockedInTutorial || isLockedProgressively) && (
                                                <span className="text-[9px] bg-red-950/80 text-rose-400 px-1.5 py-0.5 rounded border border-rose-900/30 uppercase font-black tracking-wider">
                                                    {isLockedInTutorial ? 'Låst i tutorial' : 'Låst'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                            {displayDescription}
                                            {isLockedProgressively && (
                                                <span className="text-rose-400 block font-bold mt-1">⚠️ {lockReason}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (isLockedInTutorial || isLockedProgressively) return;
                                        onPurchase(upgrade.id, upgrade.cost);
                                    }}
                                    disabled={isButtonDisabled}
                                    className={`px-4 py-2 text-xs rounded-xl font-bold transition-all ${
                                        isOwned || isMaxed
                                        ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                                        : (isLockedInTutorial || isLockedProgressively)
                                            ? 'bg-slate-900 border border-slate-850 text-slate-600 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
                                    }`}
                                >
                                    {isMaxed ? 'MAKS UDDANNET/EKS' : isOwned ? 'ALLEREDE EJET' : (isLockedInTutorial || isLockedProgressively) ? 'LÅST' : `$${upgrade.cost.toLocaleString()}`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
