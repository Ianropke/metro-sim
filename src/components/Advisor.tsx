import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface AdvisorProps {
    message: string;
    type?: 'TUTORIAL' | 'WARNING' | 'TIP';
}

export const Advisor: React.FC<AdvisorProps> = ({ message, type = 'TIP' }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => setIsVisible(false), 8000); // Auto-hide after 8s
        return () => clearTimeout(timer);
    }, [message]);

    if (!isVisible && !message) return null;

    return (
        <div className={`
            fixed bottom-32 left-8 z-50 max-w-sm w-full
            transition-all duration-500 transform
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}
        `}>
            <div className="relative bg-white text-slate-900 p-4 rounded-2xl rounded-bl-none shadow-2xl border-2 border-blue-500 flex gap-4 items-start">
                {/* Avatar Placeholder */}
                <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                        alt="Advisor"
                        className="w-full h-full"
                    />
                </div>

                <div className="flex-1">
                    <h4 className="font-bold text-blue-600 text-xs uppercase tracking-wider mb-1">
                        {type === 'WARNING' ? 'System Alert' : 'Ops Manager'}
                    </h4>
                    <p className="text-sm font-medium leading-relaxed">
                        {message}
                    </p>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="text-slate-400 hover:text-slate-600"
                >
                    <X size={14} />
                </button>

                {/* Speech Bubble Tail */}
                <div className="absolute -bottom-2 left-0 w-4 h-4 bg-white border-b-2 border-r-2 border-blue-500 transform rotate-45 translate-x-4"></div>
            </div>
        </div>
    );
};
