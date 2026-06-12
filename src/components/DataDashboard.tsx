import React from 'react';
import { Database, Server, Activity } from 'lucide-react';

interface DataDashboardProps {
    logs: { id: string, tag: string, value: any, timestamp: number }[];
    anomalies?: { id: string, trainId: string, component: string, severity: number, detected: boolean }[];
    currentStrategy?: 'REACTIVE' | 'PREVENTIVE' | 'PREDICTIVE';
    onClose: () => void;
    onResolveAnomaly?: (id: string) => void;
    onSetStrategy?: (strategy: string) => void;
}

export const DataDashboard: React.FC<DataDashboardProps> = ({ logs, anomalies, currentStrategy, onClose, onResolveAnomaly, onSetStrategy }) => {
    return (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col p-6 font-mono text-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-orange-500 flex items-center gap-2">
                    <Database /> Metro Data Lake <span className="text-xs bg-orange-900/30 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30">DATABRICKS CONNECTED</span>
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Cluster Status */}
                <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                    <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                        <Server size={16} /> Cluster Health
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                            <div className="text-xs text-slate-500">Active Nodes</div>
                            <div className="text-xl font-bold text-green-400">8 / 8</div>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                            <div className="text-xs text-slate-500">Memory Usage</div>
                            <div className="text-xl font-bold text-yellow-400">64%</div>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                            <div className="text-xs text-slate-500">Ingestion Rate</div>
                            <div className="text-xl font-bold text-blue-400">2.4 GB/s</div>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                            <div className="text-xs text-slate-500">Latency</div>
                            <div className="text-xl font-bold text-green-400">12 ms</div>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-950 rounded border border-slate-800 relative overflow-hidden p-2">
                        <div className="absolute inset-0 flex items-end justify-between px-2 pb-2 gap-1 opacity-50">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="w-full bg-blue-500/50 rounded-t" style={{ height: `${30 + Math.random() * 60}%` }}></div>
                            ))}
                        </div>
                        <div className="absolute top-2 left-2 text-xs text-slate-500">Cluster Load (Last 1m)</div>
                    </div>
                </div>

                {/* Live Ingestion Stream */}
                <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-2">
                        <Activity size={16} /> Live Telemetry Stream (Bronze Layer)
                    </h3>
                    <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar bg-black/50 p-2 rounded mb-4 h-1/2">
                        {logs.map(log => (
                            <div key={log.id} className="flex gap-4 border-b border-slate-800/50 pb-0.5 text-slate-300 hover:bg-slate-800/50 transition-colors">
                                <span className="text-slate-500 w-24">{new Date(log.timestamp).toLocaleTimeString()}.{new Date(log.timestamp).getMilliseconds()}</span>
                                <span className="text-blue-400 w-32">{log.tag}</span>
                                <span className="text-green-400">{log.value}</span>
                            </div>
                        ))}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-2">
                        <Activity size={16} /> Predictive Maintenance (Silver Layer)
                    </h3>
                    <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar bg-black/50 p-2 rounded">
                        {anomalies && anomalies.filter(a => a.detected).length === 0 && <div className="text-slate-600 italic">No anomalies detected.</div>}
                        {anomalies && anomalies.filter(a => a.detected).map(anom => (
                            <div key={anom.id} className="flex justify-between items-center bg-slate-900 border border-red-900/30 p-2 rounded">
                                <div>
                                    <span className="text-red-400 font-bold">{anom.trainId}</span>
                                    <span className="text-slate-400 mx-2">|</span>
                                    <span className="text-yellow-400">{anom.component}</span>
                                    <span className="text-slate-500 ml-2">(Severity: {(anom.severity * 100).toFixed(0)}%)</span>
                                </div>
                                <button
                                    onClick={() => onResolveAnomaly && onResolveAnomaly(anom.id)}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs"
                                >
                                    FIX ($100)
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Maintenance Policy Panel */}
            <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                    <h3 className="text-sm font-semibold text-slate-400">Maintenance Strategy</h3>
                    <p className="text-xs text-slate-500">Upgrade to Predictive Maintenance to see anomalies before they fail.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onSetStrategy && onSetStrategy('REACTIVE')}
                        className={`px-4 py-2 rounded text-xs font-bold border ${currentStrategy === 'REACTIVE' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        REACTIVE ($0)
                    </button>
                    <button
                        onClick={() => onSetStrategy && onSetStrategy('PREVENTIVE')}
                        className={`px-4 py-2 rounded text-xs font-bold border ${currentStrategy === 'PREVENTIVE' ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        PREVENTIVE ($500/min)
                    </button>
                    <button
                        onClick={() => onSetStrategy && onSetStrategy('PREDICTIVE')}
                        className={`px-4 py-2 rounded text-xs font-bold border ${currentStrategy === 'PREDICTIVE' ? 'bg-green-900/50 border-green-500 text-green-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        PREDICTIVE ($5k + $100/min)
                    </button>
                </div>
            </div>
        </div>
    );
};
