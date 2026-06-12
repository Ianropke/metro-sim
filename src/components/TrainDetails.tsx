import React from 'react';
import { Train } from 'lucide-react';

interface TrainDetailsProps {
    train: { id: string, position: number, velocity: number, state: string } | null;
    onClose: () => void;
}

export const TrainDetails: React.FC<TrainDetailsProps> = ({ train, onClose }) => {
    if (!train) return null;

    return (
        <div className="absolute top-20 right-4 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-xl p-4 z-10">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Train className="text-blue-500" /> {train.id}
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-400">State</span>
                    <span className="font-mono text-blue-300">{train.state}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Velocity</span>
                    <span className="font-mono text-slate-200">{(train.velocity * 3.6).toFixed(1)} km/h</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Position</span>
                    <span className="font-mono text-slate-200">{train.position.toFixed(0)} m</span>
                </div>

                {/* Simulated Motor Telemetry */}
                <div className="mt-4 pt-2 border-t border-slate-700">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Motor Telemetry</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-800 p-2 rounded">
                            <div className="text-xs text-slate-500">Voltage</div>
                            <div className="font-mono text-yellow-400">750 V</div>
                        </div>
                        <div className="bg-slate-800 p-2 rounded">
                            <div className="text-xs text-slate-500">Current</div>
                            <div className="font-mono text-blue-400">{(Math.abs(train.velocity) * 10 + 50).toFixed(0)} A</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
