import React from 'react';
import { ShoppingCart, Zap, Timer, Users } from 'lucide-react';

interface UpgradeShopProps {
    budget: number;
    onPurchase: (id: string, cost: number) => void;
    onClose: () => void;
}

export const UpgradeShop: React.FC<UpgradeShopProps> = ({ budget, onPurchase, onClose }) => {
    const upgrades = [
        { id: 'REGEN_BRAKING', name: 'Regen Braking Mk II', description: 'Improves energy efficiency by 15%', cost: 5000, icon: Zap },
        { id: 'FAST_DOORS', name: 'High-Speed Doors', description: 'Reduces dwell time by 2s', cost: 3000, icon: Timer },
        { id: 'CROWD_CONTROL', name: 'Station Staff', description: 'Reduces boarding time by 10%', cost: 2000, icon: Users },
    ];

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[600px] shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <ShoppingCart className="text-blue-500" /> Upgrade Shop
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </div>

                <div className="mb-4 p-4 bg-slate-800 rounded-lg flex justify-between items-center">
                    <span className="text-slate-400">Current Budget</span>
                    <span className={`font-mono font-bold text-xl ${budget > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${budget.toFixed(2)}
                    </span>
                </div>

                <div className="grid gap-4">
                    {upgrades.map(upgrade => (
                        <div key={upgrade.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg flex justify-between items-center hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400">
                                    <upgrade.icon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-200">{upgrade.name}</h3>
                                    <p className="text-sm text-slate-400">{upgrade.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onPurchase(upgrade.id, upgrade.cost)}
                                disabled={budget < upgrade.cost}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-bold transition-colors"
                            >
                                Buy ${upgrade.cost}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
