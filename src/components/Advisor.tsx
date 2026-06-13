import React, { useState, useEffect } from 'react';
import { X, Bot, AlertTriangle, Lightbulb } from 'lucide-react';

interface AdvisorProps {
    message: string;
    type?: 'TUTORIAL' | 'WARNING' | 'TIP';
}

export const Advisor: React.FC<AdvisorProps> = ({ message, type = 'TIP' }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setIsVisible(true);
        });
        
        let timer: ReturnType<typeof setTimeout> | undefined;
        if (type === 'TIP') {
            timer = setTimeout(() => setIsVisible(false), 8000);
        }
        
        return () => {
            cancelAnimationFrame(frame);
            if (timer) clearTimeout(timer);
        };
    }, [message, type]);

    if (!isVisible || !message) return null;


    const currentStyle = {
        TUTORIAL: {
            border: 'border-l-blue-500',
            titleColor: 'text-blue-400',
            title: 'TUTORIAL / VEJLEDNING',
            icon: <Bot size={20} className="text-blue-400" />,
            avatarBg: 'bg-blue-950/40 border-blue-500/30',
        },
        WARNING: {
            border: 'border-l-rose-500',
            titleColor: 'text-rose-400 font-black',
            title: 'SYSTEM ADVARSEL',
            icon: <AlertTriangle size={20} className="text-rose-400" />,
            avatarBg: 'bg-rose-950/40 border-rose-500/30',
        },
        TIP: {
            border: 'border-l-emerald-500',
            titleColor: 'text-emerald-400',
            title: 'DRIFTSLEDER-TIP',
            icon: <Lightbulb size={20} className="text-emerald-400" />,
            avatarBg: 'bg-emerald-950/40 border-emerald-500/30',
        }
    }[type];

    return (
        <div className={`
            w-full transition-all duration-500 transform
            ${isVisible && message ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}
        `}>
            <div className={`relative p-3.5 rounded-xl shadow-2xl border-l-4 flex gap-3.5 items-start transition-all duration-300 glass-panel ${currentStyle.border}`}>
                {/* Vector Icon Box */}
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${currentStyle.avatarBg}`}>
                    {currentStyle.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-[10px] uppercase tracking-wider mb-0.5 ${currentStyle.titleColor}`}>
                        {currentStyle.title}
                    </h4>
                    <p className="text-[11px] font-semibold leading-relaxed text-slate-200">
                        {message}
                    </p>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="text-slate-400 hover:text-slate-200 transition-colors shrink-0 p-0.5"
                >
                    <X size={12} />
                </button>
            </div>
        </div>
    );
};

