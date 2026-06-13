import React from 'react';

interface EndGameModalProps {
    status: 'GAME_OVER' | 'VICTORY';
    totalPassengers: number;
    satisfaction: number;
    budget: number;
    onRestart: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({ 
    status, 
    totalPassengers = 0, 
    satisfaction = 0, 
    budget = 0, 
    onRestart 
}) => {
    const isVictory = status === 'VICTORY';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
            <div className={`p-8 rounded-xl max-w-lg w-full text-center border-2 shadow-2xl ${isVictory ? 'border-emerald-500 bg-slate-900/90' : 'border-rose-500 bg-slate-900/90'}`}>
                
                <h1 className={`text-5xl font-black mb-4 tracking-tight ${isVictory ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {isVictory ? 'SEJR!' : 'SPIL SLUT'}
                </h1>
                
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                    {isVictory 
                        ? "Tillykke! Du har låst op for hele netværket, holdt passagererne tilfredse og skabt en velfungerende Metro!"
                        : (budget < 0 
                            ? "Du er gået konkurs! Bestyrelsen har fyret dig som Metro-direktør på grund af massiv gæld."
                            : "Passagererne gjorde oprør! Din 'Satisfaction' rating ramte bunden, og du blev afsat.")
                    }
                </p>

                <div className="bg-slate-950 p-6 rounded-lg mb-8 text-left border border-slate-800">
                    <h3 className="text-slate-400 font-bold uppercase text-sm tracking-wider mb-4 border-b border-slate-800 pb-2">Slutstatistik</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-300">Transporterede passagerer i alt:</span>
                            <span className="font-mono text-emerald-400">{Math.floor(totalPassengers || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-300">Endelig tilfredshed:</span>
                            <span className="font-mono text-blue-400">{(satisfaction || 0).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-300">Slutbudget:</span>
                            <span className={`font-mono ${(budget || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${(budget || 0).toFixed(0)}</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onRestart}
                    className={`w-full py-4 px-6 rounded-lg font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-4 ${
                        isVictory 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500/50' 
                        : 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500/50'
                    }`}
                >
                    {isVictory ? 'Spil igen' : 'Prøv igen'}
                </button>
            </div>
        </div>
    );
};
