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

    if (!isVisible && !message) return null;

    const currentStyle = {
        TUTORIAL: {
            border: 'border-blue-500/80',
            bubbleBg: 'bg-slate-900/95 text-slate-100 backdrop-blur-md',
            titleColor: 'text-blue-400',
            title: 'TUTORIAL / VEJLEDNING',
            icon: <Bot size={22} className="text-blue-400" />,
            avatarBg: 'bg-blue-950/40 border-blue-500/50',
            tailBg: 'bg-slate-900',
            tailBorder: 'border-b-2 border-r-2 border-blue-500/80'
        },
        WARNING: {
            border: 'border-rose-500/80',
            bubbleBg: 'bg-slate-900/95 text-rose-100 backdrop-blur-md',
            titleColor: 'text-rose-400 font-black animate-pulse',
            title: 'SYSTEM ADVARSEL',
            icon: <AlertTriangle size={22} className="text-rose-400" />,
            avatarBg: 'bg-rose-950/40 border-rose-500/50',
            tailBg: 'bg-slate-900',
            tailBorder: 'border-b-2 border-r-2 border-rose-500/80'
        },
        TIP: {
            border: 'border-emerald-500/80',
            bubbleBg: 'bg-slate-900/95 text-slate-100 backdrop-blur-md',
            titleColor: 'text-emerald-400',
            title: 'DRIFTSLEDER-TIP',
            icon: <Lightbulb size={22} className="text-emerald-400" />,
            avatarBg: 'bg-emerald-950/40 border-emerald-500/50',
            tailBg: 'bg-slate-900',
            tailBorder: 'border-b-2 border-r-2 border-emerald-500/80'
        }
    }[type];

    return (
        <div className={`
            w-full transition-all duration-500 transform
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}
        `}>
            <div className={`relative p-4 rounded-2xl rounded-br-none shadow-2xl border-2 flex gap-4 items-start transition-all duration-300 ${currentStyle.bubbleBg} ${currentStyle.border}`}>
                {/* Vector Icon Box */}
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 ${currentStyle.avatarBg}`}>
                    {currentStyle.icon}
                </div>

                <div className="flex-1">
                    <h4 className={`font-bold text-xs uppercase tracking-wider mb-1 ${currentStyle.titleColor}`}>
                        {currentStyle.title}
                    </h4>
                    <p className="text-sm font-medium leading-relaxed">
                        {message}
                    </p>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                    <X size={14} />
                </button>

                {/* Speech Bubble Tail */}
                <div className={`absolute -bottom-2 right-6 w-4 h-4 transform rotate-45 ${currentStyle.tailBg} ${currentStyle.tailBorder}`}></div>
            </div>
        </div>
    );
};
