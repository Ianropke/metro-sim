import React, { useState } from 'react';
import { ChevronRight, Check, Play, Database, ShoppingCart } from 'lucide-react';

interface WelcomeModalProps {
    onStart: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStart }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Welcome to Metro Sim",
            description: "You are now the Chief Operator of a GoA4 Driverless Metro System. Your goal is to manage operations, ensure passenger satisfaction, and maintain financial stability.",
            icon: <Play size={48} className="text-blue-500" />
        },
        {
            title: "Tycoon Mode",
            description: "Earn revenue from ticket sales. Use your budget to buy upgrades in the SHOP and manage your Maintenance Strategy to avoid costly breakdowns.",
            icon: <ShoppingCart size={48} className="text-green-500" />
        },
        {
            title: "Data Intelligence",
            description: "Use the DATA dashboard to monitor telemetry. Upgrade to Predictive Maintenance to detect anomalies before they cause service disruptions.",
            icon: <Database size={48} className="text-orange-500" />
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500"></div>

                <div className="flex flex-col items-center text-center gap-6">
                    <div className="p-6 bg-slate-800/50 rounded-full border border-slate-700 shadow-inner">
                        {steps[step].icon}
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">{steps[step].title}</h2>
                        <p className="text-slate-400 leading-relaxed">{steps[step].description}</p>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`}></div>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            if (step < steps.length - 1) {
                                setStep(step + 1);
                            } else {
                                onStart();
                            }
                        }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {step < steps.length - 1 ? (
                            <>Next <ChevronRight size={20} /></>
                        ) : (
                            <>Start Operations <Check size={20} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
