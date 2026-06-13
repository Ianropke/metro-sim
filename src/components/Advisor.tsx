import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
        const timer = setTimeout(() => setIsVisible(false), 8000); // Auto-hide after 8s
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timer);
        };
    }, [message]);

    if (!isVisible && !message) return null;

    const currentStyle = {
        TUTORIAL: {
            border: 'border-blue-500',
            bubbleBg: 'bg-white text-slate-900',
            titleColor: 'text-blue-600',
            title: 'TUTORIAL / GUIDE',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria',
            avatarBg: 'bg-blue-50 border-blue-500',
            tailBg: 'bg-white',
            tailBorder: 'border-b-2 border-r-2 border-blue-500'
        },
        WARNING: {
            border: 'border-rose-500',
            bubbleBg: 'bg-rose-950 text-rose-100',
            titleColor: 'text-rose-400 font-black animate-pulse',
            title: 'SYSTEM ADVARSEL',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            avatarBg: 'bg-rose-900 border-rose-500',
            tailBg: 'bg-rose-950',
            tailBorder: 'border-b-2 border-r-2 border-rose-500'
        },
        TIP: {
            border: 'border-emerald-500',
            bubbleBg: 'bg-white text-slate-900',
            titleColor: 'text-emerald-600',
            title: 'OPS MANAGER TIP',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Coco',
            avatarBg: 'bg-emerald-50 border-emerald-500',
            tailBg: 'bg-white',
            tailBorder: 'border-b-2 border-r-2 border-emerald-500'
        }
    }[type];

    return (
        <div className={`
            fixed bottom-32 left-8 z-50 max-w-sm w-full
            transition-all duration-500 transform
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}
        `}>
            <div className={`relative p-4 rounded-2xl rounded-bl-none shadow-2xl border-2 flex gap-4 items-start transition-all duration-300 ${currentStyle.bubbleBg} ${currentStyle.border}`}>
                {/* Avatar Icon */}
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 overflow-hidden ${currentStyle.avatarBg}`}>
                    <img
                        src={currentStyle.avatar}
                        alt="Advisor Avatar"
                        className="w-full h-full object-cover"
                    />
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
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={14} />
                </button>

                {/* Speech Bubble Tail */}
                <div className={`absolute -bottom-2 left-0 w-4 h-4 transform rotate-45 translate-x-4 ${currentStyle.tailBg} ${currentStyle.tailBorder}`}></div>
            </div>
        </div>
    );
};
