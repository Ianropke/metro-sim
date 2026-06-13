import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

export interface Toast {
    id: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    title: string;
    message: string;
    duration?: number;
}

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    return (
        <div className="flex flex-col-reverse gap-2 pointer-events-none w-full">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Slide in
        requestAnimationFrame(() => setIsVisible(true));

        // Auto dismiss
        const duration = toast.duration || ((toast.type === 'ERROR' || toast.type === 'WARNING') ? 10000 : 6000);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onRemove(toast.id), 300); // Wait for slide out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [toast, onRemove]);

    const getIcon = () => {
        switch (toast.type) {
            case 'ERROR': return <AlertTriangle className="text-rose-500" />;
            case 'WARNING': return <AlertTriangle className="text-amber-500" />;
            case 'SUCCESS': return <CheckCircle className="text-emerald-500" />;
            default: return <Info className="text-blue-500" />;
        }
    };

    const getBorderColor = () => {
        switch (toast.type) {
            case 'ERROR': return 'border-rose-500/50 bg-rose-950/90';
            case 'WARNING': return 'border-amber-500/50 bg-amber-950/90';
            case 'SUCCESS': return 'border-emerald-500/50 bg-emerald-950/90';
            default: return 'border-blue-500/50 bg-slate-900/90';
        }
    };

    return (
        <div
            className={`
                pointer-events-auto w-80 p-4 rounded-xl border backdrop-blur-md shadow-xl 
                flex items-start gap-3 transition-all duration-300 transform
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                ${getBorderColor()}
            `}
        >
            <div className="mt-0.5 shrink-0">{getIcon()}</div>
            <div className="flex-1">
                <h4 className="font-bold text-sm text-white">{toast.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{toast.message}</p>
            </div>
            <button
                onClick={() => { setIsVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
                className="text-slate-400 hover:text-white transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
};
