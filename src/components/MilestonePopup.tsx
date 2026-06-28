import React, { useEffect, useState } from 'react';

interface MilestonePopupProps {
    name: string;
    reward: number;
    description: string;
    onDismiss: () => void;
}

export const MilestonePopup: React.FC<MilestonePopupProps> = ({ name, reward, description, onDismiss }) => {
    const [visible, setVisible] = useState(false);
    const [confetti, setConfetti] = useState<{ id: number; x: number; delay: number; color: string; size: number }[]>([]);

    useEffect(() => {
        // Animate in
        setTimeout(() => setVisible(true), 50);

        // Generate confetti particles
        const particles = Array.from({ length: 40 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 0.5,
            color: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'][Math.floor(Math.random() * 6)],
            size: 4 + Math.random() * 8,
        }));
        setConfetti(particles);

        // Auto-dismiss after 6 seconds
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 400);
        }, 6000);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={`fixed inset-0 z-[999] flex items-center justify-center pointer-events-none transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Confetti */}
            {confetti.map(p => (
                <div
                    key={p.id}
                    className="absolute animate-confetti-fall pointer-events-none"
                    style={{
                        left: `${p.x}%`,
                        top: '-5%',
                        animationDelay: `${p.delay}s`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                />
            ))}

            {/* Milestone Card */}
            <div
                className={`pointer-events-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/50 
                    rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-amber-500/10
                    transition-all duration-500 transform
                    ${visible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8'}`}
            >
                {/* Trophy icon */}
                <div className="text-6xl mb-3 animate-bounce">🏆</div>

                {/* Title */}
                <div className="text-amber-400 text-sm font-black uppercase tracking-[0.3em] mb-2">
                    MILEPÆL NÅET
                </div>

                <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                    {name}
                </h2>

                <p className="text-slate-300 text-base mb-6 leading-relaxed">
                    {description}
                </p>

                {/* Reward */}
                {reward > 0 && (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 mb-6 inline-flex items-center gap-3">
                        <span className="text-emerald-400 text-3xl font-black font-mono">
                            +${reward.toLocaleString()}
                        </span>
                        <span className="text-emerald-300/60 text-sm font-bold uppercase">Bonus</span>
                    </div>
                )}

                {/* Dismiss button */}
                <button
                    onClick={() => {
                        setVisible(false);
                        setTimeout(onDismiss, 400);
                    }}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl 
                        uppercase tracking-wider transition-all active:scale-95 text-sm"
                >
                    Fantastisk!
                </button>
            </div>
        </div>
    );
};
