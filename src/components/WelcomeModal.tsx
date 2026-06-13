import React, { useState } from 'react';
import { ChevronRight, Check, Play, Database, ShoppingCart } from 'lucide-react';

interface WelcomeModalProps {
    onStart: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStart }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Velkommen til Metro Sim",
            description: "Du er nu driftsleder for et fuldautomatisk (GoA4) førerløst metrosystem. Dit mål er at styre driften, sikre passagerernes tilfredshed og opretholde en sund økonomi.",
            icon: <Play size={48} className="text-blue-500" />
        },
        {
            title: "Tycoon & Butik",
            description: "Tjen penge på billetindtægter. Brug dit budget til at købe opgraderinger i butikken (SHOP) og vælg den rette vedligeholdelsesstrategi for at undgå dyre nedbrud.",
            icon: <ShoppingCart size={48} className="text-green-500" />
        },
        {
            title: "Data & Overvågning",
            description: "Brug DATA-dashboardet til at overvåge togenes telemetri. Opgrader til prædiktiv vedligeholdelse for at opdage fejl på motorer, døre og bremser, før de skaber forsinkelser.",
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
                            <>Næste <ChevronRight size={20} /></>
                        ) : (
                            <>Start driften <Check size={20} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
