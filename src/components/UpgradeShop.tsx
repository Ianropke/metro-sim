import React from 'react';
import { ShoppingCart, Zap, Timer, Users, Gauge, PlusCircle, Train } from 'lucide-react';

interface UpgradeShopProps {
    budget: number;
    activeUpgrades: Set<string>;
    onPurchase: (id: string, cost: number) => void;
    onClose: () => void;
}

export const UpgradeShop: React.FC<UpgradeShopProps> = ({ budget, activeUpgrades, onPurchase, onClose }) => {
    const upgrades = [
        { id: 'REGEN_BRAKING', name: 'Regen Braking Mk II', description: 'Recover up to 85% of braking energy to reduce electric costs.', cost: 5000, icon: Zap },
        { id: 'FAST_DOORS', name: 'High-Speed Doors', description: 'Reduces fixed station door dwell overhead from 6s to 3s.', cost: 3000, icon: Timer },
        { id: 'CROWD_CONTROL', name: 'Station Staffing', description: 'Reduces boarding/alighting time per passenger by 66%.', cost: 2000, icon: Users },
        { id: 'MOTOR_UPGRADE', name: 'Traction Motor Upgrade', description: 'Increases top speed from 80 km/h to 100 km/h and boosts power.', cost: 4000, icon: Gauge },
        { id: 'CAPACITY_UPGRADE', name: '4-Car Extension', description: 'Increases train capacity from 200 to 350 passengers.', cost: 6000, icon: PlusCircle },
        { id: 'BUY_TRAIN', name: 'Buy New Train', description: 'Deploy an additional GoA4 driverless train to increase service frequency.', cost: 8000, icon: Train },
    ];

    return (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 w-[650px] shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
                        <ShoppingCart className="text-blue-500" /> UPGRADE SHOP
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold transition-colors">&times;</button>
                </div>

                <div className="mb-4 p-4 bg-slate-800/60 rounded-2xl flex justify-between items-center border border-slate-700/40">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Operational Budget</span>
                    <span className={`font-mono font-black text-2xl ${budget > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {upgrades.map(upgrade => {
                        const isOwned = upgrade.id !== 'BUY_TRAIN' && activeUpgrades.has(upgrade.id);
                        return (
                            <div key={upgrade.id} className="bg-slate-800/30 border border-slate-800 p-4 rounded-2xl flex justify-between items-center hover:bg-slate-800/50 hover:border-slate-750 transition-all duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/10">
                                        <upgrade.icon size={22} />
                                    </div>
                                    <div className="max-w-[340px]">
                                        <h3 className="font-bold text-slate-200 text-sm">{upgrade.name}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{upgrade.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onPurchase(upgrade.id, upgrade.cost)}
                                    disabled={budget < upgrade.cost || isOwned}
                                    className={`px-4 py-2 text-xs rounded-xl font-bold transition-all ${
                                        isOwned 
                                        ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
                                    }`}
                                >
                                    {isOwned ? 'OWNED' : `$${upgrade.cost.toLocaleString()}`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
